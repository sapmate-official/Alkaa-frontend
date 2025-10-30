import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthContext';
import { APIDictionary } from '@/services/api/v2/APIdict';
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts';
import axios from 'axios';
import {
  OnboardingCandidate,
  OnboardingStatus,
  Department,
  User
} from '@/types/general';
import { EmploymentType, EMPLOYMENT_TYPE_LABELS } from '@/types/employmentType';
import CandidateReview from './CandidateReview';
import EditCandidateDialog from './EditCandidateDialog';
import RoleSelector from './RoleSelector';
import { useShiftTemplates } from '@/hooks/queries/useShiftManagement';
import {
  UserPlus,
  Send,
  Eye,
  Check,
  X,
  UserCheck,
  Clock,
  Mail,
  Users,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  Trash2,
  FileSearch,
  Settings,
  Edit3,
  FileSpreadsheet,
  RefreshCw,
  Loader,
  Layers,
  CalendarClock
} from 'lucide-react';

// Import the new comprehensive review dialog

// Interface for manager dropdown options
interface ManagerOption extends Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'status'> {
  department?: {
    id: string;
    name: string;
  };
}

const isValidDepartment = (dept: unknown): dept is Department => {
  if (typeof dept !== 'object' || dept === null) return false;
  const candidate = dept as Partial<Department>;
  return typeof candidate.id !== 'undefined' && String(candidate.id).trim().length > 0;
};

type SalaryTemplateSummary = {
  id: string;
  name: string;
  description?: string | null;
  isDefault?: boolean | null;
};

const MANUAL_TEMPLATE_OPTION = '__manual__';
const NO_SHIFT_TEMPLATE_OPTION = '__no_shift__';

const candidateSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  annualPackage: z.number().min(0, 'Package must be positive').optional(),
  monthlySalary: z.number().min(0, 'Monthly salary must be positive').optional(),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  hiredDate: z.string().optional(),
  employmentType: z.nativeEnum(EmploymentType, {
    required_error: 'Employment type is required',
  }),
  contractEndDate: z.string().optional(),
  shiftTemplateId: z.string().optional(),
  shiftEffectiveDate: z.string().optional(),
}).refine((data) => {
  if (data.shiftTemplateId) {
    return !!data.shiftEffectiveDate
  }
  return true
}, {
  message: 'Select an effective date when assigning a shift template',
  path: ['shiftEffectiveDate']
}).refine((data) => {
  // Validate that CONTRACT, CONSULTANT, and INTERN types have contract end date
  if ([EmploymentType.CONTRACT, EmploymentType.CONSULTANT, EmploymentType.INTERN].includes(data.employmentType)) {
    return !!data.contractEndDate;
  }
  return true;
}, {
  message: 'Contract end date is required for Contract, Consultant, and Intern employees',
  path: ['contractEndDate']
});

const OnboardingManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [candidates, setCandidates] = useState<OnboardingCandidate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<OnboardingCandidate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isComprehensiveReviewOpen, setIsComprehensiveReviewOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OnboardingStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [salaryTemplates, setSalaryTemplates] = useState<SalaryTemplateSummary[]>([]);
  const [salaryTemplatesLoading, setSalaryTemplatesLoading] = useState(false);
  const [salaryTemplateError, setSalaryTemplateError] = useState<string | null>(null);
  const [hasUserChosenTemplate, setHasUserChosenTemplate] = useState(false);
  const hasUserChosenTemplateRef = useRef(hasUserChosenTemplate);
  const { data: shiftTemplates = [], isLoading: shiftTemplatesLoading } = useShiftTemplates(user?.orgId, !!user?.orgId);

  type CompletionData = {
    departmentId: string;
    roleId: string;
    managerId: string;
    monthlySalary: number;
    annualPackage: number;
    salaryTemplateId?: string;
    shiftTemplateId?: string;
    shiftEffectiveDate?: string;
  };

  useEffect(() => {
    hasUserChosenTemplateRef.current = hasUserChosenTemplate;
  }, [hasUserChosenTemplate]);

  // Form
  const form = useForm({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      annualPackage: 0,
      monthlySalary: 0,
      departmentId: '',
      managerId: '',
      hiredDate: '',
      employmentType: EmploymentType.FULL_TIME,
      contractEndDate: '',
      shiftTemplateId: '',
      shiftEffectiveDate: '',
    }
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

    const currentEffectiveDate = form.getValues('shiftEffectiveDate');
    if (!currentEffectiveDate && hiredDateValue) {
      form.setValue('shiftEffectiveDate', hiredDateValue);
    }
  }, [selectedShiftTemplateId, hiredDateValue, form]);

  // Auto-calculate salary fields
  const handleAnnualPackageChange = (value: number) => {
    form.setValue('annualPackage', value);
    if (value > 0) {
      form.setValue('monthlySalary', Math.round(value / 12));
    }
  };

  const handleMonthlySalaryChange = (value: number) => {
    form.setValue('monthlySalary', value);
    if (value > 0) {
      form.setValue('annualPackage', value * 12);
    }
  };


  const fetchCandidates = useCallback(async () => {
    try {
      const response = await axios.get(`${APIDictionary.onboarding}`, {
        withCredentials: true
      });
      setCandidates(response.data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to fetch candidates',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchDepartments = useCallback(async () => {
    try {
      if (!user?.orgId) {
        setDepartments([]);
        return;
      }

      const response = await axios.get(`${APIDictionary.department}/org/${user.orgId}`, {
        withCredentials: true,
      });
      const departmentData = Array.isArray(response.data) ? response.data : [];
      console.log('Fetched departments:', departmentData);
      
      // Filter out any departments with invalid IDs
      const validDepartments = departmentData.filter(isValidDepartment);
      
      setDepartments(validDepartments);
    } catch (error) {
      console.error(error);
    }
  }, [user?.orgId]);

  const fetchManagers = useCallback(async () => {
    try {
      if (!user?.orgId) {
        console.error('No organization ID available for user:', user);
        setManagers([]);
        return;
      }
      
      console.log('Fetching managers for orgId:', user.orgId);
      const response = await axios.get(`${APIDictionary.user}/org/${user.orgId}`, {
        withCredentials: true,
      });
      
      console.log('Raw API response:', response.data);
      
      // Filter users who can be managers (active employees, excluding current user)
      const potentialManagers = (response.data || []).filter((employee: User) => 
        employee.status === 'active' 
      ) as ManagerOption[];
      
      console.log('Filtered potential managers:', potentialManagers);
      setManagers(potentialManagers);
    } catch (error) {
      console.error('Error fetching managers:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Error Response:', error.response?.data);
        console.error('API Error Status:', error.response?.status);
      }
    }
  }, [user]);

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

        if (!hasUserChosenTemplateRef.current) {
          const defaultTemplate = payload.data.find(template => template.isDefault);
          const fallbackTemplate = defaultTemplate || payload.data[0];

          if (fallbackTemplate) {
            setCompletionData(prev => {
              if (prev.salaryTemplateId) {
                return prev;
              }

              return {
                ...prev,
                salaryTemplateId: fallbackTemplate.id
              };
            });
            setHasUserChosenTemplate(true);
            hasUserChosenTemplateRef.current = true;
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
  }, [user?.orgId]);

  useEffect(() => {
    console.log('OnboardingManagement useEffect - User:', user);
    fetchCandidates();
    fetchDepartments();
    fetchManagers();
    fetchSalaryTemplates();
  }, [user, fetchCandidates, fetchDepartments, fetchManagers, fetchSalaryTemplates]);

  // Create candidate
  const onSubmit = async (data: z.infer<typeof candidateSchema>) => {
    try {
      setLoading(true);
      
      const payload = {
        ...data,
        orgId: user?.orgId,
        createdById: user?.id,
      };

      if (!payload.shiftTemplateId) {
        delete payload.shiftTemplateId;
        delete payload.shiftEffectiveDate;
      }

      const response = await axios.post(`${APIDictionary.onboarding}`, payload, {
        withCredentials: true,
      });

      if (response.status === 201) {
        toast({
          title: 'Success',
          description: 'Candidate created successfully',
        });
        form.reset();
        setIsCreateDialogOpen(false);
        fetchCandidates();
      }
    } catch (error) {
      console.error('Error creating candidate:', error);
      toast({
        title: 'Error',
        description: axios.isAxiosError(error) 
          ? (error.response?.data?.error || 'Failed to create candidate')
          : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Send invitation
  const sendInvitation = async (candidateId: string) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${APIDictionary.onboarding}/${candidateId}/invite`,
        {},
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast({
          title: 'Success',
          description: 'Invitation sent successfully',
        });
        fetchCandidates();
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: axios.isAxiosError(error) 
          ? (error.response?.data?.error || 'Failed to send invitation')
          : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Approve candidate
  const approveCandidate = async (candidateId: string) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${APIDictionary.onboarding}/${candidateId}/approve`,
        {},
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast({
          title: 'Success',
          description: 'Candidate approved successfully',
        });
        setIsReviewDialogOpen(false);
        fetchCandidates();
      }
    } catch (error) {
      console.error('Error approving candidate:', error);
      toast({
        title: 'Error',
        description: axios.isAxiosError(error) 
          ? (error.response?.data?.error || 'Failed to approve candidate')
          : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Request changes
  const requestChanges = async (candidateId: string, reason: string) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${APIDictionary.onboarding}/${candidateId}/request-changes`,
        { feedback: reason },
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast({
          title: 'Success',
          description: 'Change request sent to candidate',
        });
        setIsReviewDialogOpen(false);
        setRejectionReason('');
        fetchCandidates();
      }
    } catch (error) {
      console.error('Error requesting changes:', error);
      toast({
        title: 'Error',
        description: axios.isAxiosError(error) 
          ? (error.response?.data?.error || 'Failed to request changes')
          : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Complete onboarding
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completionData, setCompletionData] = useState<CompletionData>({
    departmentId: '',
    roleId: '',
    managerId: '',
    monthlySalary: 0,
    annualPackage: 0,
    salaryTemplateId: undefined,
    shiftTemplateId: undefined,
    shiftEffectiveDate: undefined
  });

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${APIDictionary.role}/org/${user?.orgId}`, {
        withCredentials: true
      });
      // We'll use the response data directly in the dialog
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      return [];
    }
  };

  const completeOnboarding = async (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    // Pre-fill with existing data if available
    setCompletionData({
      departmentId: candidate.departmentId || '',
      roleId: '',
      managerId: candidate.managerId || '',
      monthlySalary: candidate.monthlySalary || (candidate.annualPackage ? candidate.annualPackage / 12 : 0),
      annualPackage: candidate.annualPackage || (candidate.monthlySalary ? candidate.monthlySalary * 12 : 0),
      salaryTemplateId: candidate.salaryTemplateId || undefined,
      shiftTemplateId: candidate.shiftTemplateId || undefined,
      shiftEffectiveDate: candidate.shiftEffectiveDate ? candidate.shiftEffectiveDate.split('T')[0] : undefined
    });

  const candidateTemplateSelected = Boolean(candidate.salaryTemplateId);
  setHasUserChosenTemplate(candidateTemplateSelected);
  hasUserChosenTemplateRef.current = candidateTemplateSelected;

    await fetchRoles();
    await fetchSalaryTemplates();
    setSelectedCandidate(candidate);
    setIsCompleteDialogOpen(true);
  };

  useEffect(() => {
    if (!completionData.shiftTemplateId) {
      if (completionData.shiftEffectiveDate) {
        setCompletionData(prev => ({ ...prev, shiftEffectiveDate: undefined }));
      }
      return;
    }

    if (!completionData.shiftEffectiveDate) {
      const defaultDate = selectedCandidate?.hiredDate ? new Date(selectedCandidate.hiredDate).toISOString().split('T')[0] : undefined;
      if (defaultDate) {
        setCompletionData(prev => ({ ...prev, shiftEffectiveDate: defaultDate }));
      }
    }
  }, [completionData.shiftTemplateId, completionData.shiftEffectiveDate, selectedCandidate?.hiredDate]);

  const submitCompletion = async () => {
    if (!completionData.roleId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a role for the employee',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const payload = { ...completionData } as CompletionData;
      if (!payload.salaryTemplateId) {
        delete payload.salaryTemplateId;
      }
      if (!payload.shiftTemplateId) {
        delete payload.shiftTemplateId;
        delete payload.shiftEffectiveDate;
      }
      const response = await axios.post(
        `${APIDictionary.onboarding}/${selectedCandidate?.id}/complete`,
        payload,
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast({
          title: 'Success',
          description: 'Onboarding completed. Employee account created.',
        });
        setIsCompleteDialogOpen(false);
        setHasUserChosenTemplate(false);
        hasUserChosenTemplateRef.current = false;
        fetchCandidates();
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Error',
        description: axios.isAxiosError(error) 
          ? (error.response?.data?.error || 'Failed to complete onboarding')
          : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete candidate (only for unresponsive candidates)
  const deleteCandidate = async (candidateId: string, candidateName: string) => {
    if (!window.confirm(`Are you sure you want to abort the onboarding process for ${candidateName}? This action cannot be undone and will invalidate their invitation link.`)) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${APIDictionary.onboarding}/${candidateId}`, {
        withCredentials: true
      });
      
      toast({
        title: 'Success',
        description: 'Candidate onboarding process aborted',
      });
      fetchCandidates();
    } catch (error) {
      console.error('Error deleting candidate:', error);
      toast({
        title: 'Error',
        description: axios.isAxiosError(error) 
          ? (error.response?.data?.error || 'Failed to abort onboarding process')
          : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Open comprehensive review
  const openComprehensiveReview = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setIsComprehensiveReviewOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setIsEditDialogOpen(true);
  };

  // Handle review completion
  const handleReviewComplete = () => {
    fetchCandidates();
  };

  // Handle edit completion
  const handleEditComplete = () => {
    fetchCandidates();
  };

  // Filter and search
  const filteredCandidates = candidates.filter(candidate => {
    const matchesStatus = statusFilter === 'ALL' || candidate.status === statusFilter;
    const matchesSearch = 
      candidate.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Status styling
  const getStatusColor = (status: OnboardingStatus) => {
    switch (status) {
      case OnboardingStatus.INVITED:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case OnboardingStatus.FORM_SUBMITTED:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OnboardingStatus.UNDER_REVIEW:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case OnboardingStatus.REJECTED:
        return 'bg-red-100 text-red-800 border-red-200';
      case OnboardingStatus.APPROVED:
        return 'bg-green-100 text-green-800 border-green-200';
      case OnboardingStatus.ONBOARDED:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case OnboardingStatus.ABORTED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: OnboardingStatus) => {
    switch (status) {
      case OnboardingStatus.INVITED:
        return <Mail className="h-3 w-3" />;
      case OnboardingStatus.FORM_SUBMITTED:
        return <Timer className="h-3 w-3" />;
      case OnboardingStatus.UNDER_REVIEW:
        return <Clock className="h-3 w-3" />;
      case OnboardingStatus.REJECTED:
        return <XCircle className="h-3 w-3" />;
      case OnboardingStatus.APPROVED:
        return <CheckCircle className="h-3 w-3" />;
      case OnboardingStatus.ONBOARDED:
        return <UserCheck className="h-3 w-3" />;
      case OnboardingStatus.ABORTED:
        return <XCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Onboarding Management
          </h1>
          <p className="text-muted-foreground">
            Manage candidate onboarding process from invitation to completion
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Candidate
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: OnboardingStatus | 'ALL') => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value={OnboardingStatus.INVITED}>Invited</SelectItem>
                <SelectItem value={OnboardingStatus.FORM_SUBMITTED}>Form Submitted</SelectItem>
                <SelectItem value={OnboardingStatus.UNDER_REVIEW}>Under Review</SelectItem>
                <SelectItem value={OnboardingStatus.REJECTED}>Rejected</SelectItem>
                <SelectItem value={OnboardingStatus.APPROVED}>Approved</SelectItem>
                <SelectItem value={OnboardingStatus.ONBOARDED}>Onboarded</SelectItem>
                <SelectItem value={OnboardingStatus.ABORTED}>Aborted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Candidates ({filteredCandidates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <div className="font-medium">
                        {candidate.firstName && candidate.lastName
                          ? `${candidate.firstName} ${candidate.lastName}`
                          : 'Not provided'}
                      </div>
                    </TableCell>
                    <TableCell>{candidate.email}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1 ${getStatusColor(candidate.status)}`}
                      >
                        {getStatusIcon(candidate.status)}
                        {candidate.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {candidate.department?.name || 'Not assigned'}
                    </TableCell>
                    <TableCell>
                      {candidate.annualPackage 
                        ? `₹${candidate.annualPackage.toLocaleString()}`
                        : 'Not set'
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(candidate.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setIsDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {candidate.status === OnboardingStatus.INVITED && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(candidate.id)}
                              title="Edit candidate information"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => sendInvitation(candidate.id)}
                              disabled={loading}
                              title="Resend invitation"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCandidate(candidate.id, `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || candidate.email)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-700"
                              title="Abort onboarding process for unresponsive candidate"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {candidate.status === OnboardingStatus.FORM_SUBMITTED && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openComprehensiveReview(candidate.id)}
                              title="Comprehensive Review"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <FileSearch className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setIsReviewDialogOpen(true);
                              }}
                              title="Quick Review"
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(candidate.id)}
                              title="Edit submitted information"
                              className="text-green-600 hover:text-green-700"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {candidate.status === OnboardingStatus.UNDER_REVIEW && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              setIsComprehensiveReviewOpen(true);
                            }}
                            title="Continue Review"
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {candidate.status === OnboardingStatus.APPROVED && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => completeOnboarding(candidate.id)}
                            disabled={loading}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredCandidates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No candidates found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Candidate Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] overflow-hidden p-0">
          <div className="flex max-h-[85vh] flex-col">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>Add New Candidate</DialogTitle>
              <DialogDescription>
                Create a new onboarding candidate. An invitation will be sent to their email.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                  
          <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments
                          .filter(dept => dept.id && dept.id.toString().trim() !== '')
                          .map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

          <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {managers.length === 0 && (
                          <SelectItem value="none" disabled>
                            {user?.orgId ? 'No managers found' : 'Loading managers...'}
                          </SelectItem>
                        )}
                        {managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.firstName} {manager.lastName} ({manager.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="annualPackage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Package</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="500000"
                          {...field}
                          onChange={e => {
                            const value = parseFloat(e.target.value) || 0;
                            handleAnnualPackageChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthlySalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Salary</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="41667"
                          {...field}
                          onChange={e => {
                            const value = parseFloat(e.target.value) || 0;
                            handleMonthlySalaryChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
          </div>

          <FormField
                control={form.control}
                name="hiredDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hired Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="employmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employment Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('employmentType') && 
             [EmploymentType.CONTRACT, EmploymentType.CONSULTANT, EmploymentType.INTERN].includes(form.watch('employmentType') as EmploymentType) && (
              <FormField
                control={form.control}
                name="contractEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <FormField
                control={form.control}
                name="shiftTemplateId"
                render={({ field }) => {
                  const value = field.value || NO_SHIFT_TEMPLATE_OPTION;
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
                        <p className="text-xs text-muted-foreground">
                          No shift templates available. Configure them from organization settings.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
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
                      <FormMessage />
                    </FormItem>
                  )}
                    />
                  )}
                </div>

                <div className="flex flex-shrink-0 justify-end gap-2 border-t px-6 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Candidate'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Candidate Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm">
                    {selectedCandidate.firstName && selectedCandidate.lastName
                      ? `${selectedCandidate.firstName} ${selectedCandidate.lastName}`
                      : 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{selectedCandidate.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge 
                    variant="outline" 
                    className={`flex items-center gap-1 w-fit ${getStatusColor(selectedCandidate.status)}`}
                  >
                    {getStatusIcon(selectedCandidate.status)}
                    {selectedCandidate.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <p className="text-sm">{selectedCandidate.department?.name || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Annual Package</label>
                  <p className="text-sm">
                    {selectedCandidate.annualPackage 
                      ? `₹${selectedCandidate.annualPackage.toLocaleString()}`
                      : 'Not set'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Shift Template</label>
                  <p className="text-sm">{selectedCandidate.shiftTemplate?.name || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Shift Effective Date</label>
                  <p className="text-sm">
                    {selectedCandidate.shiftEffectiveDate
                      ? new Date(selectedCandidate.shiftEffectiveDate).toLocaleDateString()
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Hired Date</label>
                  <p className="text-sm">
                    {selectedCandidate.hiredDate
                      ? new Date(selectedCandidate.hiredDate).toLocaleDateString()
                      : 'Not set'
                    }
                  </p>
                </div>
              </div>
              
              {selectedCandidate.mobileNumber && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                  <p className="text-sm">{selectedCandidate.mobileNumber}</p>
                </div>
              )}
              
              {selectedCandidate.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="text-sm">{selectedCandidate.address}</p>
                </div>
              )}
              
              {selectedCandidate.rejectionReason && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rejection Reason</label>
                  <p className="text-sm text-red-600">{selectedCandidate.rejectionReason}</p>
                </div>
              )}
              
              {selectedCandidate.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm">{selectedCandidate.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Review Candidate</DialogTitle>
            <DialogDescription>
              Review the candidate's submitted information and decide to approve or request changes.
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Candidate Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2">
                      {selectedCandidate.firstName && selectedCandidate.lastName
                        ? `${selectedCandidate.firstName} ${selectedCandidate.lastName}`
                        : 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <span className="ml-2">{selectedCandidate.email}</span>
                  </div>
                  {selectedCandidate.mobileNumber && (
                    <div>
                      <span className="text-muted-foreground">Mobile:</span>
                      <span className="ml-2">{selectedCandidate.mobileNumber}</span>
                    </div>
                  )}
                  {selectedCandidate.dateOfBirth && (
                    <div>
                      <span className="text-muted-foreground">DOB:</span>
                      <span className="ml-2">
                        {new Date(selectedCandidate.dateOfBirth).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <Textarea
                  placeholder="Reason for rejection (optional)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReviewDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => requestChanges(selectedCandidate.id, rejectionReason)}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Request Changes
                </Button>
                <Button
                  onClick={() => approveCandidate(selectedCandidate.id)}
                  disabled={loading}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Onboarding Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Onboarding</DialogTitle>
            <DialogDescription>
              Assign department and role to complete the onboarding process for {selectedCandidate?.firstName} {selectedCandidate?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCandidate && (
            <div className="space-y-6">
              {/* Candidate Summary */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Candidate Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2 font-medium">{selectedCandidate.firstName} {selectedCandidate.lastName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <span className="ml-2">{selectedCandidate.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Annual Package:</span>
                    <span className="ml-2">{selectedCandidate.annualPackage ? `₹${selectedCandidate.annualPackage.toLocaleString()}` : 'Not set'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Hired Date:</span>
                    <span className="ml-2">{selectedCandidate.hiredDate ? new Date(selectedCandidate.hiredDate).toLocaleDateString() : 'Not set'}</span>
                  </div>
                </div>
              </div>

              {/* Department Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Department *</label>
                <select
                  value={completionData.departmentId}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, departmentId: e.target.value }))}
                  className="w-full p-2 border rounded-md bg-background"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Selection */}
              <RoleSelector
                value={completionData.roleId}
                onChange={(roleId) => setCompletionData(prev => ({ ...prev, roleId }))}
                onRoleCreated={fetchRoles}
              />

              {/* Salary Template */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Salary Template
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <Select
                    value={completionData.salaryTemplateId ?? MANUAL_TEMPLATE_OPTION}
                    onValueChange={(value) => {
                      setHasUserChosenTemplate(true);
                      hasUserChosenTemplateRef.current = true;
                      setCompletionData(prev => ({
                        ...prev,
                        salaryTemplateId: value === MANUAL_TEMPLATE_OPTION ? undefined : value
                      }));
                    }}
                    disabled={salaryTemplatesLoading && salaryTemplates.length === 0}
                  >
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue placeholder="Select salary template" />
                    </SelectTrigger>
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
                    onClick={fetchSalaryTemplates}
                    disabled={salaryTemplatesLoading}
                  >
                    {salaryTemplatesLoading ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Templates auto-apply allowances and deductions. Leave on manual configuration to manage parameters later.
                </p>
                {salaryTemplateError && (
                  <p className="text-xs text-destructive">{salaryTemplateError}</p>
                )}
                {salaryTemplates.length === 0 && !salaryTemplatesLoading && (
                  <p className="text-xs text-muted-foreground">
                    No salary templates available yet. Configure them from the payroll workspace to enable automatic structures.
                  </p>
                )}
              </div>

              {/* Monthly Salary */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Monthly Salary (Optional)</label>
                <input
                  type="number"
                  value={completionData.monthlySalary}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, monthlySalary: parseFloat(e.target.value) || 0 }))}
                  placeholder="Enter monthly salary"
                  className="w-full p-2 border rounded-md bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Will be auto-calculated from annual package if not provided
                </p>
                {completionData.salaryTemplateId && (
                  <p className="text-xs text-muted-foreground">
                    The selected template will apply allowances and deductions based on this monthly amount.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCompleteDialogOpen(false);
                    setHasUserChosenTemplate(false);
                    hasUserChosenTemplateRef.current = false;
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitCompletion}
                  disabled={loading || !completionData.departmentId || !completionData.roleId}
                >
                  {loading ? 'Processing...' : 'Complete Onboarding'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comprehensive Review Dialog */}
      <CandidateReview
        candidateId={selectedCandidateId}
        isOpen={isComprehensiveReviewOpen}
        onClose={() => setIsComprehensiveReviewOpen(false)}
        onActionComplete={handleReviewComplete}
      />

      {/* Edit Candidate Dialog */}
      <EditCandidateDialog
        candidateId={selectedCandidateId}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={handleEditComplete}
      />
    </div>
  );
};

export default OnboardingManagement;
