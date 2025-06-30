import { APIDictionary } from '@/api/v2/APIdict'
import { useAuth } from '@/services/AuthContext'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import axios from 'axios'
import { useEffect, useState } from 'react'
import Loader from '@/components/Loader'
import { Button } from "@/components/ui/button"
import { useNavigate, useParams } from 'react-router-dom'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from '@/components/charts'
import { ArrowLeft, Download, FileText, TrendingUp, Users } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PayrollStatistics {
  monthlySalaries: Array<{
    id: string;
    month: number;
    year: number;
    basicSalary: number;
    netSalary: number;
    status: string;
    processedAt: string;
    allowances: Array<{ type: string; amount: number }>;
    deductions: Array<{ type: string; amount: number }>;
    tax: number;
    attendance?: number;
    leavesTaken?: {
      total: number;
      paid: number;
      unpaid: number;
    };
    holidays?: number;
  }>;
  summary: {
    totalEarned: number;
    totalAttendance: number;
    totalLeavesTaken: number;
    paidLeavesTaken: number;
    unpaidLeavesTaken: number;
    averageSalary: number;
    salaryRecords: number;
  };
  bankDetails: {
    accountHolder: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  salaryParameter: {
    hraPercentage: number;
    daPercentage: number;
    taPercentage: number;
    pfPercentage: number;
    taxPercentage: number;
  };
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department?: string;
  };
}

