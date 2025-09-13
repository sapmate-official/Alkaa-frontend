import React from 'react';
import { Routes, Route } from 'react-router-dom';
import OnboardingManagement from '@/components/onboarding/OnboardingManagement';

const OnboardingModule: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<OnboardingManagement />} />
      <Route path="/manage" element={<OnboardingManagement />} />
    </Routes>
  );
};

export default OnboardingModule;
