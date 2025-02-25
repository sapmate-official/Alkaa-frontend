import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
// import { useAuth } from '@/services/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { APIDictionary } from '@/api/APIdict'
import axios from 'axios'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import Loader from '@/components/Loader'

interface LeaveRequest {
  id: string
  startDate: Date
  endDate: Date
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

const EditLeaveRequest = () => {
  const { id } = useParams()
//   const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null)

  // Fetch leave request details
  useEffect(() => {
    const fetchLeaveRequest = async () => {
      try {
        const response = await axios.get(`${APIDictionary.leave_request}/${id}`, {
          withCredentials: true
        })
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
        navigate('/p/leaverequest')
      }
    }

    if (id) {
      fetchLeaveRequest()
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!leaveRequest) return

      const response = await axios.put(
        `${APIDictionary.leave_request}/${id}`,
        {
          startDate: leaveRequest.startDate.toISOString(),
          endDate: leaveRequest.endDate.toISOString(),
          reason: leaveRequest.reason
        },
        { withCredentials: true }
      )

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Leave request updated successfully"
        })
        navigate('/p/leaverequest')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update leave request",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!leaveRequest) {
    return <Loader />
  }

  return (
    <div className="container mx-auto p-6 w-full h-full overflow-y-scroll">
      <Card>
        <CardHeader>
          <CardTitle>Edit Leave Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Calendar
                    mode="single"
                    selected={leaveRequest?.startDate}
                    onSelect={(date) => date && setLeaveRequest(prev => ({ ...prev!, startDate: date }))}
                    disabled={(date) => date > (leaveRequest?.endDate ?? new Date())}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Calendar
                    mode="single"
                    selected={leaveRequest?.endDate}
                    onSelect={(date) => date && setLeaveRequest(prev => ({ ...prev!, endDate: date }))}
                    disabled={(date) => date < (leaveRequest?.startDate ?? new Date())}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Reason</label>
                  <Input
                    value={leaveRequest?.reason ?? ''}
                    onChange={(e) => setLeaveRequest(prev => ({ ...prev!, reason: e.target.value }))}
                    placeholder="Enter reason for leave"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/p/leaverequest')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Request"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default EditLeaveRequest