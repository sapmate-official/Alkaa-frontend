import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load leave components
const LeaveDashboard = lazy(() => import('./LeaveDashboard'));
const LeaveRequestList = lazy(() => import('./LeaveRequestManagementSystem/list'));
const LeaveRequestCreate = lazy(() => import('./LeaveRequestManagementSystem/Create'));
const EditLeaveRequest = lazy(() => import('./LeaveRequestManagementSystem/Edit'));
const LeaveRequestApprove = lazy(() => import('./LeaveRequestManagementSystem/approve'));
const ViewLeaveBalance = lazy(() => import('./LeaveBalanceManagementSystem/view'));
const LeaveTypeList = lazy(() => import('./LeaveTypeManagementSystem/List'));
const CreateLeaveType = lazy(() => import('./LeaveTypeManagementSystem/Create'));
const EditLeaveType = lazy(() => import('./LeaveTypeManagementSystem/Edit'));

const LeaveModule = () => {
  return (
    <Routes>
      {/* Leave Dashboard - Default route */}
      <Route index element={<LeaveDashboard />} />
      <Route path="dashboard" element={<LeaveDashboard />} />
      
      {/* Leave Requests Management */}
      <Route path="request" element={<LeaveRequestList />} />
      <Route path="request/create" element={<LeaveRequestCreate />} />
      <Route path="request/edit/:id" element={<EditLeaveRequest />} />
      <Route path="request/approve" element={<LeaveRequestApprove />} />
      
      {/* Leave Balance Management */}
      <Route path="balance" element={<ViewLeaveBalance />} />
      
      {/* Leave Types Management */}
      <Route path="type" element={<LeaveTypeList />} />
      <Route path="type/create" element={<CreateLeaveType />} />
      <Route path="type/edit/:id" element={<EditLeaveType />} />
    </Routes>
  );
};

export default LeaveModule;
