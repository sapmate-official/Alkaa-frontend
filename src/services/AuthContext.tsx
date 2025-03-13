import { userIdAtom } from "../store/atom";
import axios, { AxiosError } from "axios";
import { useAtom } from "jotai";
import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { User } from "../interface/general";
import { backendDomain } from "../lib/constant/Domain";
import { useNavigate } from "react-router-dom";
import debounce from 'lodash/debounce';
import Loader from "@/components/Loader";


interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    logout: () => void;
    reinitializeAuth: () => void;
    signIn: (email: string, password: string) => Promise<string | undefined>;
}

// Create a custom event name
const AUTH_REVALIDATE_EVENT = 'auth-revalidate';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const enhancedLocalStorage = {
    setItem: (key: string, value: string) => {
        localStorage.setItem(key, value);
        if (key === 'accessToken' || key === 'refreshToken') {
            window.dispatchEvent(new CustomEvent(AUTH_REVALIDATE_EVENT));
        }
    },
    removeItem: (key: string) => {
        localStorage.removeItem(key);
    },
    getItem: (key: string) => localStorage.getItem(key),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [ ,setUser_id] = useAtom<number | null>(userIdAtom);
    const navigate = useNavigate();
    const [isInitialized, setIsInitialized] = useState(false);
    const debouncedValidateToken = useCallback(
        debounce(async (token: string) => {
            await validateToken(token);
        }, 1000, { leading: true, trailing: false }),
        []
    );
    const initializeAuth = async () => {
        try {
            const token = enhancedLocalStorage.getItem("accessToken");
            if (token) {
                await debouncedValidateToken(token);
            } else {
                setUser(null);
                navigate('/auth/signin');
            }
        } finally {
            setIsLoading(false);
            setIsInitialized(true);
        }
    };
    const signIn = async (email: string, password: string) => {
        try {
            const response = await axios.post(`${backendDomain}/api/v1/general/login`, {
                email,
                password
            }, { withCredentials: true });
            console.log(response);
            if (response.status === 200 && response.data.accessToken && response.data.refreshToken) {
                enhancedLocalStorage.setItem("accessToken", response.data.accessToken);
                enhancedLocalStorage.setItem("refreshToken", response.data.refreshToken);
                await validateToken(response.data.accessToken);
            } else {
                throw new Error("Invalid login response");
            }
        } catch (error) {
            
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                if (axiosError.response?.status === 401) {
                    console.error("Invalid email or password");
                    
                    return (axiosError?.response?.data as { message: string })?.message || "Invalid email or password";
                } else {
                    console.error("Login error:", error);
                    return "Unexpected login error";
                }
            }
        }
    }

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
        const accessToken = enhancedLocalStorage.getItem("accessToken");
        const refreshToken = enhancedLocalStorage.getItem("refreshToken");
        
        if (accessToken && refreshToken) {
            try {
                const response = await axios.post(
                    `${backendDomain}/api/v1/general/logout`, 
                    { refreshToken }, // Send refresh token in body
                    {
                        headers: { Authorization: `Bearer ${accessToken}` },
                        withCredentials: true
                    }
                );
                
                if(response.status === 200) {
                    setUser(null);
                    enhancedLocalStorage.removeItem("accessToken");
                    enhancedLocalStorage.removeItem("refreshToken");
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Logout error:", error);
                // Still clear tokens on frontend in case of backend error
                setUser(null);
                enhancedLocalStorage.removeItem("accessToken");
                enhancedLocalStorage.removeItem("refreshToken");
                setIsLoading(false);
                navigate('/auth/signin');
            }
        }
    };
    const validateToken = async (token: string) => {
        try {
            // Include the refresh token in authorization headers as well
            // const refreshToken = enhancedLocalStorage.getItem("refreshToken");
            
            const response = await axios.get(`${backendDomain}/api/v1/general/validate-token`, {
                headers: { 
                    Authorization: `Bearer ${token}`
                },
                withCredentials: true // This sends cookies if available, but we don't rely solely on them
            });
            
            if (response.status === 200 && response.data.user) {
                const updates = () => {
                    setUser(response.data.user);
                    setUser_id(response.data.user?.userId);
                    setIsLoading(false);
                };
                updates();
            } else {
                throw new Error("Invalid token response");
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    if (error.response.data?.message === "Organization is inactive") {
                        setUser(null);
                        logout();
                        navigate('/auth/signin', { 
                            state: { error: "Your organization is inactive. Please contact administrator." }
                        });
                        return;
                    }
                    
                    // This is the critical part - attempt refresh with token from localStorage
                    const currentPath = window.location.pathname;
                    if (!currentPath.includes('/auth/signin')) {
                        await refreshToken();
                    } else {
                        setUser(null);
                        setIsLoading(false);
                    }
                } else {
                    console.error("Token validation error:", error);
                    logout();
                    navigate('/auth/signin');
                }
            }
        }
    };

    const refreshToken = async () => {
        const refreshTokenValue = enhancedLocalStorage.getItem("refreshToken");
        if (!refreshTokenValue) {
            logout();
            return;
        }
    
        try {
            // Include token both in body and authorization header for maximum compatibility
            const response = await axios.post(
                `${backendDomain}/api/v1/general/refresh-token`, 
                { refreshToken: refreshTokenValue },  // Include in body
                {
                    headers: { Authorization: `Bearer ${refreshTokenValue}` }, // Include in header
                    withCredentials: true
                }
            );
            
            if (response.status === 200 && response.data.accessToken && response.data.refreshToken) {
                enhancedLocalStorage.setItem("accessToken", response.data.accessToken);
                enhancedLocalStorage.setItem("refreshToken", response.data.refreshToken);
                await validateToken(response.data.accessToken);
            } else {
                throw new Error("Invalid refresh token response");
            }
        } catch (error) {
            console.error("Token refresh error:", error);
            logout();
        }
    };

    const contextValue: AuthContextType = {
        user,
        isLoading,
        logout,
        reinitializeAuth: initializeAuth,
        signIn: signIn
    };
    if (!isInitialized) {
        return <Loader/>; // or a loading spinner
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