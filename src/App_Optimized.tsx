import { useEffect, useState, lazy, Suspense } from 'react'
import './App.css'
import { Route, Routes, Navigate, BrowserRouter, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext';
import Loader from './components/Loader';
import axios from 'axios';
import { APIDictionary } from './api/v2/APIdict';
import { useAtom } from 'jotai';
import { permissionListAtom } from './store/atom';
import PermissionRouteBasedOnKey from './components/RouteSecurityWrapper/PermissionBasedOnKey';
import { Toaster } from './components/ui/toaster';

// OPTIMIZED LAZY LOADING STRATEGY - GROUPED BY MODULES
// Critical/Essential components (load immediately)
import Home from './page/private/Home.tsx';
import { MainLayout } from './page/private/layout/MainLayout';

// Public pages
const LandingPage = lazy(() => import('./page/public/LandingPage'));
const SetPassword = lazy(() => import('./page/public/SetPassword'));
const SignIn = lazy(() => import('./page/public/auth/SignIn'));

// Core modules - group related components
const ProfileModule = lazy(() => import('./page/private/system/Profile/ProfileModule'));
const AttendanceModule = lazy(() => import('./page/private/system/AttendanceManagementSystem/AttendanceModule'));
const DepartmentModule = lazy(() => import('./page/private/system/DepartmentManagementSystem'));
const EmployeeModule = lazy(() => import('./page/private/system/EmployeeManagementSystem/EmployeeModule'));
const PayrollModule = lazy(() => import('./page/private/system/PayrollManagementSystem/PayrollModule'));
const BillingModule = lazy(() => import('./page/private/system/BillingManagementSystem/BillingModule'));
const LeaveModule = lazy(() => import('./page/private/system/LeaveManagementSystem/LeaveModule'));

// Admin modules (less frequently used)
const OrganizationModule = lazy(() => import('./page/private/system/OrganizationManagementSystem/OrganizationModule'));
const SystemModule = lazy(() => import('./page/private/system/SystemManagement/SystemModule'));

// Individual components that don't fit into modules
const Logout = lazy(() => import('./page/private/Logout'));

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
          
          {/* Protected Routes - Wrapped in AuthProvider */}
          <Route
            path="/p/*"
            element={
              <AuthProvider>
                <MainLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <ProtectedRoute />
                  </Suspense>
                </MainLayout>
              </AuthProvider>
            }
          />
        </Routes>
      </Suspense>
      <Toaster />
    </BrowserRouter>
  )
}

const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [, setPermissionList] = useAtom(permissionListAtom);
  const location = useLocation();
  const [previousPath, setPreviousPath] = useState<string | null>(null);

  const fetchUserDetails = async () => {
    try {
      if (!user?.id) return;
      setIsUserLoading(true);
      const response = await axios.get(APIDictionary.userProfile(user?.id), { withCredentials: true });
      const data = response.data;

      setUserDetails(data);
      setPermissionList(data?.user?.roles[0]?.role?.permissions?.map((permission: any) => permission.permission));
    } catch (error) {
      console.error("Error fetching user details", error);
    } finally {
      setIsUserLoading(false);
    }
  };

  useEffect(() => {
    if (user && !isLoading) {
      fetchUserDetails();
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (previousPath?.includes('/role') && !location.pathname.includes('/role')) {
      fetchUserDetails();
    }
    setPreviousPath(location.pathname);
  }, [location.pathname]);

  if (isLoading || isUserLoading) {
    return <Loader />;
  }

  if (!user && !isLoading) {
    return <Navigate to="/auth/signin" replace />;
  }

  if (userDetails?.superAdmin) {
    return <SuperAdminRoute />;
  } else {
    return <ClientRoute />;
  }
}

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

      <Route path="/new-payroll/*" element={
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
          <OrganizationModule />
        </PermissionRouteBasedOnKey>
      } />

      <Route path="/system/*" element={<SystemModule />} />

      <Route path="/logout" element={<Logout />} />
    </Routes>
  )
}

const SuperAdminRoute = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/organization/*" element={<OrganizationModule />} />
      <Route path="/system/*" element={<SystemModule />} />
      <Route path="/logout" element={<Logout />} />
    </Routes>
  )
}

export default App
