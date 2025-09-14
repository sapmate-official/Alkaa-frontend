# Multi-Tenant Authentication Frontend Implementation

## Overview
This document outlines the frontend implementation of the multi-tenant authentication system for the Alkaa platform. The implementation provides a seamless user experience for both single-organization and multi-organization users.

## Architecture

### 1. Authentication Flow Steps
The authentication process follows these steps:
1. **Email Check** - User enters email, system determines organization associations
2. **Organization Selection** - If multiple organizations, user selects one
3. **Password Entry** - User enters password for the selected organization
4. **OTP Verification** - User verifies OTP sent to their email with organization branding
5. **Complete** - User is logged in with organization context

### 2. Component Structure

#### Core Components
- `AuthContext.tsx` - Enhanced context with multi-tenant support
- `MultiTenantLoginForm.tsx` - Main login component handling the flow
- `OrganizationSelector.tsx` - Component for selecting organization
- `OTPVerification.tsx` - Component for OTP input and verification
- `AuthDebugPanel.tsx` - Development tool for debugging auth state

#### Updated Files
- `SignIn.tsx` - Updated to use new multi-tenant login form
- `APIdict.ts` - Added new authentication endpoints

### 3. State Management

#### AuthContext Enhancements
```typescript
interface AuthStep {
    step: 'email' | 'organization' | 'password' | 'otp' | 'complete';
    data?: any;
}

interface AuthContextType {
    // Existing properties
    user: User | null;
    isLoading: boolean;
    authStep: AuthStep;
    
    // New multi-tenant methods
    checkEmail: (email: string) => Promise<EmailCheckResult>;
    verifyPassword: (email: string, password: string, orgId?: string) => Promise<PasswordResult>;
    verifyOtp: (sessionToken: string, otpCode: string) => Promise<void>;
    resetAuthFlow: () => void;
}
```

#### Token Storage Enhancements
```typescript
export const tokenStorage = {
    // Existing methods
    setAccessToken: (token: string) => void;
    getAccessToken: () => string | null;
    
    // New organization methods
    setOrgData: (orgId: string, orgName: string) => void;
    getOrgData: () => { orgId: string | null; orgName: string | null };
    
    // Enhanced clear method
    clearTokens: () => void; // Now also clears org data
}
```

### 4. API Integration

#### New Endpoints
```typescript
const APIDictionary = {
    checkEmail: `${backendDomain}/api/v1/general/check-email`,
    verifyPassword: `${backendDomain}/api/v1/general/verify-password`,
    verifyOtp: `${backendDomain}/api/v1/general/verify-otp`,
    // ... existing endpoints
}
```

#### Axios Interceptor Updates
- Automatically includes `orgId` in request headers
- Maintains backward compatibility with existing API calls
- Excludes organization header for authentication endpoints

### 5. User Experience Flow

#### Single Organization User
```
Email Entry → Password Entry → OTP Verification → Dashboard
```

#### Multi-Organization User
```
Email Entry → Organization Selection → Password Entry → OTP Verification → Dashboard
```

### 6. Component Features

#### MultiTenantLoginForm
- **Dynamic Steps**: Renders different UI based on authentication step
- **Progressive Enhancement**: Shows relevant information at each step
- **Error Handling**: Clear error messages for each step
- **Loading States**: Visual feedback during API calls
- **Navigation**: Easy back/forth navigation between steps

#### OrganizationSelector
- **Visual Organization Cards**: Clear display of available organizations
- **Status Indicators**: Shows user status in each organization
- **Selection State**: Visual feedback for selected organization
- **Accessibility**: Keyboard navigation and screen reader support

#### OTPVerification
- **6-Digit Input**: Individual input fields for each digit
- **Auto-advance**: Automatically moves to next field
- **Timer Display**: Shows remaining time for OTP validity
- **Resend Functionality**: Allows requesting new OTP
- **Auto-submit**: Submits when all digits are entered

### 7. Storage Strategy

#### Local Storage Items
```typescript
// Authentication tokens
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', token);

// Organization context
localStorage.setItem('orgId', orgId);
localStorage.setItem('orgName', orgName);
```

