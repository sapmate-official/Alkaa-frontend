import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { APIDictionary } from '../../../../api/v2/APIdict';
import axios from 'axios';
import { useAuth } from '@/services/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Department, User } from '@/interface/general';
import { useAtom } from 'jotai';
import { permissionListAtom } from '../../../../store/atom';
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, ArrowLeft, Save } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import RouteDict from '@/routes/RouteDict';
import { useUserDetailsQuery, useUpdateProfileMutation } from '@/hooks/queries/useProfile';

interface FormDataType {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  adharNumber: string;
  panNumber: string;
  mobileNumber: string;
  emergencyContact?: string;
  dateOfBirth: string;
  hiredDate: string;
  departmentId: string;
  annualPackage: string;
  monthlySalary: string;
  orgId: string;
  managerId: string;
  status?: string;
}

const ProfileEdit = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [canEditStatus, setCanEditStatus] = useState(false);
  const [permissionList] = useAtom(permissionListAtom);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const userId = id || user?.id || ''
  
  // Use TanStack Query hooks
  const { 
    data: userResponse, 
    isLoading: loading, 
    error: userError 
  } = useUserDetailsQuery(userId)
  
  const updateProfileMutation = useUpdateProfileMutation()
  const submitting = updateProfileMutation.isPending

  const userData = userResponse?.user

  const isOwnProfile = !id || id === user?.id;
  const canEditPersonalInfo = permissionList.some(p => p.key === 'update_personal_info') && isOwnProfile;
  const canEditSubordinatesInfo = permissionList.some(p => p.key === 'update_personal_info_subordinates');
  const canEditAllUserInfo = permissionList.some(p => p.key === 'update_personal_info_all_user');
  
  const canEditEmployeeInfo = permissionList.some(p => p.key === 'update_employee_own') && isOwnProfile;
  const canEditSubordinatesEmployeeInfo = permissionList.some(p => p.key === 'update_personal_info_subordinates');
  const canEditAllUserEmployeeInfo = permissionList.some(p => p.key === 'update_employee_info_all_user');
  
  const canEditSalary = permissionList.some(p => p.key === 'update_salary_own') && isOwnProfile;
  const canEditSubordinatesSalary = permissionList.some(p => p.key === 'update_salary_subordinates');
  const canEditAllUserSalary = permissionList.some(p => p.key === 'update_salary_all_user');


  const canEditProfile = isOwnProfile ? 
    canEditPersonalInfo || canEditEmployeeInfo || canEditSalary : 
    canEditAllUserInfo || canEditSubordinatesInfo || canEditAllUserEmployeeInfo || 
    canEditSubordinatesEmployeeInfo || canEditAllUserSalary || canEditSubordinatesSalary;

  const [formData, setFormData] = useState<FormDataType>({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    adharNumber: '',
    panNumber: '',
    mobileNumber: '',
    emergencyContact: '',
    dateOfBirth: '',
    hiredDate: '',
    departmentId: '',
    annualPackage: '',
    monthlySalary: '',
    orgId: '',
    managerId: '',
    status: 'active',
  });

  useEffect(() => {
    const fetchDepartmentsAndManagers = async () => {
      if (!user?.orgId) return;
      
      try {
        const [departmentResponse, managerListResponse] = await Promise.all([
          axios.get(`${APIDictionary.department}/org/${user?.orgId}`, { withCredentials: true }),
          axios.get(`${APIDictionary.user}/fetch-managers/org/${user?.orgId}`, { withCredentials: true })
        ]);
        
        setManagers(managerListResponse.data);
        setDepartments(departmentResponse.data);
      } catch (error) {
        console.error('Error fetching departments/managers:', error);
        setError('Failed to fetch departments and managers. Please try again later.');
      }
    };
    
    if (!canEditProfile) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to edit profile.",
        variant: "destructive"
      });
      navigate(RouteDict.Profile.Base);
      return;
    }
    
    fetchDepartmentsAndManagers();
  }, [user?.orgId, canEditProfile, navigate, toast]);

  // Update form data when user data loads
  useEffect(() => {
    if (userData) {
      const isManager = userData?.managerId === user?.id;
      setCanEditStatus(canEditAllUserInfo || (canEditSubordinatesInfo && isManager));

      setFormData({
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || '',
        email: userData?.email || '',
        address: userData?.address || '',
        adharNumber: userData?.adharNumber || '',
        panNumber: userData?.panNumber || '',
        mobileNumber: userData?.mobileNumber || '',
        emergencyContact: userData?.emergencyContact || '',
        dateOfBirth: userData?.dateOfBirth?.split('T')[0] || '',
        hiredDate: userData?.hiredDate?.split('T')[0] || '',
        departmentId: userData?.departmentId || '',
        annualPackage: userData?.annualPackage?.toString() || '',
        monthlySalary: userData?.monthlySalary?.toString() || '',
        orgId: userData?.orgId || '',
        managerId: userData?.managerId || '',
        status: userData?.status || 'active',
      });
    }
  }, [userData, user?.id, canEditAllUserInfo, canEditSubordinatesInfo]);

  // Handle errors
  if (userError) {
    setError('Failed to fetch profile data. Please try again later.');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = id || user?.id;
      if (!userId) return;
      
      updateProfileMutation.mutate({ userId, data: formData });
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Calculate corresponding value based on which field was changed
    if (name === 'annualPackage' && value) {
      const annualValue = parseFloat(value);
      const monthlyValue = (annualValue / 12).toFixed(2);
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        monthlySalary: monthlyValue
      }));
    } else if (name === 'monthlySalary' && value) {
      const monthlyValue = parseFloat(value);
      const annualValue = (monthlyValue * 12).toFixed(2);
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        annualPackage: annualValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value || ''
      }));
    }
  };

  const handleSelectChange = (name: keyof FormDataType, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value || ''
    }));
  };

  if (loading) {
    return (
      <Card className="mx-auto h-full w-full">
        <CardContent className="flex flex-col items-center justify-center h-full py-20">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading profile data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto h-full w-full">
        <CardContent className="flex flex-col items-center justify-center h-full py-20">
          <div className="flex flex-col items-center text-destructive gap-2">
            <AlertCircle size={40} />
            <p>{error}</p>
          </div>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto h-full w-full overflow-y-auto">
      <CardHeader className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle>Edit Profile</CardTitle>
          </div>
          <Button 
            type="submit" 
            form="profile-form"
            disabled={submitting}
            className="flex items-center gap-2"
          >
            {submitting ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 pb-20">
        <form id="profile-form" onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              {(!canEditPersonalInfo && !canEditSubordinatesInfo && !canEditAllUserInfo) && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">Read only</span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={!canEditPersonalInfo && !canEditSubordinatesInfo && !canEditAllUserInfo}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={!canEditPersonalInfo && !canEditSubordinatesInfo && !canEditAllUserInfo}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!canEditPersonalInfo && !canEditSubordinatesInfo && !canEditAllUserInfo}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adharNumber">Aadhar Number *</Label>
                <Input
                  id="adharNumber"
                  name="adharNumber"
                  value={formData.adharNumber}
                  onChange={handleChange}
                  disabled={!canEditPersonalInfo && !canEditSubordinatesInfo && !canEditAllUserInfo}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panNumber">PAN Number *</Label>
                <Input
                  id="panNumber"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  disabled={!canEditPersonalInfo && !canEditSubordinatesInfo && !canEditAllUserInfo}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number *</Label>
                <Input
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  disabled={!canEditPersonalInfo && !canEditSubordinatesInfo && !canEditAllUserInfo}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Phone Number *</Label>
                <Input
                required
                  id="emergencyContact"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  disabled={!canEditPersonalInfo && !canEditSubordinatesInfo && !canEditAllUserInfo}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  disabled={!canEditPersonalInfo && !canEditSubordinatesInfo && !canEditAllUserInfo}
                />
              </div>
              
              {canEditStatus && (
                <div className="space-y-2">
                  <Label htmlFor="status">User Status</Label>
                  <Select
                    value={formData.status || 'active'}
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Employment & Compensation</h3>
              {(!canEditEmployeeInfo && !canEditSubordinatesEmployeeInfo && !canEditAllUserEmployeeInfo) && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">Read only</span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="hiredDate">Hiring Date *</Label>
                <Input
                  type="date"
                  id="hiredDate"
                  name="hiredDate"
                  value={formData.hiredDate}
                  onChange={handleChange}
                  disabled={!canEditEmployeeInfo && !canEditSubordinatesEmployeeInfo && !canEditAllUserEmployeeInfo}
                  className="w-full"
                />
              </div>

              

              <div className="space-y-2">
                <Label htmlFor="departmentId">Department *</Label>
                <Select
                  value={formData.departmentId || ''}
                  onValueChange={(value) => handleSelectChange('departmentId', value)}
                  disabled={!canEditEmployeeInfo && !canEditSubordinatesEmployeeInfo && !canEditAllUserEmployeeInfo}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(department => {
                      return <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="managerId">Manager *</Label>
                <Select
                  value={formData.managerId || ''}
                  onValueChange={(value) => handleSelectChange('managerId', value)}
                  disabled={!canEditEmployeeInfo && !canEditSubordinatesEmployeeInfo && !canEditAllUserEmployeeInfo}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers
                      .filter(manager => manager.id !== (id || user?.id))
                      .map(manager => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.firstName} {manager.lastName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualPackage">Annual Package *</Label>
                <Input
                  type="number"
                  id="annualPackage"
                  name="annualPackage"
                  value={formData.annualPackage}
                  onChange={handleChange}
                  disabled={!canEditSalary && !canEditSubordinatesSalary && !canEditAllUserSalary}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlySalary">Monthly Salary *</Label>
                <Input
                  type="number"
                  id="monthlySalary"
                  name="monthlySalary"
                  value={formData.monthlySalary}
                  onChange={handleChange}
                  disabled={!canEditSalary && !canEditSubordinatesSalary && !canEditAllUserSalary}
                />
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-col sm:flex-row gap-4 w-full mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const link = id ? RouteDict.Profile.EditBank(id) : RouteDict.Profile.EditBank(null);
                navigate(link);
              }}
              className="flex-1"
            >
              Edit Bank Details
            </Button>
            <Button 
              type="submit" 
              className="flex-1 flex items-center justify-center gap-2"
              disabled={submitting}
            >
              {submitting ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
              {submitting ? "Saving..." : "Update Profile"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileEdit;