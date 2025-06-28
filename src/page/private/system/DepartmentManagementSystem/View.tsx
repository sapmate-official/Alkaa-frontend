import { APIDictionary } from '@/api/v2/APIdict'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

import { 
  Users, 
  MapPin, 
  IndianRupee, 
  Search, 
  ArrowLeft, 
  FolderTree,
  UserCheck,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/services/AuthContext'
import Loader from '@/components/Loader'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { ButtonOfSpecificDepartmentEdit } from './Edit'
import { useToast } from '@/hooks/use-toast'
import CheckPermission from '@/services/PermissionCheck'
import { useAtom } from 'jotai'
import { permissionListAtom } from '@/store/atom'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  role?: string;
  hiredDate?: string;
}

interface Department {
  id: string;
  name: string;
  description: string;
  code: string;
  location: string;
  budget: number;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
  parentDepartment?: {
    id: string;
    name: string;
  } | null;
  departmentHead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
  } | null;
  users: User[];
}

const MemberAvatar = ({ user }: { user: User }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Avatar className="h-9 w-9 border-2 border-background">
          <AvatarImage src="" alt={`${user.firstName} ${user.lastName}`} />
          <AvatarFallback className="text-xs">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm font-medium">{user.firstName} {user.lastName}</div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const SpecificDepartmentView = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [department, setDepartment] = useState<Department | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [permissions] = useAtom(permissionListAtom)
  const [employeeList, setEmployeeList] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [confirmHeadChange, setConfirmHeadChange] = useState<User | null>(null)
  const [headChangeLoading, setHeadChangeLoading] = useState(false)
  
  const hasChangeHeadPermission = CheckPermission("change_department_head", permissions)
  const isCurrentUserHead = department?.departmentHead?.id === user?.id
  const canChangeHead = isCurrentUserHead || hasChangeHeadPermission
  const hasEditPermission = CheckPermission("edit_department", permissions)

  const fetchEmployeeList = async () => {
    try {
      const response = await axios.get(`${APIDictionary.Organization}/employees/${user?.orgId}`)
      setEmployeeList(response.data)
    } catch (error) {
      console.error('Error fetching employee list:', error)
      toast({
        title: 'Error',
        description: 'Error fetching employee list',
        variant: 'destructive'
      })
    }
  }

  const fetchDepartment = async () => {
    setIsLoading(true)
    try {
      let response;
      if (id) {
        response = await axios.get(`${APIDictionary.department}/${id}`)
        setDepartment(response.data)
      } else if (user?.Department?.[0]?.id) {
        response = await axios.get(`${APIDictionary.department}/${user.Department[0].id}`)
        setDepartment(response.data)
        if (!response.data) {
          navigate("/p/department/")
        }
      } else {
        navigate("/p/department/")
      }
    } catch (error) {
      console.error('Error fetching department:', error)
      toast({
        title: 'Error',
        description: 'Failed to load department information',
        variant: 'destructive'
      })
      navigate("/p/department/")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartment()
  }, [id, user])

  const handleChangeHead = async (userId: string) => {
    setHeadChangeLoading(true)
    try {
      const response = await axios.put(
        `${APIDictionary.department}/${id}/head/${userId}`, 
        {}, 
        { withCredentials: true }
      )
      toast({
        title: 'Success',
        description: 'Department head updated successfully',
      })
      setDepartment(response.data)
    } catch (error) {
      console.error('Error updating department head:', error)
      toast({
        title: 'Error',
        description: 'Failed to update department head',
        variant: 'destructive'
      })
    } finally {
      setHeadChangeLoading(false)
      setConfirmHeadChange(null)
    }
  }

  const filteredEmployees = searchQuery 
    ? employeeList.filter(emp => 
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : employeeList

  if (isLoading || !department) return <Loader />

  // Format dates if available
  const createdAt = department.createdAt 
    ? new Date(department.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : null;
  
  return (
    <div className=" w-full mx-auto p-4 space-y-6 overflow-auto">
      {/* Breadcrumb and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/p/department/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Departments</span>
          </Button>
        </div>
        {(hasEditPermission || isCurrentUserHead) && (
          <div className="flex items-center gap-2">
            <ButtonOfSpecificDepartmentEdit id={id} user={user} />
          </div>
        )}
      </div>

      {/* Department header card */}
      <Card className="border-t-4 border-t-primary">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <CardTitle className="text-2xl font-bold">
                  {department?.name}
                </CardTitle>
                <Badge variant={department?.status ? "default" : "outline"}>
                  {department?.status ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-2">
                <code className="px-1 py-0.5 bg-muted rounded text-sm">{department?.code}</code>
                {department.parentDepartment && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <FolderTree className="h-3.5 w-3.5" />
                    <span className="text-sm">
                      Parent: <Button 
                        variant="link" 
                        className="p-0 h-auto text-sm"
                        onClick={() => navigate(`/p/department/${department.parentDepartment?.id}`)}
                      >
                        {department.parentDepartment?.name}
                      </Button>
                    </span>
                  </div>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Description */}
            {department?.description && (
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="text-sm leading-relaxed">
                  {department?.description}
                </p>
              </div>
            )}

            {/* Key details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Location</span>
                </div>
                <p>{department?.location || 'Not specified'}</p>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5" />
                  <span>Budget</span>
                </div>
                <p className="font-medium">₹{department?.budget?.toLocaleString() || 0}</p>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>Team Size</span>
                </div>
                <p>{department?.users?.length || 0} member{department?.users?.length !== 1 ? 's' : ''}</p>
              </div>

              {createdAt && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Created</span>
                  </div>
                  <p>{createdAt}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department head section */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Department Leadership
            </CardTitle>
            {canChangeHead && (
              <Dialog onOpenChange={(isOpen) => {
                if (isOpen) fetchEmployeeList();
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-auto">
                    {department.departmentHead ? "Change Head" : "Assign Head"}
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-h-[80vh] overflow-y-auto w-[90vw] max-w-md'>
                  <DialogHeader>
                    <DialogTitle>Select Department Head</DialogTitle>
                    <DialogDescription>
                      The department head will have additional permissions to manage this department.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, email or ID..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                      {filteredEmployees.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          {searchQuery ? "No employees match your search" : "No employees found"}
                        </div>
                      ) : (
                        filteredEmployees.map((emp) => (
                          <div
                            key={emp.id}
                            className={`flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer ${
                              department.departmentHead?.id === emp.id ? 'bg-muted' : ''
                            }`}
                            onClick={() => setConfirmHeadChange(emp)}
                          >
                            <div className="flex items-center space-x-2">
                              <Avatar>
                                <AvatarFallback>
                                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                                <p className="text-xs text-muted-foreground">{emp.email}</p>
                              </div>
                            </div>
                            {department.departmentHead?.id === emp.id && (
                              <Badge variant="outline" className="bg-primary/10">Current</Badge>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {department.departmentHead ? (
            <div className="flex items-center space-x-4 p-4 bg-muted/40 rounded-md">
              <Avatar className="h-14 w-14">
                <AvatarImage src="" />
                <AvatarFallback className="text-lg">
                  {department?.departmentHead?.firstName?.[0]}
                  {department?.departmentHead?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">
                  {department?.departmentHead?.firstName} {department?.departmentHead?.lastName}
                </h3>
                <p className="text-sm text-muted-foreground mb-1">
                  {department?.departmentHead?.email}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {department?.departmentHead?.employeeId}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(`/p/profile/${department?.departmentHead?.id}`)}
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 p-6 bg-muted/40 rounded-md border-dashed border-2 border-muted-foreground/20">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <p className="text-muted-foreground">
                No department head assigned. 
                {canChangeHead && " Use the 'Assign Head' button to appoint a leader."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
            <Badge variant="secondary" className="ml-2">
              {department?.users?.length || 0}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {department?.users?.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 bg-muted/40 rounded-md">
              No team members yet
            </div>
          ) : (
            <div className="space-y-4">
              {/* Avatar stack for visual display */}
              <div className="flex items-center flex-wrap gap-1 mb-4">
                {department?.users?.slice(0, 10).map((member) => (
                  <MemberAvatar key={member.id} user={member} />
                ))}
                {department?.users?.length > 10 && (
                  <Badge variant="secondary" className="ml-2 h-9 rounded-full px-2">
                    +{department?.users?.length - 10} more
                  </Badge>
                )}
              </div>
                
              {/* Members table/list */}
              <div className="space-y-1 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Name</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {department?.users?.map((member) => (
                      <TableRow 
                        key={member.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/p/profile/${member.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {member.firstName?.[0]}{member.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>{member.firstName} {member.lastName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="px-1 py-0.5 bg-muted rounded text-xs">
                            {member.employeeId || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {member.email}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation dialog for changing head */}
      <AlertDialog open={!!confirmHeadChange} onOpenChange={(open) => !open && setConfirmHeadChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Department Head Change</AlertDialogTitle>
            <AlertDialogDescription>
              {department.departmentHead ? (
                <>
                  Are you sure you want to change the department head from <strong>{department.departmentHead?.firstName} {department.departmentHead?.lastName}</strong> to <strong>{confirmHeadChange?.firstName} {confirmHeadChange?.lastName}</strong>?
                </>
              ) : (
                <>
                  Are you sure you want to assign <strong>{confirmHeadChange?.firstName} {confirmHeadChange?.lastName}</strong> as the department head?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={headChangeLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmHeadChange && handleChangeHead(confirmHeadChange.id)}
              disabled={headChangeLoading}
            >
              {headChangeLoading ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default SpecificDepartmentView