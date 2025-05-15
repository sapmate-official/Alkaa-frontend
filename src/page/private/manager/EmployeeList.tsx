// import { useToast } from '@/hooks/use-toast'
// import { User } from '@/interface/general'
// import { APIDictionary } from '@/api/v2/APIdict'
// import { useAuth } from '@/services/AuthContext'
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table"
// import { Badge } from "@/components/ui/badge"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import axios from 'axios'
// import React, { useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'

// const EmployeeList = () => {
//   const [employeeList, setEmployeeList] = React.useState<User[]>([])
//   const { toast } = useToast()
//   const { user, isLoading } = useAuth()
//   const navigate = useNavigate()
  

//   const fetchEmployeeList = async () => {
//     try {
//       const employeeList = await axios.get(APIDictionary.employee_list, { withCredentials: true })
//       console.log(employeeList)
//       if (employeeList.status == 200) {
//         setEmployeeList(employeeList.data)
//       }
//       else {
//         toast({
//           title: "Failed to fetch employee list",
//           description: "Please try again later",
//           variant: "destructive"
//         })
//         console.log("Failed to fetch employee list")
//       }
//     } catch (error) {
//       console.log(error)
//       toast({
//         title: "Failed to fetch employee list",
//         description: "Please try again later",
//         variant: "destructive"
//       })
//     }
//   }

//   const handleEmployeeClick = (id: string) => {
//     navigate(`/p/profile/${id}`)
//   }

//   useEffect(() => {
//     if (user && !isLoading) {
//       fetchEmployeeList()
//     }
//   }, [user, isLoading])

//   return (
//     <div className="p-4 w-full">
//       <Card>
//         <CardHeader>
//           <CardTitle>Employee List</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Name</TableHead>
//                 <TableHead>Email</TableHead>
//                 <TableHead>Status</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {employeeList.map((employee) => (
//                 <TableRow
//                   key={employee.id}
//                   onClick={() => handleEmployeeClick(employee.id)}
//                   className="cursor-pointer hover:bg-muted"
//                 >
//                   <TableCell className="font-medium">{employee.name}</TableCell>
//                   <TableCell>{employee.email}</TableCell>
//                   <TableCell>
//                     <Badge variant={employee.status === 'active' ? 'default' : 'destructive'}>
//                       {employee.status}
//                     </Badge>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// export default EmployeeList