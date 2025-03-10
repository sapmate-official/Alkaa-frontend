import { useToast } from '@/hooks/use-toast'
import { LeaveRequest } from '@/interface/general'
import { APIDictionary } from '@/api/v2/APIdict'
import { useAuth } from '@/services/AuthContext'
import axios from 'axios'
import React, { useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

const LeaveRequestComponent = () => {
  const {user,isLoading} = useAuth()
  const {toast} = useToast()
  const [requestList,setrequestList] = React.useState<LeaveRequest[]>([])
  const fetchLeaveRequestList = async ()=>{
    try {
      const leaveRequestList = await axios.get(APIDictionary.list_of_leave_manager,{withCredentials:true})
      console.log(leaveRequestList);
      if(leaveRequestList.status==200){
        setrequestList(leaveRequestList.data)
        
      }
      else{
        toast({
          title:"Failed to fetch leave request",
          description:"Please try again later",
          variant:"destructive"
        })
        console.log("Failed to fetch leave request")
      }
    } catch (error) {
      console.log(error)
      toast({
        title:"Failed to fetch leave request",
        description:"Please try again later",
        variant:"destructive"
      })
    }
  }
  useEffect(() => {
    if(user && !isLoading){
      fetchLeaveRequestList()
    }
  },[user,isLoading])

  const handleLeaveResponse = async (id: string, status: 'APPROVED' | 'REJECTED', rejectedReason?: string) => {
    try {
      const response = await axios.post(APIDictionary.respondLeaveRequest, {
        leaveId: id,
        status,
        rejectedReason
      }, { withCredentials: true })

      if (response.status === 200) {
        toast({
          title: `Leave request ${status.toLowerCase()}`,
          description: "Leave request updated successfully",
          variant: "default"
        })
        fetchLeaveRequestList()
      }
    } catch (error) {
      toast({
        title: "Failed to update leave request",
        description: "Please try again later",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="p-4 w-full dark:bg-gray-800">
      <h2 className="text-2xl font-bold mb-4">Leave Requests</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee Name</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requestList.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request?.user?.name}</TableCell>
              <TableCell>{format(new Date(request.startDate), 'PPP')}</TableCell>
              <TableCell>{format(new Date(request.endDate), 'PPP')}</TableCell>
              <TableCell>{request.reason || 'No reason provided'}</TableCell>
              <TableCell>{request.status}</TableCell>
              <TableCell className="space-x-2">
                {request.status === 'PENDING' && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleLeaveResponse(request.id, 'APPROVED')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const reason = window.prompt('Enter rejection reason:')
                        if (reason) {
                          handleLeaveResponse(request.id, 'REJECTED', reason)
                        }
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default LeaveRequestComponent