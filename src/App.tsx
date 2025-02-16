import { useEffect, useState } from 'react'
import './App.css'
import { Route, Routes, Navigate, BrowserRouter } from 'react-router-dom';
import Home from './page/public/Home';
import SetPassword from './page/public/SetPassword';
import { AuthProvider, useAuth } from './services/AuthContext';
import SignIn from './page/public/auth/SignIn';
import Loader from './components/Loader';
import { MainLayout } from './layout/MainLayout';
import ProfileInfo from './system/Profile/ProfileInfo';
import Logout from './page/private/Logout';
import axios from 'axios';
import { APIDictionary } from './api/APIdict';
import LandingPage from './page/public/LandingPage';
import OrganizationHome from './system/OrganizationManagementSystem/OrganizationHome';
import OrganizationCreate from './system/OrganizationManagementSystem/OrganizationCreate';
import SpecificOrganizationHome from './system/OrganizationManagementSystem/SpecificOrganizationHome';
import PermissionCreate from './system/PermissionManagementSystem/PermissionCreate';
import PermissionHome from './system/PermissionManagementSystem/PermissionHome';
import ProfileEdit from './system/Profile/EditProfile';
// import ListOfleaves from './system/LeaveManagementSystem/LeaveType/List';
// import CreateLeaveType from './system/LeaveManagementSystem/LeaveType/Create';
// import EditLeaveType from './system/LeaveManagementSystem/LeaveType/Edit';
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
import PayrollDashboard from './system/PayrollManagementSystem/Dashboard';
import SalaryGenerator from './system/PayrollManagementSystem/Generate';
import PayrollDashboardUsers from './system/PayrollManagementSystem/DashboardUsers';
import BankDetails from './system/Profile/BankDetails';
import ListOfNotification from './system/NotificationManagementSystem/ListOfNotification';
import ListOfNotificationTemplate from './system/NotificationManagementSystem/ListOfNotificationTemplate';
import NotificationTemplateCreate from './system/NotificationManagementSystem/NotificationTemplateCreate';
import SpecificOrganizationView from './system/SpecificOrganizationManagementSystem/View';
import ListOfEmployee from './system/EmployeeManagementSystem/List';
import CreateEmployeeNew from './system/EmployeeManagementSystem/CreateEmployeeNew';
import ListOfDepartment from './system/DepartmentManagementSystem/List';
import CreateDepartment from './system/DepartmentManagementSystem/Create';
import SpecificDepartmentView from './system/DepartmentManagementSystem/View';
import SpecificDepartmentEdit from './system/DepartmentManagementSystem/Edit';
import RoleAssignment from './system/EmployeeManagementSystem/RoleAssignment';
import { useAtom } from 'jotai';
import { permissionListAtom } from './store/atom';
import PermissionRoute from './components/PermissionRoute';


function App() {
  // const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <AuthProvider>
        <MainLayout>
          <Routes>
            <Route path="/" element={<SignIn />} />
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/reset-password/:token" element={<SetPassword />} />
            <Route path='/p/*' element={<ProtectedRoute />} />
          </Routes>
          <Toaster />
        </MainLayout>
      </AuthProvider>
    </BrowserRouter>
  )
}


