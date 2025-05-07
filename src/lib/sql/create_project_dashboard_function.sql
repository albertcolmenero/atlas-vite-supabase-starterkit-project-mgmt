-- Function to get metrics for a specific project
CREATE OR REPLACE FUNCTION get_project_metrics(project_id_param UUID)
RETURNS TABLE (
  total_tasks BIGINT,
  completed_tasks BIGINT,
  open_tasks BIGINT,
  avg_cycle_time FLOAT,
  avg_lead_time FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH task_counts AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'done') AS completed,
      COUNT(*) FILTER (WHERE status != 'done') AS open
    FROM tasks
    WHERE project_id = project_id_param
  ),
  cycle_times AS (
    SELECT
      AVG(
        EXTRACT(EPOCH FROM 
          (SELECT MAX(created_at) 
           FROM task_status_history 
           WHERE task_id = t.id AND status = 'done')
          - 
          (SELECT MIN(created_at) 
           FROM task_status_history 
           WHERE task_id = t.id AND status = 'in-progress')
        ) / 86400.0
      ) AS avg_cycle
    FROM tasks t
    WHERE 
      project_id = project_id_param AND
      EXISTS (SELECT 1 FROM task_status_history WHERE task_id = t.id AND status = 'done') AND
      EXISTS (SELECT 1 FROM task_status_history WHERE task_id = t.id AND status = 'in-progress')
  ),
  lead_times AS (
    SELECT
      AVG(
        EXTRACT(EPOCH FROM 
          (SELECT MAX(created_at) 
           FROM task_status_history 
           WHERE task_id = t.id AND status = 'done')
          - 
          t.created_at
        ) / 86400.0
      ) AS avg_lead
    FROM tasks t
    WHERE 
      project_id = project_id_param AND
      EXISTS (SELECT 1 FROM task_status_history WHERE task_id = t.id AND status = 'done')
  )
  SELECT
    tc.total,
    tc.completed,
    tc.open,
    COALESCE(ct.avg_cycle, 0),
    COALESCE(lt.avg_lead, 0)
  FROM task_counts tc
  CROSS JOIN cycle_times ct
  CROSS JOIN lead_times lt;
END;
$$ LANGUAGE plpgsql;

-- Function to get burndown data for a project
CREATE OR REPLACE FUNCTION get_project_burndown(
  project_id_param UUID,
  days_param INT DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  open_tasks BIGINT,
  created_tasks BIGINT,
  closed_tasks BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      current_date - (days_param || ' days')::interval,
      current_date,
      '1 day'::interval
    )::date AS date
  ),
  daily_task_stats AS (
    SELECT
      d.date,
      COUNT(t.id) FILTER (
        WHERE t.created_at::date <= d.date 
        AND (
          NOT EXISTS (
            SELECT 1 FROM task_status_history 
            WHERE task_id = t.id AND status = 'done' AND created_at::date <= d.date
          )
        )
      ) AS open_tasks,
      COUNT(t.id) FILTER (WHERE t.created_at::date = d.date) AS created_tasks,
      COUNT(DISTINCT tsh.task_id) FILTER (
        WHERE tsh.status = 'done' AND tsh.created_at::date = d.date
      ) AS closed_tasks
    FROM date_series d
    LEFT JOIN tasks t ON t.project_id = project_id_param
    LEFT JOIN task_status_history tsh ON tsh.task_id = t.id AND tsh.project_id = project_id_param
    GROUP BY d.date
  )
  SELECT
    ds.date,
    COALESCE(s.open_tasks, 0) AS open_tasks,
    COALESCE(s.created_tasks, 0) AS created_tasks,
    COALESCE(s.closed_tasks, 0) AS closed_tasks
  FROM date_series ds
  LEFT JOIN daily_task_stats s ON ds.date = s.date
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql;

-- Function to get cycle time distribution for a project
CREATE OR REPLACE FUNCTION get_project_cycle_time_distribution(
  project_id_param UUID
)
RETURNS TABLE (
  category TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH cycle_times AS (
    SELECT
      EXTRACT(EPOCH FROM 
        (SELECT MAX(created_at) 
         FROM task_status_history 
         WHERE task_id = t.id AND status = 'done')
        - 
        (SELECT MIN(created_at) 
         FROM task_status_history 
         WHERE task_id = t.id AND status = 'in-progress')
      ) / 86400.0 AS days
    FROM tasks t
    WHERE 
      project_id = project_id_param AND
      EXISTS (SELECT 1 FROM task_status_history WHERE task_id = t.id AND status = 'done') AND
      EXISTS (SELECT 1 FROM task_status_history WHERE task_id = t.id AND status = 'in-progress')
  )
  SELECT
    category,
    COUNT(*)
  FROM (
    SELECT
      CASE
        WHEN days < 1 THEN '< 1 day'
        WHEN days >= 1 AND days < 3 THEN '1-3 days'
        WHEN days >= 3 AND days < 7 THEN '3-7 days'
        WHEN days >= 7 AND days < 14 THEN '1-2 weeks'
        ELSE '> 2 weeks'
      END AS category
    FROM cycle_times
  ) categorized
  GROUP BY category
  ORDER BY CASE
    WHEN category = '< 1 day' THEN 1
    WHEN category = '1-3 days' THEN 2
    WHEN category = '3-7 days' THEN 3
    WHEN category = '1-2 weeks' THEN 4
    ELSE 5
  END;
END;
$$ LANGUAGE plpgsql; 