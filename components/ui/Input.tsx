
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => (
  <input 
    className={`w-full text-sm font-bold bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    {...props}
  />
);
