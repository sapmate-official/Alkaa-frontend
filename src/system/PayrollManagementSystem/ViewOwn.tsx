import { APIDictionary } from '@/api/APIdict'
import { useAuth } from '@/services/AuthContext'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import axios from 'axios'
import { useEffect, useState } from 'react'
import Loader from '@/components/Loader'
import { Button } from "@/components/ui/button"
import { useNavigate } from 'react-router-dom'

interface PayrollData {
  salaryRecords: Array<{
    month: number;
    year: number;
    basicSalary: number;
    allowances: Record<string, number>;
    deductions: Record<string, number>;
    netSalary: number;
    status: string;
    processedAt: string;
  }>;
  salaryParameter: {
    hraPercentage: number;
    daPercentage: number;
    taPercentage: number;
    pfPercentage: number;
    taxPercentage: number;
  };
  bankDetails: {
    accountHolder: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
}

const PayRollViewOwn = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [payrollData, setPayrollData] = useState<PayrollData | null>(null)

  const fetchData = async () => {
    try {
      if (!user?.id) return
      const response = await axios.get(APIDictionary.get_payroll(user?.id))
      setPayrollData(response.data)
    } catch (error) {
      console.error("Error fetching payroll data:", error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  if (!payrollData) return <Loader/>

  return (
    <div className="w-full h-full container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">My Payroll Information</h1>
        <Button 
          variant="outline"
          onClick={() => navigate('/p/payroll/all')}
        >
          View All Employees' Payroll
        </Button>
      </div>
      
      {payrollData.salaryRecords.map((record, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Salary for {new Date(record.processedAt).toLocaleString('default', { month: 'long' })} {record.year}
              </CardTitle>
              <Badge variant={record.status === 'PAID' ? 'success' : 'secondary'}>
                {record.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Earnings Table */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Earnings</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Basic Salary</TableCell>
                    <TableCell className="text-right">₹{record.basicSalary.toLocaleString()}</TableCell>
                  </TableRow>
                  {Object.entries(record.allowances).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="capitalize">{key}</TableCell>
                      <TableCell className="text-right">₹{value.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Deductions Table */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Deductions</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(record.deductions).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="capitalize">{key}</TableCell>
                      <TableCell className="text-right">₹{value.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <p className="text-xl font-bold">
                Net Salary: ₹{record.netSalary.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Bank Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Account Holder</TableCell>
                <TableCell>{payrollData.bankDetails.accountHolder}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Account Number</TableCell>
                <TableCell>{payrollData.bankDetails.accountNumber}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">IFSC Code</TableCell>
                <TableCell>{payrollData.bankDetails.ifscCode}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Bank Name</TableCell>
                <TableCell>{payrollData.bankDetails.bankName}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default PayRollViewOwn