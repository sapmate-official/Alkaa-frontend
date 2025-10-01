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
} from '@/components/charts';

type AttendanceStatusSummary = Record<string, number>;

interface AttendanceTotals {
  hoursWorked: number;
  breakMinutes: number;
  attendanceEntries: number;
  geofenceViolationCount: number;
}

interface AttendanceCalendarEntry {
  date: string;
  day: number;
  isWeekend?: boolean;
  attendanceStatus?: string;
}

interface AttendanceBreakHistoryEntry {
  id: string;
  breakType?: string;
  durationMinutes?: number;
  status?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  violation?: unknown;
  note?: string | null;
}

interface AttendanceGeofenceHistoryEntry {
  id: string;
  geofenceName?: string | null;
  violationType?: string | null;
  severity?: string | null;
  startTime?: string | null;
  resolvedAt?: string | null;
  distance?: number | null;
  action?: string | null;
}

interface AttendanceDetails {
  calendar?: AttendanceCalendarEntry[];
  summaryByStatus?: AttendanceStatusSummary;
  totals?: AttendanceTotals;
  records?: Array<Record<string, unknown>>;
  leaves?: Array<Record<string, unknown>>;
  holidays?: Array<Record<string, unknown>>;
  breakHistory?: AttendanceBreakHistoryEntry[];
  geofenceHistory?: AttendanceGeofenceHistoryEntry[];
  metadata?: {
    monthStart?: string;
    monthEnd?: string;
    weekendDays?: number[];
    daysInMonth?: number;
  };
}

interface AttendanceRuleInsight {
  id: string;
  ruleType?: string | null;
  definition?: string;
  violationCount: number;
  severityBreakdown?: Record<string, number>;
  threshold?: Record<string, unknown>;
  penalty?: Record<string, unknown>;
}

interface BreakRuleInsight {
  id: string;
  breakType?: string;
  definition?: string;
  totalBreaks: number;
  violationCount: number;
  penaltyPerMinute?: number | null;
  timeWindow?: Record<string, unknown> | null;
}

interface GeofenceRuleInsight {
  id: string;
  name?: string | null;
  definition?: string;
  type?: string | null;
  violationCount: number;
  radius?: number | null;
  allowedDeviation?: number | null;
  strictMode?: boolean;
}

interface PayslipRuleContext {
  attendanceRules?: AttendanceRuleInsight[];
  breakRules?: BreakRuleInsight[];
  geofenceRules?: GeofenceRuleInsight[];
  organizationSettings?: Record<string, unknown> | null;
}

interface PenaltySummary {
  totalViolations: number;
  totalPenalty?: number;
  totalMinutesImpacted?: number;
  maxRecordedDistance?: number;
  byRuleType?: Record<string, { count: number; penalty?: number }>;
  byBreakType?: Record<string, { count: number; totalMinutes: number }>;
  byViolationType?: Record<string, { count: number }>;
}

interface PenaltyCollection {
  summary?: PenaltySummary;
  records?: Array<Record<string, unknown>>;
}

interface ProgressivePenaltyRecord {
  id: string;
  violationType?: string | null;
  penaltyAmount?: number | null;
  progressiveMultiplier?: number | null;
  violationCount?: number | null;
  status?: string | null;
  dateApplied?: string | null;
  payrollMonth?: number;
  payrollYear?: number;
  metadata?: Record<string, unknown>;
}

interface PayslipPenaltyContext {
  progressivePenalties?: ProgressivePenaltyRecord[];
  attendanceViolations?: PenaltyCollection;
  breakViolations?: PenaltyCollection;
  geofenceViolations?: PenaltyCollection;
}

interface SalaryParameters {
  hraPercentage: number;
  daPercentage: number;
  taPercentage: number;
  pfPercentage: number;
  taxPercentage: number;
  insuranceFixed: number;
  additionalAllowances: Record<string, number>;
  additionalDeductions: Record<string, number>;
}

