import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/AuthContext'
import axios from 'axios'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'
import { toast } from '@/hooks/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Building2
} from 'lucide-react'

interface PayrollRecord {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department: string;
  };
  month: number;
  year: number;
  basicSalary: number;
  netSalary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  status: 'PENDING' | 'PROCESSED' | 'APPROVED' | 'REJECTED' | 'PAID';
  processedAt?: string;
  reviewedAt?: string;
  reviewComments?: string;
  anomalies?: Array<{
    type: 'warning' | 'error';
    field: string;
    message: string;
  }>;
}

interface TeamStatistics {
  totalEmployees: number;
  pendingReviews: number;
  approvedCount: number;
  rejectedCount: number;
  totalPayrollAmount: number;
  averageSalary: number;
}

const ManagerReviewDashboard = () => {
  const { user } = useAuth();
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load team payroll data
  useEffect(() => {
    const fetchTeamPayrollData = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch team payroll records
        const teamPayrollResponse = await axios.get(
          APIV3Dictionary.payroll.manager.teamPayroll, 
          { withCredentials: true }
        );

        if (teamPayrollResponse.data && teamPayrollResponse.data.success) {
          setPayrollRecords(teamPayrollResponse.data.data || []);
        }

        // Fetch team statistics
        const teamStatsResponse = await axios.get(
          APIV3Dictionary.payroll.manager.teamStatistics, 
          { withCredentials: true }
        );

        if (teamStatsResponse.data && teamStatsResponse.data.success) {
          setTeamStats(teamStatsResponse.data.data);
        }
        
      } catch (error) {
        console.error('Error fetching team payroll data:', error);
        
        toast({
          title: 'Error',
          description: 'Failed to fetch team payroll data',
          variant: 'destructive',
        });
        
        // Set empty data on error
        setPayrollRecords([]);
        setTeamStats({
          totalEmployees: 0,
          pendingReviews: 0,
          approvedCount: 0,
          rejectedCount: 0,
          totalPayrollAmount: 0,
          averageSalary: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamPayrollData();
  }, [user?.id]);

  // Approve payroll record
  const approveRecord = async (recordId: string) => {
    try {
      setIsProcessing(true);
      
      const response = await axios.post(
        APIV3Dictionary.payroll.manager.approve(recordId),
        {},
        { withCredentials: true }
      );

      if (response.data && response.data.success) {
        setPayrollRecords(prev => 
          prev.map(record => 
            record.id === recordId 
              ? { ...record, status: 'APPROVED', reviewedAt: new Date().toISOString() }
              : record
          )
        );
        
        toast({
          title: 'Success',
          description: 'Payroll record approved successfully',
        });
      }
    } catch (error) {
      console.error('Error approving record:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve payroll record. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject payroll record
  const rejectRecord = async (recordId: string) => {
    try {
      setIsProcessing(true);
      
      const response = await axios.post(
        APIV3Dictionary.payroll.manager.reject(recordId),
        {},
        { withCredentials: true }
      );

      if (response.data && response.data.success) {
        setPayrollRecords(prev => 
          prev.map(record => 
            record.id === recordId 
              ? { ...record, status: 'REJECTED', reviewedAt: new Date().toISOString() }
              : record
          )
        );
        
        toast({
          title: 'Success',
          description: 'Payroll record rejected successfully',
        });
      }
    } catch (error) {
      console.error('Error rejecting record:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject payroll record. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'default';
      case 'REJECTED': return 'destructive';
      case 'PENDING': return 'outline';
      case 'PROCESSED': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen overflow-y-auto px-8 py-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="w-full h-screen overflow-y-auto px-8 py-6 space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Please log in to access manager dashboard</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-y-auto px-8 py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manager Review Dashboard</h1>
          <p className="text-muted-foreground">Review and approve team payroll records</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.totalEmployees || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.pendingReviews || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.approvedCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(teamStats?.totalPayrollAmount || 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 overflow-y-auto max-h-[calc(100vh-300px)]">
          <Card>
            <CardHeader>
              <CardTitle>Team Payroll Overview</CardTitle>
              <CardDescription>Summary of team payroll records</CardDescription>
            </CardHeader>
            <CardContent>
              {payrollRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payroll records available</p>
                  <p className="text-sm">Manager review APIs are not yet implemented</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payrollRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">
                          {record.employee.firstName} {record.employee.lastName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {record.employee.employeeId} • {record.employee.department}
                        </p>
                        <p className="text-sm">
                          Net Salary: {formatCurrency(record.netSalary)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {record.status}
                        </Badge>
                        {record.status === 'PROCESSED' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => approveRecord(record.id)}
                              disabled={isProcessing}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => rejectRecord(record.id)}
                              disabled={isProcessing}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-6 overflow-y-auto max-h-[calc(100vh-300px)]">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>Payroll records awaiting your review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending reviews</p>
                <p className="text-sm">All payroll records have been processed</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-6 overflow-y-auto max-h-[calc(100vh-300px)]">
          <Card>
            <CardHeader>
              <CardTitle>Approved Records</CardTitle>
              <CardDescription>Payroll records you have approved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No approved records</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-6 overflow-y-auto max-h-[calc(100vh-300px)]">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Records</CardTitle>
              <CardDescription>Payroll records you have rejected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No rejected records</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagerReviewDashboard;
