import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/services/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { backendDomain } from '@/lib/constant/Domain';
import RouteDict from '@/routes/RouteDict';
import axios from 'axios';
import { useAtom } from 'jotai';
import { permissionListAtom } from '@/store/atom';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Users, 
  Plus, 
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer,
  UserCheck,
  Zap,
  TrendingUp,
  Activity
} from 'lucide-react';

interface LeaveType {
  id: string;
  name: string;
  description: string;
  annualLimit: number;
  requiresApproval: boolean;
  isPaid: boolean;
  carryForward: boolean;
  maxCarryForward: number;
}

interface LeaveBalance {
  id: string;
  usedDays: number;
  remainingDays: number;
  carryForward: number;
  leaveType: LeaveType;
}

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  numberOfDays: number;
  reason: string;
  leaveType: LeaveType;
  user?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

const LeaveDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [permissionList] = useAtom(permissionListAtom);
  
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user has approval permissions
  const canApproveLeaveRequests = permissionList.some(permission => 
    permission.key === 'approve_leave' || permission.key === 'leave_request_approve'
  );

  useEffect(() => {
    if (user?.organization?.id) {
      fetchDashboardData();
    }
  }, [user, canApproveLeaveRequests]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const requests = [
        axios.get(`${backendDomain}/api/v2/leave-type/org/${user?.organization?.id}`, {
          withCredentials: true,
        }),
        axios.get(`${backendDomain}/api/v2/leave-balance/user/${user?.id}`, {
          withCredentials: true,
        }),
        axios.get(`${backendDomain}/api/v2/leave-request/user/${user?.id}`, {
          withCredentials: true,
        }),
      ];

      // Add pending approvals request if user has approval permissions
      if (canApproveLeaveRequests) {
        requests.push(
          axios.get(`${backendDomain}/api/v2/leave-request/manager/${user?.id}`, {
            withCredentials: true,
          })
        );
      }

      const responses = await Promise.all(requests);
      
      setLeaveTypes(responses[0].data);
      setLeaveBalances(responses[1].data);
      setLeaveRequests(responses[2].data);
      
      // Set pending approvals if the request was made
      if (canApproveLeaveRequests && responses[3]) {
        const pendingRequests = responses[3].data.filter((req: LeaveRequest) => req.status === 'PENDING');
        setPendingApprovals(pendingRequests);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leave dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApprove = async (requestId: string) => {
    try {
      await axios.post(`${backendDomain}/api/v2/leave-request/approve/${requestId}`, {
        approvedBy: user?.id
      }, {
        withCredentials: true,
      });

      toast({
        title: "Success",
        description: "Leave request approved successfully",
      });

      // Refresh pending approvals
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve leave request",
        variant: "destructive",
      });
    }
  };

  const handleQuickReject = async (requestId: string) => {
    try {
      await axios.post(`${backendDomain}/api/v2/leave-request/reject/${requestId}`, {
        approvedBy: user?.id,
        rejectedReason: "Quick rejection from dashboard"
      }, {
        withCredentials: true,
      });

      toast({
        title: "Success",
        description: "Leave request rejected",
      });

      // Refresh pending approvals
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject leave request",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingRequests = leaveRequests.filter(req => req.status === 'PENDING');
  const totalUsedDays = leaveBalances.reduce((sum, balance) => sum + balance.usedDays, 0);
  const totalRemainingDays = leaveBalances.reduce((sum, balance) => sum + balance.remainingDays, 0);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <Timer className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Leave Management Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your leave requests, balances, and available leave types</p>
      </div>

      {/* Approval Section - Only show if user has approval permissions and there are pending requests */}
      {canApproveLeaveRequests && pendingApprovals.length > 0 && (
        <div className="mb-8">
          <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 rounded-full">
                    <UserCheck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Zap className="h-5 w-5 text-orange-500" />
                      Pending Approvals
                      <Badge className="bg-orange-500 text-white">{pendingApprovals.length}</Badge>
                    </CardTitle>
                    <CardDescription className="text-orange-700 dark:text-orange-300">
                      {pendingApprovals.length === 1 
                        ? "1 leave request needs your attention" 
                        : `${pendingApprovals.length} leave requests need your attention`
                      }
                    </CardDescription>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(RouteDict.Leave.Requests.Approval)}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Manage All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-4">
                {pendingApprovals.slice(0, 3).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-800 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {request.user?.firstName} {request.user?.lastName}
                        </div>
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          {request.leaveType.name}
                        </Badge>
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          {request.numberOfDays} {request.numberOfDays === 1 ? 'day' : 'days'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(request.startDate), 'MMM dd')} - {format(new Date(request.endDate), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {request.reason}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleQuickApprove(request.id)}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickReject(request.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(RouteDict.Leave.Requests.Approval)}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingApprovals.length > 3 && (
                  <div className="text-center pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => navigate(RouteDict.Leave.Requests.Approval)}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View {pendingApprovals.length - 3} more pending requests
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className={canApproveLeaveRequests && pendingApprovals.length > 0 ? "border-orange-200" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {canApproveLeaveRequests ? "Pending Approvals" : "Total Leave Types"}
            </CardTitle>
            {canApproveLeaveRequests ? (
              <UserCheck className="h-4 w-4 text-orange-500" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {canApproveLeaveRequests ? pendingApprovals.length : leaveTypes.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {canApproveLeaveRequests 
                ? (pendingApprovals.length === 1 ? "Request awaiting approval" : "Requests awaiting approval")
                : "Available leave categories"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Used</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsedDays}</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRemainingDays}</div>
            <p className="text-xs text-muted-foreground">Available to use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Pending Requests</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leave Requests Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Leave Requests
              </CardTitle>
              <CardDescription>Your latest leave applications</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => navigate(RouteDict.Leave.Requests.Create)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(RouteDict.Leave.Requests.List)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {leaveRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No leave requests found</p>
                <Button
                  className="mt-4"
                  onClick={() => navigate(RouteDict.Leave.Requests.Create)}
                >
                  Create Your First Request
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {leaveRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{request.leaveType.name}</span>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">{request.numberOfDays} days</p>
                    </div>
                    <div className="flex items-center">
                      {request.status === 'APPROVED' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {request.status === 'REJECTED' && <XCircle className="h-5 w-5 text-red-500" />}
                      {request.status === 'PENDING' && <Clock className="h-5 w-5 text-yellow-500" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Balance Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Leave Balance
              </CardTitle>
              <CardDescription>Your current leave balance by type</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(RouteDict.Leave.Balance.View)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </CardHeader>
          <CardContent>
            {leaveBalances.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No leave balance found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaveBalances.map((balance) => (
                  <div key={balance.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{balance.leaveType.name}</span>
                      <span className="text-sm text-gray-600">
                        {balance.remainingDays} / {balance.remainingDays + balance.usedDays} days
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(balance.usedDays / (balance.remainingDays + balance.usedDays)) * 100}%`
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Used: {balance.usedDays}</span>
                      <span>Remaining: {balance.remainingDays}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Types Section */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Available Leave Types
              </CardTitle>
              <CardDescription>All leave types configured for your organization</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => navigate(RouteDict.Leave.Types.Create)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Type
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(RouteDict.Leave.Types.List)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Manage Types
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {leaveTypes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No leave types configured</p>
                <Button
                  className="mt-4"
                  onClick={() => navigate(RouteDict.Leave.Types.Create)}
                >
                  Create First Leave Type
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leaveTypes.map((type) => (
                  <div key={type.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{type.name}</h4>
                      <div className="flex gap-1">
                        {type.isPaid && (
                          <Badge variant="secondary" className="text-xs">
                            Paid
                          </Badge>
                        )}
                        {type.requiresApproval && (
                          <Badge variant="outline" className="text-xs">
                            Approval Required
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {type.description || 'No description provided'}
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Annual Limit: {type.annualLimit} days</div>
                      {type.carryForward && (
                        <div>Max Carry Forward: {type.maxCarryForward} days</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaveDashboard;
