import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useParams } from "react-router-dom"
import { useOrganization, useUpdateOrganization, OrganizationType } from '@/hooks/queries'
import { useSubscriptionPlans } from '@/hooks/queries/useBilling'
import { useEffect, useState } from "react"

const SpecificOrganizationHome = () => {
  const { organizationId } = useParams<{ organizationId: string }>()
  const { toast } = useToast()

  // Use TanStack Query hooks
  const { data: organization, isLoading: isLoadingOrg, error: orgError } = useOrganization(organizationId)
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
      <Card className="w-full mt-8">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (orgError) {
    return (
      <Card className="w-full mt-8">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load organization data. Please try again.</p>
        </CardContent>
      </Card>
    )
  }

  if (!organization) {
    return (
      <Card className="w-full mt-8">
        <CardHeader>
          <CardTitle>Organization Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">The requested organization could not be found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full mt-8">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span>Organization Details</span>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={handleStatusToggle}
                disabled={!isEditing || updateMutation.isPending}
              />
              <span className={`text-sm ${formData.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <Button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={formData.name || ''}
              disabled={!isEditing}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Industry</label>
            <Input
              value={formData.industry || ''}
              disabled={!isEditing}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
          </div>
          <div>
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
                      {plan.name} - ${plan.price}/month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={organization.subscriptionPlan?.name || 'No Plan'}
                disabled
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SpecificOrganizationHome