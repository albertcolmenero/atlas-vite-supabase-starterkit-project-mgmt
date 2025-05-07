-- Function to calculate project-specific metrics
CREATE OR REPLACE FUNCTION public.get_project_metrics(project_id_param UUID)
RETURNS TABLE(
  total_tasks BIGINT,
  completed_tasks BIGINT,
  open_tasks BIGINT,
  avg_cycle_time NUMERIC,
  avg_lead_time NUMERIC
) AS $$
DECLARE
  task_count BIGINT;
  completed_count BIGINT;
  cycle_time_avg NUMERIC;
  lead_time_avg NUMERIC;
BEGIN
  -- Count total tasks
  SELECT COUNT(*) INTO task_count
  FROM public.tasks
  WHERE project_id = project_id_param;

  -- Count completed tasks
  SELECT COUNT(*) INTO completed_count
  FROM public.tasks
  WHERE project_id = project_id_param AND status = 'done';

  -- Calculate average cycle time (working to done)
  SELECT AVG(
    EXTRACT(EPOCH FROM (done_status.changed_at - working_status.changed_at)) / 86400 -- Convert seconds to days
  ) INTO cycle_time_avg
  FROM public.tasks t
  -- Join to get first 'working' status for each task
  JOIN LATERAL (
    SELECT changed_at
    FROM public.task_status_history
    WHERE task_id = t.id AND status = 'working'
    ORDER BY changed_at ASC
    LIMIT 1
  ) working_status ON true
  -- Join to get last 'done' status for each task
  JOIN LATERAL (
    SELECT changed_at
    FROM public.task_status_history
    WHERE task_id = t.id AND status = 'done'
    ORDER BY changed_at DESC
    LIMIT 1
  ) done_status ON true
  WHERE t.project_id = project_id_param
  AND t.status = 'done';

  -- Calculate average lead time (created to done)
  SELECT AVG(
    EXTRACT(EPOCH FROM (done_status.changed_at - t.created_at)) / 86400 -- Convert seconds to days
  ) INTO lead_time_avg
  FROM public.tasks t
  -- Join to get last 'done' status for each task
  JOIN LATERAL (
    SELECT changed_at
    FROM public.task_status_history
    WHERE task_id = t.id AND status = 'done'
    ORDER BY changed_at DESC
    LIMIT 1
  ) done_status ON true
  WHERE t.project_id = project_id_param
  AND t.status = 'done';

  -- Return the results
  RETURN QUERY SELECT 
    task_count AS total_tasks,
    completed_count AS completed_tasks,
    (task_count - completed_count) AS open_tasks,
    COALESCE(cycle_time_avg, 0) AS avg_cycle_time,
    COALESCE(lead_time_avg, 0) AS avg_lead_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get daily burn-down data (open tasks per day) for a specific project
CREATE OR REPLACE FUNCTION public.get_project_burndown(
  project_id_param UUID,
  days_param INTEGER DEFAULT 30
)
RETURNS TABLE(
  report_date DATE,
  open_tasks_count BIGINT,
  created_tasks_count BIGINT,
  closed_tasks_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      current_date - (days_param || ' days')::interval,
      current_date,
      '1 day'::interval
    )::DATE AS d
  ),
  -- For each day, find tasks that were open
  daily_open_tasks AS (
    SELECT
      ds.d AS report_date,
      COUNT(DISTINCT t.id) FILTER (
        WHERE t.created_at <= (ds.d + '1 day'::interval - '1 second'::interval)
        AND (
          -- Either no status history on or before this day
          NOT EXISTS (
            SELECT 1 FROM public.task_status_history th
            WHERE th.task_id = t.id
            AND th.changed_at <= (ds.d + '1 day'::interval - '1 second'::interval)
          )
          -- Or the latest status on or before this day wasn't 'done'
          OR EXISTS (
            SELECT 1 FROM public.task_status_history th
            WHERE th.task_id = t.id
            AND th.changed_at <= (ds.d + '1 day'::interval - '1 second'::interval)
            AND th.status <> 'done'
            AND th.changed_at = (
              SELECT MAX(th2.changed_at)
              FROM public.task_status_history th2
              WHERE th2.task_id = th.task_id
              AND th2.changed_at <= (ds.d + '1 day'::interval - '1 second'::interval)
            )
          )
        )
      ) AS open_count
    FROM date_series ds
    CROSS JOIN public.tasks t
    WHERE t.project_id = project_id_param
    GROUP BY ds.d
  ),
  -- For each day, count tasks created (first to do status)
  daily_created_tasks AS (
    SELECT
      ds.d AS report_date,
      COUNT(DISTINCT t.id) FILTER (
        WHERE date_trunc('day', t.created_at)::date = ds.d
      ) AS created_count
    FROM date_series ds
    CROSS JOIN public.tasks t
    WHERE t.project_id = project_id_param
    GROUP BY ds.d
  ),
  -- For each day, count tasks closed (first done status)
  daily_closed_tasks AS (
    SELECT
      ds.d AS report_date,
      COUNT(DISTINCT th.task_id) FILTER (
        WHERE th.status = 'done'
        AND date_trunc('day', th.changed_at)::date = ds.d
        AND NOT EXISTS (
          SELECT 1 FROM public.task_status_history th2
          WHERE th2.task_id = th.task_id
          AND th2.status = 'done'
          AND th2.changed_at < th.changed_at
        )
      ) AS closed_count
    FROM date_series ds
    CROSS JOIN public.task_status_history th
    JOIN public.tasks t ON th.task_id = t.id
    WHERE t.project_id = project_id_param
    GROUP BY ds.d
  )
  -- Combine all the daily metrics
  SELECT
    ds.d AS report_date,
    COALESCE(dot.open_count, 0) AS open_tasks_count,
    COALESCE(dct.created_count, 0) AS created_tasks_count,
    COALESCE(dclt.closed_count, 0) AS closed_tasks_count
  FROM date_series ds
  LEFT JOIN daily_open_tasks dot ON ds.d = dot.report_date
  LEFT JOIN daily_created_tasks dct ON ds.d = dct.report_date
  LEFT JOIN daily_closed_tasks dclt ON ds.d = dclt.report_date
  ORDER BY ds.d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get cycle time distribution for a project
CREATE OR REPLACE FUNCTION public.get_project_cycle_time_distribution(project_id_param UUID)
RETURNS TABLE(
  cycle_time_days INTEGER,
  task_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH cycle_times AS (
    SELECT
      t.id AS task_id,
      EXTRACT(EPOCH FROM (done_status.changed_at - working_status.changed_at)) / 86400 AS cycle_time_days
    FROM public.tasks t
    -- Join to get first 'working' status for each task
    JOIN LATERAL (
      SELECT changed_at
      FROM public.task_status_history
      WHERE task_id = t.id AND status = 'working'
      ORDER BY changed_at ASC
      LIMIT 1
    ) working_status ON true
    -- Join to get last 'done' status for each task
    JOIN LATERAL (
      SELECT changed_at
      FROM public.task_status_history
      WHERE task_id = t.id AND status = 'done'
      ORDER BY changed_at DESC
      LIMIT 1
    ) done_status ON true
    WHERE t.project_id = project_id_param
    AND t.status = 'done'
  )
  SELECT
    FLOOR(cycle_time_days)::INTEGER AS cycle_time_days,
    COUNT(*) AS task_count
  FROM cycle_times
  GROUP BY FLOOR(cycle_time_days)::INTEGER
  ORDER BY cycle_time_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 