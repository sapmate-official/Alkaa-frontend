import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load payroll components
const DashboardOfPayroll = lazy(() => import('./New_version/DashboardOfPayroll'));
const MainCompOfViewPayslipOfAllSubordinatesPayroll = lazy(() => import('./New_version/ManagerLevel/ViewPayslipOfAllSubordinatesPayroll/MainCompOfViewPayslipOfAllSubordinatesPayroll'));
const MainGenerateSubordinateSalaryPage = lazy(() => import('./New_version/ManagerLevel/GenerateSalary/MainGenerateSubordinateSalaryPage'));
const MainSubordinateSalaryTransactionPage = lazy(() => import('./New_version/ManagerLevel/Salarytransaction/MainSubordinateSalaryTransactionPage'));
const MainGenerateUsersSalaryPage = lazy(() => import('./New_version/AdminLevel/GenerateSalary/MainGenerateUserSalaryPage'));
const MainCompOfViewPayslipOfAllUsersPayroll = lazy(() => import('./New_version/AdminLevel/ViewPayslipOfAllUsersPayroll/MainCompOfViewPayslipOfAllUsersPayroll'));
const MainAllUsersSalaryTransactionPage = lazy(() => import('./New_version/AdminLevel/Salarytransaction/MainSalaryUsersTransactionPage'));

const PayrollModule = () => {
  return (
    <Routes>
      <Route index element={<DashboardOfPayroll />} />
      <Route path="subordinate/payslip" element={<MainCompOfViewPayslipOfAllSubordinatesPayroll />} />
      <Route path="subordinate/generate" element={<MainGenerateSubordinateSalaryPage />} />
      <Route path="subordinate/transaction" element={<MainSubordinateSalaryTransactionPage />} />
      <Route path="admin/payslip" element={<MainCompOfViewPayslipOfAllUsersPayroll />} />
      <Route path="admin/generate" element={<MainGenerateUsersSalaryPage />} />
      <Route path="admin/transaction" element={<MainAllUsersSalaryTransactionPage />} />
    </Routes>
  );
};

export default PayrollModule;
