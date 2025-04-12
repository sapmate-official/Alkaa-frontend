import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '@/services/AuthContext'
import { APIDictionary } from '@/api/v2/APIdict'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, UserCog, Users } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAtomValue } from 'jotai'
import { permissionListAtom } from '@/store/atom'
import { createPortal } from 'react-dom'

// Types
interface User {
    id: string
    firstName: string
    lastName: string
    email: string
    employeeId?: string
    status: 'active' | 'inactive' | 'suspended'
    department?: {
        id: string
        name: string
    }
    roles?: {
        role: {
            id: string
            name: string
            permissions?: {
                permission: {
                    id: string
                    name: string
                    description?: string
                }
            }[]
        }
    }[]
    createdAt: string
    managerId?: string
    manager?: {
        id: string
        firstName: string
        lastName: string
    }
}

interface Department {
    id: string
    name: string
    headId?: string
    description?: string
}

interface Role {
    id: string
    name: string
    description?: string
    permissions: {
        permission: {
            id: string
            name: string
            description?: string
        }
    }[]
}

const EmployeeManagement: React.FC = () => {
    const { user } = useAuth()
    const { toast } = useToast()

    // State management
    const [employees, setEmployees] = useState<User[]>([])
    const [filteredEmployees, setFilteredEmployees] = useState<User[]>([])
    const [departments, setDepartments] = useState<Department[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState({
        employees: false,
        departments: false,
        roles: false,
        action: false
    })

    // Selected employee state
    const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null)
    const [selectedDepartment, setSelectedDepartment] = useState<string>('')
    const [selectedRole, setSelectedRole] = useState<string>('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('profile')

    const permissionList = useAtomValue(permissionListAtom)

    // Add these hooks after your state declarations
    const dialogRef = useRef<HTMLDivElement>(null)
    const previouslyFocusedElement = useRef<HTMLElement | null>(null)

    // Add this effect for focus management
    useEffect(() => {
        if (isDialogOpen) {
            // Store the currently focused element to restore later
            previouslyFocusedElement.current = document.activeElement as HTMLElement

            // Focus the dialog when it opens
            if (dialogRef.current) {
                dialogRef.current.focus()
            }

            // Handle escape key to close dialog
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    setIsDialogOpen(false)
                }
            }

            document.addEventListener('keydown', handleKeyDown)
            return () => {
                document.removeEventListener('keydown', handleKeyDown)
                // Restore focus when dialog closes
                if (previouslyFocusedElement.current) {
                    previouslyFocusedElement.current.focus()
                }
            }
        }
    }, [isDialogOpen])

    // Fetch employees data
    const fetchEmployees = async () => {
        setIsLoading(prev => ({ ...prev, employees: true }))
        try {
            const response = await axios.get(`${APIDictionary.user}/org/${user?.orgId}`, {
                withCredentials: true
            })
            setEmployees(response.data)
            setFilteredEmployees(response.data)
            console.log('Fetched employees:', response.data)
        } catch (error) {
            console.error('Error fetching employees:', error)
            toast({
                title: "Error",
                description: "Failed to fetch employees",
                variant: "destructive"
            })
        } finally {
            setIsLoading(prev => ({ ...prev, employees: false }))
        }
    }

    // Fetch departments
    const fetchDepartments = async () => {
        setIsLoading(prev => ({ ...prev, departments: true }))
        try {
            const response = await axios.get(`${APIDictionary.department}/org/${user?.orgId}`, {
                withCredentials: true
            })
            setDepartments(response.data)
            console.log('Fetched departments:', response.data);
            
        } catch (error) {
            console.error('Error fetching departments:', error)
            toast({
                title: "Error",
                description: "Failed to fetch departments",
                variant: "destructive"
            })
        } finally {
            setIsLoading(prev => ({ ...prev, departments: false }))
        }
    }

    // Fetch roles
    const fetchRoles = async () => {
        setIsLoading(prev => ({ ...prev, roles: true }))
        try {
            const response = await axios.get(`${APIDictionary.role}/org/${user?.orgId}`, {
                withCredentials: true
            })
            setRoles(response.data)
        } catch (error) {
            console.error('Error fetching roles:', error)
            toast({
                title: "Error",
                description: "Failed to fetch roles",
                variant: "destructive"
            })
        } finally {
            setIsLoading(prev => ({ ...prev, roles: false }))
        }
    }

    // Filter employees based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredEmployees(employees)
            return
        }

        const query = searchQuery.toLowerCase()
        const filtered = employees.filter(employee =>
            employee.firstName?.toLowerCase().includes(query) ||
            employee.lastName?.toLowerCase().includes(query) ||
            employee.email.toLowerCase().includes(query) ||
            employee.employeeId?.toLowerCase().includes(query) ||
            employee.department?.name.toLowerCase().includes(query)
        )
        setFilteredEmployees(filtered)
    }, [searchQuery, employees])

    // Initial data fetching
    useEffect(() => {
        fetchEmployees()
        fetchDepartments()
        fetchRoles()
    }, [])

    // Check if user has required permission
    const hasPermission = (permissionKey: string) => {
        return permissionList.some(permission => permission.key === permissionKey)
    }

    // Check if user can assign to a specific department
    const canAssignToDepartment = (departmentId: string) => {
        // If user has permission to assign to any department, return true
        if (hasPermission('assign_user_to_all_department')) {
            return true
        }
        
        // If user has permission to assign to their own lead department
        if (hasPermission('assign_user_to_own_lead_department')) {
            // Check if this is the user's department (assuming user's department is available)
            // You may need to adjust this based on how you determine department leadership
            return user?.departmentId === departmentId
        }
        
        return false
    }

    // Get list of departments user can assign to
    const getAssignableDepartments = () => {
        // Log information for debugging
        console.log("Current permissions:", permissionList);
        console.log("Has assign_user_to_all_department:", hasPermission('assign_user_to_all_department'));
        console.log("Has assign_user_to_own_lead_department:", hasPermission('assign_user_to_own_lead_department'));
        console.log("User ID:", user?.id);
        console.log("Available departments:", departments);
        
        // If user can assign to all departments, return all departments
        if (hasPermission('assign_user_to_all_department')) {
            return departments;
        } 
        // If user can assign to departments they lead, filter for those
        else if (hasPermission('assign_user_to_own_lead_department')) {
            // Check if user exists
            if (!user || !user.id) {
                console.log("User is not defined or has no ID, returning empty array");
                return [];
            }
            
            // Filter departments where this user is the head (headId equals current user's id)
            const departmentsUserLeads = departments.filter(dept => dept.headId === user.id);
            console.log("Departments user leads:", departmentsUserLeads);
            return departmentsUserLeads;
        }
        
        // For development convenience only
        if (process.env.NODE_ENV === 'development') {
            console.log("Returning all departments in dev mode despite lack of permissions");
            return departments;
        }
        
        return [];
    }

    // Open employee details dialog
    const handleOpenEmployeeDetails = (employee: User) => {
        setSelectedEmployee(employee)
        setSelectedDepartment(employee.department?.id || '')

        // Get current role ID if it exists
        const currentRoleId = employee.roles && employee.roles.length > 0
            ? employee.roles[0].role.id
            : ''

        setSelectedRole(currentRoleId)
        setIsDialogOpen(true)
    }

    // Handle department change
    const handleUpdateDepartment = async () => {
        if (!selectedEmployee || !selectedDepartment) return
        
        // Check if user has permission to assign to this department
        if (!canAssignToDepartment(selectedDepartment)) {
            toast({
                title: "Permission Denied",
                description: "You don't have permission to assign users to this department",
                variant: "destructive"
            })
            return
        }

        setIsLoading(prev => ({ ...prev, action: true }))
        try {
            await axios.put(`${APIDictionary.user}/${selectedEmployee.id}/department/${selectedDepartment}`, {}, {
                withCredentials: true
            })

            // Update local state
            const updatedEmployees = employees.map(emp => {
                if (emp.id === selectedEmployee.id) {
                    const updatedDepartment = departments.find(dept => dept.id === selectedDepartment)
                    return {
                        ...emp,
                        department: updatedDepartment ? { id: updatedDepartment.id, name: updatedDepartment.name } : undefined
                    }
                }
                return emp
            })

            setEmployees(updatedEmployees)
            setFilteredEmployees(updatedEmployees)

            toast({
                title: "Success",
                description: "Department updated successfully",
                variant: "default"
            })
        } catch (error) {
            console.error('Error updating department:', error)
            toast({
                title: "Error",
                description: "Failed to update department",
                variant: "destructive"
            })
        } finally {
            setIsLoading(prev => ({ ...prev, action: false }))
        }
    }

    // Handle role change
    const handleUpdateRole = async () => {
        if (!selectedEmployee || !selectedRole || selectedRole === "none") return;
        
        // Check if user has permission to manage roles
        if (!hasPermission('manage_role')) {
            toast({
                title: "Permission Denied",
                description: "You don't have permission to manage user roles",
                variant: "destructive"
            });
            return;
        }
        
        // Get current role ID if it exists
        const currentRoleId = selectedEmployee.roles && selectedEmployee.roles.length > 0
            ? selectedEmployee.roles[0].role.id
            : 'null';
        
        setIsLoading(prev => ({ ...prev, action: true }));
        try {
            await axios.put(`${APIDictionary.user}/${selectedEmployee.id}/role/${currentRoleId}/${selectedRole}`, {}, {
                withCredentials: true
            });
            
            // Refresh employee data to get updated roles
            await fetchEmployees();
            
            toast({
                title: "Success",
                description: "Role updated successfully",
                variant: "default"
            });
        } catch (error) {
            console.error('Error updating role:', error);
            toast({
                title: "Error",
                description: "Failed to update role",
                variant: "destructive"
            });
        } finally {
            setIsLoading(prev => ({ ...prev, action: false }));
        }
    };

    return (
        <div className="container mx-auto p-4 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Employee Management</h1>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Employees</CardTitle>
                            <CardDescription>
                                Manage employee departments and roles
                            </CardDescription>
                        </div>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search employees..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading.employees ? (
                        <div className="flex justify-center items-center h-60">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="text-center py-10">
                            <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">No employees found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Employee ID</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEmployees.map((employee) => (
                                        <TableRow key={employee.id}>
                                            <TableCell className="font-medium">
                                                {employee.firstName} {employee.lastName}
                                            </TableCell>
                                            <TableCell>{employee.employeeId || 'N/A'}</TableCell>
                                            <TableCell>{employee.email}</TableCell>
                                            <TableCell>{employee.department?.name || 'Unassigned'}</TableCell>
                                            <TableCell>
                                                {employee.roles && employee.roles.length > 0
                                                    ? employee.roles[0].role.name
                                                    : 'No Role'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    employee.status === 'active' ? 'default' :
                                                        employee.status === 'inactive' ? 'secondary' :
                                                            'destructive'
                                                }>
                                                    {employee.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenEmployeeDetails(employee)}
                                                >
                                                    <UserCog className="h-4 w-4 mr-2" />
                                                    Manage
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Employee Details Dialog */}
            {isDialogOpen && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" 
                >
                    <div 
                        ref={dialogRef}
                        className="relative bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Dialog Header */}
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    {selectedEmployee && `${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Manage employee profile, department and role
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsDialogOpen(false)} 
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                aria-label="Close dialog"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* Dialog Content */}
                        {selectedEmployee && (
                            <div className="flex flex-col h-full">
                                <div className="border-b mb-4">
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={() => setActiveTab('profile')}
                                            className={`px-3 py-2 text-sm font-medium rounded-t-md transition-all ${activeTab === 'profile' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                                        >
                                            Profile
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('department')}
                                            className={`px-3 py-2 text-sm font-medium rounded-t-md transition-all ${activeTab === 'department' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                                        >
                                            Department
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('role')}
                                            className={`px-3 py-2 text-sm font-medium rounded-t-md transition-all ${activeTab === 'role' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                                        >
                                            Role
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-2" style={{ maxHeight: "50vh", overflow: "auto" }}>
                                    {/* Profile tab content */}
                                    {activeTab === 'profile' && (
                                        <div className="space-y-4 p-1">
                                            <div className="flex items-center space-x-4 mb-6">
                                                <Avatar className="h-16 w-16">
                                                    <AvatarFallback className="text-lg">
                                                        {selectedEmployee.firstName?.[0]}{selectedEmployee.lastName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="text-xl font-bold">
                                                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {selectedEmployee.employeeId || 'No Employee ID'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Email</Label>
                                                    <p className="text-sm mt-1">{selectedEmployee.email}</p>
                                                </div>

                                                <div>
                                                    <Label>Status</Label>
                                                    <div className="mt-1">
                                                        <Badge variant={
                                                            selectedEmployee.status === 'active' ? 'default' :
                                                                selectedEmployee.status === 'inactive' ? 'secondary' :
                                                                    'destructive'
                                                        }>
                                                            {selectedEmployee.status}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label>Department</Label>
                                                    <p className="text-sm mt-1">
                                                        {selectedEmployee.department?.name || 'Unassigned'}
                                                    </p>
                                                </div>

                                                <div>
                                                    <Label>Role</Label>
                                                    <p className="text-sm mt-1">
                                                        {selectedEmployee.roles && selectedEmployee.roles.length > 0
                                                            ? selectedEmployee.roles[0].role.name
                                                            : 'No Role'}
                                                    </p>
                                                </div>

                                                <div>
                                                    <Label>Manager</Label>
                                                    <p className="text-sm mt-1">
                                                        {selectedEmployee.manager
                                                            ? `${selectedEmployee.manager.firstName} ${selectedEmployee.manager.lastName}`
                                                            : 'No Manager'}
                                                    </p>
                                                </div>

                                                <div>
                                                    <Label>Joined On</Label>
                                                    <p className="text-sm mt-1">
                                                        {new Date(selectedEmployee.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Department tab content */}
                                    {activeTab === 'department' && (
                                        <div className="space-y-4 p-1">
                                            <div>
                                                <h3 className="text-lg font-medium mb-2">Current Department</h3>
                                                <p className="text-sm mb-4">
                                                    {selectedEmployee.department?.name || 'No department assigned'}
                                                </p>

                                                <hr className="my-4" />

                                                {(hasPermission('assign_user_to_all_department') || hasPermission('assign_user_to_own_lead_department')) ? (
                                                    <>
                                                        <h3 className="text-lg font-medium mb-2">Update Department</h3>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label htmlFor="department" className="text-sm font-medium">Select Department</label>
                                                                <select
                                                                    id="department"
                                                                    value={selectedDepartment}
                                                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                                                    className="w-full mt-1 p-2 border rounded-md"
                                                                >
                                                                    <option value="">Select a department</option>
                                                                    {getAssignableDepartments().map((department) => (
                                                                        <option key={department.id} value={department.id}>
                                                                            {department.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <button
                                                                onClick={handleUpdateDepartment}
                                                                disabled={isLoading.action || 
                                                                    selectedDepartment === selectedEmployee.department?.id || 
                                                                    !canAssignToDepartment(selectedDepartment)}
                                                                className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                                                            >
                                                                {isLoading.action ? "Updating..." : "Update Department"}
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-center">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            You don't have permission to change department assignments.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Role tab content */}
                                    {activeTab === 'role' && (
                                        <div className="space-y-4 p-1">
                                            <div>
                                                <h3 className="text-lg font-medium mb-2">Current Role</h3>
                                                <p className="text-sm mb-2">
                                                    {selectedEmployee.roles && selectedEmployee.roles.length > 0
                                                        ? selectedEmployee.roles[0].role.name
                                                        : 'No role assigned'}
                                                </p>

                                                {selectedEmployee.roles && selectedEmployee.roles.length > 0 && (
                                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md mb-4">
                                                        <p className="text-sm font-medium mb-1">Role Permissions:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {selectedEmployee.roles[0].role?.permissions ? 
                                                                selectedEmployee.roles[0].role.permissions.map(({ permission }) => (
                                                                    <span key={permission.id} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                                                                        {permission.name}
                                                                    </span>
                                                                )) : 
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">No permissions information available</p>
                                                            }
                                                        </div>
                                                    </div>
                                                )}

                                                <hr className="my-4" />

                                                {hasPermission('manage_role') ? (
                                                    <>
                                                        <h3 className="text-lg font-medium mb-2">Update Role</h3>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label htmlFor="role" className="text-sm font-medium">Select Role</label>
                                                                <select
                                                                    id="role"
                                                                    value={selectedRole}
                                                                    onChange={(e) => setSelectedRole(e.target.value)}
                                                                    className="w-full mt-1 p-2 border rounded-md"
                                                                >
                                                                    <option value="none">No Role</option>
                                                                    {roles.map((role) => (
                                                                        <option key={role.id} value={role.id}>
                                                                            {role.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            {selectedRole && selectedRole !== "none" && (
                                                                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
                                                                    <p className="text-sm font-medium mb-1">New Role Permissions:</p>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {(() => {
                                                                            const foundRole = roles.find(r => r.id === selectedRole);
                                                                            return foundRole?.permissions ? 
                                                                                foundRole.permissions.map(({ permission }) => (
                                                                                    <span key={permission.id} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                                                                                        {permission.name}
                                                                                    </span>
                                                                                )) : 
                                                                                <p className="text-sm text-gray-500 dark:text-gray-400">No permissions found for this role</p>;
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <button 
                                                                onClick={handleUpdateRole}
                                                                disabled={isLoading.action || 
                                                                    (selectedEmployee.roles && 
                                                                    selectedEmployee.roles.length > 0 && 
                                                                    selectedEmployee.roles[0].role.id === selectedRole) || 
                                                                    selectedRole === "none"}
                                                                className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                                                            >
                                                                {isLoading.action ? "Updating..." : "Update Role"}
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-center">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            You don't have permission to change role assignments.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Dialog Footer */}
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setIsDialogOpen(false)}
                                className="py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}

export default EmployeeManagement