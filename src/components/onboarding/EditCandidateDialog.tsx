import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthContext';
import { APIDictionary } from '@/services/api/v2/APIdict';
import { Department } from '@/types/general';
import axios from 'axios';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  Building2,
  FileText,
  DollarSign
} from 'lucide-react';

const editCandidateSchema = z.object({
  // Basic Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  mobileNumber: z.string().min(10, 'Valid mobile number is required'),
  
  // Job Information
  departmentId: z.string().transform(val => val === '' ? 'none' : val).optional(),
  annualPackage: z.number().min(0, 'Annual package must be positive').optional(),
  hiredDate: z.string().optional(),
  
  // Personal Information (from form data)
  emergencyContact: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  adharNumber: z.string().optional(),
  panNumber: z.string().optional(),
  
  // Bank Details
  bankAccountNumber: z.string().optional(),
  bankIFSC: z.string().optional(),
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
});

interface EditCandidateDialogProps {
  candidateId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditCandidateDialog = ({ candidateId, isOpen, onClose, onSuccess }: EditCandidateDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  
  const form = useForm({
    resolver: zodResolver(editCandidateSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      mobileNumber: '',
      departmentId: 'none',
      annualPackage: 0,
      hiredDate: '',
      emergencyContact: '',
      dateOfBirth: '',
      address: '',
      adharNumber: '',
      panNumber: '',
      bankAccountNumber: '',
      bankIFSC: '',
      bankName: '',
      accountHolderName: '',
    },
  });

  useEffect(() => {
    if (isOpen && candidateId) {
      fetchCandidateData();
      fetchDepartments();
    } else if (!isOpen) {
      // Reset form and states when dialog closes
      form.reset();
      setDepartments([]);
    }
  }, [candidateId, isOpen]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${APIDictionary.department}/org/${user?.orgId}`, {
        withCredentials: true,
      });
      const departmentData = response.data || [];
      console.log('Fetched departments:', departmentData);
      
      // Filter out any departments with invalid IDs
      const validDepartments: Department[] = departmentData.filter((dept: any): dept is Department => 
        dept && dept.id && dept.id.toString().trim() !== ''
      );
      
      setDepartments(validDepartments);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchCandidateData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${APIDictionary.onboarding}/${candidateId}`,
        { withCredentials: true }
      );
      
      const candidate = response.data;
      
      // Populate basic information
      form.setValue('firstName', candidate.firstName || '');
      form.setValue('lastName', candidate.lastName || '');
      form.setValue('email', candidate.email || '');
      form.setValue('mobileNumber', candidate.mobileNumber || '');
      
      // Ensure departmentId is never an empty string
      const departmentId = candidate.departmentId && candidate.departmentId.toString().trim() !== '' 
        ? candidate.departmentId.toString() 
        : 'none';
      form.setValue('departmentId', departmentId);
      
      form.setValue('annualPackage', candidate.annualPackage || 0);
      form.setValue('hiredDate', candidate.hiredDate ? candidate.hiredDate.split('T')[0] : '');
      
      // Populate form data if available
      const formData = candidate.formData || {};
      form.setValue('emergencyContact', formData.emergencyContact || '');
      form.setValue('dateOfBirth', formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : '');
      form.setValue('address', formData.address || '');
      form.setValue('adharNumber', formData.adharNumber || '');
      form.setValue('panNumber', formData.panNumber || '');
      
      // Populate bank details if available
      const bankDetails = formData.bankDetails || {};
      form.setValue('bankAccountNumber', bankDetails.accountNumber || '');
      form.setValue('bankIFSC', bankDetails.ifscCode || '');
      form.setValue('bankName', bankDetails.bankName || '');
      form.setValue('accountHolderName', bankDetails.accountHolderName || '');
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load candidate data',
        variant: 'destructive',
      });
      console.error('Error fetching candidate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setSaving(true);
      
      const updatePayload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        mobileNumber: data.mobileNumber,
        departmentId: data.departmentId && data.departmentId !== 'none' && data.departmentId.toString().trim() !== '' 
          ? data.departmentId.toString() 
          : undefined,
        annualPackage: data.annualPackage || undefined,
        hiredDate: data.hiredDate || undefined,
        // Personal information
        emergencyContact: data.emergencyContact,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        adharNumber: data.adharNumber,
        panNumber: data.panNumber,
        // Bank details
        bankAccountNumber: data.bankAccountNumber,
        bankIFSC: data.bankIFSC,
        bankName: data.bankName,
        accountHolderName: data.accountHolderName,
      };

      await axios.put(
        `${APIDictionary.onboarding}/${candidateId}`,
        updatePayload,
        { withCredentials: true }
      );

      toast({
        title: 'Success',
        description: 'Candidate information updated successfully',
      });
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to update candidate',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading candidate data...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Candidate Information</DialogTitle>
          <DialogDescription>
            Update candidate details, personal information, and bank details
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
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
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john.doe@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                </div>
              </CardContent>
            </Card>

            {/* Job Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Job Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || 'none'}
                          disabled={departments.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Department</SelectItem>
                            {departments.length > 0 ? (
                              departments
                                .filter(dept => dept.id && dept.id.toString().trim() !== '')
                                .map((dept) => (
                                  <SelectItem key={dept.id} value={dept.id.toString()}>
                                    {dept.name}
                                  </SelectItem>
                                ))
                            ) : (
                              <SelectItem value="loading" disabled>
                                Loading departments...
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="annualPackage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Annual Package
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500000"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hiredDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Hired Date
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
                
                <div className="mt-4">
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
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="adharNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Aadhar Number
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="1234 5678 9012" {...field} />
                        </FormControl>
                        <FormDescription>Optional - for KYC purposes</FormDescription>
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
                        <FormDescription>Optional - for tax documentation</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankAccountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
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
                        <FormLabel>IFSC Code</FormLabel>
                        <FormControl>
                          <Input placeholder="ABCD0123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
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
                        <FormLabel>Account Holder Name</FormLabel>
                        <FormControl>
                          <Input placeholder="As per bank records" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCandidateDialog;
