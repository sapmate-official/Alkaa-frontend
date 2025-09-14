import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { APIDictionary } from '@/services/api/v2/APIdict';
import axios from 'axios';
import { OnboardingCandidate, OnboardingStatus } from '@/types/general';
import {
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  FileText,
  UserCheck,
  Building2,
  Users,
  XCircle,
  Clock
} from 'lucide-react';
import { useParams } from 'react-router-dom';

const onboardingSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  mobileNumber: z.string().min(10, 'Valid mobile number is required'),
  emergencyContact: z.string().min(10, 'Valid emergency contact is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(10, 'Complete address is required'),
  adharNumber: z.string().optional(),
  panNumber: z.string().optional(),
  // Bank Details
  bankAccountNumber: z.string().min(8, 'Valid account number is required'),
  bankIFSC: z.string().min(11, 'Valid IFSC code is required'),
  bankName: z.string().min(2, 'Bank name is required'),
  accountHolderName: z.string().min(2, 'Account holder name is required'),
});

const OnboardingForm = () => {
  const { toast } = useToast();
  const { token } = useParams<{ token: string }>();

  // State
  const [loading, setLoading] = useState(false);
  const [candidate, setCandidate] = useState<OnboardingCandidate | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Form
  const form = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      mobileNumber: '',
      emergencyContact: '',
      dateOfBirth: '',
      address: '',
      adharNumber: '',
      panNumber: '',
      // Bank Details
      bankAccountNumber: '',
      bankIFSC: '',
      bankName: '',
      accountHolderName: '',
    }
  });

  // Verify token and load candidate data
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation token');
      return;
    }
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${APIDictionary.onboarding}/verify/${token}`);
      
      const candidateData = response.data;
      setCandidate(candidateData);
      
      // Pre-fill form with existing data
      if (candidateData.firstName) form.setValue('firstName', candidateData.firstName);
      if (candidateData.lastName) form.setValue('lastName', candidateData.lastName);
      if (candidateData.mobileNumber) form.setValue('mobileNumber', candidateData.mobileNumber);
      if (candidateData.formData?.emergencyContact) form.setValue('emergencyContact', candidateData.formData.emergencyContact);
      if (candidateData.formData?.dateOfBirth) form.setValue('dateOfBirth', candidateData.formData.dateOfBirth.split('T')[0]);
      if (candidateData.formData?.address) form.setValue('address', candidateData.formData.address);
      if (candidateData.formData?.adharNumber) form.setValue('adharNumber', candidateData.formData.adharNumber);
      if (candidateData.formData?.panNumber) form.setValue('panNumber', candidateData.formData.panNumber);
      // Pre-fill bank details if available
      if (candidateData.formData?.bankDetails) {
        const bankDetails = candidateData.formData.bankDetails;
        if (bankDetails.accountNumber) form.setValue('bankAccountNumber', bankDetails.accountNumber);
        if (bankDetails.ifscCode) form.setValue('bankIFSC', bankDetails.ifscCode);
        if (bankDetails.bankName) form.setValue('bankName', bankDetails.bankName);
        if (bankDetails.accountHolderName) form.setValue('accountHolderName', bankDetails.accountHolderName);
      }
      
      // Check if already submitted
      if (candidateData.status !== OnboardingStatus.INVITED) {
        setIsSubmitted(true);
      }
    } catch (error: any) {
      const errorResponse = error?.response?.data;
      
      // Handle aborted process specifically
      if (errorResponse?.aborted) {
        setError('This onboarding process has been aborted. Please refer to a new email or contact your HR department.');
      } else if (errorResponse?.expired) {
        setError('This onboarding invitation has expired. Please contact your HR department for a new invitation.');
      } else {
        setError(errorResponse?.error || 'Failed to verify invitation');
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit form
  const onSubmit = async (data: any) => {
    if (!token || !candidate) return;

    try {
      setLoading(true);
      
      // Structure the data properly including bank details
      const formData = {
        firstName: data.firstName,
        lastName: data.lastName,
        mobileNumber: data.mobileNumber,
        emergencyContact: data.emergencyContact,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        adharNumber: data.adharNumber,
        panNumber: data.panNumber,
        bankDetails: {
          accountNumber: data.bankAccountNumber,
          ifscCode: data.bankIFSC,
          bankName: data.bankName,
          accountHolderName: data.accountHolderName
        }
      };
      
      await axios.post(
        `${APIDictionary.onboarding}/submit/${token}`,
        formData
      );

      toast({
        title: 'Success',
        description: 'Your information has been submitted successfully',
      });
      setIsSubmitted(true);
      setCandidate(prev => prev ? { ...prev, status: OnboardingStatus.FORM_SUBMITTED } : null);
    } catch (error: any) {
      const errorResponse = error?.response?.data;
      
      // Handle aborted process specifically
      if (errorResponse?.aborted) {
        setError('This onboarding process has been aborted. Please refer to a new email or contact your HR department.');
        toast({
          title: 'Process Aborted',
          description: 'This onboarding process has been aborted. Please contact your HR department.',
          variant: 'destructive',
        });
      } else if (errorResponse?.expired) {
        setError('This onboarding invitation has expired. Please contact your HR department for a new invitation.');
        toast({
          title: 'Invitation Expired',
          description: 'This onboarding invitation has expired. Please contact your HR department.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: errorResponse?.error || 'Failed to submit information',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Get status display
  const getStatusDisplay = (status: OnboardingStatus) => {
    switch (status) {
      case OnboardingStatus.INVITED:
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Mail className="h-4 w-4" />,
          text: 'Invitation Received'
        };
      case OnboardingStatus.FORM_SUBMITTED:
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <FileText className="h-4 w-4" />,
          text: 'Form Submitted - Under Review'
        };
      case OnboardingStatus.UNDER_REVIEW:
        return {
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <Users className="h-4 w-4" />,
          text: 'Under Review by HR'
        };
      case OnboardingStatus.REJECTED:
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Changes Requested'
        };
      case OnboardingStatus.APPROVED:
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Approved - Account Setup Pending'
        };
      case OnboardingStatus.ONBOARDED:
        return {
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <UserCheck className="h-4 w-4" />,
          text: 'Onboarding Complete'
        };
      case OnboardingStatus.ABORTED:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <XCircle className="h-4 w-4" />,
          text: 'Onboarding Process Aborted'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Unknown Status'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isAborted = error.includes('aborted');
    const isExpired = error.includes('expired');
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-background">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              {isAborted ? (
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              ) : isExpired ? (
                <Clock className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              ) : (
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              )}
              
              <h2 className="text-2xl font-semibold mb-3">
                {isAborted 
                  ? 'Onboarding Process Aborted' 
                  : isExpired 
                    ? 'Invitation Expired'
                    : 'Invalid Invitation'
                }
              </h2>
              
              <p className="text-muted-foreground mb-4">{error}</p>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  Check your email for a new invitation
                </p>
                <p className="flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact your HR department for assistance
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Need help?</strong><br />
                If this problem persists, please reach out to your HR team or the person who sent you this invitation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted && candidate) {
    const statusDisplay = getStatusDisplay(candidate.status);
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Information Submitted</h2>
              <p className="text-muted-foreground mb-4">
                Thank you for submitting your information. Our HR team will review it shortly.
              </p>
              <Badge 
                variant="outline" 
                className={`flex items-center gap-2 w-fit mx-auto ${statusDisplay.color}`}
              >
                {statusDisplay.icon}
                {statusDisplay.text}
              </Badge>
            </div>

            {candidate.status === OnboardingStatus.REJECTED && candidate.rejectionReason && (
              <Alert className="mb-6 text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Changes Requested:</strong> {candidate.rejectionReason}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personal Information
                  </h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><strong>Name:</strong> {candidate.firstName} {candidate.lastName}</p>
                    <p><strong>Email:</strong> {candidate.email}</p>
                    {candidate.mobileNumber && (
                      <p><strong>Mobile:</strong> {candidate.mobileNumber}</p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Job Information
                  </h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><strong>Organization:</strong> {candidate.organizationName || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>What's Next?</strong><br />
                Our HR team will review your information within 1-2 business days. 
                You will receive an email notification once the review is complete.
              </p>
            </div>

            {candidate.status === OnboardingStatus.REJECTED && (
              <Button 
                className="mt-4" 
                onClick={() => {
                  setIsSubmitted(false);
                  window.scrollTo(0, 0);
                }}
              >
                Update Information
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!candidate) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <UserCheck className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Welcome to Alkaa!</h1>
              <p className="text-muted-foreground">
                Please complete your onboarding information to get started.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span>{candidate.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Organization:</span>
                <span>{candidate.organizationName || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          First Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Last Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Mobile Number
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+91 9876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Emergency Contact
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+91 9876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Personal Details */}
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date of Birth
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Address
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Complete address with pincode" 
                          {...field} 
                          className="min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bank Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Bank Account Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bankAccountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Account Number
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="1234567890123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bankIFSC"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            IFSC Code
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="ABCD0123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Bank Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="State Bank of India" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="accountHolderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Account Holder Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="As per bank records" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Optional Documents */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Identity Documents (Optional)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="adharNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Aadhar Number
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="1234 5678 9012" {...field} />
                          </FormControl>
                          <FormDescription>
                            Optional - for faster KYC processing
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="panNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            PAN Number
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="ABCDE1234F" {...field} />
                          </FormControl>
                          <FormDescription>
                            Optional - for tax documentation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Change Request Message */}
                {candidate.status === OnboardingStatus.REJECTED && candidate.rejectionReason && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Changes Requested:</strong> {candidate.rejectionReason}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end pt-6">
                  <Button type="submit" disabled={loading} className="min-w-[120px]">
                    {loading ? 'Submitting...' : 'Submit Information'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingForm;
