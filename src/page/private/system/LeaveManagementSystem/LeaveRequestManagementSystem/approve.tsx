import { APIDictionary } from "@/api/v2/APIdict"
import { LeaveRequest } from "@/interface/general"
import { useAuth } from "@/services/AuthContext"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
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
import { motion, AnimatePresence } from "framer-motion"
import { 
    CheckCircle, 
    XCircle, 
    Clock, 
    User, 
    Calendar, 
    FileText, 
    AlertCircle,
    Search,
    Filter,
    RefreshCw,
    Eye,
    ChevronRight,
    FileCheck
} from "lucide-react"

const LeaveRequestApprove = () => {
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
    const [rejectionReason, setRejectionReason] = useState("")
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
    const { user } = useAuth()
    const { toast } = useToast()

    const fetchLeaveRequests = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${APIDictionary.leave_request}/manager/${user?.id}`, { 
                withCredentials: true 
            })
            if (response.status === 200) {
                setLeaveRequests(response.data || [])
                // If selected request is no longer available, clear selection
                if (selectedRequest) {
                    const updatedRequest = response.data.find((req: LeaveRequest) => req.id === selectedRequest.id)
                    if (updatedRequest) {
                        setSelectedRequest(updatedRequest)
                    } else {
                        setSelectedRequest(null)
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching leave requests:', error)
            toast({
                title: "Error",
                description: "Failed to fetch leave requests",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (id: string) => {
        try {
            setActionLoading(true)
            await axios.post(`${APIDictionary.leave_request}/approve/${id}`, {
                approvedBy: user?.id
            }, { withCredentials: true });

            toast({
                title: "Success",
                description: "Leave request approved successfully",
                variant: "default"
            });
            
            // Refresh the list to get updated data
            await fetchLeaveRequests();

        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.error || "Failed to approve leave request";

                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive"
                });

                // If the request was invalid or not found, refresh the list
                if (error.response?.status === 404 || error.response?.status === 400) {
                    await fetchLeaveRequests();
                }
            } else {
                toast({
                    title: "Error",
                    description: "An unexpected error occurred",
                    variant: "destructive"
                });
            }
        } finally {
            setActionLoading(false)
        }
    }

    const handleReject = async (id: string) => {
        if (!rejectionReason?.trim()) {
            toast({
                title: "Error",
                description: "Please provide a rejection reason",
                variant: "destructive"
            })
            return
        }

        try {
            setActionLoading(true)
            await axios.post(`${APIDictionary.leave_request}/reject/${id}`, {
                approvedBy: user?.id,
                rejectedReason: rejectionReason
            }, { withCredentials: true })
            
            toast({
                title: "Success",
                description: "Leave request rejected successfully"
            })
            
            setRejectionReason("")
            // Refresh the list to get updated data
            await fetchLeaveRequests()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to reject leave request",
                variant: "destructive"
            })
        } finally {
            setActionLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'REJECTED':
                return 'bg-red-100 text-red-800 border-red-200'
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <CheckCircle className="h-4 w-4" />
            case 'REJECTED':
                return <XCircle className="h-4 w-4" />
            case 'PENDING':
                return <Clock className="h-4 w-4" />
            default:
                return <AlertCircle className="h-4 w-4" />
        }
    }

    // Filter requests based on search term and status
    const filteredRequests = leaveRequests.filter(request => {
        const matchesSearch = searchTerm === '' || 
            `${request.user?.firstName} ${request.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.leaveType?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.reason?.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter
        
        return matchesSearch && matchesStatus
    })

    const pendingRequests = filteredRequests.filter(req => req.status === 'PENDING')
    const processedRequests = filteredRequests.filter(req => req.status !== 'PENDING')

    useEffect(() => {
        fetchLeaveRequests()
    }, [user?.id])

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
    }

    const detailsVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 }
    }

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4"
                >
                    <Spinner size="lg" />
                    <p className="text-lg font-medium">Loading leave requests...</p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                            <FileCheck className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                Leave Request Approval
                            </h1>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Review and manage employee leave requests
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={fetchLeaveRequests}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        className="flex items-center space-x-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </Button>
                </div>
            </motion.div>

            <ResizablePanelGroup
                direction="horizontal"
                className="h-[calc(100vh-80px)] w-full"
            >
                {/* Left Panel - List of Leave Requests */}
                <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                    <div className="h-full flex flex-col p-4">
                        {/* Search and Filter */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-4 mb-4"
                        >
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by name, leave type, or reason..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <div className="flex space-x-1">
                                    {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
                                        <Button
                                            key={status}
                                            variant={statusFilter === status ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setStatusFilter(status)}
                                            className="text-xs"
                                        >
                                            {status}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Request Lists */}
                        <ScrollArea className="flex-1">
                            <div className="space-y-6">
                                {/* Pending Requests */}
                                {pendingRequests.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <div className="flex items-center space-x-2 mb-3">
                                            <Clock className="h-5 w-5 text-orange-500" />
                                            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                                                Pending Requests
                                            </h3>
                                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                                                {pendingRequests.length}
                                            </Badge>
                                        </div>
                                        <AnimatePresence>
                                            {pendingRequests.map((request, index) => (
                                                <motion.div
                                                    key={request.id}
                                                    variants={cardVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="exit"
                                                    transition={{ delay: index * 0.05 }}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <Card
                                                        className={`mb-3 cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 border-l-orange-400 ${
                                                            selectedRequest?.id === request.id 
                                                                ? 'ring-2 ring-blue-500 shadow-lg' 
                                                                : 'hover:border-l-orange-500'
                                                        }`}
                                                        onClick={() => setSelectedRequest(request)}
                                                    >
                                                        <CardContent className="p-4">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <User className="h-4 w-4 text-slate-500" />
                                                                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                                                        {request.user?.firstName} {request.user?.lastName}
                                                                    </h4>
                                                                </div>
                                                                <Badge className={`${getStatusColor(request.status)} flex items-center space-x-1`}>
                                                                    {getStatusIcon(request.status)}
                                                                    <span>{request.status}</span>
                                                                </Badge>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                                                                    <FileText className="h-3 w-3" />
                                                                    <span>{request.leaveType?.name}</span>
                                                                </p>
                                                                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    <span>
                                                                        {format(new Date(request.startDate), 'MMM dd')} - {format(new Date(request.endDate), 'MMM dd, yyyy')}
                                                                    </span>
                                                                </p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-500">
                                                                    {request.numberOfDays} {request.numberOfDays === 1 ? 'day' : 'days'}
                                                                </p>
                                                            </div>
                                                            <div className="mt-2 flex justify-end">
                                                                <ChevronRight className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </motion.div>
                                )}

                                {/* Processed Requests */}
                                {processedRequests.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <Separator className="my-4" />
                                        <div className="flex items-center space-x-2 mb-3">
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                                                Processed Requests
                                            </h3>
                                            <Badge variant="outline" className="text-green-600 border-green-300">
                                                {processedRequests.length}
                                            </Badge>
                                        </div>
                                        <AnimatePresence>
                                            {processedRequests.map((request, index) => (
                                                <motion.div
                                                    key={request.id}
                                                    variants={cardVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="exit"
                                                    transition={{ delay: index * 0.05 }}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <Card
                                                        className={`mb-3 cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${
                                                            request.status === 'APPROVED' ? 'border-l-green-400' : 'border-l-red-400'
                                                        } ${
                                                            selectedRequest?.id === request.id 
                                                                ? 'ring-2 ring-blue-500 shadow-lg' 
                                                                : ''
                                                        }`}
                                                        onClick={() => setSelectedRequest(request)}
                                                    >
                                                        <CardContent className="p-4">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <User className="h-4 w-4 text-slate-500" />
                                                                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                                                        {request.user?.firstName} {request.user?.lastName}
                                                                    </h4>
                                                                </div>
                                                                <Badge className={`${getStatusColor(request.status)} flex items-center space-x-1`}>
                                                                    {getStatusIcon(request.status)}
                                                                    <span>{request.status}</span>
                                                                </Badge>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                                                                    <FileText className="h-3 w-3" />
                                                                    <span>{request.leaveType?.name}</span>
                                                                </p>
                                                                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    <span>
                                                                        {format(new Date(request.startDate), 'MMM dd')} - {format(new Date(request.endDate), 'MMM dd, yyyy')}
                                                                    </span>
                                                                </p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-500">
                                                                    {request.numberOfDays} {request.numberOfDays === 1 ? 'day' : 'days'}
                                                                </p>
                                                            </div>
                                                            <div className="mt-2 flex justify-end">
                                                                <ChevronRight className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </motion.div>
                                )}

                                {/* No requests found */}
                                {filteredRequests.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-12"
                                    >
                                        <FileCheck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                                            No leave requests found
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            {searchTerm || statusFilter !== 'ALL' 
                                                ? 'Try adjusting your search or filter criteria' 
                                                : 'There are no leave requests to review at the moment'
                                            }
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </ResizablePanel>

                <ResizableHandle />

                {/* Right Panel - Selected Leave Request Details */}
                <ResizablePanel defaultSize={65}>
                    <div className="h-full p-4">
                        <AnimatePresence mode="wait">
                            {selectedRequest ? (
                                <motion.div
                                    key={selectedRequest.id}
                                    variants={detailsVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    className="h-full flex flex-col"
                                >
                                    <Card className="h-full shadow-lg flex flex-col">
                                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b flex-shrink-0">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-blue-500 rounded-lg">
                                                        <Eye className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                                                            Leave Request Details
                                                        </CardTitle>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                                            Submitted on {format(new Date(selectedRequest.createdAt), 'PPP')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge className={`${getStatusColor(selectedRequest.status)} flex items-center space-x-1 text-sm px-3 py-1`}>
                                                    {getStatusIcon(selectedRequest.status)}
                                                    <span>{selectedRequest.status}</span>
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-1 min-h-0 p-0">
                                            <ScrollArea className="h-full">
                                                <div className="p-6 space-y-6">
                                                    {/* Employee Information */}
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.1 }}
                                                        className="grid grid-cols-2 gap-6"
                                                    >
                                                        <div className="space-y-2">
                                                            <div className="flex items-center space-x-2">
                                                                <User className="h-4 w-4 text-blue-500" />
                                                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">Employee</h4>
                                                            </div>
                                                            <p className="text-slate-700 dark:text-slate-300 pl-6">
                                                                {selectedRequest.user?.firstName} {selectedRequest.user?.lastName}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center space-x-2">
                                                                <FileText className="h-4 w-4 text-blue-500" />
                                                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">Leave Type</h4>
                                                            </div>
                                                            <p className="text-slate-700 dark:text-slate-300 pl-6">
                                                                {selectedRequest.leaveType?.name}
                                                            </p>
                                                        </div>
                                                    </motion.div>

                                                    <Separator />

                                                    {/* Duration Information */}
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.2 }}
                                                        className="space-y-4"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <Calendar className="h-4 w-4 text-blue-500" />
                                                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Duration</h4>
                                                        </div>
                                                        <div className="pl-6 space-y-2">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-sm text-slate-600 dark:text-slate-400">Start Date</p>
                                                                    <p className="font-medium text-slate-900 dark:text-slate-100">
                                                                        {format(new Date(selectedRequest.startDate), 'EEEE, PPP')}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm text-slate-600 dark:text-slate-400">End Date</p>
                                                                    <p className="font-medium text-slate-900 dark:text-slate-100">
                                                                        {format(new Date(selectedRequest.endDate), 'EEEE, PPP')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <p className="text-sm text-slate-600 dark:text-slate-400">Total Duration:</p>
                                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                    {selectedRequest.numberOfDays} {selectedRequest.numberOfDays === 1 ? 'day' : 'days'}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </motion.div>

                                                    <Separator />

                                                    {/* Reason */}
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.3 }}
                                                        className="space-y-2"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <FileText className="h-4 w-4 text-blue-500" />
                                                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Reason</h4>
                                                        </div>
                                                        <div className="pl-6">
                                                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border">
                                                                <p className="text-slate-700 dark:text-slate-300">
                                                                    {selectedRequest.reason || 'No reason provided'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </motion.div>

                                                    {/* Rejection Reason (if rejected) */}
                                                    {selectedRequest.status === 'REJECTED' && selectedRequest.rejectedReason && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.4 }}
                                                            className="space-y-2"
                                                        >
                                                            <Separator />
                                                            <div className="flex items-center space-x-2">
                                                                <XCircle className="h-4 w-4 text-red-500" />
                                                                <h4 className="font-semibold text-red-900 dark:text-red-100">Rejection Reason</h4>
                                                            </div>
                                                            <div className="pl-6">
                                                                <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 border border-red-200 dark:border-red-800">
                                                                    <p className="text-red-700 dark:text-red-300">
                                                                        {selectedRequest.rejectedReason}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    {/* Action Buttons for Pending Requests */}
                                                    {selectedRequest.status === 'PENDING' && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.5 }}
                                                            className="space-y-4 pt-4 border-t"
                                                        >
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                                    Rejection Reason (Optional for approval, Required for rejection)
                                                                </label>
                                                                <Textarea
                                                                    placeholder="Enter reason for rejection (if rejecting) or additional comments..."
                                                                    value={rejectionReason}
                                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                                    className="min-h-[80px]"
                                                                />
                                                            </div>
                                                            <div className="flex space-x-3">
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button
                                                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                                                            disabled={actionLoading}
                                                                        >
                                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                                            Approve Request
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Approve Leave Request</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Are you sure you want to approve this leave request for{' '}
                                                                                <strong>{selectedRequest.user?.firstName} {selectedRequest.user?.lastName}</strong>?
                                                                                This action cannot be undone.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => handleApprove(selectedRequest.id)}
                                                                                className="bg-green-500 hover:bg-green-600"
                                                                                disabled={actionLoading}
                                                                            >
                                                                                {actionLoading ? (
                                                                                    <>
                                                                                        <Spinner size="sm" className="mr-2" />
                                                                                        Approving...
                                                                                    </>
                                                                                ) : (
                                                                                    'Approve'
                                                                                )}
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>

                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button
                                                                            variant="destructive"
                                                                            className="flex-1"
                                                                            disabled={actionLoading}
                                                                        >
                                                                            <XCircle className="h-4 w-4 mr-2" />
                                                                            Reject Request
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Reject Leave Request</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Are you sure you want to reject this leave request for{' '}
                                                                                <strong>{selectedRequest.user?.firstName} {selectedRequest.user?.lastName}</strong>?
                                                                                {!rejectionReason?.trim() && (
                                                                                    <span className="block mt-2 text-red-600 font-medium">
                                                                                        Please provide a rejection reason before proceeding.
                                                                                    </span>
                                                                                )}
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => handleReject(selectedRequest.id)}
                                                                                className="bg-red-500 hover:bg-red-600"
                                                                                disabled={actionLoading || !rejectionReason?.trim()}
                                                                            >
                                                                                {actionLoading ? (
                                                                                    <>
                                                                                        <Spinner size="sm" className="mr-2" />
                                                                                        Rejecting...
                                                                                    </>
                                                                                ) : (
                                                                                    'Reject'
                                                                                )}
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    {/* Approval Information (for processed requests) */}
                                                    {selectedRequest.status !== 'PENDING' && selectedRequest.approvedAt && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.4 }}
                                                            className="space-y-2 pt-4 border-t"
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                {selectedRequest.status === 'APPROVED' ? (
                                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                                ) : (
                                                                    <XCircle className="h-4 w-4 text-red-500" />
                                                                )}
                                                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                                                    {selectedRequest.status === 'APPROVED' ? 'Approved' : 'Rejected'} By
                                                                </h4>
                                                            </div>
                                                            <div className="pl-6">
                                                                <p className="text-slate-700 dark:text-slate-300">
                                                                    {format(new Date(selectedRequest.approvedAt), 'PPP')} at{' '}
                                                                    {format(new Date(selectedRequest.approvedAt), 'p')}
                                                                </p>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                    
                                                    {/* Add some bottom padding to ensure last content is visible */}
                                                    <div className="h-4"></div>
                                                </div>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex items-center justify-center"
                                >
                                    <div className="text-center space-y-4">
                                        <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                                            <Eye className="h-12 w-12 text-slate-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-2">
                                                Select a leave request
                                            </h3>
                                            <p className="text-slate-600 dark:text-slate-400">
                                                Choose a leave request from the list to view details and take action
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}

export default LeaveRequestApprove