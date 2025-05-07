-- Custom field definitions table
CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT DEFAULT 'global', -- We'll use 'global' for fields that apply to all projects
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
CREATE TABLE IF NOT EXISTS public.custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Enable Row Level Security
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

-- Everyone can view custom field definitions
CREATE POLICY "Anyone can view custom field definitions" ON public.custom_field_definitions
  FOR SELECT USING (true);

-- Authenticated users can manage custom field definitions
CREATE POLICY "Authenticated users can manage custom field definitions" ON public.custom_field_definitions
  FOR ALL USING (auth.role() = 'authenticated');

-- Everyone can view custom field values
CREATE POLICY "Anyone can view custom field values" ON public.custom_field_values
  FOR SELECT USING (true);

-- Authenticated users can manage custom field values
CREATE POLICY "Authenticated users can manage custom field values" ON public.custom_field_values
  FOR ALL USING (auth.role() = 'authenticated'); 