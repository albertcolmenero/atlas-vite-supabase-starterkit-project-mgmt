import { Input } from '@/components/ui/input';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';

interface NumberFieldOptionsProps {
  options?: {
    min?: number;
    max?: number;
    step?: number;
    allowDecimals?: boolean;
  };
  onChange: (options: any) => void;
  disabled?: boolean;
}

export function NumberFieldOptions({ options = {}, onChange, disabled = false }: NumberFieldOptionsProps) {
  const form = useForm({
    defaultValues: {
      min: options.min !== undefined ? options.min : '',
      max: options.max !== undefined ? options.max : '',
      step: options.step !== undefined ? options.step : 1,
      allowDecimals: options.allowDecimals !== undefined ? options.allowDecimals : false,
    }
  });

  const handleInputChange = (field: string, value: any) => {
    const newOptions = { ...options, [field]: value };
    onChange(newOptions);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormItem>
          <FormLabel>Minimum Value</FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder="Optional"
              value={form.watch('min')}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : undefined;
                form.setValue('min', value || '');
                handleInputChange('min', value);
              }}
              disabled={disabled}
            />
          </FormControl>
          <FormDescription>Lowest allowed value</FormDescription>
        </FormItem>

        <FormItem>
          <FormLabel>Maximum Value</FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder="Optional"
              value={form.watch('max')}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : undefined;
                form.setValue('max', value || '');
                handleInputChange('max', value);
              }}
              disabled={disabled}
            />
          </FormControl>
          <FormDescription>Highest allowed value</FormDescription>
        </FormItem>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormItem>
          <FormLabel>Step</FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder="1"
              value={form.watch('step')}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : 1;
                form.setValue('step', value);
                handleInputChange('step', value);
              }}
              disabled={disabled}
            />
          </FormControl>
          <FormDescription>Increment/decrement amount</FormDescription>
        </FormItem>

        <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-lg border p-3">
          <div className="space-y-0.5">
            <FormLabel>Allow Decimal Values</FormLabel>
            <FormDescription>
              Enable for non-integer numbers
            </FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={form.watch('allowDecimals')}
              onCheckedChange={(checked) => {
                form.setValue('allowDecimals', checked);
                handleInputChange('allowDecimals', checked);
              }}
              disabled={disabled}
            />
          </FormControl>
        </FormItem>
      </div>
    </div>
  );
} 