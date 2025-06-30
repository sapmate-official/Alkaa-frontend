import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load attendance components
const AttendancePanel = lazy(() => import('./panel'));
const AttendanceHistory = lazy(() => import('./history'));
const AttendanceVerification = lazy(() => import('./verification'));
const AttendanceLivePanel = lazy(() => import('./livePanel'));
const PastNotCheckedDays = lazy(() => import('./pastdays'));

const AttendanceModule = () => {
  return (
    <Routes>
      <Route index element={<AttendancePanel />} />
      <Route path="history" element={<AttendanceHistory />} />
      <Route path="verification" element={<AttendanceVerification />} />
      <Route path="live" element={<AttendanceLivePanel />} />
      <Route path="past-not-checked-days" element={<PastNotCheckedDays />} />
    </Routes>
  );
};

export default AttendanceModule;
