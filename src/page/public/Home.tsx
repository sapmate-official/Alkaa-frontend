import React, { useEffect, useState } from 'react';
import { useAuth } from '../../services/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "lucide-react";
import axios from 'axios';
import { APIDictionary } from '@/lib/APIdict';
import { LeaveRequest, LeaveBalance } from '@/interface/general';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const Home = () => {
  const { user } = useAuth();
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent leave requests
        const leavesResponse = user?.role === 'MANAGER' 
          ? await axios.get(APIDictionary.list_of_leave_manager, { withCredentials: true })
          : await axios.get(APIDictionary.list_of_leave_employee, { withCredentials: true });
        
        // Fetch leave balance if employee
        if (user?.role === 'EMPLOYEE') {
          const balanceResponse = await axios.get(APIDictionary.leaveBalance, { withCredentials: true });
          setLeaveBalance(balanceResponse.data);
        }
        
        setRecentLeaves(leavesResponse.data.slice(0, 5)); // Show only 5 recent requests
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div className="p-6 space-y-6 w-full">
      <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
      
      {user?.role === 'EMPLOYEE' && (
        <div className="grid gap-4 md:grid-cols-3">
          {leaveBalance.map((leave) => (
            <Card key={leave.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {leave.leaveType.name} Leave Balance
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {leave.remainingDays} / {leave.leaveType.annualLimit} days
                </div>
                <Progress
                  value={(leave.remainingDays / leave.leaveType.annualLimit) * 100}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {user?.role === 'MANAGER' && <TableHead>Employee</TableHead>}
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLeaves.map((leave) => (
                <TableRow key={leave.id}>
                  {user?.role === 'MANAGER' && (
                    <TableCell>{leave.User?.name}</TableCell>
                  )}
                  <TableCell>
                    {new Date(leave.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(leave.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{leave.leaveTypeId}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      leave.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {leave.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;