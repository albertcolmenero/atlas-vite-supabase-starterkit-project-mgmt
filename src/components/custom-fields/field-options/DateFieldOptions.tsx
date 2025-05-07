import { useState, useEffect } from 'react';
import { FormControl, FormDescription, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface DateFieldOptionsProps {
  options?: {
    minDate?: string;
    maxDate?: string;
    includeTime?: boolean;
  };
  onChange: (options: any) => void;
  disabled?: boolean;
}

export function DateFieldOptions({ options = {}, onChange, disabled = false }: DateFieldOptionsProps) {
  const [minDate, setMinDate] = useState<string>(options.minDate || '');
  const [maxDate, setMaxDate] = useState<string>(options.maxDate || '');
  const [includeTime, setIncludeTime] = useState<boolean>(options.includeTime || false);

  useEffect(() => {
    // Update parent component when options change
    onChange({
      ...options,
      minDate: minDate || undefined,
      maxDate: maxDate || undefined,
      includeTime
    });
  }, [minDate, maxDate, includeTime]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormItem>
          <FormLabel>Minimum Date</FormLabel>
          <FormControl>
            <Input
              type="date"
              value={minDate}
              onChange={(e) => setMinDate(e.target.value)}
              disabled={disabled}
            />
          </FormControl>
          <FormDescription>Earliest allowed date</FormDescription>
        </FormItem>

        <FormItem>
          <FormLabel>Maximum Date</FormLabel>
          <FormControl>
            <Input
              type="date"
              value={maxDate}
              onChange={(e) => setMaxDate(e.target.value)}
              disabled={disabled}
            />
          </FormControl>
          <FormDescription>Latest allowed date</FormDescription>
        </FormItem>
      </div>

      <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-lg border p-3">
        <div className="space-y-0.5">
          <FormLabel>Include Time</FormLabel>
          <FormDescription>
            Allow users to select a time along with the date
          </FormDescription>
        </div>
        <FormControl>
          <Switch
            checked={includeTime}
            onCheckedChange={setIncludeTime}
            disabled={disabled}
          />
        </FormControl>
      </FormItem>
    </div>
  );
} 