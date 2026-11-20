import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Users, 
  CheckCircle2, 
  Clock, 
  Search, 
  Sparkles 
} from 'lucide-react';
import PayrollHeader from '../../ui/PayrollHeader';
import { APIDictionary } from '@/services/api/v2/APIdict';
import { cn } from '@/lib/utils';
import { useBulkGeneratePayroll } from '@/hooks/queries/usePayroll';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  monthlySalary?: number;
  department?: {
    name: string;
  };
  salaryGenerated?: boolean;
}

export const MainGenerateUsersSalaryPage: React.FC = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const bulkGenerateMutation = useBulkGeneratePayroll();
  const isGenerating = bulkGenerateMutation.isPending;

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
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Fetch employees and check generation status for selected month/year
  const fetchEmployees = async () => {
    setIsLoading(true);
    setSelectedEmployeeIds([]);
    try {
      const response = await axios.get(APIDictionary.user, { withCredentials: true });
      if (response.data.success && Array.isArray(response.data.data)) {
        const rawEmployees: Employee[] = response.data.data;
        
        // Concurrently check salary record existence for each employee
        const checkedEmployees = await Promise.all(
          rawEmployees.map(async (emp) => {
            try {
              const checkResp = await axios.get(
                APIDictionary.SalaryRecordExistence(emp.id, selectedMonth, selectedYear),
                { withCredentials: true }
              );
              return {
                ...emp,
                salaryGenerated: Boolean(checkResp.data?.success && checkResp.data?.data)
              };
            } catch {
              return {
                ...emp,
                salaryGenerated: false
              };
            }
          })
        );

        setEmployees(checkedEmployees);
        setFilteredEmployees(checkedEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employee directory',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [selectedMonth, selectedYear]);

  // Search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(employees);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredEmployees(
      employees.filter(emp =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
        (emp.employeeId && emp.employeeId.toLowerCase().includes(q)) ||
        (emp.department?.name && emp.department.name.toLowerCase().includes(q))
      )
    );
  }, [searchQuery, employees]);

  // Selection handlers
  const pendingEmployees = filteredEmployees.filter(emp => !emp.salaryGenerated);
  const areAllPendingSelected = pendingEmployees.length > 0 && 
    pendingEmployees.every(emp => selectedEmployeeIds.includes(emp.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds(pendingEmployees.map(emp => emp.id));
    } else {
      setSelectedEmployeeIds([]);
    }
  };

  const handleToggleSelect = (empId: string) => {
    setSelectedEmployeeIds(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  // Generate salary in batch
  const handleBatchGenerate = async () => {
    if (selectedEmployeeIds.length === 0) {
      toast({
        title: 'Notice',
        description: 'Please select at least one employee',
      });
      return;
    }

    try {
      await bulkGenerateMutation.mutateAsync({
        userIds: selectedEmployeeIds,
        month: selectedMonth,
        year: selectedYear
      });
      toast({
        title: 'Success',
        description: `Successfully generated payroll for ${selectedEmployeeIds.length} employee(s).`,
      });
      fetchEmployees();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to generate salary for selected employees.',
        variant: 'destructive',
      });
    }
  };

  const totalEmployeesCount = employees.length;
  const alreadyGeneratedCount = employees.filter(e => e.salaryGenerated).length;
  const pendingGenerationCount = totalEmployeesCount - alreadyGeneratedCount;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      <PayrollHeader 
        title="Generate Salary" 
        description="Calculate monthly attendance, allowances, and issue payslips for all organization staff"
        activeTab="generate"
      />

      {/* Period Selector & Batch Summary */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold">Payroll Period Selection</CardTitle>
              <CardDescription className="text-xs">
                Select month and year to process organization salary records
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(val) => setSelectedMonth(parseInt(val))}
              >
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()} className="text-xs">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedYear.toString()}
                onValueChange={(val) => setSelectedYear(parseInt(val))}
              >
                <SelectTrigger className="w-[95px] h-9 text-xs">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()} className="text-xs">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{totalEmployeesCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Active employees</p>
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="p-4 rounded-lg bg-card border border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Already Generated</p>
                <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{alreadyGeneratedCount}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span className="text-xs text-muted-foreground">Ready for disbursement</span>
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="p-4 rounded-lg bg-card border border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending Generation</p>
                <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{pendingGenerationCount}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500 inline-block"></span>
                  <span className="text-xs text-muted-foreground">Requires calculation</span>
                </div>
              </div>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Employee Table & Generator */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Employee Roster</CardTitle>
              <CardDescription className="text-xs">
                Select individual or all pending employees to calculate and generate salary
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>

              <Button
                size="sm"
                onClick={handleBatchGenerate}
                disabled={isGenerating || selectedEmployeeIds.length === 0}
                className="h-8 text-xs whitespace-nowrap"
              >
                {isGenerating ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                )}
                Generate for Selected ({selectedEmployeeIds.length})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">Verifying existing salary records...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              No employees found matching query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="h-10">
                    <TableHead className="w-12 text-center">
                      <Checkbox
                        checked={areAllPendingSelected}
                        onCheckedChange={handleSelectAll}
                        disabled={pendingEmployees.length === 0}
                        aria-label="Select all pending"
                      />
                    </TableHead>
                    <TableHead className="text-xs font-semibold">Employee Name</TableHead>
                    <TableHead className="text-xs font-semibold">Employee ID</TableHead>
                    <TableHead className="text-xs font-semibold">Department</TableHead>
                    <TableHead className="text-xs font-semibold">Status for Period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp) => {
                    const isSelected = selectedEmployeeIds.includes(emp.id);
                    return (
                      <TableRow 
                        key={emp.id}
                        className={cn(
                          "h-11 transition-colors",
                          emp.salaryGenerated ? "opacity-70 bg-muted/10" : "hover:bg-muted/30"
                        )}
                      >
                        <TableCell className="text-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSelect(emp.id)}
                            disabled={emp.salaryGenerated}
                            aria-label={`Select ${emp.firstName}`}
                          />
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {emp.firstName} {emp.lastName}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {emp.employeeId || 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {emp.department?.name || 'General'}
                        </TableCell>
                        <TableCell>
                          {emp.salaryGenerated ? (
                            <Badge variant="success" className="text-[11px]">
                              Already Generated
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[11px]">
                              Ready to Generate
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MainGenerateUsersSalaryPage;
