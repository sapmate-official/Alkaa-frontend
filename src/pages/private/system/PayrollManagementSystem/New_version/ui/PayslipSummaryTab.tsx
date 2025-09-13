import React from 'react';
import { format } from 'date-fns';
import {  
  CardContent, 
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Download, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { PayrollStatistics, PayslipData } from '@/types/general';
import { TabsContent } from '@/components/ui/tabs';

interface PayslipSummaryTabProps {
  selectedPayslip: PayslipData;
  payslipStatistics: PayrollStatistics | null;
  formatCurrency: (amount: number) => string;
  downloadPayslip: () => void;
}

const PayslipSummaryTab: React.FC<PayslipSummaryTabProps> = ({
  selectedPayslip,
  payslipStatistics,
  formatCurrency,
  downloadPayslip
}) => {
    
  return (
    <TabsContent value="summary">
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Basic Salary
            </p>
            <h3 className="text-2xl font-bold">
              {formatCurrency(selectedPayslip.basicSalary)}
            </h3>
          </div>
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Net Salary
            </p>
            <h3 className="text-2xl font-bold">
              {formatCurrency(selectedPayslip.netSalary)}
            </h3>
          </div>
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Payment Date
            </p>
            <h3 className="text-lg font-medium">
              {selectedPayslip.processedAt
                ? format(new Date(selectedPayslip.processedAt), 'dd MMM yyyy')
                : 'Pending'}
            </h3>
          </div>
        </div>

        {payslipStatistics && <SalaryBreakdown payslipStatistics={payslipStatistics} formatCurrency={formatCurrency} />}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={downloadPayslip}>
          <Download className="mr-2 h-4 w-4" /> Download Payslip
        </Button>
      </CardFooter>
    </TabsContent>
  );
};

// Sub-component for salary breakdown
const SalaryBreakdown: React.FC<{ 
  payslipStatistics: PayrollStatistics; 
  formatCurrency: (amount: number) => string;
}> = ({ payslipStatistics, formatCurrency }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Earnings</h3>
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
              <TableCell className="text-right">
                {formatCurrency(payslipStatistics.salaryBreakdown.basicSalary)}
              </TableCell>
            </TableRow>
            {Object.entries(payslipStatistics.salaryBreakdown.allowanceDetails).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell className="capitalize">{key}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(value)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-medium">
              <TableCell>Total Earnings</TableCell>
              <TableCell className="text-right">
                {formatCurrency(
                  payslipStatistics.salaryBreakdown.basicSalary +
                  payslipStatistics.salaryBreakdown.totalAllowances
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Deductions</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Component</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(payslipStatistics.salaryBreakdown.deductionDetails).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell className="capitalize">{key}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(value)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>Tax</TableCell>
              <TableCell className="text-right">
                {formatCurrency(payslipStatistics.salaryBreakdown.taxAmount)}
              </TableCell>
            </TableRow>
            <TableRow className="font-medium">
              <TableCell>Total Deductions</TableCell>
              <TableCell className="text-right">
                {formatCurrency(payslipStatistics.salaryBreakdown.totalDeductions)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PayslipSummaryTab;