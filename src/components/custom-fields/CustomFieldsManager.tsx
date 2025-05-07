import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { DotsHorizontalIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon } from '@radix-ui/react-icons';
import { Badge } from '@/components/ui/badge';
import { CustomFieldEditor } from './CustomFieldEditor';
import { supabase } from '@/lib/supabaseClient';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PremiumBadge, UpgradeButton } from '@/components/premium';

// Types for our custom fields
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'boolean' | 'user_id';
export type EntityType = 'project' | 'task';

export interface CustomFieldDefinition {
  id: string;
  project_id: string;
  entity_type: EntityType;
  field_name: string;
  field_type: FieldType;
  options?: {
    choices?: {label: string; value: string;}[];
  };
  is_required: boolean;
  position: number;
}

interface CustomFieldsManagerProps {
  projectId: string;
  entityType?: EntityType;
  isPremiumEnabled?: boolean;
}

export function CustomFieldsManager({ 
  projectId, 
  entityType = 'task',
  isPremiumEnabled = false
}: CustomFieldsManagerProps) {
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Maximum number of fields for non-premium users
  const MAX_FREE_FIELDS = 3;
  const isFieldLimitReached = !isPremiumEnabled && fields.length >= MAX_FREE_FIELDS;

  // Load custom field definitions from Supabase
  useEffect(() => {
    async function loadCustomFields() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('custom_field_definitions')
          .select('*')
          .eq('project_id', projectId)
          .eq('entity_type', entityType)
          .order('position');

        if (error) throw error;
        setFields(data || []);
      } catch (err) {
        console.error('Error loading custom fields:', err);
        setError('Failed to load custom fields');
      } finally {
        setIsLoading(false);
      }
    }

    if (projectId) {
      loadCustomFields();
    }
  }, [projectId, entityType]);

  // Save the updated field order after drag and drop
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const reorderedFields = Array.from(fields);
    const [movedItem] = reorderedFields.splice(result.source.index, 1);
    reorderedFields.splice(result.destination.index, 0, movedItem);
    
    // Update positions
    const updatedFields = reorderedFields.map((field, index) => ({
      ...field,
      position: index
    }));
    
    setFields(updatedFields);
    
    // Save the new order to the database
    try {
      for (const field of updatedFields) {
        await supabase
          .from('custom_field_definitions')
          .update({ position: field.position })
          .eq('id', field.id);
      }
    } catch (err) {
      console.error('Error updating field positions:', err);
      setError('Failed to save field order');
    }
  };

  // Delete a custom field definition
  const handleDeleteField = async (fieldId: string) => {
    try {
      const { error } = await supabase
        .from('custom_field_definitions')
        .delete()
        .eq('id', fieldId);
      
      if (error) throw error;
      
      // Remove from local state
      setFields(fields.filter(field => field.id !== fieldId));
    } catch (err) {
      console.error('Error deleting field:', err);
      setError('Failed to delete field');
    }
  };

  // Add or update a custom field
  const handleSaveField = async (field: Partial<CustomFieldDefinition>, isNew = false) => {
    try {
      if (isNew) {
        // Create new field
        const newField = {
          ...field,
          project_id: projectId,
          entity_type: entityType,
          position: fields.length,
          is_required: field.is_required || false
        };
        
        const { data, error } = await supabase
          .from('custom_field_definitions')
          .insert(newField)
          .select();
        
        if (error) throw error;
        if (data) {
          setFields([...fields, data[0]]);
        }
      } else {
        // Update existing field
        const { error } = await supabase
          .from('custom_field_definitions')
          .update(field)
          .eq('id', field.id);
        
        if (error) throw error;
        
        // Update local state
        setFields(fields.map(f => f.id === field.id ? { ...f, ...field } : f));
      }
      
      setIsEditing(null);
      setIsCreating(false);
    } catch (err) {
      console.error('Error saving field:', err);
      setError('Failed to save field');
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading custom fields...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Custom Fields {entityType === 'task' ? 'for Tasks' : 'for Project'}</CardTitle>
            <CardDescription>
              Define additional fields to track information specific to your needs.
              {!isPremiumEnabled && (
                <span className="block mt-1 text-xs text-muted-foreground">
                  Free plan: {fields.length}/{MAX_FREE_FIELDS} fields
                </span>
              )}
            </CardDescription>
          </div>
          {!isPremiumEnabled && fields.length > 0 && (
            <PremiumBadge message="Upgrade for unlimited fields" />
          )}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-2 bg-destructive/10 text-destructive rounded border border-destructive">
            {error}
          </div>
        )}

        {fields.length === 0 && !isCreating ? (
          <div className="text-center p-8 border border-dashed rounded-md">
            <p className="text-muted-foreground mb-4">No custom fields defined yet.</p>
            <Button onClick={() => setIsCreating(true)}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Your First Field
            </Button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="fields-list">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {fields.map((field, index) => (
                    <Draggable key={field.id} draggableId={field.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover:bg-muted"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="capitalize">
                              {field.field_type}
                            </Badge>
                            <span className="font-medium">{field.field_name}</span>
                            {field.is_required && (
                              <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                                Required
                              </Badge>
                            )}
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <DotsHorizontalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setIsEditing(field.id)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteField(field.id)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {(isEditing || isCreating) && (
          <div className="mt-6">
            <Separator className="my-4" />
            <CustomFieldEditor
              field={isEditing ? fields.find(f => f.id === isEditing) : undefined}
              onSave={(field) => handleSaveField(field, isEditing === null)}
              onCancel={() => {
                setIsEditing(null);
                setIsCreating(false);
              }}
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div>
          {fields.length > 0 && !isCreating && !isEditing && (
            <Button
              disabled={isFieldLimitReached}
              onClick={() => setIsCreating(true)}
            >
              <PlusIcon className="mr-2 h-4 w-4" /> Add Field
            </Button>
          )}
        </div>
        
        {isFieldLimitReached && !isPremiumEnabled && (
          <UpgradeButton 
            variant="outline" 
            size="sm" 
          />
        )}
      </CardFooter>
    </Card>
  );
} 