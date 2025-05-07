import { cn } from '@/lib/utils'
import React from 'react'

export function Heading({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h1 className={cn('text-3xl font-bold tracking-tight mb-6', className)}>{children}</h1>
  )
} 