// create form to create leave request
// form fields: leave type, start date, end date, reason
// fetch leave types 
// APIDictionary.leave_request
//   const createLeaveType = async (req, res) => {
//     const { orgId } = req.body;
//     const { name, description, annualLimit, requiresApproval, isPaid,carryForward,maxCarryForward    } = req.body;

//     try {
//         const leaveType = await prisma.leaveType.create({
//             data: {
//                 orgId,
//                 name,
//                 description,
//                 annualLimit,
//                 requiresApproval,
//                 isPaid,
//                 carryForward,
//                 maxCarryForward,
//             },
//         });
//         if (leaveType){
//             const Employee_organisation = await prisma.user.findMany({
//                 where:{
//                     orgId:orgId
//                 },
//                 select:{
//                     id:true
//                 }
//             })
//             for (let i = 0; i < Employee_organisation.length; i++) {
//                 await prisma.leaveBalance.create({
//                     data:{
//                         userId:Employee_organisation[i].id,
//                         leaveTypeId:leaveType.id,
//                         remainingDays:leaveType.annualLimit,
//                         year:new Date().getFullYear()
//                     }
//                 })
//             }
//         }
//         res.status(200).json(leaveType);
//     } catch (error) {
//         console.log(error);

//         res.status(500).json({ error: 'Failed to create leave type' });
//     }
// };
//fetch leave balance 
//validate that is there enough leave balance to apply for leave
// at first retrieve the leave type id then invoke api on leavebalance route with leave type id and user id
// then check for balance if balance is greater than 0 then allow to submit leave request
//submit leave request
//show success message
import { APIDictionary } from '@/api/APIdict'
import { useAuth } from '@/services/AuthContext'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
// import { format } from "date-fns"

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
    reason: ''
  })
  const [leaveBalance, setLeaveBalance] = useState<number | null>(null)
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
          reason: ''
        })
        navigate("/p/leaverequest");
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
  return (
    <div className="container mx-auto p-4 w-full h-full overflow-y-scroll">
      <Card>
        <CardHeader>
          <CardTitle>Create Leave Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Leave Type</label>
                  <Select
                    value={formData?.leaveTypeId}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, leaveTypeId: value }))
                      if (value) {
                        fetchLeaveBalance(value)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {leaveBalance !== null && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Available Balance: {leaveBalance} days
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Reason</label>
                  <Input
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Enter reason for leave"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Calendar
                    mode="single"
                    selected={formData.startDate || undefined}
                    onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date || null }))}
                    disabled={(date) => date < new Date() || (formData.endDate ? date > formData.endDate : false)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Calendar
                    mode="single"
                    selected={formData.endDate || undefined}
                    onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date || null }))}
                    disabled={(date) => date < (formData.startDate || new Date())}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Submitting..." : "Submit Leave Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LeaveRequestCreate