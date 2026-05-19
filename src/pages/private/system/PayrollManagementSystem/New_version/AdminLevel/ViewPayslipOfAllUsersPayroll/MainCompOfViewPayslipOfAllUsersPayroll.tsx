import { useState, useEffect } from 'react'
import axios from 'axios'

// Shadcn components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

// Icons
import { Plus, Download, Trash, Users, Calendar, Clock, UserCheck, UserX, Award, TrendingUp, FileText } from 'lucide-react'

// Local components
import ButtonOfUsersSalaryTransaction from '../Salarytransaction/ButtonOfUsersSalaryTransaction'
import ButtonOfGenerateUsersSalary from '../GenerateSalary/ButtonOfGenerateUserSalary'
import PayslipDetailedView, {PayslipStatistics} from './PayslipDetailedView'
import { MonthYearPicker } from '../../ui/MonthYearPicker'
import { useAuth } from '@/providers/AuthContext.tsx'
import { APIDictionary } from '@/services/api/v2/APIdict'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'
import { usePayslipPDF } from '../../../../../../../hooks/usePayslipPDF.tsx'
import { useNavigate } from 'react-router-dom'

// Types
interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  department?: {
    name: string;
  };
}

interface Payslip {
  id: string;
  userId: string;
  month: number;
  year: number;
  basicSalary: number;
  netSalary: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  processedAt?: string;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  paymentMode?: string;
  paymentRef?: string;
  remarks?: string;
  incentive?: number;
  bonus?: number;
  employee?: {
    firstName?: string;
    lastName?: string;
    employeeId?: string;
    department?: string;
  };
}

interface PayslipResponse {
  success: boolean;
  count: number;
  data: Payslip[];
}

interface PreStatisticsData {
  userId: string;
  month: number;
  year: number;
  workingDays: number;
  attendanceStats: {
    presentDays: number;
    halfDays: number;
    absentDays: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    attendancePercentage: number;
  };
  verifiedAttendance: number;
  unverifiedAttendance: number;
  leaveStats: LeaveStats[];
  userName: string;
  department: string;
  organization: string;
}

interface PreStatisticsResponse {
  success: boolean;
  message: string;
  data: PreStatisticsData;
}

type LeaveTypeInfo = {
  name?: string;
  [key: string]: unknown;
};

interface LeaveStats {
  leaveType: string | LeaveTypeInfo | null | undefined;
  count: number;
  dates: string[];
}


interface StatisticsResponse {
  success: boolean;
  message: string;
  data: PayslipStatistics;
}

