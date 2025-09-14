/**
 * Utility functions for testing authentication flows
 * These functions can be used in development to verify auth behavior
 */

import { tokenStorage } from '@/providers/AuthContext';
import { routeUtils } from './routeUtils';

export const authTestUtils = {
  /**
   * Test unauthenticated access to protected routes
   */
  testUnauthenticatedAccess: () => {
    console.log('🔒 Testing unauthenticated access...');
    
    // Clear tokens to simulate unauthenticated state
    tokenStorage.clearTokens();
    
    // Try to access a protected route
    window.location.href = '/p/dashboard';
    
    // Should redirect to login page
    console.log('Expected: Redirect to /auth/signin');
  },

  /**
   * Test logout behavior and routing stack clearing
   */
  testLogoutBehavior: () => {
    console.log('🚪 Testing logout behavior...');
    
    // Navigate to logout
    window.location.href = '/p/logout';
    
    // Should clear tokens and redirect to login
    console.log('Expected: Clear tokens and redirect to /auth/signin');
    console.log('Expected: Back button should not return to protected routes');
  },

  /**
   * Test authentication state
   */
  checkAuthState: () => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    const orgData = tokenStorage.getOrgData();
    
    console.log('🔍 Current Authentication State:');
    console.log('Access Token:', accessToken ? '✅ Present' : '❌ Missing');
    console.log('Refresh Token:', refreshToken ? '✅ Present' : '❌ Missing');
    console.log('Organization Data:', orgData.orgId ? `✅ ${orgData.orgName} (${orgData.orgId})` : '❌ Missing');
    console.log('Current Route:', window.location.pathname);
    console.log('Is Protected Route:', routeUtils.isProtectedRoute(window.location.pathname));
    console.log('Is Public Route:', routeUtils.isPublicRoute(window.location.pathname));
    
    return {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasOrgData: !!orgData.orgId,
      currentRoute: window.location.pathname,
      isProtectedRoute: routeUtils.isProtectedRoute(window.location.pathname),
      isPublicRoute: routeUtils.isPublicRoute(window.location.pathname)
    };
  },

  /**
   * Simulate token expiration
   */
  simulateTokenExpiration: () => {
    console.log('⏰ Simulating token expiration...');
    
    // Set an expired token
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
    tokenStorage.setAccessToken(expiredToken);
    
    // Make an API request - should trigger automatic refresh or logout
    console.log('Expected: Automatic token refresh attempt or logout');
  },

  /**
   * Clear all authentication data
   */
  clearAuthData: () => {
    console.log('🧹 Clearing all authentication data...');
    tokenStorage.clearTokens();
    sessionStorage.clear();
    console.log('✅ Authentication data cleared');
  }
};

// Make utilities available globally in development
if (import.meta.env.DEV) {
  (window as any).authTestUtils = authTestUtils;
  console.log('🔧 Auth test utilities available at window.authTestUtils');
}
