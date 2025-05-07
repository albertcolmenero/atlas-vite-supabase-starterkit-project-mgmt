-- Add created_by_user_id column to custom_field_definitions table
ALTER TABLE custom_field_definitions 
ADD COLUMN IF NOT EXISTS created_by_user_id TEXT;

-- Set existing fields to have the default Clerk user ID
-- This will make existing fields visible to all users until properly updated
UPDATE custom_field_definitions
SET created_by_user_id = 'default_admin'
WHERE created_by_user_id IS NULL;

-- Add index to improve query performance when filtering by creator
CREATE INDEX IF NOT EXISTS idx_custom_fields_creator 
ON custom_field_definitions(created_by_user_id); 