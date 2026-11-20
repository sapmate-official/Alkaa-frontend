import React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { PayrollStatistics, PayslipData, User } from '@/types/general';
import { getStatusBadgeVariant } from '../utils/Badgevariant';
import PayslipDetailsTab from './PayslipDetailsTab';
import PayslipSummaryTab from './PayslipSummaryTab';
import PayslipAttendanceTab from './PayslipAttendanceTab';

interface PayslipViewerProps {
  selectedPayslip: PayslipData;
  payslipStatistics: PayrollStatistics | null;
  user: User | null;
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
  const monthName = months.find(m => m.value === selectedPayslip.month)?.label || `Month ${selectedPayslip.month}`;

  return (
    <Tabs defaultValue="summary" className="w-full">
      <Card className="bg-card border-border shadow-xs">
        <CardHeader className="border-b border-border p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Payslip: {monthName} {selectedPayslip.year}
                </h2>
                <Badge variant={getStatusBadgeVariant(selectedPayslip.status)}>
                  {selectedPayslip.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {user?.firstName} {user?.lastName} • ID: {user?.employeeId || 'N/A'} • {payslipStatistics?.basicInfo?.employee?.department || (user as any)?.Department?.[0]?.name || 'General'}
              </p>
            </div>
            
            <Button size="sm" variant="outline" onClick={downloadPayslip} className="h-8">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
            </Button>
          </div>

          <TabsList className="grid grid-cols-3 w-full max-w-xs h-9">
            <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
            <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
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
