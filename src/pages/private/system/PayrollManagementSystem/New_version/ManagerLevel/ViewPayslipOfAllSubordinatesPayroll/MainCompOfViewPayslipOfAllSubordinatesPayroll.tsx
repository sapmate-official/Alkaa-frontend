import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/AuthContext'
import { useToast } from '@/hooks/use-toast'
import axios from 'axios'
import { APIDictionary } from '@/services/api/v2/APIdict'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'
import ButtonOfSubordinateSalaryTransaction from '../Salarytransaction/ButtonOfSubordinateSalaryTransaction'
import ButtonOfGenerateSubordinateSalaryPage from '../GenerateSalary/ButtonOfGenerateSubordinateSalaryPage'

import { format } from 'date-fns'

// Shadcn components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from '@/components/charts'
import { Download, FileText, Trash2, AlertTriangle } from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

// Types
interface Subordinate {
  id: string
  firstName: string
  lastName: string
  employeeId: string
  department?: {
    name: string
  }
}

interface Payslip {
  id: string
  userId: string
  month: number
  year: number
  basicSalary: number
  netSalary: number
  status: 'PENDING' | 'PROCESSED' | 'PAID' | 'FAILED' | 'PROCESSING'
  processedAt: string | null
  allowances: Record<string, number>
  deductions: Record<string, number>
  employee: {
    firstName: string
    lastName: string
    employeeId: string
    department: string
  }
}

interface PayslipStatistics {
  basicInfo: {
    salaryRecordId: string
    month: number
    monthName: string
    year: number
    employee: {
      id: string
      name: string
      employeeId: string
      department: string
    }
    status: string
    processedAt: string | null
    paymentInfo: {
      mode: string | null
      reference: string | null
      remarks: string | null
    }
  }
  salaryBreakdown: {
    basicSalary: number
    totalAllowances: number
    allowanceDetails: Record<string, number>
    totalDeductions: number
    deductionDetails: Record<string, number>
    netSalary: number
    taxAmount: number
    additionalPayments: {
      incentive: number
      bonus: number
    }
  }
  attendanceAnalysis: {
    totalDaysInMonth: number
    workingDays: number
    presentDays: number
    halfDays: number
    absentDays: number
    paidLeaveDays: number
    unpaidLeaveDays: number
    attendancePercentage: number
  }
  comparisons: {
    earningsRatio: number
    previousMonth: {
      difference: number
      percentageChange: number
    } | null
    yearToDateEarnings: number
  }
  visualData: {
    earningsVsDeductions: {
      earnings: number
      deductions: number
    }
    salaryComponents: {
      basic: number
      allowances: number
      deductions: number
      net: number
    }
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const MainCompOfViewPayslipOfAllSubordinatesPayroll = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // State management
  const [subordinates, setSubordinates] = useState<Subordinate[]>([])
  const [selectedSubordinate, setSelectedSubordinate] = useState<Subordinate | null>(null)
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null)
  const [payslipStatistics, setPayslipStatistics] = useState<PayslipStatistics | null>(null)
  const [loading, setLoading] = useState({
    subordinates: true,
    payslips: false,
    statistics: false,
    action: false
  })
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Fetch subordinates
  useEffect(() => {
    if (!user?.id) return

    const fetchSubordinates = async () => {
      setLoading(prev => ({ ...prev, subordinates: true }))
      try {
        // Fetch subordinates
        const subordinatesResponse = await axios.get(`${APIDictionary.user}/subordinate-list`, {
          withCredentials: true
        })
        
        if (subordinatesResponse.data && subordinatesResponse.data.length > 0) {
          setSubordinates(subordinatesResponse.data)
          setSelectedSubordinate(subordinatesResponse.data[0])
        } else {
          toast({
            title: "No subordinates found",
            description: "You don't have any employees reporting to you",
            variant: "default"
          })
        }
      } catch (error) {
        console.error("Error fetching subordinates:", error)
        toast({
          title: "Error",
          description: "Failed to fetch subordinates data",
          variant: "destructive"
        })
      } finally {
        setLoading(prev => ({ ...prev, subordinates: false }))
      }
    }

    fetchSubordinates()
  }, [user])

