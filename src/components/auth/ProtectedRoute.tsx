import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthContext';
import RouteDict from '@/routes/RouteDict';
import Loader from '@/components/Loader';
import { routeUtils } from '@/utils/routeUtils';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while authentication is being verified
  if (isLoading) {
    return <Loader />;
  }

  // If user is not authenticated, redirect to login with the current location
  if (!user) {
    // Only store the intended location if it's a valid protected route
    const from = routeUtils.isProtectedRoute(location.pathname) 
      ? location.pathname + location.search 
      : RouteDict.Protected;
    
    // Clear any existing browser history that might allow back navigation
    window.history.replaceState(null, '', RouteDict.SignInPage);
    
    return (
      <Navigate 
        to={RouteDict.SignInPage} 
        state={{ from }} 
        replace 
      />
    );
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
