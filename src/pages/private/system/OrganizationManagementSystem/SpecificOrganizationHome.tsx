import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useParams, useNavigate } from "react-router-dom"
import { useOrganization, useUpdateOrganization, OrganizationType } from '@/hooks/queries'
import { useSubscriptionPlans } from '@/hooks/queries/useBilling'
import { useEffect, useState } from "react"
import { ArrowLeft, Users, Layers, ShieldCheck, CheckCircle2, XCircle } from "lucide-react"

const SpecificOrganizationHome = () => {
  const params = useParams<{ organizationId?: string; id?: string }>()
  const orgId = params.organizationId || params.id
  const navigate = useNavigate()
  const { toast } = useToast()

  // Use TanStack Query hooks
  const { data: organization, isLoading: isLoadingOrg, error: orgError } = useOrganization(orgId)
  const { data: subscriptionPlans = [], isLoading: isLoadingPlans } = useSubscriptionPlans()
  const updateMutation = useUpdateOrganization()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<OrganizationType>>({})

  // Sync form data when organization data loads
  useEffect(() => {
    if (organization) {
      setFormData(organization)
    }
  }, [organization])

  const handleSave = () => {
    if (!organization) return

    updateMutation.mutate(formData, {
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

    updateMutation.mutate(updatedData, {
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

  const userCount = (organization as any)?.users?.length || 0;
  const deptCount = (organization as any)?.departments?.length || 0;

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
            <div className="text-2xl font-bold">{organization.subscriptionPlan?.name || "Free/Standard"}</div>
            <p className="text-xs text-muted-foreground">
              {((organization.subscriptionPlan as any)?.price || (organization.subscriptionPlan as any)?.monthlyPrice)
                ? `$${(organization.subscriptionPlan as any)?.price || (organization.subscriptionPlan as any)?.monthlyPrice}/month`
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
                        {plan.name} - ${(plan as any).price || (plan as any).monthlyPrice || 0}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={organization.subscriptionPlan?.name || 'No Plan Configured'}
                  disabled
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SpecificOrganizationHome
