import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { CustomFieldDefinition, FieldType } from './CustomFieldsManager';
import { Trash } from 'lucide-react';

// Field option components
import { SelectFieldOptions } from './field-options/SelectFieldOptions';
import { NumberFieldOptions } from './field-options/NumberFieldOptions';
import { DateFieldOptions } from './field-options/DateFieldOptions';

interface CustomFieldEditorProps {
  field?: CustomFieldDefinition;
  onSave: (field: Partial<CustomFieldDefinition>) => void;
  onCancel: () => void;
}

// Field type-specific option interfaces
interface SelectFieldOptions {
  choices?: { label: string; value: string; }[];
}

interface NumberFieldOptions {
  min?: number;
  max?: number;
  step?: number;
  allowDecimals?: boolean;
}

interface DateFieldOptions {
  minDate?: string;
  maxDate?: string;
  includeTime?: boolean;
}

// Form validation schema
const formSchema = z.object({
  field_name: z.string().min(1, 'Field name is required').max(50),
  field_type: z.enum(['text', 'number', 'date', 'select', 'multi_select', 'boolean', 'user_id']),
  is_required: z.boolean().default(false),
  options: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CustomFieldEditor({ field, onSave, onCancel }: CustomFieldEditorProps) {
  const [fieldType, setFieldType] = useState<FieldType>(field?.field_type || 'text');
  const [options, setOptions] = useState(field?.options || {});

  // Initialize form with existing field values or defaults
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      field_name: field?.field_name || '',
      field_type: field?.field_type || 'text',
      is_required: field?.is_required || false,
      options: field?.options || {},
    },
  });

  const onSubmit = (values: FormValues) => {
    // Combine form values with any field-specific options
    const fieldData = {
      ...values,
      options,
      ...(field && { id: field.id }), // Include ID if editing existing field
    };
    
    onSave(fieldData);
  };

  // Handle field type change
  const handleFieldTypeChange = (type: FieldType) => {
    setFieldType(type);
    form.setValue('field_type', type);
    
    // Reset options when changing field type with type-appropriate defaults
    if (type !== fieldType) {
      let defaultOptions = {};
      
      if (type === 'select' || type === 'multi_select') {
        defaultOptions = { choices: [] };
      } else if (type === 'number') {
        defaultOptions = { step: 1 };
      } else if (type === 'date') {
        defaultOptions = { includeTime: false };
      }
      
      setOptions(defaultOptions);
      form.setValue('options', defaultOptions);
    }
  };

  // Update options in the main form state
  const handleOptionsChange = (newOptions: any) => {
    setOptions(newOptions);
    form.setValue('options', newOptions);
  };

  // Function to render type-specific options
  const renderFieldOptions = () => {
    if (fieldType === 'select' || fieldType === 'multi_select') {
      return (
        <SelectFieldOptions 
          options={options as SelectFieldOptions}
          onChange={handleOptionsChange}
          isMulti={fieldType === 'multi_select'}
        />
      );
    } else if (fieldType === 'number') {
      return (
        <NumberFieldOptions 
          options={options as NumberFieldOptions}
          onChange={handleOptionsChange}
        />
      );
    } else if (fieldType === 'date') {
      return (
        <DateFieldOptions
          options={options as DateFieldOptions}
          onChange={handleOptionsChange}
        />
      );
    }
    return null;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="field_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Field Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Priority, Due Date, Status" {...field} />
                </FormControl>
                <FormDescription>
                  This will be displayed as the field label in forms and tables.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="field_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Field Type</FormLabel>
                <Select 
                  value={field.value} 
                  onValueChange={(value: FieldType) => {
                    field.onChange(value);
                    handleFieldTypeChange(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a field type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="select">Single Select</SelectItem>
                    <SelectItem value="multi_select">Multi Select</SelectItem>
                    <SelectItem value="boolean">Yes/No</SelectItem>
                    <SelectItem value="user_id">Person</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  The type of data this field will store.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_required"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Required Field</FormLabel>
                  <FormDescription>
                    Users will need to provide a value for this field.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Render type-specific configuration options */}
          {renderFieldOptions()}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">
            {field ? 'Update Field' : 'Add Field'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 