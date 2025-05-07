-- Create project_members table with TEXT for user_id
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Using TEXT for Clerk user IDs
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Allow users to view project members for projects they belong to
CREATE POLICY "Users can view project members for their projects" ON public.project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id 
      AND pm.user_id = auth.uid()::TEXT
    )
  );

-- Allow users to manage project members for projects they own
CREATE POLICY "Users can manage project members for projects they own" ON public.project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 
      FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id 
      AND pm.user_id = auth.uid()::TEXT
      AND pm.role = 'owner'
    )
  );

-- Insert seed data - make all existing projects accessible to their creators
INSERT INTO public.project_members (project_id, user_id, role)
SELECT id, user_id::TEXT, 'owner'
FROM public.projects
ON CONFLICT (project_id, user_id) DO NOTHING; 