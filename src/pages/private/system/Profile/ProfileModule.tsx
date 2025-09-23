import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load profile components
const ProfileInfo = lazy(() => import('./ProfileInfo'));
const EditProfile = lazy(() => import('./EditProfile'));
const BankDetails = lazy(() => import('./BankDetails'));
const ProfileSettings = lazy(() => import('./ProfileSettings'));

const ProfileModule = () => {
  return (
    <Routes>
      <Route path='info' element={<ProfileInfo />} />
      <Route path='info/:id' element={<ProfileInfo />} />
      <Route path="edit" element={<EditProfile />} />
      <Route path="edit/:id" element={<EditProfile />} />
      <Route path="edit/bank" element={<BankDetails />} />
      <Route path="edit/bank/:id" element={<BankDetails />} />
      <Route path="settings" element={<ProfileSettings />} />
    </Routes>
  );
};

export default ProfileModule;
