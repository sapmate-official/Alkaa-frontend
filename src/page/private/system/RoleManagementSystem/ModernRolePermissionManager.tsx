import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
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
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Users, 
  Shield, 
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  Copy,
  Eye,
  Crown,
  Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  useRoles, useCreateRole, useUpdateRole, useDeleteRole,
  Role as TanStackRole, Permission as TanStackPermission
} from '@/hooks/queries/useRoles';
import { usePermissions as usePermissionsQuery, usePermissionPresets } from '@/hooks/queries/usePermissions';
import { useEmployees } from '@/hooks/queries/useEmployees';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PermissionGroup {
  category: string;
  permissions: TanStackPermission[];
}

interface LoadingStates {
  roles: boolean;
  permissions: boolean;
  users: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

const ModernRolePermissionManager = () => {
  // State management
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'assignments'>('roles');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<TanStackRole | null>(null);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isDeleteRoleOpen, setIsDeleteRoleOpen] = useState(false);
  const [isViewPermissionsOpen, setIsViewPermissionsOpen] = useState(false);
  
  // Form states
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
  
  // Loading states
  const [loading] = useState<LoadingStates>({
    roles: false,
    permissions: false,
    users: false,
    creating: false,
    updating: false,
    deleting: false
  });

  const { toast } = useToast();

