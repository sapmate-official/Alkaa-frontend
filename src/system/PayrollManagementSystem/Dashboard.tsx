import  { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { APIDictionary } from '@/api/APIdict';
import { useAuth } from '@/services/AuthContext';
import { SalaryRecord } from '@/interface/general';
import { useNavigate } from 'react-router-dom';

const PayrollDashboardForAllEmployee = () => {
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [, setStatistics] = useState(null);
  const [selectedMonth, ] = useState(new Date().getMonth() + 1);
  const [selectedYear, ] = useState(new Date().getFullYear());
  const {user}= useAuth()

  useEffect(() => {
    fetchSalaryRecords();
    fetchStatistics();
  }, [selectedMonth, selectedYear]);

  const fetchSalaryRecords = async () => {
    try {
      const response = await fetch(`${APIDictionary.payroll}/user/${user?.id}`);
      const data = await response.json();console.log(data.salaryRecords);
      
      setSalaryRecords(data.salaryRecords);
    } catch (error) {
      console.error('Error fetching salary records:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        `${APIDictionary.payroll}/statistics?month=${selectedMonth}&year=${selectedYear}`
      );
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };
  const navigate = useNavigate()
  const generateSalary = async () => {
    navigate("/p/payroll/generate")
  };

  const viewPayrollUsers = () => {
    navigate("/p/payroll/users");
  };

  // Add type safety for reduce operations
  const sumObjectValues = (obj: Record<string, number> | number) => 
    typeof obj === 'number' ? obj : Object.values(obj).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="p-6 space-y-6 w-full h-full overflow-y-scroll">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Payroll Service</h1>
        <div className="space-x-4">
          <Button 
            onClick={viewPayrollUsers}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            View Users
          </Button>
          <Button 
            onClick={generateSalary}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Generate Salary
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{salaryRecords[0]?.basicSalary.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{salaryRecords[0]?.netSalary.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{salaryRecords[0]?.tax.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salary Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <BarChart
              width={800}
              height={250}
              data={salaryRecords}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="basicSalary" fill="#8884d8" name="Basic Salary" />
              <Bar dataKey="netSalary" fill="#82ca9d" name="Net Salary" />
            </BarChart>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Salary Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Month</th>
                  <th className="p-2 text-left">Basic Salary</th>
                  <th className="p-2 text-left">Allowances</th>
                  <th className="p-2 text-left">Deductions</th>
                  <th className="p-2 text-left">Net Salary</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {salaryRecords.map((record) => (
                  <tr key={record.id} className="border-b">
                    <td className="p-2">
                      {new Date(record.year, record.month - 1).toLocaleString('default', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-2">₹{record.basicSalary.toLocaleString()}</td>
                    <td className="p-2">
                      ₹{sumObjectValues(record.allowances).toLocaleString()}
                    </td>
                    <td className="p-2">
                      ₹{sumObjectValues(record.deductions).toLocaleString()}
                    </td>
                    <td className="p-2">₹{record.netSalary.toLocaleString()}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          record.status === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollDashboardForAllEmployee;