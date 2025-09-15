import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load client organization components
const SpecificOrganizationView = lazy(() => import('./View'));
const OrganizationSettings = lazy(() => import('./OrganizationSettings'));

/**
 * Client Organization Module
 * This module is for organizations to manage their own data (client use)
 * - View organization details
 * - Manage organization settings
 * - View departments and employees within the organization
 */
const ClientOrganizationModule = () => {
  return (
    <Routes>
      {/* Default view - shows organization dashboard with tabs */}
      <Route index element={<SpecificOrganizationView />} />
      
      {/* Organization settings */}
      <Route path="settings" element={<OrganizationSettings />} />
    </Routes>
  );
};

export default ClientOrganizationModule;
