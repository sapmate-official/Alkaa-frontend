import { APIDictionary } from '@/api/v2/APIdict'
import { Department, User } from '@/interface/general'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from '@/hooks/use-toast'
import Loader from '@/components/Loader'
import { Pencil, Trash } from 'lucide-react'
import { useAtom } from 'jotai'
import { permissionListAtom } from '@/store/atom'
import CheckPermission from '@/services/PermissionCheck'

export const ButtonOfSpecificDepartmentEdit = ({id,user}:{
  id?: string | undefined
  user: User | null | undefined
}) => {
  const navigate = useNavigate()
  const [permissions] = useAtom(permissionListAtom)
  const hasPermission = CheckPermission('edit_department', permissions)
  if (!hasPermission) return null
  if (!id) return null
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate(`/p/department/${id ? id : user?.Department?.[0]?.id}/edit`)}
    >
      <Pencil className="h-4 w-4 mr-2" />
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
  const { toast } = useToast()
  const navigate = useNavigate()
  const [permissions] = useAtom(permissionListAtom)
  const hasDeletePermission = CheckPermission('delete_department', permissions)

  const fetchDepartment = async () => {
    try {
      const response = await axios.get(`${APIDictionary.department}/${id}`)
      setDepartment(response?.data)
      setFormData({
        name: response?.data?.name ?? '',
        description: response?.data?.description ?? '',
        code: response?.data?.code ?? '',
        location: response?.data?.location ?? '',
        budget: response?.data?.budget ?? 0,
        status: response?.data?.status ?? true
      })
    } catch (error) {
      console.log(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch department details"
      })
    }
  }

  useEffect(() => {
    fetchDepartment()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e?.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleStatusChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      status: checked
    }))
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      try {
        await axios.delete(`${APIDictionary.department}/${id}`)
        toast({
          title: "Success",
          description: "Department deleted successfully"
        })
        navigate('/p/department/list') 
      } catch (error) {
        console.error('Error deleting department:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete department"
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.put(`${APIDictionary.department}/${id}`, formData)
      toast({
        title: "Success",
        description: "Department updated successfully"
      })
      navigate(`/p/department/${id}`)
    } catch (error) {
      console.error('Error updating department:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update department"
      })
    }
  }

  if (!department) return <Loader />
  return (
    <form onSubmit={handleSubmit} className=" mx-auto p-4 h-full w-full overflow-y-scroll">
      <Card>
        <CardHeader>
          <CardTitle>Edit Department</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Department Name</Label>
            <Input
              id="name"
              name="name"
              value={formData?.name}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData?.description}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Department Code</Label>
            <Input
              id="code"
              name="code"
              value={formData?.code}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={formData?.location}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              name="budget"
              type="number"
              value={formData?.budget}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="status"
              checked={formData?.status}
              onCheckedChange={handleStatusChange}
            />
            <Label htmlFor="status">Department Active Status</Label>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit">
              Update Department
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/p/department/${id}`)}
            >
              Cancel
            </Button>
            {hasDeletePermission && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete Department
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

export default SpecificDepartmentEdit