import { userIdAtom } from "../store/atom";
import axios from "axios";
import { useAtom } from "jotai";
import React, { createContext, useState, useContext, useEffect } from "react";
import { User } from "../types/general";
import { backendDomain } from "../constants/Domain";
import { useNavigate } from "react-router-dom";
import Loader from "@/components/Loader";

axios.defaults.withCredentials = true;

interface Organization {
    orgId: string;
    orgName: string;
    userId: string;
    userStatus: string;
}

interface AuthStep {
    step: 'email' | 'organization' | 'password' | 'otp' | 'complete';
    data?: any;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    authStep: AuthStep;
    logout: () => void;
    reinitializeAuth: () => void;
    // Enhanced Multi-tenant + 2FA auth methods (UNIFIED - CORRECTED)
    discoverOrganizations: (email: string) => Promise<{ organizations?: Organization[]; message: string; requiresPasswordReset?: boolean; singleInactiveOrganization?: any }>;
    verifyCredentials: (email: string, password: string, orgId: string) => Promise<{ requiresOTP?: boolean; sessionToken?: string; organizationName?: string; requiresPasswordReset?: boolean; message?: string }>;
    requestOtp: (sessionToken: string) => Promise<{ expiresIn: number }>;
    verifyLoginOtp: (sessionToken: string, otp: string) => Promise<void>;
    resendOtp: (sessionToken: string) => Promise<{ expiresIn: number }>;
    resetAuthFlow: () => void;
    progressToPasswordStep: () => void;
    // Inactive user password reset methods
    requestResetOtp: (email: string, orgId: string) => Promise<{ expiresIn: number; maskedEmail: string }>;
    verifyResetOtp: (email: string, orgId: string, otp: string) => Promise<{ verificationToken: string; userDetails: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple token storage with events
export const tokenStorage = {
    setAccessToken: (token: string) => localStorage.setItem('accessToken', token),
    getAccessToken: () => localStorage.getItem('accessToken'),
    setRefreshToken: (token: string) => localStorage.setItem('refreshToken', token),
    getRefreshToken: () => localStorage.getItem('refreshToken'),
    setOrgData: (orgId: string, orgName: string) => {
        localStorage.setItem('orgId', orgId);
        localStorage.setItem('orgName', orgName);
    },
    getOrgData: () => ({
        orgId: localStorage.getItem('orgId'),
        orgName: localStorage.getItem('orgName')
    }),
    clearTokens: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('orgId');
        localStorage.removeItem('orgName');
    },
    isTokenExpired: (token: string) => {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
        } catch (e) {
            return true;
        }
    }
};

