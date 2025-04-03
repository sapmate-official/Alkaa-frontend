import { useState, useEffect } from 'react'
import { useAuth } from '@/services/AuthContext'
import axios from 'axios'
import { APIV3Dictionary } from '@/api/v3/Api3Dicts'
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




const DashboardOfPayroll = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [payslips, setPayslips] = useState<PayslipData[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(null);
  const [payslipStatistics, setPayslipStatistics] = useState<PayrollStatistics | null>(null);

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

  // Fetch payslips when component mounts or month/year changes
  useEffect(() => {
    if (!user?.id) return;

    const fetchPayslips = async () => {
      setIsLoading(true);
      try {
        // Fetch payslips for the current user (passing 'undefined' for userId to get own payslips)
        const response = await axios.get(
          APIV3Dictionary.payroll.getPayslip(selectedMonth, selectedYear),
          { withCredentials: true }
        );

        if (response.data.success && response.data.data.length > 0) {
          setPayslips(response.data.data);

          // Set the first payslip as selected by default
          const firstPayslip = response.data.data[0];
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
      } catch (error) {
        console.error('Error fetching payslips:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch payslip data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayslips();
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

  // Function to get status badge variant


  // Function to download payslip
  const downloadPayslip = () => {
    if (!selectedPayslip) return;

    try {
      // Create the download URL
      const downloadUrl = APIV3Dictionary.payroll.downloadPayslip(selectedPayslip.id);

      // Notify user
      toast({
        title: 'Download initiated',
        description: 'Your payslip download will begin shortly.',
      });

      // Open the download in a new window/tab
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading payslip:', error);
      toast({
        title: 'Error',
        description: 'Failed to download payslip. Please try again.',
        variant: 'destructive',
      });
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
    </div>
  )
}

export default DashboardOfPayroll