// one thing i need to clarify that if you not generate salary then you will not be able to see the payslip of the employee
const MainCompOfViewPayslipOfAllUsersPayroll = () => {
  
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // PDF generation hook - must be at component level
  const { generatePayslipPDF } = usePayslipPDF()
  
  // State management
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [preStatistics, setPreStatistics] = useState<PreStatisticsData | null>(null)
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null)
  const [statistics, setStatistics] = useState<PayslipStatistics | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [userLoading, setUserLoading] = useState<boolean>(false)
  const [payslipLoading, setPayslipLoading] = useState<boolean>(false)
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  
  // Permission checks
  
  // Fetch all users from organization
  useEffect(() => {
    const fetchUsers = async () => {
      setUserLoading(true)
      try {
        // Get the organization ID from the current user
        const orgId = user?.orgId
        if (!orgId) return
        
        const response = await axios.get<User[]>(`${APIDictionary.user}/org/${orgId}`,
          {
            withCredentials: true,
          }
        )
        setUsers(response.data)
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setUserLoading(false)
      }
    }
    
    fetchUsers()
  }, [user])
  
  // Fetch payslips for selected user
  useEffect(() => {
    const fetchPayslips = async () => {
      if (!selectedUser) return
      
      setPayslipLoading(true)
      try {
        const response = await axios.get<PayslipResponse>(
          APIV3Dictionary.payroll.getPayslip(month, year, selectedUser.id)
          ,
          {
            withCredentials: true,
          }
        )
        if (response.data?.success) {
          setPayslips(response.data.data || [])
          if(response.data?.data.length == 0){
            const preStatsResponse = await axios.get<PreStatisticsResponse>(
                APIV3Dictionary.payroll.preStatistics(month, year, selectedUser.id),{
                  withCredentials: true,
                })
            console.log('Pre Statistics Response:', preStatsResponse.data)
            if (preStatsResponse.data?.success) {
              setPreStatistics(preStatsResponse.data.data)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching payslips:', error)
      } finally {
        setPayslipLoading(false)
      }
    }
    
    fetchPayslips()
  }, [selectedUser, month, year])
  
  // Handle user selection
  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setSelectedPayslip(null)
    setStatistics(null)
    setDrawerOpen(false)
  }
  
  // Handle payslip selection and fetch statistics
  const handleSelectPayslip = async (payslip: Payslip) => {
    setSelectedPayslip(payslip)
    setStatistics(null) // Reset statistics
    setDrawerOpen(true) // Open drawer immediately
    setLoading(true)
    
    try {
      const response = await axios.get<StatisticsResponse>(
        APIV3Dictionary.payroll.getStatistics(payslip.id),
        {
          withCredentials: true,
        }
      )
      if (response.data?.success) {
        setStatistics(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching payslip statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle generate salary
  const handleGenerateSalary = async () => {
    if (!selectedUser) return
    
    setLoading(true)
    try {
      await axios.post(
        APIV3Dictionary.payroll.generateSalary(month, year, selectedUser.id),
        {},
        {
          withCredentials: true
        }
      )
      // Refresh payslips
      const response = await axios.get<PayslipResponse>(
        APIV3Dictionary.payroll.getPayslip(month, year, selectedUser.id),
        {
          withCredentials: true,
        }
      )
      if (response.data?.success) {
        setPayslips(response.data.data || [])


      }
    } catch (error) {
      console.error('Error generating salary:', error)
      alert('Failed to generate salary. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  // Handle delete payslip
  const handleDeletePayslip = async (payslip: Payslip) => {
    if (!payslip) return
    
    if (!window.confirm('Are you sure you want to delete this payslip?')) {
      return
    }
    
    setLoading(true)
    try {
      await axios.delete(`${APIDictionary.payroll}/${payslip.id}`,{
        withCredentials: true,
      })
      
      // Refresh payslips
      const response = await axios.get<PayslipResponse>(
        APIV3Dictionary.payroll.getPayslip(month, year, selectedUser?.id),
        {
          withCredentials: true,
        }
      )
      if (response.data?.success) {
        setPayslips(response.data.data || [])
      }
      
      // Close drawer if it's open for the deleted payslip
      if (drawerOpen && selectedPayslip?.id === payslip.id) {
        setDrawerOpen(false)
        setSelectedPayslip(null)
        setStatistics(null)
      }
    } catch (error) {
      console.error('Error deleting payslip:', error)
      alert('Failed to delete payslip. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  // Handle download payslip with new frontend PDF generation
  const handleDownloadPayslip = async (payslip: Payslip) => {
    if (!payslip) return
    
    try {
      // Use the new frontend PDF generation with preview modal
      await generatePayslipPDF(payslip.id);
    } catch (error) {
      console.error('Error generating payslip PDF:', error);
      
      // Fallback to old method if needed
      try {
        const response = await axios.get(
          APIV3Dictionary.payroll.downloadPayslip(payslip.id),
          { responseType: 'blob',
            withCredentials: true, // Include credentials for CORS requests
           }
        )
        
        // Create a download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `payslip-${payslip.month}-${payslip.year}.pdf`)
        document.body.appendChild(link)
        link.click()
        link.remove()
      } catch (fallbackError) {
        console.error('Error downloading payslip (fallback):', fallbackError)
        alert('Failed to download payslip. Please try again.')
      }
    }
  }
  
  // Helper function to get month name
  const getMonthName = (month: number): string => {
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })
  }

  const getLeaveTypeLabel = (leaveType: LeaveStats['leaveType']): string => {
    if (!leaveType) return 'Unknown Leave Type'
    if (typeof leaveType === 'string') return leaveType
    if (typeof leaveType === 'object' && leaveType !== null) {
      const { name } = leaveType as LeaveTypeInfo
      if (typeof name === 'string' && name.trim().length > 0) {
        return name
      }
    }
    return 'Unknown Leave Type'
  }
  
  return (
    <div className="h-screen overflow-hidden flex flex-col w-screen px-4">

      
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
          <h1 className="text-xl md:text-2xl font-bold">View Payslips of All Users</h1>
          <div className="flex flex-wrap gap-2 md:gap-4">
            <ButtonOfGenerateUsersSalary />
            <ButtonOfUsersSalaryTransaction />
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Fixed and Scrollable */}
        <div className="w-80 flex-shrink-0 border-r bg-background flex flex-col overflow-hidden">
          <div className="bg-primary text-primary-foreground p-4 flex-shrink-0">
            <h3 className="flex items-center text-lg font-semibold">
              <Users className="mr-2 h-5 w-5" />
              Employees ({users.length})
            </h3>
          </div>
          
          <ScrollArea className="flex-1">
            {userLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Skeleton key={n} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {users.length > 0 ? (
                  users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`w-full px-4 py-4 text-left hover:bg-muted/50 transition-colors flex flex-col gap-2 ${
                        selectedUser?.id === user.id ? 'bg-muted border-r-2 border-primary' : ''
                      }`}
                    >
                      <span className="font-medium text-sm">
                        {user.firstName || ''} {user.lastName || ''}
                      </span>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          ID: {user.employeeId || 'N/A'}
                        </span>
                        {user.department?.name && (
                          <span className="text-xs text-muted-foreground">
                            Dept: {user.department.name}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No employees found
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
        
        {/* Right Panel - Fixed to Screen */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Card className="flex-1 rounded-none border-0">
            <CardHeader className="bg-primary text-primary-foreground flex-shrink-0">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
                  <CardTitle className="text-lg">
                    {selectedUser 
                      ? `Payslips for ${selectedUser.firstName || ''} ${selectedUser.lastName || ''}` 
                      : 'Select an employee to view payslips'}
                  </CardTitle>
                  
                  {/* Custom Payslip Button */}
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => navigate('/p/payroll/custom-payslip')}
                    className="whitespace-nowrap"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Custom Payslip
                  </Button>
                </div>
                
                <div className="w-full md:w-auto">
                  <MonthYearPicker
                    month={month}
                    year={year}
                    onMonthChange={setMonth}
                    onYearChange={setYear}
                    color="white"
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {selectedUser ? (
                  <div className="p-4">
                    {payslips.length === 0 && (
                      <div className="mb-4">
                        <Button 
                          variant="default" 
                          className="w-full md:w-auto"
                          onClick={handleGenerateSalary}
                          disabled={loading}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Generate Salary for {getMonthName(month)} {year}
                        </Button>
                      </div>
                    )}
                    
                    {payslipLoading ? (
                      <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : payslips.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Period</TableHead>
                              <TableHead>Basic Salary</TableHead>
                              <TableHead>Net Salary</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payslips.map((payslip) => (
                              <TableRow 
                                key={payslip.id} 
                                className={`cursor-pointer ${
                                  selectedPayslip?.id === payslip.id ? 'bg-muted/50' : ''
                                }`}
                                onClick={() => handleSelectPayslip(payslip)}
                              >
                                <TableCell className="whitespace-nowrap">
                                  {getMonthName(payslip.month)} {payslip.year}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  ₹{payslip.basicSalary.toLocaleString()}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  ₹{payslip.netSalary.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={
                                    payslip.status === 'PAID' 
                                      ? 'success' 
                                      : payslip.status === 'PENDING' 
                                        ? 'secondary' 
                                        : 'destructive'
                                  }>
                                    {payslip.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadPayslip(payslip);
                                      }}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    
                                    {payslip.status !== 'PAID' && (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="text-destructive border-destructive hover:bg-destructive/10"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeletePayslip(payslip);
                                        }}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      /* Enhanced Pre-statistics Display */
                      <div className="space-y-6">
                        <div className="text-center">
                          <h3 className="text-lg font-medium mb-2">No Payslips Found</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            No salary has been generated for {getMonthName(month)} {year}
                          </p>
                        </div>

                        {preStatistics && (
                          <div className="max-w-4xl mx-auto space-y-6">
                            {/* Employee Info Header */}
                            <Card className="border-l-4 border-l-primary">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <CardTitle className="text-lg">{preStatistics.userName}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {preStatistics.department} • {preStatistics.organization}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium">Period</p>
                                    <p className="text-sm text-muted-foreground">
                                      {getMonthName(preStatistics.month)} {preStatistics.year}
                                    </p>
                                  </div>
                                </div>
                              </CardHeader>
                            </Card>

                            {/* Attendance Overview */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center text-base">
                                  <Clock className="mr-2 h-4 w-4" />
                                  Attendance Summary
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                  <div className="text-center p-3 bg-card border rounded-lg shadow-sm">
                                    <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                                    <p className="text-2xl font-bold text-foreground">{preStatistics.workingDays}</p>
                                    <p className="text-xs text-muted-foreground">Working Days</p>
                                  </div>
                                  <div className="text-center p-3 bg-card border rounded-lg shadow-sm">
                                    <UserCheck className="h-6 w-6 mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{preStatistics.attendanceStats.presentDays}</p>
                                    <p className="text-xs text-muted-foreground">Present</p>
                                  </div>
                                  <div className="text-center p-3 bg-card border rounded-lg shadow-sm">
                                    <Clock className="h-6 w-6 mx-auto mb-2 text-amber-600 dark:text-amber-400" />
                                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{preStatistics.attendanceStats.halfDays}</p>
                                    <p className="text-xs text-muted-foreground">Half Days</p>
                                  </div>
                                  <div className="text-center p-3 bg-card border rounded-lg shadow-sm">
                                    <UserX className="h-6 w-6 mx-auto mb-2 text-red-600 dark:text-red-400" />
                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{preStatistics.attendanceStats.absentDays}</p>
                                    <p className="text-xs text-muted-foreground">Absent</p>
                                  </div>
                                </div>

                                {/* Attendance Percentage */}
                                <div className="bg-secondary/50 rounded-lg p-4 mb-4 border">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-foreground">Attendance Percentage</span>
                                    <Badge 
                                      variant={preStatistics.attendanceStats.attendancePercentage >= 80 ? 'default' : 'destructive'}
                                      className="text-sm"
                                    >
                                      {preStatistics.attendanceStats.attendancePercentage.toFixed(1)}%
                                    </Badge>
                                  </div>
                                  <div className="w-full bg-muted/30 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all ${
                                        preStatistics.attendanceStats.attendancePercentage >= 80 
                                          ? 'bg-emerald-500' 
                                          : preStatistics.attendanceStats.attendancePercentage >= 60
                                            ? 'bg-amber-500'
                                            : 'bg-red-500'
                                      }`}
                                      style={{ width: `${Math.min(preStatistics.attendanceStats.attendancePercentage, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Leave Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="text-center p-3 bg-card border rounded-lg shadow-sm">
                                    <Award className="h-5 w-5 mx-auto mb-2 text-primary" />
                                    <p className="text-lg font-semibold text-foreground">{preStatistics.attendanceStats.paidLeaveDays}</p>
                                    <p className="text-xs text-muted-foreground">Paid Leave Days</p>
                                  </div>
                                  <div className="text-center p-3 bg-card border rounded-lg shadow-sm">
                                    <TrendingUp className="h-5 w-5 mx-auto mb-2 text-accent" />
                                    <p className="text-lg font-semibold text-foreground">{preStatistics.attendanceStats.unpaidLeaveDays}</p>
                                    <p className="text-xs text-muted-foreground">Unpaid Leave Days</p>
                                  </div>
                                </div>

                                {/* Leave Types Breakdown */}
                                {preStatistics.leaveStats && preStatistics.leaveStats.length > 0 && (
                                  <div className="mt-4">
                                    <h4 className="font-medium mb-3 text-foreground">Leave Breakdown</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {preStatistics.leaveStats.map((leave, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded border">
                                          <span className="text-sm text-foreground">
                                            {getLeaveTypeLabel(leave.leaveType)}
                                          </span>
                                          <Badge variant="outline">{leave.count} days</Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Verification Status */}
                                <div className="mt-4 pt-4 border-t border-border">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Verified Attendance:</span>
                                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{preStatistics.verifiedAttendance}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Unverified Attendance:</span>
                                      <span className="font-medium text-amber-600 dark:text-amber-400">{preStatistics.unverifiedAttendance}</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium">No Employee Selected</p>
                      <p className="text-sm text-muted-foreground">
                        Please select an employee from the left panel to view their payslips
                      </p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed payslip drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="h-[85dvh] px-2 md:px-4">
          <DrawerHeader>
            <DrawerTitle className="text-xl font-bold">Payslip Details</DrawerTitle>
            <DrawerDescription>
              {selectedPayslip ? (
                <div className="flex justify-between items-center mt-2">
                  <span>
                    {getMonthName(selectedPayslip.month)} {selectedPayslip.year}
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPayslip(selectedPayslip)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              ) : null}
            </DrawerDescription>
          </DrawerHeader>
          
          <Separator />
          
          <div className="px-4 py-6 overflow-auto flex-1">
            {loading ? (
              <div className="space-y-6">
                {/* Employee info skeleton */}
                <div className="space-y-3">
                  <Skeleton className="h-6 w-1/3" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                </div>
                
                {/* Salary breakdown skeleton */}
                <div className="space-y-3 mt-6">
                  <Skeleton className="h-6 w-1/3" />
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <Skeleton key={n} className="h-5 w-full" />
                    ))}
                  </div>
                </div>
                
                {/* Allowances and deductions skeletons */}
                <div className="space-y-3 mt-6">
                  <Skeleton className="h-6 w-1/3" />
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((n) => (
                      <Skeleton key={n} className="h-5 w-full" />
                    ))}
                  </div>
                </div>
                
                {/* Attendance section skeleton */}
                <div className="space-y-3 mt-6">
                  <Skeleton className="h-6 w-1/3" />
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <Skeleton key={n} className="h-5 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              statistics && selectedPayslip && (
                <PayslipDetailedView statistics={statistics} payslip={selectedPayslip} />
              )
            )}
          </div>
          
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
 
export default MainCompOfViewPayslipOfAllUsersPayroll