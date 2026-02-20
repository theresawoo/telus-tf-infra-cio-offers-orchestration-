
import React from 'react';

interface LabelProps {
  children: React.ReactNode;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({ children, className = '' }) => (
  <label className={`text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ${className}`}>
    {children}
  </label>
);
