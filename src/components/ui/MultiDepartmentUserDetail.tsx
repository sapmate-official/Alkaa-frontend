import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Building2, 
  Users, 
  Clock, 
  Calendar,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Briefcase,
  Activity
} from 'lucide-react';
import { User } from '@/interface/general';
import { MultiDepartmentDisplay } from '@/components/ui/MultiDepartmentDisplay';
import DepartmentAssignmentHistory from '@/components/ui/DepartmentAssignmentHistory';
import { format } from 'date-fns';

interface MultiDepartmentUserDetailProps {
  user: User;
  showHistory?: boolean;
  showAdvancedDetails?: boolean;
  compact?: boolean;
  onUserClick?: (userId: string) => void;
  className?: string;
}

const MultiDepartmentUserDetail: React.FC<MultiDepartmentUserDetailProps> = ({
  user,
  showHistory = true,
  showAdvancedDetails = true,
  compact = false,
  onUserClick,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState({
    departments: !compact,
    roles: !compact,
    history: false,
    details: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getDepartmentCount = () => {
    return user.userDepartments?.length || (user.department ? 1 : 0);
  };

  const getPrimaryDepartment = () => {
    return user.userDepartments?.find(ud => ud.isPrimary)?.department || user.department;
  };

  const handleUserClick = () => {
    if (onUserClick) {
      onUserClick(user.id);
    }
  };

  if (compact) {
    return (
      <Card className={`${className} hover:shadow-md transition-shadow cursor-pointer`} onClick={handleUserClick}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-sm font-medium">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm truncate">
                  {user.firstName} {user.lastName}
                </h3>
                {getDepartmentCount() > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    {getDepartmentCount()} depts
                  </Badge>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground">
                {getPrimaryDepartment()?.name || 'No department'}
                {user.roles?.[0] && (
                  <span className="ml-2">• {user.roles[0].role?.name}</span>
                )}
              </div>
            </div>

            {user.userDepartments && user.userDepartments.length > 0 && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 mr-1" />
                Multi-dept
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20 ring-offset-2">
              <AvatarFallback className="text-lg font-semibold">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <CardTitle className="text-xl mb-2">
                {user.firstName} {user.lastName}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                  {user.status}
                </Badge>
                {user.employeeId && (
                  <Badge variant="outline">ID: {user.employeeId}</Badge>
                )}
                {getDepartmentCount() > 1 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {getDepartmentCount()} Departments
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {onUserClick && (
            <Button variant="ghost" size="sm" onClick={handleUserClick}>
              <UserIcon className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Department Information */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Department Assignments
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('departments')}
              className="text-muted-foreground"
            >
              {expandedSections.departments ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {expandedSections.departments && (
            <div className="space-y-3">
              {user.userDepartments && user.userDepartments.length > 0 ? (
                <MultiDepartmentDisplay 
                  user={user}
                  showRoles={true}
                  compact={false}
                  className="bg-muted/20 rounded-lg p-3"
                />
              ) : user.department ? (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{user.department.name}</p>
                    <p className="text-sm text-muted-foreground">Legacy single department</p>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm p-3 border rounded-lg bg-muted/20">
                  No department assignments
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* System Roles */}
        {user.roles && user.roles.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                System Roles
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('roles')}
                className="text-muted-foreground"
              >
                {expandedSections.roles ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            {expandedSections.roles && (
              <div className="flex flex-wrap gap-2">
                {user.roles.map((userRole) => (
                  <Badge key={userRole.id} variant="secondary" className="px-3 py-1">
                    {userRole.role?.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Advanced Details */}
        {showAdvancedDetails && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Employment Details
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('details')}
                  className="text-muted-foreground"
                >
                  {expandedSections.details ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>

              {expandedSections.details && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Hired:</span>
                      <span>
                        {user.hiredDate 
                          ? format(new Date(user.hiredDate), 'MMM dd, yyyy')
                          : 'Not specified'
                        }
                      </span>
                    </div>
                    
                    {user.manager && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Manager:</span>
                        <span>{user.manager.firstName} {user.manager.lastName}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {user.email && (
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Email:</span>
                        <span className="truncate">{user.email}</span>
                      </div>
                    )}
                    
                    {user.mobileNumber && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{user.mobileNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Department Assignment History */}
        {showHistory && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Assignment History
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('history')}
                  className="text-muted-foreground"
                >
                  {expandedSections.history ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>

              {expandedSections.history && (
                <DepartmentAssignmentHistory 
                  userId={user.id}
                  showTitle={false}
                  limit={3}
                  className="border-0 shadow-none p-0"
                />
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiDepartmentUserDetail;
