import { APIDictionary } from '@/services/api/v2/APIdict';
import { useAuth } from '@/providers/AuthContext'
import axios from 'axios';
import { useEffect, useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from "@/components/ui/skeleton"
import { useAtom } from 'jotai';
import { permissionListAtom } from '@/store/atom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APIV2Dictionary } from '@/services/api/v2/Api2Dicts';
import { OrganizationType, Department, TeamMember } from './types';
import { 
  OrganizationHeader, 
  AllUsersTab, 
  TeamTab, 
  DepartmentsTab, 
  InsightsTab,
  OrganizationChartTab 
} from './components';
import RouteDict from '@/routes/RouteDict';

const SpecificOrganizationView = () => {
  const [permissions] = useAtom(permissionListAtom)
  const { user } = useAuth()
  const [organization, setOrganization] = useState<OrganizationType | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userDepartment, setUserDepartment] = useState<Department | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState({
    org: true,
    departments: true,
    team: true
  });
  const navigate = useNavigate();

  // Check permissions
  const permissionChecks = useMemo(() => ({
    canViewBasicDetails: permissions?.some(p => p?.key === 'view_organization_basic_details'),
    canViewTeamDetails: permissions?.some(p => p?.key === 'see_team_details'),
    canViewOwnDepartment: permissions?.some(p => p?.key === 'view_own_department_info'),
    canViewDepartmentList: permissions?.some(p => p?.key === 'view_list_of_department'),
    canViewAllDepartments: permissions?.some(p => p?.key === 'view_all_department_info'),
    canViewAllUsers: permissions?.some(p => p?.key === 'view_all_users'),
    canViewDetailedInfo: permissions?.some(p => p?.key === 'view_organization_detailed_info'),
  }), [permissions]);

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
      if (permissionChecks.canViewDepartmentList || permissionChecks.canViewAllDepartments || permissionChecks.canViewOwnDepartment) {
        const response = await axios.get(`${APIDictionary.department}/org/${user.organization.id}`,
          {
            withCredentials: true,
          }
        );
        
        if (permissionChecks.canViewAllDepartments) {
          setDepartments(response?.data || []);
        }
        
        if (permissionChecks.canViewOwnDepartment && user.departmentId) {
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
    if (!permissionChecks.canViewTeamDetails || !user?.id) return;
    
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

  const fetchAllData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading({ org: true, departments: true, team: true });
    
    try {
      const promises = [];
      promises.push(fetchOrganization());
      
      if (permissionChecks.canViewTeamDetails) promises.push(fetchTeamMembers());
      if (permissionChecks.canViewDepartmentList || permissionChecks.canViewAllDepartments) promises.push(fetchDepartments());
      
      await Promise.all(promises);
    } finally {
      setIsLoading({ org: false, departments: false, team: false });
    }
  }, [user, permissionChecks.canViewTeamDetails, permissionChecks.canViewDepartmentList, permissionChecks.canViewAllDepartments]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]); 

  const handleUserClick = (userId: string) => {
    navigate(RouteDict.Profile.Info(userId));
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
  if (!permissionChecks.canViewBasicDetails && !permissionChecks.canViewTeamDetails && !permissionChecks.canViewOwnDepartment && 
      !permissionChecks.canViewDepartmentList && !permissionChecks.canViewAllDepartments && !permissionChecks.canViewAllUsers && 
      !permissionChecks.canViewDetailedInfo) {
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
      <OrganizationHeader 
        organization={organization}
        canViewBasicDetails={permissionChecks.canViewBasicDetails}
        canViewDetailedInfo={permissionChecks.canViewDetailedInfo}
      />      {/* Tabs for different sections based on permissions */}
      {(permissionChecks.canViewAllUsers || permissionChecks.canViewTeamDetails || permissionChecks.canViewOwnDepartment || permissionChecks.canViewDepartmentList) && (
        <Tabs defaultValue={permissionChecks.canViewAllUsers ? "all-users" : permissionChecks.canViewTeamDetails ? "team" : "departments"}>
          <TabsList className="mb-4">
            {permissionChecks.canViewAllUsers && <TabsTrigger value="all-users">All Employees</TabsTrigger>}
            {permissionChecks.canViewTeamDetails && <TabsTrigger value="team">My Team</TabsTrigger>}
            {(permissionChecks.canViewOwnDepartment || permissionChecks.canViewDepartmentList || permissionChecks.canViewAllDepartments) && (
              <TabsTrigger value="departments">Departments</TabsTrigger>
            )}
            {(permissionChecks.canViewDepartmentList || permissionChecks.canViewAllDepartments) && (
              <TabsTrigger value="org-chart">Organization Chart</TabsTrigger>
            )}
            {permissionChecks.canViewDetailedInfo && <TabsTrigger value="insights">Insights</TabsTrigger>}
          </TabsList>

          {/* All Users Tab */}
          {permissionChecks.canViewAllUsers && (
            <TabsContent value="all-users">
              <AllUsersTab 
                organization={organization}
                canViewDetailedInfo={permissionChecks.canViewDetailedInfo}
                onUserClick={handleUserClick}
              />
            </TabsContent>
          )}

          {/* Team Tab */}
          {permissionChecks.canViewTeamDetails && (
            <TabsContent value="team">
              <TeamTab 
                teamMembers={teamMembers}
                isLoading={isLoading.team}
                onUserClick={handleUserClick}
              />
            </TabsContent>
          )}          {/* Departments Tab */}
          {(permissionChecks.canViewOwnDepartment || permissionChecks.canViewDepartmentList || permissionChecks.canViewAllDepartments) && (
            <TabsContent value="departments">
              <DepartmentsTab 
                departments={departments}
                userDepartment={userDepartment}
                isLoading={isLoading.departments}
                canViewOwnDepartment={permissionChecks.canViewOwnDepartment}
                canViewDepartmentList={permissionChecks.canViewDepartmentList}
                canViewAllDepartments={permissionChecks.canViewAllDepartments}
                onUserClick={handleUserClick}
              />
            </TabsContent>
          )}

          {/* Organization Chart Tab */}
          {(permissionChecks.canViewDepartmentList || permissionChecks.canViewAllDepartments) && (
            <TabsContent value="org-chart">
              <OrganizationChartTab 
                organization={organization}
                canViewDetailedInfo={permissionChecks.canViewDetailedInfo}
                canViewAllDepartments={permissionChecks.canViewAllDepartments}
                canViewDepartmentList={permissionChecks.canViewDepartmentList}
                onUserClick={handleUserClick}
              />
            </TabsContent>
          )}

          {/* Insights Tab - Only for users with detailed org info permission */}
          {permissionChecks.canViewDetailedInfo && (
            <TabsContent value="insights">
              <InsightsTab 
                organization={organization}
                departments={departments}
              />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
};

export default SpecificOrganizationView;