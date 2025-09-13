import { APIDictionary } from '@/services/api/v2/APIdict'
import { Department, User } from '@/types/general'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from '@/hooks/use-toast'
import Loader from '@/components/Loader'
import { ArrowLeft, Building, Pencil, Save, Trash, AlertTriangle } from 'lucide-react'
import { useAtom } from 'jotai'
import { permissionListAtom } from '@/store/atom'
import CheckPermission from '@/services/PermissionCheck'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import RouteDict from '@/routes/RouteDict'

//warning : Warning: validateDOMNesting(...): <div> cannot appear as a descendant of <p>.


export const ButtonOfSpecificDepartmentEdit = ({id, user}: {
  id?: string | undefined
  user: User | null | undefined
}) => {
  const navigate = useNavigate()
  const [permissions] = useAtom(permissionListAtom)
  const hasPermission = CheckPermission('edit_department', permissions)
  const isCurrentUserHead = user?.Department?.[0]?.headId === user?.id
  
  if (!hasPermission && !isCurrentUserHead) return null
  if (!id) return null
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate(RouteDict.Department.Edit(id))}
      className="flex items-center gap-2"
    >
      <Pencil className="h-4 w-4" />
      Edit Department
    </Button>
  )
}

const SpecificDepartmentEdit = () => {
  const { id } = useParams()
  const [department, setDepartment] = useState<Department | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    location: '',
    budget: 0,
    status: true
  })
  const [initialFormData, setInitialFormData] = useState({
    name: '',
    description: '',
    code: '',
    location: '',
    budget: 0,
    status: true
  })
  const { toast } = useToast()
  const navigate = useNavigate()
  const [permissions] = useAtom(permissionListAtom)
  const hasDeletePermission = CheckPermission('delete_department', permissions)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const fetchDepartment = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(`${APIDictionary.department}/${id}`)
      setDepartment(response?.data)
      
      const data = {
        name: response?.data?.name ?? '',
        description: response?.data?.description ?? '',
        code: response?.data?.code ?? '',
        location: response?.data?.location ?? '',
        budget: response?.data?.budget ?? 0,
        status: response?.data?.status ?? true
      }
      
      setFormData(data)
      setInitialFormData(data)
    } catch (error) {
      console.error('Error fetching department details:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch department details"
      })
      navigate(RouteDict.Department.List)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartment()
  }, [id])

  useEffect(() => {
    // Check if form data has changed from initial values
    const checkChanges = () => {
      return (
        formData.name !== initialFormData.name ||
        formData.description !== initialFormData.description ||
        formData.code !== initialFormData.code ||
        formData.location !== initialFormData.location ||
        formData.budget !== initialFormData.budget ||
        formData.status !== initialFormData.status
      )
    }
    
    setHasChanges(checkChanges())
  }, [formData, initialFormData])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e?.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' ? parseFloat(value) || 0 : value
    }))
  }

  const handleStatusChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      status: checked
    }))
  }

  const handleDelete = async () => {
    try {
      setIsSaving(true)
      await axios.delete(`${APIDictionary.department}/${id}`)
      toast({
        title: "Department deleted",
        description: "Department has been successfully deleted"
      })
      navigate(RouteDict.Department.List)
    } catch (error) {
      console.error('Error deleting department:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete department"
      })
    } finally {
      setIsSaving(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSaving(true)
      await axios.put(`${APIDictionary.department}/${id}`, formData)
      setInitialFormData(formData) // Update initial data to reflect saved state
      setHasChanges(false)
      toast({
        title: "Changes saved",
        description: "Department information has been updated successfully"
      })
      navigate(RouteDict.Department.Edit(id || ''))
    } catch (error) {
      console.error('Error updating department:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update department"
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <Loader />

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={RouteDict.Department.List}>Departments</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={RouteDict.Department.Details(id || '')}>{department?.name || 'Department'}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(RouteDict.Department.Edit(id || ''))}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Edit Department</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Department Information
            </CardTitle>
            <CardDescription>
              Update the department's details below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name*</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData?.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Department Code*</Label>
                <Input
                  id="code"
                  name="code"
                  value={formData?.code}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData?.description || ''}
                onChange={handleChange}
                rows={4}
                placeholder="Enter a description for this department"
              />
            </div>

            <Separator />

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData?.location || ''}
                  onChange={handleChange}
                  placeholder="Department's physical location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget (₹)</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData?.budget}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-3">
              <Switch
                id="status"
                checked={formData?.status}
                onCheckedChange={handleStatusChange}
              />
              <Label htmlFor="status" className="font-medium">
                Department Active Status
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(`/department/${id}`)}
              >
                Cancel
              </Button>
              {hasDeletePermission && (
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      className="gap-2"
                      disabled={isSaving}
                    >
                      <Trash className="h-4 w-4" />
                      Delete Department
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        <div className="space-y-2">
                          <p>This will permanently delete the department <strong>{department?.name}</strong>.</p>
                          <div className="flex items-center p-3 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
                            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                            <p className="text-sm">All users in this department will need to be reassigned. This action cannot be undone.</p>
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isSaving}
                      >
                        {isSaving ? "Deleting..." : "Delete Department"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={isSaving || !hasChanges}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default SpecificDepartmentEdit