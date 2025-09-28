import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
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
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Settings,
  Plus,
  Calculator,
  Building2,
  RefreshCw,
  ShieldCheck,
  ToggleRight,
  Info,
  PenLine,
  Trash2,
  UserPlus,
  Loader2
} from 'lucide-react'
import { CalculationRule, SalaryTemplate } from '../types/payroll'
import { useSearchParams } from 'react-router-dom'

interface ApiResponse<T> {
  success?: boolean
  data?: T
  message?: string
}

type AllowanceEntry = {
  name: string
  type: 'fixed' | 'percentage'
  value: number
  taxable: boolean
}

type DeductionEntry = {
  name: string
  type: 'fixed' | 'percentage'
  value: number
  mandatory: boolean
}

type TaxBracketEntry = {
  min: number
  max: number | null
  rate: number
}

interface TemplateFormState {
  name: string
  description: string
  isDefault: boolean
  isActive: boolean
  basicSalaryType: 'fixed' | 'percentage'
  basicSalaryValue: number
  overtimeEnabled: boolean
  overtimeMultiplier: number
  overtimeThreshold: number
  taxEnabled: boolean
}

interface TemplateAssignmentSummary {
  id: string
  name: string
  description?: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  assignedEmployees: number
  departments: Array<{
    departmentId: string
    departmentName: string
    employeeCount: number
  }>
}

interface AssignmentTargets {
  employees: Array<{
    id: string
    firstName?: string | null
    lastName?: string | null
    email: string
    salaryTemplateId?: string | null
    department?: {
      id: string
      name: string
    } | null
  }>
  departments: Array<{
    id: string
    name: string
  }>
}
 
interface RuleFormState {
  name: string
  formula: string
  type: 'allowance' | 'deduction' | 'tax'
  isActive: boolean
}

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

const normalizeTemplates = (payload: ApiResponse<SalaryTemplate[]> | SalaryTemplate[] | undefined) => {
  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload
  }

  if (payload.success === false) {
    return []
  }

  return Array.isArray(payload.data) ? payload.data : []
}

const normalizeRules = (payload: ApiResponse<CalculationRule[]> | CalculationRule[] | undefined) => {
  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload
  }

  if (payload.success === false) {
    return []
  }

  return Array.isArray(payload.data) ? payload.data : []
}

const allowedTabValues = new Set(['templates', 'rules', 'assignments'])

const createDefaultTemplateFormState = (): TemplateFormState => ({
  name: '',
  description: '',
  isDefault: false,
  isActive: true,
  basicSalaryType: 'fixed',
  basicSalaryValue: 0,
  overtimeEnabled: false,
  overtimeMultiplier: 1.5,
  overtimeThreshold: 40,
  taxEnabled: false
})

const createEmptyAllowance = (): AllowanceEntry => ({
  name: '',
  type: 'fixed',
  value: 0,
  taxable: true
})

const createEmptyDeduction = (): DeductionEntry => ({
  name: '',
  type: 'fixed',
  value: 0,
  mandatory: false
})

const createDefaultTaxBracket = (): TaxBracketEntry => ({
  min: 0,
  max: null,
  rate: 10
})

const isValidTab = (value: string | null): value is 'templates' | 'rules' | 'assignments' => {
  if (!value) {
    return false
  }

  return allowedTabValues.has(value)
}

