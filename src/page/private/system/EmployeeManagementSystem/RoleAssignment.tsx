import { APIDictionary } from '@/api/v2/APIdict'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/services/AuthContext'
import axios from 'axios'
import React, { useEffect, useState, useMemo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Building, Check, ChevronsUpDown, ClipboardCheck, Plus, Save, Search, Shield, Users, AlertCircle, Loader } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Role {
  id: string
  name: string
  description: string
  permissions: { permission: Permission }[]
}

interface Permission {
  id: string
  name: string
  description: string
  module?: string
  key?: string
}

interface Department {
  id: string
  name: string
  description?: string
  headId?: string
}

interface RolePreset {
  name: string
  description: string
  permissionIds: string[]
  icon: React.ReactNode
}

interface RoleAssignmentProps {
  setRoleId?: (roleId: string) => void
  onDepartmentCreated?: (departments: Department[]) => void
}

const RoleAssignment: React.FC<RoleAssignmentProps> = ({ setRoleId, onDepartmentCreated }) => {
  const { user } = useAuth()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [, setDepartments] = useState<Department[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDescription, setNewRoleDescription] = useState('')
  const [openRoleSelector, setOpenRoleSelector] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreatingRole, setIsCreatingRole] = useState(false)
  const [currentTab, setCurrentTab] = useState('presets')
  const { toast } = useToast()
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false)
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    code: '',
    location: ''
  })
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false)
  const [permissionsByModule, setPermissionsByModule] = useState<Record<string, Permission[]>>({})
  const [expandedModules, setExpandedModules] = useState<string[]>([])

  const rolePresets = useMemo(() => {
    if (!permissions || permissions.length === 0) {
      return [];
    }

    const managerPreset = {
      name: 'Manager',
      description: 'Department leadership with team management capabilities',
      permissionIds: permissions
        .filter(p => p.key?.includes('manage_') || p.key?.includes('view_') || p.key?.includes('approve_'))
        .map(p => p.id),
      icon: <Users className="h-4 w-4" />
    };

    const adminPreset = {
      name: 'Admin',
      description: 'Administrative permissions for organization management',
      permissionIds: permissions
        .filter(p => !p.key?.includes('super_admin'))
        .map(p => p.id),
      icon: <Shield className="h-4 w-4" />
    };

    const employeePreset = {
      name: 'Employee',
      description: 'Standard employee permissions',
      permissionIds: permissions
        .filter(p => p.key?.includes('view_personal') || p.key?.includes('mark_attendance') || p.key?.includes('leave_request'))
        .map(p => p.id),
      icon: <ClipboardCheck className="h-4 w-4" />
    };

    return [managerPreset, adminPreset, employeePreset];
  }, [permissions]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${APIDictionary.department}/org/${user?.orgId}`, { withCredentials: true })
      const fetchedDepartments = response.data || []
      setDepartments(fetchedDepartments)

      if (onDepartmentCreated) {
        onDepartmentCreated(fetchedDepartments)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch departments',
        variant: 'destructive'
      })
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${APIDictionary.role}/org/${user?.orgId}`, { withCredentials: true })
      setRoles(response.data)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to fetch roles',
        variant: 'destructive'
      })
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await axios.get(`${APIDictionary.Permission}`, { withCredentials: true })

      if (!response.data || response.data.length === 0) {
        toast({
          title: 'Warning',
          description: 'No permissions available in the system.',
          variant: 'default'
        });
        return;
      }

      setPermissions(response.data);

      const byModule: Record<string, Permission[]> = {}
      response.data.forEach((permission: Permission) => {
        const module = permission.module || 'Other'
        if (!byModule[module]) {
          byModule[module] = []
        }
        byModule[module].push(permission)
      })
      setPermissionsByModule(byModule)

      if (Object.keys(byModule).length > 0) {
        setExpandedModules(['User', 'Department', 'Employee'])
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch permissions',
        variant: 'destructive'
      })
    }
  }

  const handleCreateRole = async () => {
    if (!newRoleName) {
      toast({
        title: 'Validation Error',
        description: 'Role name is required',
        variant: 'destructive'
      })
      return;
    }

    if (selectedPermissions.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one permission must be selected',
        variant: 'destructive'
      })
      return;
    }

    setIsCreatingRole(true);

    try {
      const response = await axios.post(`${APIDictionary.role}`, {
        orgId: user?.orgId,
        name: newRoleName,
        description: newRoleDescription,
        permissions: selectedPermissions.map(permissionId => ({ permissionId }))
      }, { withCredentials: true })

      const newRoleId = response.data?.id

      toast({
        title: 'Success',
        description: 'Role created successfully'
      })

      await fetchRoles()

      setNewRoleName('')
      setNewRoleDescription('')
      setSelectedPermissions([])

      if (newRoleId) {
        setSelectedRole(newRoleId)
        setRoleId?.(newRoleId)

        setTimeout(() => {
          setOpenRoleSelector(true)
          setTimeout(() => setOpenRoleSelector(false), 1000)
        }, 500)
      }
    } catch (error: any) {
      console.error('Error creating role:', error)
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to create role',
        variant: 'destructive'
      })
    } finally {
      setIsCreatingRole(false);
    }
  }

  const handleCreateDepartment = async () => {
    if (!newDepartment.name) {
      toast({
        title: 'Validation Error',
        description: 'Department name is required',
        variant: 'destructive'
      })
      return
    }

    setIsCreatingDepartment(true)
    try {
      await axios.post(APIDictionary.department, {
        ...newDepartment,
        orgId: user?.orgId
      }, {
        withCredentials: true
      })

      toast({
        title: 'Success',
        description: 'Department created successfully'
      })

      setIsDepartmentDialogOpen(false)
      setNewDepartment({
        name: '',
        description: '',
        code: '',
        location: ''
      })

      await fetchDepartments()

    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to create department',
        variant: 'destructive'
      })
    } finally {
      setIsCreatingDepartment(false)
    }
  }

  const toggleModuleExpansion = (module: string) => {
    setExpandedModules(prev =>
      prev.includes(module)
        ? prev.filter(m => m !== module)
        : [...prev, module]
    )
  }

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId)
    setRoleId?.(roleId)
  }

  const applyRolePreset = (preset: RolePreset) => {
    if (preset.permissionIds.length === 0) {
      toast({
        title: 'Warning',
        description: 'This preset has no permissions. Please wait for permissions to load or select permissions manually.',
        variant: 'default'
      });
      return;
    }

    setNewRoleName(preset.name);
    setNewRoleDescription(preset.description);
    setSelectedPermissions(preset.permissionIds);

    setTimeout(() => {
      setCurrentTab('custom');
      document.getElementById('create-tab-trigger')?.click();
    }, 100);
  }

  const filteredRoles = searchQuery
    ? roles.filter(role =>
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : roles

  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchPermissions();
        await Promise.all([
          fetchRoles(),
          fetchDepartments()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    }

    initializeData();
  }, [])

  return (
    <div className="space-y-6">
      <Dialog open={isDepartmentDialogOpen} onOpenChange={setIsDepartmentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Department</DialogTitle>
            <DialogDescription>
              Add a new department to your organization.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Department Name*</Label>
              <Input
                id="dept-name"
                value={newDepartment.name}
                onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Marketing, Engineering"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dept-code">Department Code</Label>
                <Input
                  id="dept-code"
                  value={newDepartment.code}
                  onChange={(e) => setNewDepartment(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g. MKT, ENG"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dept-location">Location</Label>
                <Input
                  id="dept-location"
                  value={newDepartment.location}
                  onChange={(e) => setNewDepartment(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. Floor 3, Building B"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dept-description">Description</Label>
              <Textarea
                id="dept-description"
                value={newDepartment.description}
                onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the department's purpose and function"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDepartmentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateDepartment} disabled={isCreatingDepartment}>
              {isCreatingDepartment ? 'Creating...' : 'Create Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Select Role</h2>
              <div className="relative w-full max-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search roles..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Popover open={openRoleSelector} onOpenChange={setOpenRoleSelector}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openRoleSelector}
                  className="w-full justify-between"
                >
                  {selectedRole ?
                    roles.find(role => role.id === selectedRole)?.name :
                    "Select a role..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search roles..." />
                  <CommandEmpty>No roles found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {filteredRoles.map(role => (
                        <CommandItem
                          key={role.id}
                          onSelect={() => {
                            handleRoleSelect(role.id)
                            setOpenRoleSelector(false)
                          }}
                          className="flex items-center"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedRole === role.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{role.name}</span>
                            {role.description && (
                              <span className="text-xs text-muted-foreground">{role.description}</span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {selectedRole && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium">Role Permissions</h3>
                  <Badge variant="outline" className="font-normal">
                    {roles.find(r => r.id === selectedRole)?.permissions.length || 0} permissions
                  </Badge>
                </div>

                <ScrollArea className="h-[280px] border rounded-md p-2">
                  {roles.find(r => r.id === selectedRole)?.permissions.map(({ permission }) => (
                    <div key={permission?.id} className="flex items-start space-x-2 py-2 px-1 hover:bg-accent/30 rounded-sm">
                      <Checkbox checked disabled className="mt-1" />
                      <div>
                        <label className="text-sm font-medium">{permission?.name}</label>
                        {permission?.description && (
                          <p className="text-xs text-muted-foreground">{permission?.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </ScrollArea>

                <div className="pt-3 border-t">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => setRoleId?.(selectedRole)}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Assign Selected Role
                  </Button>
                </div>
              </div>
            )}

            {!selectedRole && (
              <div className="mt-6 pt-6 border-t">
                <Button variant="outline" className="w-full" onClick={() => document.getElementById('create-tab-trigger')?.click()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create a New Role
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-lg font-semibold">Create New Role</h2>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="presets" onValueChange={setCurrentTab} value={currentTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="presets">Use Preset</TabsTrigger>
                <TabsTrigger value="custom" id="create-tab-trigger">Custom Role</TabsTrigger>
              </TabsList>

              <TabsContent value="presets" className="pt-4 space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Choose from predefined role templates to quickly create common roles.
                </p>

                {permissions.length === 0 && (
                  <div className="flex items-center gap-2 p-4 bg-amber-50 text-amber-600 rounded-md mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">Loading permissions... Please wait.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  {rolePresets.map((preset, index) => (
                    <div
                      key={index}
                      className={`flex items-start space-x-3 p-3 border rounded-md ${permissions.length > 0 ? 'hover:border-primary cursor-pointer' : 'opacity-70 cursor-not-allowed'} transition-all`}
                      onClick={() => permissions.length > 0 && applyRolePreset(preset)}
                    >
                      <div className="mt-1 bg-primary/10 p-2 rounded-md">
                        {preset.icon}
                      </div>
                      <div>
                        <h4 className="font-medium">{preset.name}</h4>
                        <p className="text-xs text-muted-foreground">{preset.description}</p>
                        <Badge variant="outline" className="mt-2 font-normal text-xs">
                          {preset.permissionIds.length} permissions
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3">
                  <Button
                    className="w-full"
                    onClick={() => {
                      setCurrentTab('custom');
                      document.getElementById('create-tab-trigger')?.click();
                    }}
                    variant="outline"
                  >
                    Continue to Customize Role
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="custom" className="pt-4 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role-name">Role Name*</Label>
                    <Input
                      id="role-name"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="Enter role name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role-description">Description</Label>
                    <Textarea
                      id="role-description"
                      value={newRoleDescription}
                      onChange={(e) => setNewRoleDescription(e.target.value)}
                      placeholder="Describe the role's purpose and responsibilities"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Select Permissions*</Label>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPermissions([])}
                          disabled={permissions.length === 0}
                        >
                          Clear All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPermissions(permissions.map(p => p.id))}
                          disabled={permissions.length === 0}
                        >
                          Select All
                        </Button>
                      </div>
                    </div>

                    {permissions.length === 0 ? (
                      <div className="h-[240px] border rounded-md p-4 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Loader className="animate-spin h-6 w-6" />
                          <p>Loading permissions...</p>
                        </div>
                      </div>
                    ) : (
                      <ScrollArea className="h-[240px] border rounded-md p-2">
                        {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                          <div key={module} className="mb-3">
                            <div
                              className="flex items-center justify-between cursor-pointer p-2 bg-muted/50 rounded-sm mb-1"
                              onClick={() => toggleModuleExpansion(module)}
                            >
                              <span className="font-medium text-sm">{module}</span>
                              <span>{expandedModules.includes(module) ? '−' : '+'}</span>
                            </div>

                            {expandedModules.includes(module) && (
                              <div className="pl-2 space-y-1">
                                {modulePermissions.map((permission) => (
                                  <div key={permission.id} className="flex items-start space-x-2 py-1 px-2 hover:bg-accent/30 rounded-sm">
                                    <Checkbox
                                      id={`perm-${permission.id}`}
                                      className="mt-1"
                                      checked={selectedPermissions.includes(permission.id)}
                                      onCheckedChange={(checked) => {
                                        setSelectedPermissions(prev =>
                                          checked
                                            ? [...prev, permission.id]
                                            : prev.filter(id => id !== permission.id)
                                        )
                                      }}
                                    />
                                    <div>
                                      <label
                                        htmlFor={`perm-${permission.id}`}
                                        className="text-sm font-medium cursor-pointer"
                                      >
                                        {permission.name}
                                      </label>
                                      {permission.description && (
                                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </ScrollArea>
                    )}
                  </div>

                  <div className="pt-3">
                    <Button
                      onClick={handleCreateRole}
                      disabled={!newRoleName || selectedPermissions.length === 0 || isCreatingRole}
                      className="w-full"
                    >
                      {isCreatingRole ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Create & Assign Role
                        </>
                      )}
                    </Button>
                  </div>

                  {selectedPermissions.length > 0 && (
                    <div className="text-xs text-center text-muted-foreground">
                      {selectedPermissions.length} permissions selected
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setIsDepartmentDialogOpen(true)}
        >
          <Building className="h-4 w-4" />
          Create New Department
        </Button>
      </div>
    </div>
  )
}

export default RoleAssignment