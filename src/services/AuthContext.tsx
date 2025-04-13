import { userIdAtom } from "../store/atom";
import axios, { AxiosError } from "axios";
import { useAtom } from "jotai";
import React, { createContext, useState, useContext, useEffect } from "react";
import { User } from "../interface/general";
import { backendDomain } from "../lib/constant/Domain";
import { useNavigate } from "react-router-dom";
import Loader from "@/components/Loader";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    logout: () => void;
    reinitializeAuth: () => void;
    signIn: (email: string, password: string) => Promise<string | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple token storage with events
export const tokenStorage = {
    setAccessToken: (token: string) => localStorage.setItem('accessToken', token),
    getAccessToken: () => localStorage.getItem('accessToken'),
    setRefreshToken: (token: string) => localStorage.setItem('refreshToken', token),
    getRefreshToken: () => localStorage.getItem('refreshToken'),
    clearTokens: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
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
                    // If refresh fails, redirect to login
                    tokenStorage.clearTokens();
                    navigate('/auth/signin');
                    return Promise.reject(refreshError);
                }
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
            if (tokenStorage.getAccessToken()) {
                await validateToken();
            } else {
                setUser(null);
                navigate('/auth/signin');
            }
        } catch (error) {
            console.error("Auth initialization error:", error);
            // For non-401 errors, we may want to show a message
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
            tokenStorage.clearTokens();
            setIsLoading(false);
            navigate('/auth/signin');
        }
    };

    const contextValue: AuthContextType = {
        user,
        isLoading,
        logout,
        reinitializeAuth: initializeAuth,
        signIn
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