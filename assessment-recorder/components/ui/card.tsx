import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}