import { APIDictionary } from '@/api/v2/APIdict';
import { useAuth } from '@/services/AuthContext'
import axios from 'axios';
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from '@/components/ui/button';
import { Settings, Building2, Users, BarChart3, Layers, Info, Lock, Shield } from 'lucide-react';
import { useAtom } from 'jotai';
import { permissionListAtom } from '@/store/atom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { APIV2Dictionary } from '@/api/v2/Api2Dicts';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OrganizationType {
  id: string;
  name: string;
  industry: string;
  subscriptionPlan: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  isActive: boolean;
  users: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string | null;
    status: string;
    departmentId?: string;
    managerId?: string;
  }[];
}

interface Department {
  id: string;
  name: string;
  description?: string;
  headId?: string;
  users: {
    id: string;
    firstName: string;
    lastName: string;
  }[];
}

const SpecificOrganizationView = () => {
  const [permissions] = useAtom(permissionListAtom)
  const { user } = useAuth()
  const [organization, setOrganization] = useState<OrganizationType | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userDepartment, setUserDepartment] = useState<Department | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState({
    org: true,
    departments: true,
    team: true
  });
  const navigate = useNavigate();

  // Check permissions
  const canViewBasicDetails = permissions?.some(p => p?.key === 'view_organization_basic_details');
  const canViewTeamDetails = permissions?.some(p => p?.key === 'see_team_details');
  const canViewOwnDepartment = permissions?.some(p => p?.key === 'view_own_department_info');
  const canViewDepartmentList = permissions?.some(p => p?.key === 'view_list_of_department');
  const canViewAllDepartments = permissions?.some(p => p?.key === 'view_all_department_info');
  const canViewAllUsers = permissions?.some(p => p?.key === 'view_all_users');
  const canViewDetailedInfo = permissions?.some(p => p?.key === 'view_organization_detailed_info');

  const fetchOrganization = async () => {
    if (!user?.organization?.id) return;
    
    setIsLoading(prev => ({ ...prev, org: true }));
    try {
      const response = await axios.get(`${APIDictionary.Organization}/${user.organization.id}`);
      setOrganization(response?.data);
    } catch (error) {
      console.error('Failed to fetch organization:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, org: false }));
    }
  };

  const fetchDepartments = async () => {
    if (!user?.organization?.id) return;
    
    setIsLoading(prev => ({ ...prev, departments: true }));
    try {
      // Only fetch if user has permission
      if (canViewDepartmentList || canViewAllDepartments || canViewOwnDepartment) {
        const response = await axios.get(`${APIDictionary.department}/org/${user.organization.id}`,
          {
            withCredentials: true,
          }
        );
        
        if (canViewAllDepartments) {
          setDepartments(response?.data || []);
        }
        
        if (canViewOwnDepartment && user.departmentId) {
          const userDept = response?.data?.find((dept: Department) => dept.id === user.departmentId);
          if (userDept) {
            setUserDepartment(userDept);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, departments: false }));
    }
  };

  const fetchTeamMembers = async () => {
    if (!canViewTeamDetails || !user?.id) return;
    
    setIsLoading(prev => ({ ...prev, team: true }));
    try {
      const response = await axios.get(APIV2Dictionary.user.getSubordinateList(), 
        {
          withCredentials: true,
        }
      );
      console.log(response.data);
      
      setTeamMembers(response?.data || []);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, team: false }));
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrganization();
      fetchDepartments();
      fetchTeamMembers();
    }
  }, [user,permissions]);

  const handleUserClick = (userId: string) => {
    navigate(`/p/profile/${userId}`);
  };

  if (isLoading.org) {
    return (
      <div className="p-4 space-y-6 w-screen h-screen">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user has no permissions to view organization
  if (!canViewBasicDetails && !canViewTeamDetails && !canViewOwnDepartment && 
      !canViewDepartmentList && !canViewAllDepartments && !canViewAllUsers && 
      !canViewDetailedInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="text-4xl text-gray-300 mb-4">🔒</div>
        <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You don't have permission to view organization information. 
          Please contact your administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 py-6 space-y-6 overflow-y-auto">
      {/* Permission info banner */}
      {!canViewDetailedInfo && (
        <Alert variant="default" className="bg-muted/40 border border-muted mb-4">
          <Info className="h-5 w-5" />
          <AlertDescription>
            You're viewing organization information with limited access. Some details may be restricted based on your permissions.
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Organization Details Card */}
      {canViewBasicDetails ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{organization?.name}</CardTitle>
                <CardDescription>Organization Details</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                {canViewBasicDetails && (
                  <Badge variant={organization?.isActive ? "default" : "destructive"}>
                    {organization?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                )}
                {canViewDetailedInfo && (
                  <Settings 
                    className="cursor-pointer" 
                    onClick={() => navigate('/p/organization/settings')} 
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {canViewBasicDetails && (
                <div>
                  <h3 className="font-medium">Industry</h3>
                  <p className="text-sm text-muted-foreground">{organization?.industry || 'N/A'}</p>
                </div>
              )}
              
              {canViewDetailedInfo && (
                <>
                  <div>
                    <h3 className="font-medium">Subscription</h3>
                    <p className="text-sm text-muted-foreground">{organization?.subscriptionPlan}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Subscription Period</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(organization?.subscriptionStart || '').toLocaleDateString()} -
                      {new Date(organization?.subscriptionEnd || '').toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-dashed bg-muted/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-muted-foreground">
                  <Shield className="h-5 w-5 mr-2" />
                  Organization Basic Details
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <Lock className="h-8 w-8 text-muted mb-2" />
              <p className="text-muted-foreground">
                You don't have permission to view basic organization details.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different sections based on permissions */}
      {(canViewAllUsers || canViewTeamDetails || canViewOwnDepartment || canViewDepartmentList) && (
        <Tabs defaultValue={canViewAllUsers ? "all-users" : canViewTeamDetails ? "team" : "departments"}>
          <TabsList className="mb-4">
            {canViewAllUsers && <TabsTrigger value="all-users">All Employees</TabsTrigger>}
            {canViewTeamDetails && <TabsTrigger value="team">My Team</TabsTrigger>}
            {(canViewOwnDepartment || canViewDepartmentList || canViewAllDepartments) && (
              <TabsTrigger value="departments">Departments</TabsTrigger>
            )}
            {canViewDetailedInfo && <TabsTrigger value="insights">Insights</TabsTrigger>}
          </TabsList>

          {/* All Users Tab */}
          {canViewAllUsers && (
            <TabsContent value="all-users">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Users className="mr-2 h-5 w-5" />
                        Employee Directory
                      </CardTitle>
                      <CardDescription>
                        Total Employees: {organization?.users?.length || 0}
                      </CardDescription>
                    </div>
                    {canViewDetailedInfo && (
                      <Button
                        onClick={() => navigate('/p/employee/create')}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Hire Employee
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organization?.users?.map((user) => (
                        <TableRow
                          key={user?.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleUserClick(user?.id)}
                        >
                          <TableCell className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>{`${user?.firstName || ''} ${user?.lastName || ''}`}</span>
                          </TableCell>
                          <TableCell>{user?.email}</TableCell>
                          <TableCell>{user?.employeeId || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={user?.status === 'active' ? "success" : "destructive"}>
                              {user?.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Team Tab */}
          {canViewTeamDetails && (
            <TabsContent value="team">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    My Team
                  </CardTitle>
                  <CardDescription>
                    Employees reporting to you: {teamMembers?.length || 0}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading.team ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-28" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : teamMembers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {teamMembers.map((member) => (
                        <div 
                          key={member.id} 
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleUserClick(member.id)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.firstName} {member.lastName}</div>
                            <div className="text-sm text-muted-foreground">
                              {member.employeeId ? `ID: ${member.employeeId}` : 'No Employee ID'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No team members reporting to you
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Departments Tab */}
          {(canViewOwnDepartment || canViewDepartmentList || canViewAllDepartments) && (
            <TabsContent value="departments">
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
                  {isLoading.departments ? (
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
                                <Avatar key={deptUser.id} className="h-8 w-8 cursor-pointer" onClick={() => handleUserClick(deptUser.id)}>
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
                                onClick={() => canViewAllDepartments && navigate(`/p/department/${dept.id}`)}
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
            </TabsContent>
          )}

          {/* Insights Tab - Only for users with detailed org info permission */}
          {canViewDetailedInfo && (
            <TabsContent value="insights">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5" />
                      Employee Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {departments.map((dept) => {
                      const percentage = organization?.users?.length 
                        ? Math.round((dept.users.length / organization.users.length) * 100) 
                        : 0;
                      
                      return (
                        <div key={dept.id} className="mb-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{dept.name}</span>
                            <span className="text-sm text-muted-foreground">{percentage}%</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Layers className="mr-2 h-5 w-5" />
                      Organization Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                        <span>Total Employees</span>
                        <span className="font-bold">{organization?.users?.length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                        <span>Total Departments</span>
                        <span className="font-bold">{departments?.length || 0}</span>
                      </div>
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                        <span>Subscription Plan</span>
                        {organization?.subscriptionPlan === "PRO" ? (
                          <Badge variant="outline" className="bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-medium border-amber-400">
                          {organization?.subscriptionPlan}
                          </Badge>
                        ) : (
                          <Badge variant="outline">{organization?.subscriptionPlan}</Badge>
                        )}
                        </div>
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                        <span>Subscription Ends</span>
                        <span className="font-medium">
                          {new Date(organization?.subscriptionEnd || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
};

export default SpecificOrganizationView;