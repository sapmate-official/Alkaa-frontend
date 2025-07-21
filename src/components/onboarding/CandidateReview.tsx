import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { APIDictionary } from '@/api/v2/APIdict';
import axios from 'axios';
import {
  User,
  Mail,
  Calendar,
  CreditCard,
  Building2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  UserCheck,
  Edit3,
  Eye
} from 'lucide-react';

interface ReviewData {
  candidateInfo: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    mobileNumber: string;
    status: string;
    createdAt: string;
    formSubmittedAt: string;
  };
  initialData: {
    annualPackage: number;
    hiredDate: string;
    departmentId: string;
    department: any;
  };
  submittedData: {
    personalInfo: {
      firstName: string;
      lastName: string;
      mobileNumber: string;
      emergencyContact: string;
      dateOfBirth: string;
      address: string;
      adharNumber: string;
      panNumber: string;
    };
    bankDetails: {
      accountNumber?: string;
      ifscCode?: string;
      bankName?: string;
      accountHolderName?: string;
    };
  };
  validationStatus: {
    personalInfoComplete: boolean;
    bankDetailsComplete: boolean;
    documentsProvided: boolean;
    readyForApproval: boolean;
  };
  dataComparison: {
    firstName: { initial: string; submitted: string; changed: boolean };
    lastName: { initial: string; submitted: string; changed: boolean };
    mobileNumber: { initial: string; submitted: string; changed: boolean };
  };
  reviewHistory: {
    reviewedBy: any;
    reviewedAt: string;
    rejectionReason: string;
  };
  metadata: {
    createdBy: any;
    organization: any;
    tokenExpiry: string;
  };
}

interface CandidateReviewProps {
  candidateId: string;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete?: () => void;
}

