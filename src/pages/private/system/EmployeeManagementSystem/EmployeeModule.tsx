import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load employee components
const EmployeeManagement = lazy(() => import('./EmployeeManagement'));
const CreateEmployeeNew = lazy(() => import('./CreateEmployeeNew'));

const EmployeeModule = () => {
  return (
    <Routes>
      <Route index element={<EmployeeManagement />} />
      <Route path="create" element={<CreateEmployeeNew />} />
    </Routes>
  );
};

export default EmployeeModule;
