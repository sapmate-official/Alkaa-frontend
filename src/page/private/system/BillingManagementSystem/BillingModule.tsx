import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load billing components
const BillingDashboard = lazy(() => import('./BillingDashboard'));
const BillHistory = lazy(() => import('./BillHistory'));
const BillDetails = lazy(() => import('./BillDetails'));
const BillPayment = lazy(() => import('./BillPayment'));

const BillingModule = () => {
  return (
    <Routes>
      <Route index element={<BillingDashboard />} />
      <Route path="history" element={<BillHistory />} />
      <Route path="details/:billId" element={<BillDetails />} />
      <Route path="payment/:billId" element={<BillPayment />} />
    </Routes>
  );
};

export default BillingModule;
