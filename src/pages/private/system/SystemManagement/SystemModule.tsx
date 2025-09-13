import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import NotificationTemplateCreate from '../NotificationManagementSystem/NotificationTemplateCreate';
import ListOfNotificationTemplate from '../NotificationManagementSystem/ListOfNotificationTemplate';

// Lazy load system components
const PermissionManagement = lazy(() => import('../PermissionManagementSystem/PermissionManagementSystem'));
const PermissionCreate = lazy(() => import('../PermissionManagementSystem/PermissionCreate'));
const ActivityLogsManagement = lazy(() => import('../ActivityLogManagementSystem/ActivityLogsManagement'));
const RolesPermissionsManagement = lazy(() => import('../RoleManagementSystem/RoleManagementDashboard'));
const HolidayManagementSystem = lazy(() => import('../HolidayManagementSystem/HolidayDashboard'));
const ListOfNotification = lazy(() => import('../NotificationManagementSystem/ListOfNotification'));

const SystemModule = () => {
  return (
    <Routes>
      <Route path="permission" element={<PermissionManagement />} />
      <Route path="permission/create" element={<PermissionCreate />} />
      <Route path="activity-logs" element={<ActivityLogsManagement />} />
      <Route path="role" element={<RolesPermissionsManagement />} />
      <Route path="holiday" element={<HolidayManagementSystem />} />
      <Route path="notification" element={<ListOfNotification />} />
      <Route path="notification/template" element={<ListOfNotificationTemplate />} />
      <Route path="notification/templates/create" element={<NotificationTemplateCreate />} />

    </Routes>
  );
};

export default SystemModule;