### 8. Error Handling

#### Error Types
- **Network Errors**: Connection issues, timeouts
- **Validation Errors**: Invalid email, weak password
- **Authentication Errors**: Wrong credentials, expired tokens
- **Authorization Errors**: Inactive organization, suspended user
- **OTP Errors**: Invalid code, expired code, too many attempts

#### Error Display
- **Step-specific Errors**: Errors shown relevant to current step
- **Clear Messaging**: User-friendly error messages
- **Recovery Actions**: Suggestions for resolving errors

### 9. Security Features

#### Client-side Security
- **Token Expiration Checks**: Prevents unnecessary API calls
- **Secure Storage**: Uses httpOnly cookies when available
- **XSS Protection**: Sanitized input handling
- **CSRF Protection**: Proper token handling

#### Organization Isolation
- **Context Switching**: Users can only access their organization's data
- **Token Binding**: Tokens are bound to specific organizations
- **API Isolation**: Organization context included in all requests

### 10. Development Tools

#### AuthDebugPanel
- **Current State Display**: Shows authentication step and user info
- **Token Information**: Access token presence and organization data
- **Quick Actions**: Logout and reset flow buttons
- **Development Only**: Should be removed in production builds

### 11. Backward Compatibility

#### Legacy Support
- **Old Login Form**: Still available if needed (`login-form.tsx`)
- **Existing API**: Original login endpoint still functional
- **Gradual Migration**: Can switch components as needed

### 12. Testing Considerations

#### Test Scenarios
1. **Single Organization Login**: Email → Password → OTP → Success
2. **Multi Organization Login**: Email → Selection → Password → OTP → Success
3. **Error Scenarios**: Invalid email, wrong password, expired OTP
4. **Navigation**: Back/forward between steps
5. **Token Refresh**: Automatic token renewal
6. **Organization Switching**: Logout and login to different org

#### Test Data Requirements
- Users with single organization association
- Users with multiple organization associations
- Organizations with different statuses (active/inactive)
- Users with different statuses (active/inactive/suspended)

### 13. Performance Optimizations

#### Loading States
- **Step-specific Loading**: Different loading messages for each step
- **Optimistic Updates**: UI updates before API confirmation where safe
- **Minimal Re-renders**: Efficient state management

#### API Optimization
- **Client-side Validation**: Reduces unnecessary API calls
- **Token Caching**: Efficient token storage and retrieval
- **Request Deduplication**: Prevents duplicate API calls

### 14. Accessibility

#### WCAG Compliance
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Contrast**: Meets WCAG AA standards
- **Focus Management**: Logical focus flow between elements

### 15. Browser Compatibility

#### Supported Browsers
- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile Browsers**: iOS Safari 13+, Chrome Mobile 80+
- **Fallbacks**: Graceful degradation for older browsers

### 16. Deployment Considerations

#### Environment Variables
```env
VITE_BACKEND_DOMAIN=https://api.alkaa.online
```

#### Build Configuration
- Remove debug components in production
- Optimize bundle size
- Enable source maps for debugging

### 17. Migration Guide

#### From Old Login System
1. Update SignIn component to use MultiTenantLoginForm
2. Test with existing users
3. Monitor error rates
4. Gradually migrate API calls to use organization context
5. Remove old login form when confident

### 18. Future Enhancements

#### Potential Improvements
- **Remember Organization**: Save last selected organization
- **SSO Integration**: Single Sign-On support
- **Biometric Authentication**: Fingerprint/Face ID support
- **Progressive Web App**: Offline capability
- **Push Notifications**: Real-time login notifications

## Quick Start

### For Developers
1. The new login system is automatically enabled in the SignIn page
2. Use the AuthDebugPanel component during development
3. Test with both single and multi-organization users
4. Verify organization context is properly stored and used

### For Testing
1. Create test users with single organization association
2. Create test users with multiple organization associations
3. Test the complete flow: Email → Organization → Password → OTP
4. Verify error handling for each step
5. Test token refresh and logout functionality

The implementation maintains backward compatibility while providing a modern, secure, and user-friendly authentication experience for multi-tenant scenarios.
