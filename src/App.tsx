import { useEffect, useState, lazy, Suspense } from 'react'
import './styles/App.css'
import { Route, Routes, Navigate, BrowserRouter, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './providers/AuthContext.tsx';
import Loader from './components/Loader';
import PermissionRouteBasedOnKey from './components/RouteSecurityWrapper/PermissionBasedOnKey';
import { Toaster } from './components/ui/toaster';
import RouteDict from './routes/RouteDict';

// OPTIMIZED LAZY LOADING STRATEGY - GROUPED BY MODULES
// Critical/Essential components (load immediately)
import Home from './pages/private/Home.tsx';
import { MainLayout } from './pages/private/layout/MainLayout';
import { TimezoneProvider } from './hooks/useTimezone.tsx';

// Public pages
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const SetPassword = lazy(() => import('./pages/public/SetPassword'));
const SignIn = lazy(() => import('./pages/public/auth/SignIn'));
const OnboardingForm = lazy(() => import('./components/onboarding/OnboardingForm'));

// Core modules - group related components
const ProfileModule = lazy(() => import('./pages/private/system/Profile/ProfileModule'));
const AttendanceModule = lazy(() => import('./pages/private/system/AttendanceManagementSystem/AttendanceModule'));
const DepartmentModule = lazy(() => import('./pages/private/system/DepartmentManagementSystem'));
const EmployeeModule = lazy(() => import('./pages/private/system/EmployeeManagementSystem/EmployeeModule'));
const PayrollModule = lazy(() => import('./pages/private/system/PayrollManagementSystem/New_version/PayrollModule.tsx'));
const BillingModule = lazy(() => import('./pages/private/system/BillingManagementSystem/BillingModule'));
const LeaveModule = lazy(() => import('./pages/private/system/LeaveManagementSystem/LeaveModule'));
const OnboardingModule = lazy(() => import('./pages/private/system/OnboardingManagementSystem/OnboardingModule'));
const TaskModule = lazy(() => import('./pages/private/system/TaskManagementSystem/index.tsx'));
const HolidayManagementSystem = lazy(() => import('./pages/private/system/HolidayManagementSystem/HolidayDashboard.tsx'));
const ModernRolePermissionPage = lazy(() => import('./pages/private/system/RoleManagementSystem/ModernRolePermissionPage.tsx'));


// Admin modules (less frequently used)
const ClientOrganizationModule = lazy(() => import('./pages/private/system/SpecificOrganizationManagementSystem/ClientOrganizationModule.tsx'));
const AdminOrganizationModule = lazy(() => import('./pages/private/system/OrganizationManagementSystem/OrganizationModule.tsx'));
const SystemModule = lazy(() => import('./pages/private/system/SystemManagement/SystemModule'));

// Individual components that don't fit into modules
const Logout = lazy(() => import('./pages/private/Logout'));

import ErrorBoundary from './components/ErrorBoundary';

// Custom loading fallback
const LoadingFallback = () => <div className="flex items-center justify-center min-h-screen"><Loader /></div>;

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes - Outside AuthProvider */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/reset-password/:token" element={<SetPassword />} />
          <Route path="/auth/signin" element={<AuthProvider><SignIn /></AuthProvider>} />
          <Route path="/onboarding/:token" element={<OnboardingForm />} />
          <Route path="/onboarding" element={<OnboardingForm />} />
          
          {/* Protected Routes - Wrapped in AuthProvider with Auth Gate */}
          <Route
            path="/p/*"
            element={
              <AuthProvider>
                <ProtectedLayout />
              </AuthProvider>
            }
          />
        </Routes>
      </Suspense>
      <Toaster />
    </BrowserRouter>
  )
}

