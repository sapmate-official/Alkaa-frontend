import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PayslipPDFGenerator, PayslipData } from '../../../../../../../utils/payslipPDFGenerator';

interface CustomPayslipData {
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

export const CustomPayslipGenerator: React.FC = () => {
  const [formData, setFormData] = useState<CustomPayslipData>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 0,
    netSalary: 0,
    tax: 0,
    incentive: 0,
    bonus: 0,
    status: 'PAID',
    paymentMode: 'MANUAL',
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
    },
    company: {
      name: '',
      address: '',
      email: '',
      phone: '',
    },
  });

  const [allowanceFields, setAllowanceFields] = useState<{ key: string; value: number }[]>([
    { key: '', value: 0 },
  ]);

  const [deductionFields, setDeductionFields] = useState<{ key: string; value: number }[]>([
    { key: '', value: 0 },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: any) => {
    const fields = field.split('.');
    if (fields.length === 1) {
      setFormData({ ...formData, [field]: value });
    } else if (fields.length === 2) {
      setFormData({
        ...formData,
        [fields[0]]: {
          ...(formData[fields[0] as keyof CustomPayslipData] as any),
          [fields[1]]: value,
        },
      });
    } else if (fields.length === 3) {
      setFormData({
        ...formData,
        [fields[0]]: {
          ...(formData[fields[0] as keyof CustomPayslipData] as any),
          [fields[1]]: {
            ...((formData[fields[0] as keyof CustomPayslipData] as any)[fields[1]]),
            [fields[2]]: value,
          },
        },
      });
    }
  };

  const handleAllowanceChange = (index: number, field: 'key' | 'value', value: string | number) => {
    const newAllowances = [...allowanceFields];
    if (field === 'key') {
      newAllowances[index][field] = value as string;
    } else {
      newAllowances[index][field] = value as number;
    }
    setAllowanceFields(newAllowances);

    // Update formData
    const allowancesObj: { [key: string]: number } = {};
    newAllowances.forEach((a) => {
      if (a.key) allowancesObj[a.key] = a.value;
    });
    setFormData({ ...formData, allowances: allowancesObj });
  };

  const handleDeductionChange = (index: number, field: 'key' | 'value', value: string | number) => {
    const newDeductions = [...deductionFields];
    if (field === 'key') {
      newDeductions[index][field] = value as string;
    } else {
      newDeductions[index][field] = value as number;
    }
    setDeductionFields(newDeductions);

    // Update formData
    const deductionsObj: { [key: string]: number } = {};
    newDeductions.forEach((d) => {
      if (d.key) deductionsObj[d.key] = d.value;
    });
    setFormData({ ...formData, deductions: deductionsObj });
  };

  const addAllowanceField = () => {
    setAllowanceFields([...allowanceFields, { key: '', value: 0 }]);
  };

  const removeAllowanceField = (index: number) => {
    const newAllowances = allowanceFields.filter((_, i) => i !== index);
    setAllowanceFields(newAllowances);

    const allowancesObj: { [key: string]: number } = {};
    newAllowances.forEach((a) => {
      if (a.key) allowancesObj[a.key] = a.value;
    });
    setFormData({ ...formData, allowances: allowancesObj });
  };

  const addDeductionField = () => {
    setDeductionFields([...deductionFields, { key: '', value: 0 }]);
  };

  const removeDeductionField = (index: number) => {
    const newDeductions = deductionFields.filter((_, i) => i !== index);
    setDeductionFields(newDeductions);

    const deductionsObj: { [key: string]: number } = {};
    newDeductions.forEach((d) => {
      if (d.key) deductionsObj[d.key] = d.value;
    });
    setFormData({ ...formData, deductions: deductionsObj });
  };

  const handlePreview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Client-side validation and preview
      if (!formData.employee.firstName) {
        throw new Error('Employee first name is required');
      }
      if (!formData.employee.employeeId) {
        throw new Error('Employee ID is required');
      }
      if (!formData.company.name) {
        throw new Error('Company name is required');
      }
      if (!formData.netSalary) {
        throw new Error('Net salary is required');
      }

      // Calculate totals
      const totalAllowances = Object.values(formData.allowances).reduce((sum, val) => sum + val, 0);
      const totalDeductions = Object.values(formData.deductions).reduce((sum, val) => sum + val, 0);
      const grossPay = formData.basicSalary + totalAllowances + (formData.incentive || 0) + (formData.bonus || 0);

      // Set local preview data
      setPreviewData({
        employee: {
          name: `${formData.employee.firstName} ${formData.employee.lastName}`.trim(),
          employeeId: formData.employee.employeeId,
          department: formData.employee.department || 'N/A',
        },
        company: formData.company,
        period: `${new Date(formData.year, formData.month - 1).toLocaleString('default', { month: 'long' })} ${formData.year}`,
        summary: {
          basicSalary: formData.basicSalary,
          totalAllowances,
          grossPay,
          totalDeductions: totalDeductions + (formData.tax || 0),
          netSalary: formData.netSalary,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Error generating preview');
      console.error('Preview error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.employee.firstName) {
        throw new Error('Employee first name is required');
      }
      if (!formData.employee.employeeId) {
        throw new Error('Employee ID is required');
      }
      if (!formData.company.name) {
        throw new Error('Company name is required');
      }
      if (!formData.netSalary) {
        throw new Error('Net salary is required');
      }

      // Calculate totals
      const totalAllowances = Object.values(formData.allowances).reduce((sum, val) => sum + val, 0);
      const totalDeductions = Object.values(formData.deductions).reduce((sum, val) => sum + val, 0);
      const grossPay = formData.basicSalary + totalAllowances + (formData.incentive || 0) + (formData.bonus || 0);

      // Transform to PayslipData format for client-side PDF generation
      const payslipData: PayslipData = {
        month: formData.month,
        year: formData.year,
        monthName: new Date(formData.year, formData.month - 1).toLocaleString('default', { month: 'long' }),
        payDate: new Date(formData.year, formData.month , 1).toLocaleDateString('en-GB'),
        period: `M${formData.month.toString().padStart(2, '0')}${formData.year}`,
        status: formData.status || 'PAID',
        paymentMode: formData.paymentMode || 'MANUAL',
        paymentRef: formData.paymentRef || `CUSTOM${Date.now()}`,
        
        employee: {
          name: `${formData.employee.firstName} ${formData.employee.lastName}`.trim(),
          employeeId: formData.employee.employeeId,
          department: formData.employee.department || 'N/A',
          email: formData.employee.email,
          bankDetails: formData.employee.bankDetails,
        },
        
        company: formData.company,
        
        basicSalary: formData.basicSalary,
        grossPay: grossPay,
        totalDeductions: totalDeductions + (formData.tax || 0),
        netSalary: formData.netSalary,
        
        earnings: {
          basicSalary: {
            description: 'Basic Salary',
            hours: 30,
            rate: formData.basicSalary / 30,
            current: formData.basicSalary,
            ytd: formData.basicSalary * formData.month,
          },
          allowances: Object.entries(formData.allowances).map(([key, value]) => ({
            description: key.toUpperCase(),
            current: value,
            ytd: value * formData.month,
          })),
          additionalPayments: [
            ...(formData.incentive ? [{
              description: 'Incentive',
              current: formData.incentive,
              ytd: formData.incentive * formData.month,
            }] : []),
            ...(formData.bonus ? [{
              description: 'Bonus',
              current: formData.bonus,
              ytd: formData.bonus * formData.month,
            }] : []),
          ],
        },
        
        deductions: [
          ...Object.entries(formData.deductions).map(([key, value]) => ({
            description: key.toUpperCase(),
            current: value,
            ytd: value * formData.month,
          })),
          ...(formData.tax ? [{
            description: 'Tax',
            current: formData.tax,
            ytd: formData.tax * formData.month,
          }] : []),
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
          netSalary: formData.netSalary * formData.month,
        },
      };

      // Generate PDF using client-side generator
      PayslipPDFGenerator.generatePDF(payslipData);

      alert('Payslip generated successfully!');
    } catch (err: any) {
      setError(err.message || 'Error generating payslip');
      console.error('Generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-800">Custom Payslip Generator</h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 max-w-6xl mx-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Period Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={formData.month}
                onChange={(e) => handleInputChange('month', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
            <input
              type="text"
              value={formData.paymentMode}
              onChange={(e) => handleInputChange('paymentMode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., BANK_TRANSFER, CASH, CHEQUE"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference</label>
            <input
              type="text"
              value={formData.paymentRef}
              onChange={(e) => handleInputChange('paymentRef', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Transaction ID or Reference Number"
            />
          </div>
        </div>

        {/* Employee Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Employee Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={formData.employee.firstName}
                onChange={(e) => handleInputChange('employee.firstName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.employee.lastName}
                onChange={(e) => handleInputChange('employee.lastName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
            <input
              type="text"
              value={formData.employee.employeeId}
              onChange={(e) => handleInputChange('employee.employeeId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.employee.email}
              onChange={(e) => handleInputChange('employee.email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
              type="text"
              value={formData.employee.department}
              onChange={(e) => handleInputChange('employee.department', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Company Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Company Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input
              type="text"
              value={formData.company.name}
              onChange={(e) => handleInputChange('company.name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.company.address}
              onChange={(e) => handleInputChange('company.address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.company.email}
                onChange={(e) => handleInputChange('company.email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.company.phone}
                onChange={(e) => handleInputChange('company.phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Salary Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Salary Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary *</label>
              <input
                type="number"
                value={formData.basicSalary}
                onChange={(e) => handleInputChange('basicSalary', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Net Salary *</label>
              <input
                type="number"
                value={formData.netSalary}
                onChange={(e) => handleInputChange('netSalary', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax</label>
              <input
                type="number"
                value={formData.tax}
                onChange={(e) => handleInputChange('tax', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Incentive</label>
              <input
                type="number"
                value={formData.incentive}
                onChange={(e) => handleInputChange('incentive', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bonus</label>
              <input
                type="number"
                value={formData.bonus}
                onChange={(e) => handleInputChange('bonus', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Allowances */}
      <div className="mt-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="text-xl font-semibold text-gray-700">Allowances</h2>
          <button
            onClick={addAllowanceField}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
          >
            + Add Allowance
          </button>
        </div>
        {allowanceFields.map((allowance, index) => (
          <div key={index} className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Allowance Type (e.g., HRA, DA)"
              value={allowance.key}
              onChange={(e) => handleAllowanceChange(index, 'key', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Amount"
              value={allowance.value}
              onChange={(e) => handleAllowanceChange(index, 'value', parseFloat(e.target.value))}
              className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => removeAllowanceField(index)}
              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Deductions */}
      <div className="mt-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="text-xl font-semibold text-gray-700">Deductions</h2>
          <button
            onClick={addDeductionField}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
          >
            + Add Deduction
          </button>
        </div>
        {deductionFields.map((deduction, index) => (
          <div key={index} className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Deduction Type (e.g., PF, ESI)"
              value={deduction.key}
              onChange={(e) => handleDeductionChange(index, 'key', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Amount"
              value={deduction.value}
              onChange={(e) => handleDeductionChange(index, 'value', parseFloat(e.target.value))}
              className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => removeDeductionField(index)}
              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Remarks */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
        <textarea
          value={formData.remarks}
          onChange={(e) => handleInputChange('remarks', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Any additional remarks or notes..."
        />
      </div>

      {/* Preview Data */}
      {previewData && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-lg font-semibold mb-2">Preview Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm">
                <strong>Employee:</strong> {previewData.employee.name}
              </p>
              <p className="text-sm">
                <strong>Employee ID:</strong> {previewData.employee.employeeId}
              </p>
              <p className="text-sm">
                <strong>Department:</strong> {previewData.employee.department}
              </p>
            </div>
            <div>
              <p className="text-sm">
                <strong>Period:</strong> {previewData.period}
              </p>
              <p className="text-sm">
                <strong>Gross Pay:</strong> ₹{previewData.summary.grossPay.toFixed(2)}
              </p>
              <p className="text-sm">
                <strong>Net Salary:</strong> ₹{previewData.summary.netSalary.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex gap-4 justify-end pb-6">
        <button
          onClick={handlePreview}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition disabled:bg-gray-400"
        >
          {isLoading ? 'Loading...' : 'Preview'}
        </button>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition disabled:bg-gray-400"
        >
          {isLoading ? 'Generating...' : 'Generate PDF'}
        </button>
      </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default CustomPayslipGenerator;