const SalaryTemplateEditor = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = isValidTab(searchParams.get('tab')) ? (searchParams.get('tab') as 'templates' | 'rules' | 'assignments') : 'templates'

  const [templates, setTemplates] = useState<SalaryTemplate[]>([])
  const [calculationRules, setCalculationRules] = useState<CalculationRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [loadErrors, setLoadErrors] = useState<string[]>([])

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [templateDialogMode, setTemplateDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [templateSubmitting, setTemplateSubmitting] = useState(false)
  const [templateForm, setTemplateForm] = useState<TemplateFormState>(() => createDefaultTemplateFormState())
  const [allowances, setAllowances] = useState<AllowanceEntry[]>([])
  const [deductions, setDeductions] = useState<DeductionEntry[]>([])
  const [taxBrackets, setTaxBrackets] = useState<TaxBracketEntry[]>([])

  const [templateActionLoading, setTemplateActionLoading] = useState<Record<string, boolean>>({})
  const [templateDeleteId, setTemplateDeleteId] = useState<string | null>(null)

  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [ruleForm, setRuleForm] = useState<RuleFormState>({
    name: '',
    formula: '',
    type: 'allowance',
    isActive: true
  })
  const [ruleSubmitting, setRuleSubmitting] = useState(false)
  const [ruleActionLoading, setRuleActionLoading] = useState<Record<string, boolean>>({})
  const [ruleDeleteId, setRuleDeleteId] = useState<string | null>(null)

  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
  const [assignmentSummaryLoading, setAssignmentSummaryLoading] = useState(false)
  const [assignmentTargetsLoading, setAssignmentTargetsLoading] = useState(false)
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false)
  const [assignmentSummaries, setAssignmentSummaries] = useState<TemplateAssignmentSummary[]>([])
  const [assignmentTargets, setAssignmentTargets] = useState<AssignmentTargets>({ employees: [], departments: [] })
  const [selectedAssignmentTemplateId, setSelectedAssignmentTemplateId] = useState<string | null>(null)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set())
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<Set<string>>(new Set())
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [departmentSearch, setDepartmentSearch] = useState('')

  const fetchTemplateData = useCallback(async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
    if (!user?.id) {
      setTemplates([])
      setCalculationRules([])
      setLoadErrors(['You need to be logged in to manage salary templates.'])
      if (showLoading) {
        setIsLoading(false)
      }
      return
    }

    if (showLoading) {
      setIsLoading(true)
    }

    const errors: string[] = []

    try {
      if (!showLoading) {
        setIsRefreshing(true)
      }

      const [templatesResponse, rulesResponse] = await Promise.allSettled([
        axios.get<ApiResponse<SalaryTemplate[]>>(APIV3Dictionary.payroll.templates.list, {
          withCredentials: true
        }),
        axios.get<ApiResponse<CalculationRule[]>>(APIV3Dictionary.payroll.templates.rules, {
          withCredentials: true
        })
      ])

      if (templatesResponse.status === 'fulfilled') {
        const payload = templatesResponse.value.data
        if (payload?.success === false) {
          errors.push(payload.message || 'Failed to load salary templates.')
          setTemplates([])
        } else {
          setTemplates(normalizeTemplates(payload))
        }
      } else {
        const message = getErrorMessage(templatesResponse.reason, 'Failed to load salary templates.')
        errors.push(message)
        setTemplates([])
      }

      if (rulesResponse.status === 'fulfilled') {
        const payload = rulesResponse.value.data
        if (payload?.success === false) {
          errors.push(payload.message || 'Failed to load calculation rules.')
          setCalculationRules([])
        } else {
          setCalculationRules(normalizeRules(payload))
        }
      } else {
        const message = getErrorMessage(rulesResponse.reason, 'Failed to load calculation rules.')
        errors.push(message)
        setCalculationRules([])
      }

      if (errors.length > 0) {
        const combinedMessage = errors.join(' ')
        setLoadErrors(errors)
        if (showLoading) {
          toast({
            title: 'Unable to load salary template data',
            description: combinedMessage,
            variant: 'destructive'
          })
        }
      } else {
        setLoadErrors([])
      }
    } catch (error) {
      const message = getErrorMessage(error, 'An unexpected error occurred while fetching template data.')
      console.error('Error fetching template data:', error)
      setTemplates([])
      setCalculationRules([])
      setLoadErrors([message])
      toast({
        title: 'Unable to load salary template data',
        description: message,
        variant: 'destructive'
      })
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
      setIsRefreshing(false)
    }
  }, [user?.id])

  useEffect(() => {
    const tabValue = searchParams.get('tab')
    if (isValidTab(tabValue) && tabValue !== activeTab) {
      setActiveTab(tabValue)
    }
  }, [searchParams, activeTab])

  useEffect(() => {
    const tabValue = searchParams.get('tab')
    if (!isValidTab(tabValue)) {
      const params = new URLSearchParams(searchParams)
      params.set('tab', activeTab)
      setSearchParams(params, { replace: true })
    }
  }, [searchParams, activeTab, setSearchParams])

  // Load templates and rules
  useEffect(() => {
    fetchTemplateData();
  }, [fetchTemplateData]);

  const handleRefresh = () => {
    fetchTemplateData({ showLoading: false })
  }

  const handleTabChange = (value: string) => {
    if (!allowedTabValues.has(value)) {
      return
    }

    setActiveTab(value)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', value)
    setSearchParams(nextParams, { replace: true })
  }

  const fetchAssignmentSummary = useCallback(async (): Promise<TemplateAssignmentSummary[] | null> => {
    setAssignmentSummaryLoading(true)
    try {
      const response = await axios.get<ApiResponse<TemplateAssignmentSummary[]>>(
        APIV3Dictionary.payroll.templates.assignmentSummary,
        {
          withCredentials: true
        }
      )

      const payload = response.data
      if (payload?.success === false) {
        setAssignmentSummaries([])
        toast({
          title: 'Unable to load assignment summary',
          description: payload.message || 'An error occurred while fetching assignment summary.',
          variant: 'destructive'
        })
        return null
      } else {
        const nextSummaries = Array.isArray(payload?.data) ? payload.data : []
        setAssignmentSummaries(nextSummaries)
        return nextSummaries
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to fetch assignment summary.')
      toast({
        title: 'Unable to load assignment summary',
        description: message,
        variant: 'destructive'
      })
      setAssignmentSummaries([])
      return null
    } finally {
      setAssignmentSummaryLoading(false)
    }
  }, [])

  const fetchAssignmentTargets = useCallback(async (): Promise<AssignmentTargets | null> => {
    setAssignmentTargetsLoading(true)
    try {
      const response = await axios.get<ApiResponse<AssignmentTargets>>(
        APIV3Dictionary.payroll.templates.assignmentTargets,
        {
          withCredentials: true
        }
      )

      const payload = response.data
      if (payload?.success === false) {
        toast({
          title: 'Unable to load assignment targets',
          description: payload.message || 'An error occurred while fetching employees and departments.',
          variant: 'destructive'
        })
        setAssignmentTargets({ employees: [], departments: [] })
        return null
      } else if (payload?.data) {
        setAssignmentTargets(payload.data)
        return payload.data
      }
      return null
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to fetch assignment targets.')
      toast({
        title: 'Unable to load assignment targets',
        description: message,
        variant: 'destructive'
      })
      setAssignmentTargets({ employees: [], departments: [] })
      return null
    } finally {
      setAssignmentTargetsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'assignments') {
      fetchAssignmentSummary()
    }
  }, [activeTab, fetchAssignmentSummary])

  const getAllowanceLabel = (allowance: SalaryTemplate['rules']['allowances'][number]) => {
    if (allowance.type === 'fixed') {
      return `₹${allowance.value.toLocaleString()} ${allowance.taxable ? '(Taxable)' : '(Non-taxable)'}`
    }
    return `${allowance.value}% ${allowance.taxable ? '(Taxable)' : '(Non-taxable)'}`
  }

  const getDeductionLabel = (deduction: SalaryTemplate['rules']['deductions'][number]) => {
    if (deduction.type === 'fixed') {
      return `₹${deduction.value.toLocaleString()} ${deduction.mandatory ? '• Mandatory' : ''}`
    }
    return `${deduction.value}% ${deduction.mandatory ? '• Mandatory' : ''}`
  }

  const resetTemplateDialogState = useCallback(() => {
    setTemplateForm(createDefaultTemplateFormState())
    setAllowances([])
    setDeductions([])
    setTaxBrackets([])
    setSelectedTemplateId(null)
  }, [])

  const populateTemplateDialogState = useCallback((template: SalaryTemplate) => {
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      isDefault: template.isDefault,
      isActive: template.isActive,
      basicSalaryType: template.rules.basicSalary.type,
      basicSalaryValue: template.rules.basicSalary.value,
      overtimeEnabled: template.rules.overtimeRules.enabled,
      overtimeMultiplier: template.rules.overtimeRules.multiplier,
      overtimeThreshold: template.rules.overtimeRules.threshold,
      taxEnabled: template.rules.taxRules.enabled
    })

    setAllowances(template.rules.allowances.map((allowance) => ({ ...allowance })))
    setDeductions(template.rules.deductions.map((deduction) => ({ ...deduction })))
    setTaxBrackets(
      template.rules.taxRules.brackets.map((bracket) => ({
        min: bracket.min,
        max: typeof bracket.max === 'number' ? bracket.max : null,
        rate: bracket.rate
      }))
    )
    setSelectedTemplateId(template.id)
  }, [])

  const handleOpenCreateTemplate = () => {
    resetTemplateDialogState()
    setTemplateDialogMode('create')
    setTemplateDialogOpen(true)
  }

  const handleOpenEditTemplate = (template: SalaryTemplate) => {
    populateTemplateDialogState(template)
    setTemplateDialogMode('edit')
    setTemplateDialogOpen(true)
  }

  const handleTemplateFormChange = <K extends keyof TemplateFormState>(field: K, value: TemplateFormState[K]) => {
    setTemplateForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddAllowance = () => {
    setAllowances((prev) => [...prev, createEmptyAllowance()])
  }

  const handleUpdateAllowance = <K extends keyof AllowanceEntry>(index: number, field: K, value: AllowanceEntry[K]) => {
    setAllowances((prev) =>
      prev.map((allowance, idx) =>
        idx === index
          ? {
              ...allowance,
              [field]: field === 'value' ? Number(value) : value
            }
          : allowance
      )
    )
  }

  const handleRemoveAllowance = (index: number) => {
    setAllowances((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleAddDeduction = () => {
    setDeductions((prev) => [...prev, createEmptyDeduction()])
  }

  const handleUpdateDeduction = <K extends keyof DeductionEntry>(index: number, field: K, value: DeductionEntry[K]) => {
    setDeductions((prev) =>
      prev.map((deduction, idx) =>
        idx === index
          ? {
              ...deduction,
              [field]: field === 'value' ? Number(value) : value
            }
          : deduction
      )
    )
  }

  const handleRemoveDeduction = (index: number) => {
    setDeductions((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleAddTaxBracket = () => {
    setTaxBrackets((prev) => [...prev, createDefaultTaxBracket()])
  }

  const handleUpdateTaxBracket = (index: number, field: keyof TaxBracketEntry, rawValue: string) => {
    setTaxBrackets((prev) =>
      prev.map((bracket, idx) => {
        if (idx !== index) {
          return bracket
        }

        if (field === 'max') {
          const nextValue = rawValue === '' ? null : Number(rawValue)
          return {
            ...bracket,
            max: Number.isNaN(nextValue) ? bracket.max : nextValue
          }
        }

        const parsedValue = Number(rawValue)
        if (Number.isNaN(parsedValue)) {
          return bracket
        }

        return {
          ...bracket,
          [field]: parsedValue
        }
      })
    )
  }

  const handleRemoveTaxBracket = (index: number) => {
    setTaxBrackets((prev) => prev.filter((_, idx) => idx !== index))
  }

  const toggleTemplateActionLoading = (templateId: string, loading: boolean) => {
    setTemplateActionLoading((prev) => ({
      ...prev,
      [templateId]: loading
    }))
  }

  const buildTemplatePayload = () => {
    const sanitizedAllowances = allowances
      .filter((entry) => entry.name.trim() !== '')
      .map((entry) => ({
        ...entry,
        name: entry.name.trim(),
        value: Number(entry.value) || 0
      }))

    const sanitizedDeductions = deductions
      .filter((entry) => entry.name.trim() !== '')
      .map((entry) => ({
        ...entry,
        name: entry.name.trim(),
        value: Number(entry.value) || 0
      }))

    const sanitizedTaxBrackets = taxBrackets
      .filter((bracket) => templateForm.taxEnabled && bracket.rate > 0)
      .map((bracket) => ({
        min: Number(bracket.min) || 0,
        max: bracket.max === null || bracket.max === undefined ? null : Number(bracket.max),
        rate: Number(bracket.rate)
      }))

    return {
      name: templateForm.name.trim(),
      description: templateForm.description.trim(),
      isDefault: templateForm.isDefault,
      isActive: templateForm.isActive,
      rules: {
        basicSalary: {
          type: templateForm.basicSalaryType,
          value: Number(templateForm.basicSalaryValue)
        },
        allowances: sanitizedAllowances,
        deductions: sanitizedDeductions,
        overtimeRules: {
          enabled: templateForm.overtimeEnabled,
          multiplier: Number(templateForm.overtimeMultiplier) || 0,
          threshold: Number(templateForm.overtimeThreshold) || 0
        },
        taxRules: {
          enabled: templateForm.taxEnabled,
          brackets: templateForm.taxEnabled ? sanitizedTaxBrackets : []
        }
      }
    }
  }

  const validateTemplateForm = () => {
    const errors: string[] = []

    if (!templateForm.name.trim()) {
      errors.push('Template name is required.')
    }

    if (templateForm.basicSalaryValue <= 0) {
      errors.push('Basic salary value must be greater than zero.')
    }

    if (templateForm.basicSalaryType === 'percentage' && templateForm.basicSalaryValue > 100) {
      errors.push('Basic salary percentage cannot exceed 100%.')
    }

    allowances.forEach((allowance, index) => {
      if (allowance.name.trim() === '') {
        errors.push(`Allowance #${index + 1} is missing a name.`)
      }
      if (allowance.value < 0) {
        errors.push(`Allowance "${allowance.name || `#${index + 1}`}" cannot have a negative value.`)
      }
      if (allowance.type === 'percentage' && allowance.value > 100) {
        errors.push(`Allowance "${allowance.name || `#${index + 1}`}" percentage cannot exceed 100%.`)
      }
    })

    deductions.forEach((deduction, index) => {
      if (deduction.name.trim() === '') {
        errors.push(`Deduction #${index + 1} is missing a name.`)
      }
      if (deduction.value < 0) {
        errors.push(`Deduction "${deduction.name || `#${index + 1}`}" cannot have a negative value.`)
      }
      if (deduction.type === 'percentage' && deduction.value > 100) {
        errors.push(`Deduction "${deduction.name || `#${index + 1}`}" percentage cannot exceed 100%.`)
      }
    })

    if (templateForm.taxEnabled) {
      if (taxBrackets.length === 0) {
        errors.push('Add at least one tax bracket or disable tax rules.')
      }

      taxBrackets.forEach((bracket, index) => {
        if (bracket.rate <= 0) {
          errors.push(`Tax bracket #${index + 1} must have a rate greater than zero.`)
        }
        if (bracket.max !== null && bracket.max !== undefined && bracket.max <= bracket.min) {
          errors.push(`Tax bracket #${index + 1} max must be greater than min.`)
        }
      })
    }

    return errors
  }

  const handleSubmitTemplate = async () => {
    const validationErrors = validateTemplateForm()
    if (validationErrors.length > 0) {
      toast({
        title: 'Please fix the highlighted issues',
        description: validationErrors.join(' '),
        variant: 'destructive'
      })
      return
    }

    const payload = buildTemplatePayload()

    setTemplateSubmitting(true)
    try {
      if (templateDialogMode === 'create') {
        await axios.post(APIV3Dictionary.payroll.templates.create, payload, {
          withCredentials: true
        })
        toast({
          title: 'Template created',
          description: `${payload.name} is now available in payroll templates.`
        })
      } else if (selectedTemplateId) {
        await axios.put(APIV3Dictionary.payroll.templates.update(selectedTemplateId), payload, {
          withCredentials: true
        })
        toast({
          title: 'Template updated',
          description: `${payload.name} has been refreshed.`
        })
      }

      setTemplateDialogOpen(false)
      await fetchTemplateData({ showLoading: false })
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to save template. Please try again.')
      toast({
        title: 'Template save failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setTemplateSubmitting(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    toggleTemplateActionLoading(templateId, true)
    try {
      await axios.delete(APIV3Dictionary.payroll.templates.delete(templateId), {
        withCredentials: true
      })
      toast({
        title: 'Template deleted',
        description: 'The salary template has been removed.'
      })
      await fetchTemplateData({ showLoading: false })
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to delete template. Please try again.')
      toast({
        title: 'Deletion failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      toggleTemplateActionLoading(templateId, false)
      setTemplateDeleteId(null)
    }
  }

  const clearAssignmentSelection = useCallback(() => {
    setSelectedAssignmentTemplateId(null)
    setSelectedEmployeeIds(() => new Set<string>())
    setSelectedDepartmentIds(() => new Set<string>())
    setEmployeeSearch('')
    setDepartmentSearch('')
  }, [])

  const closeAssignmentDialog = useCallback(() => {
    setAssignmentDialogOpen(false)
    clearAssignmentSelection()
  }, [clearAssignmentSelection])

  const handleOpenAssignmentDialog = async (templateId: string) => {
    setSelectedAssignmentTemplateId(templateId)
    setAssignmentDialogOpen(true)
    setEmployeeSearch('')
    setDepartmentSearch('')
    setSelectedEmployeeIds(() => new Set<string>())
    setSelectedDepartmentIds(() => new Set<string>())

    let summaries = assignmentSummaries
    const refreshedSummaries = await fetchAssignmentSummary()
    if (refreshedSummaries) {
      summaries = refreshedSummaries
    }

    const targets = (await fetchAssignmentTargets()) ?? assignmentTargets

    const employeesSet = new Set<string>()
    const departmentsSet = new Set<string>()

    if (targets?.employees?.length) {
      targets.employees.forEach((employee) => {
        if (employee.salaryTemplateId === templateId) {
          employeesSet.add(employee.id)
        }
      })
    }

    const templateSummary = summaries.find((item) => item.id === templateId)
    if (templateSummary?.departments?.length) {
      templateSummary.departments.forEach((department) => departmentsSet.add(department.departmentId))
    }

    setSelectedEmployeeIds(employeesSet)
    setSelectedDepartmentIds(departmentsSet)
  }

  const handleEmployeeSelectionChange = (employeeId: string, checked: boolean) => {
    setSelectedEmployeeIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(employeeId)
      } else {
        next.delete(employeeId)
      }
      return next
    })
  }

  const handleDepartmentSelectionChange = (departmentId: string, checked: boolean) => {
    setSelectedDepartmentIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(departmentId)
      } else {
        next.delete(departmentId)
      }
      return next
    })
  }

  const handleSubmitAssignment = async () => {
    if (!selectedAssignmentTemplateId) {
      return
    }

    if (selectedEmployeeIds.size === 0 && selectedDepartmentIds.size === 0) {
      toast({
        title: 'No recipients selected',
        description: 'Select at least one employee or department to assign this template.',
        variant: 'destructive'
      })
      return
    }

    setAssignmentSubmitting(true)
    try {
      await axios.post(
        APIV3Dictionary.payroll.templates.assign,
        {
          templateId: selectedAssignmentTemplateId,
          employeeIds: Array.from(selectedEmployeeIds),
          departmentIds: Array.from(selectedDepartmentIds)
        },
        {
          withCredentials: true
        }
      )

      toast({
        title: 'Template assigned',
        description: 'Assignments will take effect immediately in the next payroll cycle.'
      })

      closeAssignmentDialog()
      await Promise.all([fetchAssignmentSummary(), fetchTemplateData({ showLoading: false })])
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to assign template.')
      toast({
        title: 'Assignment failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setAssignmentSubmitting(false)
    }
  }

  const handleOpenRuleDialog = (rule: CalculationRule) => {
    setEditingRuleId(rule.id)
    setRuleForm({
      name: rule.name,
      formula: rule.formula,
      type: rule.type,
      isActive: rule.isActive
    })
    setRuleDialogOpen(true)
  }

  const handleRuleFormChange = <K extends keyof RuleFormState>(field: K, value: RuleFormState[K]) => {
    setRuleForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmitRule = async () => {
    if (!editingRuleId) {
      return
    }

    if (!ruleForm.name.trim() || !ruleForm.formula.trim()) {
      toast({
        title: 'Incomplete rule details',
        description: 'Name and formula are required to update a calculation rule.',
        variant: 'destructive'
      })
      return
    }

    setRuleSubmitting(true)
    try {
      await axios.put(
        APIV3Dictionary.payroll.templates.updateRule(editingRuleId),
        {
          name: ruleForm.name.trim(),
          formula: ruleForm.formula.trim(),
          type: ruleForm.type,
          isActive: ruleForm.isActive
        },
        {
          withCredentials: true
        }
      )

      toast({
        title: 'Calculation rule updated',
        description: `${ruleForm.name} has been saved.`
      })

      setRuleDialogOpen(false)
      setEditingRuleId(null)
      await fetchTemplateData({ showLoading: false })
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to update calculation rule.')
      toast({
        title: 'Rule update failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setRuleSubmitting(false)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    setRuleActionLoading((prev) => ({
      ...prev,
      [ruleId]: true
    }))

    try {
      await axios.delete(APIV3Dictionary.payroll.templates.deleteRule(ruleId), {
        withCredentials: true
      })

      toast({
        title: 'Calculation rule removed',
        description: 'The rule has been deleted from your payroll configuration.'
      })

      await fetchTemplateData({ showLoading: false })
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to delete calculation rule.')
      toast({
        title: 'Rule deletion failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setRuleActionLoading((prev) => ({
        ...prev,
        [ruleId]: false
      }))
      setRuleDeleteId(null)
    }
  }

  const activeTemplates = useMemo(() => templates.filter((template) => template.isActive), [templates])
  const inactiveTemplates = useMemo(() => templates.filter((template) => !template.isActive), [templates])
  const selectedAssignmentTemplate = useMemo<SalaryTemplate | TemplateAssignmentSummary | null>(() => {
    if (!selectedAssignmentTemplateId) {
      return null
    }

    const template = templates.find((item) => item.id === selectedAssignmentTemplateId)
    if (template) {
      return template
    }

    const summary = assignmentSummaries.find((item) => item.id === selectedAssignmentTemplateId)
    return summary ?? null
  }, [selectedAssignmentTemplateId, templates, assignmentSummaries])

  const selectedAssignmentTemplateName = selectedAssignmentTemplate?.name ?? 'Salary Template'

  const filteredEmployees = useMemo(() => {
    const term = employeeSearch.trim().toLowerCase()
    const list = assignmentTargets.employees || []

    if (!term) {
      return list
    }

    return list.filter((employee) => {
      const values = [
        employee.firstName ?? '',
        employee.lastName ?? '',
        employee.email ?? '',
        employee.department?.name ?? ''
      ]

      return values.some((value) => value.toLowerCase().includes(term))
    })
  }, [assignmentTargets, employeeSearch])

  const filteredDepartments = useMemo(() => {
    const term = departmentSearch.trim().toLowerCase()
    const list = assignmentTargets.departments || []

    if (!term) {
      return list
    }

    return list.filter((department) => department.name.toLowerCase().includes(term))
  }, [assignmentTargets, departmentSearch])

  const templateNameById = useMemo(() => {
    const map = new Map<string, string>()
    templates.forEach((template) => {
      map.set(template.id, template.name)
    })
    assignmentSummaries.forEach((summary) => {
      if (!map.has(summary.id)) {
        map.set(summary.id, summary.name)
      }
    })
    return map
  }, [templates, assignmentSummaries])

  const selectedEmployeesCount = selectedEmployeeIds.size
  const selectedDepartmentsCount = selectedDepartmentIds.size
  const assignmentSelectionCount = selectedEmployeesCount + selectedDepartmentsCount

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
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Please log in to access template editor</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Salary Template Editor</h1>
          <p className="text-muted-foreground">Manage salary structures and calculation rules</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreateTemplate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {loadErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Some template data failed to load</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {loadErrors.map((message, index) => (
                <li key={`${message}-${index}`}>{message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

  <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="rules">Calculation Rules</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Salary Templates
              </CardTitle>
              <CardDescription>Create and manage salary calculation templates</CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No salary templates available</p>
                  <p className="text-sm">{loadErrors[0] ?? 'Once templates are added in the payroll service, they will appear here.'}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeTemplates.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                        <h3 className="text-sm font-semibold text-green-700">Active Templates</h3>
                      </div>
                      {activeTemplates.map((template) => {
                        const isActionLoading = templateActionLoading[template.id] ?? false

                        return (
                          <div key={template.id} className="p-4 border rounded-lg space-y-4 bg-green-50/40">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                  {template.name}
                                  {template.isDefault && (
                                    <Badge variant="default" className="bg-blue-600">
                                      Default
                                    </Badge>
                                  )}
                                </h4>
                                {template.description && (
                                  <p className="text-sm text-muted-foreground">{template.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                  Updated {template.updatedAt ? new Date(template.updatedAt).toLocaleString() : 'recently'}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-3">
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <ToggleRight className="h-3 w-3" />
                                  Active
                                </Badge>
                                <div className="flex flex-wrap gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleOpenEditTemplate(template)}
                                  >
                                    <PenLine className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenAssignmentDialog(template.id)}
                                  >
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Assign
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    disabled={template.isDefault || isActionLoading}
                                    onClick={() => setTemplateDeleteId(template.id)}
                                  >
                                    {isActionLoading ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-sm">
                              <div className="space-y-2">
                                <h5 className="font-medium flex items-center gap-2">
                                  <Info className="h-4 w-4" />
                                  Basic Salary
                                </h5>
                                <p className="text-muted-foreground">
                                  {template.rules.basicSalary.type === 'fixed'
                                    ? `Fixed ₹${template.rules.basicSalary.value.toLocaleString()}`
                                    : `${template.rules.basicSalary.value}% of gross`}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <h5 className="font-medium">Allowances</h5>
                                <ul className="space-y-1">
                                  {template.rules.allowances.length > 0 ? (
                                    template.rules.allowances.map((allowance) => (
                                      <li key={`${template.id}-${allowance.name}`} className="flex items-center justify-between gap-2">
                                        <span>{allowance.name}</span>
                                        <span className="text-muted-foreground">{getAllowanceLabel(allowance)}</span>
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-muted-foreground">No allowances configured</li>
                                  )}
                                </ul>
                              </div>
                              <div className="space-y-2">
                                <h5 className="font-medium">Deductions</h5>
                                <ul className="space-y-1">
                                  {template.rules.deductions.length > 0 ? (
                                    template.rules.deductions.map((deduction) => (
                                      <li key={`${template.id}-${deduction.name}`} className="flex items-center justify-between gap-2">
                                        <span>{deduction.name}</span>
                                        <span className="text-muted-foreground">{getDeductionLabel(deduction)}</span>
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-muted-foreground">No deductions configured</li>
                                  )}
                                </ul>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                              <div>
                                <p>
                                  Overtime:{' '}
                                  {template.rules.overtimeRules.enabled
                                    ? `Multiplier ${template.rules.overtimeRules.multiplier} after ${template.rules.overtimeRules.threshold} hrs`
                                    : 'Disabled'}
                                </p>
                              </div>
                              <div>
                                <p>
                                  Tax rules:{' '}
                                  {template.rules.taxRules.enabled
                                    ? `${template.rules.taxRules.brackets.length} bracket(s) configured`
                                    : 'Disabled'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {inactiveTemplates.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <ToggleRight className="h-4 w-4 rotate-180 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-600">Inactive Templates</h3>
                      </div>
                      {inactiveTemplates.map((template) => {
                        const isActionLoading = templateActionLoading[template.id] ?? false

                        return (
                          <div key={template.id} className="p-4 border rounded-lg space-y-4 bg-slate-50">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                  {template.name}
                                  {template.isDefault && (
                                    <Badge variant="default" className="bg-blue-600">
                                      Default
                                    </Badge>
                                  )}
                                </h4>
                                {template.description && (
                                  <p className="text-sm text-muted-foreground">{template.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                  Updated {template.updatedAt ? new Date(template.updatedAt).toLocaleString() : 'recently'}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-3">
                                <Badge variant="outline" className="flex items-center gap-1 text-slate-600">
                                  <ToggleRight className="h-3 w-3 rotate-180" />
                                  Inactive
                                </Badge>
                                <div className="flex flex-wrap gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleOpenEditTemplate(template)}
                                  >
                                    <PenLine className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled
                                    title="Activate template before assigning"
                                  >
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Assign
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    disabled={template.isDefault || isActionLoading}
                                    onClick={() => setTemplateDeleteId(template.id)}
                                  >
                                    {isActionLoading ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-sm">
                              <div className="space-y-2">
                                <h5 className="font-medium flex items-center gap-2">
                                  <Info className="h-4 w-4" />
                                  Basic Salary
                                </h5>
                                <p className="text-muted-foreground">
                                  {template.rules.basicSalary.type === 'fixed'
                                    ? `Fixed ₹${template.rules.basicSalary.value.toLocaleString()}`
                                    : `${template.rules.basicSalary.value}% of gross`}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <h5 className="font-medium">Allowances</h5>
                                <ul className="space-y-1">
                                  {template.rules.allowances.length > 0 ? (
                                    template.rules.allowances.map((allowance) => (
                                      <li key={`${template.id}-${allowance.name}`} className="flex items-center justify-between gap-2">
                                        <span>{allowance.name}</span>
                                        <span className="text-muted-foreground">{getAllowanceLabel(allowance)}</span>
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-muted-foreground">No allowances configured</li>
                                  )}
                                </ul>
                              </div>
                              <div className="space-y-2">
                                <h5 className="font-medium">Deductions</h5>
                                <ul className="space-y-1">
                                  {template.rules.deductions.length > 0 ? (
                                    template.rules.deductions.map((deduction) => (
                                      <li key={`${template.id}-${deduction.name}`} className="flex items-center justify-between gap-2">
                                        <span>{deduction.name}</span>
                                        <span className="text-muted-foreground">{getDeductionLabel(deduction)}</span>
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-muted-foreground">No deductions configured</li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculation Rules
              </CardTitle>
              <CardDescription>Define formulas for salary calculations</CardDescription>
            </CardHeader>
            <CardContent>
              {calculationRules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No calculation rules available</p>
                  <p className="text-sm">{loadErrors[0] ?? 'Calculation rules will appear here once configured in the payroll service.'}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {calculationRules.map((rule) => {
                    const isLoading = ruleActionLoading[rule.id] ?? false

                    return (
                      <div key={rule.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-base flex items-center gap-2">
                              {rule.name}
                              <Badge variant="outline" className="uppercase text-[10px]">
                                {rule.type}
                              </Badge>
                            </h4>
                            <p className="text-sm text-muted-foreground font-mono break-all">{rule.formula}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={rule.isActive ? 'default' : 'outline'}>
                              {rule.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleOpenRuleDialog(rule)}
                            >
                              <PenLine className="mr-1 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              disabled={isLoading}
                              onClick={() => setRuleDeleteId(rule.id)}
                            >
                              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Template Assignments
              </CardTitle>
              <CardDescription>Assign templates to employees or departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Current assignment overview</p>
                    <p className="text-xs text-muted-foreground">
                      Monitor how templates are distributed across your workforce.
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={fetchAssignmentSummary} disabled={assignmentSummaryLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${assignmentSummaryLoading ? 'animate-spin' : ''}`} />
                    Refresh summary
                  </Button>
                </div>

                {assignmentSummaryLoading ? (
                  <div className="border rounded-lg p-6 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <p>Loading assignment summary...</p>
                    </div>
                  </div>
                ) : assignmentSummaries.length === 0 ? (
                  <div className="border rounded-lg p-6 text-center text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-40" />
                    <p className="font-medium">No assignment data yet</p>
                    <p className="text-sm">Assign a template to get started.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {assignmentSummaries.map((summary) => (
                      <div key={summary.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-base flex items-center gap-2">
                              {summary.name}
                              {summary.isDefault && <Badge>Default</Badge>}
                            </h4>
                            {summary.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{summary.description}</p>
                            )}
                          </div>
                          <Badge variant={summary.isActive ? 'outline' : 'secondary'}>
                            {summary.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-md bg-muted/40 p-3">
                            <p className="text-xs text-muted-foreground">Assigned employees</p>
                            <p className="text-lg font-semibold">{summary.assignedEmployees}</p>
                          </div>
                          <div className="rounded-md bg-muted/40 p-3">
                            <p className="text-xs text-muted-foreground">Departments</p>
                            <p className="text-lg font-semibold">{summary.departments.length}</p>
                          </div>
                        </div>
                        {summary.departments.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Department coverage</p>
                            <div className="space-y-1">
                              {summary.departments.slice(0, 3).map((department) => (
                                <div key={department.departmentId} className="flex items-center justify-between text-xs">
                                  <span>{department.departmentName}</span>
                                  <span className="text-muted-foreground">{department.employeeCount} employees</span>
                                </div>
                              ))}
                              {summary.departments.length > 3 && (
                                <p className="text-[11px] text-muted-foreground">
                                  +{summary.departments.length - 3} more department(s)
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenAssignmentDialog(summary.id)}
                          >
                            Manage assignments
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={templateDialogOpen}
        onOpenChange={(open) => {
          setTemplateDialogOpen(open)
          if (!open) {
            resetTemplateDialogState()
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {templateDialogMode === 'create' ? 'Create salary template' : 'Edit salary template'}
            </DialogTitle>
            <DialogDescription>
              Configure the salary components, allowances, deductions, and compliance rules for this template.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-8 py-2">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template name</Label>
                    <Input
                      id="template-name"
                      value={templateForm.name}
                      onChange={(event) => handleTemplateFormChange('name', event.target.value)}
                      placeholder="e.g. Standard Payroll"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-basic-type">Basic salary type</Label>
                    <div className="grid grid-cols-[1fr,1fr] gap-2">
                      <Select
                        value={templateForm.basicSalaryType}
                        onValueChange={(value) =>
                          handleTemplateFormChange('basicSalaryType', value as TemplateFormState['basicSalaryType'])
                        }
                      >
                        <SelectTrigger id="template-basic-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed amount</SelectItem>
                          <SelectItem value="percentage">Percentage of gross</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="template-basic-value"
                        type="number"
                        min={0}
                        step={templateForm.basicSalaryType === 'fixed' ? 100 : 1}
                        value={templateForm.basicSalaryValue}
                        onChange={(event) => handleTemplateFormChange('basicSalaryValue', Number(event.target.value))}
                        placeholder={templateForm.basicSalaryType === 'fixed' ? '₹ Amount' : '% of gross'}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    value={templateForm.description}
                    onChange={(event) => handleTemplateFormChange('description', event.target.value)}
                    placeholder="Describe when this template should be used"
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start justify-between gap-3 rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">Default template</p>
                    <p className="text-xs text-muted-foreground">
                      Employees without a salary template will inherit this configuration automatically.
                    </p>
                  </div>
                  <Switch
                    checked={templateForm.isDefault}
                    onCheckedChange={(checked) => handleTemplateFormChange('isDefault', checked)}
                  />
                </div>
                <div className="flex items-start justify-between gap-3 rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">Template active</p>
                    <p className="text-xs text-muted-foreground">
                      Disable to pause usage of this template in payroll cycles.
                    </p>
                  </div>
                  <Switch
                    checked={templateForm.isActive}
                    onCheckedChange={(checked) => handleTemplateFormChange('isActive', checked)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Allowances</p>
                    <p className="text-xs text-muted-foreground">Add recurring earnings that increase the gross salary.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleAddAllowance}>
                    <Plus className="h-4 w-4 mr-1" /> Add allowance
                  </Button>
                </div>
                <div className="space-y-3">
                  {allowances.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No allowances configured yet. Use the button above to add the first allowance.
                    </p>
                  )}
                  {allowances.map((allowance, index) => (
                    <div
                      key={`allowance-${index}`}
                      className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1.4fr,1fr,1fr,auto] sm:items-center"
                    >
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                          Allowance name
                        </Label>
                        <Input
                          value={allowance.name}
                          onChange={(event) => handleUpdateAllowance(index, 'name', event.target.value)}
                          placeholder="e.g. House rent allowance"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Type</Label>
                        <Select
                          value={allowance.type}
                          onValueChange={(value) =>
                            handleUpdateAllowance(index, 'type', value as AllowanceEntry['type'])
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                          {allowance.type === 'fixed' ? 'Amount (₹)' : 'Percentage (%)'}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          step={allowance.type === 'fixed' ? 100 : 1}
                          value={allowance.value}
                          onChange={(event) =>
                            handleUpdateAllowance(index, 'value', Number(event.target.value))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={allowance.taxable}
                            onCheckedChange={(checked) => handleUpdateAllowance(index, 'taxable', checked)}
                            id={`allowance-taxable-${index}`}
                          />
                          <Label htmlFor={`allowance-taxable-${index}`} className="text-xs text-muted-foreground">
                            Taxable
                          </Label>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveAllowance(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Deductions</p>
                    <p className="text-xs text-muted-foreground">Add statutory or voluntary deductions applied to net salary.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleAddDeduction}>
                    <Plus className="h-4 w-4 mr-1" /> Add deduction
                  </Button>
                </div>
                <div className="space-y-3">
                  {deductions.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No deductions configured yet. Use the button above to add deductions like PF or TDS.
                    </p>
                  )}
                  {deductions.map((deduction, index) => (
                    <div
                      key={`deduction-${index}`}
                      className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1.4fr,1fr,1fr,auto] sm:items-center"
                    >
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                          Deduction name
                        </Label>
                        <Input
                          value={deduction.name}
                          onChange={(event) => handleUpdateDeduction(index, 'name', event.target.value)}
                          placeholder="e.g. Provident fund"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Type</Label>
                        <Select
                          value={deduction.type}
                          onValueChange={(value) =>
                            handleUpdateDeduction(index, 'type', value as DeductionEntry['type'])
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                          {deduction.type === 'fixed' ? 'Amount (₹)' : 'Percentage (%)'}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          step={deduction.type === 'fixed' ? 100 : 1}
                          value={deduction.value}
                          onChange={(event) =>
                            handleUpdateDeduction(index, 'value', Number(event.target.value))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={deduction.mandatory}
                            onCheckedChange={(checked) => handleUpdateDeduction(index, 'mandatory', checked)}
                            id={`deduction-mandatory-${index}`}
                          />
                          <Label htmlFor={`deduction-mandatory-${index}`} className="text-xs text-muted-foreground">
                            Mandatory
                          </Label>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveDeduction(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Overtime settings</p>
                      <p className="text-xs text-muted-foreground">
                        Enable to apply overtime multiplier after employees cross a threshold.
                      </p>
                    </div>
                    <Switch
                      checked={templateForm.overtimeEnabled}
                      onCheckedChange={(checked) => handleTemplateFormChange('overtimeEnabled', checked)}
                    />
                  </div>
                  {templateForm.overtimeEnabled && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="overtime-multiplier">Multiplier</Label>
                        <Input
                          id="overtime-multiplier"
                          type="number"
                          min={1}
                          step={0.1}
                          value={templateForm.overtimeMultiplier}
                          onChange={(event) =>
                            handleTemplateFormChange('overtimeMultiplier', Number(event.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="overtime-threshold">Threshold hours</Label>
                        <Input
                          id="overtime-threshold"
                          type="number"
                          min={0}
                          step={1}
                          value={templateForm.overtimeThreshold}
                          onChange={(event) =>
                            handleTemplateFormChange('overtimeThreshold', Number(event.target.value))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Tax rules</p>
                      <p className="text-xs text-muted-foreground">
                        Configure progressive tax brackets. Leave disabled to skip payroll tax calculations.
                      </p>
                    </div>
                    <Switch
                      checked={templateForm.taxEnabled}
                      onCheckedChange={(checked) => handleTemplateFormChange('taxEnabled', checked)}
                    />
                  </div>
                  {templateForm.taxEnabled && (
                    <div className="space-y-3">
                      {taxBrackets.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Add one or more brackets to define tax ranges.
                        </p>
                      )}
                      <div className="space-y-3">
                        {taxBrackets.map((bracket, index) => (
                          <div key={`tax-${index}`} className="grid gap-3 sm:grid-cols-[1fr,1fr,1fr,auto] sm:items-center">
                            <div className="space-y-2">
                              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Min (₹)</Label>
                              <Input
                                type="number"
                                min={0}
                                step={1000}
                                value={bracket.min}
                                onChange={(event) => handleUpdateTaxBracket(index, 'min', event.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Max (₹)</Label>
                              <Input
                                type="number"
                                min={0}
                                step={1000}
                                value={bracket.max ?? ''}
                                onChange={(event) => handleUpdateTaxBracket(index, 'max', event.target.value)}
                                placeholder="No cap"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Rate (%)</Label>
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                value={bracket.rate}
                                onChange={(event) => handleUpdateTaxBracket(index, 'rate', event.target.value)}
                              />
                            </div>
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveTaxBracket(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" onClick={handleAddTaxBracket}>
                        <Plus className="h-4 w-4 mr-1" /> Add tax bracket
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setTemplateDialogOpen(false)}
              disabled={templateSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitTemplate} disabled={templateSubmitting}>
              {templateSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {templateDialogMode === 'create' ? 'Create template' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={ruleDialogOpen}
        onOpenChange={(open) => {
          setRuleDialogOpen(open)
          if (!open) {
            setEditingRuleId(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit calculation rule</DialogTitle>
            <DialogDescription>
              Update the rule metadata and formula. These rules are referenced by salary templates and custom calculations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Rule name</Label>
              <Input
                id="rule-name"
                value={ruleForm.name}
                onChange={(event) => handleRuleFormChange('name', event.target.value)}
                placeholder="e.g. Professional tax"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-formula">Formula</Label>
              <Textarea
                id="rule-formula"
                value={ruleForm.formula}
                onChange={(event) => handleRuleFormChange('formula', event.target.value)}
                placeholder="Enter the calculation expression"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Use placeholders referenced by the payroll engine, such as <code className="font-mono">BASIC</code>,
                <code className="font-mono">GROSS</code>, or custom allowance keys.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Rule type</Label>
                <Select
                  value={ruleForm.type}
                  onValueChange={(value) => handleRuleFormChange('type', value as RuleFormState['type'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allowance">Allowance</SelectItem>
                    <SelectItem value="deduction">Deduction</SelectItem>
                    <SelectItem value="tax">Tax</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Inactive rules will be ignored by salary templates.</p>
                </div>
                <Switch
                  checked={ruleForm.isActive}
                  onCheckedChange={(checked) => handleRuleFormChange('isActive', checked)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)} disabled={ruleSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRule} disabled={ruleSubmitting || !editingRuleId}>
              {ruleSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        <Dialog
          open={assignmentDialogOpen}
          onOpenChange={(open) => {
            if (open) {
              setAssignmentDialogOpen(true)
            } else {
              closeAssignmentDialog()
            }
          }}
        >
          <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Assign template: {selectedAssignmentTemplateName}</DialogTitle>
              <DialogDescription>
                Choose employees and departments that should use this salary configuration. Existing assignments for those
                selections will be replaced.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-2">
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4 text-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium leading-tight">{selectedAssignmentTemplateName}</p>
                  {selectedAssignmentTemplate?.description ? (
                    <p className="text-xs text-muted-foreground max-w-2xl">
                      {selectedAssignmentTemplate.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{selectedEmployeesCount} employee(s)</Badge>
                  <Badge variant="outline">{selectedDepartmentsCount} department(s)</Badge>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">Employees</p>
                      <p className="text-xs text-muted-foreground">Pick individual employees to apply this template.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="px-2 py-1 text-xs">
                        {selectedEmployeesCount} selected
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEmployeeIds(() => new Set<string>())}
                        disabled={selectedEmployeesCount === 0}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <Input
                    placeholder="Search by name, email, or department"
                    value={employeeSearch}
                    onChange={(event) => setEmployeeSearch(event.target.value)}
                  />
                  {assignmentTargetsLoading && assignmentTargets.employees.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading employees...</span>
                    </div>
                  ) : filteredEmployees.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                      <UserPlus className="h-5 w-5" />
                      <span>No employees match your search.</span>
                    </div>
                  ) : (
                    <ScrollArea className="h-64 rounded-md border">
                      <div className="divide-y">
                        {filteredEmployees.map((employee) => {
                          const fullName = [employee.firstName, employee.lastName].filter(Boolean).join(' ')
                          const displayName = fullName || employee.email
                          const departmentName = employee.department?.name ?? 'No department'
                          const currentTemplateName = employee.salaryTemplateId
                            ? templateNameById.get(employee.salaryTemplateId) ?? 'Other template'
                            : null
                          const isSelected = selectedEmployeeIds.has(employee.id)

                          return (
                            <div
                              key={employee.id}
                              className={`flex items-start gap-3 px-3 py-2 text-sm transition-colors ${
                                isSelected ? 'bg-muted/60' : 'hover:bg-muted/40'
                              }`}
                            >
                              <Checkbox
                                id={`assign-employee-${employee.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handleEmployeeSelectionChange(employee.id, checked === true)
                                }
                              />
                              <label htmlFor={`assign-employee-${employee.id}`} className="flex-1 cursor-pointer space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium leading-snug">{displayName}</span>
                                  {employee.email && (
                                    <span className="text-xs text-muted-foreground">{employee.email}</span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  <span>{departmentName}</span>
                                  {currentTemplateName && employee.salaryTemplateId !== selectedAssignmentTemplateId && (
                                    <Badge variant="outline" className="text-[10px]">
                                      Current: {currentTemplateName}
                                    </Badge>
                                  )}
                                  {employee.salaryTemplateId === selectedAssignmentTemplateId && (
                                    <Badge variant="secondary" className="text-[10px]">
                                      Already assigned
                                    </Badge>
                                  )}
                                </div>
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                <div className="rounded-lg border p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">Departments</p>
                      <p className="text-xs text-muted-foreground">Assign the template to entire departments in one go.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="px-2 py-1 text-xs">
                        {selectedDepartmentsCount} selected
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDepartmentIds(() => new Set<string>())}
                        disabled={selectedDepartmentsCount === 0}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <Input
                    placeholder="Search departments"
                    value={departmentSearch}
                    onChange={(event) => setDepartmentSearch(event.target.value)}
                  />
                  {assignmentTargetsLoading && assignmentTargets.departments.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading departments...</span>
                    </div>
                  ) : filteredDepartments.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                      <Building2 className="h-5 w-5" />
                      <span>No departments match your search.</span>
                    </div>
                  ) : (
                    <ScrollArea className="h-64 rounded-md border">
                      <div className="divide-y">
                        {filteredDepartments.map((department) => {
                          const isSelected = selectedDepartmentIds.has(department.id)
                          return (
                            <div
                              key={department.id}
                              className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                                isSelected ? 'bg-muted/60' : 'hover:bg-muted/40'
                              }`}
                            >
                              <Checkbox
                                id={`assign-department-${department.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handleDepartmentSelectionChange(department.id, checked === true)
                                }
                              />
                              <label htmlFor={`assign-department-${department.id}`} className="flex-1 cursor-pointer">
                                <span className="font-medium leading-snug">{department.name}</span>
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={closeAssignmentDialog}
                disabled={assignmentSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitAssignment}
                disabled={assignmentSubmitting || assignmentSelectionCount === 0 || !selectedAssignmentTemplateId}
              >
                {assignmentSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save assignments
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      <AlertDialog open={Boolean(templateDeleteId)} onOpenChange={(open) => !open && setTemplateDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete salary template</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Deleting a template will remove it permanently. Make sure it is not assigned to
              any employees.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={templateDeleteId ? templateActionLoading[templateDeleteId] : false}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!templateDeleteId || (templateDeleteId ? templateActionLoading[templateDeleteId] : false)}
              onClick={() => templateDeleteId && handleDeleteTemplate(templateDeleteId)}
            >
              {templateDeleteId && templateActionLoading[templateDeleteId] ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(ruleDeleteId)} onOpenChange={(open) => !open && setRuleDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete calculation rule</AlertDialogTitle>
            <AlertDialogDescription>
              Removing this rule will detach it from any salary templates referencing it. Continue only if the rule is no longer
              needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ruleDeleteId ? ruleActionLoading[ruleDeleteId] : false}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!ruleDeleteId || (ruleDeleteId ? ruleActionLoading[ruleDeleteId] : false)}
              onClick={() => ruleDeleteId && handleDeleteRule(ruleDeleteId)}
            >
              {ruleDeleteId && ruleActionLoading[ruleDeleteId] ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SalaryTemplateEditor;
