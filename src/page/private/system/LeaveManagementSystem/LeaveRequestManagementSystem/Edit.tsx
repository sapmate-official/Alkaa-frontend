import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/services/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { APIDictionary } from '@/api/v2/APIdict'
import axios from 'axios'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { 
  ArrowLeft, 
  Save, 
  Calendar as CalendarIcon, 
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  User
} from 'lucide-react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import RouteDict from '@/routes/RouteDict'

interface LeaveRequest {
  id: string
  startDate: Date
  endDate: Date
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  numberOfDays: number
  leaveType?: {
    id: string
    name: string
  }
  createdAt: string
}

const EditLeaveRequest = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  useEffect(() => {
    const fetchLeaveRequest = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${APIDictionary.leave_request}/${id}`, {
          withCredentials: true
        })
        
        if (response.data.status !== 'PENDING') {
          toast({
            title: "Error",
            description: "Only pending leave requests can be edited",
            variant: "destructive"
          })
          navigate(RouteDict.Leave.Requests.List)
          return
        }

        setLeaveRequest({
          ...response.data,
          startDate: new Date(response.data.startDate),
          endDate: new Date(response.data.endDate)
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch leave request details",
          variant: "destructive"
        })
        navigate(RouteDict.Leave.Requests.List)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchLeaveRequest()
    }
  }, [id])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!leaveRequest?.startDate) {
      newErrors.startDate = 'Start date is required'
    }

    if (!leaveRequest?.endDate) {
      newErrors.endDate = 'End date is required'
    }

    if (leaveRequest?.startDate && leaveRequest?.endDate && leaveRequest.startDate > leaveRequest.endDate) {
      newErrors.endDate = 'End date must be after start date'
    }

    if (!leaveRequest?.reason?.trim()) {
      newErrors.reason = 'Reason is required'
    } else if (leaveRequest.reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateDays = () => {
    if (!leaveRequest?.startDate || !leaveRequest?.endDate) return 0
    
    const start = new Date(leaveRequest.startDate)
    const end = new Date(leaveRequest.endDate)
    
    if (start.toDateString() === end.toDateString()) {
      return 1
    }
    
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    
    return diffDays
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive"
      })
      return
    }

    setSaving(true)

    try {
      if (!leaveRequest) return

      const response = await axios.put(
        `${APIDictionary.leave_request}/${id}`,
        {
          startDate: leaveRequest.startDate.toLocaleDateString('en-CA'),
          endDate: leaveRequest.endDate.toLocaleDateString('en-CA'),
          reason: leaveRequest.reason.trim()
        },
        { withCredentials: true }
      )

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Leave request updated successfully"
        })
        navigate(RouteDict.Leave.Requests.List)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update leave request",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
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
          <p className="text-lg font-medium">Loading leave request...</p>
        </motion.div>
      </div>
    )
  }

  if (!leaveRequest) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Leave request not found</h3>
            <p className="text-muted-foreground mb-4">The requested leave request could not be found.</p>
            <Button onClick={() => navigate(RouteDict.Leave.Requests.List)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requests
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const daysRequested = calculateDays()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(RouteDict.Home)}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(RouteDict.Leave.Requests.List)}>Leave Requests</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Edit Request</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Leave Request</h1>
          <p className="text-muted-foreground">Update your leave request details</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate(RouteDict.Leave.Requests.List)}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Requests</span>
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-md">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <span>Request Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-blue-500" />
                      <span>Start Date</span>
                    </label>
                    <div className="border rounded-lg p-3">
                      <Calendar
                        mode="single"
                        selected={leaveRequest.startDate}
                        onSelect={(date) => {
                          if (date) {
                            setLeaveRequest(prev => ({ 
                              ...prev!, 
                              startDate: date,
                              endDate: date > prev!.endDate ? date : prev!.endDate
                            }))
                          }
                        }}
                        disabled={(date) => date < new Date() || (leaveRequest.endDate && date > leaveRequest.endDate)}
                        className="w-full"
                      />
                      {leaveRequest.startDate && (
                        <div className="flex items-center justify-center mt-2 gap-2 text-sm font-medium text-primary">
                          <Clock className="h-3 w-3" />
                          {format(leaveRequest.startDate, "EEEE, MMMM d, yyyy")}
                        </div>
                      )}
                    </div>
                    {errors.startDate && (
                      <p className="text-sm text-red-500 flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{errors.startDate}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-blue-500" />
                      <span>End Date</span>
                    </label>
                    <div className="border rounded-lg p-3">
                      <Calendar
                        mode="single"
                        selected={leaveRequest.endDate}
                        onSelect={(date) => {
                          if (date) {
                            setLeaveRequest(prev => ({ ...prev!, endDate: date }))
                          }
                        }}
                        disabled={(date) => date < leaveRequest.startDate}
                        className="w-full"
                      />
                      {leaveRequest.endDate && (
                        <div className="flex items-center justify-center mt-2 gap-2 text-sm font-medium text-primary">
                          <Clock className="h-3 w-3" />
                          {format(leaveRequest.endDate, "EEEE, MMMM d, yyyy")}
                        </div>
                      )}
                    </div>
                    {errors.endDate && (
                      <p className="text-sm text-red-500 flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{errors.endDate}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>Reason for Leave</span>
                  </label>
                  <Textarea
                    value={leaveRequest.reason}
                    onChange={(e) => setLeaveRequest(prev => ({ ...prev!, reason: e.target.value }))}
                    placeholder="Please provide details about your leave request"
                    className="min-h-[120px] resize-none"
                  />
                  <div className="flex justify-between items-center">
                    {errors.reason && (
                      <p className="text-sm text-red-500 flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{errors.reason}</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {leaveRequest.reason.length} characters (minimum 10)
                    </p>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex space-x-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(RouteDict.Leave.Requests.List)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {saving ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Request Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Request Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Leave Type:</span>
                  <Badge variant="outline">{leaveRequest.leaveType?.name}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Duration:</span>
                  <Badge variant="outline">{daysRequested} {daysRequested === 1 ? 'day' : 'days'}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Created:</span>
                  <span className="text-sm">{format(new Date(leaveRequest.createdAt), 'PP')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-500" />
                <span>Employee Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Important Note */}
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
            <CardContent className="p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Important Note</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Only pending requests can be edited. Once approved or rejected, modifications are not allowed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default EditLeaveRequest