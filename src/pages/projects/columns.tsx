import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, BarChart } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export type Project = {
  id: string
  name: string
  description: string
  created_at: string
  user_id: string
  [key: string]: any // Allow custom field values
}

type ProjectColumnsProps = {
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

export interface CustomFieldDefinition {
  id: string
  field_name: string
  field_type: string
  options?: any
}

export function useCustomFieldColumns(entityType: 'project' | 'task'): ColumnDef<any, any>[] {
  const [customFieldColumns, setCustomFieldColumns] = useState<ColumnDef<any, any>[]>([])
  
  useEffect(() => {
    async function fetchCustomFields() {
      try {
        // Fetch custom field definitions
        const { data: fields, error } = await supabase
          .from('custom_field_definitions')
          .select('*')
          .eq('entity_type', entityType)
          .eq('project_id', 'global')
          .order('position');
          
        if (error) {
          console.error('Error fetching custom fields:', error);
          return;
        }
        
        // Create columns for each custom field
        const columns = fields.map((field: CustomFieldDefinition) => {
          return {
            id: field.field_name,
            accessorKey: `custom_${field.id}`,
            header: field.field_name,
            cell: ({ row }) => {
              const value = row.original[`custom_${field.id}`];
              if (value === undefined || value === null) return '—';
              
              // Format the value based on field type
              switch(field.field_type) {
                case 'boolean':
                  return value ? 'Yes' : 'No';
                case 'date':
                  return value ? new Date(value).toLocaleDateString() : '—';
                case 'select':
                case 'multi_select':
                  if (Array.isArray(value)) {
                    return value.join(', ');
                  }
                  return String(value || '—');
                default:
                  return String(value || '—');
              }
            }
          } as ColumnDef<any, any>;
        });
        
        setCustomFieldColumns(columns);
      } catch (err) {
        console.error('Error setting up custom field columns:', err);
      }
    }
    
    fetchCustomFields();
  }, [entityType]);
  
  return customFieldColumns;
}

export function getProjectColumns({ onEdit, onDelete }: ProjectColumnsProps): ColumnDef<Project>[] {
  const baseColumns: ColumnDef<Project>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <span className="line-clamp-2 max-w-xs">{String(row.getValue('description') ?? '')}</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => new Date(row.getValue('created_at')).toLocaleString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="default" 
            className="bg-primary"
            asChild
          >
            <Link to={`/projects/${row.original.id}/dashboard`}>
              <BarChart className="h-4 w-4 mr-1" />
              Dashboard
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(row.original)}>Edit</Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(row.original)}>Delete</Button>
        </div>
      ),
    },
  ]
  
  return baseColumns
} 