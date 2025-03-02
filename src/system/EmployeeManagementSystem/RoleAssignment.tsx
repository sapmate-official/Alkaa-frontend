import { APIDictionary } from '@/api/APIdict'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/services/AuthContext'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

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
}
interface RoleAssignmentProps {
    setRoleId?: (roleId: string) => void
  }
const RoleAssignment:React.FC<RoleAssignmentProps> = ({setRoleId}) => {
  const { user } = useAuth()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDescription, setNewRoleDescription] = useState('')
  const [expandedRoles, setExpandedRoles] = useState<string[]>([])
  const {toast} = useToast()

  const FetchRoles = async () => {
    try {
      const response = await axios.get(`${APIDictionary.role}/org/${user?.orgId}`, { withCredentials: true })
      setRoles(response.data)
    } catch (error) {
      console.error(error)
    }
  }

  const FetchPermissions = async () => {
    try {
      const response = await axios.get(`${APIDictionary.Permission}`, { withCredentials: true })
      setPermissions(response.data)
    } catch (error) {
      console.error(error)
    }
  }

  const handleCreateRole = async () => {
    try {
      await axios.post(`${APIDictionary.role}`, {
        orgId: user?.orgId,
        name: newRoleName,
        description: newRoleDescription,
        permissions: selectedPermissions
      }, { withCredentials: true })
      
      FetchRoles() // Refresh roles after creation
      setNewRoleName('')
      setNewRoleDescription('')
      setSelectedPermissions([])
      toast({
        title: 'Success',
        description: 'Role created successfully'
      })
    } catch (error) {
      console.error(error)
    }
  }

  const toggleRoleExpansion = (roleId: string) => {
    setExpandedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    )
  }
  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId)
    setRoleId?.(roleId) // Call the parent's setRoleId if provided
  }

  useEffect(() => {
    FetchRoles()
    FetchPermissions()
  }, [])

  return (
    <div className="container mx-auto p-4 w-full h-full overflow-y-scroll">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left side - Role List */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Existing Roles</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {roles?.map((role) => (
              <div key={role?.id} className="border rounded-lg p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleRoleExpansion(role?.id)}
                >
                  <div>
                    <h3 className="font-semibold text-lg">{role?.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{role?.description}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8"
                  >
                    {expandedRoles?.includes(role?.id) ? '−' : '+'}
                  </Button>
                </div>
                
                {expandedRoles?.includes(role?.id) && (
                  <div className="space-y-1 mt-2 border-t pt-2">
                    <h4 className="text-sm font-medium">Permissions:</h4>
                    <div className="pl-4">
                      {role?.permissions?.map(({ permission }) => (
                        <div key={permission?.id} className="text-sm text-gray-600">
                          • {permission?.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right side - Role Creation/Selection */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Role Assignment</h2>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="existing">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Select Role</TabsTrigger>
                <TabsTrigger value="create">Create Role</TabsTrigger>
              </TabsList>

              <TabsContent value="existing">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Role</label>
                    <Select value={selectedRole} onValueChange={handleRoleSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles?.map((role) => (
                          <SelectItem key={role?.id} value={role?.id}>
                            {role?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedRole && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Role Permissions</h3>
                      <div className="border rounded p-4">
                        {roles?.find(r => r?.id === selectedRole)?.permissions?.map(({ permission }) => (
                          <div key={permission?.id} className="flex items-center space-x-2">
                            <Checkbox checked disabled />
                            <label>{permission?.name}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="create">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role Name</label>
                    <Input 
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="Enter role name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input 
                      value={newRoleDescription}
                      onChange={(e) => setNewRoleDescription(e.target.value)}
                      placeholder="Enter role description"
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Select Permissions</h3>
                    <div className="border rounded p-4 space-y-2 max-h-[300px] overflow-y-auto">
                      {permissions?.map((permission) => (
                        <div key={permission?.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedPermissions?.includes(permission?.id)}
                            onCheckedChange={(checked) => {
                              setSelectedPermissions(prev => 
                                checked 
                                  ? [...prev, permission?.id]
                                  : prev?.filter(id => id !== permission?.id)
                              )
                            }}
                          />
                          <label>{permission?.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateRole}
                    disabled={!newRoleName || selectedPermissions.length === 0}
                    className="w-full"
                  >
                    Create Role
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RoleAssignment