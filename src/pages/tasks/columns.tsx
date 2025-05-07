import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCustomFieldColumns } from '../projects/columns';

export type Task = {
  id: string;
  project_id: string;
  name: string;
  description: string;
  attachment_url?: string;
  owner_id: string;
  created_at: string;
  status: string;
  project_name?: string;
  [key: string]: any; // Allow custom field values
};

type TaskColumnsProps = {
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  currentUserId?: string;
  currentUserName?: string;
  projectsMap?: Record<string, string>;
};

export function getTaskColumns({ onEdit, onDelete, currentUserId, currentUserName, projectsMap }: TaskColumnsProps): ColumnDef<Task>[] {
  const baseColumns: ColumnDef<Task>[] = [
    {
      accessorKey: 'project_name',
      header: 'Project',
      cell: ({ row }) => {
        const name = row.original.project_name;
        const mapName = projectsMap?.[row.original.project_id];
        return String(name ?? mapName ?? '');
      },
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <span className="line-clamp-2 max-w-xs">{String(row.getValue('description') ?? '')}</span>,
    },
    {
      accessorKey: 'owner_id',
      header: 'Owner',
      cell: ({ row }) => {
        const id = row.getValue('owner_id');
        return <span className="text-xs">{String(id) === currentUserId ? currentUserName : String(id)}</span>;
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => new Date(row.getValue('created_at')).toLocaleString(),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={String(row.getValue('status')) === 'done' ? 'default' : 'outline'}>
          {String(row.getValue('status'))}
        </Badge>
      ),
    },
    {
      accessorKey: 'attachment_url',
      header: 'Attachment',
      cell: ({ row }) => {
        const url = row.getValue('attachment_url');
        return url ? (
          <a
            href={
              String(url).startsWith('http')
                ? String(url)
                : `https://YOUR_SUPABASE_URL/storage/v1/object/public/attachments/${String(url)}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            View
          </a>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(row.original)}>Edit</Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(row.original)}>Delete</Button>
        </div>
      ),
    },
  ];
  
  return baseColumns;
} 