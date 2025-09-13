import { User } from '@/types/general'
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
import { useDepartmentQuery, useUpdateDepartmentMutation, useDeleteDepartmentMutation } from '@/hooks/queries/useDepartments'

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // TanStack Query hooks
  const { data: department, isLoading, error } = useDepartmentQuery(id || '')
  const updateMutation = useUpdateDepartmentMutation()
  const deleteMutation = useDeleteDepartmentMutation()

  // Handle loading and error states
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch department details"
      })
      navigate(RouteDict.Department.List)
    }
  }, [error, toast, navigate])

  // Update form data when department data is loaded
  useEffect(() => {
    if (department) {
      const data = {
        name: department.name ?? '',
        description: department.description ?? '',
        code: department.code ?? '',
        location: department.location ?? '',
        budget: department.budget ?? 0,
        status: department.status ?? true
      }
      
      setFormData(data)
      setInitialFormData(data)
    }
  }, [department])

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
    if (!id) return
    
    try {
      await deleteMutation.mutateAsync(id)
      navigate(RouteDict.Department.List)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    
    try {
      await updateMutation.mutateAsync({ id, data: formData })
      setInitialFormData(formData) // Update initial data to reflect saved state
      setHasChanges(false)
      navigate(RouteDict.Department.Edit(id))
    } catch (error) {
      // Error handling is done in the mutation hook
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
                      disabled={deleteMutation.isPending}
                    >
                      <Trash className="h-4 w-4" />
                      Delete Department
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the department <strong>{department?.name}</strong>.
                        <br />
                        <br />
                        <div className="flex items-center p-3 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
                          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                          <span className="text-sm">All users in this department will need to be reassigned. This action cannot be undone.</span>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? "Deleting..." : "Delete Department"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={updateMutation.isPending || !hasChanges}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default SpecificDepartmentEdit