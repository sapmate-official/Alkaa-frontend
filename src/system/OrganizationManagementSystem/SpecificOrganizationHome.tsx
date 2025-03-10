import { APIDictionary } from "@/api/v2/APIdict"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import axios from "axios"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

interface Organization {
  id: string;
  name: string;
  industry: string;
  subscriptionPlan: string;
  subscriptionEnd: string;
  isActive: boolean;
  settings: string;
}

const SpecificOrganizationHome = () => {
  const { organizationId } = useParams<{ organizationId: string }>()
  const { toast } = useToast()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Organization>>({})

  const fetchOrganization = async () => {
    try {
      const response = await axios.get(`${APIDictionary.Organization}/${organizationId}`)
      setOrganization(response.data)
      setFormData(response.data)
    } catch (error) {
      console.error('Failed to fetch organization:', error)
      toast({
        title: "Error",
        description: "Failed to fetch organization. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    try {
      await axios.patch(`${APIDictionary.Organization}`, formData)
      toast({
        title: "Success",
        description: "Organization updated successfully",
      })
      setIsEditing(false)
      fetchOrganization()
    } catch (error) {
      console.error('Failed to update organization:', error)
      toast({
        title: "Error",
        description: "Failed to update organization. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleStatusToggle = async (checked: boolean) => {
    try {
      await axios.patch(`${APIDictionary.Organization}`, {
        ...formData,
        isActive: checked
      })
      toast({
        title: "Success",
        description: `Organization ${checked ? 'activated' : 'deactivated'} successfully`,
      })
      setFormData(prev => ({ ...prev, isActive: checked }))
      fetchOrganization()
    } catch (error) {
      console.error('Failed to update organization status:', error)
      toast({
        title: "Error",
        description: "Failed to update organization status. Please try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchOrganization()
  }, [])

  if (!organization) return <div>Loading...</div>

  return (
    <Card className="w-full mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span>Organization Details</span>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={handleStatusToggle}
                disabled={!isEditing}
              />
              <span className={`text-sm ${formData.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <Button onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
            {isEditing ? 'Save' : 'Edit'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={formData.name}
              disabled={!isEditing}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Industry</label>
            <Input
              value={formData.industry}
              disabled={!isEditing}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Subscription Plan</label>
            <Input
              value={formData.subscriptionPlan}
              disabled={!isEditing}
              onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SpecificOrganizationHome