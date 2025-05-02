import { useEffect, useState, lazy, Suspense } from 'react'
import './App.css'
import { Route, Routes, Navigate, BrowserRouter, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext';
import Loader from './components/Loader';
import axios from 'axios';
import { APIDictionary } from './api/v2/APIdict';
import { useAtom } from 'jotai';
import { permissionListAtom } from './store/atom';
import PermissionRoute from './components/RouteSecurityWrapper/PermissionRoute';
import PermissionRouteBasedOnKey from './components/RouteSecurityWrapper/PermissionBasedOnKey';
import { Toaster } from './components/ui/toaster';

// Lazy loaded components
// Public pages
const Home = lazy(() => import('./page/public/Home'));
const LandingPage = lazy(() => import('./page/public/LandingPage'));
const SetPassword = lazy(() => import('./page/public/SetPassword'));
const SignIn = lazy(() => import('./page/public/auth/SignIn'));

// Layout
const MainLayout = lazy(() => import('./layout/MainLayout').then(module => ({ default: module.MainLayout })));

// Private pages
const Logout = lazy(() => import('./page/private/Logout'));

// Profile System
const ProfileInfo = lazy(() => import('./system/Profile/ProfileInfo'));
const ProfileEdit = lazy(() => import('./system/Profile/EditProfile'));
const BankDetails = lazy(() => import('./system/Profile/BankDetails'));

// Organization Management
const OrganizationHome = lazy(() => import('./system/OrganizationManagementSystem/OrganizationHome'));
const OrganizationCreate = lazy(() => import('./system/OrganizationManagementSystem/OrganizationCreate'));
const SpecificOrganizationHome = lazy(() => import('./system/OrganizationManagementSystem/SpecificOrganizationHome'));
const SpecificOrganizationView = lazy(() => import('./system/SpecificOrganizationManagementSystem/View'));
const OrganizationSettings = lazy(() => import('./system/SpecificOrganizationManagementSystem/OrganizationSettings'));

// Permission Management
const PermissionCreate = lazy(() => import('./system/PermissionManagementSystem/PermissionCreate'));
const PermissionManagement = lazy(() => import('./system/PermissionManagementSystem/PermissionManagementSystem'));

// LeaveType Management
const LeaveTypeList = lazy(() => import('./system/LeaveTypeManagementSystem/List'));
const CreateLeaveType = lazy(() => import('./system/LeaveTypeManagementSystem/Create'));
const EditLeaveType = lazy(() => import('./system/LeaveTypeManagementSystem/Edit'));

// LeaveRequest Management
const LeaveRequestCreate = lazy(() => import('./system/LeaveRequestManagementSystem/Create'));
const LeaveRequestList = lazy(() => import('./system/LeaveRequestManagementSystem/list'));
const EditLeaveRequest = lazy(() => import('./system/LeaveRequestManagementSystem/Edit'));
const LeaveRequestApprove = lazy(() => import('./system/LeaveRequestManagementSystem/approve'));
const ViewLeaveBalance = lazy(() => import('./system/LeaveBalanceManagementSystem/view'));

// Attendance Management
const AttendancePanel = lazy(() => import('./system/AttendanceManagementSystem/panel'));
const AttendanceHistory = lazy(() => import('./system/AttendanceManagementSystem/history'));
const AttendanceVerificationComponent = lazy(() => import('./system/AttendanceManagementSystem/verification'));
const AttendanceLivePanel = lazy(() => import('./system/AttendanceManagementSystem/livePanel'));
const PastNotCheckedDays = lazy(() => import('./system/AttendanceManagementSystem/pastdays'));

// Notification Management
const ListOfNotification = lazy(() => import('./system/NotificationManagementSystem/ListOfNotification'));
const ListOfNotificationTemplate = lazy(() => import('./system/NotificationManagementSystem/ListOfNotificationTemplate'));
const NotificationTemplateCreate = lazy(() => import('./system/NotificationManagementSystem/NotificationTemplateCreate'));

// Employee Management
const CreateEmployeeNew = lazy(() => import('./system/EmployeeManagementSystem/CreateEmployeeNew'));
const EmployeeManagement = lazy(() => import('./system/EmployeeManagementSystem/EmployeeManagement'));

// Department Management
const ListOfDepartment = lazy(() => import('./system/DepartmentManagementSystem/List'));
const CreateDepartment = lazy(() => import('./system/DepartmentManagementSystem/Create'));
const SpecificDepartmentView = lazy(() => import('./system/DepartmentManagementSystem/View'));
const SpecificDepartmentEdit = lazy(() => import('./system/DepartmentManagementSystem/Edit'));

// Role Management
const RolesPermissionsManagement = lazy(() => import('./system/RoleManagementSystem/RoleManagementDashboard'));

// Holiday Management
const HolidayManagementSystem = lazy(() => import('./system/HolidayManagementSystem/HolidayDashboard'));

// Payroll Management
const DashboardOfPayroll = lazy(() => import('./system/PayrollManagementSystem/New_version/DashboardOfPayroll'));
const MainCompOfViewPayslipOfAllSubordinatesPayroll = lazy(() => import('./system/PayrollManagementSystem/New_version/ManagerLevel/ViewPayslipOfAllSubordinatesPayroll/MainCompOfViewPayslipOfAllSubordinatesPayroll'));
const MainGenerateSubordinateSalaryPage = lazy(() => import('./system/PayrollManagementSystem/New_version/ManagerLevel/GenerateSalary/MainGenerateSubordinateSalaryPage'));
const MainSubordinateSalaryTransactionPage = lazy(() => import('./system/PayrollManagementSystem/New_version/ManagerLevel/Salarytransaction/MainSubordinateSalaryTransactionPage'));
const MainGenerateUsersSalaryPage = lazy(() => import('./system/PayrollManagementSystem/New_version/AdminLevel/GenerateSalary/MainGenerateUserSalaryPage'));
const MainCompOfViewPayslipOfAllUsersPayroll = lazy(() => import('./system/PayrollManagementSystem/New_version/AdminLevel/ViewPayslipOfAllUsersPayroll/MainCompOfViewPayslipOfAllUsersPayroll'));
const MainAllUsersSalaryTransactionPage = lazy(() => import('./system/PayrollManagementSystem/New_version/AdminLevel/Salarytransaction/MainSalaryUsersTransactionPage.tsx'));

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
                <Suspense fallback={<LoadingFallback />}>
                  <MainLayout>
                    <ProtectedRoute />
                  </MainLayout>
                </Suspense>
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
      <Route path="/profile/*" element={<ProfileRoutes />} />

      <Route path="/leavetype/*" element={
        <PermissionRouteBasedOnKey requiredPermissions={['leave_type_create', 'read_leave_type', 'update_leave_types', 'delete_leave_type']}>
          <LeaveTypeManagementSystem />
        </PermissionRouteBasedOnKey>
      } />

      <Route path="/leaverequest/*" element={
        <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['leave_request', 'approve_leave', 'reject_leave', 'view_subordinates_leave', 'view_all_user_leave']}>
          <LeaveRequestManagementSystem />
        </PermissionRouteBasedOnKey>
      } />

      <Route path="/leavebalance/*" element={
        <PermissionRouteBasedOnKey requiredPermissions={['view_leave_balance']}>
          <LeaveBalanceManagementSystem />
        </PermissionRouteBasedOnKey>
      } />

      <Route path="/attendance/*" element={
        <PermissionRouteBasedOnKey requiredPermissions={['mark_attendance', 'view_own_attendance', 'view_subordinates_attendance', 'view_all_user_attendance']}>
          <AttendanceManagementSystem />
        </PermissionRouteBasedOnKey>
      } />

      {/* <Route path="/payroll/*" element={
        <PermissionRoute requiredPermissions={['payroll.view_own', 'payroll.view_team', 'payroll.view_all', 'payroll.process']}>
          <PayrollManagementSystem />
        </PermissionRoute>
      } /> */}
      <Route path="/new-payroll/*" element={
        <PermissionRouteBasedOnKey requiredPermissions={['view_salary_slip_to_myself ']}>
          <NewPayrollManagementSystem />
        </PermissionRouteBasedOnKey>
      } />


      <Route path="/notification/*" element={
        <PermissionRoute requiredPermissions={['notification.create_template', 'notification.read_template', 'notification.update_template', 'notification.send']}>
          <NotificationManagementSystem />
        </PermissionRoute>
      } />

      <Route path="/organization/*" element={
        <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['view_organization_basic_details', 'see_team_details', 'view_own_department_info', 'view_organization_detailed_info']}>
          <SpecificOrganizationManagementSystem />
        </PermissionRouteBasedOnKey>

      } />

      <Route path="/employee/*" element={
        <PermissionRouteBasedOnKey requiredPermissions={['create_user', 'Read User Details', 'Update User Details', 'Delete User']}>
          <EmployeeManagementSystem />
        </PermissionRouteBasedOnKey>
      } />

      <Route path="/department/*" element={
        <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['view_all_department_info', 'view_own_department_info', 'create_new_department', 'edit_department']}>
          <DepartmentManagementSystem />
        </PermissionRouteBasedOnKey>
      } />

      <Route path="/role/*" element={
        <PermissionRouteBasedOnKey requiredPermissions={['manage_role']}>
          <RolePermissionManagementSystem />
        </PermissionRouteBasedOnKey>
      } />
      <Route path="/holiday/*" element={
        <PermissionRoute requireAll={false} requiredPermissions={['holiday.create', 'holiday.read', 'holiday.update', 'holiday.delete']}>
          <HolidayManagementSystem />
        </PermissionRoute>
      } />

      <Route path="/logout" element={<Logout />} />
    </Routes>
  )
}
const RolePermissionManagementSystem = () => {
  return (
    <Routes>
      <Route path='/' element={<RolesPermissionsManagement />} />
    </Routes>
  )
}
const DepartmentManagementSystem = () => {
  return (
    <Routes>
      {/* <Route path='/' element={
        <PermissionRoute requiredPermissions={['department.read']}>
          <SpecificDepartmentView />
        </PermissionRoute>
      } /> */}
      <Route path='/' element={
        <PermissionRouteBasedOnKey requiredPermissions={['view_all_department_info', 'view_own_department_info']}>
          <ListOfDepartment />
        </PermissionRouteBasedOnKey>
      } />
      <Route path='/create' element={
        <PermissionRoute requiredPermissions={['department.create']}>
          <CreateDepartment />
        </PermissionRoute>
      } />
      <Route path='/:id' element={
        <PermissionRoute requiredPermissions={['department.read']}>
          <SpecificDepartmentView />
        </PermissionRoute>
      } />
      <Route path='/:id/edit' element={
        <PermissionRouteBasedOnKey requiredPermissions={['edit_department']}>
          <SpecificDepartmentEdit />
        </PermissionRouteBasedOnKey>
      } />
    </Routes>
  )
}
const EmployeeManagementSystem = () => {
  return (
    <Routes>
      <Route path='/create' element={
        <PermissionRouteBasedOnKey requiredPermissions={['create_user']}>
          <CreateEmployeeNew />
        </PermissionRouteBasedOnKey>
      } />
      <Route path='/manage' element={
        <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['view_employee_management']}>
          <EmployeeManagement />
        </PermissionRouteBasedOnKey>
      } />
    </Routes>
  )
}
const SpecificOrganizationManagementSystem = () => {
  return (
    <Routes>
      <Route path='/' element={

        <SpecificOrganizationView />
      } />
      <Route path='/settings' element={<OrganizationSettings />} />
    </Routes>
  )
}
const NotificationManagementSystem = () => {
  return (
    <Routes>
      <Route path='/' element={
        <PermissionRoute requiredPermissions={['notification.read_template']}>
          <ListOfNotification />
        </PermissionRoute>
      } />
      <Route path='/template' element={
        <PermissionRoute requiredPermissions={['notification.read_template']}>
          <ListOfNotificationTemplate />
        </PermissionRoute>
      } />
      <Route path='/template/create' element={
        <PermissionRoute requiredPermissions={['notification.create_template']}>
          <NotificationTemplateCreate />
        </PermissionRoute>
      } />
    </Routes>
  )
}
const NewPayrollManagementSystem = () => {
  return (
    <Routes>
      <Route
        path='/'
        element={
          <PermissionRouteBasedOnKey requiredPermissions={['view_salary_slip_to_myself']}>
            <DashboardOfPayroll />
          </PermissionRouteBasedOnKey>
        }
      />
      <Route
        path='/subordinate/payslip'
        element={
          <PermissionRouteBasedOnKey requiredPermissions={["view_salary_slip_of_subordinates"]}>
            <MainCompOfViewPayslipOfAllSubordinatesPayroll />
          </PermissionRouteBasedOnKey>
        }
      />
      <Route
        path='/subordinate/generate'
        element={
          <PermissionRouteBasedOnKey requiredPermissions={["generate_salary_of_subordinates"]}>
            <MainGenerateSubordinateSalaryPage />
          </PermissionRouteBasedOnKey>
        }
      />
      <Route
        path='/subordinate/transaction'
        element={
          <PermissionRouteBasedOnKey requiredPermissions={["send_salary_to_subordinates"]}>
            <MainSubordinateSalaryTransactionPage />
          </PermissionRouteBasedOnKey>
        }
      />
      <Route
        path='/admin/transaction'
        element={
          <PermissionRouteBasedOnKey requiredPermissions={["send_salary_to_all"]}>
            <MainAllUsersSalaryTransactionPage />
          </PermissionRouteBasedOnKey>
        }
      />
      <Route
        path='/admin/payslip'
        element={
          <PermissionRouteBasedOnKey requiredPermissions={["view_salary_slip_of_all"]}>
            <MainCompOfViewPayslipOfAllUsersPayroll />
          </PermissionRouteBasedOnKey>
        }
      />
      <Route
        path='/admin/generate'
        element={
          <PermissionRouteBasedOnKey requiredPermissions={["generate_salary_of_all"]}>
            <MainGenerateUsersSalaryPage />
          </PermissionRouteBasedOnKey>
        }
      />
      <Route
        path='/admin/transaction'
        element={
          <PermissionRouteBasedOnKey requiredPermissions={["send_salary_to_all"]}>
            <MainGenerateUsersSalaryPage />
          </PermissionRouteBasedOnKey>
        }
      />

    </Routes>
  )
}