// Configure axios interceptors
const setupAxiosInterceptors = (navigate: ReturnType<typeof useNavigate>) => {
    // Request interceptor
    axios.interceptors.request.use(
        (config) => {
            const accessToken = tokenStorage.getAccessToken();
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
            
            // Add orgId to headers for organization-specific requests
            const { orgId } = tokenStorage.getOrgData();
            if (orgId && !config.url?.includes('/auth/') && !config.url?.includes('/general/')) {
                config.headers['X-Org-Id'] = orgId;
            }
            
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor for automatic token refresh
    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            
            // If error is 401 and not a retry and we have a refresh token
            if (error.response?.status === 401 && !originalRequest._retry && tokenStorage.getRefreshToken()) {
                originalRequest._retry = true;
                
                try {
                    // Get new tokens
                    const refreshToken = tokenStorage.getRefreshToken();
                    const response = await axios.post(
                        `${backendDomain}/api/v1/general/refresh-token`,
                        { refreshToken },
                        { headers: { Authorization: `Bearer ${refreshToken}` } }
                    );

                    if (response.data.accessToken && response.data.refreshToken) {
                        tokenStorage.setAccessToken(response.data.accessToken);
                        tokenStorage.setRefreshToken(response.data.refreshToken);
                        
                        // Update header and retry
                        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                        return axios(originalRequest);
                    }
                } catch (refreshError) {
                    // If refresh fails, clear tokens and redirect to login
                    tokenStorage.clearTokens();
                    // Clear browser history and force navigation to login
                    window.history.replaceState(null, '', '/auth/signin');
                    navigate('/auth/signin', { replace: true });
                    return Promise.reject(refreshError);
                }
            }
            
            // For any 401 error (including when refresh token is not available)
            if (error.response?.status === 401) {
                tokenStorage.clearTokens();
                window.history.replaceState(null, '', '/auth/signin');
                navigate('/auth/signin', { replace: true });
            }
            
            return Promise.reject(error);
        }
    );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authStep, setAuthStep] = useState<AuthStep>({ step: 'email' });
    const [, setUser_id] = useAtom<number | null>(userIdAtom);
    const navigate = useNavigate();
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Setup axios interceptors
    useEffect(() => {
        setupAxiosInterceptors(navigate);
    }, [navigate]);

    const validateToken = async () => {
        try {
            const accessToken = tokenStorage.getAccessToken();
            if (!accessToken) {
                throw new Error("No access token");
            }
            
            // Check token expiration client-side first to avoid unnecessary API calls
            if (tokenStorage.isTokenExpired(accessToken)) {
                throw new Error("Token expired");
            }

            const response = await axios.get(`${backendDomain}/api/v1/auth/validate-token`);
            
            if (response.status === 200 && response.data.user) {
                setUser(response.data.user);
                setUser_id(response.data.user?.userId);
                return response.data.user;
            } else {
                throw new Error("Invalid token response");
            }
        } catch (error) {
            // Don't need explicit error handling here as axios interceptor will handle 401s
            // Just rethrow for the caller to handle other errors
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const initializeAuth = async () => {
        try {
            const accessToken = tokenStorage.getAccessToken();
            if (!accessToken) {
                setUser(null);
                setIsLoading(false);
                return;
            }

            // Check token expiration client-side first to avoid unnecessary API calls
            if (tokenStorage.isTokenExpired(accessToken)) {
                // Try to refresh token if we have a refresh token
                const refreshToken = tokenStorage.getRefreshToken();
                if (refreshToken && !tokenStorage.isTokenExpired(refreshToken)) {
                    try {
                        const response = await axios.post(
                            `${backendDomain}/api/v1/general/refresh-token`,
                            { refreshToken },
                            { headers: { Authorization: `Bearer ${refreshToken}` } }
                        );

                        if (response.data.accessToken && response.data.refreshToken) {
                            tokenStorage.setAccessToken(response.data.accessToken);
                            tokenStorage.setRefreshToken(response.data.refreshToken);
                            await validateToken();
                        } else {
                            throw new Error("Invalid refresh response");
                        }
                    } catch (refreshError) {
                        tokenStorage.clearTokens();
                        setUser(null);
                    }
                } else {
                    tokenStorage.clearTokens();
                    setUser(null);
                }
            } else {
                await validateToken();
            }
        } catch (error) {
            console.error("Auth initialization error:", error);
            if (axios.isAxiosError(error) && error.response?.status !== 401) {
                console.error("Error during authentication:", error.response?.data?.message);
            }
        } finally {
            setIsLoading(false);
            setIsInitialized(true);
        }
    };
    




    const resetAuthFlow = () => {
        setAuthStep({ step: 'email' });
    };

    const progressToPasswordStep = () => {
        setAuthStep({ step: 'password' });
    };

    // Enhanced Multi-tenant + 2FA authentication methods (CORRECTED)
    const discoverOrganizations = async (email: string) => {
        try {
            const response = await axios.post(`${backendDomain}/api/v1/auth/discover-organizations`, {
                email
            });
            
            if (response.data.requiresPasswordReset && response.data.singleInactiveOrganization) {
                // Single inactive organization - initiate reset flow immediately
                return {
                    requiresPasswordReset: true,
                    singleInactiveOrganization: response.data.singleInactiveOrganization,
                    message: response.data.message
                };
            }
            
            if (response.data.organizations) {
                if (response.data.organizations.length === 1) {
                    // Single organization - automatically set and progress to password
                    setAuthStep({ 
                        step: 'password', 
                        data: { 
                            email, 
                            selectedOrganization: response.data.organizations[0]
                        } 
                    });
                } else {
                    // Multiple organizations - show selection
                    setAuthStep({ 
                        step: 'organization', 
                        data: { 
                            email, 
                            organizations: response.data.organizations 
                        } 
                    });
                }
                
                return {
                    organizations: response.data.organizations,
                    message: response.data.message
                };
            }
            
            throw new Error('No organizations found');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Failed to find organizations');
            }
            throw error;
        }
    };

    const requestResetOtp = async (email: string, orgId: string) => {
        try {
            const response = await axios.post(`${backendDomain}/api/v1/auth/request-reset-otp`, {
                email,
                orgId
            });
            
            return {
                expiresIn: response.data.expiresIn || 600,
                maskedEmail: response.data.maskedEmail
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Failed to request reset OTP');
            }
            throw error;
        }
    };

    const verifyResetOtp = async (email: string, orgId: string, otp: string) => {
        try {
            const response = await axios.post(`${backendDomain}/api/v1/auth/verify-reset-otp`, {
                email,
                orgId,
                otp
            });
            
            return {
                verificationToken: response.data.verificationToken,
                userDetails: response.data.userDetails
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Failed to verify reset OTP');
            }
            throw error;
        }
    };

    const verifyCredentials = async (email: string, password: string, orgId: string) => {
        try {
            const response = await axios.post(`${backendDomain}/api/v1/auth/verify-credentials`, {
                email,
                password,
                orgId
            });
            
            if (response.data.requiresOTP) {
                setAuthStep({ 
                    step: 'otp', 
                    data: { 
                        sessionToken: response.data.sessionToken,
                        organizationName: response.data.organizationName
                    } 
                });
                return {
                    requiresOTP: true,
                    sessionToken: response.data.sessionToken,
                    organizationName: response.data.organizationName
                };
            } else {
                // Login completed without 2FA
                if (response.data.accessToken && response.data.refreshToken) {
                    tokenStorage.setAccessToken(response.data.accessToken);
                    tokenStorage.setRefreshToken(response.data.refreshToken);
                    
                    // Store organization context
                    if (response.data.user.orgId && response.data.organization?.name) {
                        tokenStorage.setOrgData(response.data.user.orgId, response.data.organization.name);
                    }
                    
                    await validateToken();
                    setAuthStep({ step: 'complete' });
                }
                return { requiresOTP: false };
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // Check if it's an inactive user error that requires password reset
                if (error.response?.status === 403 && 
                    error.response?.data?.error === 'ACCOUNT_INACTIVE' && 
                    error.response?.data?.requiresPasswordReset) {
                    
                    const { verificationToken, userDetails } = error.response.data;
                    
                    // Navigate to password reset page with the token
                    navigate(`/reset-password/${verificationToken}`, { 
                        replace: true,
                        state: { 
                            userEmail: userDetails.email,
                            userName: userDetails.firstName,
                            orgName: userDetails.orgName,
                            isInactiveUserReset: true
                        }
                    });
                    
                    // Reset auth flow after navigation
                    setAuthStep({ step: 'email' });
                    
                    return {
                        requiresPasswordReset: true,
                        message: error.response.data.message
                    };
                }
                
                throw new Error(error.response?.data?.message || 'Failed to verify credentials');
            }
            throw error;
        }
    };

    const requestOtp = async (sessionToken: string) => {
        try {
            const response = await axios.post(`${backendDomain}/api/v1/auth/request-otp`, {
                sessionToken
            });
            
            return {
                expiresIn: response.data.expiresIn || 600
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Failed to request OTP');
            }
            throw error;
        }
    };

    const verifyLoginOtp = async (sessionToken: string, otp: string) => {
        try {
            const response = await axios.post(`${backendDomain}/api/v1/auth/verify-login-otp`, {
                sessionToken,
                otp
            });
            
            if (response.data.accessToken && response.data.refreshToken) {
                tokenStorage.setAccessToken(response.data.accessToken);
                tokenStorage.setRefreshToken(response.data.refreshToken);
                
                // Store organization context
                if (response.data.userData.orgId && response.data.organization?.name) {
                    tokenStorage.setOrgData(response.data.userData.orgId, response.data.organization.name);
                }
                
                await validateToken();
                setAuthStep({ step: 'complete' });
            } else {
                throw new Error('No tokens received');
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Failed to verify OTP');
            }
            throw error;
        }
    };

    const resendOtp = async (sessionToken: string) => {
        try {
            const response = await axios.post(`${backendDomain}/api/v1/auth/resend-otp`, {
                sessionToken
            });
            
            return {
                expiresIn: response.data.expiresIn || 600
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Failed to resend OTP');
            }
            throw error;
        }
    };

    useEffect(() => {
        let isSubscribed = true;
        
        const handleAuth = async () => {
            if (!isSubscribed || isInitialized) return;
            await initializeAuth();
        };
    
        handleAuth();
        
        return () => {
            isSubscribed = false;
        };
    }, [isInitialized]);

    const logout = async () => {
        try {
            const refreshToken = tokenStorage.getRefreshToken();
            if (refreshToken) {
                await axios.post(
                    `${backendDomain}/api/v1/general/logout`,
                    { refreshToken }
                );
            }
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            // Always clear tokens and user state
            setUser(null);
            setUser_id(null);
            tokenStorage.clearTokens();
            setIsLoading(false);
            setAuthStep({ step: 'email' });
            
            // Clear browser history and navigate to login
            // Use replace state to prevent back button access
            window.history.replaceState(null, '', '/auth/signin');
            // Navigate to login page using React Router with replace: true to clear stack
            navigate('/auth/signin', { replace: true });
        }
    };

    const contextValue: AuthContextType = {
        user,
        isLoading,
        authStep,
        logout,
        reinitializeAuth: initializeAuth,
        // Enhanced Multi-tenant + 2FA methods (CORRECTED)
        discoverOrganizations,
        verifyCredentials,
        requestOtp,
        verifyLoginOtp,
        resendOtp,
        resetAuthFlow,
        progressToPasswordStep,
        // Inactive user password reset methods
        requestResetOtp,
        verifyResetOtp
    };
    
    if (!isInitialized) {
        return <Loader/>;
    }

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};