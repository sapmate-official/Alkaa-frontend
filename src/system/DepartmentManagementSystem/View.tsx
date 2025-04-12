import { APIDictionary } from '@/api/v2/APIdict'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Users, MapPin, IndianRupee, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/services/AuthContext'
import Loader from '@/components/Loader'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ButtonOfSpecificDepartmentEdit } from './Edit'
import { useToast } from '@/hooks/use-toast'
import CheckPermission from '@/services/PermissionCheck'
import { useAtom } from 'jotai'
import { permissionListAtom } from '@/store/atom'
import { Input } from '@/components/ui/input'

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
}

interface Department {
  id: string;
  name: string;
  description: string;
  code: string;
  location: string;
  budget: number;
  status: boolean;
  departmentHead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
  } | null;
  users: User[];
}

const SpecificDepartmentView = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [department, setDepartment] = useState<Department | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [permissions] = useAtom(permissionListAtom)
  const [employeeList, setEmployeeList] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [, setIsLoading] = useState(false)
  
  const hasChangeHeadPermission = CheckPermission("change_department_head", permissions)
  const isCurrentUserHead = department?.departmentHead?.id === user?.id
  const canChangeHead = isCurrentUserHead || hasChangeHeadPermission

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
    try {
      let response;
      if (user?.Department?.[0]?.id) {
        response = await axios.get(`${APIDictionary.department}/${user.Department[0].id}`)
        setDepartment(response.data)
        console.log(response)
        if (!response.data) {
          navigate("/p/department/list")
        }
      } else {
        navigate("/p/department/list")
      }
      if (id) {
        response = await axios.get(`${APIDictionary.department}/${id}`)
        setDepartment(response.data)
      }
      if (!department && user || id) {
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchDepartment()
  }, [user, id])

  const handleChangeHead = async (userId: string) => {
    setIsLoading(true)
    try {
      const response = await axios.put(
        `${APIDictionary.department}/${id}/head/${userId}`, 
        {}, // Empty object as request body
        { withCredentials: true } // Add this to include auth credentials
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
      setIsLoading(false)
    }
  }

  const filteredEmployees = searchQuery 
    ? employeeList.filter(emp => 
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : employeeList

  if (!department) return <Loader />

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {department?.name}
            </CardTitle>
            <Badge variant={department?.status ? "success" : "destructive"}>
              {department?.status ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline">{department?.code}</Badge>
            {user?.email === department?.departmentHead?.email && (
              <ButtonOfSpecificDepartmentEdit id={id} user={user}/>
            )}
            
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {department?.description}
            </p>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{department?.location}</span>
              </div>

              <div className="flex items-center space-x-2">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Budget: ₹{department?.budget?.toLocaleString()}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className='w-full flex justify-between items-center'>
                <h3 className="font-semibold">Department Head</h3>
                {canChangeHead && (
                  <Dialog onOpenChange={(isOpen) => {
                    if (isOpen) fetchEmployeeList();
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">Change Department Head</Button>
                    </DialogTrigger>
                    <DialogContent className='max-h-[80vh] overflow-y-auto'>
                      <DialogHeader>
                        <DialogTitle>Select New Department Head</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search employees..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          {filteredEmployees.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                              {searchQuery ? "No employees match your search" : "No employees found"}
                            </p>
                          ) : (
                            filteredEmployees.map((emp) => (
                              <div
                                key={emp.id}
                                className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                                onClick={() => handleChangeHead(emp.id)}
                              >
                                <div className="flex items-center space-x-2">
                                  <Avatar>
                                    <AvatarFallback>
                                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                                    <p className="text-sm text-muted-foreground">{emp.email}</p>
                                  </div>
                                </div>
                                <Badge variant="outline">{emp.employeeId}</Badge>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {department.departmentHead && (<div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {department?.departmentHead?.firstName?.[0]}
                    {department?.departmentHead?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {department?.departmentHead?.firstName} {department?.departmentHead?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {department?.departmentHead?.email}
                  </p>
                </div>
              </div>)}
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Members ({department?.users?.length || 0})
              </h3>
              {department?.users?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team members yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {department?.users?.map((user) => (
                    <div key={user?.id} className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate(`/p/profile/${user?.id}`)}>
                      <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback>
                          {user?.firstName?.[0]}
                          {user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SpecificDepartmentView