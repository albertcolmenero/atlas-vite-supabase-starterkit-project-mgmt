import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { CalendarIcon, CheckIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { CustomFieldDefinition } from './CustomFieldsManager';
import { useUser } from '@clerk/clerk-react';

interface CustomFieldValue {
  id?: string;
  field_definition_id: string;
  entity_id: string;
  text_value?: string | null;
  number_value?: number | null;
  date_value?: string | null; // ISO date string
  boolean_value?: boolean | null;
  json_value?: any | null;
}

interface CustomFieldsRendererProps {
  entityId: string; // Project or task ID
  entityType: 'project' | 'task';
  projectId: string;
  onChange?: (values: Record<string, any>) => void; // For form integration
  disabled?: boolean;
}

export function CustomFieldsRenderer({
  entityId,
  entityType,
  projectId,
  onChange,
  disabled = false,
}: CustomFieldsRendererProps) {
  const { user } = useUser();
  const [fieldDefinitions, setFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, CustomFieldValue>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load field definitions and values
  useEffect(() => {
    async function loadFieldsAndValues() {
      try {
        if (!user) {
          setFieldDefinitions([]);
          setLoading(false);
          return;
        }
        
        setLoading(true);
        setError(null);

        // First, verify access
        let hasAccess = true;
        if (entityType === 'project' && entityId) {
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('id')
            .eq('id', entityId)
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (projectError || !projectData) {
            // User doesn't have access to this project
            hasAccess = false;
          }
        }
        
        if (!hasAccess) {
          setFieldDefinitions([]);
          setLoading(false);
          return;
        }

        // Check if the created_by_user_id column exists
        const { data: columnExists, error: columnCheckError } = await supabase
          .from('custom_field_definitions')
          .select('created_by_user_id')
          .limit(1);
          
        const hasCreatorColumn = !columnCheckError && 
          columnExists && 
          columnExists.length > 0 && 
          'created_by_user_id' in columnExists[0];

        // Build the query based on whether the column exists
        let query = supabase
          .from('custom_field_definitions')
          .select('*')
          .eq('project_id', projectId)
          .eq('entity_type', entityType);
          
        // Only filter by creator if the column exists
        if (hasCreatorColumn) {
          // Get fields created by this user or default admin
          query = query.or('created_by_user_id.eq.' + user.id + ',created_by_user_id.eq.default_admin,created_by_user_id.is.null');
        }
        
        // Order by position
        query = query.order('position');
        
        const { data: definitions, error: definitionsError } = await query;

        if (definitionsError) throw definitionsError;

        // If no entity ID yet (new project/task), just load definitions
        if (!entityId) {
          setFieldDefinitions(definitions || []);
          setLoading(false);
          return;
        }

        // Fetch field values for this entity
        const { data: values, error: valuesError } = await supabase
          .from('custom_field_values')
          .select('*')
          .in(
            'field_definition_id',
            definitions.map((d) => d.id)
          )
          .eq('entity_id', entityId);

        if (valuesError) throw valuesError;

        // Map values by field_definition_id for easier lookup
        const valuesByFieldId = (values || []).reduce((acc, value) => {
          acc[value.field_definition_id] = value;
          return acc;
        }, {} as Record<string, CustomFieldValue>);

        setFieldDefinitions(definitions || []);
        setFieldValues(valuesByFieldId);
      } catch (err) {
        console.error('Error loading custom fields:', err);
        setError('Could not load custom fields');
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      loadFieldsAndValues();
    }
  }, [entityId, entityType, projectId, user]);

  // Save a field value
  const saveFieldValue = async (
    fieldDefinitionId: string,
    value: any,
    fieldType: string
  ) => {
    if (!entityId) return; // Can't save without an entity ID

    try {
      // Prepare the value object based on field type
      const fieldValue: Partial<CustomFieldValue> = {
        field_definition_id: fieldDefinitionId,
        entity_id: entityId,
      };

      // Set the appropriate value field based on type
      switch (fieldType) {
        case 'text':
        case 'select':
        case 'user_id':
          fieldValue.text_value = value;
          break;
        case 'number':
          fieldValue.number_value = typeof value === 'number' ? value : parseFloat(value);
          break;
        case 'date':
          fieldValue.date_value = value ? new Date(value).toISOString() : null;
          break;
        case 'boolean':
          fieldValue.boolean_value = !!value;
          break;
        case 'multi_select':
          fieldValue.json_value = value;
          break;
      }

      const existingValue = fieldValues[fieldDefinitionId];

      if (existingValue?.id) {
        // Update existing
        await supabase
          .from('custom_field_values')
          .update(fieldValue)
          .eq('id', existingValue.id);
      } else {
        // Create new
        const { data } = await supabase
          .from('custom_field_values')
          .insert(fieldValue)
          .select();

        if (data && data[0]) {
          setFieldValues({
            ...fieldValues,
            [fieldDefinitionId]: data[0] as CustomFieldValue,
          });
        }
      }
    } catch (err) {
      console.error('Error saving field value:', err);
      setError('Failed to save field value');
    }
  };

  // Handle value change (for editing)
  const handleValueChange = (
    fieldDefinitionId: string,
    value: any,
    fieldType: string
  ) => {
    // Update local state
    const updatedValues = {
      ...fieldValues,
      [fieldDefinitionId]: {
        ...(fieldValues[fieldDefinitionId] || {
          field_definition_id: fieldDefinitionId,
          entity_id: entityId,
        }),
      },
    } as Record<string, CustomFieldValue>;

    // Set the appropriate value field based on type
    switch (fieldType) {
      case 'text':
      case 'select':
      case 'user_id':
        updatedValues[fieldDefinitionId].text_value = value;
        break;
      case 'number':
        updatedValues[fieldDefinitionId].number_value = typeof value === 'number' ? value : parseFloat(value);
        break;
      case 'date':
        updatedValues[fieldDefinitionId].date_value = value ? new Date(value).toISOString() : null;
        break;
      case 'boolean':
        updatedValues[fieldDefinitionId].boolean_value = !!value;
        break;
      case 'multi_select':
        updatedValues[fieldDefinitionId].json_value = value;
        break;
    }

    setFieldValues(updatedValues);

    // If editing is enabled, save to database
    if (!disabled) {
      saveFieldValue(fieldDefinitionId, value, fieldType);
    }

    // Call onChange callback if provided (for form integration)
    if (onChange) {
      const formValues = Object.keys(updatedValues).reduce((acc, key) => {
        const fieldDef = fieldDefinitions.find((def) => def.id === key);
        if (fieldDef) {
          const val = updatedValues[key];
          switch (fieldDef.field_type) {
            case 'text':
            case 'select':
            case 'user_id':
              acc[fieldDef.field_name] = val.text_value;
              break;
            case 'number':
              acc[fieldDef.field_name] = val.number_value;
              break;
            case 'date':
              acc[fieldDef.field_name] = val.date_value ? new Date(val.date_value) : null;
              break;
            case 'boolean':
              acc[fieldDef.field_name] = val.boolean_value;
              break;
            case 'multi_select':
              acc[fieldDef.field_name] = val.json_value;
              break;
          }
        }
        return acc;
      }, {} as Record<string, any>);

      onChange(formValues);
    }
  };

  // Get current value for a field
  const getCurrentValue = (fieldDefinition: CustomFieldDefinition) => {
    const value = fieldValues[fieldDefinition.id];
    if (!value) return null;

    switch (fieldDefinition.field_type) {
      case 'text':
      case 'select':
      case 'user_id':
        return value.text_value;
      case 'number':
        return value.number_value;
      case 'date':
        return value.date_value ? new Date(value.date_value) : null;
      case 'boolean':
        return value.boolean_value;
      case 'multi_select':
        return value.json_value;
      default:
        return null;
    }
  };

  // Render field input based on type
  const renderFieldInput = (fieldDefinition: CustomFieldDefinition) => {
    const currentValue = getCurrentValue(fieldDefinition);

    switch (fieldDefinition.field_type) {
      case 'text':
        return (
          <Input
            value={currentValue || ''}
            onChange={(e) =>
              handleValueChange(fieldDefinition.id, e.target.value, fieldDefinition.field_type)
            }
            disabled={disabled}
            placeholder={`Enter ${fieldDefinition.field_name.toLowerCase()}`}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={currentValue || ''}
            onChange={(e) =>
              handleValueChange(
                fieldDefinition.id,
                e.target.value ? parseFloat(e.target.value) : null,
                fieldDefinition.field_type
              )
            }
            disabled={disabled}
            placeholder={`Enter ${fieldDefinition.field_name.toLowerCase()}`}
          />
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !currentValue && 'text-muted-foreground'
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {currentValue ? format(new Date(currentValue), 'PPP') : `Select ${fieldDefinition.field_name.toLowerCase()}`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={currentValue ? new Date(currentValue) : undefined}
                onSelect={(date) =>
                  handleValueChange(fieldDefinition.id, date, fieldDefinition.field_type)
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'select':
        return (
          <Select
            value={currentValue || ''}
            onValueChange={(value) =>
              handleValueChange(fieldDefinition.id, value, fieldDefinition.field_type)
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${fieldDefinition.field_name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {fieldDefinition.options?.choices?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multi_select':
        const selectedValues = (currentValue || []) as string[];
        return (
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={disabled}
                >
                  {selectedValues && selectedValues.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedValues.map((value) => {
                        const option = fieldDefinition.options?.choices?.find((c) => c.value === value);
                        return (
                          <Badge key={value} variant="secondary">
                            {option?.label || value}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      Select {fieldDefinition.field_name.toLowerCase()}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder={`Search ${fieldDefinition.field_name.toLowerCase()}...`} />
                  <CommandEmpty>No options found.</CommandEmpty>
                  <CommandGroup>
                    {fieldDefinition.options?.choices?.map((option) => {
                      const isSelected = selectedValues?.includes(option.value);
                      return (
                        <CommandItem
                          key={option.value}
                          onSelect={() => {
                            const newSelected = isSelected
                              ? selectedValues.filter((val) => val !== option.value)
                              : [...(selectedValues || []), option.value];
                            handleValueChange(
                              fieldDefinition.id,
                              newSelected,
                              fieldDefinition.field_type
                            );
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{option.label}</span>
                            {isSelected && <CheckIcon className="h-4 w-4" />}
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`checkbox-${fieldDefinition.id}`}
              checked={!!currentValue}
              onCheckedChange={(checked) =>
                handleValueChange(fieldDefinition.id, checked, fieldDefinition.field_type)
              }
              disabled={disabled}
            />
            <Label
              htmlFor={`checkbox-${fieldDefinition.id}`}
              className="text-sm text-muted-foreground"
            >
              Yes
            </Label>
          </div>
        );

      case 'user_id':
        // This would ideally use a user picker component
        // For now, we'll use a simple text input as a placeholder
        return (
          <Input
            value={currentValue || ''}
            onChange={(e) =>
              handleValueChange(fieldDefinition.id, e.target.value, fieldDefinition.field_type)
            }
            disabled={disabled}
            placeholder={`Enter user ID for ${fieldDefinition.field_name.toLowerCase()}`}
          />
        );

      default:
        return <div>Unsupported field type: {fieldDefinition.field_type}</div>;
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-sm">Loading custom fields...</div>;
  }

  if (fieldDefinitions.length === 0) {
    return null; // Don't render anything if no custom fields
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-2 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}
      
      {fieldDefinitions.map((fieldDefinition) => (
        <div key={fieldDefinition.id} className="space-y-2">
          <Label 
            htmlFor={`field-${fieldDefinition.id}`}
            className={cn(fieldDefinition.is_required && "after:content-['*'] after:text-destructive after:ml-1")}
          >
            {fieldDefinition.field_name}
          </Label>
          {renderFieldInput(fieldDefinition)}
        </div>
      ))}
    </div>
  );
} 