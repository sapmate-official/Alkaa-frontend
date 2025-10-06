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
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  Building2,
  FileText,
  DollarSign,
  Layers,
  CalendarClock
} from 'lucide-react';
import { useCandidate, useDepartments, useUpdateCandidate } from '@/hooks/queries/useOnboarding';
import { useShiftTemplates } from '@/hooks/queries/useShiftManagement';

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
  shiftTemplateId: z.string().optional(),
  shiftEffectiveDate: z.string().optional(),
  
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
}).refine((data) => {
  if (data.shiftTemplateId) {
    return !!data.shiftEffectiveDate
  }
  return true
}, {
  message: 'Select an effective date for the assigned shift',
  path: ['shiftEffectiveDate']
});

const NO_SHIFT_TEMPLATE_OPTION = '__no_shift__';

interface EditCandidateDialogProps {
  candidateId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditCandidateDialog = ({ candidateId, isOpen, onClose, onSuccess }: EditCandidateDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  // Use TanStack Query hooks
  const { data: candidate, isLoading: candidateLoading } = useCandidate(candidateId);
  const { data: departments } = useDepartments(user?.orgId || '');
  const updateCandidateMutation = useUpdateCandidate();
  const { data: shiftTemplates = [], isLoading: shiftTemplatesLoading } = useShiftTemplates(user?.orgId, !!user?.orgId);

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
  shiftTemplateId: '',
  shiftEffectiveDate: '',
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

  const selectedShiftTemplateId = form.watch('shiftTemplateId');
  const hiredDateValue = form.watch('hiredDate');

  useEffect(() => {
    if (!selectedShiftTemplateId) {
      if (form.getValues('shiftEffectiveDate')) {
        form.setValue('shiftEffectiveDate', '');
      }
      return;
    }

    const currentEffective = form.getValues('shiftEffectiveDate');
    if (!currentEffective && hiredDateValue) {
      form.setValue('shiftEffectiveDate', hiredDateValue);
    }
  }, [selectedShiftTemplateId, hiredDateValue, form]);

  useEffect(() => {
    if (isOpen && candidate) {
      // Populate form with candidate data
      form.reset({
        firstName: candidate.firstName || '',
        lastName: candidate.lastName || '',
        email: candidate.email || '',
        mobileNumber: candidate.mobileNumber || '',
        departmentId: candidate.departmentId || 'none',
        annualPackage: candidate.annualPackage || 0,
        hiredDate: candidate.hiredDate || '',
  shiftTemplateId: candidate.shiftTemplateId || '',
  shiftEffectiveDate: candidate.shiftEffectiveDate ? candidate.shiftEffectiveDate.split('T')[0] : '',
        emergencyContact: candidate.emergencyContact || '',
        dateOfBirth: candidate.dateOfBirth || '',
        address: candidate.address || '',
        adharNumber: candidate.adharNumber || '',
        panNumber: candidate.panNumber || '',
        bankAccountNumber: (candidate as any).bankAccountNumber || '',
        bankIFSC: (candidate as any).bankIFSC || '',
        bankName: (candidate as any).bankName || '',
        accountHolderName: (candidate as any).accountHolderName || '',
      });
    } else if (!isOpen) {
      // Reset form and states when dialog closes
      form.reset();
    }
  }, [candidate, isOpen, form]);

  const onSubmit = async (data: any) => {
    try {
      setSaving(true);
      const payload = {
        ...data,
        shiftTemplateId: data.shiftTemplateId || undefined,
        shiftEffectiveDate: data.shiftTemplateId ? data.shiftEffectiveDate || undefined : undefined,
      };
      await updateCandidateMutation.mutateAsync({ id: candidateId, data: payload });

      toast({
        title: 'Success',
        description: 'Candidate updated successfully',
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error updating candidate:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update candidate',
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

  if (candidateLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading candidate data...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!candidate) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center h-64">
            <p>Candidate not found</p>
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
                          defaultValue={field.value}
                          disabled={!departments || departments.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Department</SelectItem>
                            {departments && departments.length > 0 ? (
                              departments.map((dept: any) => (
                                <SelectItem key={dept.id} value={dept.id}>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="shiftTemplateId"
                    render={({ field }) => {
                      const value = field.value || NO_SHIFT_TEMPLATE_OPTION
                      return (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Layers className="h-4 w-4" />
                            Shift Template
                          </FormLabel>
                          <Select
                            value={value}
                            onValueChange={(val) => field.onChange(val === NO_SHIFT_TEMPLATE_OPTION ? '' : val)}
                            disabled={shiftTemplatesLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={shiftTemplatesLoading ? 'Loading shift templates...' : 'Select shift template'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={NO_SHIFT_TEMPLATE_OPTION}>No shift assignment</SelectItem>
                              {shiftTemplates.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!shiftTemplatesLoading && shiftTemplates.length === 0 && (
                            <FormDescription>No shift templates available for this organization.</FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />

                  {selectedShiftTemplateId && (
                    <FormField
                      control={form.control}
                      name="shiftEffectiveDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4" />
                            Shift Effective Date
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>Defaults to hired date if left blank.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
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
