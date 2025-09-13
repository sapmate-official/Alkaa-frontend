import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import {
  AlertTriangle,
  FileText,
  Receipt,
  Clock,
  CheckCircle2,
  Users,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RouteDict from '@/routes/RouteDict';
import { useBillingDashboard } from '@/hooks/queries/useBilling';
import { useEffect } from 'react';

const BillingDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use TanStack Query hook instead of manual state and axios
  const { 
    data: dashboardData, 
    isLoading: loading, 
    error
  } = useBillingDashboard();

  // Show toast as a side-effect when error changes to avoid re-render loop
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading data',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'Expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'Expiring Soon':
        return <Badge variant="destructive" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Expiring Soon</Badge>;
      case 'Active':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  const getBillStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case 'UNPAID':
        return <Badge variant="outline">Unpaid</Badge>;
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No end date';
    return new Date(dateString).toLocaleDateString();
  };

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold">Billing Dashboard</h1>
        <p className="text-gray-500">View and manage your billing information</p>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex items-center"
          onClick={() => navigate(RouteDict.Billing.History)}
        >
          <FileText className="mr-2 h-4 w-4" />
          View All Bills
        </Button>
        {dashboardData?.billing?.latestBill && (
          <Button 
            className="flex items-center"
            onClick={() => navigate(RouteDict.Billing.Details(dashboardData.billing.latestBill.id))}
          >
            <Receipt className="mr-2 h-4 w-4" />
            Latest Bill
          </Button>
        )}
      </div>
    </div>
  );

  const renderOrganizationDetails = () => {
    if (!dashboardData) return null;
    const { organization } = dashboardData;
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
          <CardDescription>Your current subscription information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Organization</div>
              <div className="text-lg font-semibold">{organization.name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Subscription Plan</div>
              <div className="text-lg font-semibold capitalize">{organization.subscriptionPlan.toLowerCase()}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</div>
              <div>
                {getStatusBadge(organization.subscriptionStatus)}
              </div>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</div>
              <div>{formatDate(organization.subscriptionStart)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">End Date</div>
              <div>{formatDate(organization.subscriptionEnd)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Users</div>
              <div className="flex items-center">
                <Users className="mr-1 h-4 w-4" /> {organization.activeUsers}
              </div>
            </div>
          </div>
          {organization.daysRemaining !== null && (
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {organization.daysRemaining > 0 ? `${organization.daysRemaining} days remaining` : 'Subscription expired'}
              </div>
              <Progress 
                value={organization.daysRemaining > 0 ? Math.min(organization.daysRemaining, 100) : 0} 
                max={100}
                className={organization.daysRemaining < 7 ? "text-red-600" : ""}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderBillingStats = () => {
    if (!dashboardData) return null;
    const { billing, billStatus } = dashboardData;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Billed This Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{billing.totalBilledThisYear.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{billing.totalUnpaid.toFixed(2)}</div>
            {billing.unpaidCount > 0 && (
              <p className="text-sm text-gray-500">
                {billing.unpaidCount} {billing.unpaidCount === 1 ? 'bill' : 'bills'} pending
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Billing Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex flex-col items-center">
                <span className="text-lg font-semibold">{billStatus.paid}</span>
                <span className="text-xs text-gray-500">Paid</span>
              </div>
              <Separator orientation="vertical" className="mx-1" />
              <div className="flex flex-col items-center">
                <span className="text-lg font-semibold">{billStatus.unpaid}</span>
                <span className="text-xs text-gray-500">Unpaid</span>
              </div>
              <Separator orientation="vertical" className="mx-1" />
              <div className="flex flex-col items-center">
                <span className="text-lg font-semibold">{billStatus.overdue}</span>
                <span className="text-xs text-gray-500">Overdue</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billStatus.total}</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRecentBills = () => {
    if (!dashboardData?.recentBills?.length) return null;
    const { recentBills } = dashboardData;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recent Bills</CardTitle>
          <CardDescription>Your recent billing history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBills.map(bill => {
              const monthName = new Date(bill.year, bill.month - 1).toLocaleString('default', { month: 'long' });
              
              return (
                <div key={bill.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center">
                    {bill.status === 'PAID' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    ) : bill.status === 'OVERDUE' ? (
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    ) : (
                      <Clock className="h-5 w-5 text-gray-500 mr-2" />
                    )}
                    <div>
                      <div className="font-medium">{monthName} {bill.year} Bill</div>
                      <div className="text-sm text-gray-500">
                        Due: {formatDate(bill.dueDate)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium text-right">₹{bill.totalAmount.toFixed(2)}</div>
                      <div className="text-right">
                        {getBillStatusBadge(bill.status)}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate(RouteDict.Billing.Details(bill.id))}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 bg-gray-50 dark:bg-gray-900">
          <Button 
            variant="ghost" 
            className="w-full" 
            onClick={() => navigate(RouteDict.Billing.History)}
          >
            View All Bills
          </Button>
        </CardFooter>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 w-full p-4">
        <Skeleton className="h-12 w-[250px]" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-[100px]" />
          <Skeleton className="h-[100px]" />
          <Skeleton className="h-[100px]" />
          <Skeleton className="h-[100px]" />
        </div>
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error?.message || 'Failed to load dashboard data'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='w-full overflow-y-auto mx-auto p-4'>
      {renderHeader()}
      {renderOrganizationDetails()}
      {renderBillingStats()}
      {renderRecentBills()}
    </div>
  );
};

export default BillingDashboard;
