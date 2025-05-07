import { supabase } from './supabaseClient';
import fs from 'fs';
import path from 'path';

export async function setupProjectMembersTable() {
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'sql', 'create_project_members.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL using Supabase
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error setting up database:', error);
      return false;
    }
    
    console.log('Database setup completed successfully');
    return true;
  } catch (err) {
    console.error('Failed to setup database:', err);
    return false;
  }
}

// Auto-execute if run directly
if (require.main === module) {
  setupProjectMembersTable()
    .then((success) => {
      console.log(success ? 'Setup complete!' : 'Setup failed!');
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Unexpected error:', err);
      process.exit(1);
    });
} 