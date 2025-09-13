import { useAuth } from '@/providers/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  Edit2, 
  Trash2, 
  Plus, 
  Search, 
  Filter,
  RefreshCw,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Eye
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAtom } from 'jotai'
import { permissionListAtom } from '@/store/atom'
import RouteDict from '@/routes/RouteDict'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useLeaveRequestsQuery,
  useDeleteLeaveRequestMutation
} from '@/hooks/queries'

interface LeaveRequest {
  id: string
  userId: string
  leaveTypeId: string
  startDate: string
  endDate: string
  numberOfDays: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
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
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const [canCreateLeaveRequest, setCanCreateLeaveRequest] = useState(false)
  const [canApproveLeaveRequest, setCanApproveLeaveRequest] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [permissionList] = useAtom(permissionListAtom)

  // TanStack Query hooks
  const { data: leaveRequests = [], isLoading, refetch } = useLeaveRequestsQuery(user?.id, !!user?.id)
  const deleteMutation = useDeleteLeaveRequestMutation()

  const checkPermissions = () => {
    setCanCreateLeaveRequest(permissionList.some(permission => permission.key === 'leave_request'))
    setCanApproveLeaveRequest(
      permissionList.some(permission=>permission.key === 'approve_leave') || permissionList.some(permission => permission.key === 'leave_request_approve')
    )
  }

  useEffect(() => {
    checkPermissions()
  }, [permissionList])

  useEffect(() => {
    filterRequests()
  }, [searchTerm, statusFilter, leaveRequests])

  const filterRequests = () => {
    let filtered = leaveRequests

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.leaveType?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.status.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(request => request.status === statusFilter)
    }

    setFilteredRequests(filtered)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'APPROVED': { 
        variant: 'default' as const, 
        className: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle2 
      },
      'REJECTED': { 
        variant: 'destructive' as const, 
        className: 'bg-red-100 text-red-800 border-red-200', 
        icon: XCircle 
      },
      'PENDING': { 
        variant: 'secondary' as const, 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Clock 
      }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING']
    const Icon = config.icon

