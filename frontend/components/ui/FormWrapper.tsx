'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface FormWrapperProps {
  title: string;
  description?: string;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  className?: string;
}

export function FormWrapper({
  title,
  description,
  onSubmit,
  children,
  className,
}: FormWrapperProps) {
  return (
    <div className={cn('rounded-2xl border border-gray-200 bg-white p-6 shadow-sm', className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        {children}
      </form>
    </div>
  );
}
