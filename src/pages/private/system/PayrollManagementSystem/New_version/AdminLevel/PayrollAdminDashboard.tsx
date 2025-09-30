import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/providers/AuthContext'
import axios from 'axios'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'
import { toast } from '@/hooks/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Calendar,
  Settings,
  Users,
  FileText,
  BarChart3,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { MonthAndYearSelector } from '../ui/MonthYearPicker'
import {
  PayrollCycle,
  PayrollCycleDeletionResult,
  PayrollCycleDetails,
  PayrollStatistics,
  SalaryTemplate,
  PayrollCycleProcessingStatusResponse
} from '../types/payroll'
import { useNavigate, useSearchParams } from 'react-router-dom'
import RouteDict from '@/routes/RouteDict'
import { cn } from '@/lib/utils'

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

interface PayrollDashboardResponse {
  success: boolean
  message?: string
  data?: {
    cyclesNeedingReview?: PayrollCycle[]
    statistics?: PayrollStatistics | null
    recentCycles?: PayrollCycle[]
  }
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
  const navigateToBankManagement = () => navigate('/p/profile/bank');
  const navigateToNotificationSettings = () => navigate('/p/notification/settings');

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
        setReportInfo({
          title: 'Audit trail review',
          description: 'Head to the system activity logs to review every change captured during payroll processing.',
          actionLabel: 'View activity logs',
          onAction: () => navigate(RouteDict.System.ActivityLogs)
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

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Clock className="h-4 w-4" />;
      case 'IN_PROGRESS': return <Play className="h-4 w-4" />;
      case 'REVIEW': return <AlertCircle className="h-4 w-4" />;
      case 'APPROVED':
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
      case 'FAILED':
        return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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

  const formatDuration = (milliseconds?: number | null) => {
    if (!milliseconds || milliseconds <= 0) {
      return null;
    }

    const totalSeconds = Math.round(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    }

    return `${seconds}s`;
  };

  const selectedCycleMonthLabel = selectedCycleDetails
    ? months.find((m) => m.value === selectedCycleDetails.month)?.label ?? `Month ${selectedCycleDetails.month}`
    : null;

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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="setup">Setup & Config</TabsTrigger>
          <TabsTrigger value="cycle-management">Cycle Management</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="review-approval">Review & Approval</TabsTrigger>
          <TabsTrigger value="reporting">Reporting</TabsTrigger>
          <TabsTrigger value="employee-portal">Employee Portal</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cycles</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalCycles}</div>
                  <p className="text-xs text-muted-foreground">
                    {statistics.completedCycles} completed this year
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(statistics.totalAmountPaid)}</div>
                  <p className="text-xs text-muted-foreground">
                    To {statistics.totalEmployeesProcessed} employees
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.pendingCycles}</div>
                  <p className="text-xs text-muted-foreground">
                    Cycles awaiting approval
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.totalCycles > 0 
                      ? Math.round((statistics.completedCycles / statistics.totalCycles) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Successful completions
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cycles Needing Review */}
          {cyclesNeedingReview.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Cycles Needing Review ({cyclesNeedingReview.length})
                </CardTitle>
                <CardDescription>
                  These payroll cycles have been processed and are waiting for approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cyclesNeedingReview.map((cycle) => (
                    <div key={cycle.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">
                            {months.find(m => m.value === cycle.month)?.label} {cycle.year}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {cycle.processedCount} of {cycle.totalEmployees} employees processed
                          </p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(cycle.status)} className="flex items-center gap-1">
                          {getStatusIcon(cycle.status)}
                          {cycle.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">{formatCurrency(cycle.totalAmount)}</span>
                        {canDeleteCycle(cycle) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRequestDeleteCycle(cycle)}
                            disabled={isDeletingCycle && cyclePendingDelete?.id === cycle.id}
                          >
                            {isDeletingCycle && cyclePendingDelete?.id === cycle.id ? (
                              <span className="flex items-center gap-1">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Deleting
                              </span>
                            ) : (
                              'Delete'
                            )}
                          </Button>
                        )}
                        <Button 
                          onClick={() => approvePayrollCycle(cycle.id)}
                          disabled={isProcessing}
                          className="ml-4"
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Cycles */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payroll Cycles</CardTitle>
              <CardDescription>
                Overview of recent payroll processing activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cycles.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No payroll cycles found. Create one to get started.
                  </p>
                ) : (
                  cycles.map((cycle) => {
                    const monthLabel = months.find((m) => m.value === cycle.month)?.label ?? `Month ${cycle.month}`;
                    const progressSnapshot = getProgressSnapshotForCycle(cycle.id);
                    const progressPercent = progressSnapshot?.percentComplete ?? (
                      cycle.totalEmployees > 0
                        ? Math.round((cycle.processedCount / cycle.totalEmployees) * 100)
                        : 0
                    );
                    const etaLabel = formatDuration(progressSnapshot?.etaMs ?? null);
                    const statusMessage = progressSnapshot?.message;
                    const progressError = getProgressErrorForCycle(cycle.id);
                    const processedCount = progressSnapshot?.processedCount ?? cycle.processedCount;
                    const totalEmployees = progressSnapshot?.totalEmployees ?? cycle.totalEmployees;
                    const failedCount = progressSnapshot?.failedCount ?? cycle.failedCount;

                    return (
                      <div key={cycle.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex w-full flex-col gap-3">
                          <div className="flex flex-wrap items-center gap-4">
                            <div>
                              <h4 className="font-medium">
                                {monthLabel} {cycle.year}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {processedCount} of {totalEmployees} employees
                                {failedCount > 0 && ` • ${failedCount} failed`}
                              </p>
                              {statusMessage && (
                                <p className="text-xs text-muted-foreground">{statusMessage}</p>
                              )}
                              {progressError && (
                                <p className="text-xs text-destructive">{progressError}</p>
                              )}
                            </div>
                            <Badge variant={getStatusBadgeVariant(cycle.status)} className="flex items-center gap-1">
                              {getStatusIcon(cycle.status)}
                              {cycle.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          {cycle.status === 'IN_PROGRESS' && (
                            <div className="w-full max-w-md">
                              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span>{Math.min(progressPercent, 100)}%</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                                <div
                                  className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                                ></div>
                              </div>
                              <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                                {etaLabel ? <span>ETA {etaLabel}</span> : <span>&nbsp;</span>}
                                <span>
                                  {processedCount}/{totalEmployees}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(cycle.totalAmount)}</p>
                            {cycle.completedAt && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(cycle.completedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          {canDeleteCycle(cycle) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRequestDeleteCycle(cycle)}
                              disabled={isDeletingCycle && cyclePendingDelete?.id === cycle.id}
                            >
                              {isDeletingCycle && cyclePendingDelete?.id === cycle.id ? (
                                <span className="flex items-center gap-1">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Deleting
                                </span>
                              ) : (
                                'Delete'
                              )}
                            </Button>
                          )}
                          {cycle.status === 'DRAFT' && (
                            <Button
                              onClick={() => startPayrollCycle(cycle.id)}
                              disabled={isProcessing}
                              size="sm"
                            >
                              Start
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Setup & Configuration Tab */}
        <TabsContent value="setup" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Salary Templates & Structures
                </CardTitle>
                <CardDescription>
                  Define and configure salary calculation rules and templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline" onClick={() => navigateToTemplates()}>
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Salary Templates
                </Button>
                <Button className="w-full" variant="outline" onClick={() => navigateToTemplates('rules')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Calculation Rules
                </Button>
                <Button className="w-full" variant="outline" onClick={() => navigateToTemplates('assignments')}>
                  <Users className="h-4 w-4 mr-2" />
                  Apply to Users/Departments
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee Management
                </CardTitle>
                <CardDescription>
                  Manage employee information and bank details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline" onClick={navigateToEmployeePortal}>
                  <Users className="h-4 w-4 mr-2" />
                  Employee Self-Service Portal
                </Button>
                <Button className="w-full" variant="outline" onClick={navigateToBankManagement}>
                  <FileText className="h-4 w-4 mr-2" />
                  Bank Details Management
                </Button>
                <Button className="w-full" variant="outline" onClick={navigateToNotificationSettings}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Notification Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cycle Management Tab */}
        <TabsContent value="cycle-management" className="space-y-6">
          {/* Create New Cycle */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Payroll Cycle</CardTitle>
              <CardDescription>
                Start a new monthly payroll cycle for bulk salary generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MonthAndYearSelector 
                months={months} 
                years={years} 
                selectedMonth={selectedMonth} 
                selectedYear={selectedYear} 
                setSelectedMonth={setSelectedMonth} 
                setSelectedYear={setSelectedYear} 
              />
              <Button 
                onClick={createPayrollCycle}
                disabled={isCreatingCycle}
                className="w-full"
              >
                {isCreatingCycle ? 'Creating...' : 'Create Payroll Cycle'}
              </Button>
            </CardContent>
          </Card>

          {/* Cycle Processing Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Processing Queue
              </CardTitle>
              <CardDescription>
                Background job queue for payroll calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeProcessingJobs.length ? (
                <div className="space-y-3">
                  {activeProcessingJobs.map((cycle) => {
                    const monthLabel = months.find((m) => m.value === cycle.month)?.label ?? `Month ${cycle.month}`;
                    const progressSnapshot = getProgressSnapshotForCycle(cycle.id);
                    const progressPercent =
                      progressSnapshot?.percentComplete ??
                      (cycle.totalEmployees > 0
                        ? Math.round((cycle.processedCount / cycle.totalEmployees) * 100)
                        : 0);
                    const processedCount = progressSnapshot?.processedCount ?? cycle.processedCount;
                    const totalEmployees = progressSnapshot?.totalEmployees ?? cycle.totalEmployees;
                    const jobStatus = cycleProgressMap[cycle.id]?.job?.status ?? 'PENDING';
                    const etaLabel = formatDuration(progressSnapshot?.etaMs ?? null);
                    const statusMessage = progressSnapshot?.message;
                    const progressError = getProgressErrorForCycle(cycle.id);
                    const jobUpdatedAt = cycleProgressMap[cycle.id]?.job?.updatedAt ?? null;

                    return (
                      <div key={cycle.id} className="rounded-lg border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h4 className="font-medium">
                              {monthLabel} {cycle.year}
                            </h4>
                            <p className="text-xs text-muted-foreground capitalize">
                              Job status: {jobStatus.toLowerCase()}
                              {jobUpdatedAt && ` • updated ${new Date(jobUpdatedAt).toLocaleTimeString()}`}
                            </p>
                            {statusMessage && (
                              <p className="text-xs text-muted-foreground">{statusMessage}</p>
                            )}
                            {progressError && (
                              <p className="text-xs text-destructive">{progressError}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {jobStatus.toLowerCase()}
                          </Badge>
                        </div>
                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span>{Math.min(progressPercent, 100)}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            ></div>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                            {etaLabel ? <span>ETA {etaLabel}</span> : <span>&nbsp;</span>}
                            <span>
                              {processedCount}/{totalEmployees}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active processing jobs</p>
                  <p className="text-sm">Jobs will appear here when payroll calculations are running</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processing Tab */}
        <TabsContent value="processing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Processing Workspace
              </CardTitle>
              <CardDescription>
                Inspect salary breakdowns, adjust templates, and validate attendance before moving a cycle to review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Choose a cycle below to open the employee-by-employee processing panel. From there you can drill into salary
                components, compare templates, and capture attendance corrections prior to approval.
              </p>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>What you can manage here</AlertTitle>
                <AlertDescription>
                  <ul className="ml-5 list-disc space-y-1 text-xs leading-relaxed text-muted-foreground">
                    <li>Review salary breakdowns with allowances, deductions, and adjustments for each employee.</li>
                    <li>Preview attendance timelines to spot missing punches or leave discrepancies.</li>
                    <li>Queue up template changes or regeneration requests before handing off for approval.</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cycles ready for processing</CardTitle>
              <CardDescription>
                Draft and in-progress cycles that still need validation before review and approval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processingCycles.length ? (
                <div className="space-y-3">
                  {processingCycles.map((cycle) => {
                    const monthLabel = months.find((m) => m.value === cycle.month)?.label ?? `Month ${cycle.month}`;
                    const progressSnapshot = getProgressSnapshotForCycle(cycle.id);
                    const progressPercent =
                      progressSnapshot?.percentComplete ??
                      (cycle.totalEmployees > 0
                        ? Math.round((cycle.processedCount / cycle.totalEmployees) * 100)
                        : 0);
                    const processedCount = progressSnapshot?.processedCount ?? cycle.processedCount;
                    const totalEmployees = progressSnapshot?.totalEmployees ?? cycle.totalEmployees;
                    const failedCount = progressSnapshot?.failedCount ?? cycle.failedCount;
                    const etaLabel = formatDuration(progressSnapshot?.etaMs ?? null);
                    const statusMessage = progressSnapshot?.message;
                    const progressError = getProgressErrorForCycle(cycle.id);

                    return (
                      <div
                        key={cycle.id}
                        className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-semibold">
                              {monthLabel} {cycle.year}
                            </h4>
                            <Badge variant={getStatusBadgeVariant(cycle.status)}>
                              {cycle.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {processedCount} of {totalEmployees} employees processed
                            {failedCount > 0 ? ` • ${failedCount} failed` : ''}
                          </p>
                          {statusMessage && (
                            <p className="text-xs text-muted-foreground">{statusMessage}</p>
                          )}
                          {progressError && (
                            <p className="text-xs text-destructive">{progressError}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span>Total amount {formatCurrency(cycle.totalAmount)}</span>
                            <span>Progress {Math.min(progressPercent, 100)}%</span>
                            {etaLabel && <span>ETA {etaLabel}</span>}
                          </div>
                          <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex flex-col items-stretch gap-2 md:items-end">
                          <Button variant="outline" size="sm" onClick={() => handleOpenProcessingDrawer(cycle)}>
                            Open processing workspace
                          </Button>
                          {cycle.status === 'DRAFT' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startPayrollCycle(cycle.id)}
                              disabled={isProcessing}
                            >
                              Start cycle
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  All caught up! Begin a new cycle or resume an in-progress run to continue processing salaries.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review & Approval Tab */}
        <TabsContent value="review-approval" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Bulk Review & Approval
              </CardTitle>
              <CardDescription>
                Review and approve payroll calculations with comments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cyclesNeedingReview.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No cycles pending review</p>
                  <p className="text-sm">Cycles will appear here when they need approval</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cyclesNeedingReview.map((cycle) => (
                    <div key={cycle.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-medium">
                            {months.find(m => m.value === cycle.month)?.label} {cycle.year}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {cycle.processedCount} employees processed
                          </p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(cycle.status)}>
                          {cycle.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approvePayrollCycle(cycle.id)} disabled={isProcessing}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenReviewDetails(cycle.id)}
                          disabled={reviewLoadingCycleId === cycle.id}
                        >
                          {reviewLoadingCycleId === cycle.id ? (
                            <span className="flex items-center gap-1">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading
                            </span>
                          ) : (
                            'Review Details'
                          )}
                        </Button>
                        <Button size="sm" variant="destructive" disabled={isProcessing}>
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reporting Tab */}
        <TabsContent value="reporting" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics & Reports
                </CardTitle>
                <CardDescription>
                  Generate compliance reports and analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline" onClick={() => handleReportNavigation('tax')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Tax Summaries
                </Button>
                <Button className="w-full" variant="outline" onClick={() => handleReportNavigation('analytics')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Payroll Analytics
                </Button>
                <Button className="w-full" variant="outline" onClick={() => handleReportNavigation('export')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Audit & Compliance
                </CardTitle>
                <CardDescription>
                  Audit trails and compliance reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline" onClick={() => handleReportNavigation('audit')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Audit Trail Review
                </Button>
                <Button className="w-full" variant="outline" onClick={() => handleReportNavigation('compliance')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Compliance Reports
                </Button>
                <Button className="w-full" variant="outline" onClick={() => handleReportNavigation('corrections')}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Handle Corrections
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employee Portal Tab */}
        <TabsContent value="employee-portal" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee Access
                </CardTitle>
                <CardDescription>
                  Employee self-service features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline" onClick={() => handleEmployeePortalShortcut('payslips')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Historical Payslips
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleEmployeePortalShortcut('payslips', { action: 'download' })}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download/Print Options
                </Button>
                <Button className="w-full" variant="outline" onClick={() => handleEmployeePortalShortcut('disputes')}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Dispute Filing
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Employee notification management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline" onClick={() => navigate(RouteDict.Notification.Send)}>
                  <Users className="h-4 w-4 mr-2" />
                  Send Notifications
                </Button>
                <Button className="w-full" variant="outline" onClick={() => handleEmployeePortalShortcut('profile')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Preview Portal
                </Button>
                <Button className="w-full" variant="outline" onClick={() => navigate(RouteDict.Notification.Settings)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Portal Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Drawer
        open={isProcessingDrawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseProcessingDrawer();
          }
        }}
      >
        <DrawerContent className="flex h-[90vh] max-h-[90vh] flex-col">
          <DrawerHeader className="gap-1">
            <DrawerTitle>
              {selectedProcessingCycleMonthLabel && selectedProcessingCycleYear
                ? `Processing ${selectedProcessingCycleMonthLabel} ${selectedProcessingCycleYear}`
                : 'Cycle processing workspace'}
            </DrawerTitle>
            <DrawerDescription>
              Navigate through each employee to validate salary breakdowns, attendance inputs, and template assignments before approval.
            </DrawerDescription>
            {selectedProcessingCycle && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <Badge variant={getStatusBadgeVariant(selectedProcessingCycle.status)}>
                  {selectedProcessingCycle.status.replace('_', ' ')}
                </Badge>
                <span>
                  {selectedProcessingCycle.processedCount} / {selectedProcessingCycle.totalEmployees} processed
                </span>
                {typeof selectedProcessingCycle.totalAmount === 'number' && (
                  <span>Total {formatCurrency(selectedProcessingCycle.totalAmount)}</span>
                )}
              </div>
            )}
          </DrawerHeader>

          <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
            <div className="border-b md:w-72 md:border-b-0 md:border-r">
              <div className="px-3 pb-2 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Employees
                </div>
                <Input
                  value={employeeSearchTerm}
                  onChange={(event) => setEmployeeSearchTerm(event.target.value)}
                  placeholder="Search by name or ID"
                  className="h-8"
                  aria-label="Search employees"
                />
              </div>
              <ScrollArea className="h-48 md:h-full">
                <div className="space-y-2 px-3 pb-6">
                  {filteredProcessingRecords.length ? (
                    filteredProcessingRecords.map((record) => {
                      const fullName = [record.user?.firstName, record.user?.lastName]
                        .filter(Boolean)
                        .join(' ') || 'Employee';
                      const employeeId = record.user?.employeeId || 'ID unavailable';
                      const isActive = selectedProcessingRecord?.id === record.id;

                      return (
                        <button
                          key={record.id}
                          type="button"
                          onClick={() => selectProcessingRecord(record.id)}
                          className={cn(
                            'w-full rounded-md border p-3 text-left transition-colors',
                            isActive
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border bg-muted/40 hover:bg-muted'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{fullName}</span>
                            <Badge variant={getStatusBadgeVariant(record.status)}>{record.status}</Badge>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {employeeId} • Net {formatCurrency(record.netSalary)}
                          </p>
                          {record.paymentStatus && (
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Payment: {record.paymentStatus}
                            </p>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-10 text-center text-xs text-muted-foreground">
                      {processingSalaryRecords.length
                        ? 'No employees match your search.'
                        : 'No salary records generated yet for this cycle.'}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-6">
              {isProcessingDrawerLoading ? (
                <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading cycle details…
                </div>
              ) : processingDrawerError ? (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertTitle>Unable to load processing data</AlertTitle>
                    <AlertDescription>{processingDrawerError}</AlertDescription>
                  </Alert>
                  <div>
                    <Button
                      size="sm"
                      onClick={() => selectedProcessingCycle && handleOpenProcessingDrawer(selectedProcessingCycle)}
                    >
                      Retry fetch
                    </Button>
                  </div>
                </div>
              ) : selectedProcessingRecord ? (
                <div className="space-y-4">
                  {isRecalculatingSalary && (
                    <Alert>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertTitle>Recalculating salary…</AlertTitle>
                      <AlertDescription>
                        We’re regenerating this employee’s payroll data using the latest template and attendance inputs.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold">
                            {[selectedProcessingRecord.user?.firstName, selectedProcessingRecord.user?.lastName]
                              .filter(Boolean)
                              .join(' ') || 'Employee overview'}
                          </CardTitle>
                          <CardDescription>
                            {selectedProcessingRecord.user?.employeeId || 'Employee ID unavailable'} •
                            {' '}
                            {(selectedProcessingRecord.user?.department?.name &&
                              selectedProcessingRecord.user.department.name) || 'Department N/A'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleNavigateProcessingRecord('previous')}
                            disabled={!canNavigateProcessingPrev}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleNavigateProcessingRecord('next')}
                            disabled={!canNavigateProcessingNext}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant={getStatusBadgeVariant(selectedProcessingRecord.status)}>
                          {selectedProcessingRecord.status}
                        </Badge>
                        {selectedProcessingRecord.paymentStatus && (
                          <Badge variant="outline">Payment {selectedProcessingRecord.paymentStatus}</Badge>
                        )}
                        <span>
                          Net salary {formatCurrency(selectedProcessingRecord.netSalary)} • Basic{' '}
                          {formatCurrency(selectedProcessingRecord.basicSalary)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border p-4">
                          <p className="text-xs text-muted-foreground">Template</p>
                          <p className="mt-1 font-semibold">
                            {selectedProcessingRecord.templateName || selectedProcessingRecord.templateId ||
                              processingCycleDetails?.template?.name ||
                              'Template not assigned'}
                          </p>
                          {processingCycleDetails?.template?.description && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {processingCycleDetails.template.description}
                            </p>
                          )}
                        </div>
                        <div className="rounded-lg border p-4">
                          <p className="text-xs text-muted-foreground">Processing timeline</p>
                          <p className="mt-1 text-sm">
                            Calculated on{' '}
                            {selectedProcessingRecord.processedAt
                              ? new Date(selectedProcessingRecord.processedAt).toLocaleString()
                              : 'Not processed yet'}
                          </p>
                          {selectedProcessingRecord.reviewedAt && (
                            <p className="text-xs text-muted-foreground">
                              Reviewed on {new Date(selectedProcessingRecord.reviewedAt).toLocaleString()}
                            </p>
                          )}
                          {selectedProcessingRecord.reviewComments && (
                            <p className="mt-1 text-xs italic text-muted-foreground">
                              “{selectedProcessingRecord.reviewComments}”
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Salary breakdown</CardTitle>
                      <CardDescription>
                        Detailed earnings and deductions for the selected employee in this cycle.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <h4 className="text-sm font-semibold">Allowances</h4>
                          <Separator className="my-2" />
                          {processingAllowanceEntries.length ? (
                            <div className="space-y-2">
                              {processingAllowanceEntries.map((entry) => (
                                <div key={entry.key} className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">{entry.key}</span>
                                  <span className="font-medium">{formatCurrency(entry.amount)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No allowances applied.</p>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold">Deductions</h4>
                          <Separator className="my-2" />
                          {processingDeductionEntries.length ? (
                            <div className="space-y-2">
                              {processingDeductionEntries.map((entry) => (
                                <div key={entry.key} className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">{entry.key}</span>
                                  <span className="font-medium">{formatCurrency(entry.amount)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No deductions recorded.</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold">Calculation details</h4>
                        <Separator className="my-2" />
                        {processingCalculationDetails.length ? (
                          <div className="space-y-3 text-sm">
                            {processingCalculationDetails.map((item, index) => (
                              <div key={`${item.label}-${index}`} className="rounded-md border p-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{item.label}</span>
                                  <span className={cn('font-semibold', item.amount < 0 && 'text-destructive')}>
                                    {formatCurrency(item.amount)}
                                  </span>
                                </div>
                                {item.description && (
                                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                                )}
                                {item.formula && (
                                  <p className="mt-1 text-[10px] font-mono text-muted-foreground">
                                    {item.formula}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Detailed calculation traces will appear here once available from the engine.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Attendance review</CardTitle>
                      <CardDescription>
                        Verify check-in/out data and leave contributions impacting this salary.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {processingAttendanceSummary ? (
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Working days</p>
                            <p className="text-lg font-semibold">
                              {processingAttendanceSummary.workingDays ?? processingAttendanceSummary.totalDays ?? 0}
                            </p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Presence mix</p>
                            <p className="text-sm font-medium">
                              Present {processingAttendanceSummary.presentDays ?? 0} • Absent {processingAttendanceSummary.absentDays ?? 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Paid leave {processingAttendanceSummary.paidLeaveDays ?? 0} • Unpaid leave {processingAttendanceSummary.unpaidLeaveDays ?? 0}
                            </p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Overtime & Exceptions</p>
                            <p className="text-sm font-medium">
                              Overtime {processingAttendanceSummary.overtimeHours ?? 0}h • Late marks {processingAttendanceSummary.lateMarks ?? 0}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <Alert>
                          <AlertTitle>Attendance integration coming soon</AlertTitle>
                          <AlertDescription>
                            Raw attendance records are not yet linked. This section will surface check-ins, leaves, and manual adjustments once the integration lands.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Next actions</CardTitle>
                      <CardDescription>
                        Use these quick actions to finalise salaries before sending the cycle for review. Additional adjustment tooling is on the way.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        • Use <span className="font-medium">Change template</span> to reassign the employee to a different salary structure instantly.
                      </p>
                      <p>
                        • Kick off a clean recalculation with <span className="font-medium">Recalculate salary</span> to pull in the latest template and attendance data.
                      </p>
                      <p>
                        • Manual attendance corrections will arrive soon and auto-trigger regeneration with full audit logging.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Select a salary record from the list to view its breakdown.
                </div>
              )}
            </div>
          </div>

          <DrawerFooter className="flex flex-col gap-2 border-t py-3 md:flex-row md:items-center md:justify-between">
            <p
              className={cn(
                'text-xs text-muted-foreground',
                (processingCycleSummary.pending > 0 || processingCycleSummary.failed > 0) && 'text-destructive'
              )}
            >
              {processingCycleSummary.total
                ? `${processingCycleSummary.pending} pending • ${processingCycleSummary.approved} ready • ${processingCycleSummary.failed} require attention`
                : 'No salary records generated yet for this cycle.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <DrawerClose asChild>
                <Button variant="outline" size="sm">
                  Close
                </Button>
              </DrawerClose>
              <Button
                size="sm"
                onClick={handleSubmitCycleForReview}
                disabled={
                  !canSubmitCycleForReview ||
                  isProcessingDrawerLoading ||
                  isRecalculatingSalary ||
                  isSubmittingForReview
                }
              >
                {isSubmittingForReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit for review
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenTemplateDialog}
                disabled={!selectedProcessingRecord || isProcessingDrawerLoading || isRecalculatingSalary || isSubmittingForReview}
              >
                Change template
              </Button>
              <Button
                size="sm"
                onClick={handleRecalculateSalary}
                disabled={!selectedProcessingRecord || isProcessingDrawerLoading || isRecalculatingSalary || isSubmittingForReview}
              >
                {isRecalculatingSalary && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Recalculate salary
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Dialog
        open={isTemplateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseTemplateDialog();
          } else if (!isTemplateDialogOpen) {
            handleOpenTemplateDialog();
          }
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col gap-4 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Change salary template</DialogTitle>
            <DialogDescription>
              Select a template to re-run calculations for{' '}
              {[selectedProcessingRecord?.user?.firstName, selectedProcessingRecord?.user?.lastName]
                .filter(Boolean)
                .join(' ') || 'this employee'}.
            </DialogDescription>
          </DialogHeader>

          {templateDialogError && (
            <Alert variant="destructive">
              <AlertTitle>Unable to load templates</AlertTitle>
              <AlertDescription>{templateDialogError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="template-search">Search templates</Label>
              <Input
                id="template-search"
                placeholder="Search by name or description"
                value={templateSearchTerm}
                onChange={(event) => setTemplateSearchTerm(event.target.value)}
              />
            </div>

            <div className="rounded-md border">
              {templatesLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching templates…
                </div>
              ) : filteredTemplates.length ? (
                <ScrollArea className="h-64">
                  <RadioGroup
                    value={templateSelection ?? ''}
                    onValueChange={(value) => setTemplateSelection(value)}
                    className="divide-y"
                  >
                    {filteredTemplates.map((template) => (
                      <div key={template.id} className="flex items-start gap-3 p-3">
                        <RadioGroupItem value={template.id} id={`template-${template.id}`} />
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Label htmlFor={`template-${template.id}`} className="text-sm font-semibold">
                              {template.name}
                            </Label>
                            {template.isDefault && <Badge variant="secondary">Default</Badge>}
                            {!template.isActive && <Badge variant="destructive">Inactive</Badge>}
                          </div>
                          {template.description && (
                            <p className="text-xs text-muted-foreground">{template.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </ScrollArea>
              ) : (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {templateDialogError
                    ? 'Templates could not be loaded. Please retry.'
                    : 'No templates found. Create one in the Salary Template workspace.'}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" onClick={handleCloseTemplateDialog} disabled={isApplyingTemplate}>
              Cancel
            </Button>
            <Button
              onClick={handleApplyTemplateToRecord}
              disabled={
                !templateSelection ||
                templateSelection === currentTemplateIdForRecord ||
                isApplyingTemplate
              }
            >
              {isApplyingTemplate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                                    Payment: {record.paymentStatus}
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
                      const approved = await approvePayrollCycle(selectedCycleDetails.id);
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
