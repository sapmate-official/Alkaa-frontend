import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { APIDictionary } from '@/api/v2/APIdict';
import axios from 'axios';
import { 
  OnboardingCandidate, 
  OnboardingStatus, 
  Department 
} from '@/interface/general';
import {
  Mail,
  Phone,
  Calendar,
  Building,
  Clock,
  CheckCircle,
  Edit3,
  X,
  Eye,
  UserCheck,
  MessageCircle
} from 'lucide-react';

interface CandidateReviewData {
  candidateInfo: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    mobileNumber?: string;
    status: OnboardingStatus;
    createdAt: string;
    formSubmittedAt?: string;
  };
  initialData: {
    annualPackage?: number;
    hiredDate?: string;
    departmentId?: string;
    department?: Department;
  };
  submittedData: {
    personalInfo: {
      firstName: string;
      lastName: string;
      mobileNumber?: string;
      emergencyContact?: string;
      dateOfBirth?: string;
      address?: string;
      adharNumber?: string;
      panNumber?: string;
    };
    bankDetails: {
      accountNumber?: string;
      ifscCode?: string;
      bankName?: string;
      accountHolderName?: string;
    };
    documents?: any;
    additionalInfo?: any;
  };
  reviewHistory: {
    reviewedBy?: any;
    reviewedAt?: string;
    rejectionReason?: string;
  };
  metadata: {
    createdBy: any;
    organization: any;
    tokenExpiry?: string;
    verificationToken?: string;
  };
}

const reviewFormSchema = z.object({
  action: z.enum(['approve', 'request_changes', 'reject']),
  feedback: z.string().optional(),
  updatedData: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    mobileNumber: z.string().optional(),
    annualPackage: z.number().optional(),
    departmentId: z.string().optional(),
  }).optional(),
});

interface CandidateReviewDialogProps {
  candidate: OnboardingCandidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewComplete: () => void;
  departments: Department[];
}