// const PayrollManagementSystem = () => {
//   return (
//     <Routes>
//       <Route path='/' element={
//         <PayRollViewOwn />
//       } />
//       <Route path='/all' element={
//         <PermissionRoute requiredPermissions={['payroll.view_all']}>
//           <PayrollDashboardForAllEmployee />
//         </PermissionRoute>
//       } />
//       <Route path='/generate' element={
//         <PermissionRoute requiredPermissions={['payroll.process']}>
//           <SalaryGenerator />
//         </PermissionRoute>
//       } />
//       <Route path='/users' element={
//         <PermissionRoute requiredPermissions={['payroll.view_all']}>
//           <PayrollDashboardUsers />
//         </PermissionRoute>
//       } />
//       <Route path="/p/payroll/own" element={<PayRollViewOwn />} />
//       <Route path="/p/payroll/all" element={<PayrollViewAllEmployees />} />
//       <Route path="/p/payroll/employee/:employeeId" element={<PayrollViewEmployeeDetails />} />
//     </Routes>
//   )
// }
const AttendanceManagementSystem = () => {
  return (
    <Routes>
      <Route path='/' element={
        <PermissionRouteBasedOnKey requiredPermissions={['mark_attendance']}>
          <AttendancePanel />
        </PermissionRouteBasedOnKey>
      } />
      <Route path='/history' element={
        <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['view_own_attendance', 'view_subordinates_attendance', 'view_all_user_attendance']}>
          <AttendanceHistory />
        </PermissionRouteBasedOnKey>
      } />

      <Route path='/verification' element={
        <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['view_own_attendance', 'view_subordinates_attendance', 'view_all_user_attendance']}>
          <AttendanceVerificationComponent />
        </PermissionRouteBasedOnKey>
      } />
      <Route path='/live' element={
        <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['view_subordinates_attendance', 'view_all_user_attendance']}>
          <AttendanceLivePanel />
        </PermissionRouteBasedOnKey>

      } />
      <Route path='/past-not-checked-days' element={
        <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['modify_past_attendance']}>
          <PastNotCheckedDays />
        </PermissionRouteBasedOnKey>

      } />
    </Routes>
  )
}
const LeaveBalanceManagementSystem = () => {
  return (
    <Routes>
      <Route path='/' element={
        <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['view_leave_balance']}>
          <ViewLeaveBalance />
        </PermissionRouteBasedOnKey>
      } />
    </Routes>
  )
}
const LeaveRequestManagementSystem = () => {
  return (
    <Routes>
      <Route path='/' element={
        <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['leave_request', 'view_subordinates_leave', 'view_all_user_leave']}>
          <LeaveRequestList />
        </PermissionRouteBasedOnKey>
      } />
      <Route path='/create' element={
        <PermissionRouteBasedOnKey requiredPermissions={['leave_request']}>
          <LeaveRequestCreate />
        </PermissionRouteBasedOnKey>
      } />
      <Route path='/edit/:id' element={
        <PermissionRouteBasedOnKey requiredPermissions={['leave_request']}>
          <EditLeaveRequest />
        </PermissionRouteBasedOnKey>
      } />
      <Route path='/approve' element={
        <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['approve_leave', 'reject_leave']}>
          <LeaveRequestApprove />
        </PermissionRouteBasedOnKey>
      } />
    </Routes>
  )
}
const LeaveTypeManagementSystem = () => {
  return (
    <Routes>
      <Route path='/' element={
        <PermissionRouteBasedOnKey requiredPermissions={['read_leave_type']}>
          <LeaveTypeList />
        </PermissionRouteBasedOnKey>
      } />
      <Route path='/create' element={
        <PermissionRouteBasedOnKey requiredPermissions={['leave_type_create']}>
          <CreateLeaveType />
        </PermissionRouteBasedOnKey>
      } />
      <Route path='/edit/:id' element={
        <PermissionRouteBasedOnKey requiredPermissions={['update_leave_types']}>
          <EditLeaveType />
        </PermissionRouteBasedOnKey>
      } />
    </Routes>
  )
}

const ProfileRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={
      <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['view_personal_info_to_myself', 'view_employment_info_to_myself']}>
        <ProfileInfo />
      </PermissionRouteBasedOnKey>
      } />
      <Route path="/:id" element={
      <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['view_personal_info_of_all', 'view_employment_info_of_all', 'view_personal_info_of_subordinates', 'view_employment_info_of_subordinates']}>
        <ProfileInfo />
      </PermissionRouteBasedOnKey>
      } />
      <Route path="/edit" element={
      <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['update_personal_info', 'update_personal_info_all_user']}>
        <ProfileEdit />
      </PermissionRouteBasedOnKey>
      } />
      <Route path="/edit/:id" element={
      <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['update_personal_info_subordinates', 'update_personal_info_all_user']}>
        <ProfileEdit />
      </PermissionRouteBasedOnKey>
      } />
      <Route path="/edit/bank/:id" element={
      <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['update_bank_all_user']}>
        <BankDetails />
      </PermissionRouteBasedOnKey>
      } />
      <Route path="/edit/bank" element={
      <PermissionRouteBasedOnKey requiredPermissions={['update_bank_own']}>
        <BankDetails />
      </PermissionRouteBasedOnKey>
      } />
    </Routes>
  )
}
const SuperAdminRoute = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/organization/*" element={<OrganizationManagementSystemRoutes />} />
      <Route path="/permission/*" element={<PermissionManagementSystemRoutes />} />
      <Route path="/logout" element={<Logout />} />
    </Routes>
  )
}
const OrganizationManagementSystemRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<OrganizationHome />} />
      <Route path='/create' element={<OrganizationCreate />} />
      <Route path='/:organizationId' element={
        // <PermissionRouteBasedOnKey requiredPermissions={['view_organization_basic_details']}>
          <SpecificOrganizationHome />
        // </PermissionRouteBasedOnKey>
      } />
    </Routes>
  )
}
const PermissionManagementSystemRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<PermissionManagement />} />
      <Route path='/create' element={<PermissionCreate />} />
      {/* <Route path='/:id' element={<SpecificOrganizationHome />} /> */}
    </Routes>
  )
}


export default App
