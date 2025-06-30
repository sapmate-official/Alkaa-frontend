import { APIDictionary } from '@/api/v2/APIdict'
import { useAuth } from '@/services/AuthContext'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { format } from "date-fns"
import { CalendarDays, Clock, FileText, ArrowLeft, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Checkbox } from "@/components/ui/checkbox"

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

      // Prepare request payload
      const requestData = {
        userId: user?.id,
        leaveTypeId: formData?.leaveTypeId,
        startDate: formData?.startDate?.toISOString(),
        endDate: formData?.endDate?.toISOString(),
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
        navigate("/leave/request");
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
    <div className=" mx-auto p-3 pb-0 w-full h-full overflow-y-auto">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={()=>navigate("/p")}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink  onClick={()=>navigate("/leave/request")}>Leave Requests</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Create Request</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Create Leave Request</CardTitle>
              <CardDescription>Fill in the details to submit a new leave request</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/leave/request')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Requests
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
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
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Available Balance:</span>
                      <Badge variant={leaveBalance > 0 ? "default" : "destructive"} className="ml-2">
                        {leaveBalance} days
                      </Badge>
                    </div>
                  )}
                  
                  {daysRequested && leaveBalance && (
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span>Days requested:</span>
                      <Badge variant="outline" className={daysRequested > leaveBalance ? "text-destructive" : ""}>
                        {daysRequested} {daysRequested > leaveBalance && <span className="ml-1">(Exceeds balance)</span>}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Reason for Leave
                  </label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Please provide details about your leave request"
                    className="min-h-[120px] resize-none"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="same-day-leave"
                    checked={isSameDayLeave}
                    onCheckedChange={(checked) => {
                      setIsSameDayLeave(checked === true);
                    }}
                  />
                  <label 
                    htmlFor="same-day-leave" 
                    className="text-sm font-medium cursor-pointer"
                  >
                    Apply for today only
                  </label>
                </div>

                {!isSameDayLeave ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        Start Date
                      </label>
                      <div className="border rounded-md p-3">
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
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        End Date
                      </label>
                      <div className="border rounded-md p-3">
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
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <p className="text-sm flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span>Leave will be applied for today: {format(new Date(), "EEEE, MMMM d, yyyy")}</span>
                    </p>
                  </div>
                )}
                
                <div className="bg-muted/30 p-4 rounded-lg border mt-4">
                  <h3 className="font-medium mb-2">Request Summary</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Leave Type:</span>
                      <span className="font-medium">{leaveTypes.find(t => t.id === formData.leaveTypeId)?.name || 'Not selected'}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{daysRequested ? `${daysRequested} days` : 'Not set'}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline">Pending submission</Badge>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-4 border-t">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button 
                        type="submit" 
                        disabled={loading || !formData.leaveTypeId || !formData.startDate || !formData.endDate || !formData.reason}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {loading ? 
                          "Submitting..." : 
                          <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Submit Leave Request</span>
                        }
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {(!formData.leaveTypeId || !formData.startDate || !formData.endDate || !formData.reason) && (
                    <TooltipContent>
                      <p>Please complete all required fields</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LeaveRequestCreate