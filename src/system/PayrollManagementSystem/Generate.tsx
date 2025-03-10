import  { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertCircle, Check, Loader } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { APIDictionary } from '@/api/v2/APIdict';
import axios from 'axios';
import { User } from '@/interface/general';
import { useAuth } from '@/services/AuthContext';

const SalaryGenerator = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const {user}=useAuth()

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${APIDictionary.payroll}/users/active/${user?.orgId}`, {
        withCredentials: true
      });
      setEmployees(response.data);
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to fetch employees'
      });
    }
  };

  const handleGenerateSalaries = async () => {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const results = await Promise.all(
        selectedEmployees?.map(async (userId) => {
          const response = await axios.post(`${APIDictionary.payroll}/generate`, 
            { userId, month, year },
            { withCredentials: true }
          );
          return response?.data;
        }) ?? []
      );

      setStatus({
        type: 'success',
        message: `Successfully generated salaries for ${results?.length} employees`
      });
      setSelectedEmployees([]);
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to generate salaries. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - 2 + i
  );

  return (
    <div className="p-6 w-full h-full overflow-y-scroll">
      <Card>
        <CardHeader>
          <CardTitle>Generate Salary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Period Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={month.toString()} onValueChange={(value) => setMonth(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((name, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Employee Selection */}
            <div className="space-y-2">
              <Label>Select Employees</Label>
              <div className="border rounded-md p-4 max-h-64 overflow-y-auto space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedEmployees?.length === employees?.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedEmployees(employees?.map(emp => emp?.id) ?? []);
                      } else {
                        setSelectedEmployees([]);
                      }
                    }}
                  />
                  <Label htmlFor="select-all">Select All</Label>
                </div>
                {employees?.map((employee:User) => (
                  <div key={employee?.id} className="ml-6 flex items-center space-x-2">
                    <Checkbox
                      id={`employee-${employee?.id}`}
                      checked={selectedEmployees?.includes(employee?.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEmployees([...selectedEmployees, employee?.id]);
                        } else {
                          setSelectedEmployees(selectedEmployees?.filter(id => id !== employee?.id) ?? []);
                        }
                      }}
                    />
                    <Label htmlFor={`employee-${employee?.id}`}>
                      {`${employee?.firstName} ${employee?.lastName} (${employee?.employeeId})`}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Messages */}
            {status?.message && (
              <Alert variant={status.type === 'error' ? 'destructive' : 'default'}>
                {status.type === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            )}

            {/* Generate Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleGenerateSalaries}
                disabled={loading || selectedEmployees.length === 0}
                variant="default"
              >
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Salaries'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalaryGenerator;