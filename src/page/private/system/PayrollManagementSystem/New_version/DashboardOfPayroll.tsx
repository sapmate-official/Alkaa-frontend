import { useState, useEffect } from 'react'
import { useAuth } from '@/services/AuthContext'
import axios from 'axios'
import { APIV3Dictionary } from '@/api/v3/Api3Dicts'
import { useAtom } from 'jotai'
import { specialEventsAtom } from '@/store/atom'
import { SpecialEvents } from '@/components/dashboard/SpecialEvents'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import ButtonOfViewPayslipOfAllSubordinatesPayroll from './ManagerLevel/ViewPayslipOfAllSubordinatesPayroll/ButtonOfViewPayslipOfAllSubordinatesPayroll'
import ButtonOfViewPayslipOfAllUsersPayroll from './AdminLevel/ViewPayslipOfAllUsersPayroll/ButtonOfViewPayslipOfAlUsersPayroll'
import { PayrollStatistics, PayslipData } from '@/interface/general'
import { MonthAndYearSelector } from './ui/MonthYearPicker'
import { PayslipListItem } from './ui/Payslip'
import { getStatusBadgeVariant } from './utils/Badgevariant'
import PayslipViewer from './ui/PayslipViewer'
import { APIDictionary } from '@/api/v2/APIdict'

const DashboardOfPayroll = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [payslips, setPayslips] = useState<PayslipData[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(null);
  const [payslipStatistics, setPayslipStatistics] = useState<PayrollStatistics | null>(null);
  const [specialEvents, setSpecialEvents] = useAtom(specialEventsAtom);

  // Current date for default values
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  const currentYear = currentDate.getFullYear();

  // State for month/year selection
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Generate arrays for months and years (for dropdowns)
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

  // Fetch payslips and special events when component mounts or month/year changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch payslips
        const payslipResponse = await axios.get(
          APIV3Dictionary.payroll.getPayslip(selectedMonth, selectedYear),
          { withCredentials: true }
        );

        if (payslipResponse.data.success && payslipResponse.data.data.length > 0) {
          setPayslips(payslipResponse.data.data);

          // Set the first payslip as selected by default
          const firstPayslip = payslipResponse.data.data[0];
          setSelectedPayslip(firstPayslip);

          // Fetch statistics for the first payslip
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
          // Filter to only show payroll-related events
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
      } catch (error) {
        console.error('Error fetching payroll dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch payroll dashboard data. Please try again.',
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
      toast({
        title: 'Error',
        description: 'Failed to fetch payslip statistics. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Function to handle payslip selection
  const handleSelectPayslip = (payslip: PayslipData) => {
    setSelectedPayslip(payslip);
    fetchPayslipStatistics(payslip.id);
  };

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Function to download payslip
  const downloadPayslip = async () => {
    if (!selectedPayslip) return;

    try {
      setIsLoading(true);

      // Make authenticated request to download PDF
      const response = await axios.get(
        APIV3Dictionary.payroll.downloadPayslip(selectedPayslip.id),
        { 
          responseType: 'blob', 
          withCredentials: true,
          headers: {
            'Accept': 'application/pdf'
          },
          params: {
            format: 'html' // Use HTML-based PDF generation
          }
        }
      );
      
      // Create a blob and generate download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create filename based on payslip data
      const monthName = new Date(selectedPayslip.year, selectedPayslip.month - 1, 1)
        .toLocaleString('default', { month: 'long' });
      const fileName = `payslip-${user?.firstName || 'Employee'}-${user?.lastName || ''}-${monthName}-${selectedPayslip.year}.pdf`;
      
      // Create and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Notify user of success
      toast({
        title: 'Success',
        description: 'Payslip downloaded successfully.',
      });
    } catch (error) {
      console.error('Error downloading payslip:', error);
      toast({
        title: 'Error',
        description: 'Failed to download payslip. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate salary if it doesn't exist
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

        // Refresh payslip data
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error generating salary:', error);

      // Handle specific error cases
      if (error.response?.status === 409) {
        toast({
          title: 'Error',
          description: 'Salary already exists for this month.',
          variant: 'destructive',
        });
      } else if (error.response?.status === 403) {
        toast({
          title: 'Error',
          description: 'You do not have permission to generate salary.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to generate salary. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="w-screen px-8 py-6 space-y-6 h-screen overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Dashboard</h1>
          <p className="text-muted-foreground">View and manage your payroll information</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ButtonOfViewPayslipOfAllSubordinatesPayroll />
          <ButtonOfViewPayslipOfAllUsersPayroll />
        </div>
      </div>

      <MonthAndYearSelector months={months} years={years} selectedMonth={selectedMonth} selectedYear={selectedYear} setSelectedMonth={setSelectedMonth} setSelectedYear={setSelectedYear} key={1} />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full rounded-md" />
          <Skeleton className="h-[400px] w-full rounded-md" />
        </div>
      ) : payslips.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Payslip Available</CardTitle>
            <CardDescription>
              There is no payslip available for the selected month and year.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center py-8">
              {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </p>
            <div className="flex justify-center">
              <Button onClick={generateSalary}>
                Generate Salary
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Payslip History</CardTitle>
                <CardDescription>Your recent payslips</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
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
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-1 md:col-span-2">
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

      <div className="space-y-6">
        <SpecialEvents events={specialEvents} isLoading={isLoading} />
      </div>
    </div>
  )
}

export default DashboardOfPayroll

