
import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/AuthContext'
import axios from 'axios'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'
import { APIDictionary } from '@/services/api/v2/APIdict'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { 
  Users, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Play,
  RefreshCw
} from 'lucide-react'

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  employeeId: string
  department: {
    name: string
  }
  monthlySalary: number
  salaryGenerated: boolean
  salaryRecordId?: string
  status?: string
}

interface BulkGenerationResult {
  processedCount: number
  failedCount: number
  totalAmount: number
  errors: {
    employeeId: string
    employeeName: string
    error: string
  }[]
}

const MainGenerateUsersSalaryPage = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState<BulkGenerationResult | null>(null)
  
  // Form state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

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

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  // Fetch employees and check salary status
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true)
        
        // Get all employees in organization
        const employeesResponse = await axios.get(
          `${APIDictionary.Organization}/employee-list/${user?.orgId}`,
          { withCredentials: true }
        )

        if (employeesResponse.data) {
          const employeeList = employeesResponse.data

          // Check salary generation status for selected month/year
          const salaryStatusResponse = await axios.post(
            APIV3Dictionary.payroll.checkMultipleStatus,
            {
              payslipData: employeeList.map((emp: any) => ({
                userId: emp.id,
                month: selectedMonth,
                year: selectedYear
              }))
            },
            { withCredentials: true }
          )

          if (salaryStatusResponse.data.success) {
            const statusMap = salaryStatusResponse.data.data
            
            // Merge employee data with salary status
            const employeesWithStatus = employeeList.map((emp: any) => {
              const statusKey = `${emp.id}_${selectedMonth}_${selectedYear}`
              const salaryStatus = statusMap[statusKey]
              
              return {
                ...emp,
                salaryGenerated: salaryStatus?.exists || false,
                salaryRecordId: salaryStatus?.salaryRecordId,
                status: salaryStatus?.status
              }
            })

            setEmployees(employeesWithStatus)
          }
        }
      } catch (error) {
        console.error('Error fetching employees:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch employee data',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.orgId) {
      fetchEmployees()
    }
  }, [user?.orgId, selectedMonth, selectedYear])

  // Handle bulk salary generation
  const handleBulkGenerate = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: 'Warning',
        description: 'Please select at least one employee',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsGenerating(true)
      setGenerationResult(null)

      const response = await axios.post(
        APIV3Dictionary.payroll.bulkGenerate,
        {
          month: selectedMonth,
          year: selectedYear,
          userIds: selectedEmployees // Optional: specific user IDs
        },
        { withCredentials: true }
      )

      if (response.data.success) {
        setGenerationResult(response.data.data)
        toast({
          title: 'Success',
          description: `Bulk salary generation completed. ${response.data.data.processedCount} salaries generated.`,
        })
        
        // Refresh employee data
        window.location.reload()
      }
    } catch (error: any) {
      console.error('Error generating salaries:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to generate salaries',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle select all/none
  const handleSelectAll = () => {
    const eligibleEmployees = employees.filter(emp => !emp.salaryGenerated)
    if (selectedEmployees.length === eligibleEmployees.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(eligibleEmployees.map(emp => emp.id))
    }
  }

  // Handle individual selection
  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Calculate totals
  const eligibleEmployees = employees.filter(emp => !emp.salaryGenerated)
  const selectedEmployeesData = employees.filter(emp => selectedEmployees.includes(emp.id))
  const totalSelectedSalary = selectedEmployeesData.reduce((sum, emp) => sum + (emp.monthlySalary || 0), 0)

  return (
    <div className="p-6 w-full h-screen overflow-y-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Generate Salary for All Users</h1>
          <p className="text-muted-foreground">
            Bulk generate salaries for employees in your organization
          </p>
        </div>
      </div>

      {/* Month/Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Period</CardTitle>
          <CardDescription>Select the month and year for salary generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <label className="text-sm font-medium">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full border rounded-md px-3 py-2 mt-1"
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full border rounded-md px-3 py-2 mt-1"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eligible for Generation</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eligibleEmployees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedEmployees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSelectedSalary)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Employee Selection</CardTitle>
              <CardDescription>
                Select employees for salary generation
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSelectAll}
                disabled={eligibleEmployees.length === 0}
              >
                {selectedEmployees.length === eligibleEmployees.length ? 'Deselect All' : 'Select All Eligible'}
              </Button>
              <Button
                onClick={handleBulkGenerate}
                disabled={selectedEmployees.length === 0 || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generate Salaries ({selectedEmployees.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    employee.salaryGenerated ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedEmployees.includes(employee.id)}
                      onCheckedChange={() => handleEmployeeSelect(employee.id)}
                      disabled={employee.salaryGenerated}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </h4>
                        {employee.salaryGenerated && (
                          <Badge variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Generated
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {employee.employeeId} • {employee.department?.name || 'No Department'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(employee.monthlySalary || 0)}</p>
                    <p className="text-sm text-muted-foreground">{employee.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generation Result */}
      {generationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Generation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{generationResult.processedCount}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{generationResult.failedCount}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatCurrency(generationResult.totalAmount)}</div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
              </div>
            </div>
            
            {generationResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Errors:</h4>
                {generationResult.errors.map((error, index) => (
                  <div key={index} className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                    <strong>{error.employeeName}:</strong> {error.error}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default MainGenerateUsersSalaryPage