const ProtectedLayout: React.FC = () => {
  const { user, isLoading, reinitializeAuth } = useAuth();
  const location = useLocation();
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const isSuperAdmin = Boolean(user?.superAdmin || user?.isSuperAdmin);

  useEffect(() => {
    if (previousPath?.includes('/role') && !location.pathname.includes('/role')) {
      void reinitializeAuth();
    }
    setPreviousPath(location.pathname);
  }, [location.pathname, previousPath, reinitializeAuth]);

  // Auth Initialization Gate: Do NOT mount MainLayout, AppTopBar, or Sidebar until session is verified
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground gap-3">
        <Loader />
        <span className="text-xs font-mono text-muted-foreground animate-pulse tracking-wide">
          Verifying session...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={RouteDict.SignInPage} replace />;
  }

  // Shell and child queries mount ONLY after auth is confirmed valid
  return (
    <TimezoneProvider>
      <MainLayout>
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            {isSuperAdmin ? <SuperAdminRoute /> : <ClientRoute />}
          </Suspense>
        </ErrorBoundary>
      </MainLayout>
    </TimezoneProvider>
  );
};

const ClientRoute = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/profile/*" element={<ProfileModule />} />

      <Route path="/leave/*" element={
        <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['leave_type_create', 'read_leave_type', 'update_leave_types', 'delete_leave_type', 'leave_request', 'approve_leave', 'reject_leave', 'view_subordinates_leave', 'view_all_user_leave', 'view_leave_balance']}>
          <LeaveModule />
        </PermissionRouteBasedOnKey>
      } />

      <Route path="/attendance/*" element={
        <PermissionRouteBasedOnKey requiredPermissions={['mark_attendance', 'view_own_attendance', 'view_subordinates_attendance', 'view_all_user_attendance']}>
          <AttendanceModule />
        </PermissionRouteBasedOnKey>
      } />

      <Route path="/payroll/*" element={
        <PermissionRouteBasedOnKey requiredPermissions={['view_salary_slip_to_myself ']}>
          <PayrollModule />
        </PermissionRouteBasedOnKey>
      } />

      <Route path="/employee/*" element={
        <PermissionRouteBasedOnKey requiredPermissions={['create_user', 'Read User Details', 'Update User Details', 'Delete User']}>
          <EmployeeModule />
        </PermissionRouteBasedOnKey>
      } />

      <Route path="/department/*" element={
        <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['view_all_department_info', 'view_own_department_info', 'create_new_department', 'edit_department']}>
          <DepartmentModule />
        </PermissionRouteBasedOnKey>
      } />

      <Route path="/billing/*" element={<BillingModule />} />

      <Route path="/organization/*" element={
        <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['view_organization_basic_details', 'see_team_details', 'view_own_department_info', 'view_organization_detailed_info']}>
          <ClientOrganizationModule />
        </PermissionRouteBasedOnKey>
      } />
      <Route path="/onboarding/*" element={
        <PermissionRouteBasedOnKey requiredPermissions={['create_user']}>
          <OnboardingModule />
        </PermissionRouteBasedOnKey>
      } />
       <Route path="/role/" element={
        <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['manage_role', 'view_organization_basic_details', 'view_employee_management']}>
          <ModernRolePermissionPage />
        </PermissionRouteBasedOnKey>
      } />
      {/* <Route path="/role/modern" element={
        <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['manage_role', 'view_organization_basic_details', 'view_employee_management']}>
          <ModernRolePermissionPage />
        </PermissionRouteBasedOnKey>
      } /> */}
      <Route path="/holiday/" element={
        <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['holiday_view', 'holiday_manage', 'create_holiday', 'view_holiday', 'update_holiday', 'delete_holiday']}>
          <HolidayManagementSystem />
        </PermissionRouteBasedOnKey>
      } />

      <Route path="/system/*" element={<SystemModule />} />

      <Route path='/task/*' element={<TaskModule  />} />

      <Route path="/logout" element={<Logout />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const SuperAdminRoute = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/p/organization" replace />} />
      <Route path="/organization/*" element={<AdminOrganizationModule />} />
      <Route path="/permission/*" element={<SystemModule />} />
      <Route path="/system/*" element={<SystemModule />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