export const CandidateReviewDialog: React.FC<CandidateReviewDialogProps> = ({
  candidate,
  open,
  onOpenChange,
  onReviewComplete
}) => {
  const { toast } = useToast();
  const [reviewData, setReviewData] = useState<CandidateReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const form = useForm<z.infer<typeof reviewFormSchema>>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      action: 'approve' as const,
      feedback: '',
    }
  });

  // Fetch detailed review data when candidate changes
  useEffect(() => {
    const fetchReviewData = async () => {
      if (!candidate?.id) return;

      try {
        setLoading(true);
        const response = await axios.get(
          `${APIDictionary.onboarding}/${candidate.id}/review`,
          { withCredentials: true }
        );

        if (response.data.success) {
          setReviewData(response.data.data);
        }
      } catch (error: any) {
        console.error('Error fetching review data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load candidate details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (open && candidate?.id) {
      fetchReviewData();
    }
  }, [candidate?.id, open, toast]);

  // Handle review submission
  const handleReview = async (data: any) => {
    if (!candidate?.id) return;

    try {
      setLoading(true);
      let endpoint = '';
      let payload: any = {};

      switch (data.action) {
        case 'approve':
          endpoint = `${APIDictionary.onboarding}/${candidate.id}/approve`;
          break;
        case 'request_changes':
          endpoint = `${APIDictionary.onboarding}/${candidate.id}/request-changes`;
          payload = { feedback: data.feedback };
          break;
        case 'reject':
          endpoint = `${APIDictionary.onboarding}/${candidate.id}/reject`;
          payload = { reason: data.feedback };
          break;
      }

      await axios.post(endpoint, payload, { withCredentials: true });

      toast({
        title: 'Success',
        description: `Candidate ${data.action.replace('_', ' ')}d successfully`,
      });

      onReviewComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error processing review:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to process review',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Mark candidate under review
  const markUnderReview = async () => {
    if (!candidate?.id) return;

    try {
      setLoading(true);
      await axios.post(
        `${APIDictionary.onboarding}/${candidate.id}/mark-review`,
        {},
        { withCredentials: true }
      );

      toast({
        title: 'Success',
        description: 'Candidate marked under review',
      });

      onReviewComplete();
    } catch (error: any) {
      console.error('Error marking under review:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark candidate under review',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!reviewData && loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading candidate details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!reviewData) return null;

  const { candidateInfo, initialData, submittedData, reviewHistory, metadata } = reviewData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Review Candidate: {candidateInfo.firstName} {candidateInfo.lastName}
          </DialogTitle>
          <DialogDescription>
            Review all submitted information and decide on the next action.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="documents">Documents & Bank</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="overview" className="space-y-4">
                {/* Status and Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Candidate Status</span>
                      <Badge 
                        variant={candidateInfo.status === 'FORM_SUBMITTED' ? 'default' : 'secondary'}
                        className="text-sm"
                      >
                        {candidateInfo.status.replace('_', ' ')}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-sm flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {candidateInfo.email}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Mobile</label>
                        <p className="text-sm flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {submittedData.personalInfo.mobileNumber || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                        <p className="text-sm flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(candidateInfo.createdAt)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Form Submitted</label>
                        <p className="text-sm flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {formatDate(candidateInfo.formSubmittedAt)}
                        </p>
                      </div>
                    </div>

                    {candidateInfo.status === 'FORM_SUBMITTED' && (
                      <div className="pt-4">
                        <Button
                          onClick={markUnderReview}
                          disabled={loading}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Mark Under Review
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleReview)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="action"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Review Decision</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select action" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="approve">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      Approve
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="request_changes">
                                    <div className="flex items-center gap-2">
                                      <MessageCircle className="h-4 w-4 text-yellow-500" />
                                      Request Changes
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="reject">
                                    <div className="flex items-center gap-2">
                                      <X className="h-4 w-4 text-red-500" />
                                      Reject
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {(() => {
                          const currentAction = form.watch('action') as 'approve' | 'request_changes' | 'reject';
                          const showField = currentAction === 'request_changes' || currentAction === 'reject';
                          
                          if (!showField) return null;
                          
                          return (
                            <FormField
                              control={form.control}
                              name="feedback"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {currentAction === 'request_changes' ? 'Feedback' : 'Rejection Reason'}
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder={
                                        currentAction === 'request_changes' 
                                          ? "Provide feedback for changes needed..."
                                          : "Provide reason for rejection..."
                                      }
                                      className="resize-none"
                                      rows={3}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          );
                        })()}

                        <Button type="submit" disabled={loading} className="w-full">
                          {loading ? 'Processing...' : 'Submit Review'}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="personal" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Personal Information
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditMode(editMode === 'personal' ? null : 'personal')}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">First Name</label>
                        <p className="text-sm">{submittedData.personalInfo.firstName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                        <p className="text-sm">{submittedData.personalInfo.lastName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                        <p className="text-sm">{formatDate(submittedData.personalInfo.dateOfBirth)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
                        <p className="text-sm">{submittedData.personalInfo.emergencyContact || 'Not provided'}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">Address</label>
                        <p className="text-sm">{submittedData.personalInfo.address || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Aadhar Number</label>
                        <p className="text-sm font-mono">
                          {submittedData.personalInfo.adharNumber || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">PAN Number</label>
                        <p className="text-sm font-mono">
                          {submittedData.personalInfo.panNumber || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="professional" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Department</label>
                        <p className="text-sm flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {initialData.department?.name || 'Not assigned'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Annual Package</label>
                        <p className="text-sm">{formatCurrency(initialData.annualPackage)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Hire Date</label>
                        <p className="text-sm">{formatDate(initialData.hiredDate)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Created By</label>
                        <p className="text-sm">
                          {metadata.createdBy?.firstName} {metadata.createdBy?.lastName}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Bank Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                        <p className="text-sm font-mono">
                          {submittedData.bankDetails.accountNumber ? 
                            `****${submittedData.bankDetails.accountNumber.slice(-4)}` : 
                            'Not provided'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">IFSC Code</label>
                        <p className="text-sm font-mono">{submittedData.bankDetails.ifscCode || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
                        <p className="text-sm">{submittedData.bankDetails.bankName || 'Not provided'}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">Account Holder Name</label>
                        <p className="text-sm">{submittedData.bankDetails.accountHolderName || 'Not provided'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {reviewHistory.rejectionReason && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-600">Previous Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{reviewHistory.rejectionReason}</p>
                      {reviewHistory.reviewedBy && (
                        <p className="text-xs text-muted-foreground mt-2">
                          By: {reviewHistory.reviewedBy.firstName} {reviewHistory.reviewedBy.lastName} on {formatDate(reviewHistory.reviewedAt)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateReviewDialog;
