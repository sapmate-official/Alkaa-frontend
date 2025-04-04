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
import { Plus, Download, Send, Trash, Users } from 'lucide-react'

// Local components
import ButtonOfUsersSalaryTransaction from '../Salarytransaction/ButtonOfUsersSalaryTransaction'
import ButtonOfGenerateUsersSalary from '../GenerateSalary/ButtonOfGenerateUserSalary'
import PayslipDetailedView from './PayslipDetailedView'
import { MonthYearPicker } from '../../ui/MonthYearPicker'
import { useAuth } from '@/services/AuthContext'
import { APIDictionary } from '@/api/v2/APIdict'
import { APIV3Dictionary } from '@/api/v3/Api3Dicts'

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

interface PayslipStatistics {
  basicInfo: {
    salaryRecordId: string;
    month: number;
    monthName: string;
    year: number;
    employee: {
      id: string;
      name: string;
      employeeId: string;
      department?: string;
    };
    status: string;
    processedAt?: string;
    paymentInfo: {
      mode?: string;
      reference?: string;
      remarks?: string;
    };
  };
  salaryBreakdown: {
    basicSalary: number;
    totalAllowances: number;
    allowanceDetails: Record<string, number>;
    totalDeductions: number;
    deductionDetails: Record<string, number>;
    netSalary: number;
    taxAmount: number;
    additionalPayments: {
      incentive: number;
      bonus: number;
    };
  };
  attendanceAnalysis: {
    totalDaysInMonth: number;
    workingDays: number;
    presentDays: number;
    halfDays: number;
    absentDays: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    attendancePercentage: number;
  };
  comparisons: {
    earningsRatio: number;
    previousMonth?: {
      difference: number;
      percentageChange: number;
    };
    yearToDateEarnings: number;
  };
  visualData: {
    earningsVsDeductions: {
      earnings: number;
      deductions: number;
    };
    salaryComponents: {
      basic: number;
      allowances: number;
      deductions: number;
      net: number;
    };
  };
}

interface StatisticsResponse {
  success: boolean;
  data: PayslipStatistics;
}

// one thing i need to clarify that if you not generate salary then you will not be able to see the payslip of the employee
const MainCompOfViewPayslipOfAllUsersPayroll = () => {
  
  const { user } = useAuth()
  
  // State management
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [payslips, setPayslips] = useState<Payslip[]>([])
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
  
  // Handle download payslip
  const handleDownloadPayslip = async (payslip: Payslip) => {
    if (!payslip) return
    
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
    } catch (error) {
      console.error('Error downloading payslip:', error)
      alert('Failed to download payslip. Please try again.')
    }
  }
  
  // Helper function to get month name
  const getMonthName = (month: number): string => {
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })
  }
  
  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col w-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-2 md:p-4">
        <h1 className="text-xl md:text-2xl font-bold">View Payslips of All Users</h1>
        <div className="flex flex-wrap gap-2 md:gap-4">
          <ButtonOfGenerateUsersSalary />
          <ButtonOfUsersSalaryTransaction />
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-2 md:p-4">
        <div className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-6 h-full">
          {/* Left panel: User list */}
          <Card className="md:col-span-4 order-2 md:order-1 h-[40vh] md:h-full">
            <CardHeader className="bg-primary">
              <CardTitle className="text-white flex items-center text-base md:text-lg">
                <Users className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                Employees
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-56px)]"> {/* Subtract header height */}
              <ScrollArea className="h-full">
                {userLoading ? (
                  <div className="flex flex-col gap-2 p-4">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Skeleton key={n} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="divide-y">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleSelectUser(user)}
                          className={`w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex flex-col ${
                            selectedUser?.id === user.id ? 'bg-muted' : ''
                          }`}
                        >
                          <span className="font-medium">
                            {user.firstName || ''} {user.lastName || ''}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Employee ID: {user.employeeId || 'N/A'}
                          </span>
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
            </CardContent>
          </Card>
          
          {/* Right panel: Payslip list and details */}
          <Card className="md:col-span-8 order-1 md:order-2 h-[40vh] md:h-full">
            <CardHeader className="bg-primary flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <CardTitle className="text-white text-base md:text-lg">
                {selectedUser 
                  ? `Payslips for ${selectedUser.firstName || ''} ${selectedUser.lastName || ''}` 
                  : 'Select an employee'}
              </CardTitle>
              
              <div className="w-full md:w-auto">
                <MonthYearPicker
                  month={month}
                  year={year}
                  onMonthChange={setMonth}
                  onYearChange={setYear}
                  color="white"
                />
              </div>
            </CardHeader>
            
            <CardContent className="p-0 h-[calc(100%-88px)]"> {/* Subtract header height */}
              <ScrollArea className="h-full">
                {selectedUser && (
                  <div className="p-2 md:p-4">
                    {payslips.length === 0 && (
                      <Button 
                        variant="default" 
                        className="mb-4 w-full md:w-auto"
                        onClick={handleGenerateSalary}
                        disabled={loading}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Generate Salary
                      </Button>
                    )}
                    
                    {payslipLoading ? (
                      <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Month-Year</TableHead>
                              <TableHead>Basic Salary</TableHead>
                              <TableHead>Net Salary</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payslips.length > 0 ? (
                              payslips.map((payslip) => (
                                <TableRow 
                                  key={payslip.id} 
                                  className={`cursor-pointer text-sm md:text-base ${
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
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="px-2 py-1 h-8"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadPayslip(payslip);
                                        }}
                                      >
                                        <Download className="h-4 w-4" />
                                        <span className="sr-only md:not-sr-only md:ml-1">PDF</span>
                                      </Button>
                                      
                                      {payslip.status !== 'PAID' && (
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          className="px-2 py-1 h-8 text-destructive border-destructive hover:bg-destructive/10"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeletePayslip(payslip);
                                          }}
                                        >
                                          <Trash className="h-4 w-4" />
                                          <span className="sr-only md:not-sr-only md:ml-1">Delete</span>
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                  No payslips found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
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
          
          <div className="px-4 py-6 overflow-auto">
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