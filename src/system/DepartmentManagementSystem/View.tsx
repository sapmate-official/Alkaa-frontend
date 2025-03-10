import { APIDictionary } from '@/api/v2/APIdict'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Users, MapPin, IndianRupee, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/services/AuthContext'
import Loader from '@/components/Loader'
import { Dialog, DialogContent,DialogTrigger } from '@/components/ui/dialog'
// import { User } from '@/interface/general'
// import { useToast } from '@/hooks/use-toast'

interface Department {
  id: string;
  name: string;
  description: string;
  code: string;
  location: string;
  budget: number;
  status: boolean;
  departmentHead: {
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
  };
  users: any[];
}

const SpecificDepartmentView = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [department, setDepartment] = useState<Department | null>(null)
  const navigate = useNavigate()
  // const [employeeList,setemployeeList] = useState<User[]>([])
  // const {toast} = useToast()
  console.log(user);
  // const fetchEmployeeList = async () => {
  //   try {
  //     const response = await axios.get(`${APIDictionary.Organization}/employees/${user?.orgId}`)
  //     setemployeeList(response.data)
  //   } catch (error) {
  //     toast({
  //       title: 'Error',
  //       description: 'Error fetching employee list',
  //       variant:'destructive'
  //     })
  //   }
  // }

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/p/department/${id ? id : user?.Department?.[0]?.id}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Department
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/p/department/list`)}
            >
              <Users className="h-4 w-4 mr-2" />
              List of Department
            </Button>
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Change Department Head</Button>
                </DialogTrigger>
                <DialogContent className='space-y-4 flex w-full justify-center items-center'>
                  <Card className='w-full h-full'>
                    <CardHeader>
                      Profile
                    </CardHeader>
                    <CardTitle>
                      
                    </CardTitle>
                  </Card>
                  <Card className='w-full h-full'>
                    
                  </Card>
                </DialogContent>
              </Dialog>
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