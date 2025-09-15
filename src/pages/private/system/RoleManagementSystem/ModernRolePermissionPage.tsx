import { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
  Key,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { APIDictionary } from '@/services/api/v2/APIdict';
import { useAuth } from '@/providers/AuthContext';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Permission, Role, User } from '@/types/general';

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
  const [filterType, setFilterType] = useState<'all' | 'default' | 'custom'>('all');
  
  // New role dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  
  // Edit role dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithStats | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDescription, setEditRoleDescription] = useState('');
  const [editRolePermissions, setEditRolePermissions] = useState<string[]>([]);
  
  // User role management state
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleForUser, setSelectedRoleForUser] = useState<string>('');
  
  // Permission search state
  const [permissionSearchTerm, setPermissionSearchTerm] = useState('');
  const [editPermissionSearchTerm, setEditPermissionSearchTerm] = useState('');
  

  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(24); // Show 24 users per page for better performance
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Debounced search state
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  

  const { user } = useAuth();
  const { toast } = useToast();

  // Define calculateUserCounts before useEffect
  const calculateUserCounts = useCallback(() => {
    setRoles(prevRoles => 
      prevRoles.map(role => {
        const userCount = users.filter(user => 
          user.roles?.some(userRole => userRole.role?.id === role.id)
        ).length;
        
        return {
          ...role,
          userCount
        };
      })
    );
  }, [users]);

  useEffect(() => {
    fetchData();
  }, []);


  // Debounce search term to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);


  // Calculate user counts whenever users change
  useEffect(() => {
    if (roles.length > 0 && users.length > 0) {
      calculateUserCounts();
    }
  }, [users, calculateUserCounts]);


  // Clear search term when switching tabs
  useEffect(() => {
    setSearchTerm('');
  }, [selectedTab]);


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
      setRoles(response.data.map((role: Role) => ({
        ...role,
        userCount: 0, // Will be calculated after users are fetched
        lastModified: new Date().toISOString(),
        isDefault: role.isDefault || false
      })));
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
      console.error('Error fetching users:', error);
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
        permissions: newRolePermissions.map(id => ({ permissionId: id }))
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
      setPermissionSearchTerm(''); // Clear search term
      setIsCreateDialogOpen(false);
      
      // Refresh data
      fetchRoles();
    } catch (error: any) {
      // Enhanced error handling for new backend validation
      const errorMessage = error?.response?.data?.message || 'Failed to create role';
      const invalidIds = error?.response?.data?.invalidIds;
      
      toast({
        title: 'Error',
        description: invalidIds 
          ? `${errorMessage}. Invalid permission IDs: ${invalidIds.join(', ')}`
          : errorMessage,
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

  const handleEditPermissionToggle = (permissionId: string) => {
    setEditRolePermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const openEditDialog = (role: RoleWithStats) => {
    setEditingRole(role);
    setEditRoleName(role.name);
    setEditRoleDescription(role.description || '');
    setEditRolePermissions(role.permissions.map(p => p.permission.id));
    setEditPermissionSearchTerm(''); // Clear search term
    setIsEditDialogOpen(true);
  };

  const updateRole = async () => {
    if (!editingRole || !editRoleName.trim()) {
      toast({
        title: 'Error',
        description: 'Role name is required',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        name: editRoleName,
        description: editRoleDescription,
        permissions: editRolePermissions.map(id => ({ permissionId: id })),
        updateType: 'replace'
      };
      
      await axios.put(`${APIDictionary.role}/${editingRole.id}`, updateData);
      toast({
        title: 'Success',
        description: 'Role updated successfully',
        variant: 'default'
      });
      
      // Reset form and close dialog
      setIsEditDialogOpen(false);
      setEditingRole(null);
      setEditRoleName('');
      setEditRoleDescription('');
      setEditRolePermissions([]);
      setEditPermissionSearchTerm(''); // Clear search term
      
      // Refresh data
      fetchRoles();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to update role';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateRole = async (role: RoleWithStats) => {
    const newName = `${role.name} (Copy)`;
    setIsLoading(true);
    try {
      const newRole = {
        name: newName,
        description: role.description,
        orgId: user?.orgId ?? '',
        isDefault: false,
        permissions: role.permissions.map(p => ({ permissionId: p.permission.id }))
      };
      
      await axios.post(APIDictionary.role, newRole);
      toast({
        title: 'Success',
        description: 'Role duplicated successfully',
        variant: 'default'
      });
      
      fetchRoles();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to duplicate role';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };


  const openChangeRoleDialog = useCallback((user: User) => {
    setSelectedUser(user);
    setSelectedRoleForUser(user.roles?.[0]?.role?.id || 'no-role');
    setIsChangeRoleDialogOpen(true);
  }, []);

  const changeUserRole = async () => {
    if (!selectedUser || !selectedRoleForUser || selectedRoleForUser === 'no-role') {
      if (selectedUser && selectedRoleForUser === 'no-role') {
        // Handle removing role (setting to no role)
        setIsLoading(true);
        try {
          // Remove existing user roles
          if (selectedUser.roles && selectedUser.roles.length > 0) {
            for (const userRole of selectedUser.roles) {
              await axios.delete(`${APIDictionary.user_role}/${userRole.id}`);
            }
          }

          toast({
            title: 'Success',
            description: 'User role removed successfully',
            variant: 'default'
          });
          
          setIsChangeRoleDialogOpen(false);
          setSelectedUser(null);
          setSelectedRoleForUser('');

          // Refresh data efficiently - only update the modified user
          await fetchUsers();

          return;
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || 'Failed to remove user role';
          
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive'
          });
          setIsLoading(false);
          return;

        } finally {
          setIsLoading(false);

        }
      }
      
      toast({
        title: 'Error',
        description: 'Please select a role',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // First, remove existing user roles
      if (selectedUser.roles && selectedUser.roles.length > 0) {
        for (const userRole of selectedUser.roles) {
          await axios.delete(`${APIDictionary.user_role}/${userRole.id}`);
        }
      }

      // Then add the new role
      await axios.post(APIDictionary.user_role, {
        userId: selectedUser.id,
        roleId: selectedRoleForUser
      });

      toast({
        title: 'Success',
        description: 'User role updated successfully',
        variant: 'default'
      });
      
      setIsChangeRoleDialogOpen(false);
      setSelectedUser(null);
      setSelectedRoleForUser('');
      

      // Refresh data efficiently
      await fetchUsers();

    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to update user role';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };



  const exportRoles = () => {
    try {
      const exportData = {
        roles: roles.map(role => ({
          name: role.name,
          description: role.description,
          permissions: role.permissions.map(p => p.permission.name),
          isDefault: role.isDefault
        })),
        exportDate: new Date().toISOString(),
        organization: user?.orgId
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `roles_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Roles exported successfully',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export roles',
        variant: 'destructive'
      });
    }
  };

  const importRoles = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importData = JSON.parse(e.target?.result as string);
            // For now, just show the imported data structure
            console.log('Import data:', importData);
            toast({
              title: 'Import Feature',
              description: 'Import functionality will be implemented based on requirements',
              variant: 'default'
            });
          } catch (error) {
            toast({
              title: 'Error',
              description: 'Invalid JSON file format',
              variant: 'destructive'
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Future bulk operations placeholder
  // const handleBulkSelect = () => {
  //   console.log('Bulk select functionality to be implemented');
  // };

  // Filter permissions based on search term
  const getFilteredPermissionGroups = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return permissionGroups;
    }


    return permissionGroups.map(group => ({
      ...group,
      permissions: group.permissions.filter(permission =>
        permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(group => group.permissions.length > 0);
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'default' && role.isDefault) ||
      (filterType === 'custom' && !role.isDefault);
      
    return matchesSearch && matchesFilter;
  });

  // Memoized filtered users for better performance
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [users, debouncedSearchTerm]);

  // Memoized paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, usersPerPage]);

  // Update total users count when filtered users change
  useEffect(() => {
    setTotalUsers(filteredUsers.length);
  }, [filteredUsers]);

  // Calculate total pages
  const totalPages = Math.ceil(totalUsers / usersPerPage);

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
              <DropdownMenuItem onClick={() => openEditDialog(role)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Role
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicateRole(role)}>
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

  const UserRoleCard = memo(({ user }: { user: User }) => {
    const userRole = user.roles?.[0]?.role;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium truncate">{user.firstName} {user.lastName}</h4>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openChangeRoleDialog(user)}>
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
            
            <div className="flex items-center justify-center">
              {userRole ? (
                <Badge variant="outline" className={`${getRoleColor(userRole.name)} truncate max-w-full`}>
                  {userRole.name}
                </Badge>
              ) : (
                <Badge variant="secondary">No Role</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  });

  // Pagination component
  const PaginationControls = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 space-y-4 sm:space-y-0">
      <div className="flex items-center space-x-4">
        <div className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select
            value={usersPerPage.toString()}
            onValueChange={(value) => {
              setUsersPerPage(Number(value));
              setCurrentPage(1); // Reset to first page when changing page size
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="48">48</SelectItem>
              <SelectItem value="96">96</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNumber;
            if (totalPages <= 5) {
              pageNumber = i + 1;
            } else if (currentPage <= 3) {
              pageNumber = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNumber = totalPages - 4 + i;
            } else {
              pageNumber = currentPage - 2 + i;
            }
            
            return (
              <Button
                key={pageNumber}
                variant={currentPage === pageNumber ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(pageNumber)}
                className="w-8 h-8 p-0"
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <ScrollArea className="h-screen w-full">

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
            <Button variant="outline" size="sm" onClick={exportRoles}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={importRoles}>
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
                    <div className="mt-2 space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search permissions..."
                          value={permissionSearchTerm}
                          onChange={(e) => setPermissionSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      <ScrollArea className="h-64 border rounded-md p-4">
                        {getFilteredPermissionGroups(permissionSearchTerm).map((group) => (
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
                        {getFilteredPermissionGroups(permissionSearchTerm).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No permissions found</p>
                            <p className="text-xs">Try adjusting your search terms</p>
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => {
                      setIsCreateDialogOpen(false);
                      setPermissionSearchTerm('');
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={createRole} disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Role'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Role Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Edit Role</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-role-name">Role Name</Label>
                      <Input
                        id="edit-role-name"
                        value={editRoleName}
                        onChange={(e) => setEditRoleName(e.target.value)}
                        placeholder="Enter role name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-role-description">Description</Label>
                      <Input
                        id="edit-role-description"
                        value={editRoleDescription}
                        onChange={(e) => setEditRoleDescription(e.target.value)}
                        placeholder="Enter role description"
                      />
                    </div>
                  </div>
                  

                  <Separator />
                  
                  <div>
                    <Label>Permissions</Label>
                    <div className="mt-2 space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search permissions..."

                          value={editPermissionSearchTerm}
                          onChange={(e) => setEditPermissionSearchTerm(e.target.value)}

                          className="pl-8"
                        />
                      </div>
                      <ScrollArea className="h-64 border rounded-md p-4">

                        {getFilteredPermissionGroups(editPermissionSearchTerm).map((group) => (

                          <div key={group.category} className="mb-4">
                            <h4 className="font-medium text-sm mb-2">{group.category}</h4>
                            <div className="space-y-2 pl-4">
                              {group.permissions.map((permission) => (
                                <div key={permission.id} className="flex items-center space-x-2">
                                  <Switch

                                    id={`edit-perm-${permission.id}`}
                                    checked={editRolePermissions.includes(permission.id)}
                                    onCheckedChange={() => handleEditPermissionToggle(permission.id)}
                                  />
                                  <Label htmlFor={`edit-perm-${permission.id}`} className="text-sm">

                                    {permission.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {getFilteredPermissionGroups(editPermissionSearchTerm).length === 0 && (

                          <div className="text-center py-8 text-muted-foreground">
                            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No permissions found</p>
                            <p className="text-xs">Try adjusting your search terms</p>
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => {

                      setIsEditDialogOpen(false);
                      setEditPermissionSearchTerm('');
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={updateRole} disabled={isLoading}>
                      {isLoading ? 'Updating...' : 'Update Role'}

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
                  <p className="text-2xl font-bold">{selectedTab === 'users' && debouncedSearchTerm ? totalUsers : users.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedTab === 'users' && debouncedSearchTerm ? 'Filtered Users' : 'Total Users'}
                  </p>
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
                {selectedTab === 'users' && searchTerm !== debouncedSearchTerm && (
                  <div className="absolute right-2 top-2.5">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterType('all')}>
                    <span className="flex items-center">
                      {filterType === 'all' && <Check className="h-4 w-4 mr-2" />}
                      All Roles
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('default')}>
                    <span className="flex items-center">
                      {filterType === 'default' && <Check className="h-4 w-4 mr-2" />}
                      Default Roles
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('custom')}>
                    <span className="flex items-center">
                      {filterType === 'custom' && <Check className="h-4 w-4 mr-2" />}
                      Custom Roles
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <TabsContent value="roles" className="space-y-4">
            {filteredRoles.length === 0 ? (
              <div className="w-full">
                <Card className="w-full">
                  <CardContent className="flex flex-col items-center justify-center py-12 px-6">
                    <Shield className="h-16 w-16 text-muted-foreground mb-6" />
                    <h3 className="text-xl font-semibold mb-2">No roles found</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      {searchTerm ? 'Try adjusting your search terms or filter settings.' : 'Create your first role to get started with managing permissions.'}
                    </p>
                    {!searchTerm && (
                      <div className="mt-6">
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Role
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
                {filteredRoles.map((role) => (
                  <RoleCard key={role.id} role={role} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div className="space-y-1 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {paginatedUsers.map((user) => (
                    <UserRoleCard key={user.id} user={user} />
                  ))}
                </div>
                
                {paginatedUsers.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No users found</h3>
                      <p className="text-muted-foreground text-center">
                        {debouncedSearchTerm ? 'Try adjusting your search terms.' : 'No users available.'}
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {totalUsers > usersPerPage && <PaginationControls />}
              </>
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
                  <Button onClick={() => {
                    setSelectedRole(null);
                    openEditDialog(selectedRole);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Role
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}


        {/* Change User Role Dialog */}
        <Dialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <Label>User</Label>
                  <div className="flex items-center space-x-3 mt-2 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="role-select">Select Role</Label>
                  <Select 
                    value={selectedRoleForUser} 
                    onValueChange={setSelectedRoleForUser}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-role">No Role</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4" />
                            <span>{role.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsChangeRoleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={changeUserRole} disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Role'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

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
    </ScrollArea>
  );
};

export default ModernRolePermissionPage;
