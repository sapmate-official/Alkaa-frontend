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
    // Multi-department support
    userDepartments?: {
        id: string
        departmentId: string
        isPrimary: boolean
        role?: string
        assignedAt: Date
        department: {
            id: string
            name: string
            code?: string
            description?: string
        }
    }[]
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

    // Add these new states for deletion process
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteConfirmStep, setDeleteConfirmStep] = useState(1);
    const [confirmationEmail, setConfirmationEmail] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

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
            employee.department?.name.toLowerCase().includes(query) ||
            // Multi-department search
            employee.userDepartments?.some(ud => 
                ud.department.name.toLowerCase().includes(query)
            )
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

    // Add this new function for hard deletion
    const handleHardDeleteUser = async () => {
        if (!selectedEmployee) return;
        
        // Check if user has permission to delete users
        if (!hasPermission('delete_user')) {
            toast({
                title: "Permission Denied",
                description: "You don't have permission to delete users",
                variant: "destructive"
            });
            return;
        }
        
        setIsDeleting(true);
        try {
            await axios.delete(`${APIDictionary.user}`, {
                data: { id: selectedEmployee.id },
                withCredentials: true
            });
            
            // Update local state
            const updatedEmployees = employees.filter(emp => emp.id !== selectedEmployee.id);
            setEmployees(updatedEmployees);
            setFilteredEmployees(updatedEmployees);
            
            // Close all dialogs and show success message
            setShowDeleteConfirmation(false);
            setDeleteConfirmStep(1);
            setConfirmationEmail('');
            setIsDialogOpen(false);
            
            toast({
                title: "Success",
                description: "User has been permanently deleted",
                variant: "default"
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            toast({
                title: "Error",
                description: "Failed to delete user. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsDeleting(false);
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
                                            <TableCell>
                                                {/* Multi-department display */}
                                                {employee.userDepartments && employee.userDepartments.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {employee.userDepartments?.map((ud) => (
                                                            <div key={ud.id} className="flex items-center gap-1 text-xs">
                                                                {ud.isPrimary && (
                                                                    <svg className="h-3 w-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                )}
                                                                <span className={ud.isPrimary ? 'font-medium' : ''}>
                                                                    {ud.department.name}
                                                                </span>
                                                                {ud.role && (
                                                                    <span className="text-muted-foreground">({ud.role})</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {employee.userDepartments && employee.userDepartments.length > 2 && (
                                                            <div className="text-xs text-muted-foreground">
                                                                +{employee.userDepartments.length - 2} more
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    // Fallback to legacy department
                                                    employee.department?.name || 'Unassigned'
                                                )}
                                            </TableCell>
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
                                                    <Label>Department(s)</Label>
                                                    <div className="text-sm mt-1">
                                                        {selectedEmployee.userDepartments && selectedEmployee.userDepartments.length > 0 ? (
                                                            <div className="space-y-1">
                                                                {selectedEmployee.userDepartments?.map(ud => (
                                                                    <div key={ud.id} className="flex items-center gap-2">
                                                                        {ud.isPrimary && (
                                                                            <svg className="h-3 w-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                            </svg>
                                                                        )}
                                                                        <span className={ud.isPrimary ? 'font-medium' : ''}>
                                                                            {ud.department.name}
                                                                        </span>
                                                                        {ud.role && (
                                                                            <Badge variant="outline" className="text-xs h-5">
                                                                                {ud.role}
                                                                            </Badge>
                                                                        )}
                                                                        {ud.isPrimary && (
                                                                            <Badge variant="default" className="text-xs h-5">
                                                                                Primary
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            selectedEmployee.department?.name || 'Unassigned'
                                                        )}
                                                    </div>
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

                                            {/* Add Hard Delete section at the bottom of the profile tab */}
                                            {hasPermission('delete_user') && (
                                                <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                        Permanently delete this user and all associated data. This action cannot be undone.
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            setShowDeleteConfirmation(true);
                                                            setDeleteConfirmStep(1);
                                                        }}
                                                        className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    >
                                                        Hard Delete User
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Department tab content - Multi-Department Support */}
                                    {activeTab === 'department' && (
                                        <div className="space-y-4 p-1">
                                            {/* Import Multi-Department Manager Component */}
                                            <div className="space-y-4">
                                                {/* Legacy Single Department Display */}
                                                {selectedEmployee.department && !selectedEmployee.userDepartments?.length && (
                                                    <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                                                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                                                            Legacy Department Assignment
                                                        </h4>
                                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                                            Current: {selectedEmployee.department.name}
                                                        </p>
                                                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                                            This user is using the legacy single-department system. 
                                                            Use "Migrate to Multi-Department" to enable multi-department features.
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Multi-Department Display */}
                                                {selectedEmployee.userDepartments && selectedEmployee.userDepartments.length > 0 ? (
                                                    <div className="space-y-4">
                                                        <h3 className="text-lg font-medium mb-2">Department Assignments</h3>
                                                        <div className="space-y-3">
                                                            {selectedEmployee.userDepartments?.map((assignment) => (
                                                                <div key={assignment.id} className={`p-4 border rounded-lg ${assignment.isPrimary ? 'bg-primary/5 border-primary/20' : 'bg-muted/20'}`}>
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            {assignment.isPrimary ? (
                                                                                <div className="flex items-center gap-2 text-yellow-600">
                                                                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                                    </svg>
                                                                                    <span className="text-sm font-medium">Primary</span>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="text-muted-foreground">
                                                                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2h8v8H6V6z" clipRule="evenodd" />
                                                                                    </svg>
                                                                                </div>
                                                                            )}
                                                                            <div>
                                                                                <h4 className="font-medium">{assignment.department.name}</h4>
                                                                                {assignment.department.code && (
                                                                                    <p className="text-xs text-muted-foreground">Code: {assignment.department.code}</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs bg-muted px-2 py-1 rounded">
                                                                                {assignment.role || 'Member'}
                                                                            </span>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                Since: {new Date(assignment.assignedAt).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <svg className="h-12 w-12 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
                                                        </svg>
                                                        <p className="text-muted-foreground">No departments assigned</p>
                                                    </div>
                                                )}

                                                <hr className="my-4" />

                                                {/* Department Management Actions */}
                                                {(hasPermission('assign_user_to_all_department') || hasPermission('assign_user_to_own_lead_department') || hasPermission('assign_user_departments') || hasPermission('remove_user_departments')) ? (
                                                    <div className="space-y-4">
                                                        <h3 className="text-lg font-medium mb-2">Manage Department Assignments</h3>
                                                        
                                                        {/* Multi-Department Actions */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <button
                                                                onClick={() => {
                                                                    // Open multi-department assignment dialog
                                                                    // This would be handled by a MultiDepartmentManager component
                                                                    toast({
                                                                        title: "Multi-Department Management",
                                                                        description: "This feature allows assigning users to multiple departments with different roles."
                                                                    });
                                                                }}
                                                                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                                            >
                                                                <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                                                </svg>
                                                                <div className="text-left">
                                                                    <div className="font-medium">Assign to Departments</div>
                                                                    <div className="text-xs text-muted-foreground">Add to multiple departments</div>
                                                                </div>
                                                            </button>

                                                            {selectedEmployee.userDepartments && selectedEmployee.userDepartments.length > 0 && (
                                                                <button
                                                                    onClick={() => {
                                                                        // Open edit departments dialog
                                                                        toast({
                                                                            title: "Edit Assignments",
                                                                            description: "Modify existing department assignments and roles."
                                                                        });
                                                                    }}
                                                                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                                                >
                                                                    <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                                    </svg>
                                                                    <div className="text-left">
                                                                        <div className="font-medium">Edit Assignments</div>
                                                                        <div className="text-xs text-muted-foreground">Modify roles and primary dept</div>
                                                                    </div>
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Legacy Department Update (Backward Compatibility) */}
                                                        {(!selectedEmployee.userDepartments || selectedEmployee.userDepartments.length === 0) && selectedEmployee.department && (
                                                            <div className="space-y-3">
                                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                                                                        Migrate to Multi-Department System
                                                                    </h4>
                                                                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                                                        This user is using the legacy single-department system. 
                                                                        Migrate to enable multi-department features with roles and primary department assignment.
                                                                    </p>
                                                                    <button
                                                                        onClick={async () => {
                                                                            try {
                                                                                // Migrate user to multi-department system
                                                                                await axios.post(`${APIDictionary.user}/${selectedEmployee.id}/migrate-departments`, {}, {
                                                                                    withCredentials: true
                                                                                });
                                                                                
                                                                                toast({
                                                                                    title: "Migration Successful",
                                                                                    description: "User has been migrated to multi-department system."
                                                                                });
                                                                                
                                                                                // Refresh employee data
                                                                                fetchEmployees();
                                                                            } catch (error) {
                                                                                console.error('Migration error:', error);
                                                                                toast({
                                                                                    title: "Migration Failed",
                                                                                    description: "Failed to migrate user to multi-department system.",
                                                                                    variant: "destructive"
                                                                                });
                                                                            }
                                                                        }}
                                                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                                                    >
                                                                        Migrate to Multi-Department
                                                                    </button>
                                                                </div>

                                                                {/* Legacy single department update */}
                                                                <div>
                                                                    <label htmlFor="department" className="text-sm font-medium">Update Single Department (Legacy)</label>
                                                                    <select
                                                                        id="department"
                                                                        value={selectedDepartment}
                                                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                                                        className="w-full mt-1 p-2 border rounded-md bg-background"
                                                                    >
                                                                        <option value="">Select a department</option>
                                                                        {getAssignableDepartments().map((department) => (
                                                                            <option key={department.id} value={department.id}>
                                                                                {department.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <button
                                                                        onClick={handleUpdateDepartment}
                                                                        disabled={isLoading.action || 
                                                                            selectedDepartment === selectedEmployee.department?.id || 
                                                                            !canAssignToDepartment(selectedDepartment)}
                                                                        className="w-full mt-2 py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                                                                    >
                                                                        {isLoading.action ? "Updating..." : "Update Department (Legacy)"}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
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

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirmation && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                    <div 
                        className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
                                {deleteConfirmStep === 1 ? "Confirm Deletion" : "Final Verification"}
                            </h2>
                            <button 
                                onClick={() => setShowDeleteConfirmation(false)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                aria-label="Close dialog"
                                disabled={isDeleting}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {deleteConfirmStep === 1 ? (
                            <div className="space-y-4">
                                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                        Warning: This action cannot be undone
                                    </p>
                                    <p className="text-sm mt-2">
                                        You are about to permanently delete {selectedEmployee?.firstName} {selectedEmployee?.lastName} and all associated data including:
                                    </p>
                                    <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                                        <li>User profile information</li>
                                        <li>Role assignments and permissions</li>
                                        <li>Attendance records</li>
                                        <li>Leave records and balances</li>
                                        <li>Salary records and transactions</li>
                                        <li>All other related data</li>
                                    </ul>
                                </div>

                                <div className="flex justify-end space-x-3 mt-4">
                                    <button
                                        onClick={() => setShowDeleteConfirmation(false)}
                                        className="py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirmStep(2)}
                                        className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none"
                                        disabled={isDeleting}
                                    >
                                        Continue to Verification
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm">
                                    To confirm deletion, please type the employee's email address:
                                    <span className="font-bold block mt-1">{selectedEmployee?.email}</span>
                                </p>

                                <div>
                                    <label htmlFor="confirmEmail" className="sr-only">Confirm Email</label>
                                    <input
                                        type="email"
                                        id="confirmEmail"
                                        placeholder="Type email to confirm"
                                        value={confirmationEmail}
                                        onChange={(e) => setConfirmationEmail(e.target.value)}
                                        className="w-full p-2 border rounded-md bg-background"
                                        disabled={isDeleting}
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 mt-4">
                                    <button
                                        onClick={() => setDeleteConfirmStep(1)}
                                        className="py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                                        disabled={isDeleting}
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleHardDeleteUser}
                                        className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={isDeleting || confirmationEmail !== selectedEmployee?.email}
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                                                Deleting...
                                            </>
                                        ) : "Permanently Delete User"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}

export default EmployeeManagement