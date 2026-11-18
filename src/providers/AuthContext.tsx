import { permissionListAtom, userIdAtom } from "../store/atom";
import { useAuthStore } from "../store/useAuthStore";
import axios, { AxiosError } from "axios";
import { useAtom } from "jotai";
import React, { createContext, useState, useContext, useEffect } from "react";
import { Permission, User } from "../types/general";
import { backendDomain } from "../constants/Domain";
import { useNavigate } from "react-router-dom";
import Loader from "@/components/Loader";

interface Organization {
    orgId: string;
    orgName: string;
    userId: string;
    userStatus: string;
}

export interface AuthStepData {
    email?: string;
    orgId?: string;
    sessionToken?: string;
    organizationName?: string;
    organization?: Organization;
    organizations?: Organization[];
    otpExpiresIn?: number;
    [key: string]: unknown;
}

interface AuthStep {
    step: 'email' | 'organization' | 'password' | 'otp' | 'complete';
    data?: AuthStepData;
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
    verifyPassword: (email: string, password: string, orgId?: string) => Promise<{ sessionToken?: string; organizationName?: string; otpExpiresIn?: number; [key: string]: unknown }>;
    verifyOtp: (sessionToken: string, otpCode: string) => Promise<void>;
    selectOrganization: (organization: Organization, email: string) => void;
    resetAuthFlow: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { tokenStorage, setOnUnauthorizedCallback, refreshSessionTokens } from "@/services/api/client";
export { tokenStorage };

const toPermissionList = (keys?: string[]): Permission[] =>
    (keys ?? []).map((key) => ({ key, name: key, module: '' } as Permission));

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authStep, setAuthStep] = useState<AuthStep>({ step: 'email' });
    const [, setUser_id] = useAtom(userIdAtom);
    const [, setPermissionList] = useAtom(permissionListAtom);
    const navigate = useNavigate();
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Wire unified API client unauthorized callback to navigate to signin
    useEffect(() => {
        setOnUnauthorizedCallback(() => {
            navigate('/auth/signin', { replace: true });
        });
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

            const response = await axios.get(`${backendDomain}/api/v1/general/validate-token`, {
                withCredentials: true
            });
            
            if (response.status === 200 && response.data.user) {
                const perms = toPermissionList(response.data.user.permissions);
                setUser(response.data.user);
                setUser_id(response.data.user.id ?? null);
                setPermissionList(perms);
                useAuthStore.getState().setUser(response.data.user);
                useAuthStore.getState().setPermissions(perms);
                return response.data.user;
            } else {
                throw new Error("Invalid token response");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const initializeAuth = async () => {
        try {
            const accessToken = tokenStorage.getAccessToken();
            const refreshToken = tokenStorage.getRefreshToken();

            if (!accessToken && !refreshToken) {
                setUser(null);
                setIsLoading(false);
                return;
            }

            // Check token expiration client-side first to avoid unnecessary API calls
            if (!accessToken || tokenStorage.isTokenExpired(accessToken)) {
                // Try to refresh token if we have a refresh token
                if (refreshToken && !tokenStorage.isTokenExpired(refreshToken)) {
                    try {
                        await refreshSessionTokens();
                        await validateToken();
                        setAuthStep({ step: 'complete' });
                    } catch {
                        tokenStorage.clearTokens();
                        setUser(null);
                    }
                } else {
                    tokenStorage.clearTokens();
                    setUser(null);
                }
            } else {
                await validateToken();
                setAuthStep({ step: 'complete' });
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
                { email, password },
                { withCredentials: true }
            );

            if (response.status === 200) {
                if (response.data.accessToken && response.data.refreshToken) {
                    tokenStorage.setAccessToken(response.data.accessToken);
                    tokenStorage.setRefreshToken(response.data.refreshToken);
                    if (response.data.organization?.id) {
                        tokenStorage.setOrgData(
                            response.data.organization.id,
                            response.data.organization.name
                        );
                    }
                    await validateToken();
                    setAuthStep({ step: 'complete' });
                    return undefined; // No error
                }
                if (response.data.requiresTwoFactor) {
                    setAuthStep({
                        step: 'otp',
                        data: {
                            email,
                            sessionToken: response.data.sessionToken
                        }
                    });
                    return undefined;
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
            const response = await axios.post(`${backendDomain}/api/v1/general/check-email`, { email }, {
                withCredentials: true
            });
            
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
            console.log(error);
            
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
            }, {
                withCredentials: true
            });

            // Direct login (e.g. SuperAdmin or direct token authentication without OTP)
            if (response.data.accessToken && response.data.refreshToken) {
                tokenStorage.setAccessToken(response.data.accessToken);
                tokenStorage.setRefreshToken(response.data.refreshToken);
                if (response.data.organization?.id) {
                    tokenStorage.setOrgData(response.data.organization.id, response.data.organization.name);
                }
                await validateToken();
                setAuthStep({ step: 'complete' });
                return response.data;
            }

            // Two-factor flow: the TS backend identifies the pending user by
            // email (+ optional orgId) and does not issue a temp session token.
            if (response.data.requiresTwoFactor || response.data.sessionToken) {
                setAuthStep({
                    step: 'otp',
                    data: {
                        email,
                        orgId,
                        sessionToken: response.data.sessionToken,
                        organizationName:
                            response.data.organizationName ||
                            response.data.organization?.name
                    }
                });

                return {
                    requiresTwoFactor: true,
                    sessionToken: response.data.sessionToken,
                    email: response.data.email ?? email,
                    userId: response.data.userId,
                    organizationName:
                        response.data.organizationName ||
                        response.data.organization?.name,
                    otpExpiresIn: response.data.otpExpiresIn
                };
            }

            throw new Error('Unexpected authentication response');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Failed to verify password');
            }
            throw error;
        }
    };

    const verifyOtp = async (sessionToken: string, otpCode: string) => {
        try {
            const pending = authStep.data ?? {};
            const response = await axios.post(`${backendDomain}/api/v1/general/verify-otp`, {
                sessionToken: sessionToken || pending.sessionToken || undefined,
                email: pending.email,
                orgId: pending.orgId,
                otpCode
            }, {
                withCredentials: true
            });

            if (response.data.accessToken && response.data.refreshToken) {
                tokenStorage.setAccessToken(response.data.accessToken);
                tokenStorage.setRefreshToken(response.data.refreshToken);

                // Store organization context
                if (response.data.organization?.id) {
                    tokenStorage.setOrgData(
                        response.data.organization.id,
                        response.data.organization.name
                    );
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
                    { refreshToken },
                    { withCredentials: true }
                );
            }
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            // Always clear tokens and user state
            setUser(null);
            setUser_id(null);
            setPermissionList([]);
            useAuthStore.getState().clearAuth();
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