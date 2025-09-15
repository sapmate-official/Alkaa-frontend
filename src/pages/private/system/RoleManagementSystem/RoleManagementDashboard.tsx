import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Trash2, Edit, PlusCircle, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/providers/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
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

// Constants for pagination
const USERS_PER_PAGE = 50;
const PERMISSIONS_PER_PAGE = 20;

const RolesPermissionsManagement = () => {
  // State for UI
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [createPermissionSearch, setCreatePermissionSearch] = useState('');
  
  // Pagination states
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [permissionCurrentPage, setPermissionCurrentPage] = useState(1);
  const [createPermissionCurrentPage, setCreatePermissionCurrentPage] = useState(1);

  // Hooks
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Debounced search values for better performance
  const debouncedUserSearch = useDebounce(userSearchQuery, 300);
  const debouncedPermissionSearch = useDebounce(permissionSearch, 300);
  const debouncedCreatePermissionSearch = useDebounce(createPermissionSearch, 300);

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

  // Memoized filtered users with search and pagination
  const filteredAndPaginatedUsers = useMemo(() => {
    const filtered = users.filter(user => 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(debouncedUserSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(debouncedUserSearch.toLowerCase())
    );
    
    const startIndex = (userCurrentPage - 1) * USERS_PER_PAGE;
    const endIndex = startIndex + USERS_PER_PAGE;
    
    return {
      users: filtered.slice(startIndex, endIndex),
      totalUsers: filtered.length,
      totalPages: Math.ceil(filtered.length / USERS_PER_PAGE)
    };
  }, [users, debouncedUserSearch, userCurrentPage]);

  // Memoized filtered permissions for editing
  const filteredPermissions = useMemo(() => {
    const filtered = permissions.filter(permission => 
      permission.name.toLowerCase().includes(debouncedPermissionSearch.toLowerCase())
    );
    
    const startIndex = (permissionCurrentPage - 1) * PERMISSIONS_PER_PAGE;
    const endIndex = startIndex + PERMISSIONS_PER_PAGE;
    
    return {
      permissions: filtered.slice(startIndex, endIndex),
      totalPermissions: filtered.length,
      totalPages: Math.ceil(filtered.length / PERMISSIONS_PER_PAGE)
    };
  }, [permissions, debouncedPermissionSearch, permissionCurrentPage]);

  // Memoized filtered permissions for creating roles
  const filteredCreatePermissions = useMemo(() => {
    const filtered = permissions.filter(permission => 
      permission.name.toLowerCase().includes(debouncedCreatePermissionSearch.toLowerCase())
    );
    
    const startIndex = (createPermissionCurrentPage - 1) * PERMISSIONS_PER_PAGE;
    const endIndex = startIndex + PERMISSIONS_PER_PAGE;
    
    return {
      permissions: filtered.slice(startIndex, endIndex),
      totalPermissions: filtered.length,
      totalPages: Math.ceil(filtered.length / PERMISSIONS_PER_PAGE)
    };
  }, [permissions, debouncedCreatePermissionSearch, createPermissionCurrentPage]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleSelectPreset = useCallback((permissionIds: string[]) => {
    // When creating a new role
    if (isCreateRoleDialogOpen) {
      setNewRolePermissions(permissionIds);
    }
    // When editing an existing role
    else if (selectedRole) {
      setEditedPermissions(permissionIds);
    }
  }, [isCreateRoleDialogOpen, selectedRole]);

  // Debounced search handlers
  const handleUserSearch = useCallback((query: string) => {
    setUserSearchQuery(query);
    setUserCurrentPage(1); // Reset to first page when searching
  }, []);

  const handlePermissionSearch = useCallback((query: string) => {
    setPermissionSearch(query);
    setPermissionCurrentPage(1);
  }, []);

  const handleCreatePermissionSearch = useCallback((query: string) => {
    setCreatePermissionSearch(query);
    setCreatePermissionCurrentPage(1);
  }, []);

  // Create role handler
  const createRole = useCallback(async () => {
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
      setCreatePermissionCurrentPage(1);
      setCreatePermissionSearch('');
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to create role',
        variant: 'destructive'
      });
    }
  }, [createRoleMutation, user?.orgId, newRoleName, newRolePermissions, toast]);

  // Update role permissions handler
  const handleSavePermissions = useCallback(async () => {
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
      setPermissionCurrentPage(1);
      setPermissionSearch('');
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive'
      });
    }
  }, [selectedRole, updateRoleMutation, editedPermissions, toast]);

  // Delete role handler
  const handleDeleteRole = useCallback(async (roleId: string) => {
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
  }, [deleteRoleMutation, toast]);

  // User role change handler with optimized API call
  const handleUserRoleChange = useCallback(async (userId: string, prevRoleId: string, roleId: string) => {
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
  }, [toast]);

  const handleRolePermissionToggle = useCallback((permissionId: string) => {
    setEditedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  }, []);

  const LoadingButton = ({ loading, children, ...props }: LoadingButtonProps) => (
    <Button disabled={loading} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );

  // Pagination component
  const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    totalItems, 
    itemsPerPage 
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
  }) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex items-center justify-between px-2 py-3">
        <div className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {totalItems} entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Filter permissions based on search query
  const getUserRoleName = (user: User) => {
    return user.roles?.[0]?.role.name ?? 'No Role';
  };

  const getCurrentRoleId = (user: User) => {
    return user.roles?.[0]?.roleId ?? '';
  };
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
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setNewRolePermissions(filteredCreatePermissions.permissions.map(p => p.id))}
                >
                  Select All ({filteredCreatePermissions.permissions.length})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setNewRolePermissions([])}
                >
                  Clear All
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search permissions..." 
                className="pl-8"
                value={createPermissionSearch}
                onChange={(e) => handleCreatePermissionSearch(e.target.value)}
              />
            </div>
            <div className="h-[300px] md:h-[400px] overflow-y-auto border rounded">
              <div className="p-2">
                {filteredCreatePermissions.permissions.map(permission => (
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
                {filteredCreatePermissions.permissions.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No permissions found matching your search
                  </div>
                )}
              </div>
              {filteredCreatePermissions.totalPages > 1 && (
                <PaginationControls
                  currentPage={createPermissionCurrentPage}
                  totalPages={filteredCreatePermissions.totalPages}
                  onPageChange={setCreatePermissionCurrentPage}
                  totalItems={filteredCreatePermissions.totalPermissions}
                  itemsPerPage={PERMISSIONS_PER_PAGE}
                />
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
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setEditedPermissions(filteredPermissions.permissions.map(p => p.id))}
              >
                Select All ({filteredPermissions.permissions.length})
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setEditedPermissions([])}
              >
                Clear All
              </Button>
            </div>
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search permissions..." 
              className="pl-8"
              value={permissionSearch}
              onChange={(e) => handlePermissionSearch(e.target.value)}
            />
          </div>
          <div className="h-[300px] md:h-[400px] overflow-y-auto border rounded">
            <div className="p-2">
              {filteredPermissions.permissions.map(permission => (
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
              {filteredPermissions.permissions.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No permissions found matching your search
                </div>
              )}
            </div>
            {filteredPermissions.totalPages > 1 && (
              <PaginationControls
                currentPage={permissionCurrentPage}
                totalPages={filteredPermissions.totalPages}
                onPageChange={setPermissionCurrentPage}
                totalItems={filteredPermissions.totalPermissions}
                itemsPerPage={PERMISSIONS_PER_PAGE}
              />
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
          <CardTitle className="flex justify-between items-center">
            User Role Assignment
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  className="pl-8 w-64"
                  value={userSearchQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : (
            <>
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
                  {filteredAndPaginatedUsers.users.map(user => (
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
              {filteredAndPaginatedUsers.totalPages > 1 && (
                <PaginationControls
                  currentPage={userCurrentPage}
                  totalPages={filteredAndPaginatedUsers.totalPages}
                  onPageChange={setUserCurrentPage}
                  totalItems={filteredAndPaginatedUsers.totalUsers}
                  itemsPerPage={USERS_PER_PAGE}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RolesPermissionsManagement;