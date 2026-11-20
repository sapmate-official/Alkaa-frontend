import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthContext';
import axios from 'axios';
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts';
import { useSpecialEvents, useSetSpecialEvents } from '@/store/useAppStore';
import { SpecialEvents } from '@/components/dashboard/SpecialEvents';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { PayrollStatistics, PayslipData } from '@/types/general';
import { MonthAndYearSelector } from './ui/MonthYearPicker';
import { PayslipListItem } from './ui/Payslip';
import { getStatusBadgeVariant } from './utils/Badgevariant';
import PayslipViewer from './ui/PayslipViewer';
import PayrollHeader from './ui/PayrollHeader';
import { APIDictionary } from '@/services/api/v2/APIdict';
import { FileQuestion, PlusCircle } from 'lucide-react';

const DashboardOfPayroll: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [payslips, setPayslips] = useState<PayslipData[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(null);
  const [payslipStatistics, setPayslipStatistics] = useState<PayrollStatistics | null>(null);
  const specialEvents = useSpecialEvents();
  const setSpecialEvents = useSetSpecialEvents();

  // Current date for default values
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // State for month/year selection
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

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

  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Fetch payslips and special events
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const payslipResponse = await axios.get(
          APIV3Dictionary.payroll.getPayslip(selectedMonth, selectedYear),
          { withCredentials: true }
        );

        if (payslipResponse.data.success && payslipResponse.data.data.length > 0) {
          setPayslips(payslipResponse.data.data);
          const firstPayslip = payslipResponse.data.data[0];
          setSelectedPayslip(firstPayslip);

          if (firstPayslip?.id) {
            fetchPayslipStatistics(firstPayslip.id);
          }
        } else {
          setPayslips([]);
          setSelectedPayslip(null);
          setPayslipStatistics(null);
        }

        // Fetch special events
        const eventsResponse = await axios.get(APIDictionary.events, { withCredentials: true });
        if (eventsResponse.data.success) {
          interface Event {
            type: string;
            entity?: {
              payrollRelated?: boolean;
            };
          }
          const payrollEvents = eventsResponse.data.data.filter(
            (event: Event) => event.type === 'BILL' || 
              (event.type === 'MONTH_END_VERIFICATION' && event.entity?.payrollRelated)
          );
          setSpecialEvents(payrollEvents);
        }
      } catch (error: unknown) {
        console.error('Error fetching payroll dashboard data:', error);
        const err = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
        const errorMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to fetch payroll dashboard data.';
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id, selectedMonth, selectedYear]);

  // Function to fetch payslip statistics
  const fetchPayslipStatistics = async (payslipId: string) => {
    try {
      const response = await axios.get(
        APIV3Dictionary.payroll.getStatistics(payslipId),
        { withCredentials: true }
      );

      if (response.data.success) {
        setPayslipStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching payslip statistics:', error);
    }
  };

  const handleSelectPayslip = (payslip: PayslipData) => {
    setSelectedPayslip(payslip);
    fetchPayslipStatistics(payslip.id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const downloadPayslip = async () => {
    if (!selectedPayslip) return;

    try {
      setIsLoading(true);

      const response = await axios.get(
        APIV3Dictionary.payroll.downloadPayslip(selectedPayslip.id),
        { 
          responseType: 'blob', 
          withCredentials: true,
          headers: {
            'Accept': 'application/pdf'
          },
          params: {
            format: 'html'
          }
        }
      );
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const monthName = new Date(selectedPayslip.year, selectedPayslip.month - 1, 1)
        .toLocaleString('default', { month: 'long' });
      const fileName = `payslip-${user?.firstName || 'Employee'}-${user?.lastName || ''}-${monthName}-${selectedPayslip.year}.pdf`;
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Payslip downloaded successfully.',
      });
    } catch (error) {
      console.error('Error downloading payslip:', error);
      toast({
        title: 'Error',
        description: 'Failed to download payslip.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSalary = async () => {
    if (!user?.id) return;

    try {
      const response = await axios.post(
        APIV3Dictionary.payroll.generateSalary(selectedMonth, selectedYear),
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Salary generated successfully!',
        });
        window.location.reload();
      }
    } catch (error: unknown) {
      console.error('Error generating salary:', error);
      const err = error as { response?: { status?: number; data?: { message?: string; error?: string } }; message?: string };

      if (err.response?.status === 409) {
        toast({
          title: 'Notice',
          description: 'Salary already exists for this month.',
          variant: 'default',
        });
      } else {
        const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to generate salary.';
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      <PayrollHeader 
        title="My Payroll Dashboard" 
        description="Inspect personal payslips, salary breakdowns, and attendance metrics"
        activeTab="dashboard"
      />

      {/* Compact Period Selector */}
      <MonthAndYearSelector 
        months={months} 
        years={years} 
        selectedMonth={selectedMonth} 
        selectedYear={selectedYear} 
        setSelectedMonth={setSelectedMonth} 
        setSelectedYear={setSelectedYear} 
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[300px] col-span-1 rounded-lg" />
          <Skeleton className="h-[300px] col-span-2 rounded-lg" />
        </div>
      ) : payslips.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
              <FileQuestion className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-semibold text-foreground">
              No Payslip Available
            </CardTitle>
            <CardDescription className="max-w-md mt-1">
              There is no payslip record on file for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}.
            </CardDescription>
            <div className="mt-6">
              <Button onClick={generateSalary} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Generate My Salary
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Payslip History List */}
          <div className="lg:col-span-4">
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 border-b border-border">
                <CardTitle className="text-base font-semibold">Available Payslips</CardTitle>
                <CardDescription className="text-xs">
                  {payslips.length} record{payslips.length === 1 ? '' : 's'} found for this period
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                {payslips.map((payslip) => (
                  <PayslipListItem
                    key={payslip.id}
                    payslip={payslip}
                    isSelected={selectedPayslip?.id === payslip.id}
                    onSelect={handleSelectPayslip}
                    formatCurrency={formatCurrency}
                    getStatusBadgeVariant={getStatusBadgeVariant}
                    months={months}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right: Payslip Viewer */}
          <div className="lg:col-span-8">
            {selectedPayslip && (
              <PayslipViewer
                selectedPayslip={selectedPayslip}
                payslipStatistics={payslipStatistics}
                user={user}
                months={months}
                formatCurrency={formatCurrency}
                downloadPayslip={downloadPayslip}
              />
            )}
          </div>
        </div>
      )}

      {/* Special Events / Notice bar */}
      {specialEvents && specialEvents.length > 0 && (
        <div className="pt-2">
          <SpecialEvents events={specialEvents} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
};

export default DashboardOfPayroll;
