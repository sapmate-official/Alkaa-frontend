import { useState, useEffect } from 'react';
import axios from 'axios';
import { APIDictionary } from '../../api/v2/APIdict';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from "lucide-react"; // Add this import
import { useNavigate } from 'react-router-dom';

interface OrganizationForm {
  name: string;
  industry: string;
  subscriptionPlan: string;
  subscriptionEnd: string;
  isActive: boolean;
  settings:string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface AdminForm {
  email: string;
  firstName: string;
  lastName: string;
}

const OrganizationCreate = () => {
  const router = useNavigate(); // Add this
  const [step, setStep] = useState(1);
  const [organizationId, setOrganizationId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState({
    step1: false,
    step2: false,
    step3: false
  });
  
  const [orgForm, setOrgForm] = useState<OrganizationForm>({
    name: '',
    industry: '',
    subscriptionPlan: 'BASIC', // default value
    subscriptionEnd: '', // Will be set to 1 year from now
    isActive: true,
    settings: JSON.stringify({})
  });

  const [adminForm, setAdminForm] = useState<AdminForm>({
    email: '',
    firstName: '',
    lastName: ''
  });

  // Fetch all permissions on component mount
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axios.get(APIDictionary.Permission);
        setPermissions(response?.data || []);
        // By default select all permissions
        setSelectedPermissions(response?.data?.map((p: Permission) => p?.id) || []);
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };
    fetchPermissions();
  }, []);

  // Step 1: Create Organization
  const createOrganization = async () => {
    setIsLoading(prev => ({ ...prev, step1: true }));
    try {
      const response = await axios.post(APIDictionary.Organization, {
        ...orgForm,
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      });
      setOrganizationId(response?.data?.id);
      toast({
        title: "Organization created successfully",
        description: "Proceeding to set up admin permissions",
      });
      setStep(2);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create organization",
        description: error?.response?.data?.message || "An unexpected error occurred",
      });
      console.error('Error creating organization:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, step1: false }));
    }
  };

  // Step 2: Create Admin Role
  const createAdminRole = async () => {
    setIsLoading(prev => ({ ...prev, step2: true }));
    try {
      const response = await axios.post(APIDictionary.role, {
        orgId: organizationId,
        name: 'Admin',
        description: 'Organization Administrator',
        permissions: [],
        isDefault: false
      });
      setRoleId(response?.data?.id);
      
      try {
        await updateRolePermissions(response?.data?.id);
        toast({
          title: "Admin role created successfully",
          description: "Proceeding to create admin user",
        });
        setStep(3);
      } catch (permError: any) {
        toast({
          variant: "destructive",
          title: "Failed to set role permissions",
          description: permError?.response?.data?.message || "An unexpected error occurred",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create admin role",
        description: error?.response?.data?.message || "An unexpected error occurred",
      });
      console.error('Error creating admin role:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, step2: false }));
    }
  };

  // Update Role Permissions
  const updateRolePermissions = async (roleId: string) => {
    try {
      await axios.put(`${APIDictionary.role}`, {
        id: roleId,
        orgId: organizationId,
        permissions: selectedPermissions,
        name: 'Org_Admin', // Maintain existing role name
        description: 'Organization Administrator', // Maintain existing description
        isDefault: false
      });
    } catch (error: any) {
      console.error('Error updating role permissions:', error);
      // Throw the error to be caught by the parent function
      throw new Error(error?.response?.data?.message || "Failed to update role permissions");
    }
  };

  // Step 3: Create Admin User
  const createAdminUser = async () => {
    setIsLoading(prev => ({ ...prev, step3: true }));
    try {
      // Create user
      const userResponse = await axios.post(APIDictionary.user, {
        ...adminForm,
        orgId: organizationId,
      });

      try {
        // Assign role to user
        await axios.post(APIDictionary.user_role, {
          userId: userResponse?.data?.id,
          roleId: roleId
        });

        toast({
          title: "Organization setup completed",
          description: "Admin will receive an email to set password",
        });
        
        // Add navigation after successful completion
        router(`/p/organisation/${organizationId}`);
        
      } catch (roleError: any) {
        // If role assignment fails, delete the created user
        await axios.delete(`${APIDictionary.user}/${userResponse?.data?.id}`);
        toast({
          variant: "destructive",
          title: "Failed to assign admin role",
          description: roleError?.response?.data?.message || "An unexpected error occurred",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create admin user",
        description: error?.response?.data?.message || "An unexpected error occurred",
      });
      console.error('Error creating admin user:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, step3: false }));
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Step 1: Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  placeholder="Enter organization name"
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({...orgForm, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="Enter industry"
                  value={orgForm.industry}
                  onChange={(e) => setOrgForm({...orgForm, industry: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Subscription Plan</Label>
                <Select 
                  value={orgForm.subscriptionPlan}
                  onValueChange={(value) => setOrgForm({...orgForm, subscriptionPlan: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BASIC">Basic</SelectItem>
                    <SelectItem value="PRO">Pro</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="w-full" 
                onClick={createOrganization}
                disabled={isLoading.step1}
              >
                {isLoading.step1 ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Organization
                  </>
                ) : (
                  "Next Step"
                )}
              </Button>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Step 2: Admin Role Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-4">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPermissions([...selectedPermissions, permission.id]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id));
                          }
                        }}
                      />
                      <Label htmlFor={permission.id}>
                        <div className="font-medium">{permission.name}</div>
                        <div className="text-sm text-muted-foreground">{permission.description}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button 
                className="w-full mt-4" 
                onClick={createAdminRole}
                disabled={isLoading.step2}
              >
                {isLoading.step2 ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting Up Permissions
                  </>
                ) : (
                  "Next Step"
                )}
              </Button>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Step 3: Admin User Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="First name"
                    value={adminForm.firstName}
                    onChange={(e) => setAdminForm({...adminForm, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Last name"
                    value={adminForm.lastName}
                    onChange={(e) => setAdminForm({...adminForm, lastName: e.target.value})}
                  />
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={createAdminUser}
                disabled={isLoading.step3}
              >
                {isLoading.step3 ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Admin User
                  </>
                ) : (
                  "Create Organization"
                )}
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <h1 className="text-3xl font-bold">Create Organization</h1>
      </div>
      {renderStep()}
    </div>
  );
};

export default OrganizationCreate;