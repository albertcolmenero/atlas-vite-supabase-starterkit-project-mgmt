### SQL Schema (PostgreSQL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- This field now primarily indicates the original creator
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) -- Foreign key to the original creator
);

-- project_members table
CREATE TABLE public.project_members (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- Custom field definitions table
CREATE TABLE public.custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'task')),
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'multi_select', 'boolean', 'user_id')),
  options JSONB, -- For select/multi_select types
  is_required BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0, -- For ordering fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, entity_type, field_name) -- Prevent duplicate field names per project/entity type
);

-- Custom field values table
CREATE TABLE public.custom_field_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_definition_id UUID NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL, -- ID of the project or task
  text_value TEXT,
  number_value DECIMAL,
  date_value TIMESTAMPTZ,
  boolean_value BOOLEAN,
  json_value JSONB, -- For multi_select and other complex types
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure only one value per entity per field definition
  UNIQUE (field_definition_id, entity_id)
);

-- Function to add project creator to project_members
CREATE OR REPLACE FUNCTION public.handle_new_project_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a new project is inserted
CREATE TRIGGER on_new_project_add_owner
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_project_member();

-- waitlist table
CREATE TABLE public.waitlist (
// ... existing code ...
-- newsletter subscriptions table
CREATE TABLE public.newsletter_subscriptions (
// ... existing code ...
-- Row-Level Security
-- Drop the old policy for projects if it exists, before creating new ones.
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their projects" ON public.projects;

CREATE POLICY "Authenticated users can create projects" ON public.projects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view projects they are members of" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = projects.id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their projects" ON public.projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = projects.id AND pm.user_id = auth.uid() AND pm.role = 'owner'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = projects.id AND pm.user_id = auth.uid() AND pm.role = 'owner'
    )
  );

CREATE POLICY "Owners can delete their projects" ON public.projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = projects.id AND pm.user_id = auth.uid() AND pm.role = 'owner'
    )
  );

-- Row-Level Security for project_members
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view memberships of projects they belong to" ON public.project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.project_members pm_self
      WHERE pm_self.project_id = project_members.project_id AND pm_self.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage project members" ON public.project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.project_members pm_owner
      WHERE pm_owner.project_id = project_members.project_id
        AND pm_owner.user_id = auth.uid()
        AND pm_owner.role = 'owner'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.project_members pm_owner
      WHERE pm_owner.project_id = project_members.project_id
        AND pm_owner.user_id = auth.uid()
        AND pm_owner.role = 'owner'
    )
  );

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anyone to sign up" ON public.waitlist
// ... existing code ...
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anyone to subscribe" ON public.newsletter_subscriptions
// ... existing code ...

-- RLS Policies for custom_field_definitions
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

-- Users can view custom field definitions for projects they're members of
CREATE POLICY "Users can view custom field definitions for their projects" ON public.custom_field_definitions
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = custom_field_definitions.project_id AND pm.user_id = auth.uid()
    )
  );

-- Only owners and editors can manage custom field definitions
CREATE POLICY "Owners and editors can manage custom field definitions" ON public.custom_field_definitions
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = custom_field_definitions.project_id 
        AND pm.user_id = auth.uid() 
        AND pm.role IN ('owner', 'editor')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = custom_field_definitions.project_id 
        AND pm.user_id = auth.uid() 
        AND pm.role IN ('owner', 'editor')
    )
  );

-- RLS Policies for custom_field_values
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

-- Users can view custom field values for entities in projects they're members of
CREATE POLICY "Users can view custom field values for their projects" ON public.custom_field_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.custom_field_definitions cfd
      JOIN public.project_members pm ON cfd.project_id = pm.project_id
      WHERE cfd.id = custom_field_values.field_definition_id
        AND pm.user_id = auth.uid()
    )
  );

-- Owners and editors can manage custom field values
CREATE POLICY "Owners and editors can manage custom field values" ON public.custom_field_values
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.custom_field_definitions cfd
      JOIN public.project_members pm ON cfd.project_id = pm.project_id
      WHERE cfd.id = custom_field_values.field_definition_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'editor')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.custom_field_definitions cfd
      JOIN public.project_members pm ON cfd.project_id = pm.project_id
      WHERE cfd.id = custom_field_values.field_definition_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'editor')
    )
  );
``` 

## 4. API Design and Endpoints
// ... existing code ... 

### Human-Readable Schema

1.  **users** (managed by Clerk)
    - id: unique identifier (UUID)
    - email, name, profile info (handled by Clerk)

2.  **projects**
    - id: UUID (Primary Key)
    - user_id: UUID (references auth.users.id, indicates the original creator)
    - name: text (not null)
    - description: text
    - status: text (e.g., 'active', 'archived', default: 'active')
    - created_at, updated_at: timestamps

3.  **project_members**
    - project_id: UUID (references projects.id, part of Primary Key)
    - user_id: UUID (references auth.users.id, part of Primary Key)
    - role: text (e.g., 'owner', 'editor', 'viewer', not null, CHECK constraint enforced)
    - created_at: timestamp

4.  **waitlist** (renumbered)
    - id: serial (Primary Key)
    - email: text (not null, unique)
    - created_at: timestamp

5.  **newsletter_subscriptions** (renumbered)
    - id: serial (Primary Key)
    - email: text (not null, unique)
    - subscribed_at: timestamp

6.  **custom_field_definitions**
    - id: UUID (Primary Key)
    - project_id: UUID (references projects.id, nullable for global fields)
    - entity_type: text ('project' or 'task')
    - field_name: text (unique per project/entity type)
    - field_type: text ('text', 'number', 'date', 'select', 'multi_select', 'boolean', 'user_id')
    - options: JSONB (for select/multi_select types)
    - is_required: boolean
    - position: integer (for ordering)
    - created_at, updated_at: timestamps

7.  **custom_field_values**
    - id: UUID (Primary Key)
    - field_definition_id: UUID (references custom_field_definitions.id)
    - entity_id: UUID (ID of the project or task)
    - text_value: text (for text and select types)
    - number_value: decimal (for number types)
    - date_value: timestamp (for date types)
    - boolean_value: boolean (for boolean types)
    - json_value: JSONB (for multi_select and complex types)
    - created_at, updated_at: timestamps

### SQL Schema (PostgreSQL)
// ... existing code ...