  // TanStack Query hooks
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: permissions = [], isLoading: permissionsLoading } = usePermissionsQuery();
  const { data: users = [], isLoading: usersLoading } = useEmployees();
  const { data: permissionPresets = [] } = usePermissionPresets();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();

  // Fetch data on component mount
  useEffect(() => {
    // Data is automatically fetched by TanStack Query hooks
  }, []);

  // Update permission groups when permissions change
  useEffect(() => {
    if (permissions.length > 0) {
      setPermissionGroups(groupPermissionsByCategory(permissions));
    }
  }, [permissions]);

  // Group permissions by category
  const groupPermissionsByCategory = (permissions: TanStackPermission[]): PermissionGroup[] => {
    const groups: { [key: string]: TanStackPermission[] } = {};
    
    permissions.forEach(permission => {
      const category = permission.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
    });

    return Object.entries(groups).map(([category, perms]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      permissions: perms
    }));
  };

  // Get user count for a role
  const getUserCountForRole = (roleId: string) => {
    return users.filter((user: any) => 
      user.roles?.some((userRole: any) => userRole.roleId === roleId)
    ).length;
  };

  const copyRole = (role: TanStackRole) => {
    setNewRoleName(`${role.name} (Copy)`);
    setNewRoleDescription(role.description || '');
    setSelectedPermissions(role.permissions.map(p => p.id));
    setIsCreateRoleOpen(true);
  };

  const openEditRole = (role: TanStackRole) => {
    setSelectedRole(role);
    setEditedPermissions(role.permissions.map(p => p.id));
    setIsEditRoleOpen(true);
  };

  const openViewPermissions = (role: TanStackRole) => {
    setSelectedRole(role);
    setIsViewPermissionsOpen(true);
  };

  const createRole = async () => {
    if (!newRoleName.trim()) {
      toast({
        title: 'Error',
        description: 'Role name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createRoleMutation.mutateAsync({
        name: newRoleName,
        description: newRoleDescription,
        permissions: selectedPermissions
      });
      
      toast({
        title: 'Success',
        description: 'Role created successfully',
        variant: 'default'
      });

      // Reset form and close dialog
      setNewRoleName('');
      setNewRoleDescription('');
      setSelectedPermissions([]);
      setIsCreateRoleOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create role',
        variant: 'destructive'
      });
    }
  };

  const updateRole = async () => {
    if (!selectedRole) return;

    try {
      await updateRoleMutation.mutateAsync({ 
        id: selectedRole.id, 
        data: {
          name: selectedRole.name,
          description: selectedRole.description,
          permissions: editedPermissions
        }
      });

      toast({
        title: 'Success',
        description: 'Role updated successfully',
        variant: 'default'
      });

      setIsEditRoleOpen(false);
      setSelectedRole(null);
      setEditedPermissions([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive'
      });
    }
  };

  const deleteRole = async () => {
    if (!selectedRole) return;

    try {
      await deleteRoleMutation.mutateAsync(selectedRole.id);
      
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
        variant: 'default'
      });

      setIsDeleteRoleOpen(false);
      setSelectedRole(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete role',
        variant: 'destructive'
      });
    }
  };

  const handleSelectPreset = (permissionIds: string[]) => {
    if (isCreateRoleOpen) {
      setSelectedPermissions(permissionIds);
    } else if (isEditRoleOpen) {
      setEditedPermissions(permissionIds);
    }
  };

  const togglePermission = (permissionId: string) => {
    if (isCreateRoleOpen) {
      setSelectedPermissions(prev =>
        prev.includes(permissionId)
          ? prev.filter(id => id !== permissionId)
          : [...prev, permissionId]
      );
    } else if (isEditRoleOpen) {
      setEditedPermissions(prev =>
        prev.includes(permissionId)
          ? prev.filter(id => id !== permissionId)
          : [...prev, permissionId]
      );
    }
  };

  // Filter roles based on search term
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Role & Permission Manager
              </h1>
              <p className="text-slate-600 mt-2">
                Manage roles, permissions, and user assignments with advanced controls
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setIsCreateRoleOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Role
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search roles by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-200"
                />
              </div>
              <Button variant="outline" className="border-slate-200">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200 p-1 rounded-xl shadow-lg">
            <TabsTrigger value="roles" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg">
              <Shield className="mr-2 h-4 w-4" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="permissions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg">
              <Lock className="mr-2 h-4 w-4" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg">
              <Users className="mr-2 h-4 w-4" />
              Assignments
            </TabsTrigger>
          </TabsList>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Role Management
                </CardTitle>
                <CardDescription>
                  Create, edit, and manage roles with their associated permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rolesLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200">
                          <TableHead className="font-semibold">Role Name</TableHead>
                          <TableHead className="font-semibold">Description</TableHead>
                          <TableHead className="font-semibold">Permissions</TableHead>
                          <TableHead className="font-semibold">Users</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRoles.map((role) => (
                          <TableRow key={role.id} className="border-slate-100 hover:bg-slate-50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {role.isDefault && <Crown className="h-4 w-4 text-yellow-500" />}
                                {role.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {role.description || 'No description'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                {role.permissions.length} permissions
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-slate-300">
                                {getUserCountForRole(role.id)} users
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={role.isDefault ? "default" : "secondary"}
                                className={role.isDefault ? "bg-green-100 text-green-700" : ""}
                              >
                                {role.isDefault ? 'Default' : 'Custom'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openViewPermissions(role)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Permissions
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditRole(role)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Role
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => copyRole(role)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate Role
                                  </DropdownMenuItem>
                                  {!role.isDefault && (
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setSelectedRole(role);
                                        setIsDeleteRoleOpen(true);
                                      }}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Role
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                {!loading.roles && filteredRoles.length === 0 && (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg">No roles found</p>
                    <p className="text-slate-400">Create your first role to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Lock className="h-5 w-5 text-purple-600" />
                  Permission Overview
                </CardTitle>
                <CardDescription>
                  View all available permissions organized by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                {permissionsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {permissionGroups.map((group) => (
                      <Card key={group.category} className="border border-slate-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{group.category}</CardTitle>
                          <Badge variant="outline" className="w-fit">
                            {group.permissions.length} permissions
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {group.permissions.map((permission) => (
                              <div 
                                key={permission.id}
                                className="p-3 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                              >
                                <div className="font-medium text-sm">{permission.name}</div>
                                {permission.description && (
                                  <div className="text-xs text-slate-600 mt-1">{permission.description}</div>
                                )}
                                <Badge variant="outline" className="text-xs mt-2">
                                  {permission.action}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-5 w-5 text-green-600" />
                  User Role Assignments
                </CardTitle>
                <CardDescription>
                  View and manage user role assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200">
                          <TableHead className="font-semibold">User</TableHead>
                          <TableHead className="font-semibold">Email</TableHead>
                          <TableHead className="font-semibold">Department</TableHead>
                          <TableHead className="font-semibold">Assigned Roles</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id} className="border-slate-100 hover:bg-slate-50">
                            <TableCell className="font-medium">
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell className="text-slate-600">{user.email}</TableCell>
                            <TableCell>
                              {user.department?.name || 'No Department'}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {user.roles?.map((userRole) => (
                                  <Badge key={userRole.role.id} variant="secondary" className="text-xs">
                                    {roles.find(r => r.id === userRole.role.id)?.name || 'Unknown Role'}
                                  </Badge>
                                )) || (
                                  <Badge variant="outline" className="text-xs">No roles assigned</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={user.status === 'active' ? "default" : "secondary"}
                                className={user.status === 'active' ? "bg-green-100 text-green-700" : ""}
                              >
                                {user.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Role Dialog */}
        <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Create New Role</DialogTitle>
              <DialogDescription>
                Define a new role with specific permissions for your organization
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roleName">Role Name *</Label>
                  <Input
                    id="roleName"
                    placeholder="e.g., HR Manager, Developer"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preset">Quick Start (Optional)</Label>
                  <Select onValueChange={(value) => {
                    const preset = permissionPresets.find(p => p.id === value);
                    if (preset) {
                      handleSelectPreset(preset.permissions.map(p => p.id));
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {permissionPresets.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="roleDescription">Description</Label>
                <Textarea
                  id="roleDescription"
                  placeholder="Describe the role's responsibilities and scope"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Permissions</Label>
                  <Badge variant="secondary">
                    {selectedPermissions.length} selected
                  </Badge>
                </div>
                
                <div className="border border-slate-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {permissionGroups.map((group) => (
                    <div key={group.category} className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-slate-700">{group.category}</h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const groupPermissionIds = group.permissions.map(p => p.id);
                              setSelectedPermissions(prev => [...new Set([...prev, ...groupPermissionIds])]);
                            }}
                          >
                            Select All
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const groupPermissionIds = group.permissions.map(p => p.id);
                              setSelectedPermissions(prev => prev.filter(id => !groupPermissionIds.includes(id)));
                            }}
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {group.permissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded">
                            <Checkbox
                              id={`create-${permission.id}`}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <label htmlFor={`create-${permission.id}`} className="text-sm cursor-pointer flex-1">
                              <div className="font-medium">{permission.name}</div>
                              {permission.description && (
                                <div className="text-xs text-slate-500">{permission.description}</div>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateRoleOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createRole} disabled={loading.creating || !newRoleName.trim()}>
                {loading.creating ? 'Creating...' : 'Create Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Edit Role: {selectedRole?.name}</DialogTitle>
              <DialogDescription>
                Modify permissions for this role
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Permissions</Label>
                  <Badge variant="secondary">
                    {editedPermissions.length} selected
                  </Badge>
                </div>
                
                <div className="border border-slate-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {permissionGroups.map((group) => (
                    <div key={group.category} className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-slate-700">{group.category}</h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const groupPermissionIds = group.permissions.map(p => p.id);
                              setEditedPermissions(prev => [...new Set([...prev, ...groupPermissionIds])]);
                            }}
                          >
                            Select All
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const groupPermissionIds = group.permissions.map(p => p.id);
                              setEditedPermissions(prev => prev.filter(id => !groupPermissionIds.includes(id)));
                            }}
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {group.permissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded">
                            <Checkbox
                              id={`edit-${permission.id}`}
                              checked={editedPermissions.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <label htmlFor={`edit-${permission.id}`} className="text-sm cursor-pointer flex-1">
                              <div className="font-medium">{permission.name}</div>
                              {permission.description && (
                                <div className="text-xs text-slate-500">{permission.description}</div>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateRole} disabled={loading.updating}>
                {loading.updating ? 'Updating...' : 'Update Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Permissions Dialog */}
        <Dialog open={isViewPermissionsOpen} onOpenChange={setIsViewPermissionsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Role Permissions: {selectedRole?.name}</DialogTitle>
              <DialogDescription>
                View all permissions assigned to this role
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {selectedRole && (
                <div className="space-y-4">
                  {permissionGroups.map((group) => {
                    const rolePermissions = selectedRole.permissions.map(p => p.id);
                    const groupRolePermissions = group.permissions.filter(p => rolePermissions.includes(p.id));
                    
                    if (groupRolePermissions.length === 0) return null;
                    
                    return (
                      <div key={group.category} className="border border-slate-200 rounded-lg p-4">
                        <h4 className="font-medium text-slate-700 mb-3">{group.category}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {groupRolePermissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <div className="text-sm">
                                <div className="font-medium">{permission.name}</div>
                                {permission.description && (
                                  <div className="text-xs text-slate-500">{permission.description}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setIsViewPermissionsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Role Confirmation */}
        <AlertDialog open={isDeleteRoleOpen} onOpenChange={setIsDeleteRoleOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Role</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the role "{selectedRole?.name}"? This action cannot be undone.
                All users with this role will lose their associated permissions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteRole}
                className="bg-red-600 hover:bg-red-700"
                disabled={loading.deleting}
              >
                {loading.deleting ? 'Deleting...' : 'Delete Role'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ModernRolePermissionManager;
