-- Task Status History table
CREATE TABLE IF NOT EXISTS public.task_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  project_id UUID NOT NULL, -- Store project_id for direct filtering
  status TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by_user_id TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- Enable Row Level Security
ALTER TABLE public.task_status_history ENABLE ROW LEVEL SECURITY;

-- Allow users to view task status history for projects they are members of
CREATE POLICY "Users can view task status history for their projects" ON public.task_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = task_status_history.project_id 
      AND pm.user_id = auth.uid()::TEXT
    )
  );

-- Modify existing records to include project_id (if table already exists)
-- This is safe to run even on an empty table
DO $$
BEGIN
  -- Add project_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'task_status_history' 
    AND column_name = 'project_id'
  ) THEN
    -- Add column if the table exists but lacks project_id
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'task_status_history'
    ) THEN
      ALTER TABLE public.task_status_history ADD COLUMN project_id UUID NOT NULL REFERENCES public.projects(id);
      
      -- Update existing records with project_id from the tasks table
      UPDATE public.task_status_history h
      SET project_id = t.project_id
      FROM public.tasks t
      WHERE h.task_id = t.id;
    END IF;
  END IF;
END $$; 