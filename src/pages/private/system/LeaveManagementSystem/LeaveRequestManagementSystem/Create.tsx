import { APIDictionary } from '@/services/api/v2/APIdict'
import { useAuth } from '@/providers/AuthContext'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { format } from "date-fns"
import { CalendarDays, Clock, FileText, ArrowLeft, Check, User, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Checkbox } from "@/components/ui/checkbox"
import RouteDict from '@/routes/RouteDict'
import { motion } from "framer-motion"
import { Spinner } from '@/components/ui/spinner'

interface LeaveType {
  id: string;
  name: string;
  description: string;
}

interface FormData {
  leaveTypeId: string;
  startDate: Date | null;
  endDate: Date | null;
  reason: string;
  isSameDayLeave?: boolean; // New property
}

const LeaveRequestCreate = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [formData, setFormData] = useState<FormData>({
    leaveTypeId: '',
    startDate: null,
    endDate: null,
    reason: '',
    isSameDayLeave: false
  })
  const [leaveBalance, setLeaveBalance] = useState<number | null>(null)
  const [isSameDayLeave, setIsSameDayLeave] = useState(false)
  const navigate = useNavigate()

  // Fetch leave types
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const response = await axios.get(`${APIDictionary.get_all_org_leave_type(user?.orgId ?? "")}`, {
          withCredentials: true
        })
        setLeaveTypes(response.data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch leave types",
          variant: "destructive"
        })
      }
    }

    if (user?.orgId) {
      fetchLeaveTypes()
    }
  }, [user?.orgId])

  useEffect(() => {
    if (isSameDayLeave) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setFormData(prev => ({
        ...prev,
        startDate: today,
        endDate: today
      }));
    }
  }, [isSameDayLeave]);

  const validateLeaveBalance = async () => {
    try {
      const response = await axios.get(`${APIDictionary.leave_balance}/${formData?.leaveTypeId}/${user?.id}`, {
        withCredentials: true
      })
      const balance = response?.data
      return balance?.remainingDays > 0
    } catch (error) {
      toast({
          title: "Error",
          description: "Failed to check leave balance",
          variant: "destructive"
      })
      return false
    }
  }

  const fetchLeaveBalance = async (leaveTypeId: string) => {
    try {
      const response = await axios.get(`${APIDictionary.leave_balance}/${leaveTypeId}/${user?.id}`, {
        withCredentials: true
      })
      setLeaveBalance(response?.data?.remainingDays ?? null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch leave balance",
        variant: "destructive"
      })
      setLeaveBalance(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate form
      if (!formData?.leaveTypeId || !formData?.startDate || !formData?.endDate || !formData?.reason || !user?.id) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive"
        })
        return
      }

      // Check leave balance
      const hasBalance = await validateLeaveBalance()
      if (!hasBalance) {
        toast({
          title: "Error",
          description: "Insufficient leave balance",
          variant: "destructive"
        })
        return
      }

      // Prepare request payload with local date strings
      const requestData = {
        userId: user?.id,
        leaveTypeId: formData?.leaveTypeId,
        startDate: formData?.startDate?.toLocaleDateString('en-CA'), // YYYY-MM-DD format
        endDate: formData?.endDate?.toLocaleDateString('en-CA'), // YYYY-MM-DD format
        reason: formData?.reason
      }

      // Submit request
      const response = await axios.post(APIDictionary.leave_request, requestData, {
        withCredentials: true
      })

      if (response.status === 201) {
        toast({
          title: "Success",
          description: "Leave request submitted successfully"
        })
        // Reset form
        setFormData({
          leaveTypeId: '',
          startDate: null,
          endDate: null,
          reason: '',
          isSameDayLeave: false
        })
        navigate(RouteDict.Leave.Requests.List);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit leave request",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return null;
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    // Check if it's a same-day request
    if (start.toDateString() === end.toDateString()) {
      return 1;
    }
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return diffDays;
  };

  const daysRequested = calculateDays();

  return (
    <div className=" w-full p-6 space-y-6 overflow-y-auto">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={()=>navigate(RouteDict.Home)}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={()=>navigate(RouteDict.Leave.Requests.List)}>Leave Requests</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Create Request</BreadcrumbItem>
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
          <h1 className="text-3xl font-bold tracking-tight">Create Leave Request</h1>
          <p className="text-muted-foreground">Submit a new leave application for approval</p>
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
              <CardDescription>Fill in the details to submit a new leave request</CardDescription>
            </CardHeader>
            
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Leave Type Selection */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Leave Type
                  </label>
                  
                  <Select
                    value={formData?.leaveTypeId}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, leaveTypeId: value }))
                      if (value) {
                        fetchLeaveBalance(value)
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                          {type.description && <span className="text-xs text-muted-foreground ml-2">({type.description})</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {leaveBalance !== null && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-2 flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <span className="text-sm text-blue-900 dark:text-blue-100">Available Balance:</span>
                      <Badge variant={leaveBalance > 0 ? "default" : "destructive"} className="ml-2">
                        {leaveBalance} days
                      </Badge>
                    </motion.div>
                  )}
                  
                  {daysRequested && leaveBalance && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex justify-between items-center mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
                    >
                      <span className="text-sm">Days requested:</span>
                      <Badge variant="outline" className={daysRequested > leaveBalance ? "text-destructive border-destructive" : "text-green-600 border-green-300"}>
                        {daysRequested} {daysRequested > leaveBalance && <span className="ml-1">(Exceeds balance)</span>}
                      </Badge>
                    </motion.div>
                  )}
                </motion.div>

                {/* Same Day Leave Checkbox */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg border"
                >
                  <Checkbox
                    id="same-day-leave"
                    checked={isSameDayLeave}
                    onCheckedChange={(checked) => {
                      setIsSameDayLeave(checked === true);
                    }}
                  />
                  <label 
                    htmlFor="same-day-leave" 
                    className="text-sm font-medium cursor-pointer flex items-center space-x-2"
                  >
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>Apply for today only</span>
                  </label>
                </motion.div>

                {/* Date Selection */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {!isSameDayLeave ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-blue-500" />
                          Start Date
                        </label>
                        <div className="border rounded-lg p-3 bg-background">
                          <Calendar
                            mode="single"
                            selected={formData.startDate || undefined}
                            onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date || null }))}
                            disabled={(date) => date < new Date() || (formData.endDate ? date > formData.endDate : false)}
                            className="w-full"
                          />
                          
                          {formData.startDate && (
                            <div className="flex items-center justify-center mt-2 gap-2 text-sm font-medium text-primary">
                              <Clock className="h-3 w-3" />
                              {format(formData.startDate, "EEEE, MMMM d, yyyy")}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-blue-500" />
                          End Date
                        </label>
                        <div className="border rounded-lg p-3 bg-background">
                          <Calendar
                            mode="single"
                            selected={formData.endDate || undefined}
                            onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date || null }))}
                            disabled={(date) => date < (formData.startDate || new Date())}
                            className="w-full"
                          />
                          
                          {formData.endDate && (
                            <div className="flex items-center justify-center mt-2 gap-2 text-sm font-medium text-primary">
                              <Clock className="h-3 w-3" />
                              {format(formData.endDate, "EEEE, MMMM d, yyyy")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm flex items-center gap-2 text-blue-900 dark:text-blue-100">
                        <CalendarDays className="h-4 w-4" />
                        <span>Leave will be applied for today: {format(new Date(), "EEEE, MMMM d, yyyy")}</span>
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* Reason */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Reason for Leave
                  </label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Please provide details about your leave request (minimum 10 characters)"
                    className="min-h-[120px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.reason.length} characters (minimum 10 required)
                  </p>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex gap-4 justify-end pt-4 border-t"
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(RouteDict.Leave.Requests.List)}
                    className="flex-1 md:flex-none"
                  >
                    Cancel
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex-1 md:flex-none">
                          <Button 
                            type="submit" 
                            disabled={loading || !formData.leaveTypeId || !formData.startDate || !formData.endDate || !formData.reason || formData.reason.length < 10}
                            className="w-full bg-primary hover:bg-primary/90"
                          >
                            {loading ? (
                              <>
                                <Spinner size="sm" className="mr-2" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Submit Leave Request
                              </>
                            )}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {(!formData.leaveTypeId || !formData.startDate || !formData.endDate || !formData.reason || formData.reason.length < 10) && (
                        <TooltipContent>
                          <p>Please complete all required fields</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
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
                  <Badge variant="outline">{leaveTypes.find(t => t.id === formData.leaveTypeId)?.name || 'Not selected'}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Duration:</span>
                  <Badge variant="outline">{daysRequested ? `${daysRequested} days` : 'Not set'}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">Pending submission</Badge>
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

          {/* Tips */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
            <CardContent className="p-4">
              <div className="flex items-start space-x-2">
                <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Quick Tips</p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                    <li>• Check your leave balance before submitting</li>
                    <li>• Provide detailed reasons for better approval chances</li>
                    <li>• Submit requests well in advance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default LeaveRequestCreate