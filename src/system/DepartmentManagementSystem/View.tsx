import { APIDictionary } from '@/api/APIdict'
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
  const {user} = useAuth()
  const [department, setDepartment] = useState<Department | null>(null)
  const navigate = useNavigate()

  const fetchDepartment = async () => {   
    try {
      let response;
      if(user?.departmentId) {
        response = await axios.get(`${APIDictionary.department}/${user.departmentId}`)

      }else{
        response = await axios.get(`${APIDictionary.department}/${id}`)
      }
      setDepartment(response.data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchDepartment()
  }, [])

  if (!department) return <Loader/>

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {department.name}
            </CardTitle>
            <Badge variant={department.status ? "success" : "destructive"}>
              {department.status ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline">{department.code}</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/p/department/${id}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Department
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {department.description}
            </p>
            
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{department.location}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Budget: ₹{department.budget.toLocaleString()}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Department Head</h3>
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {department.departmentHead.firstName[0]}
                    {department.departmentHead.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {department.departmentHead.firstName} {department.departmentHead.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {department.departmentHead.email}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Members ({department.users.length})
              </h3>
              {department.users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team members yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Add team members list here */}
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