import React from 'react';
import { format } from 'date-fns';
import { Card, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PayrollStatistics, PayslipData } from '@/interface/general';
import { getStatusBadgeVariant } from '../utils/Badgevariant';
import PayslipDetailsTab from './PayslipDetailsTab';
import PayslipSummaryTab from './PayslipSummaryTab';
import PayslipAttendanceTab from './PayslipAttendanceTab';

interface PayslipViewerProps {
  selectedPayslip: PayslipData;
  payslipStatistics: PayrollStatistics | null;
  user: any; // Replace with proper user type
  months: { value: number; label: string }[];
  formatCurrency: (amount: number) => string;
  downloadPayslip: () => void;
}

const PayslipViewer: React.FC<PayslipViewerProps> = ({
  selectedPayslip,
  payslipStatistics,
  user,
  months,
  formatCurrency,
  downloadPayslip
}) => {
  return (
    <Tabs defaultValue="summary">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">
                Payslip: {months.find(m => m.value === selectedPayslip.month)?.label}{' '}
                {selectedPayslip.year}
              </h2>
              <p className="text-sm text-muted-foreground">
                {user?.firstName} {user?.lastName} • {user?.employeeId}
              </p>
            </div>
            <Badge variant={getStatusBadgeVariant(selectedPayslip.status)}>
              {selectedPayslip.status}
            </Badge>
          </div>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>
        </CardHeader>

        <PayslipSummaryTab 
          selectedPayslip={selectedPayslip} 
          payslipStatistics={payslipStatistics} 
          formatCurrency={formatCurrency} 
          downloadPayslip={downloadPayslip} 
        />
        
        <PayslipDetailsTab 
          payslipStatistics={payslipStatistics} 
          formatCurrency={formatCurrency} 
        />
        
        <PayslipAttendanceTab 
          payslipStatistics={payslipStatistics} 
        />
      </Card>
    </Tabs>
  );
};

export default PayslipViewer;