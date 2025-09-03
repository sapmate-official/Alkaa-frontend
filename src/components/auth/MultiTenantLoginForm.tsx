import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/services/AuthContext";
import { Eye, EyeOff, ArrowLeft, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OrganizationSelector } from "@/components/auth/OrganizationSelector";
import { OTPVerification } from "@/components/auth/OTPVerification";

interface Organization {
    orgId: string;
    orgName: string;
    userId: string;
    userStatus: string;
}

export function MultiTenantLoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const { authStep, checkEmail, verifyPassword, verifyOtp, selectOrganization, resetAuthFlow } = useAuth();
    const navigate = useNavigate();
    
    // Form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    
    // Multi-tenant states
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
    const [sessionToken, setSessionToken] = useState("");
    const [organizationName, setOrganizationName] = useState("");
    const [otpExpiresIn, setOtpExpiresIn] = useState(600);

    // Reset error when step changes
    useEffect(() => {
        setError("");
    }, [authStep.step]);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError("Please enter your email address");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const result = await checkEmail(email.trim());
            
            if (result.singleOrganization && result.organization) {
                setSelectedOrganization(result.organization);
            } else if (result.multipleOrganizations && result.organizations) {
                setOrganizations(result.organizations);
            }
        } catch (err: any) {
            setError(err.message || "Failed to check email");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOrganizationSelect = (orgId: string) => {
        const org = organizations.find(o => o.orgId === orgId);
        if (org) {
            setSelectedOrganization(org);
            selectOrganization(org, email);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) {
            setError("Please enter your password");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const result = await verifyPassword(
                email.trim(), 
                password, 
                selectedOrganization?.orgId
            );
            
            setSessionToken(result.sessionToken);
            setOrganizationName(result.organizationName);
            setOtpExpiresIn(result.otpExpiresIn);
        } catch (err: any) {
            setError(err.message || "Failed to verify password");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOTPVerify = async (otpCode: string) => {
        setIsLoading(true);
        setError("");

        try {
            await verifyOtp(sessionToken, otpCode);
            // Navigation will be handled by the AuthContext after successful login
        } catch (err: any) {
            setError(err.message || "Failed to verify OTP");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        if (authStep.step === 'organization' || authStep.step === 'password') {
            resetAuthFlow();
            setEmail("");
            setPassword("");
            setOrganizations([]);
            setSelectedOrganization(null);
        } else if (authStep.step === 'otp') {
            resetAuthFlow();
            // Go back to appropriate step based on organization count
            if (organizations.length > 1) {
                // Will trigger organization selection
                checkEmail(email);
            } else {
                // Will trigger password step
                checkEmail(email);
            }
        }
    };

    // Render different steps based on auth flow
    if (authStep.step === 'organization') {
        return (
            <div className={cn("flex flex-col gap-6", className)} {...props}>
                <OrganizationSelector
                    organizations={organizations}
                    email={email}
                    onSelect={handleOrganizationSelect}
                    onBack={handleBack}
                    isLoading={isLoading}
                />
            </div>
        );
    }

    if (authStep.step === 'otp') {
        return (
            <div className={cn("flex flex-col gap-6", className)} {...props}>
                <OTPVerification
                    organizationName={organizationName}
                    otpExpiresIn={otpExpiresIn}
                    onVerify={handleOTPVerify}
                    onBack={handleBack}
                    isLoading={isLoading}
                    error={error}
                />
            </div>
        );
    }

    // Email step or Password step
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form 
                        className="p-6 md:p-8" 
                        onSubmit={authStep.step === 'email' ? handleEmailSubmit : handlePasswordSubmit}
                    >
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                {authStep.step === 'password' ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleBack}
                                        className="h-8 w-8"
                                        disabled={isLoading}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => navigate("/")}
                                        className="h-8 w-8"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        <span className="sr-only">Go back to home</span>
                                    </Button>
                                )}
                            </div>
                            
                            <div className="flex flex-col items-center text-center">
                                <img src="/logo.svg" alt="Alkaa Logo" className="h-16 w-auto mb-4" />
                                <h1 className="text-2xl font-semibold">
                                    {authStep.step === 'email' ? 'Welcome Back' : 'Enter Password'}
                                </h1>
                                <p className="text-muted-foreground mt-2">
                                    {authStep.step === 'email' 
                                        ? 'Enter your email to continue' 
                                        : `Enter your password for ${selectedOrganization?.orgName || 'your account'}`
                                    }
                                </p>
                            </div>

                            {/* Email Field */}
                            {authStep.step === 'email' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email address"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={isLoading}
                                            className="pl-10"
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Password Field */}
                            {authStep.step === 'password' && (
                                <>
                                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                                        <p className="text-sm text-muted-foreground">
                                            <strong>{email}</strong> at <strong>{selectedOrganization?.orgName}</strong>
                                        </p>
                                    </div>
                                    
                                    <div className="grid gap-2">
                                        <div className="flex items-center">
                                            <Label htmlFor="password">Password</Label>
                                            <a
                                                href="#"
                                                className="ml-auto text-sm underline-offset-2 hover:underline"
                                            >
                                                Forgot password?
                                            </a>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                disabled={isLoading}
                                                className="pl-10 pr-10"
                                                autoComplete="current-password"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3 py-2"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {error && (
                                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading 
                                    ? (authStep.step === 'email' ? "Checking..." : "Verifying...") 
                                    : (authStep.step === 'email' ? "Continue" : "Send OTP")
                                }
                            </Button>
                        </div>
                    </form>
                    
                    <div className="relative hidden bg-muted md:block">
                        <img
                            src="/login_cover.jpg"
                            alt="Login Background"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.9]"
                        />
                    </div>
                </CardContent>
            </Card>
            
            <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
                By continuing, you agree to our <a href="#">Terms of Service</a>{" "}
                and <a href="#">Privacy Policy</a>.
            </div>
        </div>
    );
}
