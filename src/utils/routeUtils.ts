import RouteDict from '@/routes/RouteDict';

/**
 * Utility functions for route management and authentication
 */
export const routeUtils = {
  /**
   * Check if a route is public (doesn't require authentication)
   */
  isPublicRoute: (pathname: string): boolean => {
    const publicRoutes = [
      '/',
      '/privacy-policy',
      '/auth/signin',
      '/auth/signup',
    ];
    
    return publicRoutes.includes(pathname) || 
           pathname.startsWith('/reset-password/') ||
           pathname.startsWith('/onboarding/');
  },

  /**
   * Check if a route is protected (requires authentication)
   */
  isProtectedRoute: (pathname: string): boolean => {
    return pathname.startsWith('/p/');
  },

  /**
   * Get redirect URL after successful login
   */
  getRedirectAfterLogin: (intendedPath?: string): string => {
    // If there's an intended path and it's a valid protected route, redirect there
    if (intendedPath && routeUtils.isProtectedRoute(intendedPath)) {
      return intendedPath;
    }
    
    // Otherwise redirect to default dashboard
    return RouteDict.Protected;
  },

  /**
   * Get the module name from a protected route path
   */
  getModuleFromPath: (pathname: string): string => {
    const pathParts = pathname.split('/');
    if (pathParts.length >= 3 && pathParts[1] === 'p') {
      return pathParts[2] || 'home';
    }
    return 'home';
  },

  /**
   * Clear browser history and navigate to login
   * This function ensures users cannot use back button to access protected routes after logout
   */
  clearHistoryAndNavigateToLogin: (): void => {
    // Replace current entry in history to prevent back navigation
    window.history.replaceState(null, '', '/auth/signin');
    // Navigate to login page
    window.location.href = '/auth/signin';
  },

  /**
   * Force navigation to login with history clearing
   * Use this for immediate logout scenarios
   */
  forceLoginRedirect: (): void => {
    // Clear the entire session storage and local storage
    sessionStorage.clear();
    
    // Replace browser history
    window.history.replaceState(null, '', '/auth/signin');
    
    // Force navigation
    window.location.replace('/auth/signin');
  }
};

export default routeUtils;
