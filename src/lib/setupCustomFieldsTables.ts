import { supabase } from './supabaseClient';
import fs from 'fs';
import path from 'path';

export async function setupCustomFieldsTables() {
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'sql', 'create_custom_fields.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL using Supabase
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error setting up custom fields tables:', error);
      return false;
    }
    
    console.log('Custom fields tables created successfully');
    return true;
  } catch (err) {
    console.error('Failed to setup custom fields tables:', err);
    return false;
  }
}

// Auto-execute if run directly
if (require.main === module) {
  setupCustomFieldsTables()
    .then((success) => {
      console.log(success ? 'Setup complete!' : 'Setup failed!');
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Unexpected error:', err);
      process.exit(1);
    });
} 