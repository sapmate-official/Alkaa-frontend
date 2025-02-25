import  { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { APIDictionary } from '../../api/APIdict'
import axios from 'axios'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { useNavigate } from 'react-router-dom'

interface Department {
  id: string
  name: string
}

interface Employee {
  id: string
  firstName: string
  lastName: string
}

const formSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  description: z.string().optional(),
  code: z.string().optional(),
  headId: z.string().optional(),
  parentId: z.string().optional(),
  location: z.string().optional(),
  budget: z.number().positive().optional(),
  status: z.boolean().default(true),
})

const CreateDepartment = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        if (!user?.organization?.id) {
          throw new Error('Organization ID not found')
        }

        // Fetch departments
        const deptResponse = await axios.get(`${APIDictionary.department}/org/${user?.organization?.id}`)
        setDepartments(deptResponse?.data || [])

        // Fetch employees
        const empResponse = await axios.get(`${APIDictionary.Organization}/employees/${user?.organization?.id}`)
        setEmployees(empResponse?.data || [])
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch data. Please try again later.',
          variant: 'destructive',
        })
        // Set empty arrays to prevent null issues
        setDepartments([])
        setEmployees([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user?.organization?.id])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: true,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post(APIDictionary.department, {
        ...values,
        orgId: user?.organization?.id,
      })
      console.log(response?.data);
      

      toast({
        title: 'Success',
        description: 'Department created successfully',
      })
      navigate("/p/department")
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create department',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-y-scroll mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Department</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter department name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter department description"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter department code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Department</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments?.length > 0 ? (
                      departments?.map((dept) => (
                        <SelectItem key={dept?.id} value={dept?.id}>
                          {dept?.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-departments" disabled>
                        No departments available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department head" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees?.length > 0 ? (
                      employees?.map((emp) => (
                        <SelectItem key={emp?.id} value={emp?.id}>
                          {`${emp?.firstName} ${emp?.lastName}`}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-employees" disabled>
                        No employees available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Enter department location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter department budget"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Department'}
          </Button>
        </form>
      </Form>
    </div>
  )
}

export default CreateDepartment