import  { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from '@/components/charts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Search, Users, Loader2, Trash } from 'lucide-react';
import { APIDictionary } from '@/api/v2/APIdict';
import { User } from '@/interface/salary';
import SalaryTransaction from './SalaryTransaction';
import { SalaryRecord } from '@/interface/general';
import { useAuth } from '@/services/AuthContext';

const PayrollDashboardUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const {user} = useAuth()

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserSalaryRecords(selectedUser.id);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const response = await fetch(`${APIDictionary.payroll}/users/active/${user?.orgId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setFetchingUsers(false);
    }
  };

  const fetchUserSalaryRecords = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${APIDictionary.payroll}/user/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch salary records');
      }
      const data = await response.json();
      setSalaryRecords(data.salaryRecords || []);
      
    } catch (error) {
      console.error('Error fetching salary records:', error);
      setSalaryRecords([]);
    } finally {
      setLoading(false);
    }
  };
  const DeleteSalaryRecord = ({ salaryRecordId }: { salaryRecordId: string }) => {
    const handleDelete = async () => {
      try {
        const response = await fetch(`${APIDictionary.payroll}/${salaryRecordId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to delete salary record');
        }
        setSalaryRecords((prevRecords) => prevRecords.filter(record => record.id !== salaryRecordId));
      } catch (error) {
        console.error('Error deleting salary record:', error);
      }
    };

    return (
      <Button variant="outline" onClick={handleDelete}>
        <Trash className="h-4 w-4" />
      </Button>
    );
  }
  
  const filteredUsers = users.filter(user => 
    `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user?.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  return (
    <div className="flex h-full w-full overflow-y-scroll">
      {/* Left Sidebar - User List */}
      <div className="w-1/4 border-r p-4 bg-background">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Employees</h2>
            <Users className="h-5 w-5 text-gray-500" />
          </div>
          
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <ScrollArea className="h-[calc(100vh-8rem)]">
            {fetchingUsers ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Loading employees...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <Button
                    key={user.id}
                    variant={selectedUser?.id === user.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedUser(user)}
                  >
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={`/api/placeholder/32/32`} alt={user?.firstName} />
                      <AvatarFallback>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="font-medium">{`${user?.firstName || ''} ${user?.lastName || ''}`}</div>
                      <div className="text-sm text-gray-500">{user?.employeeId}</div>
                    </div>
                  </Button>
                ))}
                {filteredUsers.length === 0 && !fetchingUsers && (
                  <div className="text-center py-4 text-gray-500">
                    No employees found
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Main Content - User Details and Salary Information */}
      <div className="flex-1 p-6 overflow-auto">
        {selectedUser ? (
          <div className="space-y-6">
            {/* User Header */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`/api/placeholder/64/64`} alt={selectedUser?.firstName} />
                <AvatarFallback className="text-lg">
                  {selectedUser?.firstName?.[0]}{selectedUser?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{`${selectedUser?.firstName || ''} ${selectedUser?.lastName || ''}`}</h1>
                <p className="text-gray-500">Employee ID: {selectedUser?.employeeId}</p>
              </div>
            </div>

            {/* Salary Statistics */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-3 text-lg text-gray-500">Loading salary data...</span>
              </div>
            ) : (
              <>
                {salaryRecords.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Monthly Salary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {formatCurrency(selectedUser?.monthlySalary || 0)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>YTD Earnings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {formatCurrency(
                            salaryRecords
                              .filter(record => record?.year === new Date().getFullYear())
                              .reduce((sum, record) => sum + (record?.netSalary || 0), 0)
                          )}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>YTD Tax</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {formatCurrency(
                            salaryRecords
                              .filter(record => record?.year === new Date().getFullYear())
                              .reduce((sum, record) => sum + (record?.tax || 0), 0)
                          )}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Salary Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Salary Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {salaryRecords.length > 0 ? (
                        <BarChart
                          width={800}
                          height={300}
                          data={salaryRecords}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="month" 
                            tickFormatter={(month) => {
                              return new Date(2024, month - 1).toLocaleString('default', { month: 'short' });
                            }}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="basicSalary" fill="#8884d8" name="Basic Salary" />
                          <Bar dataKey="netSalary" fill="#82ca9d" name="Net Salary" />
                        </BarChart>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-gray-500">No salary data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Salary Records Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Salary History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead>Basic Salary</TableHead>
                          <TableHead>Allowances</TableHead>
                          <TableHead>Deductions</TableHead>
                          <TableHead>Net Salary</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salaryRecords.length > 0 ? salaryRecords.map((record: SalaryRecord) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              {new Date(record?.year || 0, (record?.month || 1) - 1).toLocaleString('default', {
                                month: 'long',
                                year: 'numeric'
                              })}
                            </TableCell>
                            <TableCell>{formatCurrency(record?.basicSalary || 0)}</TableCell>
                            <TableCell>
                              {formatCurrency(
                                Object.values(record?.allowances || {}).reduce((a, b) => a + b, 0)
                              )}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(
                                Object.values(record?.deductions || {}).reduce((a, b) => a + b, 0)
                              )}
                            </TableCell>
                            <TableCell>{formatCurrency(record?.netSalary || 0)}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  record?.status === 'PAID'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {record?.status}
                              </span>
                            </TableCell>
                            <TableCell className='flex items-center space-x-2'>
                              <SalaryTransaction 
                                salaryRecord={record}
                                onTransactionComplete={() => fetchUserSalaryRecords(record.userId)}
                              />
                              <div className='flex-1 items-end'>
                                {
                                  record?.status !== 'PAID' && (
                                  <DeleteSalaryRecord 
                                  salaryRecordId={record.id}
                                  />
                                  )
                                }
                                </div>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                              No salary records found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <h2 className="text-xl font-medium">Select an employee</h2>
              <p>Choose an employee from the list to view their payroll details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollDashboardUsers;