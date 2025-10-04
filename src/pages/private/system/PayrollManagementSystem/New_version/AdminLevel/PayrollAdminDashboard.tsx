import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/providers/AuthContext'
import axios from 'axios'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  AlertCircle,
  Settings,
  Download,
  Loader2
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import RouteDict from '@/routes/RouteDict'

import {
  PayrollCycle,
  PayrollCycleDeletionResult,
  PayrollCycleDetails,
  PayrollStatistics,
  SalaryTemplate,
  PayrollCycleProcessingStatusResponse,
  PayrollPayoutStatus
} from '../types/payroll'

import OverviewTab from './components/tabs/OverviewTab'
import SetupConfigTab from './components/tabs/SetupConfigTab'
import CycleManagementTab from './components/tabs/CycleManagementTab'
import ProcessingTab from './components/tabs/ProcessingTab'
import ReviewApprovalTab from './components/tabs/ReviewApprovalTab'
import ReportingTab from './components/tabs/ReportingTab'
import TransactionsTab from './components/tabs/TransactionsTab'
import AuditTrailTab from './components/tabs/AuditTrailTab'
import EmployeePortalTab from './components/tabs/EmployeePortalTab'
import TransactionModeDialog, { BankDetailsFormState } from './components/TransactionModeDialog'
import ProcessingDrawer from './components/ProcessingDrawer'
import TemplateDialog from './components/TemplateDialog'

const MONTH_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]

const AUDIT_CYCLE_PAGE_LIMIT = 10

interface PaginationState {
  page: number
  totalPages: number
  total: number
  limit: number
}

interface PayrollDashboardResponse {
  success: boolean
  message?: string
  data?: {
    cyclesNeedingReview?: PayrollCycle[]
    statistics?: PayrollStatistics | null
    recentCycles?: PayrollCycle[]
  }
}

interface ApprovedCycleSnapshot {
  id: string
  month?: number | null
  year?: number | null
}

const TUTORIAL_STORAGE_KEY = 'payroll-admin-dashboard-onboarding-v1'

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as Record<string, unknown> | undefined
    if (responseData && typeof responseData.message === 'string') {
      return responseData.message
    }
    return error.message || fallback
  }

  if (error instanceof Error) {
    return error.message || fallback
  }

  return fallback
}

const PayrollAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState<PayrollStatistics | null>(null);
  const [cycles, setCycles] = useState<PayrollCycle[]>([]);
  const [cyclesNeedingReview, setCyclesNeedingReview] = useState<PayrollCycle[]>([]);
  const [isCreatingCycle, setIsCreatingCycle] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [reportInfo, setReportInfo] = useState<{
    title: string
    description: string
    actionLabel?: string
    onAction?: () => void
  } | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedCycleDetails, setSelectedCycleDetails] = useState<PayrollCycleDetails | null>(null);
  const [isReviewDialogLoading, setIsReviewDialogLoading] = useState(false);
  const [reviewDialogError, setReviewDialogError] = useState<string | null>(null);
  const [reviewLoadingCycleId, setReviewLoadingCycleId] = useState<string | null>(null);
  const [reviewDialogCycleId, setReviewDialogCycleId] = useState<string | null>(null);
  const [cyclePendingDelete, setCyclePendingDelete] = useState<PayrollCycle | null>(null);
  const [isDeletingCycle, setIsDeletingCycle] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isApprovalSuccessDialogOpen, setIsApprovalSuccessDialogOpen] = useState(false);
  const [lastApprovedCycle, setLastApprovedCycle] = useState<ApprovedCycleSnapshot | null>(null);
  const [lastActiveTabBeforeApproval, setLastActiveTabBeforeApproval] = useState<string | null>(null);

  const processingDetailsCache = useRef<Record<string, PayrollCycleDetails>>({});
  const [cycleProgressMap, setCycleProgressMap] = useState<Record<string, PayrollCycleProcessingStatusResponse>>({});
  const [cycleProgressErrors, setCycleProgressErrors] = useState<Record<string, string>>({});
  const progressPollersRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});
  const [isProcessingDrawerOpen, setIsProcessingDrawerOpen] = useState(false);
  const [selectedProcessingCycle, setSelectedProcessingCycle] = useState<PayrollCycle | null>(null);
  const [processingCycleDetails, setProcessingCycleDetails] = useState<PayrollCycleDetails | null>(null);
  const [processingDrawerError, setProcessingDrawerError] = useState<string | null>(null);
  const [isProcessingDrawerLoading, setIsProcessingDrawerLoading] = useState(false);
  const [selectedProcessingRecordId, setSelectedProcessingRecordId] = useState<string | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<SalaryTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateDialogError, setTemplateDialogError] = useState<string | null>(null);
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [templateSelection, setTemplateSelection] = useState<string | null>(null);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [isRecalculatingSalary, setIsRecalculatingSalary] = useState(false);
  const [isSubmittingForReview, setIsSubmittingForReview] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkTargetRef = useRef<{ recordId?: string | null; employeeId?: string | null } | null>(null);

  // Transaction mode state
  const [isTransactionModeOpen, setIsTransactionModeOpen] = useState(false);
  const [transactionCycleId, setTransactionCycleId] = useState<string | null>(null);
  const [transactionEmployees, setTransactionEmployees] = useState<any[]>([]);
  const [currentEmployeeIndex, setCurrentEmployeeIndex] = useState(0);
  const [transactionDetails, setTransactionDetails] = useState<Record<string, string>>({});
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  const [completedTransactions, setCompletedTransactions] = useState<Set<string>>(new Set());
  const [transactionSessionDirty, setTransactionSessionDirty] = useState(false);

  const toTitleCase = (value: string) =>
    value
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const getPaymentStatusMeta = (status?: string) => {
    if (!status) return null;
    switch (status) {
      case 'COMPLETED':
        return { label: 'Paid', className: 'bg-green-100 text-green-700 border-green-200' };
      case 'FAILED':
        return { label: 'Failed', className: 'bg-red-100 text-red-700 border-red-200' };
      case 'INITIATED':
        return { label: 'Initiated', className: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'PENDING':
        return { label: 'Pending', className: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'NO_PAYOUT_REQUIRED':
        return { label: 'Logical payout (no transfer)', className: 'bg-slate-100 text-slate-800 border-slate-300' };
      default:
        return { label: toTitleCase(status.replace(/_/g, ' ')), className: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const formatPaymentStatus = (status?: string) => getPaymentStatusMeta(status)?.label ?? 'Unknown status';

  const renderPaymentStatusBadge = (status?: string) => {
    const meta = getPaymentStatusMeta(status);
    if (!meta) return null;
    return (
      <Badge variant="outline" className={meta.className}>
        {meta.label}
      </Badge>
    );
  };

  const [isEditingBankDetails, setIsEditingBankDetails] = useState(false);
  const [bankDetailsForm, setBankDetailsForm] = useState<BankDetailsFormState>({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: 'SAVINGS',
    maskedAccountNumber: undefined,
    accountHolder: undefined
  });
  const [isSavingBankDetails, setIsSavingBankDetails] = useState(false);

  const [auditCycles, setAuditCycles] = useState<PayrollCycle[]>([]);
  const [auditPagination, setAuditPagination] = useState<PaginationState>({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: AUDIT_CYCLE_PAGE_LIMIT
  });
  const [isAuditCyclesLoading, setIsAuditCyclesLoading] = useState(false);
  const [auditCyclesError, setAuditCyclesError] = useState<string | null>(null);
  const [auditSelectedCycleId, setAuditSelectedCycleId] = useState<string | null>(null);
  const [auditCycleDetails, setAuditCycleDetails] = useState<PayrollCycleDetails | null>(null);
  const [isAuditDetailsLoading, setIsAuditDetailsLoading] = useState(false);
  const [auditDetailsError, setAuditDetailsError] = useState<string | null>(null);
  const auditInitRef = useRef(false);

  // Current date for default values
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // State for month/year selection
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Generate arrays for months and years
  const months = MONTH_OPTIONS

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const pendingDeleteLabel = cyclePendingDelete
    ? `${months.find((m) => m.value === cyclePendingDelete.month)?.label ?? cyclePendingDelete.month} ${cyclePendingDelete.year}`
    : null;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasSeen = window.localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!hasSeen) {
      setIsTutorialOpen(true);
    } else {
      setHasSeenTutorial(true);
    }
  }, []);

  const tutorialSteps = useMemo(
    () => [
      {
        title: 'Track payroll health at a glance',
        description:
          'Start on the Overview tab to monitor KPIs, pending reviews, and the most recent payroll cycles. Use the Refresh button whenever you process new data.',
        actionTab: 'overview',
        ctaLabel: 'Show overview'
      },
      {
        title: 'Create and launch cycles',
        description:
          'Use Cycle Management to pick a month, create a payroll cycle, and kick off bulk processing when you are ready. Draft cycles stay here until you start them.',
        actionTab: 'cycle-management',
        ctaLabel: 'Open cycle management'
      },
      {
        title: 'Review before approval',
        description:
          'After processing, cycles move into Review & Approval. Approvers can inspect totals, leave comments, and approve or reject from this workspace.',
        actionTab: 'review-approval',
        ctaLabel: 'Go to review'
      },
      {
        title: 'Report and export insights',
        description:
          'Generate analytics, exports, and compliance artifacts from the Reporting tab. Export Data creates a CSV of recent cycles you can share with finance.',
        actionTab: 'reporting',
        ctaLabel: 'View reporting tools'
      },
      {
        title: 'Empower employees',
        description:
          'Use the Employee Portal shortcuts to jump into the self-service experience, download payslips, and manage disputes on behalf of staff.',
        actionTab: 'employee-portal',
        ctaLabel: 'Open employee portal'
      }
    ],
    []
  );

  const activeTutorialStep = tutorialSteps[tutorialStep];

  const markTutorialAsSeen = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    }
    setHasSeenTutorial(true);
  };

  const closeTutorial = (persist = true) => {
    if (persist) {
      markTutorialAsSeen();
    }
    setIsTutorialOpen(false);
  };

  const startTutorial = (step = 0) => {
    setTutorialStep(step);
    setIsTutorialOpen(true);
  };

  const handleTutorialAdvance = (direction: 'next' | 'back') => {
    if (direction === 'back') {
      setTutorialStep((prev) => Math.max(0, prev - 1));
      return;
    }

    setTutorialStep((prev) => Math.min(tutorialSteps.length - 1, prev + 1));
  };

  const handleTutorialCta = () => {
    if (!activeTutorialStep?.actionTab) return;
    setActiveTab(activeTutorialStep.actionTab);
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      setStatistics(null);
      setCycles([]);
      setCyclesNeedingReview([]);
      setErrorMessage('You need to be logged in to view payroll dashboard data.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await axios.get<PayrollDashboardResponse>(APIV3Dictionary.payroll.dashboard, {
        params: { year: selectedYear },
        withCredentials: true,
      });

      if (response.data.success) {
        const { cyclesNeedingReview: reviewCycles = [], statistics: stats = null, recentCycles = [] } = response.data.data || {};

        setCycles(Array.isArray(recentCycles) ? recentCycles : []);
        setCyclesNeedingReview(Array.isArray(reviewCycles) ? reviewCycles : []);
        setStatistics(stats ?? null);
        return;
      }

      const message = response.data.message || 'Failed to load payroll dashboard data.';
      setCycles([]);
      setCyclesNeedingReview([]);
      setStatistics(null);
      setErrorMessage(message);
      toast({
        title: 'Unable to load payroll data',
        description: message,
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error fetching payroll dashboard data:', error);
      const message = getErrorMessage(error, 'An unexpected error occurred while fetching payroll dashboard data.');
      setCycles([]);
      setCyclesNeedingReview([]);
      setStatistics(null);
      setErrorMessage(message);
      toast({
        title: 'Unable to load payroll data',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, user?.id]);

  const handleAuditCycleSelect = useCallback(
    (cycleId: string | null) => {
      setAuditSelectedCycleId(cycleId);

      if (!cycleId) {
        setAuditCycleDetails(null);
        setAuditDetailsError(null);
        setIsAuditDetailsLoading(false);
        return;
      }

      const cachedDetails = processingDetailsCache.current[cycleId];
      if (cachedDetails) {
        setAuditCycleDetails(cachedDetails);
        setAuditDetailsError(null);
        setIsAuditDetailsLoading(false);
      } else {
        setAuditCycleDetails(null);
      }
    },
    []
  );

  const fetchAuditCycles = useCallback(
    async (page = 1) => {
      if (!user?.id) {
        setAuditCycles([]);
        setAuditCyclesError('You need to be logged in to view payroll audit data.');
        return;
      }

      setAuditPagination((prev) => ({ ...prev, page }));
      setIsAuditCyclesLoading(true);
      setAuditCyclesError(null);

      try {
        const response = await axios.get<{
          success: boolean
          data?: PayrollCycle[]
          pagination?: {
            page?: number
            pages?: number
            total?: number
            limit?: number
          }
          message?: string
        }>(APIV3Dictionary.payroll.cycles, {
          params: {
            page,
            limit: AUDIT_CYCLE_PAGE_LIMIT
          },
          withCredentials: true
        });

        if (response.data?.success) {
          const cyclesList = Array.isArray(response.data.data) ? response.data.data : [];
          const pagination = response.data.pagination ?? {};

          setAuditCycles(cyclesList);
          setAuditPagination({
            page: pagination.page ?? page,
            totalPages:
              pagination.pages ??
              Math.max(
                1,
                pagination.total
                  ? Math.ceil(pagination.total / (pagination.limit ?? AUDIT_CYCLE_PAGE_LIMIT))
                  : Math.ceil(Math.max(cyclesList.length, 1) / AUDIT_CYCLE_PAGE_LIMIT)
              ),
            total: pagination.total ?? cyclesList.length,
            limit: pagination.limit ?? AUDIT_CYCLE_PAGE_LIMIT
          });

          if (!cyclesList.length) {
            handleAuditCycleSelect(null);
            return;
          }

          if (!auditSelectedCycleId || !cyclesList.some((cycle) => cycle.id === auditSelectedCycleId)) {
            handleAuditCycleSelect(cyclesList[0].id);
          }
        } else {
          const message = response.data?.message || 'Failed to fetch payroll cycles for audit.';
          setAuditCycles([]);
          setAuditCyclesError(message);
          handleAuditCycleSelect(null);
        }
      } catch (error) {
        const message = getErrorMessage(error, 'Failed to fetch payroll cycles for audit.');
        setAuditCycles([]);
        setAuditCyclesError(message);
        handleAuditCycleSelect(null);
      } finally {
        setIsAuditCyclesLoading(false);
      }
    },
    [auditSelectedCycleId, handleAuditCycleSelect, user?.id]
  );

  const loadCycleDetails = useCallback(async (cycleId: string): Promise<PayrollCycleDetails> => {
    try {
      const response = await axios.get(APIV3Dictionary.payroll.getCycleDetails(cycleId), {
        withCredentials: true
      });

      if (response.data?.success) {
        const rawData = response.data.data as PayrollCycleDetails | undefined;

        if (!rawData) {
          throw new Error('Cycle details were not found in the response.');
        }

        return {
          ...rawData,
          salaryRecords: Array.isArray(rawData.salaryRecords) ? rawData.salaryRecords : [],
          auditLogs: Array.isArray(rawData.auditLogs) ? rawData.auditLogs : []
        };
      }

      const message = (response.data?.message as string) || 'Failed to fetch payroll cycle details.';
      throw new Error(message);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch payroll cycle details.'));
    }
  }, []);

  const loadAuditDetails = useCallback(
    async (cycleId: string, options: { force?: boolean; showToast?: boolean } = {}) => {
      const { force = false, showToast = false } = options;

      if (!cycleId) {
        return null;
      }

      if (!force) {
        const cachedDetails = processingDetailsCache.current[cycleId];
        if (cachedDetails) {
          setAuditCycleDetails(cachedDetails);
          setAuditDetailsError(null);
          setIsAuditDetailsLoading(false);
          return cachedDetails;
        }
      }

      setIsAuditDetailsLoading(true);
      setAuditDetailsError(null);

      try {
        const details = await loadCycleDetails(cycleId);
        processingDetailsCache.current[cycleId] = details;
        setAuditCycleDetails(details);
        return details;
      } catch (error) {
        const message = getErrorMessage(error, 'Failed to fetch payroll audit trail.');
        setAuditDetailsError(message);
        if (showToast) {
          toast({
            title: 'Unable to load audit data',
            description: message,
            variant: 'destructive'
          });
        }
        throw error;
      } finally {
        setIsAuditDetailsLoading(false);
      }
    },
    [loadCycleDetails]
  );

  const refreshAuditCycleDetails = useCallback(async () => {
    if (!auditSelectedCycleId) {
      return;
    }

    await loadAuditDetails(auditSelectedCycleId, { force: true, showToast: true });
  }, [auditSelectedCycleId, loadAuditDetails]);

  useEffect(() => {
    if (activeTab !== 'audit-trail') {
      return;
    }

    if (auditInitRef.current) {
      return;
    }

    auditInitRef.current = true;
    fetchAuditCycles(1);
  }, [activeTab, fetchAuditCycles]);

  useEffect(() => {
    if (activeTab !== 'audit-trail') {
      return;
    }

    if (!auditSelectedCycleId) {
      setAuditCycleDetails(null);
      setAuditDetailsError(null);
      return;
    }

    loadAuditDetails(auditSelectedCycleId).catch(() => {
      // handled inside loader
    });
  }, [activeTab, auditSelectedCycleId, loadAuditDetails]);

  const stopProgressPolling = useCallback((cycleId: string) => {
    const existingTimer = progressPollersRef.current[cycleId];
    if (existingTimer) {
      clearTimeout(existingTimer);
      delete progressPollersRef.current[cycleId];
    }
  }, []);

  const fetchCycleProcessingStatus = useCallback(
    async (cycleId: string): Promise<PayrollCycleProcessingStatusResponse | null> => {
      try {
        const response = await axios.get<{
          success: boolean;
          data?: PayrollCycleProcessingStatusResponse;
          message?: string;
        }>(APIV3Dictionary.payroll.getCycleProcessingStatus(cycleId), {
          withCredentials: true
        });

        if (response.data?.success && response.data.data) {
          setCycleProgressMap((prev) => ({
            ...prev,
            [cycleId]: response.data.data as PayrollCycleProcessingStatusResponse
          }));

          setCycleProgressErrors((prev) => {
            if (!prev[cycleId]) {
              return prev;
            }
            const next = { ...prev };
            delete next[cycleId];
            return next;
          });

          return response.data.data;
        }

        const message = (response.data?.message as string) || 'Failed to fetch payroll progress.';
        throw new Error(message);
      } catch (error) {
        const message = getErrorMessage(error, 'Failed to fetch payroll progress.');
        console.error(`Error fetching payroll progress for cycle ${cycleId}:`, error);
        setCycleProgressErrors((prev) => ({ ...prev, [cycleId]: message }));
        return null;
      }
    },
    []
  );

  const pollCycleProgress = useCallback(
    async (cycleId: string) => {
      const status = await fetchCycleProcessingStatus(cycleId);

      if (!status) {
        const retryTimer = setTimeout(() => pollCycleProgress(cycleId), 10_000);
        progressPollersRef.current[cycleId] = retryTimer;
        return;
      }

      const jobStatus = status.job?.status ?? null;
      const percentComplete =
        status.progress?.percentComplete ?? status.cycle.processingSummary?.percentComplete ?? 0;

      const stillProcessing =
        jobStatus === 'PENDING' ||
        jobStatus === 'PROCESSING' ||
        (status.cycle.status === 'IN_PROGRESS' && percentComplete < 100);

      if (stillProcessing) {
        const nextTimer = setTimeout(() => pollCycleProgress(cycleId), 5_000);
        progressPollersRef.current[cycleId] = nextTimer;
        return;
      }

      stopProgressPolling(cycleId);
    },
    [fetchCycleProcessingStatus, stopProgressPolling]
  );

  const ensureProgressPolling = useCallback(
    (cycleId: string) => {
      if (progressPollersRef.current[cycleId]) {
        return;
      }
      pollCycleProgress(cycleId);
    },
    [pollCycleProgress]
  );

  const navigateToTemplates = (tab?: string) => {
    const basePath = '/p/payroll/admin/templates';
    navigate(tab ? `${basePath}?tab=${tab}` : basePath);
  };

  const navigateToEmployeePortal = () => {
    navigate(`${RouteDict.Payroll.Base}/employee`, { state: { defaultTab: 'profile' } });
  };
  const navigateToBankManagement = () => navigate(RouteDict.Profile.BankDetails);
  const navigateToNotificationSettings = () => navigate('/p/notification/settings');
  const navigateToNotificationSend = () => navigate(RouteDict.Notification.Send);

  const handleExportData = useCallback(() => {
    if (!cycles.length) {
      toast({
        title: 'Nothing to export yet',
        description: 'Create or process a payroll cycle to generate exportable data.',
        variant: 'default'
      });
      return;
    }

    const headers = [
      'Month',
      'Year',
      'Status',
      'Processed Employees',
      'Total Employees',
      'Failed Count',
      'Total Amount'
    ];

    const rows = cycles.map((cycle) => {
      const monthLabel = months.find((m) => m.value === cycle.month)?.label ?? cycle.month.toString();
      return [
        `${monthLabel}`,
        cycle.year.toString(),
        cycle.status,
        (cycle.processedCount ?? 0).toString(),
        (cycle.totalEmployees ?? 0).toString(),
        (cycle.failedCount ?? 0).toString(),
        (cycle.totalAmount ?? 0).toString()
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payroll-cycles-${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export complete',
      description: 'A CSV with the latest payroll cycles has been downloaded.',
    });
  }, [cycles, months, selectedYear]);

  const handleOpenSettings = () => {
    navigate(`${RouteDict.System.Settings}?module=payroll`);
  };

  const handleReportNavigation = (target: 'tax' | 'analytics' | 'export' | 'audit' | 'compliance' | 'corrections') => {
    switch (target) {
      case 'tax': {
        navigate(`${RouteDict.Payroll.SalaryTransaction}?view=tax`);
        toast({
          title: 'Opening tax summaries',
          description: 'Filtering salary transactions for tax reconciliation insights.'
        });
        break;
      }
      case 'analytics': {
        navigate(`${RouteDict.Payroll.Base}/workflow`, { state: { highlight: 'reporting' } });
        toast({
          title: 'Payroll analytics',
          description: 'The workflow dashboard highlights reporting metrics for deeper analysis.'
        });
        break;
      }
      case 'export': {
        handleExportData();
        break;
      }
      case 'audit': {
        setActiveTab('audit-trail');
        setReportInfo({
          title: 'Audit trail review',
          description:
            'The Audit Trail tab now surfaces every payroll cycle change with filtering, actors, and before/after snapshots.',
          actionLabel: 'Open audit tab',
          onAction: () => setActiveTab('audit-trail')
        });
        break;
      }
      case 'compliance': {
        navigate(`${RouteDict.Payroll.Base}/workflow`, { state: { highlight: 'review' } });
        toast({
          title: 'Compliance checklist',
          description: 'Review cycle approvals and exported summaries before filing compliance reports.'
        });
        break;
      }
      case 'corrections': {
        setReportInfo({
          title: 'Handle corrections',
          description: 'Use salary transactions to rerun calculations or raise disputes for any employees needing corrections.',
          actionLabel: 'Open transactions',
          onAction: () => navigate(RouteDict.Payroll.SalaryTransaction)
        });
        break;
      }
      default:
        break;
    }
  };

  const canDeleteCycle = useCallback(
    (cycle: PayrollCycle | null) => {
      if (!cycle) return false;
      return !['APPROVED', 'COMPLETED'].includes(cycle.status);
    },
    []
  );

  const handleRequestDeleteCycle = useCallback(
    (cycle: PayrollCycle) => {
      if (!canDeleteCycle(cycle)) {
        toast({
          title: 'Cycle can’t be deleted',
          description: 'Approved or completed payroll cycles must remain in your records.',
          variant: 'destructive'
        });
        return;
      }

      setDeleteError(null);
      setCyclePendingDelete(cycle);
    },
    [canDeleteCycle]
  );

  const closeDeleteDialog = useCallback(() => {
    if (isDeletingCycle) return;
    setCyclePendingDelete(null);
    setDeleteError(null);
  }, [isDeletingCycle]);

  const handleConfirmDeleteCycle = useCallback(async () => {
    if (!cyclePendingDelete) return;

    setIsDeletingCycle(true);
    setDeleteError(null);

    try {
      const response = await axios.delete<{
        success: boolean;
        message?: string;
        data?: PayrollCycleDeletionResult;
      }>(APIV3Dictionary.payroll.deleteCycle(cyclePendingDelete.id), {
        withCredentials: true
      });

      if (!response.data.success) {
        const message = response.data.message || 'Unable to delete payroll cycle.';
        setDeleteError(message);
        toast({
          title: 'Delete failed',
          description: message,
          variant: 'destructive'
        });
        return;
      }

      const summary = response.data.data || null;
      const message = response.data.message || 'Payroll cycle deleted.';
      const summaryParts: string[] = [];

      if (summary?.counts) {
        const { counts } = summary;
        if (counts.salaryRecords) summaryParts.push(`${counts.salaryRecords} salary records`);
        if (counts.salaryTransactionLinks) summaryParts.push(`${counts.salaryTransactionLinks} payout links`);
        if (counts.salaryDisputes) summaryParts.push(`${counts.salaryDisputes} disputes`);
        if (counts.workflowSteps) summaryParts.push(`${counts.workflowSteps} workflow steps`);
        if (counts.payrollAudits) summaryParts.push(`${counts.payrollAudits} payroll audits`);
        if (counts.payrollCycleAudits) summaryParts.push(`${counts.payrollCycleAudits} cycle audits`);
      }

      toast({
        title: 'Payroll cycle deleted',
        description:
          summaryParts.length > 0
            ? `${message} Removed ${summaryParts.join(', ')}.`
            : message
      });

      if (selectedProcessingCycle?.id === cyclePendingDelete.id) {
        setIsProcessingDrawerOpen(false);
        setSelectedProcessingCycle(null);
        setProcessingCycleDetails(null);
      }

      await fetchDashboardData();
      setCyclePendingDelete(null);
    } catch (error) {
      console.error('Error deleting payroll cycle:', error);
      const message = getErrorMessage(error, 'An unexpected error occurred while deleting the payroll cycle.');
      setDeleteError(message);
      toast({
        title: 'Delete failed',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsDeletingCycle(false);
    }
  }, [cyclePendingDelete, fetchDashboardData, selectedProcessingCycle?.id]);

  const handleEmployeePortalShortcut = (tab: string, extraState?: Record<string, unknown>) => {
    navigate(`${RouteDict.Payroll.Base}/employee`, { state: { defaultTab: tab, ...extraState } });
  };

  const handleCloseReportInfo = () => setReportInfo(null);

  const handleCloseReviewDetails = () => {
    setIsReviewDialogOpen(false);
    setSelectedCycleDetails(null);
    setReviewDialogError(null);
    setReviewDialogCycleId(null);
  };

  const handleOpenReviewDetails = async (cycleId: string) => {
    setIsReviewDialogOpen(true);
    setReviewDialogError(null);
    setSelectedCycleDetails(null);
    setReviewLoadingCycleId(cycleId);
    setReviewDialogCycleId(cycleId);
    setIsReviewDialogLoading(true);

    try {
      const cycleData = await loadCycleDetails(cycleId);
      setSelectedCycleDetails(cycleData);
      processingDetailsCache.current[cycleId] = cycleData;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to fetch payroll cycle details.');
      setReviewDialogError(message);
      toast({
        title: 'Unable to load cycle details',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsReviewDialogLoading(false);
      setReviewLoadingCycleId(null);
    }
  };

  const selectProcessingRecord = useCallback(
    (recordId: string | null) => {
      setSelectedProcessingRecordId(recordId);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);

        if (!recordId) {
          next.delete('recordId');
          next.delete('employeeId');
          return next;
        }

        next.set('recordId', recordId);

        const targetRecord = processingCycleDetails?.salaryRecords.find((record) => record.id === recordId);
        const employeeIdValue = targetRecord?.user?.id ?? targetRecord?.user?.employeeId ?? null;

        if (employeeIdValue) {
          next.set('employeeId', employeeIdValue);
        } else {
          next.delete('employeeId');
        }

        return next;
      });
    },
    [processingCycleDetails, setSearchParams]
  );

  const handleOpenProcessingDrawer = useCallback(async (cycle: PayrollCycle) => {
    setIsProcessingDrawerOpen(true);
    setSelectedProcessingCycle(cycle);
    setProcessingDrawerError(null);
    setProcessingCycleDetails(null);
    selectProcessingRecord(null);
    setEmployeeSearchTerm('');

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('stage', 'processing');
      next.set('cycleId', cycle.id);
      return next;
    });

    const cached = processingDetailsCache.current[cycle.id];
    if (cached) {
      setProcessingCycleDetails(cached);
      selectProcessingRecord(cached.salaryRecords[0]?.id ?? null);
      return;
    }

    setIsProcessingDrawerLoading(true);

    try {
      const details = await loadCycleDetails(cycle.id);
      processingDetailsCache.current[cycle.id] = details;
      setProcessingCycleDetails(details);
      selectProcessingRecord(details.salaryRecords[0]?.id ?? null);
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to load processing details.');
      setProcessingDrawerError(message);
      toast({
        title: 'Unable to load cycle processing data',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessingDrawerLoading(false);
    }
  }, [loadCycleDetails, selectProcessingRecord, setSearchParams]);

  const handleCloseProcessingDrawer = useCallback(() => {
    setIsProcessingDrawerOpen(false);
    setProcessingDrawerError(null);
    setIsProcessingDrawerLoading(false);
    setProcessingCycleDetails((prev) => prev); // retain data for cache reuse
    selectProcessingRecord(null);
    setSelectedProcessingCycle(null);
    setEmployeeSearchTerm('');
    setIsSubmittingForReview(false);
    deepLinkTargetRef.current = null;

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('stage');
      next.delete('cycleId');
      next.delete('recordId');
      next.delete('employeeId');
      return next;
    });
  }, [selectProcessingRecord, setSearchParams]);

  const refreshProcessingDetails = useCallback(
    async (cycleId: string, preferredRecordId?: string) => {
      setProcessingDrawerError(null);
      setIsProcessingDrawerLoading(true);

      try {
        const refreshedDetails = await loadCycleDetails(cycleId);
        processingDetailsCache.current[cycleId] = refreshedDetails;
        setProcessingCycleDetails(refreshedDetails);

        const nextRecord =
          (preferredRecordId &&
            refreshedDetails.salaryRecords.find((record) => record.id === preferredRecordId)) ||
          refreshedDetails.salaryRecords[0] ||
          null;

        selectProcessingRecord(nextRecord?.id ?? null);
        return refreshedDetails;
      } catch (error) {
        const message = getErrorMessage(error, 'Failed to refresh processing details.');
        setProcessingDrawerError(message);
        throw error;
      } finally {
        setIsProcessingDrawerLoading(false);
      }
    },
    [loadCycleDetails, selectProcessingRecord]
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    cycles.forEach((cycle) => {
      if (cycle.status === 'IN_PROGRESS') {
        ensureProgressPolling(cycle.id);
      } else {
        stopProgressPolling(cycle.id);
      }
    });
  }, [cycles, ensureProgressPolling, stopProgressPolling]);

  useEffect(() => {
    return () => {
      Object.values(progressPollersRef.current).forEach((timer) => {
        if (timer) {
          clearTimeout(timer);
        }
      });
      progressPollersRef.current = {};
    };
  }, []);

  const searchParamsKey = searchParams.toString();

  useEffect(() => {
    const params = new URLSearchParams(searchParamsKey);
    const stage = params.get('stage');
    const cycleIdParam = params.get('cycleId');

    if (stage !== 'processing' || !cycleIdParam) {
      return;
    }

    const targetCycle = cycles.find((cycle) => cycle.id === cycleIdParam);
    if (!targetCycle) {
      return;
    }

    const recordIdParam = params.get('recordId');
    const employeeIdParam = params.get('employeeId');

    if (!isProcessingDrawerOpen || selectedProcessingCycle?.id !== targetCycle.id) {
      deepLinkTargetRef.current = {
        recordId: recordIdParam,
        employeeId: employeeIdParam
      };
      handleOpenProcessingDrawer(targetCycle);
    }
  }, [cycles, handleOpenProcessingDrawer, isProcessingDrawerOpen, searchParamsKey, selectedProcessingCycle?.id]);

  useEffect(() => {
    if (
      isProcessingDrawerOpen &&
      processingCycleDetails?.salaryRecords?.length &&
      !selectedProcessingRecordId
    ) {
      selectProcessingRecord(processingCycleDetails.salaryRecords[0].id);
    }
  }, [isProcessingDrawerOpen, processingCycleDetails, selectedProcessingRecordId, selectProcessingRecord]);

  useEffect(() => {
    if (!processingCycleDetails || !deepLinkTargetRef.current) {
      return;
    }

    const { recordId, employeeId } = deepLinkTargetRef.current;

    let targetRecord: PayrollCycleDetails['salaryRecords'][number] | undefined;

    if (recordId) {
      targetRecord = processingCycleDetails.salaryRecords.find((record) => record.id === recordId);
    }

    if (!targetRecord && employeeId) {
      targetRecord = processingCycleDetails.salaryRecords.find(
        (record) => record.user?.id === employeeId || record.user?.employeeId === employeeId
      );
    }

    if (targetRecord) {
      selectProcessingRecord(targetRecord.id);
    }

    deepLinkTargetRef.current = null;
  }, [processingCycleDetails, selectProcessingRecord]);

  // Create new payroll cycle
  const createPayrollCycle = async () => {
    try {
      setIsCreatingCycle(true);

      const response = await axios.post(
        APIV3Dictionary.payroll.createCycle,
        {
          month: selectedMonth,
          year: selectedYear
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Payroll cycle created successfully!',
        });

        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Error creating payroll cycle:', error);
      const message = getErrorMessage(error, 'Failed to create payroll cycle');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsCreatingCycle(false);
    }
  };

  // Start payroll cycle (bulk generation)
  const startPayrollCycle = async (cycleId: string) => {
    try {
      setIsProcessing(true);

      const response = await axios.post(
        APIV3Dictionary.payroll.startCycle(cycleId),
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        const result = response.data.data ?? {};
        const duplicate = Boolean(result.duplicate);
        const jobId = result.job?.id ?? null;
        const jobStatus = result.job?.status ?? 'PENDING';

        toast({
          title: duplicate ? 'Payroll cycle is already processing' : 'Payroll cycle queued',
          description: duplicate
            ? 'Salary generation is already running for this cycle.'
            : `Background job${jobId ? ` ${jobId}` : ''} is ${jobStatus.toLowerCase()}.`
        });

        ensureProgressPolling(cycleId);
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Error starting payroll cycle:', error);
      const message = getErrorMessage(error, 'Failed to start payroll cycle');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Approve payroll cycle
  const approvePayrollCycle = async (cycleId: string) => {
    try {
      setIsProcessing(true);

      const response = await axios.post(
        APIV3Dictionary.payroll.approveCycle(cycleId),
        { notes: 'Bulk approved via admin dashboard' },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Payroll cycle approved successfully!',
        });

        await fetchDashboardData();
        return true;
      }

      const message = (response.data.message as string) || 'Failed to approve payroll cycle';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    } catch (error) {
      console.error('Error approving payroll cycle:', error);
      const message = getErrorMessage(error, 'Failed to approve payroll cycle');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveCycle = async (
    cycleSnapshot: ApprovedCycleSnapshot,
    options?: { onAfterSuccess?: () => void }
  ) => {
    setLastActiveTabBeforeApproval(activeTab);

    const approved = await approvePayrollCycle(cycleSnapshot.id);

    if (approved) {
      setLastApprovedCycle(cycleSnapshot);
      setIsApprovalSuccessDialogOpen(true);
      options?.onAfterSuccess?.();
    }

    if (!approved) {
      setLastActiveTabBeforeApproval(null);
    }

    return approved;
  };

  const handleCloseApprovalSuccessDialog = (restoreTab = true) => {
    setIsApprovalSuccessDialogOpen(false);

    if (restoreTab && lastActiveTabBeforeApproval) {
      setActiveTab(lastActiveTabBeforeApproval);
    }

    setLastActiveTabBeforeApproval(null);
    setLastApprovedCycle(null);
  };

  const handleNavigateToTransactionsTab = () => {
    handleCloseApprovalSuccessDialog(false);
    setActiveTab('transactions');
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'IN_PROGRESS': return 'default';
      case 'REVIEW': return 'outline';
      case 'APPROVED':
      case 'COMPLETED':
        return 'default';
      case 'CANCELLED':
      case 'FAILED':
        return 'destructive';
      default: return 'secondary';
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

  const selectedCycleMonthLabel = selectedCycleDetails
    ? months.find((m) => m.value === selectedCycleDetails.month)?.label ?? `Month ${selectedCycleDetails.month}`
    : null;

  const lastApprovedCycleLabel = useMemo(() => {
    if (!lastApprovedCycle) {
      return null;
    }

    const monthValue = lastApprovedCycle.month ?? null;
    const yearValue = lastApprovedCycle.year ?? null;
    const monthLabel = monthValue
      ? months.find((m) => m.value === monthValue)?.label ?? null
      : null;

    if (monthLabel && yearValue) {
      return `${monthLabel} ${yearValue}`;
    }

    if (yearValue) {
      return `Cycle ${yearValue}`;
    }

    return null;
  }, [lastApprovedCycle, months]);

  const totalSalaryRecords = Array.isArray(selectedCycleDetails?.salaryRecords)
    ? selectedCycleDetails.salaryRecords.length
    : 0;

  const previewSalaryRecords = Array.isArray(selectedCycleDetails?.salaryRecords)
    ? selectedCycleDetails.salaryRecords.slice(0, 5)
    : [];

  const remainingSalaryRecordCount = totalSalaryRecords > previewSalaryRecords.length
    ? totalSalaryRecords - previewSalaryRecords.length
    : 0;

  const templateAssigned = Boolean(selectedCycleDetails?.template || selectedCycleDetails?.templateId);
  const templateDisplayLabel = selectedCycleDetails?.template?.name
    ?? (selectedCycleDetails?.templateId ? `Template ID: ${selectedCycleDetails.templateId}` : null);
  const templateDescription = selectedCycleDetails?.template?.description ?? null;

  const processingCycles = useMemo(
    () => cycles.filter((cycle) => ['DRAFT', 'IN_PROGRESS'].includes(cycle.status)),
    [cycles]
  );

  const activeProcessingJobs = useMemo(
    () =>
      cycles.filter((cycle) => {
        if (cycle.status === 'IN_PROGRESS') {
          return true;
        }
        const jobStatus = cycleProgressMap[cycle.id]?.job?.status ?? null;
        return jobStatus === 'PENDING' || jobStatus === 'PROCESSING';
      }),
    [cycles, cycleProgressMap]
  );

  const payoutCycleBuckets = useMemo(() => {
    const eligible = cycles.filter((cycle) => ['APPROVED', 'COMPLETED'].includes(cycle.status));
    const buckets: {
      active: PayrollCycle[];
      completed: PayrollCycle[];
      failed: PayrollCycle[];
    } = {
      active: [],
      completed: [],
      failed: []
    };

    eligible.forEach((cycle) => {
      const payoutStatus = (cycle.payoutStatus as PayrollPayoutStatus | undefined) ?? 'NOT_STARTED';

      if (payoutStatus === 'COMPLETED') {
        buckets.completed.push(cycle);
        return;
      }

      if (payoutStatus === 'FAILED') {
        buckets.failed.push(cycle);
        return;
      }

      buckets.active.push(cycle);
    });

    return buckets;
  }, [cycles]);

  const getProgressSnapshotForCycle = useCallback(
    (cycleId: string) => {
      const status = cycleProgressMap[cycleId];
      return status?.progress ?? status?.cycle?.processingSummary ?? null;
    },
    [cycleProgressMap]
  );

  const getProgressErrorForCycle = useCallback(
    (cycleId: string) => cycleProgressErrors[cycleId] ?? null,
    [cycleProgressErrors]
  );

  const processingSalaryRecords = useMemo(
    () => processingCycleDetails?.salaryRecords ?? [],
    [processingCycleDetails]
  );

  const filteredProcessingRecords = useMemo(() => {
    if (!employeeSearchTerm.trim()) {
      return processingSalaryRecords;
    }

    const normalizedTerm = employeeSearchTerm.toLowerCase();

    return processingSalaryRecords.filter((record) => {
      const fullName = [record.user?.firstName, record.user?.lastName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const employeeIdValue = record.user?.employeeId
        ? record.user.employeeId.toString().toLowerCase()
        : '';

      return fullName.includes(normalizedTerm) || employeeIdValue.includes(normalizedTerm);
    });
  }, [employeeSearchTerm, processingSalaryRecords]);

  useEffect(() => {
    if (!employeeSearchTerm.trim()) {
      return;
    }

    if (!filteredProcessingRecords.length) {
      selectProcessingRecord(null);
      return;
    }

    if (
      !selectedProcessingRecordId ||
      !filteredProcessingRecords.some((record) => record.id === selectedProcessingRecordId)
    ) {
      selectProcessingRecord(filteredProcessingRecords[0].id);
    }
  }, [employeeSearchTerm, filteredProcessingRecords, selectProcessingRecord, selectedProcessingRecordId]);

  const selectedProcessingRecord = useMemo(() => {
    if (!processingSalaryRecords.length) {
      return null;
    }

    if (selectedProcessingRecordId) {
      return (
        processingSalaryRecords.find((record) => record.id === selectedProcessingRecordId) ||
        processingSalaryRecords[0]
      );
    }

    return processingSalaryRecords[0];
  }, [processingSalaryRecords, selectedProcessingRecordId]);

  const selectedProcessingRecordIndex = useMemo(() => {
    if (!selectedProcessingRecord) {
      return -1;
    }

    return filteredProcessingRecords.findIndex((record) => record.id === selectedProcessingRecord.id);
  }, [filteredProcessingRecords, selectedProcessingRecord]);

  const processingCycleSummary = useMemo(() => {
    if (!processingSalaryRecords.length) {
      return { total: 0, pending: 0, approved: 0, failed: 0 };
    }

    return processingSalaryRecords.reduce(
      (acc, record) => {
        acc.total += 1;
        switch (record.status) {
          case 'FAILED':
          case 'REJECTED':
            acc.failed += 1;
            break;
          case 'PENDING':
          case 'PROCESSING':
          case 'IN_PROGRESS':
            acc.pending += 1;
            break;
          default:
            acc.approved += 1;
            break;
        }
        return acc;
      },
      { total: 0, pending: 0, approved: 0, failed: 0 }
    );
  }, [processingSalaryRecords]);

  const canSubmitCycleForReview = useMemo(() => {
    if (!selectedProcessingCycle) {
      return false;
    }

    if (selectedProcessingCycle.status !== 'IN_PROGRESS') {
      return false;
    }

    return processingSalaryRecords.length > 0;
  }, [processingSalaryRecords, selectedProcessingCycle]);

  const canNavigateProcessingPrev = selectedProcessingRecordIndex > 0;
  const canNavigateProcessingNext =
    selectedProcessingRecordIndex !== -1 &&
    selectedProcessingRecordIndex < filteredProcessingRecords.length - 1;

  const selectedProcessingCycleMonthLabel = selectedProcessingCycle
    ? months.find((m) => m.value === selectedProcessingCycle.month)?.label ?? `Month ${selectedProcessingCycle.month}`
    : null;

  const selectedProcessingCycleYear = selectedProcessingCycle?.year ?? processingCycleDetails?.year ?? null;

  const processingAllowanceEntries = useMemo(() => {
    if (!selectedProcessingRecord || !selectedProcessingRecord.allowances) {
      return [] as Array<{ key: string; amount: number }>;
    }

    return Object.entries(selectedProcessingRecord.allowances).map(([key, amount]) => ({
      key,
      amount
    }));
  }, [selectedProcessingRecord]);

  const processingDeductionEntries = useMemo(() => {
    if (!selectedProcessingRecord || !selectedProcessingRecord.deductions) {
      return [] as Array<{ key: string; amount: number }>;
    }

    return Object.entries(selectedProcessingRecord.deductions).map(([key, amount]) => ({
      key,
      amount
    }));
  }, [selectedProcessingRecord]);

  const processingCalculationDetails = selectedProcessingRecord?.calculationDetails ?? [];
  const processingAttendanceSummary = selectedProcessingRecord?.attendanceSummary ?? null;
  const currentTemplateIdForRecord = selectedProcessingRecord?.templateId ?? null;

  const selectedEmployeeName = useMemo(() => {
    if (!selectedProcessingRecord?.user) {
      return 'this employee';
    }

    const name = [selectedProcessingRecord.user.firstName, selectedProcessingRecord.user.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (name) {
      return name;
    }

    return (
      selectedProcessingRecord.user.email ||
      selectedProcessingRecord.user.employeeId ||
      'this employee'
    );
  }, [selectedProcessingRecord]);

  useEffect(() => {
    if (isTemplateDialogOpen) {
      setTemplateSelection(currentTemplateIdForRecord);
    }
  }, [currentTemplateIdForRecord, isTemplateDialogOpen]);

  const filteredTemplates = useMemo(() => {
    if (!templateSearchTerm.trim()) {
      return availableTemplates;
    }

    const normalizedTerm = templateSearchTerm.toLowerCase();
    return availableTemplates.filter((template) => {
      const name = template.name?.toLowerCase?.() ?? '';
      const description = template.description?.toLowerCase?.() ?? '';
      return name.includes(normalizedTerm) || description.includes(normalizedTerm);
    });
  }, [availableTemplates, templateSearchTerm]);

  const handleOpenTemplateDialog = async () => {
    if (!selectedProcessingRecord) {
      return;
    }

    setTemplateDialogError(null);
    setTemplateSelection(selectedProcessingRecord.templateId ?? null);
    setTemplateSearchTerm('');
    setIsTemplateDialogOpen(true);

    // Avoid refetching if we already have templates cached
    if (availableTemplates.length > 0) {
      return;
    }

    setTemplatesLoading(true);
    try {
      const response = await axios.get(APIV3Dictionary.payroll.templates.list, {
        withCredentials: true
      });

      const payload = response.data as { success?: boolean; data?: SalaryTemplate[]; message?: string };
      if (payload?.success === false) {
        setAvailableTemplates([]);
        setTemplateDialogError(payload.message || 'Failed to load templates.');
        return;
      }

      if (Array.isArray(payload?.data)) {
        setAvailableTemplates(payload.data);
      } else {
        setAvailableTemplates([]);
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to fetch salary templates.');
      setTemplateDialogError(message);
      setAvailableTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleCloseTemplateDialog = () => {
    if (isApplyingTemplate) {
      return;
    }
    setIsTemplateDialogOpen(false);
    setTemplateDialogError(null);
    setTemplateSearchTerm('');
  };

  const handleApplyTemplateToRecord = async () => {
    if (!selectedProcessingRecord || !selectedProcessingCycle) {
      return;
    }

    if (!templateSelection) {
      toast({
        title: 'Select a template',
        description: 'Choose a template before applying the change.',
        variant: 'destructive'
      });
      return;
    }

    const targetUserId = selectedProcessingRecord.user?.id;
    if (!targetUserId) {
      toast({
        title: 'Unable to change template',
        description: 'This salary record is missing an associated employee ID.',
        variant: 'destructive'
      });
      return;
    }

    setIsApplyingTemplate(true);
    setTemplateDialogError(null);

    try {
      await axios.post(
        APIV3Dictionary.payroll.templates.assign,
        {
          templateId: templateSelection,
          employeeIds: [targetUserId],
          departmentIds: []
        },
        {
          withCredentials: true
        }
      );

      toast({
        title: 'Template updated',
        description: 'Payroll engine will regenerate this employee using the selected template.'
      });

      setIsTemplateDialogOpen(false);

      try {
        await refreshProcessingDetails(selectedProcessingCycle.id, selectedProcessingRecord.id);
      } catch (refreshError) {
        const message = getErrorMessage(refreshError, 'Template applied but details could not be refreshed.');
        toast({
          title: 'Template applied with warnings',
          description: message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to assign salary template.');
      setTemplateDialogError(message);
      toast({
        title: 'Template update failed',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  const handleRecalculateSalary = async () => {
    if (!selectedProcessingRecord) {
      toast({
        title: 'Select a salary record first',
        description: 'Choose an employee entry before requesting recalculation.',
        variant: 'destructive'
      });
      return;
    }

    const targetUserId = selectedProcessingRecord.user?.id;
    if (!targetUserId) {
      toast({
        title: 'Unable to recalculate',
        description: 'The selected record is missing an associated employee identifier.',
        variant: 'destructive'
      });
      return;
    }

    const targetMonth = selectedProcessingCycle?.month ?? processingCycleDetails?.month;
    const targetYear = selectedProcessingCycle?.year ?? processingCycleDetails?.year;
    const targetCycleId = selectedProcessingCycle?.id ?? processingCycleDetails?.id ?? null;

    if (typeof targetMonth !== 'number' || typeof targetYear !== 'number') {
      toast({
        title: 'Missing payroll period',
        description: 'Month and year information are required to regenerate this salary.',
        variant: 'destructive'
      });
      return;
    }

    setIsRecalculatingSalary(true);
    setProcessingDrawerError(null);

    try {
      const response = await axios.post(
        APIV3Dictionary.payroll.generateSalary(targetMonth, targetYear, targetUserId),
        { force: true },
        { withCredentials: true }
      );

      const payload = response.data as {
        success?: boolean;
        message?: string;
        data?: { netSalary?: number; status?: string } | null;
      };

      if (payload?.success === false) {
        throw new Error(payload.message || 'Failed to regenerate salary.');
      }

      const recalculatedRecord = payload?.data ?? null;
      const recalculationMessage = payload?.message
        || (typeof recalculatedRecord?.netSalary === 'number'
          ? `Updated net salary: ${formatCurrency(recalculatedRecord.netSalary)}.`
          : 'Payroll engine is regenerating this employee.');

      toast({
        title: 'Salary recalculated',
        description: recalculationMessage
      });

      if (targetCycleId) {
        try {
          await refreshProcessingDetails(targetCycleId, selectedProcessingRecord.id);
        } catch (refreshError) {
          const message = getErrorMessage(refreshError, 'Recalculation succeeded but details could not be refreshed.');
          toast({
            title: 'Refresh failed',
            description: message,
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to recalculate salary.');
      toast({
        title: 'Recalculation failed',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsRecalculatingSalary(false);
    }
  };

  const handleSubmitCycleForReview = async () => {
    if (!selectedProcessingCycle?.id) {
      toast({
        title: 'Select a cycle first',
        description: 'Open a payroll cycle before submitting it for review.',
        variant: 'destructive'
      });
      return;
    }

    if (!processingSalaryRecords.length) {
      toast({
        title: 'No salary records found',
        description: 'Generate salaries before submitting the cycle for review.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmittingForReview(true);

    try {
      const response = await axios.post(
        APIV3Dictionary.payroll.submitCycle(selectedProcessingCycle.id),
        {},
        { withCredentials: true }
      );

      const payload = response.data as {
        success?: boolean;
        message?: string;
        data?: {
          forced?: boolean;
          blockers?: {
            pending?: number;
            failed?: number;
          };
        };
      };

      if (payload?.success) {
        toast({
          title: 'Sent for review',
          description: payload.message ?? 'Payroll cycle submitted for approval.',
        });

        await fetchDashboardData();
        handleCloseProcessingDrawer();
        return;
      }

      const message = payload?.message ?? 'Failed to submit payroll cycle for review.';
      toast({
        title: 'Submission failed',
        description: message,
        variant: 'destructive'
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status ?? 0;
        const responseData = error.response?.data as {
          message?: string;
          data?: {
            blockers?: {
              pending?: number;
              failed?: number;
            };
          };
        } | undefined;

        if (statusCode === 409) {
          const blockers = responseData?.data?.blockers ?? {};
          const pendingCount = blockers?.pending ?? 0;
          const failedCount = blockers?.failed ?? 0;

          const blockerMessage = pendingCount || failedCount
            ? `Resolve ${pendingCount} pending and ${failedCount} failed salaries before submitting.`
            : responseData?.message ?? 'Cycle is not ready for review.';

          toast({
            title: 'Cycle not ready for review',
            description: blockerMessage,
            variant: 'destructive'
          });
          return;
        }

        if (statusCode === 400 || statusCode === 404) {
          toast({
            title: 'Submission blocked',
            description: responseData?.message ?? getErrorMessage(error, 'Cycle is not ready for review.'),
            variant: 'destructive'
          });
          return;
        }
      }

      const message = getErrorMessage(error, 'Failed to submit payroll cycle for review.');
      toast({
        title: 'Submission failed',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingForReview(false);
    }
  };

  const handleNavigateProcessingRecord = (direction: 'previous' | 'next') => {
    if (!filteredProcessingRecords.length) {
      selectProcessingRecord(null);
      return;
    }

    if (!selectedProcessingRecord) {
      selectProcessingRecord(filteredProcessingRecords[0]?.id ?? null);
      return;
    }

    const delta = direction === 'next' ? 1 : -1;
    const targetIndex = selectedProcessingRecordIndex + delta;

    if (targetIndex >= 0 && targetIndex < filteredProcessingRecords.length) {
      selectProcessingRecord(filteredProcessingRecords[targetIndex].id);
    }
  };

  // Payout handler functions
  const handleOpenPayoutFlow = async (cycle: PayrollCycle, intent: 'initiate' | 'continue' = 'continue') => {
    try {
      const cycleId = cycle.id;
      const payoutStatus = (cycle.payoutStatus as PayrollPayoutStatus | undefined) ?? 'NOT_STARTED';
      const shouldInitiate = intent === 'initiate' || ['NOT_STARTED', 'FAILED'].includes(payoutStatus);
      let initiatedViaApi = false;

      if (shouldInitiate) {
        const initiateResponse = await axios.post(
          APIV3Dictionary.payroll.initiateCyclePayout(cycleId),
          { requireBankDetails: true },
          { withCredentials: true }
        );

        if (!initiateResponse.data?.success) {
          throw new Error(initiateResponse.data?.message || 'Failed to initiate payouts for this cycle.');
        }

        initiatedViaApi = true;

        const initiatedCount = initiateResponse.data?.data?.initiatedRecords ?? 0;
        const updatedCount = initiateResponse.data?.data?.updatedRecords ?? 0;

        toast({
          title: 'Payout initiation ready',
          description:
            initiatedCount > 0
              ? `${initiatedCount} employee${initiatedCount === 1 ? '' : 's'} queued for payout.${updatedCount > 0 ? ` ${updatedCount} record${updatedCount === 1 ? '' : 's'} moved to initiated.` : ''}`
              : 'Salary records already marked for payout. Continue with transactions.',
        });
      }

      const cycleResponse = await axios.get(
        APIV3Dictionary.payroll.getCycleDetails(cycleId),
        { withCredentials: true }
      );

      if (!cycleResponse.data?.success || !cycleResponse.data.data) {
        throw new Error('Failed to fetch cycle details');
      }

      const cycleData = cycleResponse.data.data;
      const salaryRecords = Array.isArray(cycleData.salaryRecords) ? cycleData.salaryRecords : [];

      if (salaryRecords.length === 0) {
        toast({
          title: 'No employees found',
          description: 'This cycle has no salary records to process.',
          variant: 'destructive'
        });
        return;
      }

      const employeeRecords = salaryRecords.filter((record: any) => record?.user);

      if (employeeRecords.length === 0) {
        toast({
          title: 'No employee data found',
          description: 'This cycle has no valid employee records to process.',
          variant: 'destructive'
        });
        return;
      }

      const employeesWithoutBank = employeeRecords.filter((record: any) => !(record.user?.bankDetails?.accountNumber));
      if (employeesWithoutBank.length > 0) {
        toast({
          title: 'Bank details needed',
          description: `${employeesWithoutBank.length} employee${employeesWithoutBank.length === 1 ? '' : 's'} need bank details. You can add them during the payout flow.`,
        });
      }

      const completedIds = employeeRecords
        .filter((record: any) => ['COMPLETED', 'NO_PAYOUT_REQUIRED'].includes(record.paymentStatus ?? ''))
        .map((record: any) => record.id);

      const firstOutstandingIndex = employeeRecords.findIndex(
        (record: any) => !['COMPLETED', 'NO_PAYOUT_REQUIRED'].includes(record.paymentStatus ?? '')
      );

      setTransactionCycleId(cycleId);
      setTransactionEmployees(employeeRecords);
      setCurrentEmployeeIndex(firstOutstandingIndex >= 0 ? firstOutstandingIndex : 0);
      setTransactionDetails({});
      setCompletedTransactions(new Set(completedIds));
      setTransactionSessionDirty((prev) => prev || initiatedViaApi);
      setIsTransactionModeOpen(true);
    } catch (error: any) {
      const message = getErrorMessage(error, 'Failed to open payout workflow.');
      toast({
        title: intent === 'initiate' ? 'Payout initiation failed' : 'Unable to continue payout',
        description: message,
        variant: 'destructive'
      });
    }
  };

  const handleViewPayoutSummary = async (cycleId: string) => {
    try {
      const response = await axios.get(
        APIV3Dictionary.payroll.getCyclePayoutSummary(cycleId),
        { withCredentials: true }
      );

      if (response.data?.success && response.data.data) {
        // You can expand this to show a detailed modal or navigate to a dedicated page
        const summary = response.data.data;
        toast({
          title: 'Payout Summary',
          description: `Total: ${formatCurrency(summary.totalAmount)} | Employees: ${summary.employeeCount}`,
        });
      } else {
        throw new Error(response.data?.message || 'Failed to fetch payout summary');
      }
    } catch (error: any) {
      const message = getErrorMessage(error, 'Failed to fetch payout summary.');
      toast({
        title: 'Unable to load summary',
        description: message,
        variant: 'destructive'
      });
    }
  };

  const handleExportPayouts = () => {
    toast({
      title: 'Export feature',
      description: 'Payout export functionality will be available soon.',
    });
  };

  const handleBulkPaymentRecord = () => {
    toast({
      title: 'Bulk payment feature',
      description: 'Bulk payment recording will be available soon.',
    });
  };

  // Transaction Mode Functions
  const handleCloseTransactionMode = () => {
    setIsTransactionModeOpen(false);
    setTransactionCycleId(null);
    setTransactionEmployees([]);
    setCurrentEmployeeIndex(0);
    setTransactionDetails({});
    setCompletedTransactions(new Set());
    if (transactionSessionDirty) {
      fetchDashboardData();
    }
    setTransactionSessionDirty(false);
  };

  const handlePreviousEmployee = () => {
    if (currentEmployeeIndex > 0) {
      setCurrentEmployeeIndex(currentEmployeeIndex - 1);
    }
  };

  const handleNextEmployee = () => {
    if (currentEmployeeIndex < transactionEmployees.length - 1) {
      setCurrentEmployeeIndex(currentEmployeeIndex + 1);
    }
  };

  const handleSendPayment = async () => {
    const currentEmployee = transactionEmployees[currentEmployeeIndex];
    if (!currentEmployee || !transactionCycleId) return;

    const currentTransactionRef = `${transactionCycleId}-${currentEmployee.id}`;
    const transactionNumber = transactionDetails[currentTransactionRef]?.trim();
    
    if (!transactionNumber) {
      toast({
        title: 'Transaction number required',
        description: 'Please enter a transaction reference number before sending the payment.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessingTransaction(true);

    try {
      // Call API to record the transaction
      const processedAt = transactionDetails[`${currentTransactionRef}-date`]
        ? new Date(transactionDetails[`${currentTransactionRef}-date`]).toISOString()
        : new Date().toISOString();

      const response = await axios.post(
        APIV3Dictionary.payroll.transactions.pay,
        {
          salaryRecordId: currentEmployee.id,
          paymentReference: transactionNumber,
          paymentMode: 'BANK_TRANSFER',
          processedAt,
          notes: transactionDetails[`${currentTransactionRef}-notes`] || ''
        },
        { withCredentials: true }
      );

      if (response.data?.success) {
        const payments = response.data?.data?.payments ?? [];
        const paymentResult = payments.length > 0 ? payments[0] : null;
        const updatedSalaryRecord = paymentResult?.salaryRecord;
        const paymentStatus = updatedSalaryRecord?.paymentStatus;
        const transactionAmount = paymentResult?.transaction?.amount ?? null;
        const totalEstimated =
          (currentEmployee.netSalary ?? 0) +
          (currentEmployee.incentive ?? 0) +
          (currentEmployee.bonus ?? 0);
        const isLogicalPayout = Boolean(
          paymentResult?.logicalPayout ||
          paymentStatus === 'NO_PAYOUT_REQUIRED' ||
          totalEstimated <= 0
        );

        // Mark as completed
        setCompletedTransactions((prev) => new Set([...prev, currentEmployee.id]));

        if (updatedSalaryRecord) {
          setTransactionEmployees((prev) => {
            const updated = [...prev];
            const existing = updated[currentEmployeeIndex];
            if (existing) {
              updated[currentEmployeeIndex] = {
                ...existing,
                status: updatedSalaryRecord.status ?? existing.status,
                paymentStatus: updatedSalaryRecord.paymentStatus ?? existing.paymentStatus,
                processedAt: updatedSalaryRecord.processedAt ?? existing.processedAt
              };
            }
            return updated;
          });
        }

        const employeeName = [currentEmployee.user?.firstName, currentEmployee.user?.lastName]
          .filter(Boolean)
          .join(' ') || currentEmployee.user?.email || 'the employee';

        const amountForDisplay = transactionAmount ?? totalEstimated;

        toast({
          title: isLogicalPayout ? 'Logical payout recorded' : 'Payment sent successfully',
          description: isLogicalPayout
            ? `No funds were transferred for ${employeeName} because the calculated payout was ${formatCurrency(amountForDisplay ?? 0)}. The record has been marked as settled.`
            : `Payment of ${formatCurrency(Math.max(amountForDisplay ?? 0, 0))} sent to ${employeeName}.`,
        });

        setTransactionSessionDirty(true);

        // Auto-advance to next employee if available
        setTimeout(() => {
          if (currentEmployeeIndex < transactionEmployees.length - 1) {
            handleNextEmployee();
          }
        }, 1000);
      } else {
        throw new Error(response.data?.message || 'Failed to record transaction');
      }
    } catch (error: any) {
      const message = getErrorMessage(error, 'Failed to record payment transaction.');
      toast({
        title: 'Payment recording failed',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessingTransaction(false);
    }
  };

  const handleCompleteAllTransactions = () => {
    toast({
      title: 'Payout process completed',
      description: `Successfully processed payments for ${transactionEmployees.length} employees.`,
    });
    setTransactionSessionDirty(true);
    handleCloseTransactionMode();
  };

  // Bank Details Functions
  const handleEditBankDetails = (employee: any) => {
    const bankDetails = employee.user?.bankDetails;
    setBankDetailsForm({
      accountHolderName: bankDetails?.accountHolderName ?? bankDetails?.accountHolder ?? '',
      bankName: bankDetails?.bankName ?? '',
      accountNumber: bankDetails?.accountNumber ?? bankDetails?.maskedAccountNumber ?? '',
      ifscCode: bankDetails?.ifscCode ?? '',
      accountType: bankDetails?.accountType ?? 'SAVINGS',
      maskedAccountNumber: bankDetails?.maskedAccountNumber ?? undefined,
      accountHolder: bankDetails?.accountHolder ?? undefined
    });
    setIsEditingBankDetails(true);
  };

  const handleCancelBankEdit = () => {
    setIsEditingBankDetails(false);
    setBankDetailsForm({
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      accountType: 'SAVINGS',
      maskedAccountNumber: undefined,
      accountHolder: undefined
    });
  };

  const isValidBankDetails = (details?: Partial<BankDetailsFormState> | null) => {
    const source = details ?? bankDetailsForm;

    if (!source) {
      return false;
    }

    const accountHolder = (source.accountHolderName ?? source.accountHolder ?? '').toString().trim();
    const bankName = (source.bankName ?? '').toString().trim();
    const accountNumber = (source.accountNumber ?? source.maskedAccountNumber ?? '').toString().trim();
    const ifscCode = (source.ifscCode ?? '').toString().trim();

    return Boolean(accountHolder && bankName && accountNumber && ifscCode);
  };

  const handleSaveBankDetails = async () => {
    const currentEmployee = transactionEmployees[currentEmployeeIndex];
    if (!currentEmployee || !isValidBankDetails()) return;

    setIsSavingBankDetails(true);

    try {
      const response = await axios.post(
        APIV3Dictionary.payroll.employee.createBankDetails,
        {
          userId: currentEmployee.user.id,
          accountHolderName: bankDetailsForm.accountHolderName.trim(),
          bankName: bankDetailsForm.bankName.trim(),
          accountNumber: bankDetailsForm.accountNumber.trim(),
          ifscCode: bankDetailsForm.ifscCode.trim(),
          accountType: bankDetailsForm.accountType
        },
        { withCredentials: true }
      );

      if (response.data?.success) {
        // Update the employee data in the current state
        const updatedEmployees = [...transactionEmployees];
        const trimmedAccountNumber = bankDetailsForm.accountNumber.trim();
        const maskedAccountNumber = trimmedAccountNumber
          ? `${'X'.repeat(Math.max(0, trimmedAccountNumber.length - 4))}${trimmedAccountNumber.slice(-4)}`
          : '';
        updatedEmployees[currentEmployeeIndex] = {
          ...currentEmployee,
          user: {
            ...currentEmployee.user,
            bankDetails: {
              accountHolderName: bankDetailsForm.accountHolderName.trim(),
              accountHolder: bankDetailsForm.accountHolderName.trim(),
              bankName: bankDetailsForm.bankName.trim(),
              accountNumber: bankDetailsForm.accountNumber.trim(),
              ifscCode: bankDetailsForm.ifscCode.trim(),
              accountType: bankDetailsForm.accountType,
              maskedAccountNumber
            }
          }
        };
        setTransactionEmployees(updatedEmployees);

        toast({
          title: 'Bank details saved',
          description: 'Bank details have been successfully updated.',
        });

        setIsEditingBankDetails(false);
        handleCancelBankEdit();
      } else {
        throw new Error(response.data?.message || 'Failed to save bank details');
      }
    } catch (error: any) {
      const message = getErrorMessage(error, 'Failed to save bank details.');
      toast({
        title: 'Save failed',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsSavingBankDetails(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-screen px-8 py-6 space-y-6 h-screen overflow-y-auto">
        <Skeleton className="h-10 w-60" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="w-screen px-8 py-6 space-y-6 h-screen overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Management System</h1>
          <p className="text-muted-foreground">Complete payroll workflow management and administration</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData()}
            disabled={isLoading || isProcessing || isCreatingCycle}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={isProcessing || isCreatingCycle}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenSettings}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            size="sm"
            onClick={() => startTutorial(activeTab === 'overview' ? 0 : tutorialStep)}
          >
            {hasSeenTutorial ? 'Replay Guided Tour' : 'Launch Guided Tour'}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load payroll dashboard</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="setup">Setup & Config</TabsTrigger>
          <TabsTrigger value="cycle-management">Cycle Management</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="review-approval">Review & Approval</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reporting">Reporting</TabsTrigger>
          <TabsTrigger value="audit-trail">Audit Trail</TabsTrigger>
          <TabsTrigger value="employee-portal">Employee Portal</TabsTrigger>
        </TabsList>

        <OverviewTab
          statistics={statistics}
          cycles={cycles}
          cyclesNeedingReview={cyclesNeedingReview}
          months={months}
          getProgressSnapshotForCycle={getProgressSnapshotForCycle}
          getProgressErrorForCycle={getProgressErrorForCycle}
          canDeleteCycle={canDeleteCycle}
          handleRequestDeleteCycle={handleRequestDeleteCycle}
          handleApproveCycle={handleApproveCycle}
          startPayrollCycle={startPayrollCycle}
          isProcessing={isProcessing}
          isDeletingCycle={isDeletingCycle}
          cyclePendingDelete={cyclePendingDelete}
        />

        <SetupConfigTab
          onOpenTemplates={navigateToTemplates}
          onNavigateEmployeePortal={navigateToEmployeePortal}
          onNavigateBankManagement={navigateToBankManagement}
          onNavigateNotificationSettings={navigateToNotificationSettings}
        />

        <CycleManagementTab
          months={months}
          years={years}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          onCreateCycle={createPayrollCycle}
          isCreatingCycle={isCreatingCycle}
          activeProcessingJobs={activeProcessingJobs}
          getProgressSnapshotForCycle={getProgressSnapshotForCycle}
          getProgressErrorForCycle={getProgressErrorForCycle}
          cycleProgressMap={cycleProgressMap}
        />

        <ProcessingTab
          processingCycles={processingCycles}
          months={months}
          getProgressSnapshotForCycle={getProgressSnapshotForCycle}
          getProgressErrorForCycle={getProgressErrorForCycle}
          onOpenProcessingDrawer={handleOpenProcessingDrawer}
          onStartPayrollCycle={startPayrollCycle}
          isProcessing={isProcessing}
        />

        <ReviewApprovalTab
          cyclesNeedingReview={cyclesNeedingReview}
          months={months}
          onApproveCycle={handleApproveCycle}
          onOpenReviewDetails={handleOpenReviewDetails}
          isProcessing={isProcessing}
          reviewLoadingCycleId={reviewLoadingCycleId}
        />

        <TransactionsTab
          payoutBuckets={payoutCycleBuckets}
          months={months}
          onOpenPayoutFlow={handleOpenPayoutFlow}
          onViewSummary={handleViewPayoutSummary}
          onExportPayouts={handleExportPayouts}
          onBulkPaymentRecord={handleBulkPaymentRecord}
          onNavigateReporting={() => setActiveTab('reporting')}
        />

        <ReportingTab onNavigate={handleReportNavigation} />

        <AuditTrailTab
          cycles={auditCycles}
          pagination={auditPagination}
          isLoadingCycles={isAuditCyclesLoading}
          cyclesError={auditCyclesError}
          onPageChange={fetchAuditCycles}
          onReloadCycles={() => fetchAuditCycles(auditPagination.page)}
          selectedCycleId={auditSelectedCycleId}
          onSelectCycle={(cycleId) => handleAuditCycleSelect(cycleId)}
          cycleDetails={auditCycleDetails}
          isLoadingDetails={isAuditDetailsLoading}
          detailsError={auditDetailsError}
          onRefreshCycle={refreshAuditCycleDetails}
        />

        {/* Transactions tab content consolidated in TransactionsTab component */}

        <EmployeePortalTab
          onPortalShortcut={handleEmployeePortalShortcut}
          onNavigateSendNotification={navigateToNotificationSend}
          onNavigatePortalSettings={navigateToNotificationSettings}
        />
      </Tabs>

      <TransactionModeDialog
        open={isTransactionModeOpen}
        onClose={handleCloseTransactionMode}
        employees={transactionEmployees}
        currentEmployeeIndex={currentEmployeeIndex}
        onPreviousEmployee={handlePreviousEmployee}
        onNextEmployee={handleNextEmployee}
        onSendPayment={handleSendPayment}
        onCompleteAll={handleCompleteAllTransactions}
        isProcessingTransaction={isProcessingTransaction}
        transactionDetails={transactionDetails}
        setTransactionDetails={setTransactionDetails}
        transactionCycleId={transactionCycleId}
        formatCurrency={formatCurrency}
        renderPaymentStatusBadge={renderPaymentStatusBadge}
        completedTransactions={completedTransactions}
        isEditingBankDetails={isEditingBankDetails}
        bankDetailsForm={bankDetailsForm}
        setBankDetailsForm={setBankDetailsForm}
        onEditBankDetails={handleEditBankDetails}
        onSaveBankDetails={handleSaveBankDetails}
        onCancelBankEdit={handleCancelBankEdit}
        isSavingBankDetails={isSavingBankDetails}
        isValidBankDetails={isValidBankDetails}
      />

      <ProcessingDrawer
        open={isProcessingDrawerOpen}
        onClose={handleCloseProcessingDrawer}
        selectedCycleLabel={selectedProcessingCycleMonthLabel}
        selectedCycleYear={selectedProcessingCycleYear}
        selectedCycle={selectedProcessingCycle}
        formatCurrency={formatCurrency}
        getStatusBadgeVariant={getStatusBadgeVariant}
        employeeSearchTerm={employeeSearchTerm}
        onEmployeeSearchTermChange={(value) => setEmployeeSearchTerm(value)}
        filteredRecords={filteredProcessingRecords}
        processingRecords={processingSalaryRecords}
        selectedRecord={selectedProcessingRecord}
        onSelectRecord={selectProcessingRecord}
        renderPaymentStatusBadge={renderPaymentStatusBadge}
        formatPaymentStatus={formatPaymentStatus}
        isLoading={isProcessingDrawerLoading}
        error={processingDrawerError}
        onRetry={() => {
          if (selectedProcessingCycle) {
            handleOpenProcessingDrawer(selectedProcessingCycle)
          }
        }}
        processingDetails={processingCycleDetails}
        allowanceEntries={processingAllowanceEntries}
        deductionEntries={processingDeductionEntries}
        calculationDetails={processingCalculationDetails}
        attendanceSummary={processingAttendanceSummary}
        cycleSummary={processingCycleSummary}
        onNavigateRecord={handleNavigateProcessingRecord}
        canNavigatePrev={canNavigateProcessingPrev}
        canNavigateNext={canNavigateProcessingNext}
        onSubmitCycleForReview={handleSubmitCycleForReview}
        canSubmitCycleForReview={canSubmitCycleForReview}
        isSubmittingForReview={isSubmittingForReview}
        onOpenTemplateDialog={handleOpenTemplateDialog}
        onRecalculateSalary={handleRecalculateSalary}
        isRecalculatingSalary={isRecalculatingSalary}
      />

      <TemplateDialog
        open={isTemplateDialogOpen}
        onOpen={handleOpenTemplateDialog}
        onClose={handleCloseTemplateDialog}
        templateDialogError={templateDialogError}
        templateSearchTerm={templateSearchTerm}
        onTemplateSearchTermChange={setTemplateSearchTerm}
        filteredTemplates={filteredTemplates}
        templatesLoading={templatesLoading}
        templateSelection={templateSelection}
        onTemplateSelectionChange={setTemplateSelection}
        onApplyTemplate={handleApplyTemplateToRecord}
        isApplyingTemplate={isApplyingTemplate}
        currentTemplateIdForRecord={currentTemplateIdForRecord}
        selectedEmployeeName={selectedEmployeeName}
      />

      <Dialog
        open={isReviewDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseReviewDetails();
          } else {
            setIsReviewDialogOpen(true);
          }
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-3xl lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCycleMonthLabel && selectedCycleDetails
                ? `Review ${selectedCycleMonthLabel} ${selectedCycleDetails.year}`
                : 'Payroll cycle details'}
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown of the payroll cycle before you approve or reject it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1">
            {isReviewDialogLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading cycle details…
              </div>
            ) : reviewDialogError ? (
              <div className="space-y-4 py-2">
                <Alert variant="destructive">
                  <AlertTitle>Unable to load cycle details</AlertTitle>
                  <AlertDescription>{reviewDialogError}</AlertDescription>
                </Alert>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCloseReviewDetails}>
                    Close
                  </Button>
                  {reviewDialogCycleId && (
                    <Button onClick={() => handleOpenReviewDetails(reviewDialogCycleId)}>
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            ) : selectedCycleDetails ? (
              <div className="space-y-6 py-2 pr-1">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="mt-2 inline-flex">
                      <Badge variant={getStatusBadgeVariant(selectedCycleDetails.status)}>
                        {selectedCycleDetails.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Total amount</p>
                    <p className="mt-2 text-lg font-semibold">{formatCurrency(selectedCycleDetails.totalAmount)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Processed employees</p>
                    <p className="mt-2 text-lg font-semibold">
                      {selectedCycleDetails.processedCount} / {selectedCycleDetails.totalEmployees}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Failed employees</p>
                    <p className="mt-2 text-lg font-semibold">{selectedCycleDetails.failedCount}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Template</p>
                    {templateAssigned ? (
                      <>
                        {templateDisplayLabel ? (
                          <p className="mt-2 font-semibold">{templateDisplayLabel}</p>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">Template linked to this cycle</p>
                        )}
                        {templateDescription && (
                          <p className="text-xs text-muted-foreground">{templateDescription}</p>
                        )}
                        {selectedCycleDetails.templateId && !selectedCycleDetails.template && (
                          <p className="text-xs text-muted-foreground">
                            Detailed template metadata is unavailable; showing identifier only.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">No template assigned</p>
                    )}
                  </div>
                  <div className="space-y-3 rounded-lg border p-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Processor</p>
                      <p className="mt-1 font-semibold">
                        {selectedCycleDetails.processor?.firstName || selectedCycleDetails.processor?.lastName
                          ? `${selectedCycleDetails.processor?.firstName ?? ''} ${selectedCycleDetails.processor?.lastName ?? ''}`.trim()
                          : 'Unassigned'}
                      </p>
                      {selectedCycleDetails.processor?.email && (
                        <p className="text-xs text-muted-foreground">{selectedCycleDetails.processor.email}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Approver</p>
                      <p className="mt-1 font-semibold">
                        {selectedCycleDetails.approver?.firstName || selectedCycleDetails.approver?.lastName
                          ? `${selectedCycleDetails.approver?.firstName ?? ''} ${selectedCycleDetails.approver?.lastName ?? ''}`.trim()
                          : 'Not yet approved'}
                      </p>
                      {selectedCycleDetails.approver?.email && (
                        <p className="text-xs text-muted-foreground">{selectedCycleDetails.approver.email}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold">Sample salary records</h4>
                  {previewSalaryRecords.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">No salary records processed yet.</p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {previewSalaryRecords.map((record) => {
                        const nameParts = [record.user?.firstName, record.user?.lastName].filter(Boolean);
                        const fullName = nameParts.join(' ') || 'Employee';

                        return (
                          <div key={record.id} className="rounded-lg border p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium">{fullName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {record.user?.employeeId ? `ID: ${record.user.employeeId}` : 'ID unavailable'}
                                  {record.user?.department?.name ? ` • ${record.user.department.name}` : ''}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{formatCurrency(record.netSalary)}</p>
                                <Badge variant="outline" className="mt-1">
                                  {record.status}
                                </Badge>
                                {record.paymentStatus && (
                                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                    Payment: {formatPaymentStatus(record.paymentStatus)}
                                  </p>
                                )}
                              </div>
                            </div>
                            {record.reviewComments && (
                              <p className="mt-2 text-xs italic text-muted-foreground">
                                Review comment: {record.reviewComments}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {remainingSalaryRecordCount > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      And {remainingSalaryRecordCount} more records in this cycle.
                    </p>
                  )}
                </div>

                {selectedCycleDetails.auditLogs?.length ? (
                  <div>
                    <h4 className="text-sm font-semibold">Recent audit activity</h4>
                    <div className="mt-3 space-y-2 text-sm">
                      {selectedCycleDetails.auditLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="rounded-md border p-2">
                          <p className="font-medium">{log.action.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                            {log.user ? ` • ${[log.user.firstName, log.user.lastName].filter(Boolean).join(' ')}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="py-6 text-sm text-muted-foreground">Select a cycle to view its details.</p>
            )}
          </div>

          {!isReviewDialogLoading && !reviewDialogError && selectedCycleDetails && (
            <DialogFooter className="mt-4 flex shrink-0 flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Processed {selectedCycleDetails.processedCount} of {selectedCycleDetails.totalEmployees} employees.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCloseReviewDetails}>
                  Close
                </Button>
                {selectedCycleDetails.status === 'REVIEW' && (
                  <Button
                    disabled={isProcessing}
                    onClick={async () => {
                      const { id, month, year } = selectedCycleDetails;
                      const approved = await handleApproveCycle({ id, month, year });
                      if (approved) {
                        handleCloseReviewDetails();
                      }
                    }}
                  >
                    Approve cycle
                  </Button>
                )}
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isTutorialOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeTutorial();
          } else {
            setIsTutorialOpen(true);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payroll admin guided tour</DialogTitle>
            <DialogDescription>
              Step {tutorialStep + 1} of {tutorialSteps.length}
            </DialogDescription>
          </DialogHeader>
          {activeTutorialStep && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {activeTutorialStep.description}
              </p>
              {activeTutorialStep.actionTab && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Quick tip</AlertTitle>
                  <AlertDescription>
                    Jump to the {activeTutorialStep.actionTab.replace('-', ' ')} tab to see this area in action.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => closeTutorial()}>
                Skip tour
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTutorialAdvance('back')}
                disabled={tutorialStep === 0}
              >
                Back
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {activeTutorialStep?.actionTab && (
                <Button variant="outline" onClick={handleTutorialCta}>
                  {activeTutorialStep.ctaLabel ?? 'Go to section'}
                </Button>
              )}
              <Button
                onClick={() => {
                  if (tutorialStep === tutorialSteps.length - 1) {
                    closeTutorial();
                  } else {
                    handleTutorialAdvance('next');
                  }
                }}
              >
                {tutorialStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isApprovalSuccessDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseApprovalSuccessDialog();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="space-y-2 text-left">
            <AlertDialogTitle>Transactions are ready</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                {lastApprovedCycleLabel && (
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {lastApprovedCycleLabel} cycle
                  </p>
                )}
                <p>
                  The payroll cycle you just approved is ready for disbursement. We’ve prepared the processed salaries in the Transactions tab so you can review payouts, add incentives, and trigger payments when finance gives the go-ahead.
                </p>
                <p>Here’s what you can tackle next:</p>
                <ul className="space-y-2 list-none p-0">
                  <li className="flex items-start gap-2">
                    <span aria-hidden="true" className="leading-6">⚡</span>
                    <span className="text-left">Jump to the Transactions tab to kick off payout prep</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span aria-hidden="true" className="leading-6">🧾</span>
                    <span className="text-left">Export or share the payout summary with finance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span aria-hidden="true" className="leading-6">🏦</span>
                    <span className="text-left">Record payment references once disbursements clear</span>
                  </li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleCloseApprovalSuccessDialog()}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleNavigateToTransactionsTab}>
              Go to transactions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(cyclePendingDelete)}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteDialog();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete payroll cycle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove every salary record, dispute, workflow step, and audit entry linked to
              {pendingDeleteLabel ? ` the ${pendingDeleteLabel} cycle` : ' this cycle'}. You can’t undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {cyclePendingDelete && (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Processed employees: {cyclePendingDelete.processedCount} of {cyclePendingDelete.totalEmployees}
              </p>
              <p>Total payroll amount: {formatCurrency(cyclePendingDelete.totalAmount)}</p>
              {cyclePendingDelete.failedCount > 0 && (
                <p>Failed records: {cyclePendingDelete.failedCount}</p>
              )}
            </div>
          )}
          {deleteError && (
            <Alert variant="destructive">
              <AlertTitle>Couldn’t delete cycle</AlertTitle>
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCycle} onClick={closeDeleteDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteCycle}
              disabled={isDeletingCycle}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingCycle ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </span>
              ) : (
                'Delete cycle'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(reportInfo)} onOpenChange={(open) => (!open ? handleCloseReportInfo() : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reportInfo?.title ?? 'Reporting shortcut'}</DialogTitle>
            <DialogDescription>
              {(reportInfo?.description ?? 'Use the linked workspace to continue this reporting task.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={handleCloseReportInfo}>
              Close
            </Button>
            {reportInfo?.onAction && (
              <Button
                onClick={() => {
                  reportInfo.onAction?.();
                  handleCloseReportInfo();
                }}
              >
                {reportInfo.actionLabel ?? 'Open workspace'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollAdminDashboard;
