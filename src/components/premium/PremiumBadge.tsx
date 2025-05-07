import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PremiumBadgeProps {
  message?: string;
}

export function PremiumBadge({ message = 'Premium Feature' }: PremiumBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-2 py-1 flex items-center gap-1 cursor-help">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span className="font-medium">Premium</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 