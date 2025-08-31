import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import RouteDict from '@/routes/RouteDict';
import { permissionListAtom } from '@/store/atom';
import PermissionRouteBasedOnKey from '@/components/RouteSecurityWrapper/PermissionBasedOnKey';

const Dashboard = lazy(() => import('./Dashboard'));
const UserView = lazy(() => import('./UserView'));
const TaskView = lazy(() => import('./TaskView'));
const EmployeeView = lazy(() => import('./EmployeeView'));

const TaskModule = () => {
  const [permissionList] = useAtom(permissionListAtom);

  // Check user permissions
  const hasTaskCreate = permissionList.some(p => p.key === 'task_create');
  const hasTaskViewAll = permissionList.some(p => p.key === 'task_view_all');
  const hasTaskManageAll = permissionList.some(p => p.key === 'task_manage_all');
  console.log('first', hasTaskCreate, hasTaskViewAll, hasTaskManageAll);

  // Users with only view permissions should be redirected to employee view
  const hasOnlyViewPermission = hasTaskViewAll && !hasTaskCreate && !hasTaskManageAll;

  return (
    <Routes>
      <Route  
        path="/" 
        element={
          hasOnlyViewPermission ? 
            <Navigate to="/p/task/employee" replace /> : 
            <Navigate to={RouteDict.Task.Dashboard} replace />
        } 
      />
      
      {/* Dashboard - Only accessible to users with management permissions */}
      <Route 
        path="/dashboard" 
        element={
          <PermissionRouteBasedOnKey
            requiredPermissions={['task_create', 'task_manage_all']} 
            requireAll={false}
          >
            <Dashboard />
          </PermissionRouteBasedOnKey>
        } 
      />
      
      {/* User View - Only accessible to users with management permissions */}
      <Route 
        path="/user-view" 
        element={
          <PermissionRouteBasedOnKey
            requiredPermissions={['task_create', 'task_manage_all']} 
            requireAll={false}
          >
            <UserView />
          </PermissionRouteBasedOnKey>
        } 
      />
      
      {/* Task View - Only accessible to users with management permissions */}
      <Route 
        path="/task-view" 
        element={
          <PermissionRouteBasedOnKey
            requiredPermissions={['task_create', 'task_manage_all']} 
            requireAll={false}
          >
            <TaskView />
          </PermissionRouteBasedOnKey>
        } 
      />
      
      {/* Employee View - Accessible to all users with any task permission */}
      <Route 
        path="/employee" 
        element={
          <PermissionRouteBasedOnKey
            requiredPermissions={['task_create', 'task_view_all', 'task_manage_all']} 
            requireAll={false}
          >
            <EmployeeView />
          </PermissionRouteBasedOnKey>
        } 
      />
    </Routes>
  );
};

export default TaskModule;
