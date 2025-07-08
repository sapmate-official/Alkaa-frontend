import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { APIDictionary } from '../../../../api/v2/APIdict'
import axios from 'axios'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/services/AuthContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {  useNavigate } from 'react-router-dom'
import { ArrowLeft, Building, MapPin, FolderTree } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useAtom } from 'jotai'
import { permissionListAtom } from '@/store/atom'
import CheckPermission from '@/services/PermissionCheck'
import RouteDict from '@/routes/RouteDict'

interface Department {
  id: string
  name: string
  code?: string
  status: boolean
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  employeeId: string
  role?: string
}

// Extend the schema to be more strict and provide better validation
const formSchema = z.object({
  name: z
    .string()
    .min(2, 'Department name must be at least 2 characters')
    .max(100, 'Department name cannot exceed 100 characters'),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
  code: z
    .string()
    .min(2, 'Department code must be at least 2 characters')
    .max(20, 'Department code cannot exceed 20 characters')
    .refine(code => /^[A-Za-z0-9\-_]+$/.test(code), {
      message: 'Department code can only contain letters, numbers, hyphens, and underscores'
    }),
  headId: z
    .string()
    .nullable()
    .optional(),
  parentId: z
    .string()
    .nullable()
    .optional(),
  location: z
    .string()
    .max(100, 'Location cannot exceed 100 characters')
    .optional(),
  budget: z
    .number()
    .nonnegative('Budget must be a non-negative number')
    .optional(),
  status: z
    .boolean()
    .default(true),
})

const CreateDepartment = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [permissions] = useAtom(permissionListAtom)
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const navigate = useNavigate()

  const canCreateDepartment = CheckPermission('create_new_department', permissions)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      code: '',
      headId: null,
      parentId: null,
      location: '',
      budget: 0,
      status: true,
    },
  })
  
  // Get the current department name value to generate code suggestion
  const watchName = form.watch('name')
  
  // Generate a suggested code based on the department name
  const suggestedCode = watchName
    ? watchName.trim()
        .split(/\s+/)
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 4) + '-' + Math.floor(Math.random() * 100).toString().padStart(2, '0')
    : '';

  // Auto-suggest code based on name when name changes
  useEffect(() => {
    if (watchName && !form.getValues('code')) {
      form.setValue('code', suggestedCode, { shouldValidate: false });
    }
  }, [watchName, suggestedCode]);

  useEffect(() => {
    // Check if user has permission to create departments
    if (!canCreateDepartment) {
      toast({
        title: "Access denied",
        description: "You don't have permission to create departments",
        variant: "destructive"
      })
      navigate(RouteDict.Department.Base)
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      try {
        if (!user?.orgId) {
          throw new Error('Organization ID not found')
        }

        // Fetch departments
        const deptResponse = await axios.get(`${APIDictionary.department}/org/${user?.orgId}`)
        setDepartments(deptResponse?.data || [])

        // Fetch employees
        const empResponse = await axios.get(`${APIDictionary.Organization}/employee-list/${user?.orgId}`)
        setEmployees(empResponse?.data || [])
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch required data. Please try again later.',
          variant: 'destructive',
        })
        setDepartments([])
        setEmployees([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user?.orgId, canCreateDepartment])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Clean up the values
      if (values.parentId === 'none') {
        values.parentId = null
      }
      if (values.headId === 'none') {
        values.headId = null
      }

      setIsSaving(true)
      
      const response = await axios.post(APIDictionary.department, {
        ...values,
        orgId: user?.orgId,
      })

      toast({
        title: 'Department created',
        description: 'The department has been successfully created',
      })
      
      // Navigate to the new department
      navigate(`/department/${response.data.id}`)
    } catch (error: any) {
      console.error('Error creating department:', error)
      
      // Show more specific error message if available
      const errorMessage = error.response?.data?.message || 'Failed to create department';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full p-4 space-y-6 overflow-y-auto">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={()=>navigate(RouteDict.Department.Base)} className='cursor-pointer'>Departments</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create New Department</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create New Department</h1>
        <Button variant="outline" onClick={() => navigate(RouteDict.Department.Base)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Enter the core details for the new department
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department Name*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter department name" {...field} />
                          </FormControl>
                          <FormDescription>
                            The official name of the department
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Code*</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., HR-01, FIN-02" {...field} />
                        </FormControl>
                        <FormDescription>
                          A unique identifier for this department
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active Status</FormLabel>
                          <FormDescription>
                            Inactive departments won't appear in general listings
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="sm:col-span-2">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter department description"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderTree className="h-5 w-5" />
                  Organization Structure
                </CardTitle>
                <CardDescription>
                  Define the department's position in the organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Department</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value ?? undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select parent department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem key="none" value="none">
                              No parent department
                            </SelectItem>
                            {departments.length > 0 ? (
                              departments
                                .filter(dept => dept.status) // Show only active departments
                                .map((dept) => (
                                  <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name} {dept.code ? `(${dept.code})` : ''}
                                  </SelectItem>
                                ))
                            ) : (
                              <SelectItem value="no-departments" disabled>
                                No departments available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          If this is a sub-department, select its parent
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="headId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Head</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value ?? undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department head" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem key="none" value="none">
                              No department head
                            </SelectItem>
                            {employees.length > 0 ? (
                              employees.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id}>
                                  {emp.firstName} {emp.lastName} {emp.employeeId ? `(${emp.employeeId})` : ''}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-employees" disabled>
                                No employees available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The employee who will lead this department
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Additional Details
                </CardTitle>
                <CardDescription>
                  Provide more information about the department
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter department location" {...field} />
                        </FormControl>
                        <FormDescription>
                          Physical location of this department
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter department budget"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Annual budget allocated to this department
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-6">
                <Button 
                  type="submit"
                  disabled={isSaving}
                  className="ml-auto"
                >
                  {isSaving ? "Creating..." : "Create Department"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      )}
    </div>
  )
}

export default CreateDepartment