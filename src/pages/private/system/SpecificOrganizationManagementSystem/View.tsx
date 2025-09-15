import { useAuth } from '@/providers/AuthContext'
import { useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from "@/components/ui/skeleton"
import { useAtom } from 'jotai';
import { permissionListAtom } from '@/store/atom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { 
  OrganizationHeader, 
  AllUsersTab, 
  TeamTab, 
  DepartmentsTab, 
  InsightsTab,
  OrganizationChartTab 
} from './components';
import RouteDict from '@/routes/RouteDict';
import { useOrganization, useOrganizationDepartments, useTeamMembers } from '@/hooks/queries'

const SpecificOrganizationView = () => {
  const [permissions] = useAtom(permissionListAtom)
  const { user } = useAuth()
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

  // Use TanStack Query hooks
  const orgId = user?.organization?.id
  const { data: organization, isLoading: isLoadingOrg } = useOrganization(orgId, !!orgId)
  const { data: departments = [], isLoading: isLoadingDepartments } = useOrganizationDepartments(
    orgId,
    permissionChecks.canViewDepartmentList || permissionChecks.canViewAllDepartments || permissionChecks.canViewOwnDepartment
  )
  const { data: teamMembers = [], isLoading: isLoadingTeam } = useTeamMembers(
    user?.id,
    permissionChecks.canViewTeamDetails
  )

  // Find user's department from departments list
  const userDepartment = useMemo(() => {
    if (!user?.departmentId || !departments.length) return null
    return departments.find(dept => dept.id === user.departmentId) || null
  }, [user?.departmentId, departments])

  const handleUserClick = (userId: string) => {
    navigate(RouteDict.Profile.Info(userId));
  };

  if (isLoadingOrg) {
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
        organization={organization || null}
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
                organization={organization || null}
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
                isLoading={isLoadingTeam}
                onUserClick={handleUserClick}
              />
            </TabsContent>
          )}          {/* Departments Tab */}
          {(permissionChecks.canViewOwnDepartment || permissionChecks.canViewDepartmentList || permissionChecks.canViewAllDepartments) && (
            <TabsContent value="departments">
              <DepartmentsTab 
                departments={departments}
                userDepartment={userDepartment}
                isLoading={isLoadingDepartments}
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
                organization={organization || null}
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
                organization={organization || null}
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