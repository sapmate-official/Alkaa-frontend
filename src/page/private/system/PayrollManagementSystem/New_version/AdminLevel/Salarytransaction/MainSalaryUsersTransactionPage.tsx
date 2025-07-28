import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { APIV3Dictionary } from '@/api/v3/Api3Dicts';
import { APIDictionary } from '@/api/v2/APIdict';
import { useAuth } from '@/services/AuthContext';
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
import { toast } from '@/hooks/use-toast';
import { Loader2, Download, DollarSign, FileText, Users, CreditCard } from 'lucide-react';

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

const MainSalaryUsersTransactionPage: React.FC = () => {
  const { user } = useAuth();
  console.log("Hello world")
  const { userId, payrollId } = useParams();
  
  // State variables
  const [loading, setLoading] = useState({
    users: false,
    payslips: false,
    transaction: false
  });
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [payslips, setPayslips] = useState<PayslipData[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(null);
  const [report, setReport] = useState<SalaryReport | null>(null);
  
  // Transaction state
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isBulkTransactionMode, setIsBulkTransactionMode] = useState(false);
  const [transactions, setTransactions] = useState<{
    [payslipId: string]: {
      transactionId: string;
      incentive: number;
      bonus: number;
      remarks: string;
    }
  }>({});
  const [selectedPayslips, setSelectedPayslips] = useState<{[id: string]: boolean}>({});
  
  // Bonus/incentive for all
  const [bulkBonus, setBulkBonus] = useState<number>(0);
  const [bulkIncentive, setBulkIncentive] = useState<number>(0);
  const [bulkRemarks, setBulkRemarks] = useState<string>('');
  const [bulkTransactionId, setBulkTransactionId] = useState<string>('');
  
  // Current date
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  // Generate dropdown options
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
  
  // Generate last 5 years for dropdown
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Effect for loading initial data based on route params
  useEffect(() => {
    if (userId && payrollId) {
      // Mode 1: Single user and payroll details
      fetchSinglePayroll(userId, payrollId);
    } else {
      // Mode 2: List of users
      fetchUsers();
    }
  }, [userId, payrollId]);
  
  // Effect for fetching payslips when user, month or year changes
  useEffect(() => {
    if (selectedUser) {
      fetchPayslips(selectedUser.id);
    }
  }, [selectedUser, selectedMonth, selectedYear]);

  // Generate report when users or selected period changes
  useEffect(() => {
    if (users.length > 0) {
      generateReport();
    }
  }, [users, payslips, selectedMonth, selectedYear]);

  // Fetch list of all users
  const fetchUsers = async () => {
    try {
      setLoading(prev => ({ ...prev, users: true }));
      
      const response = await axios.get(
        `${APIDictionary.payroll}/admin/all-employees/${user?.orgId}`, 
        { withCredentials: true }
      );
      
      if (response.data && response.data.employeePayrollData) {
        const userData = response.data.employeePayrollData.map((item: any) => ({
          id: item.employee.id,
          firstName: item.employee.name.split(' ')[0],
          lastName: item.employee.name.split(' ').slice(1).join(' '),
          employeeId: item.employee.employeeId,
          department: item.employee.department,
          unpaidSalaries: item.salaryRecords.filter((rec: any) => 
            rec.status === 'PENDING' && rec.month === selectedMonth && rec.year === selectedYear
          ).length
        }));
        
        setUsers(userData);
        
        // If we have users and no selected user, select the first one
        if (userData.length > 0 && !selectedUser) {
          setSelectedUser(userData[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user list',
        variant: 'destructive'
      });
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };
  
  // Fetch payslips for a specific user
  const fetchPayslips = async (userId: string) => {
    try {
      setLoading(prev => ({ ...prev, payslips: true }));
      
      const response = await axios.get(
        APIV3Dictionary.payroll.getPayslip(selectedMonth, selectedYear, userId),
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setPayslips(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching payslips:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payslip data',
        variant: 'destructive'
      });
    } finally {
      setLoading(prev => ({ ...prev, payslips: false }));
    }
  };
  
  // Fetch single payroll details
  const fetchSinglePayroll = async (userId: string, payrollId: string) => {
    try {
      setLoading(prev => ({ ...prev, payslips: true }));
      
      // Fetch user info
      const userResponse = await axios.get(
        `${APIDictionary.user}/${userId}`,
        { withCredentials: true }
      );
      
      if (userResponse.data) {
        const userData = {
          id: userResponse.data.id,
          firstName: userResponse.data.firstName,
          lastName: userResponse.data.lastName,
          employeeId: userResponse.data.employeeId,
          department: userResponse.data.department?.name,
          unpaidSalaries: 1 // We'll assume 1 since we're looking at a specific payroll
        };
        
        setSelectedUser(userData);
      }
      
      // Fetch payroll info
      const payrollResponse = await axios.get(
        APIV3Dictionary.payroll.getStatistics(payrollId),
        { withCredentials: true }
      );
      
      if (payrollResponse.data.success) {
        const payslipData = {
          id: payrollId,
          month: payrollResponse.data.data.basicInfo.month,
          year: payrollResponse.data.data.basicInfo.year,
          status: payrollResponse.data.data.basicInfo.status,
          basicSalary: payrollResponse.data.data.salaryComponents.basic,
          netSalary: payrollResponse.data.data.salaryComponents.net,
          processedAt: payrollResponse.data.data.basicInfo.processedAt,
          employee: {
            firstName: userResponse.data.firstName,
            lastName: userResponse.data.lastName,
            employeeId: userResponse.data.employeeId,
            department: userResponse.data.department?.name
          }
        };
        
        setSelectedPayslip(payslipData);
        setPayslips([payslipData]);
        setSelectedMonth(payslipData.month);
        setSelectedYear(payslipData.year);
      }
    } catch (error) {
      console.error('Error fetching payroll details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payroll details',
        variant: 'destructive'
      });
    } finally {
      setLoading(prev => ({ ...prev, payslips: false }));
    }
  };
  
  // Generate a report for current month/year
  const generateReport = () => {
    if (!users.length) return;
    
    // Count total paid/unpaid salaries and amounts
    let unpaidCount = 0;
    let paidCount = 0;
    let totalUnpaidAmount = 0;
    let paidAmount = 0;
    
    users.forEach(user => {
      const userPayslips = payslips.filter(p => 
        p.employee.employeeId === user.employeeId
      );
      
      userPayslips.forEach(payslip => {
        if (payslip.status === 'PAID') {
          paidCount++;
          paidAmount += payslip.netSalary;
        } else {
          unpaidCount++;
          totalUnpaidAmount += payslip.netSalary;
        }
      });
    });
    
    setReport({
      totalEmployees: users.length,
      paidCount,
      unpaidCount,
      totalUnpaidAmount,
      paidAmount
    });
  };
  
  // Handle user selection
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSelectedPayslip(null);
  };
  
  // Handle payslip selection
  const handleSelectPayslip = (payslip: PayslipData) => {
    setSelectedPayslip(payslip);
    
    // Initialize transaction form for this payslip
    setTransactions(prev => ({
      ...prev,
      [payslip.id]: {
        transactionId: '',
        incentive: 0,
        bonus: 0,
        remarks: ''
      }
    }));
  };
  
  // Handle transaction input change
  const handleTransactionInputChange = (
    payslipId: string,
    field: 'transactionId' | 'incentive' | 'bonus' | 'remarks',
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
  
  // Process transaction for a single payslip
  const processTransaction = async (payslipId: string) => {
    if (!transactions[payslipId]) return;
    
    const { transactionId, incentive, bonus, remarks } = transactions[payslipId];
    
    if (!transactionId.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a transaction ID',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, transaction: true }));
      
      await axios.post(
        `${APIDictionary.payroll}/complete-transaction`,
        {
          salaryRecordId: payslipId,
          transactionId,
          mode: 'BANK_TRANSFER',
          incentive: parseFloat(incentive.toString()) || 0,
          bonus: parseFloat(bonus.toString()) || 0,
          remarks
        },
        { withCredentials: true }
      );
      
      toast({
        title: 'Success',
        description: 'Transaction completed successfully',
        variant: 'default'
      });
      
      // Refresh data
      if (selectedUser) {
        fetchPayslips(selectedUser.id);
      }
      fetchUsers();
      setIsTransactionDialogOpen(false);
      
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
  
  // Process bulk transactions
  const processBulkTransactions = async () => {
    if (!bulkTransactionId.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a transaction ID',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, transaction: true }));
      
      const selectedPayslipIds = Object.entries(selectedPayslips)
        .filter(([_, isSelected]) => isSelected)
        .map(([id, _]) => id);
      
      if (selectedPayslipIds.length === 0) {
        toast({
          title: 'No Payslips Selected',
          description: 'Please select at least one payslip to process',
          variant: 'destructive'
        });
        return;
      }
      
      // Process each selected payslip
      for (const payslipId of selectedPayslipIds) {
        await axios.post(
          `${APIDictionary.payroll}/complete-transaction`,
          {
            salaryRecordId: payslipId,
            transactionId: bulkTransactionId,
            mode: 'BANK_TRANSFER',
            incentive: bulkIncentive || 0,
            bonus: bulkBonus || 0,
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
      
      // Refresh data
      fetchUsers();
      if (selectedUser) {
        fetchPayslips(selectedUser.id);
      }
      
      // Reset form
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
        description: 'Failed to process transactions',
        variant: 'destructive'
      });
    } finally {
      setLoading(prev => ({ ...prev, transaction: false }));
    }
  };
  
  // Download report as PDF
  const downloadReport = () => {
    if (!report) return;
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text("Salary Payment Report", 105, 20, { align: "center" });
    
    // Add report period
    doc.setFontSize(12);
    doc.text(
      `Period: ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`,
      105, 30, { align: "center" }
    );
    
    // Add report generation date
    doc.setFontSize(10);
    doc.text(
      `Generated on: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`,
      105, 40, { align: "center" }
    );
    
    // Add summary table
    doc.setFontSize(14);
    doc.text("Payment Summary", 20, 60);
    
    // @ts-ignore - jsPDF-autotable extension
    doc.autoTable({
      startY: 65,
      head: [["Description", "Value"]],
      body: [
        ["Total Employees", report.totalEmployees.toString()],
        ["Paid Salaries", report.paidCount.toString()],
        ["Unpaid Salaries", report.unpaidCount.toString()],
        ["Total Paid Amount", `₹${report.paidAmount.toLocaleString('en-IN')}`],
        ["Total Unpaid Amount", `₹${report.totalUnpaidAmount.toLocaleString('en-IN')}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    // Add employees table if we have unpaid salaries
    if (report.unpaidCount > 0) {
      doc.setFontSize(14);
      doc.text("Employees with Unpaid Salaries", 20, doc.autoTable.previous.finalY + 20);
      
      const unpaidUsers = users.filter(user => user.unpaidSalaries > 0);
      
      // @ts-ignore - jsPDF-autotable extension
      doc.autoTable({
        startY: doc.autoTable.previous.finalY + 25,
        head: [["Employee ID", "Name", "Department", "Unpaid Salaries"]],
        body: unpaidUsers.map(user => [
          user.employeeId,
          `${user.firstName} ${user.lastName}`,
          user.department?.name || 'N/A',
          user.unpaidSalaries.toString()
        ]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
      });
    }
    
    // Add footer
    doc.setFontSize(10);
    doc.text(
      "This is a computer-generated document.",
      105, 280, { align: "center" }
    );
    
    // Save the PDF
    doc.save(`Salary_Report_${selectedMonth}_${selectedYear}.pdf`);
    
    toast({
      title: "Success",
      description: "Report downloaded successfully",
      variant: "default"
    });
  };
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'PAID':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <h1 className="text-3xl font-bold">Salary Transaction Management</h1>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Top section with month/year selection and report */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Payment Overview</CardTitle>
              <div className="flex gap-2">
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Year" />
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
            <CardDescription>
              Salary payment summary for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {report ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Employees</p>
                        <h3 className="text-2xl font-bold">{report.totalEmployees}</h3>
                      </div>
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Unpaid Salaries</p>
                        <h3 className="text-2xl font-bold">{report.unpaidCount}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatCurrency(report.totalUnpaidAmount)}
                        </p>
                      </div>
                      <FileText className="h-8 w-8 text-amber-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Paid Salaries</p>
                        <h3 className="text-2xl font-bold">{report.paidCount}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatCurrency(report.paidAmount)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={downloadReport} disabled={!report}>
              <Download className="mr-2 h-4 w-4" /> Download Report
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant={isBulkTransactionMode ? "default" : "outline"}
                onClick={() => setIsBulkTransactionMode(!isBulkTransactionMode)}
              >
                <CreditCard className="mr-2 h-4 w-4" /> 
                {isBulkTransactionMode ? "Cancel Bulk Payment" : "Make Bulk Payment"}
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        {/* Main content - List of users and their payslips */}
        {isBulkTransactionMode ? (
          <Card>
            <CardHeader>
              <CardTitle>Bulk Payment Processing</CardTitle>
              <CardDescription>
                Select payslips to process together with the same transaction details
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-2">Transaction Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Transaction ID</label>
                      <Input 
                        type="text" 
                        placeholder="Enter bank transaction reference"
                        value={bulkTransactionId}
                        onChange={(e) => setBulkTransactionId(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Apply to all selected payslips:</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-muted-foreground">Bonus (₹)</label>
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="0"
                            value={bulkBonus || ''}
                            onChange={(e) => setBulkBonus(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm text-muted-foreground">Incentive (₹)</label>
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="0"
                            value={bulkIncentive || ''}
                            onChange={(e) => setBulkIncentive(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Remarks</label>
                      <Textarea 
                        placeholder="Optional remarks for this transaction"
                        value={bulkRemarks}
                        onChange={(e) => setBulkRemarks(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Select Payslips</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Emp. ID</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payslips.filter(p => p.status === 'PENDING').map((payslip) => (
                        <TableRow key={payslip.id}>
                          <TableCell>
                            <Checkbox
                              checked={!!selectedPayslips[payslip.id]}
                              onCheckedChange={(checked) => {
                                setSelectedPayslips(prev => ({
                                  ...prev,
                                  [payslip.id]: !!checked
                                }));
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {payslip.employee.firstName} {payslip.employee.lastName}
                          </TableCell>
                          <TableCell>{payslip.employee.employeeId}</TableCell>
                          <TableCell>{payslip.employee.department || 'N/A'}</TableCell>
                          <TableCell>{months.find(m => m.value === payslip.month)?.label} {payslip.year}</TableCell>
                          <TableCell>{formatCurrency(payslip.netSalary)}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(payslip.status)}>
                              {payslip.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsBulkTransactionMode(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={processBulkTransactions} 
                  disabled={loading.transaction || Object.values(selectedPayslips).filter(Boolean).length === 0}
                >
                  {loading.transaction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Process Payments
                </Button>
              </div>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Employees</CardTitle>
                <CardDescription>
                  Select an employee to view their payslips
                </CardDescription>
              </CardHeader>
              
              <CardContent className="h-[500px] overflow-auto">
                {loading.users ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <Card
                        key={user.id}
                        className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                          selectedUser?.id === user.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => handleSelectUser(user)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {user.employeeId} • {user.department?.name || 'N/A'}
                            </p>
                          </div>
                          {user.unpaidSalaries > 0 && (
                            <Badge variant="secondary">{user.unpaidSalaries} Unpaid</Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedUser ? `${selectedUser.firstName}'s Payslips` : 'Select an Employee'}
                </CardTitle>
                <CardDescription>
                  {selectedUser
                    ? `Showing payslips for ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                    : 'Select an employee from the list to view their payslips'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {selectedUser ? (
                  loading.payslips ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : payslips.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Basic Salary</TableHead>
                          <TableHead>Net Salary</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payslips.map((payslip) => (
                          <TableRow key={payslip.id} className="cursor-pointer hover:bg-muted">
                            <TableCell onClick={() => handleSelectPayslip(payslip)}>
                              {months.find(m => m.value === payslip.month)?.label} {payslip.year}
                            </TableCell>
                            <TableCell onClick={() => handleSelectPayslip(payslip)}>
                              {formatCurrency(payslip.basicSalary)}
                            </TableCell>
                            <TableCell onClick={() => handleSelectPayslip(payslip)}>
                              {formatCurrency(payslip.netSalary)}
                            </TableCell>
                            <TableCell onClick={() => handleSelectPayslip(payslip)}>
                              <Badge variant={getStatusBadgeVariant(payslip.status)}>
                                {payslip.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {payslip.status === 'PENDING' && (
                                <Button 
                                  size="sm"
                                  onClick={() => {
                                    handleSelectPayslip(payslip);
                                    setIsTransactionDialogOpen(true);
                                  }}
                                >
                                  Process
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No payslips found for this period</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Select an employee to view their payslips</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Transaction Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Salary Payment</DialogTitle>
            <DialogDescription>
              Enter the bank transaction details to mark this salary as paid
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayslip && (
            <div className="py-4 space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-medium mb-2">Payslip Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-muted-foreground">Employee:</p>
                  <p>{selectedPayslip.employee.firstName} {selectedPayslip.employee.lastName}</p>
                  <p className="text-muted-foreground">Employee ID:</p>
                  <p>{selectedPayslip.employee.employeeId}</p>
                  <p className="text-muted-foreground">Period:</p>
                  <p>{months.find(m => m.value === selectedPayslip.month)?.label} {selectedPayslip.year}</p>
                  <p className="text-muted-foreground">Net Salary:</p>
                  <p className="font-medium">{formatCurrency(selectedPayslip.netSalary)}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Transaction ID</label>
                <Input 
                  type="text" 
                  placeholder="Enter bank transaction reference"
                  value={transactions[selectedPayslip.id]?.transactionId || ''}
                  onChange={(e) => handleTransactionInputChange(
                    selectedPayslip.id,
                    'transactionId',
                    e.target.value
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bonus (₹)</label>
                  <Input 
                    type="number" 
                    min="0" 
                    placeholder="0"
                    value={transactions[selectedPayslip.id]?.bonus || ''}
                    onChange={(e) => handleTransactionInputChange(
                      selectedPayslip.id,
                      'bonus',
                      parseFloat(e.target.value) || 0
                    )}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Incentive (₹)</label>
                  <Input 
                    type="number" 
                    min="0" 
                    placeholder="0"
                    value={transactions[selectedPayslip.id]?.incentive || ''}
                    onChange={(e) => handleTransactionInputChange(
                      selectedPayslip.id,
                      'incentive',
                      parseFloat(e.target.value) || 0
                    )}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Remarks</label>
                <Textarea 
                  placeholder="Optional remarks for this transaction"
                  value={transactions[selectedPayslip.id]?.remarks || ''}
                  onChange={(e) => handleTransactionInputChange(
                    selectedPayslip.id,
                    'remarks',
                    e.target.value
                  )}
                />
              </div>
              
              <div className="bg-muted/50 p-2 rounded-md">
                <p className="text-sm">
                  <strong>Total Amount:</strong> {formatCurrency(selectedPayslip.netSalary + 
                    (parseFloat(transactions[selectedPayslip.id]?.bonus?.toString() || '0')) + 
                    (parseFloat(transactions[selectedPayslip.id]?.incentive?.toString() || '0'))
                  )}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedPayslip && processTransaction(selectedPayslip.id)}
              disabled={loading.transaction || !selectedPayslip}
            >
              {loading.transaction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Process Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MainSalaryUsersTransactionPage;