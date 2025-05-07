import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { FormControl, FormItem, FormLabel } from '@/components/ui/form';

interface Choice {
  label: string;
  value: string;
}

interface SelectFieldOptionsProps {
  options: {
    choices?: Choice[];
  };
  onChange: (options: any) => void;
  isMulti?: boolean;
  disabled?: boolean;
}

export function SelectFieldOptions({ 
  options, 
  onChange, 
  isMulti = false,
  disabled = false 
}: SelectFieldOptionsProps) {
  const [newChoice, setNewChoice] = useState('');
  const choices = options.choices || [];

  const handleAddChoice = () => {
    if (!newChoice.trim()) return;
    
    const newChoiceObject = {
      label: newChoice,
      value: newChoice.toLowerCase().replace(/\s+/g, '_')
    };
    
    const updatedChoices = [...choices, newChoiceObject];
    onChange({ ...options, choices: updatedChoices });
    setNewChoice('');
  };

  const handleRemoveChoice = (index: number) => {
    const updatedChoices = [...choices];
    updatedChoices.splice(index, 1);
    onChange({ ...options, choices: updatedChoices });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddChoice();
    }
  };

  return (
    <div className="space-y-4">
      <FormItem>
        <FormLabel>{isMulti ? 'Multi-Select Options' : 'Select Options'}</FormLabel>
        <FormControl>
          <div className="space-y-2">
            {choices.map((choice, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input 
                  value={choice.label}
                  onChange={(e) => {
                    const updatedChoices = [...choices];
                    updatedChoices[index] = {
                      label: e.target.value,
                      value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                    };
                    onChange({ ...options, choices: updatedChoices });
                  }}
                  disabled={disabled}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveChoice(index)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </FormControl>
      </FormItem>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Add an option..."
          value={newChoice}
          onChange={(e) => setNewChoice(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddChoice}
          disabled={disabled || !newChoice.trim()}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {choices.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Add at least one option for the {isMulti ? 'multi-select' : 'dropdown'}.
        </p>
      )}
    </div>
  );
} 