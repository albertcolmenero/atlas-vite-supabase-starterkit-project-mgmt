import React from 'react';

interface SectionTitleProps {
  title: string;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title, className }) => (
  <h2 className={`text-2xl font-bold tracking-tight text-foreground ${className || ''}`.trim()}>{title}</h2>
); 