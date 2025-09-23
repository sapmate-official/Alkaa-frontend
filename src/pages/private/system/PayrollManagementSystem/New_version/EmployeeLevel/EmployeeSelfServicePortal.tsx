import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/AuthContext'
import { toast } from '@/hooks/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  User,
  CreditCard,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
  Save,
  Building2,
  Calendar,
  History
} from 'lucide-react'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'
import axios from 'axios'

interface EmployeeProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber?: string;
  employeeId: string;
  department: {
    name: string;
  };
  manager?: {
    firstName: string;
    lastName: string;
  };
  hiredDate?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
}

interface BankDetails {
  id: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  createdAt: string;
  updatedAt: string;
}

interface PayslipPreview {
  id: string;
  month: number;
  year: number;
  basicSalary: number;
  netSalary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  status: 'PENDING' | 'PROCESSED' | 'PAID';
  processedAt?: string;
  downloadUrl?: string;
}

interface SalaryDispute {
  id: string;
  salaryRecordId: string;
  reason: string;
  description?: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
}

const EmployeeSelfServicePortal = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [payslips, setPayslips] = useState<PayslipPreview[]>([]);
  const [disputes, setDisputes] = useState<SalaryDispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipPreview | null>(null);
  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);

  // Edit states
  const [editedProfile, setEditedProfile] = useState<Partial<EmployeeProfile>>({});
  const [editedBankDetails, setEditedBankDetails] = useState<Partial<BankDetails>>({});
  const [disputeForm, setDisputeForm] = useState({
    reason: '',
    description: ''
  });

  // Load employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch employee profile
        const profileResponse = await axios.get(
          APIV3Dictionary.payroll.employee.profile(user.id), 
          { withCredentials: true }
        );

        if (profileResponse.data) {
          const profileData = profileResponse.data;
          setProfile(profileData);
          setEditedProfile(profileData);
        }

        // Fetch bank details
        try {
          const bankResponse = await axios.get(
            APIV3Dictionary.payroll.employee.bankDetails(user.id), 
            { withCredentials: true }
          );

          if (bankResponse.data && bankResponse.data.length > 0) {
            const bankData = bankResponse.data[0]; // Get first bank record
            setBankDetails(bankData);
            setEditedBankDetails(bankData);
          }
        } catch (bankError) {
          console.warn('No bank details found for user');
          setBankDetails(null);
        }

        // Fetch payslips - get recent payslips for current user
        try {
          const currentDate = new Date();
          const currentMonth = currentDate.getMonth() + 1;
          const currentYear = currentDate.getFullYear();
          
          // Get payslips for last 6 months
          const payslipPromises = [];
          for (let i = 0; i < 6; i++) {
            let month = currentMonth - i;
            let year = currentYear;
            
            if (month <= 0) {
              month += 12;
              year -= 1;
            }
            
            payslipPromises.push(
              axios.get(
                APIV3Dictionary.payroll.getPayslip(month, year, user.id),
                { withCredentials: true }
              ).catch(() => null) // Continue if payslip doesn't exist
            );
          }
          
          const payslipResponses = await Promise.all(payslipPromises);
          const payslipData = payslipResponses
            .filter(response => response && response.data && response.data.success)
            .map(response => {
              if (!response) return null;
              const data = response.data.data;
              return {
                id: data.id,
                month: data.month,
                year: data.year,
                basicSalary: data.basicSalary,
                netSalary: data.netSalary,
                allowances: data.allowances || {},
                deductions: data.deductions || {},
                status: data.status || 'PROCESSED',
                processedAt: data.processedAt,
                downloadUrl: APIV3Dictionary.payroll.downloadPayslip(data.id)
              };
            })
            .filter(Boolean) as PayslipPreview[];
          
          setPayslips(payslipData);
        } catch (payslipError) {
          console.warn('No payslips found');
          setPayslips([]);
        }

        // Fetch disputes (placeholder - using empty array until backend endpoint is available)
        setDisputes([]);
        
      } catch (error) {
        console.error('Error fetching employee data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load employee data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployeeData();
  }, [user?.id]);

  // Save profile changes
  const saveProfile = async () => {
    if (!user?.id) return;
    
    try {
      setIsSaving(true);
      
      const response = await axios.put(
        APIV3Dictionary.payroll.employee.updateProfile(user.id),
        editedProfile,
        { withCredentials: true }
      );

      if (response.data) {
        setProfile(prev => ({ ...prev!, ...editedProfile }));
        setIsEditing(false);
        
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
      }
      
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save bank details
  const saveBankDetails = async () => {
    if (!user?.id) return;
    
    try {
      setIsSaving(true);
      
      const bankData = {
        ...editedBankDetails,
        userId: user.id
      };
      
      let response;
      if (bankDetails?.id) {
        // Update existing bank details
        response = await axios.put(
          APIV3Dictionary.payroll.employee.updateBankDetails,
          { ...bankData, id: bankDetails.id },
          { withCredentials: true }
        );
      } else {
        // Create new bank details
        response = await axios.post(
          APIV3Dictionary.payroll.employee.createBankDetails,
          bankData,
          { withCredentials: true }
        );
      }

      if (response.data) {
        setBankDetails({
          id: bankDetails?.id || response.data.id || '',
          accountHolder: editedBankDetails.accountHolder || '',
          accountNumber: editedBankDetails.accountNumber || '',
          ifscCode: editedBankDetails.ifscCode || '',
          bankName: editedBankDetails.bankName || '',
          createdAt: bankDetails?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        toast({
          title: 'Success',
          description: 'Bank details updated successfully',
        });
      }
      
    } catch (error) {
      console.error('Error saving bank details:', error);
      toast({
        title: 'Error',
        description: 'Failed to update bank details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Submit dispute
  const submitDispute = async () => {
    if (!selectedPayslip || !disputeForm.reason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for the dispute',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const disputeData = {
        salaryRecordId: selectedPayslip.id,
        reason: disputeForm.reason,
        description: disputeForm.description
      };
      
      const response = await axios.post(
        APIV3Dictionary.payroll.employee.submitDispute,
        disputeData,
        { withCredentials: true }
      );

      if (response.data) {
        const newDispute = response.data.data || response.data;
        setDisputes(prev => [newDispute, ...prev]);
        
        toast({
          title: 'Success',
          description: 'Dispute submitted successfully',
        });
        
        setIsDisputeDialogOpen(false);
        setDisputeForm({ reason: '', description: '' });
        setSelectedPayslip(null);
      }
      
    } catch (error) {
      console.error('Error submitting dispute:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit dispute. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Download payslip
  const downloadPayslip = async (payslip: PayslipPreview) => {
    try {
      const response = await axios.get(
        APIV3Dictionary.payroll.downloadPayslip(payslip.id),
        { 
          responseType: 'blob',
          withCredentials: true 
        }
      );

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${getMonthName(payslip.month)}-${payslip.year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Payslip downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading payslip:', error);
      toast({
        title: 'Error',
        description: 'Failed to download payslip. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PAID': return 'default';
      case 'PROCESSED': return 'secondary';
      case 'PENDING': return 'outline';
      case 'RESOLVED': return 'default';
      case 'UNDER_REVIEW': return 'secondary';
      case 'REJECTED': return 'destructive';
      default: return 'outline';
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

  // Format month name
  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen overflow-y-auto px-8 py-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
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
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Please log in to access employee services</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Employee Self-Service</h1>
          <p className="text-muted-foreground">Manage your profile, view payslips, and access HR services</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="bank-details">Bank Details</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </div>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => {
                    if (isEditing) {
                      saveProfile();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  disabled={isSaving}
                >
                  {isEditing ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editedProfile.firstName || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, firstName: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editedProfile.lastName || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, lastName: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedProfile.email || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <Input
                    id="mobileNumber"
                    value={editedProfile.mobileNumber || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, mobileNumber: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={editedProfile.dateOfBirth || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={editedProfile.emergencyContact || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, emergencyContact: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={editedProfile.address || ''}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>

              <Separator />

              {/* Read-only organizational info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{profile?.employeeId}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{profile?.department.name}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Manager</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{profile?.manager ? `${profile.manager.firstName} ${profile.manager.lastName}` : 'Not assigned'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Hire Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{profile?.hiredDate ? new Date(profile.hiredDate).toLocaleDateString() : 'Not available'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Details Tab */}
        <TabsContent value="bank-details" className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Bank Account Details
              </CardTitle>
              <CardDescription>Update your bank account information for salary payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="accountHolder">Account Holder Name</Label>
                  <Input
                    id="accountHolder"
                    value={editedBankDetails.accountHolder || ''}
                    onChange={(e) => setEditedBankDetails(prev => ({ ...prev, accountHolder: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={editedBankDetails.bankName || ''}
                    onChange={(e) => setEditedBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={editedBankDetails.accountNumber || ''}
                    onChange={(e) => setEditedBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={editedBankDetails.ifscCode || ''}
                    onChange={(e) => setEditedBankDetails(prev => ({ ...prev, ifscCode: e.target.value }))}
                  />
                </div>
              </div>
              
              <Button onClick={saveBankDetails} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Update Bank Details'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payslips Tab */}
        <TabsContent value="payslips" className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Salary History & Payslips
              </CardTitle>
              <CardDescription>View and download your salary slips</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payslips.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No payslips available</p>
                  </div>
                ) : (
                  payslips.map((payslip) => (
                    <div key={payslip.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">
                          {getMonthName(payslip.month)} {payslip.year}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Net Salary: {formatCurrency(payslip.netSalary)}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(payslip.status)}>
                            {payslip.status}
                          </Badge>
                          {payslip.processedAt && (
                            <span className="text-xs text-muted-foreground">
                              Processed: {new Date(payslip.processedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => downloadPayslip(payslip)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPayslip(payslip);
                            setIsDisputeDialogOpen(true);
                          }}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Dispute
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes" className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Salary Disputes
              </CardTitle>
              <CardDescription>Track your salary dispute requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {disputes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No disputes filed</p>
                    <p className="text-sm">All your salary records are in order</p>
                  </div>
                ) : (
                  disputes.map((dispute) => (
                    <div key={dispute.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Dispute #{dispute.id}</h4>
                        <Badge variant={getStatusBadgeVariant(dispute.status)}>
                          {dispute.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reason: {dispute.reason}
                      </p>
                      {dispute.description && (
                        <p className="text-sm">
                          Description: {dispute.description}
                        </p>
                      )}
                      {dispute.resolutionNote && (
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm font-medium">Resolution:</p>
                          <p className="text-sm">{dispute.resolutionNote}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Filed: {new Date(dispute.createdAt).toLocaleDateString()}</span>
                        {dispute.resolvedAt && (
                          <span>Resolved: {new Date(dispute.resolvedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Notification History
              </CardTitle>
              <CardDescription>View your payroll-related notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications</p>
                <p className="text-sm">Payroll notifications will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dispute Dialog */}
      <Dialog open={isDisputeDialogOpen} onOpenChange={setIsDisputeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File Salary Dispute</DialogTitle>
            <DialogDescription>
              Submit a dispute for {selectedPayslip ? `${getMonthName(selectedPayslip.month)} ${selectedPayslip.year}` : 'selected payslip'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dispute-reason">Reason for Dispute</Label>
              <Input
                id="dispute-reason"
                value={disputeForm.reason}
                onChange={(e) => setDisputeForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g., Incorrect overtime calculation"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dispute-description">Description (Optional)</Label>
              <Input
                id="dispute-description"
                value={disputeForm.description}
                onChange={(e) => setDisputeForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide additional details about the issue"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDisputeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitDispute} disabled={isSaving}>
                {isSaving ? 'Submitting...' : 'Submit Dispute'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeSelfServicePortal;