const CandidateReview = ({ candidateId, isOpen, onClose, onActionComplete }: CandidateReviewProps) => {
  const { toast } = useToast();
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Action dialogs
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showChangeRequestDialog, setShowChangeRequestDialog] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (isOpen && candidateId) {
      fetchReviewData();
    }
  }, [candidateId, isOpen]);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${APIDictionary.onboarding}/${candidateId}/review`,
        { withCredentials: true }
      );
      setReviewData(response.data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load candidate review data',
        variant: 'destructive',
      });
      console.error('Error fetching review data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await axios.post(
        `${APIDictionary.onboarding}/${candidateId}/approve`,
        {},
        { withCredentials: true }
      );
      
      toast({
        title: 'Success',
        description: 'Candidate approved successfully',
      });
      
      setShowApproveDialog(false);
      onActionComplete?.();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to approve candidate',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    try {
      setActionLoading(true);
      await axios.post(
        `${APIDictionary.onboarding}/${candidateId}/reject`,
        { reason: feedback },
        { withCredentials: true }
      );
      
      toast({
        title: 'Success',
        description: 'Candidate rejected successfully',
      });
      
      setShowRejectDialog(false);
      setFeedback('');
      onActionComplete?.();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to reject candidate',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!feedback.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide feedback for requested changes',
        variant: 'destructive',
      });
      return;
    }

    try {
      setActionLoading(true);
      await axios.post(
        `${APIDictionary.onboarding}/${candidateId}/request-changes`,
        { feedback },
        { withCredentials: true }
      );
      
      toast({
        title: 'Success',
        description: 'Change request sent to candidate successfully',
      });
      
      setShowChangeRequestDialog(false);
      setFeedback('');
      onActionComplete?.();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to request changes',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      INVITED: { variant: 'secondary', label: 'Invited', icon: Clock },
      FORM_SUBMITTED: { variant: 'default', label: 'Submitted', icon: FileText },
      UNDER_REVIEW: { variant: 'outline', label: 'Under Review', icon: Eye },
      APPROVED: { variant: 'default', label: 'Approved', icon: CheckCircle },
      REJECTED: { variant: 'destructive', label: 'Rejected', icon: XCircle },
      ONBOARDED: { variant: 'default', label: 'Onboarded', icon: UserCheck }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INVITED;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading candidate review data...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!reviewData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="text-center p-8">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground">Unable to load candidate review data.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { candidateInfo, submittedData, validationStatus, dataComparison, initialData, reviewHistory, metadata } = reviewData;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">
                  Review Candidate: {candidateInfo.firstName} {candidateInfo.lastName}
                </DialogTitle>
                <DialogDescription>
                  Complete review of submitted onboarding information
                </DialogDescription>
              </div>
              {getStatusBadge(candidateInfo.status)}
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Validation Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Submission Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    {validationStatus.personalInfoComplete ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">Personal Info</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {validationStatus.bankDetailsComplete ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">Bank Details</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {validationStatus.documentsProvided ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="text-sm">Documents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {validationStatus.readyForApproval ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">Ready for Review</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Candidate Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Candidate Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Email:</span>
                      <span>{candidateInfo.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Department:</span>
                      <span>{initialData.department?.name || 'Not assigned'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Form Submitted:</span>
                      <span>{candidateInfo.formSubmittedAt ? formatDate(candidateInfo.formSubmittedAt) : 'Not submitted'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Annual Package:</span>
                      <span>{initialData.annualPackage ? `₹${initialData.annualPackage.toLocaleString()}` : 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Created by:</span>
                      <span>{metadata.createdBy.firstName} {metadata.createdBy.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Hired Date:</span>
                      <span>{initialData.hiredDate ? new Date(initialData.hiredDate).toLocaleDateString() : 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Comparison */}
            {(dataComparison.firstName.changed || dataComparison.lastName.changed || dataComparison.mobileNumber.changed) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="h-5 w-5" />
                    Data Changes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dataComparison.firstName.changed && (
                      <div className="flex items-center gap-4 p-3 bg-yellow-50 rounded-lg">
                        <span className="font-medium">First Name:</span>
                        <span className="text-red-600 line-through">{dataComparison.firstName.initial}</span>
                        <span className="text-green-600">→ {dataComparison.firstName.submitted}</span>
                      </div>
                    )}
                    {dataComparison.lastName.changed && (
                      <div className="flex items-center gap-4 p-3 bg-yellow-50 rounded-lg">
                        <span className="font-medium">Last Name:</span>
                        <span className="text-red-600 line-through">{dataComparison.lastName.initial}</span>
                        <span className="text-green-600">→ {dataComparison.lastName.submitted}</span>
                      </div>
                    )}
                    {dataComparison.mobileNumber.changed && (
                      <div className="flex items-center gap-4 p-3 bg-yellow-50 rounded-lg">
                        <span className="font-medium">Mobile Number:</span>
                        <span className="text-red-600 line-through">{dataComparison.mobileNumber.initial}</span>
                        <span className="text-green-600">→ {dataComparison.mobileNumber.submitted}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                      <p className="text-sm">{submittedData.personalInfo.firstName} {submittedData.personalInfo.lastName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Mobile Number</Label>
                      <p className="text-sm">{submittedData.personalInfo.mobileNumber}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Emergency Contact</Label>
                      <p className="text-sm">{submittedData.personalInfo.emergencyContact || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                      <p className="text-sm">{submittedData.personalInfo.dateOfBirth ? new Date(submittedData.personalInfo.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Aadhar Number</Label>
                      <p className="text-sm">{submittedData.personalInfo.adharNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">PAN Number</Label>
                      <p className="text-sm">{submittedData.personalInfo.panNumber || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                <Separator className="my-4" />
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                  <p className="text-sm mt-1">{submittedData.personalInfo.address || 'Not provided'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Bank Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Account Number</Label>
                      <p className="text-sm font-mono">{submittedData.bankDetails.accountNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">IFSC Code</Label>
                      <p className="text-sm font-mono">{submittedData.bankDetails.ifscCode || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Bank Name</Label>
                      <p className="text-sm">{submittedData.bankDetails.bankName || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Account Holder Name</Label>
                      <p className="text-sm">{submittedData.bankDetails.accountHolderName || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review History */}
            {reviewHistory.reviewedBy && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Review History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Reviewed by:</span>
                      <span>{reviewHistory.reviewedBy.firstName} {reviewHistory.reviewedBy.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Review Date:</span>
                      <span>{formatDate(reviewHistory.reviewedAt)}</span>
                    </div>
                    {reviewHistory.rejectionReason && (
                      <div>
                        <span className="font-medium">Feedback:</span>
                        <p className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
                          {reviewHistory.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            {candidateInfo.status === 'FORM_SUBMITTED' && (
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowChangeRequestDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Request Changes
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Candidate</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve {candidateInfo.firstName} {candidateInfo.lastName} for onboarding?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={actionLoading}>
              {actionLoading ? 'Approving...' : 'Approve'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Candidate</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this candidate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Rejection Reason</Label>
              <Textarea
                id="reject-reason"
                placeholder="Please explain why this candidate is being rejected..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRejectDialog(false);
                  setFeedback('');
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Changes Dialog */}
      <Dialog open={showChangeRequestDialog} onOpenChange={setShowChangeRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Specify what changes need to be made to the candidate's information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="change-feedback">Requested Changes</Label>
              <Textarea
                id="change-feedback"
                placeholder="Please specify what changes are needed..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowChangeRequestDialog(false);
                  setFeedback('');
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRequestChanges}
                disabled={actionLoading}
              >
                {actionLoading ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CandidateReview;
