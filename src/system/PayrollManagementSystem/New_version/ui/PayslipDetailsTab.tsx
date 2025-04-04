import React from 'react';
import { format } from 'date-fns';
import {  CardContent } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { PayrollStatistics } from '@/interface/general';

interface PayslipDetailsTabProps {
  payslipStatistics: PayrollStatistics | null;
  formatCurrency: (amount: number) => string;
}

const PayslipDetailsTab: React.FC<PayslipDetailsTabProps> = ({
  payslipStatistics,
  formatCurrency
}) => {
  if (!payslipStatistics) return <TabsContent value="details"><CardContent>No data available</CardContent></TabsContent>;

  return (
    <TabsContent value="details">
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PaymentDetailsSection payslipStatistics={payslipStatistics} />
            <AdditionalPaymentsSection payslipStatistics={payslipStatistics} formatCurrency={formatCurrency} />
          </div>

          <ComparisonsSection payslipStatistics={payslipStatistics} formatCurrency={formatCurrency} />
        </div>
      </CardContent>
    </TabsContent>
  );
};

// Payment Details Sub-component
const PaymentDetailsSection: React.FC<{ payslipStatistics: PayrollStatistics }> = ({ payslipStatistics }) => (
  <div>
    <h3 className="font-semibold mb-2">Payment Details</h3>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Payment Mode:</span>
        <span>{payslipStatistics.basicInfo.paymentInfo.mode || 'Not processed'}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Reference:</span>
        <span>{payslipStatistics.basicInfo.paymentInfo.reference || 'N/A'}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Processed Date:</span>
        <span>
          {payslipStatistics.basicInfo.processedAt
            ? format(new Date(payslipStatistics.basicInfo.processedAt), 'dd MMM yyyy')
            : 'Pending'}
        </span>
      </div>
    </div>
  </div>
);

// Additional Payments Sub-component
const AdditionalPaymentsSection: React.FC<{ 
  payslipStatistics: PayrollStatistics;
  formatCurrency: (amount: number) => string;
}> = ({ payslipStatistics, formatCurrency }) => (
  <div>
    <h3 className="font-semibold mb-2">Additional Payments</h3>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Incentive:</span>
        <span>{formatCurrency(payslipStatistics.salaryBreakdown.additionalPayments.incentive)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Bonus:</span>
        <span>{formatCurrency(payslipStatistics.salaryBreakdown.additionalPayments.bonus)}</span>
      </div>
    </div>
  </div>
);

// Comparisons Sub-component
const ComparisonsSection: React.FC<{ 
  payslipStatistics: PayrollStatistics;
  formatCurrency: (amount: number) => string;
}> = ({ payslipStatistics, formatCurrency }) => (
  <div>
    <h3 className="font-semibold mb-2">Comparisons</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-muted p-4 rounded-md">
        <p className="text-sm text-muted-foreground">Earnings Ratio</p>
        <h3 className="text-2xl font-bold">
          {payslipStatistics.comparisons.earningsRatio.toFixed(2)}%
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Net to basic salary ratio
        </p>
      </div>

      <div className="bg-muted p-4 rounded-md">
        <p className="text-sm text-muted-foreground">YTD Earnings</p>
        <h3 className="text-2xl font-bold">
          {formatCurrency(payslipStatistics.comparisons.yearToDateEarnings)}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Total earnings this year
        </p>
      </div>

      {payslipStatistics.comparisons.previousMonth && (
        <div className="bg-muted p-4 rounded-md">
          <p className="text-sm text-muted-foreground">vs Previous Month</p>
          <h3 className="text-2xl font-bold flex items-center">
            {payslipStatistics.comparisons.previousMonth.percentageChange >= 0 ? '+' : ''}
            {payslipStatistics.comparisons.previousMonth.percentageChange.toFixed(2)}%
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(payslipStatistics.comparisons.previousMonth.difference)}
          </p>
        </div>
      )}
    </div>
  </div>
);

export default PayslipDetailsTab;