interface SalaryTemplateContext {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  isActive: boolean;
  rules: Record<string, unknown>;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface CalculationRuleContext {
  id: string;
  name: string;
  formula: string;
  type: string;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface PayslipSalaryContext {
  salaryParameters?: SalaryParameters;
  salaryTemplate?: SalaryTemplateContext | null;
  calculationRules?: CalculationRuleContext[];
}

// Types
interface Payslip {
  id: string;
  month: number;
  year: number;
  status: string;
  basicSalary: number;
  netSalary: number;
}

export interface PayslipStatistics {
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
    summaryByStatus?: AttendanceStatusSummary;
    totals?: AttendanceTotals;
  };
  attendanceDetails?: AttendanceDetails;
  salaryContext?: PayslipSalaryContext;
  ruleContext?: PayslipRuleContext;
  penaltyContext?: PayslipPenaltyContext;
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
    attendanceDetails,
    salaryContext,
    ruleContext,
    penaltyContext,
  } = statistics;

  const attendanceSummaryEntries = attendanceAnalysis.summaryByStatus
    ? Object.entries(attendanceAnalysis.summaryByStatus)
    : [];

  const attendanceTotals = attendanceAnalysis.totals;
  const recentBreaks = attendanceDetails?.breakHistory?.slice(0, 5) || [];
  const recentGeofences = attendanceDetails?.geofenceHistory?.slice(0, 5) || [];

  const attendanceRules = ruleContext?.attendanceRules || [];
  const breakRules = ruleContext?.breakRules || [];
  const geofenceRules = ruleContext?.geofenceRules || [];

  const progressivePenalties = penaltyContext?.progressivePenalties || [];
  const attendancePenaltySummary = penaltyContext?.attendanceViolations?.summary;
  const breakPenaltySummary = penaltyContext?.breakViolations?.summary;
  const geofencePenaltySummary = penaltyContext?.geofenceViolations?.summary;

  const hasSalaryContext = Boolean(
    salaryContext && (
      salaryContext.salaryParameters ||
      salaryContext.salaryTemplate ||
      (salaryContext.calculationRules && salaryContext.calculationRules.length > 0)
    )
  );

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatLabel = (label: string): string => {
    if (!label) return 'Not Specified';
    return label
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };

  const formatKeyValues = (data?: Record<string, unknown>): string => {
    if (!data || Object.keys(data).length === 0) {
      return 'Not specified';
    }

    return Object.entries(data)
      .map(([key, value]) => {
        if (value === null || value === undefined) {
          return `${formatLabel(key)}: N/A`;
        }

        if (typeof value === 'object') {
          return `${formatLabel(key)}: ${JSON.stringify(value)}`;
        }

        return `${formatLabel(key)}: ${value}`;
      })
      .join(', ');
  };

  const formatMinutes = (minutes?: number | null): string => {
    if (minutes === null || minutes === undefined) {
      return '0 mins';
    }

    const wholeMinutes = Math.round(minutes);
    const hours = Math.floor(wholeMinutes / 60);
    const remainder = wholeMinutes % 60;

    if (hours === 0) {
      const minuteLabel = wholeMinutes === 1 ? 'min' : 'mins';
      return `${wholeMinutes} ${minuteLabel}`;
    }

    if (remainder === 0) {
      const hourLabel = hours === 1 ? 'hr' : 'hrs';
      return `${hours} ${hourLabel}`;
    }

    const hourLabel = hours === 1 ? 'hr' : 'hrs';
    const minuteLabel = remainder === 1 ? 'min' : 'mins';
    return `${hours} ${hourLabel} ${remainder} ${minuteLabel}`;
  };

  const formatDateTime = (iso?: string | null): string => {
    if (!iso) return 'N/A';
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) {
      return 'N/A';
    }
    return parsed.toLocaleString();
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

