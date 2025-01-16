import { useEffect, useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './page/public/Home';
import SetPassword from './page/public/SetPassword';
import { useAuth } from './services/AuthContext';
import LeaveRequest from './page/private/manager/LeaveRequest';
import EmployeeList from './page/private/manager/EmployeeList';
import LeaveRequestEmployee from './page/private/employee/LeaveRequest';
import LeaveBalance from './page/private/employee/LeaveBalance';
import SignIn from './page/public/auth/SignIn';
import Loader from './components/Loader';
import { MainLayout } from './layout/MainLayout';
import LeaveStatus from './page/private/employee/LeaveStatus';
import ProfileInfo from './page/private/ProfileInfo';
import CreateEmployee from './page/private/manager/CreateEmployee';
import { CreateLeaveType } from './page/private/manager/CreateLeaveType';
import LocationComponent from './components/Attendance';
import AttendanceList from './components/AttendanceList';
import Logout from './page/private/Logout';


function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/reset-password/:token" element={<SetPassword />} />
          <Route path='/p/*' element={<ProtectedRoute />} />
        </Routes>
      </MainLayout>
    </Router>
  )
}


const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    console.log("ProtectedRoute - User:", user);
    console.log("ProtectedRoute - IsLoading:", isLoading);
    if (user && user.role) {
      console.log("ProtectedRoute - User role:", user.role);
    }
  }, [user, isLoading]);

  if (isLoading) {
    console.log("ProtectedRoute - Still loading...");
    // return <div><Load /></div>;
    return <Loader />;
  }

  if (!user?.role && !user && isLoading === false) {
    console.log(
      "ProtectedRoute - No user or no role, redirecting to signin"
    );
    return <Navigate to="/auth/signin" replace />;
  }

  console.log("ProtectedRoute - Rendering routes for role:", user?.role);

  switch (user?.role) {
    case "MANAGER":
      return <ManagerRoutes />;
    case "EMPLOYEE":
      return <EmployeeRoutes />;
    default:
      console.log("ProtectedRoute - Invalid role:", user?.role);
      return <Navigate to="/auth/signin" replace />;
  }
};
const ManagerRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/leave-request" element={<LeaveRequest />} />
      <Route path="/employee-list" element={<EmployeeList />} />
      <Route path="/profile/:id" element={<ProfileInfo />} />
      <Route path="/employee-create" element={<CreateEmployee />} />
      <Route path="/leave-create" element={<CreateLeaveType />} />
      <Route path="/attendance" element={<AttendanceList />} />
      <Route path="/logout" element={<Logout />} />
    </Routes>
  );
}
const EmployeeRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/leave-request" element={<LeaveRequestEmployee />} />
      <Route path="/leave-status" element={<LeaveStatus />} />
      <Route path="/leave-balance" element={<LeaveBalance />} />
      <Route path="/attendance" element={<LocationComponent />} />
      <Route path="/profile/:id" element={<ProfileInfo />} />
<Route path="/logout" element={<Logout />} />
    </Routes>
  );
}


export default App
