import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load organization components
const OrganizationHome = lazy(() => import('./OrganizationHome'));
const OrganizationCreate = lazy(() => import('./OrganizationCreate'));
const SpecificOrganizationHome = lazy(() => import('./SpecificOrganizationHome'));
const SpecificOrganizationView = lazy(() => import('../SpecificOrganizationManagementSystem/View'));
const OrganizationSettings = lazy(() => import('../SpecificOrganizationManagementSystem/OrganizationSettings'));

const OrganizationModule = () => {
  return (
    <Routes>
      <Route index element={<OrganizationHome />} />
      <Route path="create" element={<OrganizationCreate />} />
      <Route path=":organizationId" element={<SpecificOrganizationHome />} />
      <Route path=":organizationId/view" element={<SpecificOrganizationView />} />
      <Route path=":organizationId/settings" element={<OrganizationSettings />} />
    </Routes>
  );
};

export default OrganizationModule;
