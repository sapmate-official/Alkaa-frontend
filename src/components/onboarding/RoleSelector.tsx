import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, User, Shield, Users, AlertCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/services/AuthContext';
import { APIDictionary } from '@/api/v2/APIdict';
import axios from 'axios';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: { permission: { id: string; name: string; description: string; module?: string } }[];
}

interface Permission {
  id: string;
  name: string;
  description: string;
  module?: string;
}

interface RoleSelectorProps {
  value: string;
  onChange: (roleId: string) => void;
  onRoleCreated?: () => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ value, onChange, onRoleCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState('existing');
  const [isCreating, setIsCreating] = useState(false);
  const [permissionsByModule, setPermissionsByModule] = useState<Record<string, Permission[]>>({});

  // Role presets based on common roles
  const rolePresets = [
    {
      name: 'Employee',
      description: 'Standard employee with basic permissions',
      permissions: ['view_personal_info_to_myself', 'mark_attendance', 'leave_request', 'view_salary_slip_to_myself']
    },
    {
      name: 'Manager',
      description: 'Department manager with team oversight',
      permissions: ['view_subordinates', 'approve_leave', 'see_team_details', 'manage_team']
    },
    {
      name: 'HR Executive',
      description: 'HR management capabilities',
      permissions: ['user_create', 'user_read', 'department_create', 'leave_manage']
    }
  ];

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${APIDictionary.role}/org/${user?.orgId}`, {
        withCredentials: true
      });
      setRoles(response.data || []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await axios.get(`${APIDictionary.Permission}`, { 
        withCredentials: true 
      });
      
      if (response.data && Array.isArray(response.data)) {
        setPermissions(response.data);
        
        // Group permissions by module
        const byModule: Record<string, Permission[]> = {};
        response.data.forEach((permission: Permission) => {
          const module = permission.module || 'Other';
          if (!byModule[module]) {
            byModule[module] = [];
          }
          byModule[module].push(permission);
        });
        setPermissionsByModule(byModule);
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName || selectedPermissions.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a role name and select at least one permission',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await axios.post(`${APIDictionary.role}`, {
        orgId: user?.orgId,
        name: newRoleName,
        description: newRoleDescription,
        permissions: selectedPermissions.map(permissionId => ({ permissionId }))
      }, { withCredentials: true });

      const newRoleId = response.data?.id;
      
      toast({
        title: 'Success',
        description: 'Role created successfully'
      });

      // Reset form
      setNewRoleName('');
      setNewRoleDescription('');
      setSelectedPermissions([]);
      setIsCreateDialogOpen(false);
      
      // Refresh roles and select the new one
      await fetchRoles();
      if (newRoleId) {
        onChange(newRoleId);
      }
      onRoleCreated?.();
      
    } catch (error: any) {
      console.error('Error creating role:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to create role',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const applyPreset = (preset: typeof rolePresets[0]) => {
    setNewRoleName(preset.name);
    setNewRoleDescription(preset.description);
    
    // Find matching permissions
    const matchingPermissions = permissions
      .filter(p => preset.permissions.some(presetPerm => 
        p.name.toLowerCase().includes(presetPerm.toLowerCase()) ||
        p.description.toLowerCase().includes(presetPerm.toLowerCase())
      ))
      .map(p => p.id);
    
    setSelectedPermissions(matchingPermissions);
    setCurrentTab('custom');
  };

  return (
    <div className="space-y-2">
      <Label>Role *</Label>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select Role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                <div>
                  <div className="font-medium">{role.name}</div>
                  {role.description && (
                    <div className="text-xs text-muted-foreground">{role.description}</div>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" type="button">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Use Existing</TabsTrigger>
                <TabsTrigger value="custom">Create Custom</TabsTrigger>
              </TabsList>
              
              <TabsContent value="existing" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select from existing roles or choose a preset to get started.
                </p>
                
                {/* Role Presets */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Role Presets</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {rolePresets.map((preset, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 border rounded-md hover:border-primary cursor-pointer transition-all"
                        onClick={() => applyPreset(preset)}
                      >
                        <div className="mt-1 bg-primary/10 p-2 rounded-md">
                          {preset.name === 'Employee' && <User className="h-4 w-4" />}
                          {preset.name === 'Manager' && <Users className="h-4 w-4" />}
                          {preset.name === 'HR Executive' && <Shield className="h-4 w-4" />}
                        </div>
                        <div>
                          <h4 className="font-medium">{preset.name}</h4>
                          <p className="text-xs text-muted-foreground">{preset.description}</p>
                          <Badge variant="outline" className="mt-2 font-normal text-xs">
                            {preset.permissions.length} permissions
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="roleName">Role Name *</Label>
                    <Input
                      id="roleName"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="Enter role name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="roleDescription">Description</Label>
                    <Input
                      id="roleDescription"
                      value={newRoleDescription}
                      onChange={(e) => setNewRoleDescription(e.target.value)}
                      placeholder="Enter role description (optional)"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Permissions *</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPermissions([])}
                        >
                          Clear All
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPermissions(permissions.map(p => p.id))}
                        >
                          Select All
                        </Button>
                      </div>
                    </div>
                    
                    {permissions.length === 0 ? (
                      <div className="h-[240px] border rounded-md p-4 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <AlertCircle className="h-6 w-6" />
                          <p>Loading permissions...</p>
                        </div>
                      </div>
                    ) : (
                      <ScrollArea className="h-[240px] border rounded-md p-2">
                        {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                          <div key={module} className="mb-3">
                            <h5 className="font-medium text-sm mb-2 text-primary">{module}</h5>
                            {modulePermissions.map((permission) => (
                              <div key={permission.id} className="flex items-start space-x-2 py-2 px-1">
                                <Checkbox
                                  id={permission.id}
                                  checked={selectedPermissions.includes(permission.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedPermissions(prev => [...prev, permission.id]);
                                    } else {
                                      setSelectedPermissions(prev => prev.filter(id => id !== permission.id));
                                    }
                                  }}
                                />
                                <div className="space-y-1">
                                  <Label
                                    htmlFor={permission.id}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {permission.name}
                                  </Label>
                                  {permission.description && (
                                    <p className="text-xs text-muted-foreground">{permission.description}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </ScrollArea>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleCreateRole}
                      disabled={!newRoleName || selectedPermissions.length === 0 || isCreating}
                      className="w-full"
                    >
                      {isCreating ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Create & Use Role
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RoleSelector;