      {attendanceDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Attendance Context</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Status Summary</h4>
                {attendanceSummaryEntries.length ? (
                  <div className="grid grid-cols-2 gap-2">
                    {attendanceSummaryEntries.map(([status, count]) => (
                      <div key={`attendance-summary-${status}`} className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">{formatLabel(status)}</p>
                        <p className="text-lg font-semibold">{count}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No attendance summary available for this period.</p>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Time &amp; Compliance Metrics</h4>
                {attendanceTotals ? (
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between"><span>Hours Worked</span><span className="font-medium">{typeof attendanceTotals.hoursWorked === 'number' ? attendanceTotals.hoursWorked.toFixed(2) : '0.00'}</span></li>
                    <li className="flex justify-between"><span>Total Break Time</span><span className="font-medium">{formatMinutes(typeof attendanceTotals.breakMinutes === 'number' ? attendanceTotals.breakMinutes : 0)}</span></li>
                    <li className="flex justify-between"><span>Attendance Entries</span><span className="font-medium">{attendanceTotals.attendanceEntries ?? 0}</span></li>
                    <li className="flex justify-between"><span>Geofence Violations</span><span className="font-medium">{attendanceTotals.geofenceViolationCount ?? 0}</span></li>
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No cumulative metrics captured for this period.</p>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Break &amp; Geofence Highlights</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Break History</p>
                    {recentBreaks.length ? (
                      <ul className="mt-1 space-y-1">
                        {recentBreaks.map(item => (
                          <li key={`break-${item.id}`} className="rounded-md border p-2 flex justify-between items-center">
                            <div>
                              <p className="text-xs font-semibold">{formatLabel(item.breakType || 'Break')}</p>
                              <p className="text-[11px] text-muted-foreground">{formatDateTime(item.startTime)}{item.endTime ? ` - ${formatDateTime(item.endTime)}` : ''}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium">{formatMinutes(item.durationMinutes ?? null)}</p>
                              <p className={`text-[11px] ${item.violation ? 'text-red-600' : 'text-green-600'}`}>
                                {item.violation ? 'Violation' : 'Compliant'}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No break activity captured.</p>
                    )}
                  </div>
                  <div>
                    <p className="mt-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Geofence Events</p>
                    {recentGeofences.length ? (
                      <ul className="mt-1 space-y-1">
                        {recentGeofences.map(event => (
                          <li key={`geofence-${event.id}`} className="rounded-md border p-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold">{event.geofenceName || 'Geofence Event'}</span>
                              <span className={`text-[11px] font-medium ${event.severity === 'HIGH' ? 'text-red-600' : 'text-amber-600'}`}>
                                {formatLabel(event.severity || 'Info')}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">{formatLabel(event.violationType || 'General')}</p>
                            <p className="text-[11px] text-muted-foreground">{formatDateTime(event.startTime)}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No geofence deviations recorded.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(attendanceRules.length || breakRules.length || geofenceRules.length) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rule Compliance Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {attendanceRules.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Attendance Rules</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {attendanceRules.map(rule => (
                    <div key={`attendance-rule-${rule.id}`} className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{formatLabel(rule.ruleType || 'Rule')}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                          {rule.violationCount} {rule.violationCount === 1 ? 'issue' : 'issues'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{rule.definition || 'No definition provided.'}</p>
                      {rule.severityBreakdown && Object.keys(rule.severityBreakdown).length > 0 && (
                        <div className="text-[11px] text-muted-foreground">
                          <span className="font-medium text-foreground">Severity:</span>{' '}
                          {Object.entries(rule.severityBreakdown)
                            .map(([level, count]) => `${formatLabel(level)} (${count})`)
                            .join(', ')}
                        </div>
                      )}
                      {rule.threshold && Object.keys(rule.threshold).length > 0 && (
                        <p className="text-[11px]"><span className="font-medium">Thresholds:</span> {formatKeyValues(rule.threshold)}</p>
                      )}
                      {rule.penalty && Object.keys(rule.penalty).length > 0 && (
                        <p className="text-[11px]"><span className="font-medium">Penalty:</span> {formatKeyValues(rule.penalty)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {breakRules.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Break Rules</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {breakRules.map(rule => (
                    <div key={`break-rule-${rule.id}`} className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{formatLabel(rule.breakType || 'Break')}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive font-medium">
                          {rule.violationCount} {rule.violationCount === 1 ? 'violation' : 'violations'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{rule.definition || 'No description provided.'}</p>
                      <p className="text-[11px]"><span className="font-medium">Total Breaks:</span> {rule.totalBreaks}</p>
                      {typeof rule.penaltyPerMinute === 'number' && rule.penaltyPerMinute > 0 && (
                        <p className="text-[11px]"><span className="font-medium">Penalty / Min:</span> {formatCurrency(rule.penaltyPerMinute)} / min</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {geofenceRules.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Geofence Rules</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {geofenceRules.map(rule => (
                    <div key={`geofence-rule-${rule.id}`} className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{rule.name || 'Geofence Rule'}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                          {rule.violationCount} {rule.violationCount === 1 ? 'violation' : 'violations'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{rule.definition || 'No definition provided.'}</p>
                      <p className="text-[11px]"><span className="font-medium">Type:</span> {formatLabel(rule.type || 'Geofence')}</p>
                      {typeof rule.radius === 'number' && (
                        <p className="text-[11px]"><span className="font-medium">Radius:</span> {rule.radius} m</p>
                      )}
                      {typeof rule.allowedDeviation === 'number' && (
                        <p className="text-[11px]"><span className="font-medium">Allowed Deviation:</span> {rule.allowedDeviation} m</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(progressivePenalties.length > 0 || attendancePenaltySummary || breakPenaltySummary || geofencePenaltySummary) && (
        <Card>
          <CardHeader>
            <CardTitle>Penalty Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <h4 className="text-sm font-semibold">Attendance Violations</h4>
                {attendancePenaltySummary ? (
                  <div className="mt-2 space-y-2 text-sm">
                    <p className="flex justify-between"><span>Total Violations</span><span className="font-medium">{attendancePenaltySummary.totalViolations ?? 0}</span></p>
                    {typeof attendancePenaltySummary.totalPenalty === 'number' && (
                      <p className="flex justify-between"><span>Penalty Value</span><span className="font-medium">{formatCurrency(attendancePenaltySummary.totalPenalty)}</span></p>
                    )}
                    {attendancePenaltySummary.byRuleType && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        {Object.entries(attendancePenaltySummary.byRuleType).map(([key, value]) => (
                          <div key={`attendance-penalty-${key}`} className="flex justify-between">
                            <span>{formatLabel(key)}</span>
                            <span>{value.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">No attendance penalties recorded.</p>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="text-sm font-semibold">Break Violations</h4>
                {breakPenaltySummary ? (
                  <div className="mt-2 space-y-2 text-sm">
                    <p className="flex justify-between"><span>Total Violations</span><span className="font-medium">{breakPenaltySummary.totalViolations ?? 0}</span></p>
                    {typeof breakPenaltySummary.totalMinutesImpacted === 'number' && (
                      <p className="flex justify-between"><span>Time Impact</span><span className="font-medium">{formatMinutes(breakPenaltySummary.totalMinutesImpacted)}</span></p>
                    )}
                    {breakPenaltySummary.byBreakType && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        {Object.entries(breakPenaltySummary.byBreakType).map(([key, value]) => (
                          <div key={`break-penalty-${key}`} className="flex justify-between">
                            <span>{formatLabel(key)}</span>
                            <span>{value.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">No break penalties recorded.</p>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="text-sm font-semibold">Geofence Violations</h4>
                {geofencePenaltySummary ? (
                  <div className="mt-2 space-y-2 text-sm">
                    <p className="flex justify-between"><span>Total Violations</span><span className="font-medium">{geofencePenaltySummary.totalViolations ?? 0}</span></p>
                    {typeof geofencePenaltySummary.maxRecordedDistance === 'number' && (
                      <p className="flex justify-between"><span>Max Distance</span><span className="font-medium">{geofencePenaltySummary.maxRecordedDistance} m</span></p>
                    )}
                    {geofencePenaltySummary.byViolationType && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        {Object.entries(geofencePenaltySummary.byViolationType).map(([key, value]) => (
                          <div key={`geofence-penalty-${key}`} className="flex justify-between">
                            <span>{formatLabel(key)}</span>
                            <span>{value.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">No geofence penalties recorded.</p>
                )}
              </div>
            </div>

            {progressivePenalties.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Progressive Penalties Applied</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Violation Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Multiplier</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>Applied On</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {progressivePenalties.map(penalty => (
                        <TableRow key={`progressive-${penalty.id}`}>
                          <TableCell>{formatLabel(penalty.violationType || 'General')}</TableCell>
                          <TableCell>{typeof penalty.penaltyAmount === 'number' ? formatCurrency(penalty.penaltyAmount) : 'N/A'}</TableCell>
                          <TableCell>{penalty.progressiveMultiplier ?? 'N/A'}</TableCell>
                          <TableCell>{penalty.violationCount ?? 'N/A'}</TableCell>
                          <TableCell>{formatDateTime(penalty.dateApplied)}</TableCell>
                          <TableCell>{penalty.status || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {hasSalaryContext && salaryContext && (
        <Card>
          <CardHeader>
            <CardTitle>Salary Calculation Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {salaryContext.salaryParameters && (
              <div>
                <h4 className="text-sm font-medium mb-2">Salary Parameters</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">HRA %</p>
                    <p className="text-lg font-semibold">{salaryContext.salaryParameters.hraPercentage}%</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">DA %</p>
                    <p className="text-lg font-semibold">{salaryContext.salaryParameters.daPercentage}%</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">TA %</p>
                    <p className="text-lg font-semibold">{salaryContext.salaryParameters.taPercentage}%</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">PF %</p>
                    <p className="text-lg font-semibold">{salaryContext.salaryParameters.pfPercentage}%</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Tax %</p>
                    <p className="text-lg font-semibold">{salaryContext.salaryParameters.taxPercentage}%</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Insurance</p>
                    <p className="text-lg font-semibold">{formatCurrency(salaryContext.salaryParameters.insuranceFixed)}</p>
                  </div>
                </div>
                {Object.keys(salaryContext.salaryParameters.additionalAllowances || {}).length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Additional Allowances:</span> {formatKeyValues(salaryContext.salaryParameters.additionalAllowances)}
                  </p>
                )}
                {Object.keys(salaryContext.salaryParameters.additionalDeductions || {}).length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Additional Deductions:</span> {formatKeyValues(salaryContext.salaryParameters.additionalDeductions)}
                  </p>
                )}
              </div>
            )}

            {salaryContext.salaryTemplate && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Salary Template</h4>
                <div className="rounded-lg border p-4 space-y-2 text-sm">
                  <p className="font-semibold">{salaryContext.salaryTemplate.name}</p>
                  {salaryContext.salaryTemplate.description && (
                    <p className="text-xs text-muted-foreground">{salaryContext.salaryTemplate.description}</p>
                  )}
                  <p className="text-xs"><span className="font-medium">Default Template:</span> {salaryContext.salaryTemplate.isDefault ? 'Yes' : 'No'}</p>
                  <p className="text-xs"><span className="font-medium">Active:</span> {salaryContext.salaryTemplate.isActive ? 'Yes' : 'No'}</p>
                  {salaryContext.salaryTemplate.updatedAt && (
                    <p className="text-[11px] text-muted-foreground">Last Updated: {formatDateTime(salaryContext.salaryTemplate.updatedAt)}</p>
                  )}
                </div>
              </div>
            )}

            {salaryContext.calculationRules && salaryContext.calculationRules.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Custom Calculation Rules</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Formula</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salaryContext.calculationRules.map(rule => (
                        <TableRow key={`calculation-rule-${rule.id}`}>
                          <TableCell>{rule.name}</TableCell>
                          <TableCell className="max-w-[240px] whitespace-pre-wrap text-xs">{rule.formula}</TableCell>
                          <TableCell>{formatLabel(rule.type)}</TableCell>
                          <TableCell>{rule.isActive ? 'Active' : 'Disabled'}</TableCell>
                          <TableCell>{rule.updatedAt ? formatDateTime(rule.updatedAt) : 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
