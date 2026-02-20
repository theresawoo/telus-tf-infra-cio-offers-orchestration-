
import React from 'react';
import { Card } from './Card';
import { Label } from './Label';

interface StatTileProps {
  label: string;
  value: string | number;
  subtext?: string;
  className?: string;
  valueClassName?: string;
  accent?: boolean;
}

export const StatTile: React.FC<StatTileProps> = ({ 
  label, 
  value, 
  subtext, 
  className = '', 
  valueClassName = '',
  accent = false 
}) => (
  <Card className={`p-5 ${accent ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-100' : ''} ${className}`}>
    <Label className={accent ? 'text-indigo-200' : ''}>{label}</Label>
    <div className="flex items-baseline gap-1">
      <span className={`text-2xl font-black ${accent ? 'text-white' : 'text-slate-900'} ${valueClassName}`}>
        {value}
      </span>
    </div>
    {subtext && (
      <div className={`text-[10px] mt-1 ${accent ? 'text-indigo-200' : 'text-slate-500'}`}>
        {subtext}
      </div>
    )}
  </Card>
);
