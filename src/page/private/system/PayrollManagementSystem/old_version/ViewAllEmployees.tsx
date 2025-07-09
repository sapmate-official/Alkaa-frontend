import { APIDictionary } from '@/api/v2/APIdict'
import { useAuth } from '@/services/AuthContext'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import axios from 'axios'
import { useEffect, useState } from 'react'
import Loader from '@/components/Loader'
import { Button } from "@/components/ui/button"
import { useNavigate } from 'react-router-dom'
import { Download, Eye, Search, UserCheck } from "lucide-react"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { toast } from "@/hooks/use-toast"
import RouteDict from '@/routes/RouteDict'

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  monthlySalary: number;
}

interface SalaryRecord {
  id: string;
  month: number;
  year: number;
  netSalary: number;
  status: string;
  processedAt: string;
}

interface EmployeePayrollData {
  employee: Employee;
  salaryRecords: SalaryRecord[];
}

const PayrollViewAllEmployees = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [employeePayrollData, setEmployeePayrollData] = useState<EmployeePayrollData[]>([])
  const [filteredData, setFilteredData] = useState<EmployeePayrollData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [departments, setDepartments] = useState<string[]>([])
  const [, setUserRoles] = useState<string[]>([])
  const [isOrgAdmin, setIsOrgAdmin] = useState(false)
  const [isManager, setIsManager] = useState(false)

  // Generate months array
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
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)

  // Check user roles
  useEffect(() => {
    const checkRoles = async () => {
      try {
        if (!user?.id) return
        
        const response = await axios.get(`${APIDictionary.userProfile(user.id)}`)
        const userData = response.data.user
        
        // Check if user has org admin permissions
        const hasViewAllPermission = userData.roles?.some((userRole: any) => 
          userRole.role.permissions?.some((perm: any) => 
            perm.permission?.key === "view_salary_slip_of_all"
          )
        )
        
        // Check if user is a manager (has subordinates)
        const isManager = await axios.get(`${APIDictionary.user}/subordinates/${user.id}`)
        
        setIsOrgAdmin(hasViewAllPermission)
        setIsManager(isManager.data.length > 0)
        setUserRoles(userData.roles?.map((ur: any) => ur.role.name) || [])
      } catch (error) {
        console.error("Error checking user roles:", error)
      }
    }
    
    checkRoles()
  }, [user])

  // Fetch payroll data based on user role
  useEffect(() => {
    const fetchPayrollData = async () => {
      try {
        setIsLoading(true)
        if (!user?.id) return
        
        let response
        
        if (isOrgAdmin) {
          // Fetch all employees' payroll data
          response = await axios.get(`${APIDictionary.payroll}/admin/all-employees/${user.orgId}`, {
            params: {
              month: selectedMonth || undefined,
              year: selectedYear || undefined
            }
          })
        } else if (isManager) {
          // Fetch managed employees' payroll data
          response = await axios.get(`${APIDictionary.payroll}/manager/employees`)
        } else {
          // If not admin or manager, navigate back to own payroll view
          navigate(RouteDict.Payroll.ViewOwn)
          return
        }
        
        setEmployeePayrollData(response.data.employeePayrollData)
        setFilteredData(response.data.employeePayrollData)
        
        // Extract unique departments
        const depts = Array.from(new Set(
          response.data.employeePayrollData
            .map((data: EmployeePayrollData) => data.employee.department)
            .filter(Boolean)
        ))
        setDepartments(depts as string[])
      } catch (error) {
        console.error("Error fetching payroll data:", error)
        toast({
          title: "Error",
          description: "Failed to fetch payroll data. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    if (isOrgAdmin || isManager) {
      fetchPayrollData()
    }
  }, [user, isOrgAdmin, isManager, selectedMonth, selectedYear])

  // Filter data when search or filters change
  useEffect(() => {
    if (!employeePayrollData.length) return
    
    let result = [...employeePayrollData]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(data => 
        data.employee.name.toLowerCase().includes(query) || 
        data.employee.employeeId.toLowerCase().includes(query)
      )
    }
    
    // Apply department filter
    if (selectedDepartment) {
      result = result.filter(data => 
        data.employee.department === selectedDepartment
      )
    }
    
    setFilteredData(result)
  }, [searchQuery, selectedDepartment, employeePayrollData])

  // Function to view a specific employee's payroll details
  const viewEmployeePayroll = (employeeId: string) => {
    navigate(RouteDict.Dynamic.PayrollSlip(employeeId))
  }

  // Function to download payroll summary as PDF
  const downloadPayrollSummary = () => {
    const doc = new jsPDF()
    
    // Add header
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text(`Payroll Summary`, 105, 15, { align: "center" })
    
    // Add filters info
    doc.setFontSize(12)
    const period = selectedMonth && selectedYear 
      ? `${months.find(m => m.value === parseInt(selectedMonth))?.label} ${selectedYear}`
      : 'All Records'
    doc.text(`Period: ${period}`, 105, 25, { align: "center" })
    
    if (selectedDepartment) {
      doc.text(`Department: ${selectedDepartment}`, 105, 35, { align: "center" })
    }
    
    // Prepare data for table
    const tableData = filteredData.map(data => {
      const latestRecord = data.salaryRecords[0] // Most recent record
      return [
        data.employee.name,
        data.employee.employeeId,
        data.employee.department || 'N/A',
        latestRecord ? `₹${latestRecord.netSalary.toLocaleString()}` : 'N/A',
        latestRecord ? `${months.find(m => m.value === latestRecord.month)?.label} ${latestRecord.year}` : 'N/A',
        latestRecord ? latestRecord.status : 'N/A'
      ]
    })
    
    // Generate table
    // @ts-ignore - jsPDF-autotable extension
    doc.autoTable({
      startY: selectedDepartment ? 45 : 35,
      head: [['Employee Name', 'ID', 'Department', 'Latest Salary', 'Period', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [71, 85, 105] }
    })
    
    // Add footer
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 280)
    doc.text(`Generated by: ${user?.firstName} ${user?.lastName}`, 14, 285)
    doc.text("This is a confidential document.", 105, 285, { align: "center" })
    
    // Save the PDF
    const fileName = selectedMonth && selectedYear 
      ? `Payroll-Summary-${months.find(m => m.value === parseInt(selectedMonth))?.label}-${selectedYear}.pdf`
      : `Payroll-Summary-${new Date().toLocaleDateString()}.pdf`
    
    doc.save(fileName)
    
    toast({
      title: "Success",
      description: "Payroll summary downloaded successfully",
      variant: "default"
    })
  }

  if (isLoading) return <Loader />

  if (!isOrgAdmin && !isManager) {
    return (
      <Card className="m-4">
        <CardContent className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">Access Restricted</h2>
          <p className="mb-4">You don't have permission to view employees' payroll data.</p>
          <Button onClick={() => navigate(RouteDict.Payroll.ViewOwn)}>
            View Your Payroll
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full h-full px-4 mx-auto py-6 space-y-6 overflow-y-scroll">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Employees Payroll</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate(RouteDict.Payroll.ViewOwn)}
          >
            <UserCheck className="mr-2 h-4 w-4" /> My Payroll
          </Button>
          <Button 
            variant="default"
            onClick={downloadPayrollSummary}
            disabled={!filteredData.length}
          >
            <Download className="mr-2 h-4 w-4" /> Download Summary
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Search box */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Month filter */}
            <div className="w-[150px]">
              <Select
                value={selectedMonth}
                onValueChange={setSelectedMonth}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Months</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Year filter */}
            <div className="w-[120px]">
              <Select
                value={selectedYear}
                onValueChange={setSelectedYear}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Department filter */}
            <div className="w-[180px]">
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Records ({filteredData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Latest Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((data) => {
                  const latestRecord = data.salaryRecords[0]; // Most recent record
                  
                  return (
                    <TableRow key={data.employee.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{data.employee.name}</div>
                          <div className="text-sm text-muted-foreground">{data.employee.employeeId}</div>
                        </div>
                      </TableCell>
                      <TableCell>{data.employee.department || 'Unassigned'}</TableCell>
                      <TableCell>
                        {latestRecord ? (
                          <div>
                            <div className="font-medium">₹{latestRecord.netSalary.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">
                              {months.find(m => m.value === latestRecord.month)?.label} {latestRecord.year}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No salary records</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {latestRecord ? (
                          <Badge variant={latestRecord.status === 'PAID' ? 'success' : 'secondary'}>
                            {latestRecord.status}
                          </Badge>
                        ) : (
                          <Badge variant="outline">N/A</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => viewEmployeePayroll(data.employee.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No payroll records found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PayrollViewAllEmployees
