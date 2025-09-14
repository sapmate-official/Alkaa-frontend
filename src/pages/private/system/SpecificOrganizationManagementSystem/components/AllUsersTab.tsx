import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink
} from '@/components/ui/pagination';
import { Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
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

  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage] = useState(10);

  // Search and filter logic
  const filteredUsers = useMemo(() => {
    if (!organization?.users) return [];
    
    if (!searchTerm.trim()) return organization.users;

    const searchLower = searchTerm.toLowerCase();
    
    return organization.users.filter(user => {
      // Search in basic fields
      const firstName = user?.firstName?.toLowerCase() || '';
      const lastName = user?.lastName?.toLowerCase() || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const email = user?.email?.toLowerCase() || '';
      const employeeId = user?.employeeId?.toLowerCase() || '';
      const id = user?.id?.toLowerCase() || '';
      
      // Search in basic fields
      if (
        firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        employeeId.includes(searchLower) ||
        id.includes(searchLower)
      ) {
        return true;
      }

      // Search in additional fields (now properly typed)
      const adharNumber = user?.adharNumber?.toLowerCase() || '';
      const panNumber = user?.panNumber?.toLowerCase() || '';
      const mobileNumber = user?.mobileNumber?.toLowerCase() || '';
      
      if (
        adharNumber.includes(searchLower) ||
        panNumber.includes(searchLower) ||
        mobileNumber.includes(searchLower)
      ) {
        return true;
      }

      return false;
    });
  }, [organization?.users, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

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
              Total Employees: {organization?.users?.length || 0} | Filtered: {filteredUsers.length}
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
        
        {/* Search Bar */}
        <div className="flex items-center space-x-2 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, email, employee ID, mobile, Aadhaar, PAN, or ID..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchTerm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSearchChange('')}
            >
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {searchTerm ? 'No matching employees found' : 'No employees found'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm 
                ? 'Try adjusting your search terms or clear the search to see all employees.' 
                : 'Start by hiring your first employee.'}
            </p>
          </div>
        ) : (
          <>
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
                {paginatedUsers.map((user) => (
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} employees
                </div>
                
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="gap-1 pl-2.5"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                    </PaginationItem>
                    
                    {getPageNumbers().map((pageNumber) => (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNumber)}
                          isActive={currentPage === pageNumber}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="gap-1 pr-2.5"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
