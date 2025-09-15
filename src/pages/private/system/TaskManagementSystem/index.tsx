import { lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import RouteDict from '@/routes/RouteDict';
import { permissionListAtom } from '@/store/atom';
import PermissionRouteBasedOnKey from '@/components/RouteSecurityWrapper/PermissionBasedOnKey';
import { useAuth } from '@/providers/AuthContext';
import { APIDictionary } from '@/services/api/v2/APIdict';
import axios from 'axios';

const Dashboard = lazy(() => import('./Dashboard'));
const UserView = lazy(() => import('./UserView'));
const TaskView = lazy(() => import('./TaskView'));
const EmployeeView = lazy(() => import('./EmployeeView'));
const GroupView = lazy(() => import('./GroupView'));

// Smart Route Component that checks for assigned tasks
const SmartTaskRoute = () => {
  const { user } = useAuth();
  const [permissionList] = useAtom(permissionListAtom);
  const [hasAssignedTasks, setHasAssignedTasks] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check user permissions
  const hasTaskCreate = permissionList.some(p => p.key === 'task_create');
  const hasTaskViewAll = permissionList.some(p => p.key === 'task_view_all');
  const hasTaskManageAll = permissionList.some(p => p.key === 'task_manage_all');

  // Users with only view permissions should always go to employee view
  const hasOnlyViewPermission = hasTaskViewAll && !hasTaskCreate && !hasTaskManageAll;

  useEffect(() => {
    const checkAssignedTasks = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if user has any assigned tasks
        const response = await axios.get(APIDictionary.tasksByUser(user.id), {
          withCredentials: true
        });
        const assignedTasks = response.data.data || [];
        setHasAssignedTasks(assignedTasks.length > 0);
      } catch (error) {
        console.error('Error checking assigned tasks:', error);
        setHasAssignedTasks(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAssignedTasks();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Priority logic:
  // 1. If user has management permissions (task_create or task_manage_all) -> Dashboard
  // 2. If user has only view permission -> Employee View
  // 3. If user has assigned tasks but no management permissions -> Employee View
  if (hasTaskCreate || hasTaskManageAll) {
    return <Navigate to={RouteDict.Task.Dashboard} replace />;
  }

  if (hasOnlyViewPermission || hasAssignedTasks) {
    return <Navigate to="/p/task/employee" replace />;
  }

  // Fallback to dashboard (shouldn't reach here normally)
  return <Navigate to={RouteDict.Task.Dashboard} replace />;
};

const TaskModule = () => {
  return (
    <Routes>
      <Route path="/" element={<SmartTaskRoute />} />
      
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
      <Route path="/group/*" element={<GroupView />} />
    </Routes>
  );
};

export default TaskModule;
