import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradeButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  fullWidth?: boolean;
  onClick?: () => void;
}

export function UpgradeButton({ 
  variant = 'default', 
  size = 'default', 
  fullWidth = false,
  onClick
}: UpgradeButtonProps) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default behavior - navigate to pricing page
      navigate('/pricing');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white ${fullWidth ? 'w-full' : ''}`}
    >
      <Sparkles className="mr-2 h-4 w-4" />
      Upgrade to Premium
    </Button>
  );
} 