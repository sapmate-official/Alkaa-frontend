import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, FileText, Download, Eye, Loader2 } from 'lucide-react';
import PayrollHeader from '../../ui/PayrollHeader';
import { PayslipPDFGenerator, PayslipData } from '../../../../../../../utils/payslipPDFGenerator';

interface CustomPayslipFormData {
  month: number;
  year: number;
  basicSalary: number;
  netSalary: number;
  tax?: number;
  incentive?: number;
  bonus?: number;
  status?: string;
  paymentMode?: string;
  paymentRef?: string;
  remarks?: string;
  allowances: { [key: string]: number };
  deductions: { [key: string]: number };
  employee: {
    firstName: string;
    lastName: string;
    employeeId: string;
    email: string;
    department?: string;
    bankDetails?: {
      bankName: string;
      accountNumber: string;
      ifscCode: string;
    };
  };
  company: {
    name: string;
    address: string;
    email: string;
    phone: string;
  };
}

interface CustomPayslipPreview {
  employee: {
    name: string;
    employeeId: string;
    department: string;
    email?: string;
  };
  company: {
    name: string;
    address: string;
    email: string;
    phone: string;
  };
  period: string;
  summary: {
    basicSalary: number;
    totalAllowances: number;
    grossPay: number;
    totalDeductions: number;
    netSalary: number;
  };
}

