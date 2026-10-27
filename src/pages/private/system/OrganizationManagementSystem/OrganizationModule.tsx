import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load ADMIN organization components
const OrganizationHome = lazy(() => import('./OrganizationHome'));
const OrganizationCreate = lazy(() => import('./OrganizationCreate'));
const SpecificOrganizationHome = lazy(() => import('./SpecificOrganizationHome'));

/**
 * ADMIN Organization Module - For Super Admin Use Only
 * This module is for platform super-admin functionality:
 * - Create new organizations 
 * - View all organizations
 * - SuperAdmin-level organization management & inspection
 */
const OrganizationModule = () => {
  return (
    <Routes>
      {/* Admin: List all organizations */}
      <Route index element={<OrganizationHome />} />
      <Route path="list" element={<OrganizationHome />} />
      
      {/* Admin: Create new organization */}
      <Route path="create" element={<OrganizationCreate />} />
      
      {/* Admin: View specific organization details */}
      <Route path=":organizationId" element={<SpecificOrganizationHome />} />
      <Route path=":organizationId/details" element={<SpecificOrganizationHome />} />
      <Route path=":organizationId/*" element={<SpecificOrganizationHome />} />
    </Routes>
  );
};

export default OrganizationModule;
