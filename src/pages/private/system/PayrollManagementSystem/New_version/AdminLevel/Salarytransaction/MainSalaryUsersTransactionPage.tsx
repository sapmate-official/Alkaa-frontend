import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts';
import { APIDictionary } from '@/services/api/v2/APIdict';
import { format } from 'date-fns';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { UserOptions } from "jspdf-autotable";

// Extend jsPDF with autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: ((options: UserOptions) => jsPDF) & {
      previous: {
        finalY: number;
      };
    };
  }
}

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Download, 
  Users, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Search,
  Check
} from 'lucide-react';
import PayrollHeader from '../../ui/PayrollHeader';
import { getStatusBadgeVariant } from '../../utils/Badgevariant';
import { cn } from '@/lib/utils';

// Types
interface User {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  department?: {
    name: string;
  };
  unpaidSalaries: number;
}

interface PayslipData {
  id: string;
  month: number;
  year: number;
  status: string;
  basicSalary: number;
  netSalary: number;
  processedAt?: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeId: string;
    department?: string;
  };
}

interface SalaryReport {
  totalEmployees: number;
  paidCount: number;
  unpaidCount: number;
  totalUnpaidAmount: number;
  paidAmount: number;
}

export const MainSalaryUsersTransactionPage: React.FC = () => {
  const { userId } = useParams();
  
  // State variables
  const [loading, setLoading] = useState({
    users: false,
    payslips: false,
    transaction: false
  });
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [payslips, setPayslips] = useState<PayslipData[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(null);
  const [report, setReport] = useState<SalaryReport | null>(null);
  
  // Transaction state
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isBulkTransactionMode, setIsBulkTransactionMode] = useState(false);
  const [selectedPayslips, setSelectedPayslips] = useState<Record<string, boolean>>({});
  const [transactions, setTransactions] = useState<Record<string, {
    transactionId: string;
    bonus: number;
    incentive: number;
    remarks: string;
  }>>({});
  
  // Bulk transaction state
  const [bulkTransactionId, setBulkTransactionId] = useState('');
  const [bulkBonus, setBulkBonus] = useState(0);
  const [bulkIncentive, setBulkIncentive] = useState(0);
  const [bulkRemarks, setBulkRemarks] = useState('');

  // Generate arrays for months and years
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
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search
  useEffect(() => {
    if (!userSearch.trim()) {
      setFilteredUsers(users);
      return;
    }
    const q = userSearch.toLowerCase();
    setFilteredUsers(
      users.filter(u => 
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.employeeId.toLowerCase().includes(q) ||
        (u.department?.name && u.department.name.toLowerCase().includes(q))
      )
    );
  }, [userSearch, users]);

  // Fetch report when month/year changes
  useEffect(() => {
    fetchReport();
    if (selectedUser) {
      fetchPayslips(selectedUser.id);
    }
  }, [selectedMonth, selectedYear]);

  // Handle URL params
  useEffect(() => {
    if (userId && users.length > 0) {
      const foundUser = users.find(u => u.id === userId);
      if (foundUser) {
        setSelectedUser(foundUser);
        fetchPayslips(foundUser.id);
      }
    }
  }, [userId, users]);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(prev => ({ ...prev, users: true }));
    try {
      const response = await axios.get(APIDictionary.user, { withCredentials: true });
      if (response.data.success) {
        const usersData = response.data.data;
        const usersWithUnpaidCount = await Promise.all(
          usersData.map(async (u: User) => {
            try {
              const payslipResponse = await axios.get(
                APIV3Dictionary.payroll.getPayslip(selectedMonth, selectedYear, u.id),
                { withCredentials: true }
              );
              
              if (payslipResponse.data.success) {
                const unpaidCount = payslipResponse.data.data.filter(
                  (p: PayslipData) => p.status === 'PENDING'
                ).length;
                return { ...u, unpaidSalaries: unpaidCount };
              }
              return { ...u, unpaidSalaries: 0 };
            } catch {
              return { ...u, unpaidSalaries: 0 };
            }
          })
        );
        
        setUsers(usersWithUnpaidCount);
        setFilteredUsers(usersWithUnpaidCount);
        
        if (usersWithUnpaidCount.length > 0 && !selectedUser) {
          setSelectedUser(usersWithUnpaidCount[0]);
          fetchPayslips(usersWithUnpaidCount[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch employees',
        variant: 'destructive'
      });
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  // Fetch payslips for a specific user
  const fetchPayslips = async (uId: string) => {
    setLoading(prev => ({ ...prev, payslips: true }));
    try {
      const response = await axios.get(
        APIV3Dictionary.payroll.getPayslip(selectedMonth, selectedYear, uId),
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setPayslips(response.data.data);
      } else {
        setPayslips([]);
      }
    } catch (error) {
      console.error('Error fetching payslips:', error);
      setPayslips([]);
    } finally {
      setLoading(prev => ({ ...prev, payslips: false }));
    }
  };

  // Fetch report data
  const fetchReport = async () => {
    try {
      const usersResponse = await axios.get(APIDictionary.user, { withCredentials: true });
      
      if (usersResponse.data.success) {
        const allUsers = usersResponse.data.data;
        let paid = 0;
        let unpaid = 0;
        let paidAmt = 0;
        let unpaidAmt = 0;
        
        await Promise.all(
          allUsers.map(async (u: User) => {
            try {
              const payslipResponse = await axios.get(
                APIV3Dictionary.payroll.getPayslip(selectedMonth, selectedYear, u.id),
                { withCredentials: true }
              );
              
              if (payslipResponse.data.success && payslipResponse.data.data.length > 0) {
                payslipResponse.data.data.forEach((p: PayslipData) => {
                  if (p.status === 'PAID') {
                    paid++;
                    paidAmt += p.netSalary;
                  } else if (p.status === 'PENDING') {
                    unpaid++;
                    unpaidAmt += p.netSalary;
                  }
                });
              }
            } catch {
              // Ignore individual user fetch error for report aggregation
            }
          })
        );
        
        setReport({
          totalEmployees: allUsers.length,
          paidCount: paid,
          unpaidCount: unpaid,
          paidAmount: paidAmt,
          totalUnpaidAmount: unpaidAmt
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const handleSelectUser = (u: User) => {
    setSelectedUser(u);
    fetchPayslips(u.id);
  };

  const handleSelectPayslip = (payslip: PayslipData) => {
    setSelectedPayslip(payslip);
    if (!transactions[payslip.id]) {
      setTransactions(prev => ({
        ...prev,
        [payslip.id]: {
          transactionId: '',
          bonus: 0,
          incentive: 0,
          remarks: ''
        }
      }));
    }
  };

  const handleTransactionInputChange = (
    payslipId: string, 
    field: 'transactionId' | 'bonus' | 'incentive' | 'remarks', 
    value: string | number
  ) => {
    setTransactions(prev => ({
      ...prev,
      [payslipId]: {
        ...prev[payslipId],
        [field]: value
      }
    }));
  };

  const processTransaction = async (payslipId: string) => {
    const transactionData = transactions[payslipId];
    if (!transactionData || !transactionData.transactionId) {
      toast({
        title: 'Error',
        description: 'Transaction ID is required',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(prev => ({ ...prev, transaction: true }));
    try {
      await axios.post(
        `${APIDictionary.payroll}/transaction/${payslipId}`,
        transactionData,
        { withCredentials: true }
      );
      
      toast({
        title: 'Success',
        description: 'Salary transaction processed successfully',
        variant: 'default'
      });
      
      setIsTransactionDialogOpen(false);
      fetchUsers();
      if (selectedUser) {
        fetchPayslips(selectedUser.id);
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to process transaction',
        variant: 'destructive'
      });
    } finally {
      setLoading(prev => ({ ...prev, transaction: false }));
    }
  };

  const processBulkTransactions = async () => {
    const selectedPayslipIds = Object.keys(selectedPayslips).filter(id => selectedPayslips[id]);
    
    if (selectedPayslipIds.length === 0) {
      toast({
        title: 'Error',
        description: 'No payslips selected',
        variant: 'destructive'
      });
      return;
    }
    
    if (!bulkTransactionId) {
      toast({
        title: 'Error',
        description: 'Transaction ID is required for bulk processing',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(prev => ({ ...prev, transaction: true }));
    try {
      for (const payslipId of selectedPayslipIds) {
        await axios.post(
          `${APIDictionary.payroll}/transaction/${payslipId}`,
          {
            transactionId: bulkTransactionId,
            bonus: bulkBonus,
            incentive: bulkIncentive,
            remarks: bulkRemarks
          },
          { withCredentials: true }
        );
      }
      
      toast({
        title: 'Success',
        description: `Processed ${selectedPayslipIds.length} transactions successfully`,
        variant: 'default'
      });
      
      fetchUsers();
      if (selectedUser) {
        fetchPayslips(selectedUser.id);
      }
      
      setIsBulkTransactionMode(false);
      setSelectedPayslips({});
      setBulkBonus(0);
      setBulkIncentive(0);
      setBulkRemarks('');
      setBulkTransactionId('');
    } catch (error) {
      console.error('Error processing bulk transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to process bulk transactions',
        variant: 'destructive'
      });
    } finally {
      setLoading(prev => ({ ...prev, transaction: false }));
    }
  };

  const downloadReport = () => {
    if (!report) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Salary Payment Report", 105, 20, { align: "center" });
    
    doc.setFontSize(11);
    doc.text(
      `Period: ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`,
      105, 28, { align: "center" }
    );
    doc.text(
      `Generated on: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`,
      105, 35, { align: "center" }
    );
    
    doc.autoTable({
      startY: 45,
      head: [["Metric", "Value"]],
      body: [
        ["Total Employees", report.totalEmployees.toString()],
        ["Paid Salaries", report.paidCount.toString()],
        ["Unpaid Salaries", report.unpaidCount.toString()],
        ["Total Paid Amount", `₹${report.paidAmount.toLocaleString('en-IN')}`],
        ["Total Unpaid Amount", `₹${report.totalUnpaidAmount.toLocaleString('en-IN')}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], textColor: 255 }
    });
    
    doc.save(`Salary_Report_${selectedMonth}_${selectedYear}.pdf`);
    toast({
      title: "Success",
      description: "Report downloaded successfully",
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      <PayrollHeader 
        title="Salary Transactions" 
        description="Process salary disbursements, manage bulk bank transfers, and download reconciliation reports"
        activeTab="admin-transaction"
      />

      {/* Payment Overview Card with KPIs */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold">Payment Overview</CardTitle>
              <CardDescription className="text-xs">
                Summary for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(val) => setSelectedMonth(parseInt(val))}
              >
                <SelectTrigger className="w-[125px] h-9 text-xs">
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
          {report ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Employees */}
              <div className="p-4 rounded-lg bg-card border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Total Headcount
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-foreground mt-1">
                    {report.totalEmployees}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Eligible organization members</p>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Paid Salaries */}
              <div className="p-4 rounded-lg bg-card border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Disbursed Salaries
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-foreground mt-1">
                    {report.paidCount}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                      {formatCurrency(report.paidAmount)}
                    </span>
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Unpaid Salaries */}
              <div className="p-4 rounded-lg bg-card border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Pending Disbursement
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-foreground mt-1">
                    {report.unpaidCount}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500 inline-block"></span>
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                      {formatCurrency(report.totalUnpaidAmount)}
                    </span>
                  </div>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          ) : (
            <div className="py-8 flex justify-center items-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 sm:p-5 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadReport} 
            disabled={!report}
            className="h-8 text-xs w-full sm:w-auto"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Download Summary PDF
          </Button>

          <Button
            size="sm"
            variant={isBulkTransactionMode ? "secondary" : "default"}
            onClick={() => setIsBulkTransactionMode(!isBulkTransactionMode)}
            className="h-8 text-xs w-full sm:w-auto"
          >
            <CreditCard className="mr-1.5 h-3.5 w-3.5" />
            {isBulkTransactionMode ? "Exit Bulk Mode" : "Process Bulk Payments"}
          </Button>
        </CardFooter>
      </Card>

      {/* Main Content Area */}
      {isBulkTransactionMode ? (
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-border">
            <CardTitle className="text-base font-semibold">Bulk Payment Batch</CardTitle>
            <CardDescription className="text-xs">
              Select multiple pending payslips to record bank transaction references in one step
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Batch Transaction Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Bank Transaction Reference *</label>
                  <Input 
                    placeholder="e.g. UTR / NEFT / IMPS reference"
                    value={bulkTransactionId}
                    onChange={(e) => setBulkTransactionId(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Bonus Addition (₹)</label>
                  <Input 
                    type="number"
                    min="0"
                    placeholder="0"
                    value={bulkBonus || ''}
                    onChange={(e) => setBulkBonus(parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Incentive Addition (₹)</label>
                  <Input 
                    type="number"
                    min="0"
                    placeholder="0"
                    value={bulkIncentive || ''}
                    onChange={(e) => setBulkIncentive(parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-xs font-medium text-foreground">Remarks (Optional)</label>
                  <Textarea 
                    placeholder="Audit notes or disbursement remarks"
                    value={bulkRemarks}
                    onChange={(e) => setBulkRemarks(e.target.value)}
                    className="text-xs min-h-[60px]"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="h-10">
                    <TableHead className="w-12 text-center">Select</TableHead>
                    <TableHead className="text-xs font-semibold">Employee</TableHead>
                    <TableHead className="text-xs font-semibold">ID</TableHead>
                    <TableHead className="text-xs font-semibold">Department</TableHead>
                    <TableHead className="text-xs font-semibold">Net Salary</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips.filter(p => p.status === 'PENDING').length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                        No pending payslips available for this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payslips.filter(p => p.status === 'PENDING').map((p) => (
                      <TableRow key={p.id} className="h-11">
                        <TableCell className="text-center">
                          <Checkbox
                            checked={!!selectedPayslips[p.id]}
                            onCheckedChange={(checked) => {
                              setSelectedPayslips(prev => ({
                                ...prev,
                                [p.id]: !!checked
                              }));
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {p.employee.firstName} {p.employee.lastName}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.employee.employeeId}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.employee.department || 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs font-semibold tabular-nums">
                          {formatCurrency(p.netSalary)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="warning">{p.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-5 border-t border-border flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsBulkTransactionMode(false)}>
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={processBulkTransactions}
              disabled={loading.transaction || Object.values(selectedPayslips).filter(Boolean).length === 0}
            >
              {loading.transaction && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Disburse Selected ({Object.values(selectedPayslips).filter(Boolean).length})
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Searchable Employee List */}
          <div className="lg:col-span-4">
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 border-b border-border space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Employees</CardTitle>
                  <span className="text-xs text-muted-foreground">{filteredUsers.length} total</span>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Search employee..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[460px]">
                  {loading.users ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3, 4].map(n => (
                        <div key={n} className="h-12 bg-muted/40 animate-pulse rounded" />
                      ))}
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No employees found
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {filteredUsers.map((u) => {
                        const isSelected = selectedUser?.id === u.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => handleSelectUser(u)}
                            className={cn(
                              'w-full p-3 text-left transition-colors flex items-center justify-between',
                              isSelected
                                ? 'bg-secondary/80 font-medium'
                                : 'hover:bg-muted/40'
                            )}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-medium text-foreground truncate">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {u.employeeId} • {u.department?.name || 'General'}
                              </p>
                            </div>
                            {u.unpaidSalaries > 0 && (
                              <Badge variant="warning" className="text-[10px] px-1.5 py-0 h-4">
                                {u.unpaidSalaries} Unpaid
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: User Payslips */}
          <div className="lg:col-span-8">
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 sm:p-5 border-b border-border">
                <CardTitle className="text-base font-semibold">
                  {selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}'s Record` : 'Select an Employee'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedUser
                    ? `Pending and past salary records for ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                    : 'Choose an employee from the left panel'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {selectedUser ? (
                  loading.payslips ? (
                    <div className="py-16 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                    </div>
                  ) : payslips.length > 0 ? (
                    <div className="rounded-md border border-border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/40">
                          <TableRow className="h-10">
                            <TableHead className="text-xs font-semibold">Period</TableHead>
                            <TableHead className="text-xs font-semibold">Basic Salary</TableHead>
                            <TableHead className="text-xs font-semibold">Net Salary</TableHead>
                            <TableHead className="text-xs font-semibold">Status</TableHead>
                            <TableHead className="text-xs font-semibold text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payslips.map((p) => (
                            <TableRow key={p.id} className="h-11">
                              <TableCell className="text-xs font-medium">
                                {months.find(m => m.value === p.month)?.label} {p.year}
                              </TableCell>
                              <TableCell className="text-xs tabular-nums text-muted-foreground">
                                {formatCurrency(p.basicSalary)}
                              </TableCell>
                              <TableCell className="text-xs tabular-nums font-semibold text-foreground">
                                {formatCurrency(p.netSalary)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(p.status)}>
                                  {p.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {p.status === 'PENDING' ? (
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      handleSelectPayslip(p);
                                      setIsTransactionDialogOpen(true);
                                    }}
                                  >
                                    Record Payment
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                    <Check className="h-3 w-3 text-emerald-500" /> Disbursed
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-xs text-muted-foreground">
                      No payslips found for this employee in {months.find(m => m.value === selectedMonth)?.label} {selectedYear}.
                    </div>
                  )
                ) : (
                  <div className="text-center py-12 text-xs text-muted-foreground">
                    Select an employee to inspect transactions.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Single Transaction Modal */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent className="sm:max-w-md bg-popover text-popover-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Record Salary Payment</DialogTitle>
            <DialogDescription className="text-xs">
              Provide transaction and disbursement details for this payslip
            </DialogDescription>
          </DialogHeader>

          {selectedPayslip && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee:</span>
                  <span className="font-medium text-foreground">{selectedPayslip.employee.firstName} {selectedPayslip.employee.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee ID:</span>
                  <span className="text-foreground">{selectedPayslip.employee.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Amount:</span>
                  <span className="font-semibold text-foreground tabular-nums">{formatCurrency(selectedPayslip.netSalary)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Transaction ID / UTR *</label>
                <Input 
                  placeholder="Enter bank transaction reference"
                  value={transactions[selectedPayslip.id]?.transactionId || ''}
                  onChange={(e) => handleTransactionInputChange(selectedPayslip.id, 'transactionId', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Bonus (₹)</label>
                  <Input 
                    type="number"
                    min="0"
                    placeholder="0"
                    value={transactions[selectedPayslip.id]?.bonus || ''}
                    onChange={(e) => handleTransactionInputChange(selectedPayslip.id, 'bonus', parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Incentive (₹)</label>
                  <Input 
                    type="number"
                    min="0"
                    placeholder="0"
                    value={transactions[selectedPayslip.id]?.incentive || ''}
                    onChange={(e) => handleTransactionInputChange(selectedPayslip.id, 'incentive', parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Remarks</label>
                <Textarea 
                  placeholder="Optional disbursement remarks"
                  value={transactions[selectedPayslip.id]?.remarks || ''}
                  onChange={(e) => handleTransactionInputChange(selectedPayslip.id, 'remarks', e.target.value)}
                  className="text-xs min-h-[60px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsTransactionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              size="sm"
              disabled={loading.transaction || !selectedPayslip || !transactions[selectedPayslip?.id]?.transactionId}
              onClick={() => selectedPayslip && processTransaction(selectedPayslip.id)}
            >
              {loading.transaction && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MainSalaryUsersTransactionPage;
