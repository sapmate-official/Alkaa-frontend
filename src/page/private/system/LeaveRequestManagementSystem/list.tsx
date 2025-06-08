import { useState, useEffect } from 'react'
import { useAuth } from '@/services/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { APIDictionary } from '@/api/v2/APIdict'
import axios from 'axios'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit2, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAtom } from 'jotai'
import { permissionListAtom } from '@/store/atom'

interface LeaveRequest {
  id: string
  userId: string
  leaveTypeId: string
  startDate: string
  endDate: string
  numberOfDays: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reason: string
  approvedBy: string | null
  approvedAt: string | null
  rejectedReason: string | null
  attachments: string | null
  createdAt: string
  updatedAt: string
  leaveType?: {
    name: string
  }
}

const LeaveRequestList = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [canCreateLeaveRequest, setCanCreateLeaveRequest] = useState(false)
  const [canApproveLeaveRequest, setCanApproveLeaveRequest] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [permissionList] = useAtom(permissionListAtom)

  const checkPermissions = () => {
    setCanCreateLeaveRequest(permissionList.some(permission => permission.key === 'leave_request'))
    setCanApproveLeaveRequest(
      permissionList.some(permission=>permission.key === 'approve_leave') || permissionList.some(permission => permission.key === 'leave_request_approve')
    )
  }

  const fetchLeaveRequests = async () => {
    try {
      const response = await axios.get(`${APIDictionary.leave_request}/user/${user?.id}`, {
        withCredentials: true
      })
      if (response?.status === 200) {
        console.log('Leave requests:', response?.data);
        
        setLeaveRequests(response?.data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch leave requests",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    fetchLeaveRequests()
    checkPermissions()
  }, [permissionList])

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

  const handleEdit = (id: string) => {
    navigate(`/p/leaverequest/edit/${id}`)
  }

  const handleDelete = async (id: string) => {
    // Confirm before deleting
    if (!window.confirm("Are you sure you want to delete this leave request?")) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await axios.delete(`${APIDictionary.leave_request}/${id}`, {
        withCredentials: true
      })

      if (response.status === 204) {
        toast({
          title: "Success",
          description: "Leave request deleted successfully",
          variant: "default"
        })
        // Refresh the leave requests list
        fetchLeaveRequests()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete leave request",
        variant: "destructive"
      })
      console.error("Error deleting leave request:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 bg-background2">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">My Leave Requests</h2>
        <div className='flex space-x-4'>
          {canCreateLeaveRequest && (
            <Button onClick={() => navigate('/p/leaverequest/create')}>
              Create Leave Request
            </Button>
          )}
          {canApproveLeaveRequest && (
            <Button onClick={() => navigate('/p/leaverequest/approve')}>
              Approve Leave Request
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Leave Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaveRequests?.map((request) => (
              <TableRow key={request?.id}>
                <TableCell>{request?.leaveType?.name || 'Unknown'}</TableCell>
                <TableCell>{format(new Date(request?.startDate), 'PP')}</TableCell>
                <TableCell>{format(new Date(request?.endDate), 'PP')}</TableCell>
                <TableCell>{request?.numberOfDays}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {request?.reason || 'No reason provided'}
                </TableCell>
                <TableCell>{getStatusBadge(request?.status)}</TableCell>
                <TableCell>{format(new Date(request?.createdAt), 'PP')}</TableCell>
                <TableCell>
                  {request?.status === 'PENDING' && (
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(request?.id)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(request?.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default LeaveRequestList