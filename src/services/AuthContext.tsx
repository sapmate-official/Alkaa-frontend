import { userIdAtom } from "../store/atom";
import axios, { AxiosError } from "axios";
import { useAtom } from "jotai";
import React, { createContext, useState, useContext, useEffect } from "react";
import { User } from "../interface/general";
import { backendDomain } from "../lib/constant/Domain";
import { useNavigate } from "react-router-dom";
import Loader from "@/components/Loader";

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
    signIn: (email: string, password: string) => Promise<string | undefined>;
    // New multi-tenant auth methods
    checkEmail: (email: string) => Promise<{ singleOrganization?: boolean; multipleOrganizations?: boolean; organizations?: Organization[]; organization?: Organization }>;
    verifyPassword: (email: string, password: string, orgId?: string) => Promise<{ sessionToken: string; organizationName: string; otpExpiresIn: number }>;
    verifyOtp: (sessionToken: string, otpCode: string) => Promise<void>;
    selectOrganization: (organization: Organization, email: string) => void;
    resetAuthFlow: () => void;
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

            const response = await axios.get(`${backendDomain}/api/v1/general/validate-token`);
            
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
    
    const signIn = async (email: string, password: string) => {
        try {
            const response = await axios.post(
                `${backendDomain}/api/v1/general/login`, 
                { email, password }
            );
            
            if (response.status === 200) {
                if (response.data.accessToken && response.data.refreshToken) {
                    tokenStorage.setAccessToken(response.data.accessToken);
                    tokenStorage.setRefreshToken(response.data.refreshToken);
                    await validateToken();
                    return undefined; // No error
                }
                throw new Error("No tokens received");
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                if (axiosError.response?.status === 401) {
                    return (axiosError?.response?.data as { message: string })?.message || 
                           "Invalid email or password";
                }
                return "Unexpected login error";
            }
            return "Login failed";
        }
    };

    // New multi-tenant authentication methods
    const checkEmail = async (email: string) => {
        try {
            const response = await axios.post(`${backendDomain}/api/v1/general/check-email`, { email });
            
            if (response.data.singleOrganization) {
                setAuthStep({ 
                    step: 'password', 
                    data: { 
                        email, 
                        organization: response.data.organization 
                    } 
                });
                return { singleOrganization: true, organization: response.data.organization };
            } else if (response.data.multipleOrganizations) {
                setAuthStep({ 
                    step: 'organization', 
                    data: { 
                        email, 
                        organizations: response.data.organizations 
                    } 
                });
                return { 
                    multipleOrganizations: true, 
                    organizations: response.data.organizations 
                };
            }
            
            throw new Error('Invalid response from server');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Failed to check email');
            }
            throw error;
        }
    };

    const verifyPassword = async (email: string, password: string, orgId?: string) => {
        try {
            const response = await axios.post(`${backendDomain}/api/v1/general/verify-password`, {
                email,
                password,
                orgId
            });
            
            setAuthStep({ 
                step: 'otp', 
                data: { 
                    sessionToken: response.data.sessionToken,
                    organizationName: response.data.organizationName
                } 
            });
            
            return {
                sessionToken: response.data.sessionToken,
                organizationName: response.data.organizationName,
                otpExpiresIn: response.data.otpExpiresIn
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Failed to verify password');
            }
            throw error;
        }
    };

    const verifyOtp = async (sessionToken: string, otpCode: string) => {
        try {
            const response = await axios.post(`${backendDomain}/api/v1/general/verify-otp`, {
                sessionToken,
                otpCode
            });
            
            if (response.data.accessToken && response.data.refreshToken) {
                tokenStorage.setAccessToken(response.data.accessToken);
                tokenStorage.setRefreshToken(response.data.refreshToken);
                
                // Store organization context
                if (response.data.userData.orgId && response.data.userData.orgName) {
                    tokenStorage.setOrgData(response.data.userData.orgId, response.data.userData.orgName);
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

    const selectOrganization = (organization: Organization, email: string) => {
        setAuthStep({ 
            step: 'password', 
            data: { 
                email, 
                organization 
            } 
        });
    };

    const resetAuthFlow = () => {
        setAuthStep({ step: 'email' });
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
        signIn,
        checkEmail,
        verifyPassword,
        verifyOtp,
        selectOrganization,
        resetAuthFlow
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