    return (
      <Badge className={`${config.className} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{status}</span>
      </Badge>
    )
  }

  const handleEdit = (id: string) => {
    navigate(RouteDict.Leave.Requests.Edit(id))
  }

  const handleDelete = async (id: string) => {
    // Confirm before deleting
    if (!window.confirm("Are you sure you want to delete this leave request?")) {
      return
    }

    try {
      await deleteMutation.mutateAsync(id)
      toast({
        title: "Success",
        description: "Leave request deleted successfully",
        variant: "default"
      })
      refetch() // Refetch the leave requests after deletion
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete leave request",
        variant: "destructive"
      })
      console.error("Error deleting leave request:", error)
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {filteredRequests.map((request: LeaveRequest, index: number) => (
          <motion.div
            key={request.id}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <Card className="h-full shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-400">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <CardTitle className="text-lg">{request.leaveType?.name || 'Unknown'}</CardTitle>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(new Date(request.startDate), 'MMM dd')} - {format(new Date(request.endDate), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    {request.numberOfDays} {request.numberOfDays === 1 ? 'day' : 'days'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Reason:</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {request.reason || 'No reason provided'}
                  </p>
                </div>

                {request.rejectedReason && (
                  <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">Rejection Reason:</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{request.rejectedReason}</p>
                  </div>
                )}

                <Separator />
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Created {format(new Date(request.createdAt), 'PP')}
                  </p>
                  
                  {request.status === 'PENDING' ? (
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(request.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Leave Request</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this leave request? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(request.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )

  // const renderTableView = () => (
  //   <Card>
  //     <Table>
  //       <TableHeader>
  //         <TableRow>
  //           <TableHead>Leave Type</TableHead>
  //           <TableHead>Start Date</TableHead>
  //           <TableHead>End Date</TableHead>
  //           <TableHead>Days</TableHead>
  //           <TableHead>Reason</TableHead>
  //           <TableHead>Status</TableHead>
  //           <TableHead>Created At</TableHead>
  //           <TableHead>Actions</TableHead>
  //         </TableRow>
  //       </TableHeader>
  //       <TableBody>
  //         {filteredRequests?.map((request) => (
  //           <TableRow key={request?.id}>
  //             <TableCell className="font-medium">{request?.leaveType?.name || 'Unknown'}</TableCell>
  //             <TableCell>{format(new Date(request?.startDate), 'PP')}</TableCell>
  //             <TableCell>{format(new Date(request?.endDate), 'PP')}</TableCell>
  //             <TableCell>{request?.numberOfDays}</TableCell>
  //             <TableCell className="max-w-[200px] truncate">
  //               {request?.reason || 'No reason provided'}
  //             </TableCell>
  //             <TableCell>{getStatusBadge(request?.status)}</TableCell>
  //             <TableCell>{format(new Date(request?.createdAt), 'PP')}</TableCell>
  //             <TableCell>
  //               {request?.status === 'PENDING' ? (
  //                 <DropdownMenu>
  //                   <DropdownMenuTrigger asChild>
  //                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
  //                       <MoreHorizontal className="h-4 w-4" />
  //                     </Button>
  //                   </DropdownMenuTrigger>
  //                   <DropdownMenuContent align="end">
  //                     <DropdownMenuItem onClick={() => handleEdit(request.id)}>
  //                       <Edit2 className="h-4 w-4 mr-2" />
  //                       Edit
  //                     </DropdownMenuItem>
  //                     <DropdownMenuItem 
  //                       onClick={() => handleDelete(request.id)}
  //                       className="text-red-600"
  //                     >
  //                       <Trash2 className="h-4 w-4 mr-2" />
  //                       Delete
  //                     </DropdownMenuItem>
  //                   </DropdownMenuContent>
  //                 </DropdownMenu>
  //               ) : (
  //                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
  //                   <Eye className="h-4 w-4" />
  //                 </Button>
  //               )}
  //             </TableCell>
  //           </TableRow>
  //         ))}
  //       </TableBody>
  //     </Table>
  //   </Card>
  // )

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <Spinner size="lg" />
          <p className="text-lg font-medium">Loading your leave requests...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Leave Requests</h2>
          <p className="text-muted-foreground">Manage and track your leave applications</p>
        </div>
        <div className='flex space-x-3'>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          {canApproveLeaveRequest && (
            <Button 
              onClick={() => navigate(RouteDict.Leave.Requests.Approval)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve Requests
            </Button>
          )}
          {canCreateLeaveRequest && (
            <Button 
              onClick={() => navigate(RouteDict.Leave.Requests.Create)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              Create Request
            </Button>
          )}
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 items-center justify-between"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="text-xs"
            >
              {status}
              {status !== 'ALL' && (
                <Badge variant="secondary" className="ml-2 h-4 w-4 p-0 text-xs">
                  {leaveRequests.filter(req => req.status === status).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => {
          const count = status === 'ALL' ? leaveRequests.length : leaveRequests.filter(req => req.status === status).length
          const icons = {
            ALL: FileText,
            PENDING: Clock,
            APPROVED: CheckCircle2,
            REJECTED: XCircle
          }
          const Icon = icons[status]
          
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{status === 'ALL' ? 'Total' : status}</span>
                </div>
                <p className="text-2xl font-bold mt-2">{count}</p>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {filteredRequests.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No leave requests found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'ALL' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'You haven\'t created any leave requests yet'
                }
              </p>
              {canCreateLeaveRequest && !searchTerm && statusFilter === 'ALL' && (
                <Button onClick={() => navigate(RouteDict.Leave.Requests.Create)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Request
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          renderCardView()
        )}
      </motion.div>
    </div>
  )
}

export default LeaveRequestList