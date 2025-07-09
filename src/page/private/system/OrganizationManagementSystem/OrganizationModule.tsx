import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load ADMIN organization components
const OrganizationHome = lazy(() => import('./OrganizationHome'));
const OrganizationCreate = lazy(() => import('./OrganizationCreate'));
const SpecificOrganizationHome = lazy(() => import('./SpecificOrganizationHome'));

/**
 * @deprecated ADMIN Organization Module - For Super Admin Use Only
 * This module is for admin/super-admin functionality:
 * - Create new organizations 
 * - View all organizations
 * - Admin-level organization management
 * 
 * For client organization management, use ClientOrganizationModule instead
 */
const OrganizationModule = () => {
  return (
    <Routes>
      {/* Admin: List all organizations */}
      <Route index element={<OrganizationHome />} />
      
      {/* Admin: Create new organization */}
      <Route path="create" element={<OrganizationCreate />} />
      
      {/* Admin: View specific organization details */}
      <Route path=":organizationId" element={<SpecificOrganizationHome />} />
    </Routes>
  );
};

export default OrganizationModule;
