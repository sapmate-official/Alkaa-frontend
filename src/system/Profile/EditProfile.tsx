import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { APIDictionary } from '../../api/v2/APIdict';
import axios from 'axios';
import { useAuth } from '@/services/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface FormDataType {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  adharNumber: string;
  panNumber: string;
  mobileNumber: string;
  dateOfBirth: string;
  hiredDate: string;
  companyName: string;
  departmentId: string;
  annualPackage: string;
  monthlySalary: string;
  orgId: string;
}

const ProfileEdit = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormDataType>({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    adharNumber: '',
    panNumber: '',
    mobileNumber: '',
    dateOfBirth: '',
    hiredDate: '',
    companyName: '',
    departmentId: '',
    annualPackage: '',
    monthlySalary: '',
    orgId: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = id || user?.id;
        const response = await axios.get(APIDictionary.userProfile(userId || ''), {
          withCredentials: true
        });
        const userData = response.data?.user;
        console.log('User data:', userData);

        setFormData({
          firstName: userData?.firstName || '',
          lastName: userData?.lastName || '',
          email: userData?.email || '',
          address: userData?.address || '',
          adharNumber: userData?.adharNumber || '',
          panNumber: userData?.panNumber || '',
          mobileNumber: userData?.mobileNumber || '',
          dateOfBirth: userData?.dateOfBirth?.split('T')[0] || '',
          hiredDate: userData?.hiredDate?.split('T')[0] || '',
          companyName: userData?.companyName || '',
          departmentId: userData?.departmentId || '',
          annualPackage: userData?.annualPackage?.toString() || '',
          monthlySalary: userData?.monthlySalary?.toString() || '',
          orgId: userData?.orgId || '',
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchData();
  }, [id, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = id || user?.id;
      await axios.patch(APIDictionary.userProfile(userId || ''), formData, {
        withCredentials: true,
      });
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || ''
    }));
  };

  const handleSelectChange = (name: keyof FormDataType, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value || ''
    }));
  };
  return (
    <Card className=" mx-auto h-full w-full overflow-y-scroll">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Button>
          <CardTitle>Edit Profile</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className='flex flex-row'>
                  <div>

                    <Label htmlFor="firstName">First Name *</Label>
                    <Input

                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div>

                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input

                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input

                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adharNumber">Aadhar Number *</Label>
                <Input
                  
                  id="adharNumber"
                  name="adharNumber"
                  value={formData.adharNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panNumber">PAN Number *</Label>
                <Input
                  
                  id="panNumber"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number *</Label>
                <Input
                  
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
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
                />
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Employment & Compensation Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Employment & Compensation</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="hiredDate">Hiring Date *</Label>
                <Input
                  
                  type="date"
                  id="hiredDate"
                  name="hiredDate"
                  value={formData.hiredDate}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Select
                  value={formData.companyName || ''}
                  onValueChange={(value) => handleSelectChange('companyName', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company1">Company 1</SelectItem>
                    <SelectItem value="company2">Company 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="departmentId">Department *</Label>
                <Select
                  value={formData.departmentId || ''}
                  onValueChange={(value) => handleSelectChange('departmentId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dept1">IT</SelectItem>
                    <SelectItem value="dept2">HR</SelectItem>
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
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 w-full mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/p/profile/edit/bank')}
              className="flex-1"
            >
              Edit Bank Details
            </Button>
            <Button type="submit" className="flex-1">
              Update Profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileEdit;