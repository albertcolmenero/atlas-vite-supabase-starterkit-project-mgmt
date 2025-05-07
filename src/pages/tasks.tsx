import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '@clerk/clerk-react';
import { getTaskColumns, Task } from './tasks/columns';
import { DataTable } from './projects/data-table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CustomFieldsRenderer } from '@/components/custom-fields/CustomFieldsRenderer';
import { Separator } from '@/components/ui/separator';
import { useCustomFieldColumns } from './projects/columns';
import { ColumnDef } from '@tanstack/react-table';

export default function TasksPage() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [form, setForm] = useState({ project_id: '', name: '', description: '', status: 'to do', attachment: undefined as File | undefined, id: '' });
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  // Get custom field columns
  const customFieldColumns = useCustomFieldColumns('task');

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    // eslint-disable-next-line
  }, [user]);

  async function fetchTasks() {
    setLoading(true);
    
    try {
      if (!user) {
        setTasks([]);
        setLoading(false);
        return;
      }
      
      // First fetch projects belonging to the current user
      const { data: userProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id);
      
      if (projectsError) {
        console.error('Error fetching user projects:', projectsError);
        setTasks([]);
        setLoading(false);
        return;
      }
      
      if (!userProjects || userProjects.length === 0) {
        setTasks([]);
        setLoading(false);
        return;
      }
      
      // Get project IDs
      const projectIds = userProjects.map(p => p.id);
      
      // Fetch tasks with project info for user's projects
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*, projects(name)')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });
        
      if (tasksError) throw tasksError;
      
      if (!tasksData) {
        setTasks([]);
        setLoading(false);
        return;
      }
      
      // Format tasks data
      const formattedTasks = tasksData.map((t: any) => ({ 
        ...t, 
        project_name: t.projects?.name || '' 
      }));
      
      // Fetch all custom field definitions
      const { data: columnExists, error: columnCheckError } = await supabase
        .from('custom_field_definitions')
        .select('created_by_user_id')
        .limit(1);
          
      const hasCreatorColumn = !columnCheckError && 
        columnExists && 
        columnExists.length > 0 && 
        'created_by_user_id' in columnExists[0];

      // Build the query for custom field definitions
      let query = supabase
        .from('custom_field_definitions')
        .select('*')
        .eq('entity_type', 'task')
        .eq('project_id', 'global');
          
      // Only filter by creator if the column exists
      if (hasCreatorColumn) {
        // Get fields created by this user or default admin
        query = query.or('created_by_user_id.eq.' + user.id + ',created_by_user_id.eq.default_admin,created_by_user_id.is.null');
      }

      const { data: fieldDefinitions, error: fieldDefError } = await query;
      
      if (fieldDefError) {
        console.error('Error fetching field definitions:', fieldDefError);
        setTasks(formattedTasks);
        setLoading(false);
        return;
      }
      
      // If we have custom fields defined, fetch their values for all tasks
      if (fieldDefinitions && fieldDefinitions.length > 0) {
        const taskIds = formattedTasks.map(t => t.id);
        
        // Fetch all field values for these tasks
        const { data: fieldValues, error: fieldValuesError } = await supabase
          .from('custom_field_values')
          .select('*')
          .in('entity_id', taskIds)
          .in(
            'field_definition_id', 
            fieldDefinitions.map(def => def.id)
          );
        
        if (fieldValuesError) {
          console.error('Error fetching field values:', fieldValuesError);
          setTasks(formattedTasks);
          setLoading(false);
          return;
        }
        
        // Map field values to their respective tasks
        const tasksWithCustomFields = formattedTasks.map(task => {
          const taskCustomFields = fieldValues
            ? fieldValues.filter(v => v.entity_id === task.id)
            : [];
          
          // Create a map of custom field values for this task
          const customFields: Record<string, any> = {};
          
          taskCustomFields.forEach(fieldValue => {
            const fieldDef = fieldDefinitions.find(def => def.id === fieldValue.field_definition_id);
            if (!fieldDef) return;
            
            const fieldId = `custom_${fieldValue.field_definition_id}`;
            
            // Extract the value based on field type
            switch (fieldDef.field_type) {
              case 'text':
              case 'select':
              case 'user_id':
                customFields[fieldId] = fieldValue.text_value;
                break;
              case 'number':
                customFields[fieldId] = fieldValue.number_value;
                break;
              case 'date':
                customFields[fieldId] = fieldValue.date_value;
                break;
              case 'boolean':
                customFields[fieldId] = fieldValue.boolean_value;
                break;
              case 'multi_select':
                customFields[fieldId] = fieldValue.json_value;
                break;
            }
          });
          
          // Return task with custom fields
          return {
            ...task,
            ...customFields
          };
        });
        
        setTasks(tasksWithCustomFields);
      } else {
        setTasks(formattedTasks);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProjects() {
    if (!user) {
      setProjects([]);
      return;
    }
    
    const { data, error } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', user.id);
    
    if (!error && data) setProjects(data);
  }

  function openAdd() {
    setForm({ project_id: '', name: '', description: '', status: 'to do', attachment: undefined, id: '' });
    setEditMode(false);
    setShowSheet(true);
    setError(null);
    setCustomFieldValues({});
  }

  function openEdit(task: Task) {
    setForm({
      id: task.id,
      project_id: task.project_id,
      name: task.name,
      description: task.description || '',
      status: task.status,
      attachment: undefined
    });
    setEditMode(true);
    setShowSheet(true);
    setError(null);
    setCustomFieldValues({});
  }

  async function handleDelete(task: Task) {
    if (window.confirm(`Are you sure you want to delete "${task.name}"?`)) {
      await supabase.from('tasks').delete().eq('id', task.id);
      fetchTasks();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('User not found. Please sign in again.');
      return;
    }

    if (!form.project_id) {
      setError('Please select a project');
      return;
    }

    try {
      // Handle file upload
      let attachment_url = '';
      if (form.attachment) {
        const fileExt = form.attachment.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(fileName, form.attachment);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          setError('Failed to upload attachment');
          return;
        }

        attachment_url = fileName;
      }

      let taskId = form.id;

      if (editMode) {
        // Extract the update payload
        const updatePayload: { [key: string]: any } = {
          name: form.name,
          description: form.description,
          status: form.status,
          project_id: form.project_id,
        };

        // Only include attachment if a new one was uploaded
        if (attachment_url) {
          updatePayload.attachment_url = attachment_url;
        }

        const { error: updateError } = await supabase
          .from('tasks')
          .update(updatePayload)
          .eq('id', form.id);

        if (updateError) {
          setError('Failed to update task: ' + updateError.message);
          return;
        }

        // Log status change if the status was changed
        const { data: taskData } = await supabase
          .from('tasks')
          .select('status')
          .eq('id', form.id)
          .single();

        if (taskData && taskData.status !== form.status) {
          const { error: historyError } = await supabase
            .from('task_status_history')
            .insert({
              task_id: form.id,
              project_id: form.project_id,
              status: form.status,
              changed_by_user_id: user.id,
            });

          if (historyError) {
            console.error('Failed to log status change:', historyError.message);
            // Non-critical, so we don't block UI, but log it
          }
        }
      } else {
        const { data: insertData, error: insertError } = await supabase.from('tasks').insert({
          project_id: form.project_id,
          name: form.name,
          description: form.description,
          status: form.status,
          attachment_url,
          owner_id: user.id,
        }).select(); // Important: .select() to get the inserted row back, especially the ID

        if (insertError) {
          setError('Failed to create task: ' + insertError.message);
          return;
        }

        if (insertData && insertData.length > 0) {
          taskId = insertData[0].id;
          const { error: historyError } = await supabase.from('task_status_history').insert({
            task_id: taskId,
            project_id: form.project_id,
            status: form.status,
            changed_by_user_id: user.id,
          });
          
          if (historyError) {
            console.error('Failed to log initial status:', historyError.message);
            // Non-critical, so we don't block UI, but log it
          }
        }
      }
      
      setShowSheet(false);
      fetchTasks();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  }

  const projectsMap = Object.fromEntries(projects.map(p => [p.id, p.name]));
  const baseColumns = getTaskColumns({
    onEdit: openEdit,
    onDelete: handleDelete,
    currentUserId: user?.id ?? undefined,
    currentUserName: user?.fullName ?? undefined,
    projectsMap,
  });
  
  // Combine base columns with custom field columns
  const columns = useMemo(() => {
    return [...baseColumns, ...(customFieldColumns as ColumnDef<Task, any>[])];
  }, [baseColumns, customFieldColumns]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <Sheet open={showSheet} onOpenChange={setShowSheet}>
          <SheetTrigger asChild>
            <Button onClick={openAdd}>Add Task</Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editMode ? 'Edit Task' : 'Add Task'}</SheetTitle>
              <SheetDescription>
                {editMode ? 'Update the details and save changes.' : 'Fill in the details to create a new task.'}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
              <Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                required
                placeholder="Task Name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <Textarea
                placeholder="Description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
              <Input
                type="file"
                accept="*"
                onChange={e => setForm(f => ({ ...f, attachment: e.target.files?.[0] }))}
              />
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to do">To Do</SelectItem>
                  <SelectItem value="working">Working</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Custom Fields Section */}
              {(editMode || form.project_id) && (
                <>
                  <Separator className="my-2" />
                  <h3 className="text-sm font-medium">Custom Fields</h3>
                  
                  <CustomFieldsRenderer 
                    entityId={form.id}
                    entityType="task"
                    projectId="global"
                    onChange={setCustomFieldValues}
                    disabled={false}
                  />
                </>
              )}
              
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div className="flex gap-2 mt-2">
                <Button type="submit">{editMode ? 'Save Changes' : 'Add Task'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowSheet(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <DataTable columns={columns} data={tasks} />
      )}
    </div>
  );
} 