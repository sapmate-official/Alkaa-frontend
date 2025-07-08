import { APIDictionary } from '@/api/v2/APIdict'
import { useAuth } from '@/services/AuthContext'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import axios from 'axios'
import { useEffect, useState } from 'react'
import Loader from '@/components/Loader'
import { Button } from "@/components/ui/button"
import { useNavigate } from 'react-router-dom'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from '@/components/charts'
import { Download, FileText, TrendingUp } from "lucide-react"
import { toast } from '@/hooks/use-toast'
import RouteDict from '@/routes/RouteDict'

interface PayrollData {
  salaryRecords: Array<{
    month: number;
    year: number;
    basicSalary: number;
    allowances: Record<string, number>;
    deductions: Record<string, number>;
    netSalary: number;
    status: string;
    processedAt: string;
  }>;
  salaryParameter: {
    hraPercentage: number;
    daPercentage: number;
    taPercentage: number;
    pfPercentage: number;
    taxPercentage: number;
  };
  bankDetails: {
    accountHolder: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
}

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
}

const PayRollViewOwn = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [payrollData, setPayrollData] = useState<PayrollData | null>(null)
  const [statistics, setStatistics] = useState<PayrollStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Default to last month
  const currentDate = new Date()
  const lastMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth()
  const lastMonthYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear()
  
  const [selectedMonth, setSelectedMonth] = useState(lastMonth)
  const [selectedYear, setSelectedYear] = useState(lastMonthYear)
  
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
  const currentYear = currentDate.getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      if (!user?.id) return
      
      // Fetch payroll data
      const response = await axios.get(APIDictionary.get_payroll_stats(user?.id), {
        params: { month: selectedMonth, year: selectedYear }
      })
      
      setStatistics(response.data)
      
      // Also fetch general payroll data
      const payrollResponse = await axios.get(APIDictionary.get_payroll(user?.id))
      setPayrollData(payrollResponse.data)
      
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

  useEffect(() => {
    fetchData()
  }, [user, selectedMonth, selectedYear])
  
  // Function to check if payslip exists for the selected month/year
  // const checkPayslipExists = () => {
  //   if (!statistics?.monthlySalaries?.length) return false
  //   return statistics.monthlySalaries.some(
  //     salary => salary.month === selectedMonth && salary.year === selectedYear
  //   )
  // }
  
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
      ["Name", `${user?.firstName || ''} ${user?.lastName || ''}`],
      ["Employee ID", user?.employeeId || ''],
      ["Bank Account", payrollData?.bankDetails?.accountNumber || ''],
      ["Bank Name", payrollData?.bankDetails?.bankName || '']
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
    // Access lastAutoTable property added by the plugin
    doc.text(`Net Salary: ₹${salaryData.netSalary.toLocaleString()}`, 105, (doc as any).lastAutoTable.finalY + 20, { align: "center" })
    
    // Additional information
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 280)
    doc.text("This is a computer generated payslip and does not require signature.", 105, 285, { align: "center" })
    
    // Save the PDF
    doc.save(`Payslip-${months.find(m => m.value === salaryData.month)?.label}-${salaryData.year}.pdf`)
    
    toast({
      title: "Success",
      description: "Payslip downloaded successfully",
      variant: "default"
    })
  }

  if (isLoading) return <Loader/>

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">My Payroll Information</h1>
        <Button 
          variant="outline"
          onClick={() => navigate(RouteDict.Payroll.ViewAllEmployees)}
        >
          View All Employees' Payroll
        </Button>
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
                <TableCell>{payrollData?.bankDetails?.accountHolder}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Account Number</TableCell>
                <TableCell>{payrollData?.bankDetails?.accountNumber}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">IFSC Code</TableCell>
                <TableCell>{payrollData?.bankDetails?.ifscCode}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Bank Name</TableCell>
                <TableCell>{payrollData?.bankDetails?.bankName}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default PayRollViewOwn