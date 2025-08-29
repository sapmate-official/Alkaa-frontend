import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RouteDict from '@/routes/RouteDict';

const Dashboard = lazy(() => import('./Dashboard'));
const UserView = lazy(() => import('./UserView'));
const TaskView = lazy(() => import('./TaskView'));
const EmployeeView = lazy(() => import('./EmployeeView'));

const TaskModule = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={RouteDict.Task.Dashboard} replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/user-view" element={<UserView />} />
      <Route path="/task-view" element={<TaskView />} />
      <Route path="/employee" element={<EmployeeView />} />
    </Routes>
  );
};

export default TaskModule;
