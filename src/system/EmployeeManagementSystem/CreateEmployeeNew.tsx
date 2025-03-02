import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/services/AuthContext';
import { APIDictionary } from '@/api/APIdict';
import axios from 'axios';
import { Department, User } from '@/interface/general';
import RoleAssignment from './RoleAssignment';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader, Sparkles } from 'lucide-react';

const basicDetailsSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  mobileNumber: z.string().min(10, 'Invalid mobile number'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(1, 'Address is required'),
  adharNumber: z.string().optional(),
  panNumber: z.string().optional(),
  employeeId: z.string().optional(),

});

const bankDetailsSchema = z.object({
  accountHolder: z.string().min(1, 'Account holder name is required'),
  accountNumber: z.string().min(9, 'Invalid account number'),
  ifscCode: z.string().min(11, 'Invalid IFSC code'),
  bankName: z.string().min(1, 'Bank name is required'),
});

const salaryDetailsSchema = z.object({
  annualPackage: z.number().min(0, 'Annual package must be positive'),
  monthlySalary: z.number().min(0, 'Monthly salary must be positive'),
  hraPercentage: z.number().min(0).max(100),
  daPercentage: z.number().min(0).max(100),
  taPercentage: z.number().min(0).max(100),
  pfPercentage: z.number().min(0).max(100),
  taxPercentage: z.number().min(0).max(100),
  insuranceFixed: z.number().min(0),
});

const roleAssignmentSchema = z.object({
  departmentId: z.string().optional(),
  roleIds: z.array(z.string()).min(1, 'At least one role must be selected'),
  managerId: z.string().optional(),
});

const formSchemas = [
  basicDetailsSchema,
  bankDetailsSchema,
  salaryDetailsSchema,
  roleAssignmentSchema,
] as const;

const steps = [
  'Basic Details',
  'Bank Details',
  'Salary Details',
  'Role Assignment',
] as const;

