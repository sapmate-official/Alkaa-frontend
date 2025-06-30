import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Department } from '../types';

interface DepartmentsTabProps {
  departments: Department[];
  userDepartment: Department | null;
  isLoading: boolean;
  canViewOwnDepartment: boolean;
  canViewDepartmentList: boolean;
  canViewAllDepartments: boolean;
  onUserClick: (userId: string) => void;
}

export const DepartmentsTab = ({ 
  departments, 
  userDepartment, 
  isLoading, 
  canViewOwnDepartment, 
  canViewDepartmentList, 
  canViewAllDepartments, 
  onUserClick 
}: DepartmentsTabProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2 className="mr-2 h-5 w-5" />
          Departments
        </CardTitle>
        <CardDescription>
          {canViewAllDepartments 
            ? `Total Departments: ${departments.length}`
            : canViewDepartmentList 
              ? "Department Structure" 
              : "Your Department"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Own Department - always shown if permission exists */}
            {canViewOwnDepartment && userDepartment && (
              <div className="border p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium">Your Department</h3>
                  <Badge>Member</Badge>
                </div>
                <p className="text-xl font-bold">{userDepartment.name}</p>
                {userDepartment.description && (
                  <p className="text-muted-foreground mt-1">{userDepartment.description}</p>
                )}
                <div className="mt-4">
                  <p className="text-sm font-medium mb-1">Department Members: {userDepartment.users?.length || 0}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {userDepartment.users?.slice(0, 5).map((deptUser) => (
                      <Avatar key={deptUser.id} className="h-8 w-8 cursor-pointer" onClick={() => onUserClick(deptUser.id)}>
                        <AvatarFallback>
                          {deptUser.firstName?.[0]}{deptUser.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {userDepartment.users?.length > 5 && (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs">
                        +{userDepartment.users.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* All Departments List */}
            {(canViewDepartmentList || canViewAllDepartments) && departments.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">
                  {canViewAllDepartments ? "All Departments" : "Department List"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departments.map((dept) => (
                    <div 
                      key={dept.id} 
                      className={`border p-4 rounded-lg hover:bg-muted/50 cursor-pointer ${
                        canViewAllDepartments ? "" : "pointer-events-none"
                      }`}
                      onClick={() => canViewAllDepartments && navigate(`/department/${dept.id}`)}
                    >
                      <p className="font-medium">{dept.name}</p>
                      {canViewAllDepartments && (
                        <>
                          {dept.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{dept.description}</p>
                          )}
                          <p className="text-sm mt-2">
                            Members: <span className="font-medium">{dept.users?.length || 0}</span>
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
