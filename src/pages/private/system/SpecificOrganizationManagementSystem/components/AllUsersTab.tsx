import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OrganizationType } from '../types';
import RouteDict from '@/routes/RouteDict';

interface AllUsersTabProps {
  organization: OrganizationType | null;
  canViewDetailedInfo: boolean;
  onUserClick: (userId: string) => void;
}

export const AllUsersTab = ({ 
  organization, 
  canViewDetailedInfo, 
  onUserClick 
}: AllUsersTabProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Employee Directory
            </CardTitle>
            <CardDescription>
              Total Employees: {organization?.users?.length || 0}
            </CardDescription>
          </div>
          {canViewDetailedInfo && (
            <Button
              onClick={() => navigate(RouteDict.Employee.Create)}
              className="bg-primary hover:bg-primary/90"
            >
              Hire Employee
            </Button>
          )}
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
            {organization?.users?.map((user) => (
              <TableRow
                key={user?.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onUserClick(user?.id)}
              >
                <TableCell className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span>{`${user?.firstName || ''} ${user?.lastName || ''}`}</span>
                </TableCell>
                <TableCell>{user?.email}</TableCell>
                <TableCell>{user?.employeeId || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={user?.status === 'active' ? "success" : "destructive"}>
                    {user?.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
