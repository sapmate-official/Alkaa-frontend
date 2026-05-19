import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Lazy load payroll components - using existing components
const DashboardOfPayroll = lazy(() => import('./DashboardOfPayroll'));
const MainCompOfViewPayslipOfAllSubordinatesPayroll = lazy(() => import('./ManagerLevel/ViewPayslipOfAllSubordinatesPayroll/MainCompOfViewPayslipOfAllSubordinatesPayroll'));
const MainGenerateSubordinateSalaryPage = lazy(() => import('./ManagerLevel/GenerateSalary/MainGenerateSubordinateSalaryPage'));
const MainSubordinateSalaryTransactionPage = lazy(() => import('./ManagerLevel/Salarytransaction/MainSubordinateSalaryTransactionPage'));
const MainGenerateUsersSalaryPage = lazy(() => import('./AdminLevel/GenerateSalary/MainGenerateUserSalaryPage'));
const MainCompOfViewPayslipOfAllUsersPayroll = lazy(() => import('./AdminLevel/ViewPayslipOfAllUsersPayroll/MainCompOfViewPayslipOfAllUsersPayroll'));
const MainAllUsersSalaryTransactionPage = lazy(() => import('./AdminLevel/Salarytransaction/MainSalaryUsersTransactionPage'));
const CustomPayslipGenerator = lazy(() => import('./AdminLevel/CustomPayslipGenerator/CustomPayslipGenerator'));

/**
 * PayrollModule - Restructured to align with RouteDict for better maintainability
 * 
 * Route Structure (from RouteDict.Payroll):
 * - /p/payroll/dashboard - Main dashboard
 * - /p/payroll/dashboard-users - Dashboard for users view
 * - /p/payroll/generate - Generate payroll
 * - /p/payroll/salary-transaction - Salary transactions
 * - /p/payroll/view-all-employees - View all employees payroll
 * - /p/payroll/view-employee/:id - View specific employee payroll
 * - /p/payroll/view-own - View own payroll
 * - /p/payroll/new-version - New version features
 * - /p/payroll/admin-transaction - Admin transactions
 * - /p/payroll/admin-payslip - Admin payslip management
 * - /p/payroll/subordinate-transaction - Manager level transactions
 */
const PayrollModule = () => {
  return (
    <Routes>
      {/* Base payroll route - redirect to dashboard as per RouteDict structure */}
      <Route index element={<Navigate to="dashboard" replace />} />
      
      {/* Main Dashboard Routes - Aligned with RouteDict.Payroll.Dashboard */}
      <Route path="dashboard" element={<DashboardOfPayroll />} />
      <Route path="dashboard-users" element={<DashboardOfPayroll />} /> {/* Reusing dashboard for now */}
      
      {/* Generate Payroll - Aligned with RouteDict.Payroll.Generate */}
      <Route path="generate" element={<MainGenerateUsersSalaryPage />} />
      
      {/* Salary Transaction - Aligned with RouteDict.Payroll.SalaryTransaction */}
      <Route path="salary-transaction" element={<MainAllUsersSalaryTransactionPage />} />
      
      {/* View Routes - Aligned with RouteDict.Payroll view routes */}
      <Route path="view-all-employees" element={<MainCompOfViewPayslipOfAllUsersPayroll />} />
      <Route path="view-employee/:id" element={<MainCompOfViewPayslipOfAllUsersPayroll />} /> {/* Parameterized route */}
      <Route path="view-own" element={<MainCompOfViewPayslipOfAllUsersPayroll />} />
      
      {/* New Version - Aligned with RouteDict.Payroll.NewVersion */}
      <Route path="new-version" element={<DashboardOfPayroll />} /> {/* Placeholder for new features */}
      
      {/* Admin Level Routes - Aligned with RouteDict.Payroll.Admin */}
      <Route path="admin-transaction" element={<MainAllUsersSalaryTransactionPage />} />
      <Route path="admin-payslip" element={<MainCompOfViewPayslipOfAllUsersPayroll />} />
      <Route path="custom-payslip" element={<CustomPayslipGenerator />} />
      
      {/* Manager Level Routes - Aligned with RouteDict.Payroll.Manager */}
      <Route path="subordinate-transaction" element={<MainSubordinateSalaryTransactionPage />} />
      
      {/* Legacy Routes - Maintaining backward compatibility */}
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
