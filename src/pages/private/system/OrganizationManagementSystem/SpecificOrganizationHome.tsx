import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useParams, useNavigate } from "react-router-dom"
import {
  useOrganization,
  useUpdateOrganization,
  useOrganizationAdmins,
  useSetOrganizationAdmin,
  useRemoveOrganizationAdmin,
  OrganizationType
} from '@/hooks/queries'
import { useSubscriptionPlans } from '@/hooks/queries/useBilling'
import { getApiErrorMessage } from '@/lib/apiError'
import { useEffect, useState } from "react"
import { ArrowLeft, Users, Layers, ShieldCheck, CheckCircle2, XCircle, Trash2, UserPlus } from "lucide-react"

const SpecificOrganizationHome = () => {
  const params = useParams<{ organizationId?: string; id?: string }>()
  const orgId = params.organizationId || params.id
  const navigate = useNavigate()
  const { toast } = useToast()

  // Use TanStack Query hooks
  const { data: organization, isLoading: isLoadingOrg, error: orgError } = useOrganization(orgId)
  const { data: subscriptionPlans = [], isLoading: isLoadingPlans } = useSubscriptionPlans()
  const updateMutation = useUpdateOrganization()
  const { data: admins = [], isLoading: isLoadingAdmins } = useOrganizationAdmins(orgId)
  const setAdminMutation = useSetOrganizationAdmin(orgId)
  const removeAdminMutation = useRemoveOrganizationAdmin(orgId)

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<OrganizationType>>({})
  const [adminUserId, setAdminUserId] = useState('')

  const handlePromoteAdmin = async () => {
    if (!organization || !adminUserId.trim()) return
    try {
      await setAdminMutation.mutateAsync(adminUserId.trim())
      toast({ title: 'Admin added', description: 'The user can now manage this organization.' })
      setAdminUserId('')
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Failed to add admin',
        description: getApiErrorMessage(
          error,
          'Please verify the user id and try again.'
        )
      })
    }
  }

  const handleRemoveAdmin = async (userId: string) => {
    try {
      await removeAdminMutation.mutateAsync(userId)
      toast({ title: 'Admin removed' })
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Failed to remove admin',
        description: getApiErrorMessage(error, 'Please try again.')
      })
    }
  }

  // Sync form data when organization data loads
  useEffect(() => {
    if (organization) {
      setFormData(organization)
    }
  }, [organization])

  const handleSave = () => {
    if (!organization) return

    updateMutation.mutate({ ...formData, id: organization.id }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Organization updated successfully",
        })
        setIsEditing(false)
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update organization. Please try again.",
          variant: "destructive",
        })
      }
    })
  }

  const handleStatusToggle = (checked: boolean) => {
    if (!organization) return

    const updatedData = { ...formData, isActive: checked }
    setFormData(updatedData)

    updateMutation.mutate({ ...updatedData, id: organization.id }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: `Organization ${checked ? 'activated' : 'deactivated'} successfully`,
        })
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update organization status. Please try again.",
          variant: "destructive",
        })
      }
    })
  }

  if (isLoadingOrg) {
    return (
      <div className="container mx-auto py-6 overflow-y-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/p/organization')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Organizations
        </Button>
        <Card className="w-full">
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (orgError) {
    return (
      <div className="container mx-auto py-6 overflow-y-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/p/organization')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Organizations
        </Button>
        <Card className="w-full border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Organization</CardTitle>
            <CardDescription>Failed to load organization data for ID: {orgId}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please verify that you have permission to view this organization.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="container mx-auto py-6 overflow-y-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/p/organization')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Organizations
        </Button>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Organization Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The requested organization could not be found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const userCount = organization.counts?.users ?? organization.users?.length ?? 0;
  const deptCount = organization.counts?.departments ?? organization.departments?.length ?? 0;
  const planName =
    organization.subscriptionPlan?.name ||
    subscriptionPlans.find((plan) => plan.id === organization.subscriptionPlanId)?.name ||
    organization.subscriptionPlanId ||
    'No Plan Configured';

  return (
    <div className="container mx-auto py-6 overflow-y-auto space-y-6">
      {/* Back button and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            onClick={() => navigate('/p/organization')}
            className="flex items-center gap-2 mb-2 p-0 h-auto hover:bg-transparent text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Organizations
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
            <Badge variant={organization.isActive ? "default" : "destructive"}>
              {organization.isActive ? (
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Active</span>
              ) : (
                <span className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Inactive</span>
              )}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Organization ID: <span className="font-mono text-xs">{organization.id}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Details'}
          </Button>
          {isEditing && (
            <Button
              variant="ghost"
              onClick={() => {
                setFormData(organization);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
            <p className="text-xs text-muted-foreground">Registered employees and members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deptCount}</div>
            <p className="text-xs text-muted-foreground">Configured departments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{planName}</div>
            <p className="text-xs text-muted-foreground">
              {organization.subscriptionEnd
                ? `Ends ${new Date(organization.subscriptionEnd).toLocaleDateString()}`
                : "Active Subscription"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Details Card */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>View and configure core organization parameters</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={handleStatusToggle}
                disabled={!isEditing || updateMutation.isPending}
              />
              <span className={`text-sm font-medium ${formData.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization Name</label>
              <Input
                value={formData.name || ''}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter organization name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Industry</label>
              <Input
                value={formData.industry || ''}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g. Technology, Education, Healthcare"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Subscription Plan</label>
              {isEditing ? (
                <Select
                  value={formData.subscriptionPlanId || ''}
                  onValueChange={(value) => setFormData({ ...formData, subscriptionPlanId: value })}
                  disabled={isLoadingPlans}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subscription plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ${plan.price || 0}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={planName} disabled />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Organization Admins
          </CardTitle>
          <CardDescription>
            Promote an existing user (by user id) to manage this organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={adminUserId}
              onChange={(event) => setAdminUserId(event.target.value)}
              placeholder="User ID"
              className="flex-1"
            />
            <Button
              onClick={handlePromoteAdmin}
              disabled={!adminUserId.trim() || setAdminMutation.isPending}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {setAdminMutation.isPending ? 'Adding...' : 'Add Admin'}
            </Button>
          </div>

          {isLoadingAdmins ? (
            <p className="text-sm text-muted-foreground">Loading admins...</p>
          ) : admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admins assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {`${admin.firstName ?? ''} ${admin.lastName ?? ''}`.trim() || admin.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {admin.email}
                      {admin.roles.length > 0 ? ` · ${admin.roles.join(', ')}` : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAdmin(admin.userId)}
                    disabled={removeAdminMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SpecificOrganizationHome
