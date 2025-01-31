import { useToast } from '@/hooks/use-toast'
import { LeaveRequest } from '@/interface/general'
import { APIDictionary } from '@/lib/APIdict'
import { useAuth } from '@/services/AuthContext'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import axios from 'axios'
import React, { useEffect } from 'react'
import { format } from 'date-fns'

const LeaveStatus = () => {
  const {user,isLoading} = useAuth()
  const {toast} = useToast()
  const [requestList,setrequestList] = React.useState<LeaveRequest[]>([])
  const fetchRequestList = async()=>{
    try {
      const RequestList = await axios.get(APIDictionary.list_of_leave_employee,{withCredentials:true})
      if(RequestList.status==200){
        setrequestList(RequestList.data)
      }
      else{
        toast({
          title:'Failed to fetch leave request',
          description:'Please try again later',
          variant:'destructive'
        })
        console.log('Failed to fetch leave request')
      }
      console.log(RequestList)
    } catch (error) {
      console.log(error)
    }
  }
  useEffect(() => {
    if(user && !isLoading){
    fetchRequestList()
    }
  },[user,isLoading])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500">Approved</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-500">Rejected</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-500">Pending</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM dd, yyyy')
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestList.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{formatDate(request?.startDate)}</TableCell>
                    <TableCell>{formatDate(request?.endDate)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {request.reason || 'No reason provided'}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDate(request?.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LeaveStatus