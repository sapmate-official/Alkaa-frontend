import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/AuthContext";
import { Eye, EyeOff, ArrowLeft, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OrganizationSelector } from "@/components/auth/OrganizationSelector";
import { OTPVerification } from "@/components/auth/OTPVerification";

interface Organization {
    orgId: string;
    orgName: string;
    userId: string;
    userStatus: string;
    hasInactiveUser?: boolean;
}

export function MultiTenantLoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const { 
        authStep, 
        // Enhanced methods (UNIFIED - CORRECTED)
        discoverOrganizations,
        verifyCredentials, 
        requestOtp,
        resendOtp,
        verifyLoginOtp, 
        resetAuthFlow,
        progressToPasswordStep,
        // Inactive user password reset methods
        requestResetOtp,
        verifyResetOtp
    } = useAuth();
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
    
    // Reset OTP states
    const [resetOtpStep, setResetOtpStep] = useState<'request' | 'verify' | null>(null);
    const [resetOrgData, setResetOrgData] = useState<any>(null);

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

        setError("");
        setIsLoading(true);
        
        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError("Please enter a valid email address");
            setIsLoading(false);
            return;
        }

        try {
            // Step 1: Discover organizations for this email
            const result = await discoverOrganizations(email.trim());
            
            // Check if it's a single inactive organization requiring password reset
            if (result.requiresPasswordReset && result.singleInactiveOrganization) {
                // Set reset data and show reset OTP step
                setResetOrgData(result.singleInactiveOrganization);
                setResetOtpStep('request');
                return;
            }
            
            if (result.organizations) {
                setOrganizations(result.organizations);
                
                if (result.organizations.length === 1) {
                    // Single organization - automatically set it
                    setSelectedOrganization(result.organizations[0]);
                }
                // The authStep progression is handled by discoverOrganizations
            }
        } catch (err: any) {
            setError(err.message || "Failed to find organizations for this email");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOrganizationSelect = (orgId: string) => {
        const org = organizations.find(o => o.orgId === orgId);
        if (org) {
            setSelectedOrganization(org);
            
            // Check if this organization has an inactive user
            if (org.hasInactiveUser) {
                // Set up for reset OTP flow
                setResetOrgData(org);
                setResetOtpStep('request');
            } else {
                // Progress to password step for active users
                progressToPasswordStep();
            }
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) {
            setError("Please enter your password");
            return;
        }

        if (!selectedOrganization?.orgId) {
            setError("Organization selection is required");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // Step 2: Verify credentials for specific organization
            const result = await verifyCredentials(
                email.trim(), 
                password, 
                selectedOrganization.orgId
            );
            
            if (result.requiresPasswordReset) {
                // The AuthContext has already handled navigation to reset password page
                console.log('User redirected to password reset page due to inactive account');
                return;
            }
            
            if (result.requiresOTP && result.sessionToken) {
                // Handle 2FA requirement
                setSessionToken(result.sessionToken);
                setOrganizationName(result.organizationName || 'Unknown Organization');
                
                // Request OTP after successful credential verification
                try {
                    const otpResult = await requestOtp(result.sessionToken);
                    setOtpExpiresIn(otpResult.expiresIn || 600);
                } catch (otpErr: any) {
                    console.error('Failed to request OTP:', otpErr);
                    setError(otpErr.message || "Failed to send OTP. Please try again.");
                    return; // Don't proceed to OTP step if OTP request failed
                }
            } else {
                // Login completed without 2FA - navigation will be handled by AuthContext
                console.log('Login completed without 2FA');
            }
        } catch (err: any) {
            setError(err.message || "Failed to verify credentials");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOTPVerify = async (otpCode: string) => {
        setIsLoading(true);
        setError("");

        try {
            // Use enhanced verifyLoginOtp method
            await verifyLoginOtp(sessionToken, otpCode);
            // Navigation will be handled by the AuthContext after successful login
        } catch (err: any) {
            setError(err.message || "Failed to verify OTP");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (!sessionToken) {
            setError("Session expired. Please start over.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const result = await resendOtp(sessionToken);
            setOtpExpiresIn(result.expiresIn || 600);
        } catch (err: any) {
            setError(err.message || "Failed to resend OTP");
        } finally {
            setIsLoading(false);
        }
    };

    // Reset OTP handlers
    const handleRequestResetOtp = async () => {
        if (!resetOrgData || !email) {
            setError("Missing organization or email data");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const result = await requestResetOtp(email.trim(), resetOrgData.orgId);
            setOtpExpiresIn(result.expiresIn || 600);
            setResetOtpStep('verify');
        } catch (err: any) {
            setError(err.message || "Failed to send reset OTP");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyResetOtp = async (otpCode: string) => {
        if (!resetOrgData || !email) {
            setError("Missing organization or email data");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const result = await verifyResetOtp(email.trim(), resetOrgData.orgId, otpCode);
            
            // Navigate to password reset page with the token
            navigate(`/reset-password/${result.verificationToken}`, { 
                replace: true,
                state: { 
                    userEmail: result.userDetails.email,
                    userName: result.userDetails.firstName,
                    orgName: result.userDetails.orgName,
                    isInactiveUserReset: true
                }
            });
        } catch (err: any) {
            setError(err.message || "Failed to verify reset OTP");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackFromReset = () => {
        setResetOtpStep(null);
        setResetOrgData(null);
        setError("");
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
            // Go back to email step for simplified flow
            setEmail("");
            setPassword("");
        }
    };

    // Render different steps based on auth flow
    if (resetOtpStep === 'request' && resetOrgData) {
        return (
            <div className={cn("flex flex-col gap-6", className)} {...props}>
                <Card className="overflow-hidden">
                    <CardContent className="grid p-0 md:grid-cols-2">
                        <div className="p-6 md:p-8">
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleBackFromReset}
                                        className="h-8 w-8"
                                        disabled={isLoading}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                                
                                <div className="flex flex-col items-center text-center">
                                    <img src="/logo.svg" alt="Alkaa Logo" className="h-16 w-auto mb-4" />
                                    <h1 className="text-2xl font-semibold">Account Activation Required</h1>
                                    <p className="text-muted-foreground mt-2">
                                        Your account at <strong>{resetOrgData.orgName}</strong> is inactive.
                                    </p>
                                    <p className="text-muted-foreground">
                                        We'll send you a verification code to confirm your identity.
                                    </p>
                                </div>

                                <div className="text-center p-3 bg-orange-50 rounded-lg">
                                    <p className="text-sm text-orange-800">
                                        <strong>Email:</strong> {email}
                                    </p>
                                </div>

                                {error && (
                                    <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                <Button 
                                    onClick={handleRequestResetOtp}
                                    className="w-full" 
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Sending..." : "Send Verification Code"}
                                </Button>
                            </div>
                        </div>
                        
                        <div className="relative hidden bg-muted md:block">
                            <img
                                src="/login_cover.jpg"
                                alt="Login Background"
                                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.9]"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (resetOtpStep === 'verify' && resetOrgData) {
        return (
            <div className={cn("flex flex-col gap-6", className)} {...props}>
                <Card className="overflow-hidden">
                    <CardContent className="grid p-0 md:grid-cols-2">
                        <div className="p-6 md:p-8">
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleBackFromReset}
                                        className="h-8 w-8"
                                        disabled={isLoading}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                                
                                <div className="flex flex-col items-center text-center">
                                    <img src="/logo.svg" alt="Alkaa Logo" className="h-16 w-auto mb-4" />
                                    <h1 className="text-2xl font-semibold">Enter Verification Code</h1>
                                    <p className="text-muted-foreground mt-2">
                                        We've sent a 6-digit code to <strong>{email}</strong>
                                    </p>
                                    <p className="text-muted-foreground">
                                        for your account at <strong>{resetOrgData.orgName}</strong>
                                    </p>
                                </div>

                                <OTPVerification
                                    organizationName={resetOrgData.orgName}
                                    otpExpiresIn={otpExpiresIn}
                                    onVerify={handleVerifyResetOtp}
                                    onBack={handleBackFromReset}
                                    onResend={() => handleRequestResetOtp()}
                                    isLoading={isLoading}
                                    error={error}
                                />
                            </div>
                        </div>
                        
                        <div className="relative hidden bg-muted md:block">
                            <img
                                src="/login_cover.jpg"
                                alt="Login Background"
                                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.9]"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                    onResend={handleResendOTP}
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
                                    ? (authStep.step === 'email' ? "Checking..." : "Signing in...") 
                                    : (authStep.step === 'email' ? "Continue" : "Sign In")
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
