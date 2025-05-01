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
import { Trash2, Edit, PlusCircle, Loader2 } from 'lucide-react';
import { APIDictionary } from '@/api/v2/APIdict';
import { useAuth } from '@/services/AuthContext';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Permission, Role, User } from '@/interface/general';
import PermissionPresetManager from './PermissionPresetManager';

interface LoadingButtonProps extends ButtonProps {
  loading: boolean;
}

const RolesPermissionsManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState({
    create: false,
    update: false,
    delete: false,
    fetch: false,
    userUpdate: false
  });

  // Initial data fetching
  useEffect(() => {
    fetchRole();
    fetchUser();
    fetchPermission();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      // Initialize edited permissions with current role permissions
      setEditedPermissions(selectedRole.permissions.map(p => p.permissionId));
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

  const fetchPermission = async () => {
    try {
      const response = await axios.get(`${APIDictionary.permission}/org/${user?.orgId}`);
      setPermissions(response.data);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to fetch permissions',
        variant: 'destructive'
      });
    }
  };

  const fetchRole = async () => {
    setIsLoading(prev => ({ ...prev, fetch: true }));
    try {
      const response = await axios.get(`${APIDictionary.role}/org/${user?.orgId}`);
      setRoles(response.data);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to fetch roles',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(prev => ({ ...prev, fetch: false }));
    }
  };

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${APIDictionary.user}/org/${user?.orgId}`,{
        withCredentials: true
      });
      setUsers(response.data);
    } catch (error) {
      console.log(error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      });
    }
  };

  const createRole = async () => {
    setIsLoading(prev => ({ ...prev, create: true }));
    try {
      const newRole = {
        name: newRoleName,
        orgId: user?.orgId ?? '',
        description: '',
        isDefault: false,
        permissionIds: newRolePermissions // Send only permission IDs
      };
      
      await axios.post(APIDictionary.role, newRole);
      toast({
        title: 'Success',
        description: 'Role created successfully',
        variant: 'default'
      });
      fetchRole(); // Refresh roles
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
    } finally {
      setIsLoading(prev => ({ ...prev, create: false }));
    }
  };

  const updateUsersRole = async (userId: string, prevRoleId: string, roleId: string) => {
    try {
      await axios.put(`${APIDictionary.user}/${userId}/role/${prevRoleId}/${roleId}`);
      toast({
        title: 'Success',
        description: 'User role updated successfully',
        variant: 'default'
      });
    } catch (error) {
      console.log(error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive'
      });
    }
  };

  const updateRole = async (permissions: string[], roleId: string) => {
    try {
      const rolePermissions = permissions.map(permId => ({
        permissionId: permId,
        roleId: roleId
      }));
      await axios.put(`${APIDictionary.role}/${roleId}`, { permissions: rolePermissions });
      toast({
        title: 'Success',
        description: 'Role updated successfully',
        variant: 'default'
      });
    } catch (error) { 
      console.log(error);
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive'
      });
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      await axios.delete(`${APIDictionary.role}/${roleId}`);
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
        variant: 'default'
      });
    } catch (error) {
      console.log(error);
      toast({
        title: 'Error',
        description: 'Failed to delete role',
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

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setIsLoading(prev => ({ ...prev, update: true }));
    try {
      await updateRole(editedPermissions, selectedRole.id);
      fetchRole(); // Refresh roles after update
      setSelectedRole(null); // Close dialog
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(prev => ({ ...prev, update: false }));
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    setIsLoading(prev => ({ ...prev, delete: true }));
    try {
      await deleteRole(roleId);
      fetchRole(); // Refresh roles after deletion
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const handleUserRoleChange = async (userId: string, prevRoleId: string, roleId: string) => {
    setIsLoading(prev => ({ ...prev, userUpdate: true }));
    try {
      await updateUsersRole(userId.toString(), prevRoleId ? prevRoleId : 'null', roleId);
      fetchUser(); // Refresh users after role update
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(prev => ({ ...prev, userUpdate: false }));
    }
  };

  const LoadingButton = ({ loading, children, ...props }: LoadingButtonProps) => (
    <Button disabled={loading} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
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
            <div className="h-[300px] md:h-[400px] overflow-y-auto border rounded p-2">
              {permissions.map(permission => (
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
            </div>
          </div>
          <LoadingButton 
            className="w-full" 
            onClick={createRole}
            loading={isLoading.create}
          >
            Create Role
          </LoadingButton>
        </div>
        <div className="overflow-y-auto max-h-[500px]">
          <PermissionPresetManager 
            permissions={permissions} 
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
          <div className="h-[300px] md:h-[400px] overflow-y-auto border rounded p-2">
            {permissions.map(permission => (
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
              loading={isLoading.update}
            >
              Save Changes
            </LoadingButton>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[500px]">
          <PermissionPresetManager 
            permissions={permissions} 
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
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Roles Management
            <Button 
              onClick={() => setIsCreateRoleDialogOpen(true)} 
              variant="outline"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Create Role
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                        loading={isLoading.delete}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </LoadingButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getUserRoleName(user)}</TableCell>
                  <TableCell>
                    <select 
                      value={getCurrentRoleId(user)}
                      onChange={(e) => handleUserRoleChange(user?.id, getCurrentRoleId(user), e.target.value)}
                      className="border rounded px-2 py-1 bg-white dark:bg-neutral-800"
                      disabled={isLoading.userUpdate}
                    >
                      <option value="null">No Role</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    {isLoading.userUpdate && (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolesPermissionsManagement;