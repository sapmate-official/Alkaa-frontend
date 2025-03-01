import { APIDictionary } from '@/api/APIdict'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  departmentHead: {
    firstName: string
    lastName: string
  }
}

const ListOfDepartment = () => {
    const navigate = useNavigate()
    const [departments, setDepartments] = useState<Department[]>([])
    const {user} = useAuth()

    const fetchList = async () => {
        try {
            const response = await axios.get(`${APIDictionary.department}/org/${user?.orgId}`, { withCredentials: true })
            setDepartments(response.data)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        fetchList()
    }, [])

    return (
        <div className="p-4 w-full h-full ">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Departments</h1>
                <Button onClick={() => navigate("/p/department/create")}>
                    Create Department
                </Button>
            </div>
            
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Department Head</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Description</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {departments.map((dept) => (
                        <TableRow 
                            key={dept.id}
                            className="cursor-pointer hover:bg-gray-800"
                            onClick={() => navigate(`/p/department/${dept.id}`)}
                        >
                            <TableCell className="font-medium">{dept?.name}</TableCell>
                            <TableCell>{dept?.code}</TableCell>
                            <TableCell>{dept?.location}</TableCell>
                            <TableCell>
                                {dept?.departmentHead?.firstName} {dept?.departmentHead?.lastName}
                            </TableCell>
                            <TableCell>${dept?.budget?.toLocaleString()}</TableCell>
                            <TableCell className="max-w-xs truncate">
                                {dept?.description}
                            </TableCell>
                        </TableRow>
                    ))}
                    {departments.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center">
                                No departments found
                            </TableCell>
                        </TableRow>
                    )}
                    
                </TableBody>
            </Table>
        </div>
    )
}

export default ListOfDepartment