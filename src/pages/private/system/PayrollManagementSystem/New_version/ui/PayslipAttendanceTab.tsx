import React from 'react';
import {  CardContent } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { PayrollStatistics } from '@/types/general';

interface PayslipAttendanceTabProps {
  payslipStatistics: PayrollStatistics | null;
}

const PayslipAttendanceTab: React.FC<PayslipAttendanceTabProps> = ({
  payslipStatistics
}) => {
  if (!payslipStatistics) return <TabsContent value="attendance"><CardContent>No data available</CardContent></TabsContent>;

  return (
    <TabsContent value="attendance">
      <CardContent>
        <div className="space-y-6">
          <AttendanceMetrics payslipStatistics={payslipStatistics} />
          <LeaveMetrics payslipStatistics={payslipStatistics} />
          <MonthlyOverview payslipStatistics={payslipStatistics} />
        </div>
      </CardContent>
    </TabsContent>
  );
};

// Attendance Metrics Sub-component
const AttendanceMetrics: React.FC<{ payslipStatistics: PayrollStatistics }> = ({ payslipStatistics }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div className="bg-muted p-4 rounded-md">
      <p className="text-sm text-muted-foreground">Working Days</p>
      <h3 className="text-2xl font-bold">
        {payslipStatistics.attendanceAnalysis.workingDays}
      </h3>
    </div>
    <div className="bg-muted p-4 rounded-md">
      <p className="text-sm text-muted-foreground">Present Days</p>
      <h3 className="text-2xl font-bold">
        {payslipStatistics.attendanceAnalysis.presentDays}
      </h3>
    </div>
    <div className="bg-muted p-4 rounded-md">
      <p className="text-sm text-muted-foreground">Absent Days</p>
      <h3 className="text-2xl font-bold">
        {payslipStatistics.attendanceAnalysis.absentDays}
      </h3>
    </div>
    <div className="bg-muted p-4 rounded-md">
      <p className="text-sm text-muted-foreground">Attendance</p>
      <h3 className="text-2xl font-bold">
        {payslipStatistics.attendanceAnalysis.attendancePercentage.toFixed(2)}%
      </h3>
    </div>
  </div>
);

// Leave Metrics Sub-component
const LeaveMetrics: React.FC<{ payslipStatistics: PayrollStatistics }> = ({ payslipStatistics }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="bg-muted p-4 rounded-md">
      <p className="text-sm text-muted-foreground">Half Days</p>
      <h3 className="text-2xl font-bold">
        {payslipStatistics.attendanceAnalysis.halfDays}
      </h3>
    </div>
    <div className="bg-muted p-4 rounded-md">
      <p className="text-sm text-muted-foreground">Paid Leave</p>
      <h3 className="text-2xl font-bold">
        {payslipStatistics.attendanceAnalysis.paidLeaveDays}
      </h3>
    </div>
    <div className="bg-muted p-4 rounded-md">
      <p className="text-sm text-muted-foreground">Unpaid Leave</p>
      <h3 className="text-2xl font-bold">
        {payslipStatistics.attendanceAnalysis.unpaidLeaveDays}
      </h3>
    </div>
  </div>
);

// Monthly Overview Sub-component
const MonthlyOverview: React.FC<{ payslipStatistics: PayrollStatistics }> = ({ payslipStatistics }) => (
  <div>
    <h3 className="font-semibold mb-2">Monthly Overview</h3>
    <div className="bg-muted p-4 rounded-md">
      <div className="flex justify-between mb-2">
        <span>Total Days in Month</span>
        <span>{payslipStatistics.attendanceAnalysis.totalDaysInMonth}</span>
      </div>
      <div className="flex justify-between mb-2">
        <span>Working Days</span>
        <span>{payslipStatistics.attendanceAnalysis.workingDays}</span>
      </div>
      <div className="flex justify-between mb-2">
        <span>Attendance</span>
        <span>{payslipStatistics.attendanceAnalysis.attendancePercentage.toFixed(2)}%</span>
      </div>
    </div>
  </div>
);

export default PayslipAttendanceTab;