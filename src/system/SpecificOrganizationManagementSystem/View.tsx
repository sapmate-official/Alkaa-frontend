import { APIDictionary } from '@/api/APIdict';
import { useAuth } from '@/services/AuthContext'
import axios from 'axios';
import  { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge"
import { Table, TableBody,  TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from '@/components/ui/button';

interface OrganizationType {
  id: string;
  name: string;
  industry: string;
  subscriptionPlan: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  isActive: boolean;
  users: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string | null;
    status: string;
  }[];
}

const SpecificOrganizationView = () => {
  const { user } = useAuth()
  const [organization, setOrganization] = useState<OrganizationType | null>(null);
  const navigate = useNavigate();

  const fetchOrganisation = async () => {
    try {
      const response = await axios.get(`${APIDictionary.Organization}/${user?.organization.id}`);
      setOrganization(response.data);
    } catch (error) {
      console.error('Failed to fetch organisation:', error);
    }
  }

  useEffect(() => {
    if (user) {
      fetchOrganisation()
    }
  }, [user])

  const handleUserClick = (userId: string) => {
    navigate(`/p/profile/${userId}`);
  };

  if (!organization) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{organization.name}</CardTitle>
              <CardDescription>Organization Details</CardDescription>
            </div>
            <Badge variant={organization.isActive ? "default" : "destructive"}>
              {organization.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium">Industry</h3>
              <p className="text-sm text-muted-foreground">{organization.industry}</p>
            </div>
            <div>
              <h3 className="font-medium">Subscription</h3>
              <p className="text-sm text-muted-foreground">{organization.subscriptionPlan}</p>
            </div>
            <div>
              <h3 className="font-medium">Valid Period</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(organization.subscriptionStart).toLocaleDateString()} - 
                {new Date(organization.subscriptionEnd).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
      <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>Employee Directory</CardTitle>
        <CardDescription>
          Total Employees: {organization.users.length}
        </CardDescription>
      </div>
      <Button 
        onClick={() => navigate('/p/employee/create')} 
        className="bg-primary hover:bg-primary/90"
      >
        Hire Employee
      </Button>
    </div>
  </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organization.users.map((user) => (
                <TableRow 
                  key={user.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleUserClick(user.id)}
                >
                  <TableCell className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.firstName[0]}{user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span>{`${user.firstName} ${user.lastName}`}</span>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.employeeId || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? "success" : "destructive"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default SpecificOrganizationView