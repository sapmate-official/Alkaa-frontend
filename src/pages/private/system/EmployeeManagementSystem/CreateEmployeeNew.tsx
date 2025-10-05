import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts';
import axios from 'axios';
import { Department, User } from '@/types/general';
import RoleAssignment from './RoleAssignment';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader,
  RefreshCw,
  Sparkles,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  Building,
  DollarSign,
  Percent,
  BriefcaseBusiness,
  ShieldCheck,
  BadgeCheck,
  Users,
  FileSpreadsheet,
  Briefcase,
  Calculator
} from 'lucide-react';
import { motion } from 'framer-motion';
import { debounce } from 'lodash';

const MANUAL_TEMPLATE_OPTION = '__manual__';

type SalaryTemplateSummary = {
  id: string;
  name: string;
  description?: string | null;
  isDefault?: boolean | null;
};

const basicDetailsSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  mobileNumber: z.string().min(10, 'Invalid mobile number'),
  emergencyContact: z.string(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(1, 'Address is required'),
  adharNumber: z.string().optional(),
  panNumber: z.string().optional(),
  employeeId: z.string().optional(),
  hiredDate: z.string().nonempty('Hired Date is required'),
});

const bankDetailsSchema = z.object({
  accountHolder: z.string().min(1, 'Account holder name is required'),
  accountNumber: z.string().min(9, 'Invalid account number'),
  ifscCode: z.string().min(11, 'Invalid IFSC code'),
  bankName: z.string().min(1, 'Bank name is required'),
});

const salaryDetailsSchema = z.object({
  annualPackage: z.number().min(0, 'Annual package must be positive'),
  monthlySalary: z.number().min(0, 'Monthly salary must be positive'),
  salaryTemplateId: z.string().optional(),
  hraPercentage: z.number().min(0).max(100),
  daPercentage: z.number().min(0).max(100),
  taPercentage: z.number().min(0).max(100),
  pfPercentage: z.number().min(0).max(100),
  taxPercentage: z.number().min(0).max(100),
  insuranceFixed: z.number().min(0),
});

const roleAssignmentSchema = z.object({
  departmentId: z.string().optional(),
  roleIds: z.array(z.string()).min(1, 'At least one role must be selected'),
  managerId: z.string().optional(),
});

const formSchemas = [
  basicDetailsSchema,
  bankDetailsSchema,
  salaryDetailsSchema,
  roleAssignmentSchema,
] as const;

const steps = [
  'Basic Details',
  'Bank Details',
  'Salary Details',
  'Role Assignment',
] as const;

type EmployeeFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  emergencyContact: string;
  dateOfBirth: string;
  address: string;
  adharNumber: string;
  panNumber: string;
  employeeId: string;
  hiredDate: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  annualPackage: number;
  monthlySalary: number;
  salaryTemplateId?: string;
  hraPercentage: number;
  daPercentage: number;
  taPercentage: number;
  pfPercentage: number;
  taxPercentage: number;
  insuranceFixed: number;
  departmentId: string;
  roleIds: string[];
  managerId: string;
};

