import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Loader from '@/components/Loader';
import ErrorBoundary from '@/components/ErrorBoundary';

// Lazy load profile components
const ProfileInfo = lazy(() => import('./ProfileInfo'));
const EditProfile = lazy(() => import('./EditProfile'));
const BankDetails = lazy(() => import('./BankDetails'));

const ProfileLoading = () => (
  <div className="flex items-center justify-center min-h-[400px] w-full">
    <Loader />
  </div>
);

const ProfileModule = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<ProfileLoading />}>
        <Routes>
          <Route path='info' element={<ProfileInfo />} />
          <Route path='info/:id' element={<ProfileInfo />} />
          <Route path="edit" element={<EditProfile />} />
          <Route path="edit/:id" element={<EditProfile />} />
          <Route path="edit/bank" element={<BankDetails />} />
          <Route path="edit/bank/:id" element={<BankDetails />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default ProfileModule;
