import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load profile components
const ProfileInfo = lazy(() => import('./ProfileInfo'));
const EditProfile = lazy(() => import('./EditProfile'));
const BankDetails = lazy(() => import('./BankDetails'));

const ProfileModule = () => {
  return (
    <Routes>
      <Route index element={<ProfileInfo />} />
      <Route path="edit" element={<EditProfile />} />
      <Route path="bank-details" element={<BankDetails />} />
    </Routes>
  );
};

export default ProfileModule;