const CreateEmployeeNew = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [salaryTemplates, setSalaryTemplates] = useState<SalaryTemplateSummary[]>([]);
  const [salaryTemplatesLoading, setSalaryTemplatesLoading] = useState(false);
  const [salaryTemplateError, setSalaryTemplateError] = useState<string | null>(null);
  const hasAppliedDefaultTemplateRef = useRef(false);
  const [useHeadAsManager, setUseHeadAsManager] = useState(false);
  const [employeeIdExists, setEmployeeIdExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDraftModified, setIsDraftModified] = useState(false);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        `${APIDictionary.department}/org/${user?.orgId}`,
        { withCredentials: true }
      );
      setDepartments(response.data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to fetch departments',
        variant: 'destructive',
      });
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${APIDictionary.Organization}/employee-list/${user?.orgId}`,
        { withCredentials: true }
      );
      setEmployees(response.data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to fetch employees',
        variant: 'destructive',
      });
    }
  };

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(formSchemas[currentStep] as unknown as z.ZodType<EmployeeFormValues>),
    defaultValues: {
      // Basic Details
      firstName: '',
      lastName: '',
      email: '',
      mobileNumber: '',
      emergencyContact: '',
      dateOfBirth: '',
      address: '',
      adharNumber: '',
      panNumber: '',
      employeeId: '',
      hiredDate: '',

      // Bank Details
      accountHolder: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',

      // Salary Details
      annualPackage: 0,
      monthlySalary: 0,
      salaryTemplateId: undefined,
      hraPercentage: 0,
      daPercentage: 0,
      taPercentage: 0,
      pfPercentage: 0,
      taxPercentage: 0,
      insuranceFixed: 0,

      // Role Assignment
      departmentId: '',
      roleIds: [],
      managerId: user?.id?.toString() || '',
    }
  });

  const fetchSalaryTemplates = useCallback(async () => {
    if (!user?.orgId) {
      return;
    }

    setSalaryTemplatesLoading(true);
    setSalaryTemplateError(null);

    try {
      const response = await axios.get(APIV3Dictionary.payroll.templates.list, {
        withCredentials: true
      });

      const payload = response.data as {
        success?: boolean;
        data?: SalaryTemplateSummary[];
        message?: string;
      };

      if (payload?.success === false) {
        setSalaryTemplates([]);
        setSalaryTemplateError(payload.message || 'Failed to load salary templates');
        return;
      }

      if (Array.isArray(payload?.data)) {
        setSalaryTemplates(payload.data);

        const currentValue = form.getValues('salaryTemplateId');
        if (!currentValue && !hasAppliedDefaultTemplateRef.current) {
          const defaultTemplate = payload.data.find(template => template.isDefault);
          if (defaultTemplate) {
            form.setValue('salaryTemplateId', defaultTemplate.id);
            hasAppliedDefaultTemplateRef.current = true;
          }
        }
      } else {
        setSalaryTemplates([]);
      }
    } catch (error) {
      console.error('Failed to load salary templates:', error);
      setSalaryTemplateError('Failed to load salary templates');
      setSalaryTemplates([]);
    } finally {
      setSalaryTemplatesLoading(false);
    }
  }, [user?.orgId, form]);

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
    fetchEmployeeId();
    fetchSalaryTemplates();
  }, [user?.orgId, fetchSalaryTemplates]);

  const fetchEmployeeId = async () => {
    try {
      if (!user?.orgId) {
        toast({
          title: 'Error',
          description: 'Organization ID not found',
          variant: 'destructive',
        });
        return;
      }
      const response = await axios.get(
        `${APIDictionary.Organization}/employees/employee-id/${user?.orgId}/`,
        { withCredentials: true }
      );
      form.setValue('employeeId', response.data?.employeeId);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    }
  };

  const checkEmployeeId = async (employeeId: string) => {
    try {
      if (!user?.orgId) {
        toast({
          title: 'Error',
          description: 'Organization ID not found',
          variant: 'destructive',
        });
        return;
      }
      if (!employeeId) {
        setEmployeeIdExists(false);
        return false;
      }
      const response = await axios.get(
        `${APIDictionary.Organization}/employees/employee-id/${user?.orgId}/check/${employeeId}`,
        { withCredentials: true }
      );
      setEmployeeIdExists(response.data?.exists);
      return response.data?.exists;
    }
    catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    }
  };

  // Load draft from localStorage on initial load
  useEffect(() => {
    const savedDraft = localStorage.getItem(`employee-draft-${user?.id}`);
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        // Check if the draft is recent enough (e.g., within the last 24 hours)
        const draftDate = new Date(parsedDraft.timestamp);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (draftDate > yesterday) {
          // Ask user if they want to restore the draft
          if (window.confirm('Would you like to restore your previous draft?')) {
            form.reset(parsedDraft.formData);
            setCurrentStep(parsedDraft.step || 0);
            setDraftId(parsedDraft.id || null);
            setLastSaved(draftDate);
          } else {
            // Clear the localStorage if they don't want to restore
            localStorage.removeItem(`employee-draft-${user?.id}`);
          }
        } else {
          // Remove old drafts
          localStorage.removeItem(`employee-draft-${user?.id}`);
        }
      } catch (error) {
        console.error("Failed to parse saved draft:", error);
      }
    }
  }, [user?.id]);

  // Auto-save functionality with debounce
  const autoSaveDraft = useCallback(
    debounce(() => {
      const formData = form.getValues();
      const draftData = {
        formData,
        step: currentStep,
        timestamp: new Date().toISOString(),
        id: draftId
      };
      localStorage.setItem(`employee-draft-${user?.id}`, JSON.stringify(draftData));
      setLastSaved(new Date());
      setIsDraftModified(false);
    }, 3000), // Auto-save after 3 seconds of inactivity
    [form, currentStep, draftId, user?.id]
  );
  
  // Watch for form changes to trigger auto-save
  useEffect(() => {
    const subscription = form.watch(() => {
      setIsDraftModified(true);
      autoSaveDraft();
    });
    
    return () => subscription.unsubscribe();
  }, [form, autoSaveDraft]);

  // Function to explicitly save draft to backend
  // const saveDraftToServer = async () => {
  //   if (!user?.orgId) {
  //     toast({
  //       title: 'Error',
  //       description: 'Organization ID not found',
  //       variant: 'destructive',
  //     });
  //     return;
  //   }
    
  //   try {
  //     setLoading(true);
  //     const formData = form.getValues();
      
  //     const endpoint = draftId 
  //       ? `${APIDictionary.Organization}/employees/draft/${draftId}`
  //       : `${APIDictionary.Organization}/employees/draft`;
      
  //     const method = draftId ? 'PUT' : 'POST';
      
  //     const response = await axios({
  //       method,
  //       url: endpoint,
  //       data: {
  //         formData,
  //         step: currentStep,
  //         orgId: user.orgId,
  //         userId: user.id
  //       },
  //       withCredentials: true
  //     });
      
  //     if (response.status === 201 || response.status === 200) {
  //       setDraftId(response.data.id);
  //       setLastSaved(new Date());
  //       setIsDraftModified(false);
        
  //       toast({
  //         title: 'Draft Saved',
  //         description: 'Your progress has been saved. You can resume later.',
  //       });
  //     }
  //   } catch (error: any) {
  //     toast({
  //       title: 'Error',
  //       description: error?.response?.data?.error || 'Failed to save draft',
  //       variant: 'destructive',
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const onSubmit = async (data: any) => {
    try {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
        return;
      }

      // Final submission
      if (!user?.orgId) {
        toast({
          title: 'Error',
          description: 'Organization ID not found',
          variant: 'destructive',
        });
        return;
      }
      console.log(form.getValues());
      console.log(data);
      data = form.getValues();
      if (data.employeeId === '' || data.employeeId === null || data.employeeId === undefined) {
        data.employeeId = user?.id;
      }
      setLoading(true);
      const response = await axios.post(`${APIDictionary.Organization}/employees`, {
        data,
        orgId: user.orgId,
      });
      if (response.status == 201) {
        toast({
          title: 'Success',
          description: 'Employee created successfully',
        });
        form.reset();
        setCurrentStep(0);
      } else {
        toast({
          title: 'Error',
          description: 'Try Again',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || error?.response?.data?.message || 'Failed to create employee',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleDepartmentsUpdated = (updatedDepartments: any[]) => {
    // Use the properly typed Department interface from your import
    setDepartments(updatedDepartments as Department[]);
    
    // If there are departments and none is currently selected, select the first one
    if (updatedDepartments.length > 0 && !form.getValues('departmentId')) {
      form.setValue('departmentId', updatedDepartments[0].id);
    }
    
    toast({
      title: 'Departments Updated',
      description: 'The department list has been refreshed',
    });
  };

  const renderFormStep = () => {
    return (
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {currentStep === 0 && renderBasicDetailsStep()}
        {currentStep === 1 && renderBankDetailsStep()}
        {currentStep === 2 && renderSalaryDetailsStep()}
        {currentStep === 3 && renderRoleAssignmentStep()}
      </motion.div>
    );
  };

  const renderBasicDetailsStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
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
                <UserIcon className="h-4 w-4" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <FormField
          control={form.control}
          name="emergencyContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Emergency Phone Number
              </FormLabel>
              <FormControl>
                <Input placeholder="+91 9876543210" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          name="hiredDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4" />
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
              <Textarea placeholder="Enter complete address" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="adharNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4" />
                Aadhar Number
              </FormLabel>
              <FormControl>
                <Input placeholder="Optional" {...field} />
              </FormControl>
              <FormDescription className="text-xs">Optional</FormDescription>
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
                <FileSpreadsheet className="h-4 w-4" />
                PAN Number
              </FormLabel>
              <FormControl>
                <Input placeholder="Optional" {...field} />
              </FormControl>
              <FormDescription className="text-xs">Optional</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="employeeId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Employee ID
            </FormLabel>
            <div className="flex gap-2">
              <FormControl className="flex-grow">
                <Input
                  {...field}
                  onChange={async (e) => {
                    field.onChange(e);
                    await checkEmployeeId(e.target.value);
                  }}
                  className={`focus:ring-2 ${employeeIdExists ? "border-red-500 focus:ring-red-200" : "focus:ring-blue-200"}`}
                  placeholder="EMP-001"
                />
              </FormControl>
              <Button 
                type="button"
                onClick={fetchEmployeeId}
                variant="outline"
                className="hover:bg-primary hover:text-white transition-colors"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Generate</span>
              </Button>
            </div>
            {employeeIdExists && (
              <div className="text-sm text-red-500 mt-1 flex items-center gap-1">
                <span className="text-xs">⚠️</span> This Employee ID already exists
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderBankDetailsStep = () => (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg mb-6">
        <h3 className="text-md font-medium mb-2 flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Bank Account Information
        </h3>
        <p className="text-sm text-muted-foreground">
          Employee bank details are required for salary disbursement. Please ensure the information is accurate.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="accountHolder"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Account Holder Name
              </FormLabel>
              <FormControl>
                <Input placeholder="Full name as per bank records" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="bankName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Bank Name
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., HDFC Bank, SBI" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="accountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Account Number
              </FormLabel>
              <FormControl>
                <Input placeholder="Bank account number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="ifscCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                IFSC Code
              </FormLabel>
              <FormControl>
                <Input placeholder="XXXX0000000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderSalaryDetailsStep = () => {
    const selectedTemplateId = form.watch('salaryTemplateId');
    const selectValue = selectedTemplateId ?? MANUAL_TEMPLATE_OPTION;

    return (
      <div className="space-y-6">
        <div className="bg-muted/50 p-4 rounded-lg mb-6">
          <h3 className="text-md font-medium mb-2 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Salary Structure
          </h3>
          <p className="text-sm text-muted-foreground">
            Define the core compensation and optionally apply a preconfigured salary template.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="0"
                    {...field}
                    onChange={e => {
                      const value = parseFloat(e.target.value);
                      field.onChange(value);
                      if (!isNaN(value)) {
                        const monthly = parseFloat((value / 12).toFixed(2));
                        form.setValue('monthlySalary', monthly);
                      }
                    }}
                    className="text-right"
                  />
                </FormControl>
                <div className="flex items-center mt-1 text-xs text-muted-foreground">
                  <Calculator className="h-3 w-3 mr-1" />
                  <span>Annual = Monthly × 12</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="monthlySalary"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Monthly Salary
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={e => {
                      const value = parseFloat(e.target.value);
                      field.onChange(value);
                      if (!isNaN(value)) {
                        const annual = parseFloat((value * 12).toFixed(2));
                        form.setValue('annualPackage', annual);
                      }
                    }}
                    className="text-right"
                  />
                </FormControl>
                <div className="flex items-center mt-1 text-xs text-muted-foreground">
                  <Calculator className="h-3 w-3 mr-1" />
                  <span>Monthly = Annual ÷ 12</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="salaryTemplateId"
          render={({ field }) => {
            const handleChange = (value: string) => {
              field.onChange(value === MANUAL_TEMPLATE_OPTION ? undefined : value);
            };

            return (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Salary Template
                </FormLabel>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <Select
                    onValueChange={handleChange}
                    value={selectValue}
                    disabled={salaryTemplatesLoading && salaryTemplates.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full sm:w-72">
                        <SelectValue placeholder="Select salary template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={MANUAL_TEMPLATE_OPTION}>Manual configuration</SelectItem>
                      {salaryTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}{template.isDefault ? ' (Default)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fetchSalaryTemplates()}
                    disabled={salaryTemplatesLoading}
                  >
                    {salaryTemplatesLoading ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <FormDescription>
                  Choose a template to auto-apply allowances and deductions, or stay on manual configuration.
                </FormDescription>
                {salaryTemplateError && (
                  <p className="text-sm text-destructive">{salaryTemplateError}</p>
                )}
                {salaryTemplates.length === 0 && !salaryTemplatesLoading && (
                  <p className="text-xs text-muted-foreground">
                    No salary templates found. Configure them in the payroll workspace to enable automatic structures.
                  </p>
                )}
              </FormItem>
            );
          }}
        />

        {selectedTemplateId ? (
          <div className="rounded-md border border-dashed border-muted/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            Allowances and deductions will be managed by the selected template. You can review or update the template from the payroll admin workspace.
          </div>
        ) : (
          <>
            <div className="border-t border-b border-muted py-4 my-6">
              <h4 className="text-sm font-medium mb-4">Allowances (% of monthly salary)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="hraPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        HRA Percentage
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="daPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        DA Percentage
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        TA Percentage
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-b border-muted pb-6">
              <h4 className="text-sm font-medium mb-4">Deductions</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="pfPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        PF Percentage
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Tax Percentage
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="insuranceFixed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Insurance (Fixed)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderRoleAssignmentStep = () => (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg mb-6">
        <h3 className="text-md font-medium mb-2 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Organizational Position
        </h3>
        <p className="text-sm text-muted-foreground">
          Assign the employee to appropriate department and roles within the organization.
        </p>
      </div>
      
      <FormField
        control={form.control}
        name="departmentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Department
            </FormLabel>
            <Select onValueChange={(value) => {
              field.onChange(value);
              // Reset head manager checkbox if department has no head
              const selectedDept = departments?.find(dept => dept?.id === value);
              if (!selectedDept?.headId) {
                setUseHeadAsManager(false);
              }
            }} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {departments?.map((dept) => (
                  <SelectItem key={dept?.id} value={dept?.id}>
                    {dept?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="p-4 border border-muted rounded-md">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="useHeadAsManager"
            checked={useHeadAsManager}
            disabled={!departments?.find(dept => dept?.id === form.getValues("departmentId"))?.headId}
            onCheckedChange={(checked) => {
              setUseHeadAsManager(checked as boolean);
              if (checked) {
                const selectedDept = departments?.find(
                  (dept) => dept?.id === form.getValues("departmentId")
                );
                if (selectedDept?.headId) {
                  form.setValue("managerId", selectedDept.headId);
                }
              } else {
                form.setValue("managerId", user?.id?.toString() || '');
              }
            }}
            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
          <label 
            htmlFor="useHeadAsManager"
            className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${!departments?.find(dept => dept?.id === form.getValues("departmentId"))?.headId ? "text-muted-foreground" : ""}`}
          >
            Use department head as manager
          </label>
        </div>
        
        {!useHeadAsManager && (
          <div className="mt-4">
            <FormField
              control={form.control}
              name="managerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Manager
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees?.map((emp) => (
                        <SelectItem key={emp?.id} value={emp?.id}>
                          {`${emp?.firstName} ${emp?.lastName}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>

      <FormField
        control={form.control}
        name="roleIds"
        render={({ field }) => (
          <FormItem className="mt-4">
            <FormLabel className="flex items-center gap-2 mb-2">
              <Briefcase className="h-4 w-4" />
              Role Assignment
            </FormLabel>
            <div className="space-y-2 border border-muted rounded-md p-4">
              <RoleAssignment 
                setRoleId={roleId => {
                  field.onChange([roleId]);
                }}
                onDepartmentCreated={handleDepartmentsUpdated}
              />
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  return (
    <div className="mx-auto p-4 w-full h-full overflow-y-scroll">
      <Card className="shadow-md border-muted/40">
        <CardHeader className="bg-muted/10">
          <CardTitle className="text-xl font-semibold text-center sm:text-left flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Create New Employee
            {lastSaved && !isDraftModified && (
              <span className="ml-auto text-xs text-muted-foreground">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {isDraftModified && (
              <span className="ml-auto text-xs text-amber-500">
                Unsaved changes
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Enhanced Progress Indicator */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-between">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className={`flex flex-col items-center mb-4 ${
                    index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                      index < currentStep
                        ? 'bg-primary text-white'
                        : index === currentStep
                        ? 'border-2 border-primary bg-primary/10 text-primary'
                        : 'border-2 border-muted-foreground/30 bg-muted/20'
                    }`}
                  >
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  <span className="text-sm font-medium">{step}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 h-2 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {renderFormStep()}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t border-muted/30">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onPrevious}
                    disabled={currentStep === 0}
                    className="min-w-[100px] transition-all"
                  >
                    <span className="mr-2">←</span> Previous
                  </Button>
                  
                  {/* <Button
                    type="button"
                    variant="secondary"
                    onClick={saveDraftToServer}
                    disabled={loading}
                    className="min-w-[100px] transition-all"
                  >
                    {loading ? (
                      <Loader className='animate-spin mr-2' />
                    ) : (
                      <>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-4 w-4 mr-2" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" 
                          />
                        </svg>
                        Save Draft
                      </>
                    )}
                  </Button> */}
                </div>
                
                <Button 
                  type="submit" 
                  className="min-w-[100px] bg-primary hover:bg-primary/90 transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader className='animate-spin mr-2' />
                  ) : currentStep === steps.length - 1 ? (
                    <>Create Employee</>
                  ) : (
                    <>Next <span className="ml-2">→</span></>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateEmployeeNew;