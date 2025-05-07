import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { CustomFieldDefinition } from './CustomFieldsManager';
import { CustomFieldValue } from '@/lib/api/customFields';
import { cn } from '@/lib/utils';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  FilterIcon,
  XIcon
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CustomFieldColumnProps {
  fieldDefinition: CustomFieldDefinition;
  fieldValue: CustomFieldValue | null;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
  onFilter?: (value: string | number | boolean | null) => void;
  activeFilter?: any;
  clearFilter?: () => void;
}

export function CustomFieldColumn({
  fieldDefinition,
  fieldValue,
  enableSorting = false,
  enableFiltering = false,
  sortDirection = null,
  onSort,
  onFilter,
  activeFilter,
  clearFilter
}: CustomFieldColumnProps) {
  const [showFilter, setShowFilter] = useState(false);

  // Function to render the value based on field type
  const renderValue = () => {
    if (!fieldValue) return <span className="text-muted-foreground">—</span>;

    switch (fieldDefinition.field_type) {
      case 'text':
      case 'user_id': // Would use proper user display in a real implementation
        return fieldValue.text_value || <span className="text-muted-foreground">—</span>;

      case 'number':
        return fieldValue.number_value !== null && fieldValue.number_value !== undefined
          ? fieldValue.number_value
          : <span className="text-muted-foreground">—</span>;

      case 'date':
        return fieldValue.date_value
          ? format(new Date(fieldValue.date_value), 'PP')
          : <span className="text-muted-foreground">—</span>;

      case 'boolean':
        return (
          <Checkbox
            checked={!!fieldValue.boolean_value}
            disabled
          />
        );

      case 'select':
        if (!fieldValue.text_value) return <span className="text-muted-foreground">—</span>;
        
        const option = fieldDefinition.options?.choices?.find(
          c => c.value === fieldValue.text_value
        );
        
        return (
          <Badge variant="outline" className="font-normal">
            {option?.label || fieldValue.text_value}
          </Badge>
        );

      case 'multi_select':
        const values = fieldValue.json_value as string[] || [];
        
        if (!values.length) return <span className="text-muted-foreground">—</span>;
        
        return (
          <div className="flex flex-wrap gap-1">
            {values.map(val => {
              const opt = fieldDefinition.options?.choices?.find(c => c.value === val);
              return (
                <Badge key={val} variant="outline" className="font-normal">
                  {opt?.label || val}
                </Badge>
              );
            })}
          </div>
        );

      default:
        return <span className="text-muted-foreground">—</span>;
    }
  };

  // Generate filter controls based on field type
  const renderFilterControls = () => {
    switch (fieldDefinition.field_type) {
      case 'text':
      case 'user_id':
        return (
          <Input
            placeholder="Filter text..."
            value={activeFilter || ''}
            onChange={e => onFilter?.(e.target.value)}
            className="w-full"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder="Filter number..."
            value={activeFilter ?? ''}
            onChange={e => onFilter?.(e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full"
          />
        );

      case 'date':
        // Date filtering would ideally use a date picker
        return (
          <Input
            placeholder="YYYY-MM-DD"
            value={activeFilter || ''}
            onChange={e => onFilter?.(e.target.value)}
            className="w-full"
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="filter-boolean"
              checked={!!activeFilter}
              onCheckedChange={checked => onFilter?.(!!checked)}
            />
            <label htmlFor="filter-boolean" className="text-sm">Yes</label>
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            {fieldDefinition.options?.choices?.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`filter-${option.value}`}
                  checked={activeFilter === option.value}
                  onCheckedChange={(checked) => {
                    if (checked) onFilter?.(option.value);
                    else if (activeFilter === option.value) clearFilter?.();
                  }}
                />
                <label htmlFor={`filter-${option.value}`} className="text-sm">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case 'multi_select':
        // This would need a more complex component for multi-selection
        return (
          <div className="text-sm text-muted-foreground">
            Multi-select filtering not supported
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center">
      <div className="flex-1">
        {renderValue()}
      </div>
      
      {(enableSorting || enableFiltering) && (
        <div className="flex items-center ml-2">
          {enableSorting && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSort}
              className={cn(
                "h-6 w-6 p-0",
                sortDirection && "text-primary"
              )}
            >
              {sortDirection === 'asc' ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : sortDirection === 'desc' ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <div className="h-4 w-4 flex flex-col items-center opacity-50">
                  <ChevronUpIcon className="h-2 w-2" />
                  <ChevronDownIcon className="h-2 w-2" />
                </div>
              )}
            </Button>
          )}
          
          {enableFiltering && (
            <DropdownMenu open={showFilter} onOpenChange={setShowFilter}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 p-0 ml-1",
                    activeFilter != null && "text-primary"
                  )}
                >
                  <FilterIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuGroup>
                  <div className="p-2">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium">Filter</span>
                      {activeFilter != null && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={clearFilter}
                          className="h-5 w-5 p-0"
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    {renderFilterControls()}
                  </div>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </div>
  );
} 