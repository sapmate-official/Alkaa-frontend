import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Shield, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  MoreVertical,
  Eye,
  Copy,
  UserCheck,
  Filter,
  Download,
  Upload,
  Activity,
  Check,
  Crown,
  UserPlus,
  Key
} from 'lucide-react';
import { APIDictionary } from '@/services/api/v2/APIdict';
import { useAuth } from '@/providers/AuthContext';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Permission, Role, User } from '@/types/general';
import RouteDict from '@/routes/RouteDict';
import { useNavigate } from 'react-router-dom';

interface RoleWithStats extends Role {
  userCount: number;
  isDefault: boolean;
  lastModified?: string;
}

interface PermissionGroup {
  category: string;
  permissions: Permission[];
}

const ModernRolePermissionPage = () => {
  const [roles, setRoles] = useState<RoleWithStats[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleWithStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('roles');
  const [isLoading, setIsLoading] = useState(false);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  
  // New role dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchRoles(),
        fetchUsers(),
        fetchPermissions()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${APIDictionary.role}/org/${user?.orgId}`);
      const rolesWithStats = response.data.map((role: Role) => ({
        ...role,
        userCount: Math.floor(Math.random() * 50), // Mock data - replace with actual
        lastModified: new Date().toISOString(),
        isDefault: role.isDefault || false
      }));
      setRoles(rolesWithStats);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch roles',
        variant: 'destructive'
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${APIDictionary.user}/org/${user?.orgId}`, {
        withCredentials: true
      });
      setUsers(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      });
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await axios.get(`${APIDictionary.permission}/org/${user?.orgId}`);
      setPermissions(response.data);
      
      // Group permissions by category (mock categorization)
      const groups = groupPermissionsByCategory(response.data);
      setPermissionGroups(groups);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch permissions',
        variant: 'destructive'
      });
    }
  };

  const groupPermissionsByCategory = (permissions: Permission[]): PermissionGroup[] => {
    const categories: { [key: string]: Permission[] } = {};
    
    permissions.forEach(permission => {
      const category = permission.name.split('_')[0] || 'General';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(permission);
    });

    return Object.entries(categories).map(([category, perms]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      permissions: perms
    }));
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

    setIsLoading(true);
    try {
      const newRole = {
        name: newRoleName,
        description: newRoleDescription,
        orgId: user?.orgId ?? '',
        isDefault: false,
        permissionIds: newRolePermissions
      };
      
      await axios.post(APIDictionary.role, newRole);
      toast({
        title: 'Success',
        description: 'Role created successfully',
        variant: 'default'
      });
      
      // Reset form and close dialog
      setNewRoleName('');
      setNewRoleDescription('');
      setNewRolePermissions([]);
      setIsCreateDialogOpen(false);
      
      // Refresh data
      fetchRoles();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create role',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRole = async (roleId: string) => {
    setIsLoading(true);
    try {
      await axios.delete(`${APIDictionary.role}/${roleId}`);
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
        variant: 'default'
      });
      fetchRoles();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete role',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setDeleteRoleId(null);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setNewRolePermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Future bulk operations placeholder
  // const handleBulkSelect = () => {
  //   console.log('Bulk select functionality to be implemented');
  // };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (roleName: string) => {
    const colors = {
      'admin': 'bg-red-100 text-red-800 border-red-200',
      'manager': 'bg-blue-100 text-blue-800 border-blue-200',
      'employee': 'bg-green-100 text-green-800 border-green-200',
      'hr': 'bg-purple-100 text-purple-800 border-purple-200',
      'default': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    const lowerName = roleName.toLowerCase();
    for (const [key, color] of Object.entries(colors)) {
      if (lowerName.includes(key)) return color;
    }
    return colors.default;
  };

  const RoleCard = ({ role }: { role: RoleWithStats }) => (
    <Card className="relative group hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{role.name}</CardTitle>
              <CardDescription className="text-sm">
                {role.userCount} users • {role.permissions.length} permissions
              </CardDescription>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedRole(role)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(RouteDict.Role.Edit.replace(':id', role.id))}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Role
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate Role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteRoleId(role.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Role
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {role.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {role.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={getRoleColor(role.name)}>
              {role.isDefault ? <Crown className="h-3 w-3 mr-1" /> : <Key className="h-3 w-3 mr-1" />}
              {role.isDefault ? 'Default' : 'Custom'}
            </Badge>
            
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span>{new Date(role.lastModified || '').toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const UserRoleCard = ({ user }: { user: User }) => {
    const userRole = user.roles?.[0]?.role;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">{user.firstName} {user.lastName}</h4>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {userRole ? (
                <Badge variant="outline" className={getRoleColor(userRole.name)}>
                  {userRole.name}
                </Badge>
              ) : (
                <Badge variant="secondary">No Role</Badge>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Change Role
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6  mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role & Permission Management</h1>
          <p className="text-muted-foreground">
            Manage user roles, permissions, and access control across your organization
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role-name">Role Name</Label>
                    <Input
                      id="role-name"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="Enter role name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="role-description">Description</Label>
                    <Input
                      id="role-description"
                      value={newRoleDescription}
                      onChange={(e) => setNewRoleDescription(e.target.value)}
                      placeholder="Enter role description"
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label>Permissions</Label>
                  <ScrollArea className="h-64 mt-2 border rounded-md p-4">
                    {permissionGroups.map((group) => (
                      <div key={group.category} className="mb-4">
                        <h4 className="font-medium text-sm mb-2">{group.category}</h4>
                        <div className="space-y-2 pl-4">
                          {group.permissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Switch
                                id={`perm-${permission.id}`}
                                checked={newRolePermissions.includes(permission.id)}
                                onCheckedChange={() => handlePermissionToggle(permission.id)}
                              />
                              <Label htmlFor={`perm-${permission.id}`} className="text-sm">
                                {permission.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createRole} disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Role'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{roles.length}</p>
                <p className="text-xs text-muted-foreground">Total Roles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Key className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{permissions.length}</p>
                <p className="text-xs text-muted-foreground">Permissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{users.filter(u => !u.roles?.length).length}</p>
                <p className="text-xs text-muted-foreground">Unassigned Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <TabsList className="grid w-full sm:w-auto grid-cols-2">
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={selectedTab === 'roles' ? 'Search roles...' : 'Search users...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full sm:w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </div>
          
          {filteredRoles.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No roles found</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Create your first role to get started.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.map((user) => (
              <UserRoleCard key={user.id} user={user} />
            ))}
          </div>
          
          {filteredUsers.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No users found</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm ? 'Try adjusting your search terms.' : 'No users available.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Role Details Dialog */}
      {selectedRole && (
        <Dialog open={!!selectedRole} onOpenChange={() => setSelectedRole(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>{selectedRole.name}</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Permissions ({selectedRole.permissions.length})</h4>
                <ScrollArea className="h-64 border rounded-md p-4">
                  <div className="space-y-2">
                    {selectedRole.permissions.map((perm) => (
                      <div key={perm.permissionId} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{perm.permission.name}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedRole(null)}>
                  Close
                </Button>
                <Button onClick={() => navigate(RouteDict.Role.Edit.replace(':id', selectedRole.id))}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Role
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRoleId} onOpenChange={() => setDeleteRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the role and remove all associated permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRoleId && deleteRole(deleteRoleId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ModernRolePermissionPage;
