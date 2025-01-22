import { useToast } from '@/hooks/use-toast'
import { LeaveType, LeaveBalance as ILeaveBalance } from '@/interface/general'
import { APIDictionary } from '@/lib/APIdict'
import { useAuth } from '@/services/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import axios from 'axios'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, Battery } from 'lucide-react'
import { Button } from '@/components/ui/button'

const LeaveBalance = () => {
  const {user,isLoading,logout} = useAuth()
  const {toast} = useToast()
  const [leaveBalances, setLeaveBalances] = React.useState<ILeaveBalance[]>([])

  const fetchRequestList = async()=>{
    try {
      const LeaveBalanceList = await axios.get(APIDictionary.leaveBalance,{withCredentials:true})
      if(LeaveBalanceList.status==200){
        setLeaveBalances(LeaveBalanceList.data)
        console.log('RequestList',LeaveBalanceList.data);
        
      }
      else{
        toast({
          title:'Failed to fetch leave request',
          description:'Please try again later',
          variant:'destructive'
        })
        console.log('Failed to fetch leave request')
      }
      console.log(LeaveBalanceList)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if(user && !isLoading){
      fetchRequestList()
    }
  },[user,isLoading])

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Leave Balance Dashboard</h2>
      <Button onClick={()=>logout()}>
        Log Out
      </Button>
      
      <div className="grid gap-4 md:grid-cols-3">
        {leaveBalances.map((leave) => (
          <Card key={leave.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {leave.leaveType.name}
              </CardTitle>
              {leave.leaveType.name === 'Annual' ? <Calendar className="h-4 w-4 text-muted-foreground" /> :
               leave.leaveType.name === 'Sick' ? <Battery className="h-4 w-4 text-muted-foreground" /> :
               <Clock className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leave.remainingDays} / {leave.leaveType.annualLimit}
              </div>
              <Progress
                value={(leave.remainingDays / leave.leaveType.annualLimit) * 100}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {leave.usedDays} days used
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Balance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leave Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Total Days</TableHead>
                <TableHead>Used Days</TableHead>
                <TableHead>Remaining Days</TableHead>
                <TableHead>Valid Until</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveBalances.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="font-medium">{leave.leaveType.name}</TableCell>
                  <TableCell>{leave.leaveType.description}</TableCell>
                  <TableCell>{leave.leaveType.annualLimit}</TableCell>
                  <TableCell>{leave.usedDays}</TableCell>
                  <TableCell>{leave.remainingDays}</TableCell>
                  <TableCell>{new Date(leave.year, 11, 31).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default LeaveBalance