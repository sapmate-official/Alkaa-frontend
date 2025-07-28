import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChevronLeft, AlertCircle, FileText, Download } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { APIV2Dictionary } from '@/api/v2/Api2Dicts';
import RouteDict from '@/routes/RouteDict';

interface BillData {
  id: string;
  organizationId: string;
  month: number;
  monthName: string;
  year: number;
  activeUserCount: number;
  pricePerUser: number;
  totalAmount: number;
  status: 'PAID' | 'UNPAID' | 'OVERDUE' | 'CANCELLED';
  billDate: string;
  dueDate: string;
  paidDate?: string;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const BillHistory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bills, setBills] = useState<BillData[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    year: 'all',
    sort: 'desc'
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchBills();
  }, [pagination.page, filters]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      params.append('sort', filters.sort);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.year !== 'all') params.append('year', filters.year);
      
      const response = await axios.get(`${APIV2Dictionary.billing.getHistory()}?${params.toString()}`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setBills(response.data.data);
        setPagination(response.data.pagination);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to load bills');
      }
    } catch (error: any) {
      console.error('Error fetching bills:', error);
      setError(error.response?.data?.message || 'Failed to load bills');
      
      toast({
        title: 'Error loading data',
        description: error.response?.data?.message || 'Failed to load bills',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filters change
  };

  const getBillStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case 'UNPAID':
        return <Badge variant="outline">Unpaid</Badge>;
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i);
    }
    return years;
  };

  if (loading && bills.length === 0) {
    return (
      <div className="space-y-6 w-full p-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate(RouteDict.Billing.Base)} className="mr-2">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-[200px]" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-[150px]" />
            <Skeleton className="h-5 w-[250px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(RouteDict.Billing.Base)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Billing Dashboard
        </Button>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate(RouteDict.Billing.Base)} className="mr-2">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Billing History</h1>
            <p className="text-gray-500">View and manage all your bills</p>
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Bills</CardTitle>
          <CardDescription>
            All bills for your organization
          </CardDescription>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="w-full sm:w-1/3">
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-1/3">
              <Select
                value={filters.year}
                onValueChange={(value) => handleFilterChange('year', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {generateYearOptions().map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-1/3">
              <Select
                value={filters.sort}
                onValueChange={(value) => handleFilterChange('sort', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No Bills Found</h3>
              <p className="mt-1 text-gray-500">No billing records match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map(bill => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">
                        {bill.monthName} {bill.year}
                      </TableCell>
                      <TableCell>{bill.activeUserCount}</TableCell>
                      <TableCell>₹{bill.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{getBillStatusBadge(bill.status)}</TableCell>
                      <TableCell>{formatDate(bill.dueDate)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(RouteDict.Billing.Details(bill.id))}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(APIV2Dictionary.billing.getInvoice(bill.id), '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination */}
          {bills.length > 0 && pagination.pages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                      className={pagination.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter(pageNumber => {
                      // Show first page, current page, last page, and pages around current
                      return (
                        pageNumber === 1 ||
                        pageNumber === pagination.pages ||
                        Math.abs(pageNumber - pagination.page) <= 1
                      );
                    })
                    .map((pageNumber, index, array) => {
                      // If there's a gap in the sequence, show ellipsis
                      if (index > 0 && pageNumber > array[index - 1] + 1) {
                        return (
                          <PaginationItem key={`ellipsis-${pageNumber}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            isActive={pagination.page === pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(pagination.pages, pagination.page + 1))}
                      className={pagination.page >= pagination.pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillHistory;