const PayrollViewEmployeeDetails = () => {
  const { employeeId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [statistics, setStatistics] = useState<PayrollStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [employeeDetails, setEmployeeDetails] = useState<any>(null)
  const [hasAccess, setHasAccess] = useState(false)
  
  // Default to current month
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1 // JavaScript months are 0-based
  const currentYear = currentDate.getFullYear()
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  
  // Generate array of months and years for selectors
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ]
  
  // Generate years (current year and 5 previous years)
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)

  // Check if user has access to view this employee's data
  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (!user?.id || !employeeId) return
        
        // Get employee details 
        const employeeResponse = await axios.get(`${APIDictionary.userProfile(employeeId)}`)
        setEmployeeDetails(employeeResponse.data.user)
        
        // Check if the user is manager of this employee
        const isManager = employeeResponse.data.user.managerId === user.id
        
        // Check if user has org admin permissions
        const userResponse = await axios.get(`${APIDictionary.userProfile(user.id)}`)
        const hasViewAllPermission = userResponse.data.user.roles?.some((userRole: any) => 
          userRole.role.permissions?.some((perm: any) => 
            perm.permission?.key === "payroll.view_salary_slip_of_all"
          )
        )
        
        // Set access status (can view if user is the employee, their manager, or has admin permissions)
        const canAccess = (user.id === employeeId) || isManager || hasViewAllPermission
        setHasAccess(canAccess)
        
        if (!canAccess) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this employee's payroll data.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error checking access:", error)
        setHasAccess(false)
      }
    }
    
    checkAccess()
  }, [user, employeeId])

  // Fetch payroll data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        if (!user?.id || !employeeId || !hasAccess) return
        
        // Fetch payroll statistics
        const response = await axios.get(`${APIDictionary.payroll}/employee/${employeeId}`, {
          params: { month: selectedMonth, year: selectedYear }
        })
        
        setStatistics(response.data)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching payroll data:", error)
        toast({
          title: "Error",
          description: "Failed to fetch payroll data. Please try again.",
          variant: "destructive"
        })
        setIsLoading(false)
      }
    }
    
    if (hasAccess) {
      fetchData()
    } else {
      setIsLoading(false)
    }
  }, [user, employeeId, hasAccess, selectedMonth, selectedYear])
  
  // Function to download payslip as PDF
  const downloadPayslip = (salaryData: PayrollStatistics['monthlySalaries'][0]) => {
    const doc = new jsPDF()
    
    // Add company logo/header
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text("PAYSLIP", 105, 15, { align: "center" })
    
    doc.setFontSize(12)
    doc.text(`Month: ${months.find(m => m.value === salaryData.month)?.label} ${salaryData.year}`, 105, 25, { align: "center" })
    
    // Employee details
    doc.setFontSize(10)
    doc.text("Employee Details", 14, 35)
    doc.line(14, 37, 196, 37)
    
    const employeeDetails = [
      ["Name", `${statistics?.employee?.firstName || ''} ${statistics?.employee?.lastName || ''}`],
      ["Employee ID", statistics?.employee?.employeeId || ''],
      ["Bank Account", statistics?.bankDetails?.accountNumber || ''],
      ["Bank Name", statistics?.bankDetails?.bankName || '']
    ]
    
    // @ts-ignore - jsPDF-autotable extension
    doc.autoTable({
      startY: 40,
      head: [],
      body: employeeDetails,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 40 } }
    })
    
    // Salary details
    doc.text("Salary Details", 14, 70)
    doc.line(14, 72, 196, 72)
    
    const salaryDetails = [
      ["Basic Salary", `₹${salaryData.basicSalary.toLocaleString()}`],
      ...salaryData.allowances.map(a => [a.type.charAt(0).toUpperCase() + a.type.slice(1), `₹${a.amount.toLocaleString()}`]),
      ["Gross Salary", `₹${(salaryData.basicSalary + salaryData.allowances.reduce((sum, a) => sum + a.amount, 0)).toLocaleString()}`]
    ]
    
    // @ts-ignore - jsPDF-autotable extension
    doc.autoTable({
      startY: 75,
      head: [["Earnings", "Amount"]],
      body: salaryDetails,
      theme: 'striped',
      headStyles: { fillColor: [71, 85, 105] },
      styles: { fontSize: 9 }
    })
    
    const deductionDetails = [
      ...salaryData.deductions.map(d => [d.type.charAt(0).toUpperCase() + d.type.slice(1), `₹${d.amount.toLocaleString()}`]),
      ["Tax", `₹${salaryData.tax.toLocaleString()}`],
      ["Total Deductions", `₹${(salaryData.deductions.reduce((sum, d) => sum + d.amount, 0) + salaryData.tax).toLocaleString()}`]
    ]
    
    // @ts-ignore - jsPDF-autotable extension
    doc.autoTable({
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["Deductions", "Amount"]],
      body: deductionDetails,
      theme: 'striped',
      headStyles: { fillColor: [71, 85, 105] },
      styles: { fontSize: 9 }
    })
    
    // Net salary
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`Net Salary: ₹${salaryData.netSalary.toLocaleString()}`, 105, (doc as any).lastAutoTable.finalY + 20, { align: "center" })
    
    // Additional information
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 280)
    doc.text(`Generated by: ${user?.firstName} ${user?.lastName}`, 14, 285)
    doc.text("This is a computer generated payslip and does not require signature.", 105, 285, { align: "center" })
    
    // Save the PDF
    doc.save(`Payslip-${statistics?.employee?.firstName}-${statistics?.employee?.lastName}-${months.find(m => m.value === salaryData.month)?.label}-${salaryData.year}.pdf`)
    
    toast({
      title: "Success",
      description: "Payslip downloaded successfully",
      variant: "default"
    })
  }

  if (isLoading) return <Loader/>

  if (!hasAccess) {
    return (
      <Card className="m-4">
        <CardContent className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">Access Denied</h2>
          <p className="mb-4">You don't have permission to view this employee's payroll data.</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Get the current payslip for the selected month/year
  const currentPayslip = statistics?.monthlySalaries?.find(
    salary => salary.month === selectedMonth && salary.year === selectedYear
  )
  
  // Prepare data for pie chart
  const preparePieChartData = () => {
    if (!currentPayslip) return []
    
    const totalAllowances = currentPayslip.allowances.reduce((sum, a) => sum + a.amount, 0)
    const totalDeductions = currentPayslip.deductions.reduce((sum, d) => sum + d.amount, 0) + currentPayslip.tax
    
    return [
      { name: 'Basic Salary', value: currentPayslip.basicSalary },
      { name: 'Allowances', value: totalAllowances },
      { name: 'Deductions', value: -totalDeductions }
    ]
  }
  
  const pieChartData = preparePieChartData()
  const COLORS = ['#0088FE', '#00C49F', '#FF8042']

  return (
    <div className="w-full h-full px-4 mx-auto py-6 space-y-6 overflow-y-scroll">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {employeeDetails?.firstName} {employeeDetails?.lastName}'s Payroll
          </h1>
          <p className="text-muted-foreground">
            Employee ID: {employeeDetails?.employeeId}
            {employeeDetails?.department && ` | Department: ${employeeDetails.department.name}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate('/p/payroll/all')}
          >
            <Users className="mr-2 h-4 w-4" /> All Employees
          </Button>
        </div>
      </div>
      
      {/* Month and Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Pay Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="month">Month</label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="year">Year</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Payroll Summary */}
      {currentPayslip ? (
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Salary Summary for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </CardTitle>
              <Badge variant={currentPayslip?.status === 'PAID' ? 'success' : 'secondary'}>
                {currentPayslip?.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {/* Salary breakdown pie chart */}
                <div className="bg-white dark:bg-slate-950 rounded-lg p-4 shadow-sm h-[300px]">
                  <h3 className="text-lg font-semibold mb-2">Salary Breakdown</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${Math.abs(Number(value)).toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="flex flex-col space-y-4">
                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-950 rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-muted-foreground">Gross Salary</p>
                    <h3 className="text-2xl font-bold">
                      ₹{(currentPayslip.basicSalary + currentPayslip.allowances.reduce((sum, a) => sum + a.amount, 0)).toLocaleString()}
                    </h3>
                  </div>
                  <div className="bg-white dark:bg-slate-950 rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-muted-foreground">Net Salary</p>
                    <h3 className="text-2xl font-bold">₹{currentPayslip.netSalary.toLocaleString()}</h3>
                  </div>
                  <div className="bg-white dark:bg-slate-950 rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-muted-foreground">Attendance</p>
                    <h3 className="text-2xl font-bold">{currentPayslip.attendance || 0} days</h3>
                  </div>
                  <div className="bg-white dark:bg-slate-950 rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-muted-foreground">Leave Taken</p>
                    <h3 className="text-2xl font-bold">{currentPayslip.leavesTaken?.total || 0} days</h3>
                  </div>
                </div>
                
                {/* Download button */}
                <Button 
                  className="mt-auto" 
                  onClick={() => downloadPayslip(currentPayslip)}
                >
                  <Download className="mr-2 h-4 w-4" /> Download Payslip
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle>No Payslip Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No payroll data is available for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}.</p>
          </CardContent>
        </Card>
      )}
      
      {/* Details Accordion (if payslip exists) */}
      {currentPayslip && (
        <>
          {/* Earnings Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" /> Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Basic Salary</TableCell>
                    <TableCell className="text-right">₹{currentPayslip?.basicSalary?.toLocaleString()}</TableCell>
                  </TableRow>
                  {currentPayslip.allowances.map((allowance, index) => (
                    <TableRow key={index}>
                      <TableCell className="capitalize">{allowance.type}</TableCell>
                      <TableCell className="text-right">₹{allowance.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-medium">
                    <TableCell>Total Earnings</TableCell>
                    <TableCell className="text-right">
                      ₹{(currentPayslip.basicSalary + currentPayslip.allowances.reduce((sum, a) => sum + a.amount, 0)).toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Deductions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" /> Deductions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPayslip.deductions.map((deduction, index) => (
                    <TableRow key={index}>
                      <TableCell className="capitalize">{deduction.type}</TableCell>
                      <TableCell className="text-right">₹{deduction.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell>Tax</TableCell>
                    <TableCell className="text-right">₹{currentPayslip.tax.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow className="font-medium">
                    <TableCell>Total Deductions</TableCell>
                    <TableCell className="text-right">
                      ₹{(currentPayslip.deductions.reduce((sum, d) => sum + d.amount, 0) + currentPayslip.tax).toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <p className="text-xl font-bold">
              Net Salary: ₹{currentPayslip?.netSalary?.toLocaleString()}
            </p>
          </div>
        </>
      )}
      
      {/* Bank Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Account Holder</TableCell>
                <TableCell>{statistics?.bankDetails?.accountHolder}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Account Number</TableCell>
                <TableCell>{statistics?.bankDetails?.accountNumber}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">IFSC Code</TableCell>
                <TableCell>{statistics?.bankDetails?.ifscCode}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Bank Name</TableCell>
                <TableCell>{statistics?.bankDetails?.bankName}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default PayrollViewEmployeeDetails
