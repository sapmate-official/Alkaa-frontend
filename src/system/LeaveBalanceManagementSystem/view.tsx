import { useEffect, useState } from 'react'
import { APIDictionary } from '../../api/APIdict'
import axios from 'axios'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from '@/services/AuthContext'

interface LeaveType {
  id: string;
  orgId: string;
  name: string;
  description: string;
  annualLimit: number;
  requiresApproval: boolean;
  isPaid: boolean;
  carryForward: boolean;
  maxCarryForward: number;
  createdAt: string;
  updatedAt: string;
}

interface LeaveBalance {
  id: string;
  userId: string;
  leaveTypeId: string;
  usedDays: number;
  remainingDays: number;
  carryForward: number;
  year: number;
  createdAt: string;
  updatedAt: string;
  leaveType: LeaveType;
}

const ViewLeaveBalance = () => {
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchLeaveBalance = async () => {
      try {
        const response = await axios.get(`${APIDictionary.leave_balance}/user/${user?.id}`)
        setLeaveBalances(response.data)
        setLoading(false)
      } catch (err) {
        setError('Failed to fetch leave balance')
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchLeaveBalance()
    }
  }, [user])

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4 w-full h-full overflow-y-scroll">
      <h2 className="text-2xl font-bold tracking-tight">Leave Balance ({new Date().getFullYear()})</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Leave Type</TableHead>
              <TableHead className="text-right">Annual Limit</TableHead>
              <TableHead className="text-right">Used Days</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead className="text-right">Carry Forward</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(3)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-[50px] ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-[50px] ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-[50px] ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-[50px] ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                </TableRow>
              ))
            ) : (
              leaveBalances.map((balance) => (
                <TableRow key={balance.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p>{balance.leaveType.name}</p>
                      <p className="text-sm text-muted-foreground">{balance.leaveType.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{balance.leaveType.annualLimit}</TableCell>
                  <TableCell className="text-right">{balance.usedDays}</TableCell>
                  <TableCell className="text-right">{balance.remainingDays}</TableCell>
                  <TableCell className="text-right">{balance.carryForward}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {balance.leaveType.isPaid ? 
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Paid</span> : 
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Unpaid</span>
                      }
                      {balance.leaveType.requiresApproval && 
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Approval Required</span>
                      }
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loading && leaveBalances.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No leave balance data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ViewLeaveBalance