import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Building, Users } from 'lucide-react';
import { User } from '@/interface/general';
import { multiDepartmentUtils } from '@/utils/multiDepartmentUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MultiDepartmentDisplayProps {
  user: User;
  showRoles?: boolean;
  showPrimaryOnly?: boolean;
  compact?: boolean;
  className?: string;
}

export const MultiDepartmentDisplay: React.FC<MultiDepartmentDisplayProps> = ({
  user,
  showRoles = false,
  showPrimaryOnly = false,
  compact = false,
  className = '',
}) => {
  const primaryDepartment = multiDepartmentUtils.getPrimaryDepartment(user);
  const allDepartments = multiDepartmentUtils.getAllDepartments(user);
  const secondaryDepartments = multiDepartmentUtils.getSecondaryDepartments(user);

  if (!primaryDepartment && allDepartments.length === 0) {
    return (
      <div className={`text-muted-foreground text-sm ${className}`}>
        No departments assigned
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Building className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm">
          {multiDepartmentUtils.formatDepartmentDisplay(user)}
        </span>
      </div>
    );
  }

  if (showPrimaryOnly && primaryDepartment) {
    const role = multiDepartmentUtils.getUserRoleInDepartment(user, primaryDepartment.id);
    
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="default" className="flex items-center gap-1">
          <Crown className="h-3 w-3" />
          {primaryDepartment.name}
          {showRoles && role && <span className="ml-1 opacity-75">• {role}</span>}
        </Badge>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Primary Department */}
      {primaryDepartment && (
        <div className="flex items-center gap-2">
          <Badge variant="default" className="flex items-center gap-1">
            <Crown className="h-3 w-3" />
            <span>Primary: {primaryDepartment.name}</span>
            {showRoles && (
              <span className="ml-1 opacity-75">
                • {multiDepartmentUtils.getUserRoleInDepartment(user, primaryDepartment.id) || 'Member'}
              </span>
            )}
          </Badge>
        </div>
      )}

      {/* Secondary Departments */}
      {secondaryDepartments.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {secondaryDepartments.map((dept) => {
            const role = multiDepartmentUtils.getUserRoleInDepartment(user, dept.id);
            
            return (
              <TooltipProvider key={dept.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                      <Building className="h-3 w-3" />
                      {dept.name}
                      {showRoles && role && <span className="ml-1">• {role}</span>}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <div className="font-medium">{dept.name}</div>
                      {dept.description && (
                        <div className="text-muted-foreground">{dept.description}</div>
                      )}
                      {role && <div className="text-xs mt-1">Role: {role}</div>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      )}

      {/* Department Summary */}
      {allDepartments.length > 1 && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" />
          {allDepartments.length} department{allDepartments.length !== 1 ? 's' : ''} total
        </div>
      )}
    </div>
  );
};

export default MultiDepartmentDisplay;
