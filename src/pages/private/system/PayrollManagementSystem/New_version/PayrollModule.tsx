import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Lazy load payroll components
const DashboardOfPayroll = lazy(() => import('./DashboardOfPayroll'));
const PayrollWorkflowDashboard = lazy(() => import('./PayrollWorkflowDashboard'));
const PayrollAdminDashboard = lazy(() => import('./AdminLevel/PayrollAdminDashboard'));
const PayrollPipelinePage = lazy(() => import('./AdminLevel/PayrollPipelinePage'));
const SalaryTemplateEditor = lazy(() => import('./AdminLevel/SalaryTemplateEditor'));
const EmployeeSelfServicePortal = lazy(() => import('./EmployeeLevel/EmployeeSelfServicePortal'));
const ManagerReviewDashboard = lazy(() => import('./ManagerLevel/ManagerReviewDashboard'));
const OrganizationPayslipHistory = lazy(() => import('./AdminLevel/EmployeePortal/OrganizationPayslipHistory'));
const OrganizationTaxSummaries = lazy(() => import('./AdminLevel/Reporting/OrganizationTaxSummaries'));

// Legacy components
const MainCompOfViewPayslipOfAllSubordinatesPayroll = lazy(() => import('./ManagerLevel/ViewPayslipOfAllSubordinatesPayroll/MainCompOfViewPayslipOfAllSubordinatesPayroll'));
const MainGenerateSubordinateSalaryPage = lazy(() => import('./ManagerLevel/GenerateSalary/MainGenerateSubordinateSalaryPage'));
const MainSubordinateSalaryTransactionPage = lazy(() => import('./ManagerLevel/Salarytransaction/MainSubordinateSalaryTransactionPage'));
const MainGenerateUsersSalaryPage = lazy(() => import('./AdminLevel/GenerateSalary/MainGenerateUserSalaryPage'));
const MainCompOfViewPayslipOfAllUsersPayroll = lazy(() => import('./AdminLevel/ViewPayslipOfAllUsersPayroll/MainCompOfViewPayslipOfAllUsersPayroll'));
const MainAllUsersSalaryTransactionPage = lazy(() => import('./AdminLevel/Salarytransaction/MainSalaryUsersTransactionPage'));

/**
 * PayrollModule - Comprehensive payroll management system with workflow-based approach
 * 
 * Route Structure:
 * - /p/payroll/dashboard - Legacy dashboard
 * - /p/payroll/workflow - New comprehensive workflow dashboard
 * - /p/payroll/admin - Admin-specific features
 * - /p/payroll/manager - Manager-specific features  
 * - /p/payroll/employee - Employee self-service
 * - Legacy routes maintained for backward compatibility
 */
const PayrollModule = () => {
  return (
    <Routes>
      {/* Base payroll route - redirect to new workflow dashboard */}
      <Route index element={<Navigate to="workflow" replace />} />
      
      {/* New Comprehensive Workflow Dashboard */}
      <Route path="workflow" element={<PayrollWorkflowDashboard />} />
      
      {/* Role-based Dashboards */}
      <Route path="admin" element={<PayrollAdminDashboard />} />
      <Route path="admin/pipeline" element={<PayrollPipelinePage />} />
      <Route path="admin/templates" element={<SalaryTemplateEditor />} />
      <Route path="admin/payslip-history" element={<OrganizationPayslipHistory />} />
      <Route path="admin/tax-summaries" element={<OrganizationTaxSummaries />} />
      <Route path="manager" element={<ManagerReviewDashboard />} />
      <Route path="employee" element={<EmployeeSelfServicePortal />} />
      
      {/* Legacy Dashboard Routes - Maintained for backward compatibility */}
      <Route path="dashboard" element={<DashboardOfPayroll />} />
      <Route path="dashboard-users" element={<DashboardOfPayroll />} />
      
      {/* Generate Payroll Routes */}
      <Route path="generate" element={<MainGenerateUsersSalaryPage />} />
      
      {/* Transaction Routes */}
      <Route path="salary-transaction" element={<MainAllUsersSalaryTransactionPage />} />
      
      {/* View Routes */}
      <Route path="view-all-employees" element={<MainCompOfViewPayslipOfAllUsersPayroll />} />
      <Route path="view-employee/:id" element={<MainCompOfViewPayslipOfAllUsersPayroll />} />
      <Route path="view-own" element={<MainCompOfViewPayslipOfAllUsersPayroll />} />
      
      {/* Admin Level Routes */}
      <Route path="admin-transaction" element={<MainAllUsersSalaryTransactionPage />} />
      <Route path="admin-payslip" element={<MainCompOfViewPayslipOfAllUsersPayroll />} />
      
      {/* Manager Level Routes */}
      <Route path="subordinate-transaction" element={<MainSubordinateSalaryTransactionPage />} />
      <Route path="subordinate/payslip" element={<MainCompOfViewPayslipOfAllSubordinatesPayroll />} />
      <Route path="subordinate/generate" element={<MainGenerateSubordinateSalaryPage />} />
      <Route path="subordinate/transaction" element={<MainSubordinateSalaryTransactionPage />} />
      
      {/* Additional Admin Routes */}
      <Route path="admin/payslip" element={<MainCompOfViewPayslipOfAllUsersPayroll />} />
      <Route path="admin/generate" element={<MainGenerateUsersSalaryPage />} />
      <Route path="admin/transaction" element={<MainAllUsersSalaryTransactionPage />} />
      
      {/* New Version Routes */}
      <Route path="new-version" element={<PayrollWorkflowDashboard />} />
    </Routes>
  );
};

export default PayrollModule;
