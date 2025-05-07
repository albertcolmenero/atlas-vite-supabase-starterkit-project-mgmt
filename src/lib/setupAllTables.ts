import { setupProjectMembersTable } from './setupDatabase';
import { setupCustomFieldsTables } from './setupCustomFieldsTables';

async function setupAllTables() {
  try {
    console.log('Setting up project_members table...');
    const projectMembersResult = await setupProjectMembersTable();
    
    console.log('Setting up custom fields tables...');
    const customFieldsResult = await setupCustomFieldsTables();
    
    return projectMembersResult && customFieldsResult;
  } catch (err) {
    console.error('Error setting up tables:', err);
    return false;
  }
}

// Auto-execute if run directly
if (require.main === module) {
  setupAllTables()
    .then((success) => {
      console.log(success ? 'All tables setup complete!' : 'Table setup failed!');
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Unexpected error:', err);
      process.exit(1);
    });
} 