  // Fetch payslips when subordinate, month, or year changes
  useEffect(() => {
    if (!selectedSubordinate) return

    const fetchPayslips = async () => {
      setLoading(prev => ({ ...prev, payslips: true }))
      try {
        const response = await axios.get(
          APIV3Dictionary.payroll.getPayslip(selectedMonth, selectedYear, selectedSubordinate.id), 
          { withCredentials: true }
        )
        
        if (response.data.success) {
          setPayslips(response.data.data)
        } else {
          setPayslips([])
        }
      } catch (error) {
        console.error("Error fetching payslips:", error)
        setPayslips([])
        toast({
          title: "Error",
          description: "Failed to fetch payslip data",
          variant: "destructive"
        })
      } finally {
        setLoading(prev => ({ ...prev, payslips: false }))
      }
    }

    fetchPayslips()
  }, [selectedSubordinate, selectedMonth, selectedYear])

  // Fetch detailed statistics when a payslip is selected
  const fetchPayslipStatistics = async (payslipId: string) => {
    // Open drawer immediately before fetching data
    setIsDrawerOpen(true)
    setLoading(prev => ({ ...prev, statistics: true }))
    
    try {
      const response = await axios.get(
        APIV3Dictionary.payroll.getStatistics(payslipId),
        { withCredentials: true }
      )
      
      if (response.data.success) {
        setPayslipStatistics(response.data.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch payslip statistics",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching payslip statistics:", error)
      toast({
        title: "Error",
        description: "Failed to fetch detailed payslip information",
        variant: "destructive"
      })
    } finally {
      setLoading(prev => ({ ...prev, statistics: false }))
    }
  }

  // Generate salary for a subordinate
  const handleGenerateSalary = async () => {
    if (!selectedSubordinate) return
    
    setLoading(prev => ({ ...prev, action: true }))
    try {
      const response = await axios.post(
        APIV3Dictionary.payroll.generateSalary(selectedMonth, selectedYear, selectedSubordinate.id),
        {},
        { withCredentials: true }
      )
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Salary generated successfully",
          variant: "default"
        })
        
        // Refresh payslips
        const payslipResponse = await axios.get(
          APIV3Dictionary.payroll.getPayslip(selectedMonth, selectedYear, selectedSubordinate.id), 
          { withCredentials: true }
        )
        
        if (payslipResponse.data.success) {
          setPayslips(payslipResponse.data.data)
        }
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to generate salary",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error("Error generating salary:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to generate salary",
        variant: "destructive"
      })
    } finally {
      setLoading(prev => ({ ...prev, action: false }))
    }
  }

  // Delete a payslip
  const handleDeletePayslip = async () => {
    if (!selectedPayslip || selectedPayslip.status !== 'PENDING') return
    
    setLoading(prev => ({ ...prev, action: true }))
    try {
      await axios.delete(`${APIDictionary.payroll}/${selectedPayslip.id}`, {
        withCredentials: true
      })
      
      toast({
        title: "Success",
        description: "Payslip deleted successfully",
        variant: "default"
      })
      
      // Refresh payslips
      const payslipResponse = await axios.get(
        APIV3Dictionary.payroll.getPayslip(selectedMonth, selectedYear, selectedSubordinate?.id), 
        { withCredentials: true }
      )
      
      if (payslipResponse.data.success) {
        setPayslips(payslipResponse.data.data)
      }
      
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting payslip:", error)
      toast({
        title: "Error",
        description: "Failed to delete payslip",
        variant: "destructive"
      })
    } finally {
      setLoading(prev => ({ ...prev, action: false }))
    }
  }

  // Download payslip as PDF
  const handleDownloadPayslip = async (payslipId: string) => {
    try {
      setLoading(prev => ({ ...prev, action: true }))
      
      const response = await axios.get(
        APIV3Dictionary.payroll.downloadPayslip(payslipId),
        { 
          responseType: 'blob', 
          withCredentials: true,
          headers: {
            'Accept': 'application/pdf'
          }
        }
      )
      
      // Create a blob and generate download link
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      
      // Create filename based on employee and date
      const fileName = selectedPayslip ? 
        `payslip-${selectedPayslip.employee.firstName}-${selectedPayslip.employee.lastName}-${getMonthName(selectedPayslip.month)}-${selectedPayslip.year}.pdf` : 
        `payslip-${payslipId}.pdf`
      
      // Create and trigger download
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Success",
        description: "Payslip downloaded successfully",
        variant: "default"
      })
    } catch (error) {
      console.error("Error downloading payslip:", error)
      toast({
        title: "Error",
        description: "Failed to download payslip",
        variant: "destructive"
      })
    } finally {
      setLoading(prev => ({ ...prev, action: false }))
    }
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getMonthName = (monthNumber: number) => {
    return new Date(2000, monthNumber - 1, 1).toLocaleString('default', { month: 'long' })
  }

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ]
  
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString()
  }))

  if (loading.subordinates) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Subordinate Payslips</CardTitle>
          <CardDescription>View and manage payslips for your team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle>Employees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex items-center gap-2 p-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="w-full md:w-2/3">
              <Card>
                <CardHeader>
                  <CardTitle>Payslips</CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (subordinates.length === 0) {
    return (
      <Card className="w-full h-[calc(100vh-180px)]">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-2xl font-bold text-center">No Subordinates Found</h3>
          <p className="text-muted-foreground text-center mt-2">
            You don't have any employees reporting to you.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 w-full h-screen overflow-y-auto p-4">

      
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Team Payroll Management</h2>
        <ButtonOfGenerateSubordinateSalaryPage />
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3">
          <Card className="h-[calc(100vh-220px)]">
            <CardHeader>
              <CardTitle>Employees</CardTitle>
              <CardDescription>Your team members</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="space-y-2">
                  {subordinates.map((subordinate) => (
                    <div 
                      key={subordinate.id}
                      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                        selectedSubordinate?.id === subordinate.id 
                          ? 'bg-primary/10 text-primary' 
                          : 'hover:bg-secondary'
                      }`}
                      onClick={() => setSelectedSubordinate(subordinate)}
                    >
                      <Avatar>
                        <AvatarFallback>
                          {subordinate.firstName?.[0]}{subordinate.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {subordinate.firstName} {subordinate.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {subordinate.employeeId} • {subordinate.department?.name || 'No Department'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full md:w-2/3">
          <Card className="h-[calc(100vh-220px)]">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>
                    {selectedSubordinate?.firstName} {selectedSubordinate?.lastName}'s Payslips
                  </CardTitle>
                  <CardDescription>
                    {selectedSubordinate?.employeeId} • {selectedSubordinate?.department?.name || 'No Department'}
                  </CardDescription>
                </div>
                
                <div className="flex gap-2">
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={selectedYear}
                    onValueChange={setSelectedYear}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={handleGenerateSalary}
                    disabled={loading.action}
                    size="sm"
                  >
                    Generate Salary
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <ScrollArea className="h-[calc(100vh-340px)]">
                {loading.payslips ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-24 w-full" />
                    ))}
                  </div>
                ) : payslips.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Basic Salary</TableHead>
                        <TableHead>Net Salary</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payslips.map((payslip) => (
                        <TableRow 
                          key={payslip.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            setSelectedPayslip(payslip)
                            fetchPayslipStatistics(payslip.id)
                          }}
                        >
                          <TableCell>
                            <div className="font-medium">
                              {getMonthName(payslip.month)} {payslip.year}
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(payslip.basicSalary)}</TableCell>
                          <TableCell>{formatCurrency(payslip.netSalary)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                payslip.status === 'PAID' 
                                  ? 'default' 
                                  : payslip.status === 'PENDING' 
                                    ? 'outline' 
                                    : payslip.status === 'PROCESSING' 
                                      ? 'secondary'
                                      : 'destructive'
                              }
                            >
                              {payslip.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDownloadPayslip(payslip.id)
                                }}
                                disabled={loading.action}
                              >
                                {loading.action ? (
                                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                              
                              {payslip.status === 'PENDING' && (
                                <>
                                  <ButtonOfSubordinateSalaryTransaction
                                    // payslipId={payslip.id}
                                    // onComplete={() => {
                                    //   const fetchUpdatedPayslips = async () => {
                                    //     const payslipResponse = await axios.get(
                                    //       APIV3Dictionary.payroll.getPayslip(selectedMonth, selectedYear, selectedSubordinate?.id),
                                    //       { withCredentials: true }
                                    //     );
                                    //     if (payslipResponse.data.success) {
                                    //       setPayslips(payslipResponse.data.data);
                                    //     }
                                    //   };
                                    //   fetchUpdatedPayslips();
                                    // }}
                                  />
                                  
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedPayslip(payslip)
                                      setIsDeleteDialogOpen(true)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Payslips Found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedSubordinate?.firstName} doesn't have any payslips for {getMonthName(parseInt(selectedMonth))} {selectedYear}
                    </p>
                    <Button 
                      className="mt-4"
                      onClick={handleGenerateSalary}
                      disabled={loading.action}
                    >
                      Generate Salary
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="text-2xl">
              {selectedPayslip && `Payslip: ${getMonthName(selectedPayslip.month)} ${selectedPayslip.year}`}
            </DrawerTitle>
          </DrawerHeader>
          
          <div className="px-6 py-2 overflow-y-auto max-h-[calc(85vh-10rem)]">
            {loading.statistics ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-6 w-36" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-64 w-full rounded-md" />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-6 w-28" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-36" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : payslipStatistics ? (
              <Tabs defaultValue="overview">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {payslipStatistics.basicInfo.employee.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {payslipStatistics.basicInfo.employee.employeeId} • {payslipStatistics.basicInfo.employee.department}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        payslipStatistics.basicInfo.status === 'PAID' 
                          ? 'default' 
                          : payslipStatistics.basicInfo.status === 'PENDING' 
                            ? 'outline' 
                            : payslipStatistics.basicInfo.status === 'PROCESSING' 
                              ? 'secondary'
                              : 'destructive'
                      }
                    >
                      {payslipStatistics.basicInfo.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Salary Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Basic', value: payslipStatistics.salaryBreakdown.basicSalary },
                                  { name: 'Allowances', value: payslipStatistics.salaryBreakdown.totalAllowances },
                                  { name: 'Deductions', value: -payslipStatistics.salaryBreakdown.totalDeductions },
                                  { name: 'Tax', value: -payslipStatistics.salaryBreakdown.taxAmount }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {[
                                  { name: 'Basic', value: payslipStatistics.salaryBreakdown.basicSalary },
                                  { name: 'Allowances', value: payslipStatistics.salaryBreakdown.totalAllowances },
                                  { name: 'Deductions', value: -payslipStatistics.salaryBreakdown.totalDeductions },
                                  { name: 'Tax', value: -payslipStatistics.salaryBreakdown.taxAmount }
                                ].map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(Math.abs(Number(value)))} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Key Figures</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Basic Salary</p>
                            <p className="text-2xl font-bold">{formatCurrency(payslipStatistics.salaryBreakdown.basicSalary)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Allowances</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(payslipStatistics.salaryBreakdown.totalAllowances)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Deductions</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(payslipStatistics.salaryBreakdown.totalDeductions)}</p>
                          </div>
                          <Separator />
                          <div>
                            <p className="text-sm text-muted-foreground">Net Salary</p>
                            <p className="text-3xl font-bold">{formatCurrency(payslipStatistics.salaryBreakdown.netSalary)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-6">
                  {/* Details tab content */}
                  {payslipStatistics && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Earnings Breakdown</CardTitle>
                            <CardDescription>Detailed view of all income components</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {/* Basic Salary */}
                              <div className="flex justify-between items-center py-2 border-b">
                                <span className="font-medium">Basic Salary</span>
                                <span className="font-semibold">{formatCurrency(payslipStatistics.salaryBreakdown.basicSalary)}</span>
                              </div>
                              
                              {/* Allowances */}
                              {Object.entries(payslipStatistics.salaryBreakdown.allowanceDetails).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center py-2 border-b">
                                  <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                  <span className="text-green-600">{formatCurrency(Number(value))}</span>
                                </div>
                              ))}
                              
                              {/* Additional Payments */}
                              {payslipStatistics.salaryBreakdown.additionalPayments.incentive > 0 && (
                                <div className="flex justify-between items-center py-2 border-b">
                                  <span className="text-muted-foreground">Incentive</span>
                                  <span className="text-green-600">{formatCurrency(payslipStatistics.salaryBreakdown.additionalPayments.incentive)}</span>
                                </div>
                              )}
                              
                              {payslipStatistics.salaryBreakdown.additionalPayments.bonus > 0 && (
                                <div className="flex justify-between items-center py-2 border-b">
                                  <span className="text-muted-foreground">Bonus</span>
                                  <span className="text-green-600">{formatCurrency(payslipStatistics.salaryBreakdown.additionalPayments.bonus)}</span>
                                </div>
                              )}
                              
                              {/* Total Allowances */}
                              <div className="flex justify-between items-center py-2">
                                <span className="font-medium">Total Allowances</span>
                                <span className="font-semibold text-green-600">{formatCurrency(payslipStatistics.salaryBreakdown.totalAllowances)}</span>
                              </div>
                              
                              {/* Total Earnings */}
                              <div className="flex justify-between items-center py-3 mt-2 bg-muted/50 rounded-md px-3">
                                <span className="font-semibold">Total Earnings</span>
                                <span className="font-bold text-lg">
                                  {formatCurrency(
                                    payslipStatistics.salaryBreakdown.basicSalary + 
                                    payslipStatistics.salaryBreakdown.totalAllowances +
                                    payslipStatistics.salaryBreakdown.additionalPayments.incentive +
                                    payslipStatistics.salaryBreakdown.additionalPayments.bonus
                                  )}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Deductions</CardTitle>
                            <CardDescription>Detailed view of all deductions</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {/* Tax */}
                              {payslipStatistics.salaryBreakdown.taxAmount > 0 && (
                                <div className="flex justify-between items-center py-2 border-b">
                                  <span className="font-medium">Tax</span>
                                  <span className="font-semibold text-red-600">{formatCurrency(payslipStatistics.salaryBreakdown.taxAmount)}</span>
                                </div>
                              )}
                              
                              {/* Deductions */}
                              {Object.entries(payslipStatistics.salaryBreakdown.deductionDetails).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center py-2 border-b">
                                  <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                  <span className="text-red-600">{formatCurrency(Number(value))}</span>
                                </div>
                              ))}
                              
                              {/* Total Deductions */}
                              <div className="flex justify-between items-center py-3 mt-2 bg-muted/50 rounded-md px-3">
                                <span className="font-semibold">Total Deductions</span>
                                <span className="font-bold text-lg text-red-600">
                                  {formatCurrency(
                                    payslipStatistics.salaryBreakdown.totalDeductions + 
                                    payslipStatistics.salaryBreakdown.taxAmount
                                  )}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Salary Summary</CardTitle>
                          <CardDescription>Final calculation of your salary</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-muted/30 rounded-md">
                                <p className="text-sm text-muted-foreground">Total Earnings</p>
                                <p className="text-xl font-bold">
                                  {formatCurrency(
                                    payslipStatistics.salaryBreakdown.basicSalary + 
                                    payslipStatistics.salaryBreakdown.totalAllowances +
                                    payslipStatistics.salaryBreakdown.additionalPayments.incentive +
                                    payslipStatistics.salaryBreakdown.additionalPayments.bonus
                                  )}
                                </p>
                              </div>
                              <div className="p-4 bg-muted/30 rounded-md">
                                <p className="text-sm text-muted-foreground">Total Deductions</p>
                                <p className="text-xl font-bold text-red-600">
                                  {formatCurrency(
                                    payslipStatistics.salaryBreakdown.totalDeductions + 
                                    payslipStatistics.salaryBreakdown.taxAmount
                                  )}
                                </p>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="p-6 bg-primary/10 rounded-md">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Net Salary</p>
                                  <p className="text-3xl font-bold">{formatCurrency(payslipStatistics.salaryBreakdown.netSalary)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">Compared to previous month</p>
                                  {payslipStatistics.comparisons.previousMonth ? (
                                    <div className={`flex items-center ${
                                      payslipStatistics.comparisons.previousMonth.percentageChange >= 0 
                                        ? 'text-green-500' 
                                        : 'text-red-500'
                                    }`}>
                                      {payslipStatistics.comparisons.previousMonth.percentageChange >= 0 ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m18 15-6-6-6 6"/></svg>
                                      ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m6 9 6 6 6-6"/></svg>
                                      )}
                                      <span>
                                        {payslipStatistics.comparisons.previousMonth.percentageChange >= 0 ? '+' : ''}
                                        {payslipStatistics.comparisons.previousMonth.percentageChange.toFixed(2)}%
                                      </span>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">No previous data</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-4 bg-muted/30 rounded-md">
                                <p className="text-sm text-muted-foreground">YTD Earnings</p>
                                <p className="text-xl font-bold">{formatCurrency(payslipStatistics.comparisons.yearToDateEarnings)}</p>
                              </div>
                              <div className="p-4 bg-muted/30 rounded-md">
                                <p className="text-sm text-muted-foreground">Earnings Ratio</p>
                                <p className="text-xl font-bold">{payslipStatistics.comparisons.earningsRatio}%</p>
                              </div>
                              <div className="p-4 bg-muted/30 rounded-md">
                                <p className="text-sm text-muted-foreground">Payment Status</p>
                                <p className="text-xl font-bold">
                                  <Badge variant={
                                    payslipStatistics.basicInfo.status === 'PAID' 
                                      ? 'default' 
                                      : payslipStatistics.basicInfo.status === 'PENDING' 
                                        ? 'outline' 
                                        : payslipStatistics.basicInfo.status === 'PROCESSING' 
                                          ? 'secondary'
                                          : 'destructive'
                                  }>
                                    {payslipStatistics.basicInfo.status}
                                  </Badge>
                                </p>
                              </div>
                            </div>
                            
                            {payslipStatistics.basicInfo.paymentInfo.mode && (
                              <div className="mt-4">
                                <p className="text-sm font-medium">Payment Details</p>
                                <div className="mt-2 p-3 bg-muted/30 rounded-md">
                                  <p className="text-sm">
                                    <span className="font-medium">Mode:</span> {payslipStatistics.basicInfo.paymentInfo.mode}
                                  </p>
                                  {payslipStatistics.basicInfo.paymentInfo.reference && (
                                    <p className="text-sm">
                                      <span className="font-medium">Reference:</span> {payslipStatistics.basicInfo.paymentInfo.reference}
                                    </p>
                                  )}
                                  {payslipStatistics.basicInfo.paymentInfo.remarks && (
                                    <p className="text-sm">
                                      <span className="font-medium">Remarks:</span> {payslipStatistics.basicInfo.paymentInfo.remarks}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="attendance" className="space-y-6">
                  {/* Attendance tab content */}
                  {payslipStatistics && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2">
                          <CardHeader>
                            <CardTitle>Attendance Overview</CardTitle>
                            <CardDescription>
                              Attendance summary for {format(new Date(payslipStatistics.basicInfo.year, payslipStatistics.basicInfo.month - 1), 'MMMM yyyy')}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={[
                                      { name: 'Present', value: payslipStatistics.attendanceAnalysis.presentDays },
                                      { name: 'Half Days', value: payslipStatistics.attendanceAnalysis.halfDays / 2 },
                                      { name: 'Absent', value: payslipStatistics.attendanceAnalysis.absentDays },
                                      { name: 'Paid Leave', value: payslipStatistics.attendanceAnalysis.paidLeaveDays },
                                      { name: 'Unpaid Leave', value: payslipStatistics.attendanceAnalysis.unpaidLeaveDays }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                  >
                                    {[
                                      { name: 'Present', value: payslipStatistics.attendanceAnalysis.presentDays },
                                      { name: 'Half Days', value: payslipStatistics.attendanceAnalysis.halfDays / 2 },
                                      { name: 'Absent', value: payslipStatistics.attendanceAnalysis.absentDays },
                                      { name: 'Paid Leave', value: payslipStatistics.attendanceAnalysis.paidLeaveDays },
                                      { name: 'Unpaid Leave', value: payslipStatistics.attendanceAnalysis.unpaidLeaveDays }
                                    ].map((_, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value) => Number(value).toFixed(1)} />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Attendance Metrics</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Attendance Percentage</p>
                                <div className="flex items-center">
                                  <p className="text-2xl font-bold">
                                    {payslipStatistics.attendanceAnalysis.attendancePercentage.toFixed(2)}%
                                  </p>
                                  <div className="ml-auto">
                                    <Badge variant={
                                      payslipStatistics.attendanceAnalysis.attendancePercentage >= 90 
                                        ? 'default' 
                                        : payslipStatistics.attendanceAnalysis.attendancePercentage >= 75 
                                          ? 'secondary' 
                                          : 'destructive'
                                    }>
                                      {payslipStatistics.attendanceAnalysis.attendancePercentage >= 90 
                                        ? 'Excellent' 
                                        : payslipStatistics.attendanceAnalysis.attendancePercentage >= 75 
                                          ? 'Good' 
                                          : 'Needs Improvement'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="p-2">
                                    <p className="text-xs text-muted-foreground">Calendar Days</p>
                                    <p className="text-lg font-semibold">{payslipStatistics.attendanceAnalysis.totalDaysInMonth}</p>
                                  </div>
                                  <div className="p-2">
                                    <p className="text-xs text-muted-foreground">Working Days</p>
                                    <p className="text-lg font-semibold">{payslipStatistics.attendanceAnalysis.workingDays}</p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="p-2">
                                    <p className="text-xs text-muted-foreground">Present Days</p>
                                    <p className="text-lg font-semibold text-green-600">{payslipStatistics.attendanceAnalysis.presentDays}</p>
                                  </div>
                                  <div className="p-2">
                                    <p className="text-xs text-muted-foreground">Half Days</p>
                                    <p className="text-lg font-semibold text-amber-500">{payslipStatistics.attendanceAnalysis.halfDays}</p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="p-2">
                                    <p className="text-xs text-muted-foreground">Absent Days</p>
                                    <p className="text-lg font-semibold text-red-500">{payslipStatistics.attendanceAnalysis.absentDays}</p>
                                  </div>
                                  <div className="p-2">
                                    <p className="text-xs text-muted-foreground">Paid Leave</p>
                                    <p className="text-lg font-semibold text-blue-500">{payslipStatistics.attendanceAnalysis.paidLeaveDays}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Salary Impact</CardTitle>
                          <CardDescription>How attendance affected the salary calculation</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {payslipStatistics.salaryBreakdown.deductionDetails.absence > 0 && (
                              <div className="p-4 border rounded-md bg-red-50 dark:bg-red-950">
                                <div className="flex items-start">
                                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                                  <div>
                                    <h4 className="font-medium">Absence Deduction</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Due to {payslipStatistics.attendanceAnalysis.absentDays} absent day(s), 
                                      a deduction of {formatCurrency(payslipStatistics.salaryBreakdown.deductionDetails.absence)} 
                                      has been applied to the salary.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 border rounded-md">
                                <h4 className="font-medium mb-2">Per Day Salary Value</h4>
                                <p className="text-lg font-semibold">
                                  {formatCurrency(payslipStatistics.salaryBreakdown.basicSalary / payslipStatistics.attendanceAnalysis.workingDays)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Basic salary ÷ Working days in month = Per day value
                                </p>
                              </div>
                              
                              <div className="p-4 border rounded-md">
                                <h4 className="font-medium mb-2">Attendance Summary</h4>
                                <p className="text-sm">
                                  Out of {payslipStatistics.attendanceAnalysis.workingDays} working days, you were present 
                                  for {payslipStatistics.attendanceAnalysis.presentDays} day(s), half-day 
                                  for {payslipStatistics.attendanceAnalysis.halfDays} day(s), and took {payslipStatistics.attendanceAnalysis.paidLeaveDays} paid leave(s).
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Statistics Available</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Could not load detailed statistics for this payslip.
                </p>
              </div>
            )}
          </div>
          
          <DrawerFooter className="flex flex-row justify-between items-center">
            <Button 
              variant="outline" 
              onClick={() => setIsDrawerOpen(false)}
            >
              Close
            </Button>
            
            <div className="flex gap-2">
              {selectedPayslip && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => handleDownloadPayslip(selectedPayslip.id)}
                    disabled={loading.action}
                  >
                    {loading.action ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                  
                  {selectedPayslip.status === 'PENDING' && (
                    <>
                      <ButtonOfSubordinateSalaryTransaction
                        // payslipId={selectedPayslip.id}
                        // onComplete={() => {
                        //   setIsDrawerOpen(false)
                        //   const fetchUpdatedPayslips = async () => {
                        //     const payslipResponse = await axios.get(
                        //       APIV3Dictionary.payroll.getPayslip(selectedMonth, selectedYear, selectedSubordinate?.id),
                        //       { withCredentials: true }
                        //     );
                        //     if (payslipResponse.data.success) {
                        //       setPayslips(payslipResponse.data.data);
                        //     }
                        //   };
                        //   fetchUpdatedPayslips();
                        // }}
                      />
                      
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          setIsDrawerOpen(false)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payslip? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 border rounded-md bg-muted/50">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {selectedPayslip && `${getMonthName(selectedPayslip.month)} ${selectedPayslip.year} Payslip`}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedPayslip && `Amount: ${formatCurrency(selectedPayslip.netSalary)}`}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedPayslip && `Employee: ${selectedPayslip.employee.firstName} ${selectedPayslip.employee.lastName}`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePayslip}
              disabled={loading.action}
            >
              {loading.action ? "Deleting..." : "Delete Payslip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MainCompOfViewPayslipOfAllSubordinatesPayroll