export const CustomPayslipGenerator: React.FC = () => {
  const currentDate = new Date();
  const [formData, setFormData] = useState<CustomPayslipFormData>({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    basicSalary: 0,
    netSalary: 0,
    tax: 0,
    incentive: 0,
    bonus: 0,
    status: 'PAID',
    paymentMode: 'BANK_TRANSFER',
    paymentRef: '',
    remarks: '',
    allowances: {},
    deductions: {},
    employee: {
      firstName: '',
      lastName: '',
      employeeId: '',
      email: '',
      department: '',
      bankDetails: {
        bankName: '',
        accountNumber: '',
        ifscCode: '',
      },
    },
    company: {
      name: 'ALKAA Technologies',
      address: 'Corporate Headquarters',
      email: 'hr@alkaa.io',
      phone: '+91 (0) 800-000-0000',
    },
  });

  const [allowanceFields, setAllowanceFields] = useState<Array<{ key: string; value: number }>>([
    { key: 'HRA', value: 0 },
    { key: 'Special Allowance', value: 0 },
  ]);

  const [deductionFields, setDeductionFields] = useState<Array<{ key: string; value: number }>>([
    { key: 'Provident Fund (PF)', value: 0 },
    { key: 'Professional Tax', value: 0 },
  ]);

  const [previewData, setPreviewData] = useState<CustomPayslipPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    { value: 12, label: 'December' },
  ];

  const handleInputChange = (path: string, value: string | number) => {
    setFormData((prev) => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current: Record<string, unknown> = updated as unknown as Record<string, unknown>;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const handleAllowanceChange = (index: number, field: 'key' | 'value', value: string | number) => {
    const updated = [...allowanceFields];
    if (field === 'key') {
      updated[index].key = value as string;
    } else {
      updated[index].value = typeof value === 'number' ? value : parseFloat(value as string) || 0;
    }
    setAllowanceFields(updated);
  };

  const addAllowanceField = () => {
    setAllowanceFields([...allowanceFields, { key: '', value: 0 }]);
  };

  const removeAllowanceField = (index: number) => {
    setAllowanceFields(allowanceFields.filter((_, i) => i !== index));
  };

  const handleDeductionChange = (index: number, field: 'key' | 'value', value: string | number) => {
    const updated = [...deductionFields];
    if (field === 'key') {
      updated[index].key = value as string;
    } else {
      updated[index].value = typeof value === 'number' ? value : parseFloat(value as string) || 0;
    }
    setDeductionFields(updated);
  };

  const addDeductionField = () => {
    setDeductionFields([...deductionFields, { key: '', value: 0 }]);
  };

  const removeDeductionField = (index: number) => {
    setDeductionFields(deductionFields.filter((_, i) => i !== index));
  };

  const buildCleanAllowancesAndDeductions = () => {
    const allowancesObj: { [key: string]: number } = {};
    allowanceFields.forEach((item) => {
      if (item.key.trim()) allowancesObj[item.key.trim()] = item.value || 0;
    });

    const deductionsObj: { [key: string]: number } = {};
    deductionFields.forEach((item) => {
      if (item.key.trim()) deductionsObj[item.key.trim()] = item.value || 0;
    });

    return { allowancesObj, deductionsObj };
  };

  const handlePreview = () => {
    if (!formData.employee.firstName || !formData.employee.employeeId) {
      toast({
        title: 'Validation Error',
        description: 'Employee First Name and Employee ID are required',
        variant: 'destructive',
      });
      return;
    }

    const { allowancesObj, deductionsObj } = buildCleanAllowancesAndDeductions();
    const totalAllowances = Object.values(allowancesObj).reduce((a, b) => a + b, 0);
    const totalDeductions = Object.values(deductionsObj).reduce((a, b) => a + b, 0);
    const grossPay = (formData.basicSalary || 0) + totalAllowances + (formData.bonus || 0) + (formData.incentive || 0);
    const calculatedNetSalary = formData.netSalary || (grossPay - totalDeductions - (formData.tax || 0));

    const monthLabel = months.find((m) => m.value === formData.month)?.label || `Month ${formData.month}`;

    setPreviewData({
      employee: {
        name: `${formData.employee.firstName} ${formData.employee.lastName}`.trim(),
        employeeId: formData.employee.employeeId,
        department: formData.employee.department || 'General',
        email: formData.employee.email,
      },
      company: { ...formData.company },
      period: `${monthLabel} ${formData.year}`,
      summary: {
        basicSalary: formData.basicSalary || 0,
        totalAllowances,
        grossPay,
        totalDeductions: totalDeductions + (formData.tax || 0),
        netSalary: calculatedNetSalary,
      },
    });

    toast({
      title: 'Preview Calculated',
      description: 'Review the breakdown summary below before generating PDF',
    });
  };

  const handleGenerate = () => {
    if (!formData.employee.firstName || !formData.employee.employeeId) {
      toast({
        title: 'Validation Error',
        description: 'Employee First Name and Employee ID are required',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { allowancesObj, deductionsObj } = buildCleanAllowancesAndDeductions();
      const totalAllowances = Object.values(allowancesObj).reduce((a, b) => a + b, 0);
      const totalDeductions = Object.values(deductionsObj).reduce((a, b) => a + b, 0);
      const grossPay = (formData.basicSalary || 0) + totalAllowances + (formData.bonus || 0) + (formData.incentive || 0);
      const calculatedNetSalary = formData.netSalary || (grossPay - totalDeductions - (formData.tax || 0));
      const monthLabel = months.find((m) => m.value === formData.month)?.label || `Month ${formData.month}`;

      const payslipData: PayslipData = {
        month: formData.month,
        year: formData.year,
        monthName: monthLabel,
        payDate: new Date().toISOString(),
        period: `${monthLabel} ${formData.year}`,
        status: formData.status || 'PAID',
        paymentMode: formData.paymentMode || 'BANK_TRANSFER',
        paymentRef: formData.paymentRef,
        employee: {
          name: `${formData.employee.firstName} ${formData.employee.lastName}`.trim(),
          employeeId: formData.employee.employeeId,
          department: formData.employee.department || 'General',
          email: formData.employee.email,
          bankDetails: formData.employee.bankDetails,
        },
        company: { ...formData.company },
        basicSalary: formData.basicSalary || 0,
        grossPay,
        totalDeductions: totalDeductions + (formData.tax || 0),
        netSalary: calculatedNetSalary,
        earnings: {
          basicSalary: {
            description: 'Basic Salary',
            hours: 160,
            rate: Math.round((formData.basicSalary || 0) / 160),
            current: formData.basicSalary || 0,
            ytd: (formData.basicSalary || 0) * formData.month,
          },
          allowances: Object.entries(allowancesObj).map(([description, current]) => ({
            description,
            current,
            ytd: current * formData.month,
          })),
          additionalPayments: [
            ...(formData.bonus ? [{ description: 'Bonus', current: formData.bonus, ytd: formData.bonus }] : []),
            ...(formData.incentive ? [{ description: 'Incentive', current: formData.incentive, ytd: formData.incentive }] : []),
          ],
        },
        deductions: [
          ...Object.entries(deductionsObj).map(([description, current]) => ({
            description,
            current,
            ytd: current * formData.month,
          })),
          ...(formData.tax ? [{ description: 'Income Tax', current: formData.tax, ytd: formData.tax * formData.month }] : []),
        ],
        attendance: {
          workingDays: 30,
          presentDays: 30,
          halfDays: 0,
          absentDays: 0,
          paidLeaveDays: 0,
          unpaidLeaveDays: 0,
          attendancePercentage: 100,
        },
        ytd: {
          grossPay: grossPay * formData.month,
          totalDeductions: (totalDeductions + (formData.tax || 0)) * formData.month,
          netSalary: calculatedNetSalary * formData.month,
        },
      };

      PayslipPDFGenerator.generatePDF(payslipData);
      toast({
        title: 'Success',
        description: 'Custom payslip PDF generated and downloaded.',
      });
    } catch (err: unknown) {
      console.error('Payslip generation error:', err);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF document.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      <PayrollHeader
        title="Custom Payslip Generator"
        description="Craft manual, custom, or one-off formatted payslips with custom allowances and deductions"
        activeTab="custom-payslip"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Period & Payment Details */}
          <Card className="border-border shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-semibold">1. Period & Payment Details</CardTitle>
              <CardDescription className="text-xs">Specify the billing period, payment status, and bank reference</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Month</Label>
                  <Select
                    value={formData.month.toString()}
                    onValueChange={(val) => handleInputChange('month', parseInt(val))}
                  >
                    <SelectTrigger className="h-9 text-xs">
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
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Year</Label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => handleInputChange('status', val)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAID" className="text-xs">Paid</SelectItem>
                      <SelectItem value="PENDING" className="text-xs">Pending</SelectItem>
                      <SelectItem value="PROCESSING" className="text-xs">Processing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Mode</Label>
                  <Input
                    placeholder="e.g. Bank Transfer"
                    value={formData.paymentMode}
                    onChange={(e) => handleInputChange('paymentMode', e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2 md:col-span-4">
                  <Label className="text-xs">Payment Reference / UTR</Label>
                  <Input
                    placeholder="Transaction ID, UTR, or Cheque number"
                    value={formData.paymentRef}
                    onChange={(e) => handleInputChange('paymentRef', e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee Information */}
          <Card className="border-border shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-semibold">2. Employee Details</CardTitle>
              <CardDescription className="text-xs">Personal and identification data for the recipient</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">First Name *</Label>
                  <Input
                    value={formData.employee.firstName}
                    onChange={(e) => handleInputChange('employee.firstName', e.target.value)}
                    placeholder="First Name"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Last Name</Label>
                  <Input
                    value={formData.employee.lastName}
                    onChange={(e) => handleInputChange('employee.lastName', e.target.value)}
                    placeholder="Last Name"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Employee ID *</Label>
                  <Input
                    value={formData.employee.employeeId}
                    onChange={(e) => handleInputChange('employee.employeeId', e.target.value)}
                    placeholder="EMP001"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Department</Label>
                  <Input
                    value={formData.employee.department}
                    onChange={(e) => handleInputChange('employee.department', e.target.value)}
                    placeholder="e.g. Engineering, Sales"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={formData.employee.email}
                    onChange={(e) => handleInputChange('employee.email', e.target.value)}
                    placeholder="employee@company.com"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salary, Allowances & Deductions */}
          <Card className="border-border shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-semibold">3. Compensation Breakdown</CardTitle>
              <CardDescription className="text-xs">Basic wage, custom earnings, and statutory deductions</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Basic Salary (₹) *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.basicSalary || ''}
                    onChange={(e) => handleInputChange('basicSalary', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Bonus (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.bonus || ''}
                    onChange={(e) => handleInputChange('bonus', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Incentive (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.incentive || ''}
                    onChange={(e) => handleInputChange('incentive', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Tax Deduction (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.tax || ''}
                    onChange={(e) => handleInputChange('tax', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Allowances List */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Allowances & Perks
                  </Label>
                  <Button variant="outline" size="sm" onClick={addAllowanceField} className="h-7 text-xs">
                    <Plus className="mr-1 h-3 w-3" /> Add Item
                  </Button>
                </div>

                <div className="space-y-2">
                  {allowanceFields.map((allowance, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Allowance title (e.g. HRA, Travel)"
                        value={allowance.key}
                        onChange={(e) => handleAllowanceChange(index, 'key', e.target.value)}
                        className="h-8 text-xs flex-1"
                      />
                      <Input
                        type="number"
                        min="0"
                        placeholder="Amount"
                        value={allowance.value || ''}
                        onChange={(e) => handleAllowanceChange(index, 'value', e.target.value)}
                        className="h-8 text-xs w-32 tabular-nums"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAllowanceField(index)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deductions List */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Deductions
                  </Label>
                  <Button variant="outline" size="sm" onClick={addDeductionField} className="h-7 text-xs">
                    <Plus className="mr-1 h-3 w-3" /> Add Item
                  </Button>
                </div>

                <div className="space-y-2">
                  {deductionFields.map((deduction, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Deduction title (e.g. PF, ESI, Loan)"
                        value={deduction.key}
                        onChange={(e) => handleDeductionChange(index, 'key', e.target.value)}
                        className="h-8 text-xs flex-1"
                      />
                      <Input
                        type="number"
                        min="0"
                        placeholder="Amount"
                        value={deduction.value || ''}
                        onChange={(e) => handleDeductionChange(index, 'value', e.target.value)}
                        className="h-8 text-xs w-32 tabular-nums"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDeductionField(index)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border">
                <Label className="text-xs">Remarks / Notes</Label>
                <Textarea
                  placeholder="Additional notes or statutory notices displayed on the slip..."
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  className="text-xs min-h-[60px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Preview & Document Generator */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border shadow-xs sticky top-4">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Payslip Summary
              </CardTitle>
              <CardDescription className="text-xs">Preview calculation and export ready PDF</CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4">
              {previewData ? (
                <div className="space-y-4">
                  <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Employee:</span>
                      <span className="font-semibold text-foreground">{previewData.employee.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="text-foreground">{previewData.employee.employeeId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Period:</span>
                      <span className="text-foreground">{previewData.period}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Basic Pay:</span>
                      <span className="tabular-nums font-medium text-foreground">₹{previewData.summary.basicSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Allowances & Extras:</span>
                      <span className="tabular-nums font-medium text-foreground">₹{previewData.summary.totalAllowances.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross Earnings:</span>
                      <span className="tabular-nums font-medium text-foreground">₹{previewData.summary.grossPay.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Deductions:</span>
                      <span className="tabular-nums font-medium text-muted-foreground">-₹{previewData.summary.totalDeductions.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-border flex justify-between items-center">
                      <span className="font-semibold text-foreground">Net Pay:</span>
                      <span className="text-base font-bold tabular-nums text-foreground">
                        ₹{previewData.summary.netSalary.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  Fill in the employee and salary fields, then click &ldquo;Recalculate Summary&rdquo; to preview.
                </div>
              )}
            </CardContent>

            <CardFooter className="p-4 sm:p-5 border-t border-border flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                className="w-full h-8 text-xs"
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" /> Recalculate Summary
              </Button>

              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full h-8 text-xs"
              >
                {isLoading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                )}
                Generate &amp; Download PDF
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomPayslipGenerator;
