import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { APIDictionary } from '../../../../services/api/v2/APIdict';
import axios from 'axios';
import { useAuth } from '@/providers/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Department, User } from '@/types/general';
import { usePermissions } from '@/store/useAuthStore';
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, ArrowLeft, Save } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import RouteDict from '@/routes/RouteDict';
import { useUserDetailsQuery, useUpdateProfileMutation } from '@/hooks/queries/useProfile';
import { useEmployeeAuditHistory } from '@/hooks/queries/useEmployeeAuditHistory';
import { PreviousDetailPill } from '@/components/employee/PreviousDetailPill';
import { EmployeeRevisionHistoryCard } from '@/components/employee/EmployeeRevisionHistoryCard';
import { CountrySelect } from '@/components/common/CountrySelect';
import { MarketSelect } from '@/components/common/MarketSelect';

interface FormDataType {
  [key: string]: string | undefined;
  firstName: string;
  lastName: string;
  personalEmail: string;
  businessEmail?: string;
  jobTitle?: string;
  terminationDate?: string;
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
  countryOfCompany?: string;
  market?: string;
}

const ProfileEdit = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [canEditStatus, setCanEditStatus] = useState(false);
  const permissionList = usePermissions();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const userId = id || user?.id || ''
  
  // Use TanStack Query hooks
  const { 
    data: userResponse, 
    isLoading: loading, 
    error: userError 
  } = useUserDetailsQuery(userId)
  
  const { data: auditLogs = [] } = useEmployeeAuditHistory(userId)
  
  const updateProfileMutation = useUpdateProfileMutation()
  const submitting = updateProfileMutation.isPending

  const userData = (userResponse as { user?: User } | undefined)?.user ?? (userResponse as User | undefined);

  const isOwnProfile = !id || id === user?.id;
  const isSuperAdmin = Boolean(user?.superAdmin || user?.isSuperAdmin);
  const isOrgAdmin = Boolean(
    permissionList.some(p => p.key === 'org_admin') ||
    (user as { roles?: (string | { role?: { name?: string }; name?: string })[] })?.roles?.some(
      (r) =>
        typeof r === 'string'
          ? ['Org_Admin', 'Admin', 'SUPER_ADMIN'].includes(r)
          : ['Org_Admin', 'Admin', 'SUPER_ADMIN'].includes(r?.role?.name || r?.name || '')
    )
  );

  // Personal fields: every employee can always edit their own — no permission required.
  const canEditPersonalInfo = isOwnProfile;

  // Employment / salary: require explicit permissions OR admin
  const canEditEmployeeInfo = isSuperAdmin || isOrgAdmin || (
    isOwnProfile && permissionList.some(p => p.key === 'update_employee_own')
  );
  const canEditSalary = isSuperAdmin || isOrgAdmin || (
    isOwnProfile && permissionList.some(p => p.key === 'update_salary_own')
  );

  // Non-self editing (admin/manager editing another employee)
  const canEditSubordinatesInfo = permissionList.some(p => p.key === 'update_personal_info_subordinates');
  const canEditAllUserInfo = isSuperAdmin || isOrgAdmin || permissionList.some(p => p.key === 'update_personal_info_all_user');
  const canEditSubordinatesEmployeeInfo = permissionList.some(p => p.key === 'update_personal_info_subordinates');
  const canEditAllUserEmployeeInfo = isSuperAdmin || isOrgAdmin || permissionList.some(p => p.key === 'update_employee_info_all_user');
  const canEditSubordinatesSalary = permissionList.some(p => p.key === 'update_salary_subordinates');
  const canEditAllUserSalary = isSuperAdmin || isOrgAdmin || permissionList.some(p => p.key === 'update_salary_all_user');

  const canEditProfile = isOwnProfile
    ? true
    : isSuperAdmin || isOrgAdmin || canEditAllUserInfo || canEditSubordinatesInfo || canEditAllUserEmployeeInfo ||
      canEditSubordinatesEmployeeInfo || canEditAllUserSalary || canEditSubordinatesSalary;

  const [formData, setFormData] = useState<FormDataType>({
    firstName: '',
    lastName: '',
    personalEmail: '',
    businessEmail: '',
    jobTitle: '',
    terminationDate: '',
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
    countryOfCompany: '',
    market: '',
  });

  const safeDateStr = (dateVal?: string | Date | null) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  useEffect(() => {
    // If auth state or user profile data is still resolving, wait before gating permissions
    if (loading || !user) return;

    const fetchDepartmentsAndManagers = async () => {
      if (!user?.orgId) return;
      
      try {
        const [departmentResponse, managerListResponse] = await Promise.all([
          axios.get(`${APIDictionary.department}/org/${user?.orgId}`, { withCredentials: true }),
          axios.get(`${APIDictionary.user}/fetch-managers/org/${user?.orgId}`, { withCredentials: true })
        ]);
        
        const deptList = Array.isArray(departmentResponse.data)
          ? departmentResponse.data
          : (departmentResponse.data?.departments ?? departmentResponse.data?.data ?? []);
        const mgrList = Array.isArray(managerListResponse.data)
          ? managerListResponse.data
          : (managerListResponse.data?.managers ?? managerListResponse.data?.data ?? []);

        setManagers(mgrList);
        setDepartments(deptList);
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
  }, [user?.orgId, canEditProfile, navigate, toast, loading, user]);

  // Update form data when user data loads
  useEffect(() => {
    if (userData) {
      const isManager = userData?.managerId === user?.id;
      setCanEditStatus(canEditAllUserInfo || (canEditSubordinatesInfo && isManager));

      setFormData({
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || '',
        personalEmail: userData?.personalEmail || userData?.email || '',
        businessEmail: userData?.businessEmail || '',
        jobTitle: userData?.jobTitle || '',
        terminationDate: safeDateStr(userData?.terminationDate),
        address: userData?.address || '',
        adharNumber: userData?.adharNumber || '',
        panNumber: userData?.panNumber || '',
        mobileNumber: userData?.mobileNumber || '',
        emergencyContact: userData?.emergencyContact || '',
        dateOfBirth: safeDateStr(userData?.dateOfBirth),
        hiredDate: safeDateStr(userData?.hiredDate),
        departmentId: userData?.departmentId || '',
        annualPackage: userData?.annualPackage?.toString() || '',
        monthlySalary: userData?.monthlySalary?.toString() || '',
        orgId: userData?.orgId || '',
        managerId: userData?.managerId || '',
        status: userData?.status || 'active',
        countryOfCompany: (userData as { countryOfCompany?: string })?.countryOfCompany || '',
        market: (userData as { market?: string })?.market || '',
      });
    }
  }, [userData, user?.id, canEditAllUserInfo, canEditSubordinatesInfo]);

  // Handle errors
  useEffect(() => {
    if (userError) {
      setError('Failed to fetch profile data. Please try again later.');
    }
  }, [userError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetUserId = id || user?.id;
      if (!targetUserId) return;
      
      const payload: Record<string, unknown> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        personalEmail: formData.personalEmail?.trim() || undefined,
        businessEmail: formData.businessEmail?.trim() || undefined,
        jobTitle: formData.jobTitle?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        adharNumber: formData.adharNumber?.trim() || undefined,
        panNumber: formData.panNumber?.trim() || undefined,
        mobileNumber: formData.mobileNumber?.trim() || undefined,
        emergencyContact: formData.emergencyContact?.trim() || undefined,
        dateOfBirth: formData.dateOfBirth?.trim() || undefined,
        hiredDate: formData.hiredDate?.trim() || undefined,
        terminationDate: formData.terminationDate?.trim() || undefined,
        departmentId: formData.departmentId?.trim() || null,
        managerId: formData.managerId?.trim() || null,
        status: formData.status || 'active',
        countryOfCompany: formData.countryOfCompany?.trim() || null,
        market: formData.market?.trim() || null,
      };

      if (formData.annualPackage) {
        payload.annualPackage = parseFloat(formData.annualPackage);
      }
      if (formData.monthlySalary) {
        payload.monthlySalary = parseFloat(formData.monthlySalary);
      }

      updateProfileMutation.mutate({ userId: targetUserId, data: payload });
    } catch (err) {
      console.error('Error in handleSubmit:', err);
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
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value || ''
      };
      if (name === 'status' && (value === 'inactive' || value === 'suspended') && !prev.terminationDate) {
        updated.terminationDate = new Date().toISOString().split('T')[0];
      }
      return updated;
    });
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="personalEmail">Personal Email *</Label>
                  <PreviousDetailPill fieldKey="personalEmail" auditLogs={auditLogs} />
                </div>
                <Input
                  id="personalEmail"
                  name="personalEmail"
                  type="email"
                  value={formData.personalEmail}
                  onChange={handleChange}
                  disabled={!canEditPersonalInfo && !canEditSubordinatesInfo && !canEditAllUserInfo}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="address">Address *</Label>
                  <PreviousDetailPill fieldKey="address" auditLogs={auditLogs} />
                </div>
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="mobileNumber">Mobile Number *</Label>
                  <PreviousDetailPill fieldKey="mobileNumber" auditLogs={auditLogs} />
                </div>
                <Input
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  disabled={!canEditPersonalInfo && !canEditSubordinatesInfo && !canEditAllUserInfo}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="emergencyContact">Emergency Phone Number *</Label>
                  <PreviousDetailPill fieldKey="emergencyContact" auditLogs={auditLogs} />
                </div>
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
                  <div className="flex items-center gap-2">
                    <Label htmlFor="status">User Status</Label>
                    <PreviousDetailPill fieldKey="status" auditLogs={auditLogs} />
                  </div>
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
              {canEditStatus && (formData.status === 'inactive' || formData.status === 'suspended') && (
                <div className="space-y-2">
                  <Label htmlFor="terminationDate" className="text-destructive font-medium">Termination Date *</Label>
                  <Input
                    type="date"
                    id="terminationDate"
                    name="terminationDate"
                    value={formData.terminationDate || ''}
                    onChange={handleChange}
                    className="w-full border-destructive/50 focus-visible:ring-destructive"
                  />
                  <p className="text-xs text-muted-foreground">The official termination/deactivation date.</p>
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="jobTitle">Job Title / Designation</Label>
                  <PreviousDetailPill fieldKey="jobTitle" auditLogs={auditLogs} />
                </div>
                <Input
                  type="text"
                  id="jobTitle"
                  name="jobTitle"
                  placeholder="e.g. Senior Software Engineer"
                  value={formData.jobTitle || ''}
                  onChange={handleChange}
                  disabled={!canEditEmployeeInfo && !canEditSubordinatesEmployeeInfo && !canEditAllUserEmployeeInfo}
                  className="w-full"
                />
              </div>
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="countryOfCompany">Country of Company</Label>
                  <PreviousDetailPill fieldKey="countryOfCompany" auditLogs={auditLogs} />
                </div>
                <CountrySelect
                  value={formData.countryOfCompany}
                  onChange={(val) => setFormData((prev) => ({ ...prev, countryOfCompany: val }))}
                  disabled={!canEditProfile}
                  placeholder="Select company country"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="market">Market / Industry</Label>
                  <PreviousDetailPill fieldKey="market" auditLogs={auditLogs} />
                </div>
                <MarketSelect
                  value={formData.market}
                  onChange={(val) => setFormData((prev) => ({ ...prev, market: val }))}
                  disabled={!canEditProfile}
                  placeholder="Select market or industry"
                  customPlaceholder="Specify custom market..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="departmentId">Department *</Label>
                  <PreviousDetailPill fieldKey="departmentId" auditLogs={auditLogs} />
                </div>
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="managerId">Manager *</Label>
                  <PreviousDetailPill fieldKey="managerId" auditLogs={auditLogs} />
                </div>
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="annualPackage">Annual Package *</Label>
                  <PreviousDetailPill fieldKey="annualPackage" auditLogs={auditLogs} />
                </div>
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="monthlySalary">Monthly Salary *</Label>
                  <PreviousDetailPill fieldKey="monthlySalary" auditLogs={auditLogs} />
                </div>
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

        {/* Revision History & Change Audit (Option 1) */}
        <EmployeeRevisionHistoryCard
          userId={userId}
          isOwnProfile={isOwnProfile}
          className="mt-8"
        />
      </CardContent>
    </Card>
  );
};

export default ProfileEdit;