const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [, setPermissionList] = useAtom(permissionListAtom)

  const fetchUserDetails = async () => {
    try {
      if (!user?.id) return;
      setIsUserLoading(true);
      const response = await axios.get(APIDictionary.userProfile(user?.id), { withCredentials: true });
      const data = response.data;
      // console.log(data);


      setUserDetails(data);
      setPermissionList(data.user.roles[0].role.permissions.map((permission: any) => permission.permission))
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

  if (isLoading || isUserLoading) {
    return <Loader />;
  }
  console.log(user, isLoading, userDetails);

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
        <PermissionRoute requiredPermissions={['leave.create_types', 'leave.read_types', 'leave.update_types', 'leave.delete_types']}>
          <LeaveTypeManagementSystem />
        </PermissionRoute>
      } />

      <Route path="/leaverequest/*" element={
        <PermissionRoute requireAll={false} requiredPermissions={['leave.request', 'leave.approve', 'leave.reject', 'leave.view_team_leaves', 'leave.view_all_leaves']}>
          <LeaveRequestManagementSystem />
        </PermissionRoute>
      } />

      <Route path="/leavebalance/*" element={
        <PermissionRoute requiredPermissions={['leave.manage_balances']}>
          <LeaveBalanceManagementSystem />
        </PermissionRoute>
      } />

      <Route path="/attendance/*" element={
        <PermissionRoute requiredPermissions={['attendance.mark', 'attendance.view_own', 'attendance.view_team', 'attendance.view_all', 'attendance.modify']}>
          <AttendanceManagementSystem />
        </PermissionRoute>
      } />

      <Route path="/payroll/*" element={
        <PermissionRoute requiredPermissions={['payroll.view_own', 'payroll.view_team', 'payroll.view_all', 'payroll.process']}>
          <PayrollManagementSystem />
        </PermissionRoute>
      } />

      <Route path="/notification/*" element={
        <PermissionRoute requiredPermissions={['notification.create_template', 'notification.read_template', 'notification.update_template', 'notification.send']}>
          <NotificationManagementSystem />
        </PermissionRoute>
      } />

      <Route path="/organization/*" element={
        <PermissionRoute requiredPermissions={['org.manage_settings', 'org.view_settings']}>
          <SpecificOrganizationManagementSystem />
        </PermissionRoute>
      } />

      <Route path="/employee/*" element={
        <PermissionRoute requiredPermissions={['Create User/Employee', 'Read User Details', 'Update User Details', 'Delete User']}>
          <EmployeeManagementSystem />
        </PermissionRoute>
      } />

      <Route path="/department/*" element={
        <PermissionRoute requiredPermissions={['department.create', 'department.read', 'department.update', 'department.delete']}>
          <DepartmentManagementSystem />
        </PermissionRoute>
      } />

      <Route path="/role/*" element={
        <PermissionRoute requiredPermissions={['Manage User Roles']}>
          <RolePermissionManagementSystem />
        </PermissionRoute>
      } />

      <Route path="/logout" element={<Logout />} />
    </Routes>
  )
}
const RolePermissionManagementSystem = () => {
  return (
    <Routes>
      <Route path='/' element={<RoleAssignment />} />
    </Routes>
  )
}
const DepartmentManagementSystem = () => {
  return (
    <Routes>
        <Route path='/' element={
      <PermissionRoute requiredPermissions={['department.read']}>
          <SpecificDepartmentView />
          </PermissionRoute>
        } />
        <Route path='/list' element={
      <PermissionRoute requiredPermissions={['department.read']}>
          <ListOfDepartment />
          </PermissionRoute>
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
      <PermissionRoute requiredPermissions={['department.update']}>
          <SpecificDepartmentEdit />
          </PermissionRoute>
        } />
    </Routes>
  )
}
const EmployeeManagementSystem = () => {
  return (
    <Routes>
      <Route path='/' element={
      <PermissionRoute requiredPermissions={['Read User Details']}>
        <ListOfEmployee />
          </PermissionRoute>
        } />
      <Route path='/create' element={
      <PermissionRoute requiredPermissions={['Create User/Employee']}>
        <CreateEmployeeNew />
          </PermissionRoute>
        } />
    </Routes>
  )
}
const SpecificOrganizationManagementSystem = () => {
  return (
    <Routes>
      <Route path='/' element={<SpecificOrganizationView />} />
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
const PayrollManagementSystem = () => {
  return (
    <Routes>
      <Route path='/' element={
        <PermissionRoute requiredPermissions={['payroll.view_all']}>
          <PayrollDashboard />
        </PermissionRoute>
      } />
      <Route path='/generate' element={
        <PermissionRoute requiredPermissions={['payroll.process']}>
          <SalaryGenerator />
        </PermissionRoute>
      } />
      <Route path='/users' element={
        <PermissionRoute requiredPermissions={['payroll.view_all']}>
          <PayrollDashboardUsers />
        </PermissionRoute>
      } />
    </Routes>
  )
}
const AttendanceManagementSystem = () => {
  return (
    <Routes>
      <Route path='/' element={
        <PermissionRoute requiredPermissions={['attendance.mark', 'attendance.view_own']}>
          <AttendancePanel />
        </PermissionRoute>
      } />
      <Route path='/history' element={
        <PermissionRoute requiredPermissions={['attendance.view_own', 'attendance.view_team', 'attendance.view_all']}>
          <AttendanceHistory />
        </PermissionRoute>
      } />
    </Routes>
  )
}
const LeaveBalanceManagementSystem = () => {
  return (
    <Routes>
      <Route path='/' element={
        <PermissionRoute requiredPermissions={['leave.manage_balances']}>
          <ViewLeaveBalance />
        </PermissionRoute>
      } />
    </Routes>
  )
}
const LeaveRequestManagementSystem = () => {
  return (
    <Routes>
      <Route path='/' element={
        <PermissionRoute requireAll={false} requiredPermissions={['leave.request']}>
          <LeaveRequestList />
        </PermissionRoute>
      } />
      <Route path='/create' element={
        <PermissionRoute requiredPermissions={['leave.request']}>
          <LeaveRequestCreate />
        </PermissionRoute>
      } />
      <Route path='/edit/:id' element={
        <PermissionRoute requiredPermissions={['leave.request']}>
          <EditLeaveRequest />
        </PermissionRoute>
      } />
      <Route path='/approve' element={
        <PermissionRoute requiredPermissions={['leave.approve', 'leave.reject']}>
          <LeaveRequestApprove />
        </PermissionRoute>
      } />
    </Routes>
  )
}
const LeaveTypeManagementSystem = () => {
  return (
    <Routes>
      <Route path='/' element={<LeaveTypeList />} />
      <Route path='/create' element={<CreateLeaveType />} />
      <Route path='/edit/:id' element={<EditLeaveType />} />
    </Routes>
  )
}

const ProfileRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={
        <PermissionRoute requiredPermissions={['Read User Details']}>
          <ProfileInfo />
        </PermissionRoute>
      } />
      <Route path="/:id" element={
        <PermissionRoute requiredPermissions={['Read User Details']}>
          <ProfileInfo />
        </PermissionRoute>
      } />
      <Route path="/edit" element={
        <PermissionRoute requiredPermissions={['Update User Details']}>
          <ProfileEdit />
        </PermissionRoute>
      } />
      <Route path="/edit/bank" element={
        <PermissionRoute requiredPermissions={['Update User Details']}>
          <BankDetails />
        </PermissionRoute>
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
      <Route path='/:id' element={<SpecificOrganizationHome />} />
    </Routes>
  )
}
const PermissionManagementSystemRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<PermissionHome />} />
      <Route path='/create' element={<PermissionCreate />} />
      <Route path='/:id' element={<SpecificOrganizationHome />} />
    </Routes>
  )
}
// const ManagerRoutes = () => {
//   return (
//     <Routes>
//       <Route path="/" element={<Home />} />
//       <Route path="/leave-request" element={<LeaveRequest />} />
//       <Route path="/employee-list" element={<EmployeeList />} />
//       <Route path="/profile/:id" element={<ProfileInfo />} />
//       <Route path="/employee-create" element={<CreateEmployee />} />
//       <Route path="/leave-create" element={<CreateLeaveType />} />
//       <Route path="/attendance" element={<AttendanceList />} />
//     </Routes>
//   );
// }
// const EmployeeRoutes = () => {
//   return (
//     <Routes>
//       <Route path="/" element={<Home />} />
//       <Route path="/leave-request" element={<LeaveRequestEmployee />} />
//       <Route path="/leave-status" element={<LeaveStatus />} />
//       <Route path="/leave-balance" element={<LeaveBalance />} />
//       <Route path="/attendance" element={<LocationComponent />} />
//       <Route path="/profile/:id" element={<ProfileInfo />} />
//       <Route path="/logout" element={<Logout />} />
//     </Routes>
//   );
// }


export default App
