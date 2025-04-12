import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Types
interface Payslip {
  id: string;
  month: number;
  year: number;
  status: string;
  basicSalary: number;
  netSalary: number;
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

interface PayslipDetailedViewProps {
  statistics: PayslipStatistics;
  payslip: Payslip;
}

const PayslipDetailedView: React.FC<PayslipDetailedViewProps> = ({ statistics }) => {
  if (!statistics) return null;

  const {
    basicInfo,
    salaryBreakdown,
    attendanceAnalysis,
    comparisons,
  } = statistics;

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Chart data
  const salaryComponentsData = [
    { name: 'Basic', value: salaryBreakdown.basicSalary },
    { name: 'Allowances', value: salaryBreakdown.totalAllowances },
    { name: 'Deductions', value: -salaryBreakdown.totalDeductions }
  ];

  const attendanceData = [
    { name: 'Present', value: attendanceAnalysis.presentDays },
    { name: 'Absent', value: attendanceAnalysis.absentDays },
    { name: 'Half Day', value: attendanceAnalysis.halfDays },
    { name: 'Paid Leave', value: attendanceAnalysis.paidLeaveDays },
    { name: 'Unpaid Leave', value: attendanceAnalysis.unpaidLeaveDays }
  ];

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Employee Details</h3>
              <div className="space-y-1">
                <p><span className="font-medium">Name:</span> {basicInfo.employee.name}</p>
                <p><span className="font-medium">Employee ID:</span> {basicInfo.employee.employeeId}</p>
                <p><span className="font-medium">Department:</span> {basicInfo.employee.department || 'N/A'}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Payslip Information</h3>
              <div className="space-y-1">
                <p><span className="font-medium">Month:</span> {basicInfo.monthName} {basicInfo.year}</p>
                <p><span className="font-medium">Status:</span> {basicInfo.status}</p>
                {basicInfo.processedAt && (
                  <p><span className="font-medium">Processed Date:</span> {new Date(basicInfo.processedAt).toLocaleDateString()}</p>
                )}
                {basicInfo.paymentInfo.mode && (
                  <p><span className="font-medium">Payment Mode:</span> {basicInfo.paymentInfo.mode}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Card className="col-span-1 md:col-span-7">
          <CardHeader>
            <CardTitle>Salary Details</CardTitle>
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
                  <TableCell className="text-right">{formatCurrency(salaryBreakdown.basicSalary)}</TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell colSpan={2} className="font-medium">Allowances</TableCell>
                </TableRow>
                {Object.entries(salaryBreakdown.allowanceDetails).map(([key, value]) => (
                  <TableRow key={`allowance-${key}`}>
                    <TableCell className="pl-6">{key.charAt(0).toUpperCase() + key.slice(1)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(value)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-medium">Total Allowances</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(salaryBreakdown.totalAllowances)}</TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell colSpan={2} className="font-medium">Deductions</TableCell>
                </TableRow>
                {Object.entries(salaryBreakdown.deductionDetails).map(([key, value]) => (
                  <TableRow key={`deduction-${key}`}>
                    <TableCell className="pl-6">{key.charAt(0).toUpperCase() + key.slice(1)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(value)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-medium">Total Deductions</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(salaryBreakdown.totalDeductions)}</TableCell>
                </TableRow>
                
                {salaryBreakdown.additionalPayments.incentive > 0 && (
                  <TableRow>
                    <TableCell>Incentive</TableCell>
                    <TableCell className="text-right">{formatCurrency(salaryBreakdown.additionalPayments.incentive)}</TableCell>
                  </TableRow>
                )}
                
                {salaryBreakdown.additionalPayments.bonus > 0 && (
                  <TableRow>
                    <TableCell>Bonus</TableCell>
                    <TableCell className="text-right">{formatCurrency(salaryBreakdown.additionalPayments.bonus)}</TableCell>
                  </TableRow>
                )}
                
                <TableRow>
                  <TableCell className="text-base font-bold">Net Salary</TableCell>
                  <TableCell className="text-right text-base font-bold">{formatCurrency(salaryBreakdown.netSalary)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-5">
          <CardHeader>
            <CardTitle>Salary Composition</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salaryComponentsData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {salaryComponentsData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(Math.abs(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <Separator className="my-4" />
            
            <h4 className="text-sm font-medium mb-2">Salary Statistics</h4>
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-primary/15 p-3 text-center">
                <p className="text-xs font-medium text-primary">Earnings Ratio</p>
                <p className="text-xl font-bold">{comparisons.earningsRatio}%</p>
              </Card>
              <Card className="bg-secondary/15 p-3 text-center">
                <p className="text-xs font-medium text-secondary">YTD Earnings</p>
                <p className="text-xl font-bold">{formatCurrency(comparisons.yearToDateEarnings)}</p>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="col-span-1 md:col-span-7">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Working Days</TableCell>
                    <TableCell className="text-right">{attendanceAnalysis.workingDays}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Present Days</TableCell>
                    <TableCell className="text-right">{attendanceAnalysis.presentDays}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Half Days</TableCell>
                    <TableCell className="text-right">{attendanceAnalysis.halfDays}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Absent Days</TableCell>
                    <TableCell className="text-right">{attendanceAnalysis.absentDays}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Paid Leave Days</TableCell>
                    <TableCell className="text-right">{attendanceAnalysis.paidLeaveDays}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Unpaid Leave Days</TableCell>
                    <TableCell className="text-right">{attendanceAnalysis.unpaidLeaveDays}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Attendance Percentage</TableCell>
                    <TableCell className="text-right font-medium">{attendanceAnalysis.attendancePercentage}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="col-span-1 md:col-span-5">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={attendanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {attendanceData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Section */}
      {comparisons.previousMonth && (
        <Card>
          <CardHeader>
            <CardTitle>Month-on-Month Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card className={`p-4 text-center ${
                comparisons.previousMonth.difference > 0 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                <p className="text-sm font-medium">Difference from Last Month</p>
                <p className="text-2xl font-bold">
                  {comparisons.previousMonth.difference > 0 ? '+' : ''}
                  {formatCurrency(comparisons.previousMonth.difference)}
                </p>
              </Card>
              <Card className={`p-4 text-center ${
                comparisons.previousMonth.percentageChange > 0 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                <p className="text-sm font-medium">Percentage Change</p>
                <p className="text-2xl font-bold">
                  {comparisons.previousMonth.percentageChange > 0 ? '+' : ''}
                  {comparisons.previousMonth.percentageChange.toFixed(1)}%
                </p>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PayslipDetailedView;
