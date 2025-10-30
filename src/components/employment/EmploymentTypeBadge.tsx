import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  EmploymentType,
  EMPLOYMENT_TYPE_COLORS,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPE_BADGES,
} from '@/types/employmentType';

interface EmploymentTypeBadgeProps {
  employmentType: EmploymentType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const EmploymentTypeBadge: React.FC<EmploymentTypeBadgeProps> = ({
  employmentType,
  size = 'sm',
  showLabel = false,
  className = '',
}) => {
  const color = EMPLOYMENT_TYPE_COLORS[employmentType];
  const badge = EMPLOYMENT_TYPE_BADGES[employmentType];
  const label = EMPLOYMENT_TYPE_LABELS[employmentType];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <Badge
      className={`font-semibold ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: color,
        color: '#FFFFFF',
      }}
    >
      {showLabel ? label : badge}
    </Badge>
  );
};
