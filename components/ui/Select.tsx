
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ className = '', children, ...props }) => (
  <select 
    className={`w-full text-sm font-bold bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all hover:bg-slate-100 ${className}`}
    {...props}
  >
    {children}
  </select>
);
