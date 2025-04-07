import { useEffect, useState } from 'react'
import './App.css'
import { Route, Routes, Navigate, BrowserRouter, useLocation } from 'react-router-dom';
import Home from './page/public/Home';
import SetPassword from './page/public/SetPassword';
import { AuthProvider, useAuth } from './services/AuthContext';
import SignIn from './page/public/auth/SignIn';
import Loader from './components/Loader';
import { MainLayout } from './layout/MainLayout';
import ProfileInfo from './system/Profile/ProfileInfo';
import Logout from './page/private/Logout';
import axios from 'axios';
import { APIDictionary } from './api/v2/APIdict';
import LandingPage from './page/public/LandingPage';
import OrganizationHome from './system/OrganizationManagementSystem/OrganizationHome';
import OrganizationCreate from './system/OrganizationManagementSystem/OrganizationCreate';
import SpecificOrganizationHome from './system/OrganizationManagementSystem/SpecificOrganizationHome';
import PermissionCreate from './system/PermissionManagementSystem/PermissionCreate';
import ProfileEdit from './system/Profile/EditProfile';
import LeaveTypeList from './system/LeaveTypeManagementSystem/List';
import CreateLeaveType from './system/LeaveTypeManagementSystem/Create';
import EditLeaveType from './system/LeaveTypeManagementSystem/Edit';
import LeaveRequestCreate from './system/LeaveRequestManagementSystem/Create';
import LeaveRequestList from './system/LeaveRequestManagementSystem/list';
import EditLeaveRequest from './system/LeaveRequestManagementSystem/Edit';
import LeaveRequestApprove from './system/LeaveRequestManagementSystem/approve';
import { Toaster } from './components/ui/toaster';
import ViewLeaveBalance from './system/LeaveBalanceManagementSystem/view';
import AttendancePanel from './system/AttendanceManagementSystem/panel';
import AttendanceHistory from './system/AttendanceManagementSystem/history';
import PayrollDashboardForAllEmployee from './system/PayrollManagementSystem/Dashboard';
import SalaryGenerator from './system/PayrollManagementSystem/Generate';
import PayrollDashboardUsers from './system/PayrollManagementSystem/DashboardUsers';
import BankDetails from './system/Profile/BankDetails';
import ListOfNotification from './system/NotificationManagementSystem/ListOfNotification';
import ListOfNotificationTemplate from './system/NotificationManagementSystem/ListOfNotificationTemplate';
import NotificationTemplateCreate from './system/NotificationManagementSystem/NotificationTemplateCreate';
import SpecificOrganizationView from './system/SpecificOrganizationManagementSystem/View';
import CreateEmployeeNew from './system/EmployeeManagementSystem/CreateEmployeeNew';
import ListOfDepartment from './system/DepartmentManagementSystem/List';
import CreateDepartment from './system/DepartmentManagementSystem/Create';
import SpecificDepartmentView from './system/DepartmentManagementSystem/View';
import SpecificDepartmentEdit from './system/DepartmentManagementSystem/Edit';
import { useAtom } from 'jotai';
import { permissionListAtom } from './store/atom';
import PermissionRoute from './components/RouteSecurityWrapper/PermissionRoute';
import PayRollViewOwn from './system/PayrollManagementSystem/ViewOwn';
import RolesPermissionsManagement from './system/RoleManagementSystem/RoleManagementDashboard';
import AttendanceVerificationComponent from './system/AttendanceManagementSystem/verification';
import AttendanceLivePanel from './system/AttendanceManagementSystem/livePanel';
import PastNotCheckedDays from './system/AttendanceManagementSystem/pastdays';
import PermissionManagement from './system/PermissionManagementSystem/PermissionManagementSystem';
import HolidayManagementSystem from './system/HolidayManagementSystem/HolidayDashboard';
import OrganizationSettings from './system/SpecificOrganizationManagementSystem/OrganizationSettings';
import PayrollViewAllEmployees from './system/PayrollManagementSystem/ViewAllEmployees';
import PayrollViewEmployeeDetails from './system/PayrollManagementSystem/ViewEmployeePayroll';
import PermissionRouteBasedOnKey from './components/RouteSecurityWrapper/PermissionBasedOnKey';
import DashboardOfPayroll from './system/PayrollManagementSystem/New_version/DashboardOfPayroll';
import MainCompOfViewPayslipOfAllSubordinatesPayroll from './system/PayrollManagementSystem/New_version/ManagerLevel/ViewPayslipOfAllSubordinatesPayroll/MainCompOfViewPayslipOfAllSubordinatesPayroll';
import MainGenerateSubordinateSalaryPage from './system/PayrollManagementSystem/New_version/ManagerLevel/GenerateSalary/MainGenerateSubordinateSalaryPage';
import MainSubordinateSalaryTransactionPage from './system/PayrollManagementSystem/New_version/ManagerLevel/Salarytransaction/MainSubordinateSalaryTransactionPage';
import MainGenerateUsersSalaryPage from './system/PayrollManagementSystem/New_version/AdminLevel/GenerateSalary/MainGenerateUserSalaryPage';
import MainCompOfViewPayslipOfAllUsersPayroll from './system/PayrollManagementSystem/New_version/AdminLevel/ViewPayslipOfAllUsersPayroll/MainCompOfViewPayslipOfAllUsersPayroll';
import EmployeeManagement from './system/EmployeeManagementSystem/EmployeeManagement';


function App() {
  // const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
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
                <ProtectedRoute />
              </MainLayout>
            </AuthProvider>
          }
        />
      </Routes>
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
        <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['view_subordinates_attendance', 'view_all_user_attendance']}>
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
      <PermissionRouteBasedOnKey requireAll={false} requiredPermissions={['update_bank_all_user', 'update_bank_subordinates']}>
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
        <PermissionRouteBasedOnKey requiredPermissions={['view_organization_basic_details']}>
          <SpecificOrganizationHome />
        </PermissionRouteBasedOnKey>
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