const CreateEmployeeNew = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [useHeadAsManager, setUseHeadAsManager] = useState(false);
  const [employeeIdExists, setEmployeeIdExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        `${APIDictionary.department}/org/${user?.orgId}`,
        { withCredentials: true }
      );
      setDepartments(response.data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch departments",
        variant: "destructive",
      });
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${APIDictionary.Organization}/employees/${user?.orgId}`,
        { withCredentials: true }
      );
      setEmployees(response.data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
    fetchEmployeeId();
  }, [user?.orgId]);

  const form = useForm({
    resolver: zodResolver(formSchemas[currentStep]),
    defaultValues: {
      // Basic Details
      firstName: '',
      lastName: '',
      email: '',
      mobileNumber: '',
      dateOfBirth: '',
      address: '',
      adharNumber: '',
      panNumber: '',
      employeeId: '',

      // Bank Details
      accountHolder: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',

      // Salary Details
      annualPackage: 0,
      monthlySalary: 0,
      hraPercentage: 0,
      daPercentage: 0,
      taPercentage: 0,
      pfPercentage: 0,
      taxPercentage: 0,
      insuranceFixed: 0,

      // Role Assignment
      departmentId: '',
      roleIds: [],
      managerId: ''
    }
  });
  const fetchEmployeeId = async () => {
    try {
      if (!user?.orgId) {
        toast({
          title: 'Error',
          description: 'Organization ID not found',
          variant: 'destructive',
        });
        return;
      }
      const response = await axios.get(
        `${APIDictionary.Organization}/employees/employee-id/${user?.orgId}/`,
        { withCredentials: true }
      );
      form.setValue('employeeId', response.data?.employeeId);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    }
  }
  const checkEmployeeId = async (employeeId: string) => {
    try {
      if (!user?.orgId) {
        toast({
          title: 'Error',
          description: 'Organization ID not found',
          variant: 'destructive',
        });
        return;
      }
      if(!employeeId) {
        setEmployeeIdExists(false);
        return false;
      }
      const response = await axios.get(
        `${APIDictionary.Organization}/employees/employee-id/${user?.orgId}/check/${employeeId}`,
        { withCredentials: true }
      );
      setEmployeeIdExists(response.data?.exists);
      return response.data?.exists;
    }
    catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    }
  }
  

  const onSubmit = async (data: any) => {
    try {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
        return;
      }

      // Final submission
      if (!user?.orgId) {
        toast({
          title: 'Error',
          description: 'Organization ID not found',
          variant: 'destructive',
        });
        return;
      }
      console.log(form.getValues());
      console.log(data);
      data = form.getValues();
      setLoading(true);
      const response = await axios.post(`${APIDictionary.Organization}/employees`, {
        data,
        orgId: user.orgId,
      });
      if (response.status == 201) {

        toast({
          title: 'Success',
          description: 'Employee created successfully',
        });
        form.reset();
        setCurrentStep(0);
      } else {
        toast({
          title: 'Error',
          description: 'Try Again',
          variant: 'destructive',
        });
      }

      // Reset form and step
    } catch (error:any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || error?.response?.data?.message || 'Failed to create employee',
        variant: 'destructive',
      });
    }finally {
      setLoading(false);
    }
  };

  const onPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  const renderRoleAssignmentStep = () => (
    <div className="space-y-4">
      <FormField
      control={form.control}
      name="departmentId"
      render={({ field }) => (
        <FormItem>
        <FormLabel>Department</FormLabel>
        <Select onValueChange={(value) => {
          field.onChange(value);
          // Reset head manager checkbox if department has no head
          const selectedDept = departments?.find(dept => dept?.id === value);
          if (!selectedDept?.headId) {
          setUseHeadAsManager(false);
          }
        }} value={field.value}>
          <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          </FormControl>
          <SelectContent>
          {departments?.map((dept) => (
            <SelectItem key={dept?.id} value={dept?.id}>
            {dept?.name}
            </SelectItem>
          ))}
          </SelectContent>
        </Select>
        <FormMessage />
        </FormItem>
      )}
      />

      <div className="flex items-center space-x-2">
      <Checkbox
        id="useHeadAsManager"
        checked={useHeadAsManager}
        disabled={!departments?.find(dept => dept?.id === form.getValues("departmentId"))?.headId}
        onCheckedChange={(checked) => {
        setUseHeadAsManager(checked as boolean);
        if (checked) {
          const selectedDept = departments?.find(
          (dept) => dept?.id === form.getValues("departmentId")
          );
          if (selectedDept?.headId) {
          form.setValue("managerId", selectedDept.headId);
          }
        } else {
          form.setValue("managerId", "");
        }
        }}
      />
      <label 
        htmlFor="useHeadAsManager"
        className={!departments?.find(dept => dept?.id === form.getValues("departmentId"))?.headId ? "text-muted-foreground" : ""}
      >
        Use department head as manager
      </label>
      </div>

      {!useHeadAsManager && (
      <FormField
        control={form.control}
        name="managerId"
        render={({ field }) => (
        <FormItem>
          <FormLabel>Manager</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
          <FormControl>
            <SelectTrigger>
            <SelectValue placeholder="Select manager" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {employees?.map((emp) => (
            <SelectItem key={emp?.id} value={emp?.id}>
              {`${emp?.firstName} ${emp?.lastName}`}
            </SelectItem>
            ))}
          </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
        )}
      />
      )}

      <FormField
      control={form.control}
      name="roleIds"
      render={({ field }) => (
        <FormItem>
        <FormLabel>Role</FormLabel>
        <div className="space-y-2">
          <RoleAssignment setRoleId={roleId => {
          field.onChange([roleId]);
          }} />
        </div>
        <FormMessage />
        </FormItem>
      )}
      />
    </div>
  );
  return (
    <div className="container mx-auto p-6 w-full h-full overflow-y-scroll">
      <Card>
        <CardHeader>
          <CardTitle>Create New Employee</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className={`flex flex-col items-center ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                    }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2 ${index <= currentStep
                      ? 'border-primary bg-primary text-white'
                      : 'border-muted-foreground'
                      }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-sm">{step}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 h-2 bg-secondary rounded-full">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Basic Details */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adharNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aadhar Number (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="panNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PAN Number (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee ID</FormLabel>
                        <div className="flex gap-2">
                          <FormControl className="flex-grow">
                          <Input
                            {...field}
                            onChange={async (e) => {
                              field.onChange(e);
                              await checkEmployeeId(e.target.value);
                            }}
                            className={employeeIdExists ? "border-red-500" : ""}
                          />
                          </FormControl>
                          <Button 
                          type="button"
                          onClick={fetchEmployeeId}
                          variant="outline"
                          >
                            <Sparkles/>
                          </Button>
                        </div>
                        {employeeIdExists && (
                          <div className="text-sm text-red-500 mt-1">
                            This Employee ID already exists
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Bank Details */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="accountHolder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Holder Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ifscCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IFSC Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Add other bank details fields */}
                </div>
              )}

              {/* Step 3: Salary Details */}
              {/* Step 3: Salary Details */}
              {currentStep === 2 && (
                <div className="space-y-4 w-full h-full">
                  <FormField
                    control={form.control}
                    name="annualPackage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Package</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthlySalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Salary</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hraPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HRA Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="daPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DA Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TA Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pfPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PF Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="insuranceFixed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Insurance Amount (Fixed)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 4: Role Assignment */}
              {currentStep === 3 && renderRoleAssignmentStep()}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onPrevious}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                {
                  !loading  && 
                (<Button type="submit">
                  {currentStep === steps.length - 1 ? 'Create Employee' : 'Next'}
                </Button>)
                }
                {
                  loading  && 
                (
                <Button className='' type="submit">
                  <Loader className='animate-spin'/>
                </Button>
                )
                }
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateEmployeeNew;