import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from '@/components/ui/dialog';
import { Button, ButtonProps } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Trash2, Edit, PlusCircle, Loader2, Search } from 'lucide-react';
import { useAuth } from '@/providers/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types/general';
import PermissionPresetManager from './PermissionPresetManager';

// Import TanStack Query hooks
import { 
  useRoles, 
  useCreateRole, 
  useUpdateRole, 
  useDeleteRole,
  Role
} from '@/hooks/queries/useRoles';
import { 
  usePermissions
} from '@/hooks/queries/usePermissions';
import { 
  useEmployees, 
  useAssignEmployeeRole 
} from '@/hooks/queries/useEmployees';

interface LoadingButtonProps extends ButtonProps {
  loading: boolean;
}

const RolesPermissionsManagement = () => {
  // State for UI
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [createPermissionSearch, setCreatePermissionSearch] = useState('');

  // Hooks
  const { toast } = useToast();
  const { user } = useAuth();

  // TanStack Query hooks
  const { data: roles = [], isLoading: rolesLoading } = useRoles(user?.orgId);
  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions(user?.orgId);
  const { data: users = [], isLoading: usersLoading } = useEmployees({ orgId: user?.orgId });

  // Mutations
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const assignEmployeeRoleMutation = useAssignEmployeeRole();

  // Initialize edited permissions when role is selected
  useEffect(() => {
    if (selectedRole) {
      setEditedPermissions(selectedRole.permissions.map(p => p.id));
    }
  }, [selectedRole]);

  const handleSelectPreset = (permissionIds: string[]) => {
    // When creating a new role
    if (isCreateRoleDialogOpen) {
      setNewRolePermissions(permissionIds);
    }
    // When editing an existing role
    else if (selectedRole) {
      setEditedPermissions(permissionIds);
    }
  };

  // Create role handler
  const createRole = async () => {
    try {
      await createRoleMutation.mutateAsync({
        orgId: user?.orgId || '',
        name: newRoleName,
        description: '',
        permissions: newRolePermissions,
        isDefault: false
      });
      
      toast({
        title: 'Success',
        description: 'Role created successfully',
        variant: 'default'
      });
      
      setIsCreateRoleDialogOpen(false);
      setNewRoleName('');
      setNewRolePermissions([]);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to create role',
        variant: 'destructive'
      });
    }
  };

  // Update role permissions handler
  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    
    try {
      await updateRoleMutation.mutateAsync({
        id: selectedRole.id,
        data: { permissions: editedPermissions }
      });
      
      toast({
        title: 'Success',
        description: 'Role updated successfully',
        variant: 'default'
      });
      
      setSelectedRole(null);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive'
      });
    }
  };

  // Delete role handler
  const handleDeleteRole = async (roleId: string) => {
    try {
      await deleteRoleMutation.mutateAsync(roleId);
      
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to delete role',
        variant: 'destructive'
      });
    }
  };

  // User role change handler
  const handleUserRoleChange = async (userId: string, prevRoleId: string, roleId: string) => {
    try {
      if (roleId === 'null') {
        toast({
          title: 'Info',
          description: 'Role removal not yet implemented',
          variant: 'default'
        });
        return;
      }

      // Use the specific API endpoint for updating user roles
      const axios = (await import('axios')).default;
      const { APIDictionary } = await import('@/services/api/v2/APIdict');
      
      await axios.put(
        `${APIDictionary.user}/${userId}/role/${prevRoleId || 'null'}/${roleId}`,
        {},
        { withCredentials: true }
      );
      
      toast({
        title: 'Success',
        description: 'User role updated successfully',
        variant: 'default'
      });

      // Manually refetch the users data since we're not using a mutation hook
      window.location.reload(); // Temporary solution - ideally should use query invalidation
    } catch (error) {
      console.log(error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive'
      });
    }
  };

  const handleRolePermissionToggle = (permissionId: string) => {
    setEditedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const LoadingButton = ({ loading, children, ...props }: LoadingButtonProps) => (
    <Button disabled={loading} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );

  // Filter permissions based on search query
  const filteredPermissions = permissions.filter(permission => 
    permission.name.toLowerCase().includes(permissionSearch.toLowerCase())
  );

  const filteredCreatePermissions = permissions.filter(permission => 
    permission.name.toLowerCase().includes(createPermissionSearch.toLowerCase())
  );

  // Update the create role dialog content
  const createRoleDialogContent = (
    <DialogContent className="sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create New Role</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Input 
            placeholder="Role Name" 
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
          />
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Select Permissions</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setNewRolePermissions([])}
              >
                Clear All
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search permissions..." 
                className="pl-8"
                value={createPermissionSearch}
                onChange={(e) => setCreatePermissionSearch(e.target.value)}
              />
            </div>
            <div className="h-[300px] md:h-[400px] overflow-y-auto border rounded p-2">
              {filteredCreatePermissions.map(permission => (
                <div key={permission.id} className="flex items-center space-x-2 py-1">
                  <Checkbox 
                    id={`create-${permission.id}`}
                    checked={newRolePermissions.includes(permission.id)}
                    onCheckedChange={(checked) => {
                      setNewRolePermissions(prev => 
                        checked 
                          ? [...prev, permission.id]
                          : prev.filter(p => p !== permission.id)
                      );
                    }}
                  />
                  <label htmlFor={`create-${permission.id}`} className="text-sm">
                    {permission.name}
                  </label>
                </div>
              ))}
              {filteredCreatePermissions.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No permissions found matching your search
                </div>
              )}
            </div>
          </div>
          <LoadingButton 
            className="w-full" 
            onClick={createRole}
            loading={createRoleMutation.isPending}
          >
            Create Role
          </LoadingButton>
        </div>
        <div className="overflow-y-auto max-h-[500px]">
          <PermissionPresetManager 
            permissions={permissions as any} 
            onSelectPreset={handleSelectPreset} 
          />
        </div>
      </div>
    </DialogContent>
  );

  // Similarly, update the permissions dialog for existing roles
  const permissionsDialogContent = (
    <DialogContent className="sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit Role Permissions: {selectedRole?.name}</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Permissions</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setEditedPermissions([])}
            >
              Clear All
            </Button>
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search permissions..." 
              className="pl-8"
              value={permissionSearch}
              onChange={(e) => setPermissionSearch(e.target.value)}
            />
          </div>
          <div className="h-[300px] md:h-[400px] overflow-y-auto border rounded p-2">
            {filteredPermissions.map(permission => (
              <div key={permission.id} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={permission.id}
                  checked={editedPermissions.includes(permission.id)}
                  onCheckedChange={() => handleRolePermissionToggle(permission.id)}
                />
                <label 
                  htmlFor={permission.id} 
                  className="text-sm"
                >
                  {permission.name}
                </label>
              </div>
            ))}
            {filteredPermissions.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No permissions found matching your search
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setSelectedRole(null)}
            >
              Cancel
            </Button>
            <LoadingButton
              onClick={handleSavePermissions}
              loading={updateRoleMutation.isPending}
            >
              Save Changes
            </LoadingButton>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[500px]">
          <PermissionPresetManager 
            permissions={permissions as any} 
            onSelectPreset={handleSelectPreset} 
          />
        </div>
      </div>
    </DialogContent>
  );

  const getUserRoleName = (user: User) => {
    return user.roles?.[0]?.role.name ?? 'No Role';
  };

  const getCurrentRoleId = (user: User) => {
    return user.roles?.[0]?.roleId ?? '';
  };

  return (
    <div className="p-6 space-y-6 w-full overflow-y-scroll h-full">
      {/* Loading state */}
      {(rolesLoading || permissionsLoading || usersLoading) && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      )}

      {/* Roles Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Roles Management
            <Button 
              onClick={() => setIsCreateRoleDialogOpen(true)} 
              variant="outline"
              disabled={rolesLoading}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Create Role
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rolesLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading roles...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map(role => (
                  <TableRow key={role.id}>
                    <TableCell>{role.name}</TableCell>
                    <TableCell>
                      {role.permissions.length} permissions
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedRole(role)}
                        >
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                        <LoadingButton 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteRole(role.id)}
                          loading={deleteRoleMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </LoadingButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Permissions Dialog */}
      {selectedRole && (
        <Dialog 
          open={!!selectedRole} 
          onOpenChange={() => {
            setSelectedRole(null);
            setEditedPermissions([]);
          }}
        >
          {permissionsDialogContent}
        </Dialog>
      )}

      {/* Create Role Dialog */}
      <Dialog 
        open={isCreateRoleDialogOpen} 
        onOpenChange={setIsCreateRoleDialogOpen}
      >
        {createRoleDialogContent}
      </Dialog>

      {/* User Role Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>User Role Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.firstName} {user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getUserRoleName(user)}</TableCell>
                    <TableCell>
                      <select 
                        value={getCurrentRoleId(user)}
                        onChange={(e) => handleUserRoleChange(user?.id, getCurrentRoleId(user), e.target.value)}
                        className="border rounded px-2 py-1 bg-white dark:bg-neutral-800"
                        disabled={assignEmployeeRoleMutation.isPending}
                      >
                        <option value="null">No Role</option>
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                      {assignEmployeeRoleMutation.isPending && (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RolesPermissionsManagement;