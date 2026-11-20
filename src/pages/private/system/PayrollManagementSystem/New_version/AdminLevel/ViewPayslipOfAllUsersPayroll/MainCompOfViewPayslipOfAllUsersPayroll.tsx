import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Shadcn UI components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';

// Icons
import { 
  Plus, 
  Download, 
  Trash, 
  Users, 
  Search, 
  FileText,
  Eye
} from 'lucide-react';

// Local components
import PayslipDetailedView, { PayslipStatistics } from './PayslipDetailedView';
import { MonthYearPicker } from '../../ui/MonthYearPicker';
import PayrollHeader from '../../ui/PayrollHeader';
import { getStatusBadgeVariant } from '../../utils/Badgevariant';
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts';
import { APIDictionary } from '@/services/api/v2/APIdict';
import { usePayslipPDF } from '../../../../../../../hooks/usePayslipPDF.tsx';
import { cn } from '@/lib/utils';

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

export const MainCompOfViewPayslipOfAllUsersPayroll: React.FC = () => {
  const navigate = useNavigate();
  const currentDate = new Date();
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [payslipStatistics, setPayslipStatistics] = useState<PayslipStatistics | null>(null);
  const [preStatistics, setPreStatistics] = useState<PreStatisticsData | null>(null);
  
  const [userLoading, setUserLoading] = useState(false);
  const [payslipLoading, setPayslipLoading] = useState(false);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [preStatisticsLoading, setPreStatisticsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { generatePayslipPDF } = usePayslipPDF();

  const getMonthName = (m: number): string => {
    return new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Fetch all users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setUserLoading(true);
      try {
        const response = await axios.get(APIDictionary.user, { withCredentials: true });
        if (response.data.success) {
          setUsers(response.data.data);
          setFilteredUsers(response.data.data);
          if (response.data.data.length > 0) {
            setSelectedUser(response.data.data[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch employee list',
          variant: 'destructive',
        });
      } finally {
        setUserLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Filter users when search query changes
  useEffect(() => {
    if (!userSearch.trim()) {
      setFilteredUsers(users);
      return;
    }
    const q = userSearch.toLowerCase();
    setFilteredUsers(
      users.filter(u => 
        `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(q) ||
        (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
        (u.department?.name && u.department.name.toLowerCase().includes(q))
      )
    );
  }, [userSearch, users]);

  // Fetch payslips when selected user or date changes
  useEffect(() => {
    const fetchPayslips = async () => {
      if (!selectedUser) return;
      setPayslipLoading(true);
      try {
        const response = await axios.get<PayslipResponse>(
          APIV3Dictionary.payroll.getPayslip(month, year, selectedUser.id),
          { withCredentials: true }
        );
        if (response.data.success) {
          setPayslips(response.data.data || []);
          if (response.data.data.length === 0) {
            fetchPreStatistics(selectedUser.id);
          } else {
            setPreStatistics(null);
          }
        }
      } catch (error) {
        console.error('Error fetching payslips:', error);
        setPayslips([]);
        fetchPreStatistics(selectedUser.id);
      } finally {
        setPayslipLoading(false);
      }
    };

    fetchPayslips();
  }, [selectedUser, month, year]);

  const fetchPreStatistics = async (userId: string) => {
    setPreStatisticsLoading(true);
    try {
      const response = await axios.get<PreStatisticsResponse>(
        APIV3Dictionary.payroll.preStatistics(month, year, userId),
        { withCredentials: true }
      );
      if (response.data.success) {
        setPreStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching pre-statistics:', error);
      setPreStatistics(null);
    } finally {
      setPreStatisticsLoading(false);
    }
  };

  const handleSelectPayslip = async (payslip: Payslip) => {
    setSelectedPayslip(payslip);
    setStatisticsLoading(true);
    setIsDrawerOpen(true);
    try {
      const response = await axios.get(
        APIV3Dictionary.payroll.getStatistics(payslip.id),
        { withCredentials: true }
      );
      if (response.data.success) {
        setPayslipStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching payslip statistics:', error);
    } finally {
      setStatisticsLoading(false);
    }
  };

  const handleGenerateSalary = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const response = await axios.post(
        APIV3Dictionary.payroll.generateSalary(month, year, selectedUser.id),
        {},
        { withCredentials: true }
      );
      if (response.data.success) {
        toast({
          title: 'Success',
          description: `Salary generated for ${selectedUser.firstName || 'Employee'}!`,
        });
        // Refetch payslips
        const payslipResp = await axios.get<PayslipResponse>(
          APIV3Dictionary.payroll.getPayslip(month, year, selectedUser.id),
          { withCredentials: true }
        );
        if (payslipResp.data.success) {
          setPayslips(payslipResp.data.data || []);
          setPreStatistics(null);
        }
      }
    } catch (error: unknown) {
      console.error('Error generating salary:', error);
      const err = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const errorMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to generate salary';
      toast({
        title: 'Notice',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPayslip = async (payslip: Payslip) => {
    try {
      await generatePayslipPDF(payslip.id);
      toast({
        title: 'Success',
        description: 'Payslip downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading payslip:', error);
      toast({
        title: 'Error',
        description: 'Failed to download payslip',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePayslip = async (payslip: Payslip) => {
    if (!confirm('Are you sure you want to delete this salary record?')) return;
    try {
      await axios.delete(APIDictionary.payroll + `/${payslip.id}`, { withCredentials: true });
      toast({
        title: 'Success',
        description: 'Salary record removed successfully',
      });
      setPayslips(prev => prev.filter(p => p.id !== payslip.id));
    } catch (error) {
      console.error('Error deleting payslip:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete salary record',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      <PayrollHeader 
        title="All Employees' Payslips" 
        description="Inspect company-wide employee payslips, attendance calculations, and historical records"
        activeTab="admin-payslip"
      />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Searchable Employee Directory */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="p-4 border-b border-border space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Employees
                </CardTitle>
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {filteredUsers.length} total
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search name, ID or department..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[520px]">
                {userLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Skeleton key={n} className="h-14 w-full rounded-md" />
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No matching employees found
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {filteredUsers.map((user) => {
                      const isSelected = selectedUser?.id === user.id;
                      const initials = `${(user.firstName?.[0] || 'E')}${(user.lastName?.[0] || '')}`.toUpperCase();
                      return (
                        <button
                          key={user.id}
                          onClick={() => setSelectedUser(user)}
                          className={cn(
                            'w-full p-3.5 text-left transition-colors flex items-center gap-3',
                            isSelected
                              ? 'bg-secondary/80 font-medium'
                              : 'hover:bg-muted/40'
                          )}
                        >
                          <Avatar className="h-8 w-8 text-xs bg-muted text-muted-foreground border">
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {user.firstName || ''} {user.lastName || ''}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.employeeId ? `ID: ${user.employeeId}` : 'No ID'} • {user.department?.name || 'General'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Employee Payslip & Attendance Analysis */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-border shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {selectedUser 
                      ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}'s Payslip`
                      : 'Select an employee'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedUser ? `${selectedUser.department?.name || 'Department'} • ID: ${selectedUser.employeeId || 'N/A'}` : 'View and generate individual payroll records'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <MonthYearPicker
                    month={month}
                    year={year}
                    onMonthChange={setMonth}
                    onYearChange={setYear}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/p/payroll/custom-payslip')}
                    className="h-9 text-xs"
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    Custom Slip
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              {payslipLoading ? (
                <div className="py-16 text-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-xs text-muted-foreground">Loading employee payroll record...</p>
                </div>
              ) : payslips.length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-md border border-border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="h-10">
                          <TableHead className="text-xs font-semibold">Period</TableHead>
                          <TableHead className="text-xs font-semibold">Basic Salary</TableHead>
                          <TableHead className="text-xs font-semibold">Net Salary</TableHead>
                          <TableHead className="text-xs font-semibold">Status</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payslips.map((payslip) => (
                          <TableRow 
                            key={payslip.id}
                            className="cursor-pointer hover:bg-muted/30 transition-colors h-11"
                            onClick={() => handleSelectPayslip(payslip)}
                          >
                            <TableCell className="font-medium text-xs whitespace-nowrap">
                              {getMonthName(payslip.month)} {payslip.year}
                            </TableCell>
                            <TableCell className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                              {formatCurrency(payslip.basicSalary)}
                            </TableCell>
                            <TableCell className="text-xs tabular-nums font-semibold text-foreground whitespace-nowrap">
                              {formatCurrency(payslip.netSalary)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(payslip.status)}>
                                {payslip.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                  title="View details"
                                  onClick={() => handleSelectPayslip(payslip)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 px-2.5 text-xs"
                                  onClick={() => handleDownloadPayslip(payslip)}
                                >
                                  <Download className="h-3.5 w-3.5 mr-1" /> PDF
                                </Button>
                                {payslip.status !== 'PAID' && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDeletePayslip(payslip)}
                                  >
                                    <Trash className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                /* Pre-statistics & Attendance Preview when no payslip has been generated */
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 border border-border">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">
                        Salary Not Yet Generated for {getMonthName(month)} {year}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Attendance is verified and ready for calculation.
                      </p>
                    </div>
                    <Button 
                      onClick={handleGenerateSalary}
                      disabled={loading}
                      size="sm"
                      className="h-8 whitespace-nowrap"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Generate Salary
                    </Button>
                  </div>

                  {preStatisticsLoading ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Calculating attendance preview...
                    </div>
                  ) : preStatistics ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-card border border-border rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">Working Days</p>
                          <p className="text-xl font-semibold tabular-nums text-foreground mt-1">
                            {preStatistics.workingDays}
                          </p>
                        </div>
                        <div className="p-3 bg-card border border-border rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">Present Days</p>
                          <p className="text-xl font-semibold tabular-nums text-foreground mt-1">
                            {preStatistics.attendanceStats.presentDays}
                          </p>
                        </div>
                        <div className="p-3 bg-card border border-border rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">Half Days</p>
                          <p className="text-xl font-semibold tabular-nums text-foreground mt-1">
                            {preStatistics.attendanceStats.halfDays}
                          </p>
                        </div>
                        <div className="p-3 bg-card border border-border rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">Attendance</p>
                          <p className="text-xl font-semibold tabular-nums text-foreground mt-1">
                            {preStatistics.attendanceStats.attendancePercentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {preStatistics.leaveStats && preStatistics.leaveStats.length > 0 && (
                        <div className="rounded-lg border border-border p-4 bg-card space-y-2">
                          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Leave Breakdown
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {preStatistics.leaveStats.map((leave, idx) => {
                              const typeName = typeof leave.leaveType === 'object' && leave.leaveType !== null
                                ? (leave.leaveType as LeaveTypeInfo).name || 'Leave'
                                : (leave.leaveType as string) || 'Leave';
                              return (
                                <div key={idx} className="flex justify-between items-center text-xs py-1 px-2 rounded bg-muted/40">
                                  <span className="text-foreground">{typeName}</span>
                                  <span className="font-semibold tabular-nums">{leave.count} day(s)</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      No attendance calculation records found for this period.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payslip Detailed View Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="max-h-[90vh] bg-popover text-popover-foreground">
          <DrawerHeader className="border-b border-border pb-4">
            <DrawerTitle className="text-lg font-semibold">
              Payslip Breakdown: {selectedPayslip ? `${getMonthName(selectedPayslip.month)} ${selectedPayslip.year}` : ''}
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              Complete itemized breakdown of earnings, statutory deductions, and attendance records
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh]">
            {statisticsLoading ? (
              <div className="py-16 text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-xs text-muted-foreground">Loading payslip statistics...</p>
              </div>
            ) : payslipStatistics && selectedPayslip ? (
              <PayslipDetailedView 
                statistics={payslipStatistics} 
                payslip={selectedPayslip} 
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No detailed statistics available for this payslip.
              </div>
            )}
          </div>

          <DrawerFooter className="border-t border-border pt-4">
            <div className="flex justify-between items-center w-full">
              {selectedPayslip && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleDownloadPayslip(selectedPayslip)}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
                </Button>
              )}
              <DrawerClose asChild>
                <Button variant="secondary" size="sm">Close</Button>
              </DrawerClose>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default MainCompOfViewPayslipOfAllUsersPayroll;
