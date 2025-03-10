import { APIDictionary } from '@/api/v2/APIdict'
import Loader from '@/components/Loader'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { useAuth } from '@/services/AuthContext'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Department {
  id: string
  name: string
  code: string
  description: string
  location: string
  budget: number
  status: boolean,
  departmentHead: {
    firstName: string
    lastName: string
  }
}

const ListOfDepartment = () => {
    const navigate = useNavigate()
    const [departments, setDepartments] = useState<Department[]>([])
    const {user} = useAuth()
    const [loading, setLoading] = useState(false)

    const fetchList = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${APIDictionary.department}/org/${user?.orgId}`, { withCredentials: true })
            setDepartments(response.data)
        } catch (error) {
            console.log(error)
        }finally{

            setLoading(false)
        }
    }

    useEffect(() => {
        fetchList()
    }, [])

    return (
        <div className="p-4 w-full h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Departments</h1>
                <Button onClick={() => navigate("/p/department/create")}>
                    Create Department
                </Button>
            </div>
            {loading && (
                <div className="flex justify-center items-center h-64">
                    <Loader/>
                </div>
            )}
            
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map((dept) => (
                        <Card
                            key={dept.id}
                            className={`cursor-pointer hover:bg-accent transition-colors ${!dept.status ? 'opacity-60' : ''}`}
                            onClick={() => navigate(`/p/department/${dept.id}`)}
                        >
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            {dept.name}
                                            <span className={`text-xs px-2 py-1 rounded-full ${dept.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {dept?.status ? 'Active' : 'Inactive'}
                                            </span>
                                        </CardTitle>
                                        <CardDescription>{dept.code}</CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <CardDescription>Budget</CardDescription>
                                        <CardTitle>₹{dept.budget.toLocaleString()}</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">Location</p>
                                    <p>{dept.location}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Department Head</p>
                                    <p>{dept.departmentHead?.firstName} {dept.departmentHead?.lastName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Description</p>
                                    <p className="text-sm truncate">{dept.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {departments.length === 0 && (
                        <Card className="col-span-full">
                            <CardContent className="text-center py-8">
                                No departments found
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    )
}

export default ListOfDepartment