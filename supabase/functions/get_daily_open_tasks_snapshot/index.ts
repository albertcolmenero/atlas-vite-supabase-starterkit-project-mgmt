// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Get Daily Open Tasks Snapshot function initialized');

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { startDate, endDate } = await req.json();
    if (!startDate || !endDate) {
      throw new Error('Missing startDate or endDate parameters');
    }

    // Ensure Supabase URL and service_role key are set as environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    console.log(`Fetching open tasks snapshot from ${startDate} to ${endDate}`);

    // Generate a series of dates (PostgreSQL specific query)
    // This query will create a calendar of dates within the range.
    // Then, for each date, it finds the last known status of each task up to that date.
    // Finally, it counts how many of those last known statuses were not 'done'.
    const { data, error } = await supabaseAdmin.rpc('get_daily_open_tasks_count', {
      start_date_param: startDate,
      end_date_param: endDate,
    });

    if (error) {
      console.error('Error from RPC:', error);
      throw error;
    }

    console.log('Snapshot data received:', data);

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    console.error('Error invoking function:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400, // or 500 for server errors
      }
    );
  }
});

/* 
  Placeholder for the PostgreSQL function `get_daily_open_tasks_count`
  You will need to create this function in your Supabase SQL Editor.

  Example SQL (Conceptual - needs to be adapted and tested for your specific schema and needs):

  CREATE OR REPLACE FUNCTION get_daily_open_tasks_count(start_date_param DATE, end_date_param DATE)
  RETURNS TABLE(report_date DATE, open_tasks_count BIGINT) AS $$
  BEGIN
    RETURN QUERY
    WITH date_series AS (
      SELECT generate_series(start_date_param, end_date_param, '1 day'::interval)::DATE AS d
    ),
    last_known_status_per_day AS (
      SELECT
        ds.d AS report_date,
        th.task_id,
        th.status,
        ROW_NUMBER() OVER (PARTITION BY ds.d, th.task_id ORDER BY th.changed_at DESC) as rn
      FROM date_series ds
      CROSS JOIN public.tasks t -- Get all tasks to consider for each day
      LEFT JOIN public.task_status_history th 
        ON th.task_id = t.id AND th.changed_at <= (ds.d + '1 day'::interval - '1 second'::interval) -- status up to end of report_date
      WHERE t.created_at <= (ds.d + '1 day'::interval - '1 second'::interval) -- task must exist on or before report_date
    )
    SELECT 
      lks.report_date,
      COUNT(DISTINCT CASE WHEN lks.status <> 'done' THEN lks.task_id ELSE NULL END) as open_tasks_count
    FROM last_known_status_per_day lks
    WHERE lks.rn = 1 OR lks.status IS NULL -- if no status history, assume it's open if created (status IS NULL means no history entries before or on ds.d for that task)
                                        -- A task with no history entries *at all* by ds.d but created before ds.d implies it starts in an initial open state.
                                        -- However, if your app *always* creates an initial status history entry, this (OR lks.status IS NULL) might not be needed for tasks with history.
                                        -- If a task is created and immediately closed on the same day, lks.status would be 'done' and rn=1, so it won't be counted as open.
    GROUP BY lks.report_date
    ORDER BY lks.report_date
  END;
  $$ LANGUAGE plpgsql;

*/

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get_daily_open_tasks_snapshot' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
