import React, { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/AuthContext";
import { 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Mail, 
  Lock, 
  Building2, 
  ShieldCheck, 
  ChevronRight, 
  Timer
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from '@/components/ThemeSwitchButtonComponent';

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
    const { toast } = useToast();
    
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

    // OTP states
    const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
    const [timeLeft, setTimeLeft] = useState(600);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Reset error when step changes
    useEffect(() => {
        setError("");
    }, [authStep.step]);

    // Timer for OTP step
    useEffect(() => {
        if (authStep.step !== 'otp') return;
        setTimeLeft(otpExpiresIn);
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [authStep.step, otpExpiresIn]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Step 1: Submit Email (calls backend POST /api/v1/general/check-email)
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError("Please enter your workplace email address");
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
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to verify email address");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Select Organization (for multi-org users)
    const handleOrganizationSelect = (org: Organization) => {
        setSelectedOrganization(org);
        selectOrganization(org, email);
    };

    // Step 3: Submit Password (calls backend POST /api/v1/general/verify-password)
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
            
            if (result?.sessionToken) {
                setSessionToken(result.sessionToken);
            }
            setOrganizationName(
                result?.organizationName ||
                selectedOrganization?.orgName ||
                ''
            );
            setOtpExpiresIn(result?.otpExpiresIn || 600);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Invalid password. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 4: Submit OTP (calls backend POST /api/v1/general/verify-otp)
    const handleOTPChange = (value: string, index: number) => {
        if (isNaN(Number(value))) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        if (newOtp.every(val => val !== '') && newOtp.join('').length === 6) {
            executeOTPVerify(newOtp.join(''));
        }
    };

    const handleOTPPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasteData.length > 0) {
            const newOtp = [...otp];
            for (let i = 0; i < pasteData.length; i++) {
                newOtp[i] = pasteData[i];
            }
            setOtp(newOtp);
            if (pasteData.length === 6) {
                executeOTPVerify(pasteData);
            } else {
                inputRefs.current[pasteData.length]?.focus();
            }
        }
    };

    const executeOTPVerify = async (otpCode: string) => {
        setIsLoading(true);
        setError("");
        try {
            await verifyOtp(sessionToken, otpCode);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Invalid or expired verification code.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        setError("");
        if (authStep.step === 'organization' || authStep.step === 'password') {
            resetAuthFlow();
            setPassword("");
            setSelectedOrganization(null);
        } else if (authStep.step === 'otp') {
            resetAuthFlow();
            checkEmail(email);
        }
    };

    return (
        <div className={cn("w-full max-w-md mx-auto flex flex-col gap-6", className)} {...props}>
            {/* Top Navigation & Stepper Row */}
            <div className="flex items-center justify-between px-1">
                {/* Step Progress Pill */}
                <div className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-card border border-border shadow-xs text-xs text-muted-foreground">
                    <span className={cn(
                        "flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-semibold transition-colors",
                        authStep.step === 'email' ? "bg-primary text-primary-foreground" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    )}>
                        {authStep.step === 'email' ? '1' : '✓'}
                    </span>
                    <span className={cn("font-medium", authStep.step === 'email' && "text-foreground font-semibold")}>Email</span>
                    
                    <span className="text-border">/</span>

                    <span className={cn(
                        "flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-semibold transition-colors",
                        authStep.step === 'password' || authStep.step === 'organization'
                            ? "bg-primary text-primary-foreground" 
                            : (authStep.step === 'otp' ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground")
                    )}>
                        {authStep.step === 'otp' ? '✓' : '2'}
                    </span>
                    <span className={cn("font-medium", (authStep.step === 'password' || authStep.step === 'organization') && "text-foreground font-semibold")}>Password</span>
                    
                    <span className="text-border">/</span>

                    <span className={cn(
                        "flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-semibold transition-colors",
                        authStep.step === 'otp' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                        3
                    </span>
                    <span className={cn("font-medium", authStep.step === 'otp' && "text-foreground font-semibold")}>2FA</span>
                </div>

                <ThemeToggle className="h-8 w-8 text-muted-foreground hover:text-foreground" />
            </div>

            {/* Main Auth Card */}
            <Card className="border border-border shadow-sm bg-card text-card-foreground rounded-2xl overflow-hidden">
                <CardContent className="p-7 sm:p-8">
                    {/* Brand Header */}
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3.5 border border-primary/20 shadow-xs">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {authStep.step === 'email' && 'Sign in to ALKAA HRMS'}
                            {authStep.step === 'organization' && 'Select Your Workspace'}
                            {authStep.step === 'password' && 'Enter Workspace Password'}
                            {authStep.step === 'otp' && 'Two-Factor Security Verification'}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {authStep.step === 'email' && 'Enter your workplace email to access your employee portal'}
                            {authStep.step === 'organization' && `Multiple active workspaces found for ${email}`}
                            {authStep.step === 'password' && `Authenticate your session for ${selectedOrganization?.orgName || 'your workspace'}`}
                            {authStep.step === 'otp' && (organizationName ? `Enter the 6-digit verification code for ${organizationName}` : 'Enter the 6-digit verification code sent to your email')}
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-5 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg font-medium flex items-start gap-2">
                            <span className="font-bold">•</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Step 1: Work Email Form */}
                    {authStep.step === 'email' && (
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <div className="space-y-1.5 text-left">
                                <Label htmlFor="email" className="text-xs font-semibold text-foreground">Workplace Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                        className="pl-10 h-11 border-input bg-background text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-primary focus-visible:border-primary text-sm"
                                        autoComplete="email"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-xl shadow-xs transition-all"
                                disabled={isLoading}
                            >
                                {isLoading ? "Checking Workspace..." : "Continue to Portal →"}
                            </Button>
                        </form>
                    )}

                    {/* Step 2: Multi-Organization Selector */}
                    {authStep.step === 'organization' && (
                        <div className="space-y-4">
                            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                                {organizations.map((org) => (
                                    <div
                                        key={org.orgId}
                                        onClick={() => handleOrganizationSelect(org)}
                                        className="p-3.5 border border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3 truncate">
                                            <div className="w-8 h-8 rounded-lg bg-muted group-hover:bg-primary/10 text-foreground group-hover:text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                                {org.orgName.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="truncate text-left">
                                                <div className="font-semibold text-sm text-foreground truncate">{org.orgName}</div>
                                                <div className="text-xs text-muted-foreground font-mono">ID: {org.orgId}</div>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                                    </div>
                                ))}
                            </div>

                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleBack} 
                                className="w-full h-10 text-xs border-border text-muted-foreground hover:text-foreground rounded-xl"
                            >
                                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                                Use a different email
                            </Button>
                        </div>
                    )}

                    {/* Step 3: Password Verification Form */}
                    {authStep.step === 'password' && (
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            {/* Selected Organization Context Pill */}
                            <div className="p-3 bg-muted/50 border border-border rounded-xl flex items-center justify-between text-xs">
                                <div className="truncate pr-2 text-left">
                                    <div className="font-semibold text-foreground truncate">{email}</div>
                                    <div className="text-muted-foreground text-[11px] flex items-center gap-1 mt-0.5">
                                        <Building2 className="h-3 w-3 text-primary" />
                                        <span className="truncate">{selectedOrganization?.orgName || 'Workspace Account'}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="text-[11px] font-semibold text-primary hover:underline shrink-0"
                                    disabled={isLoading}
                                >
                                    Switch
                                </button>
                            </div>

                            <div className="space-y-1.5 text-left">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-xs font-semibold text-foreground">Password</Label>
                                    <button
                                        type="button"
                                        className="text-xs text-primary hover:underline font-medium"
                                        onClick={() => {
                                            toast({
                                                title: "Password Assistance",
                                                description: "Please reach out to your organization administrator or HR team to reset your password.",
                                            });
                                        }}
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••••••"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        className="pl-10 pr-10 h-11 border-input bg-background text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-primary focus-visible:border-primary text-sm"
                                        autoComplete="current-password"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-xl shadow-xs transition-all"
                                disabled={isLoading}
                            >
                                {isLoading ? "Verifying..." : "Sign In with Secure Session →"}
                            </Button>
                        </form>
                    )}

                    {/* Step 4: 2FA OTP Code Verification */}
                    {authStep.step === 'otp' && (
                        <div className="space-y-5">
                            <div className="flex justify-center gap-2" onPaste={handleOTPPaste}>
                                {otp.map((digit, idx) => (
                                    <Input
                                        key={idx}
                                        ref={(el) => (inputRefs.current[idx] = el)}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOTPChange(e.target.value, idx)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !digit && idx > 0) {
                                                inputRefs.current[idx - 1]?.focus();
                                            }
                                        }}
                                        disabled={isLoading}
                                        className="w-11 h-12 text-center text-lg font-bold border-input bg-background text-slate-900 dark:text-slate-100 focus-visible:ring-primary focus-visible:border-primary rounded-lg"
                                        autoFocus={idx === 0}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                                <div className="flex items-center gap-1.5 font-medium">
                                    <Timer className="h-3.5 w-3.5 text-primary" />
                                    <span>Expires in: <span className="font-mono font-bold text-foreground">{formatTime(timeLeft)}</span></span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        toast({
                                            title: "Code Resent",
                                            description: "A fresh verification code has been dispatched to your email."
                                        });
                                        setTimeLeft(600);
                                        setOtp(new Array(6).fill(''));
                                    }}
                                    className="text-primary hover:underline font-semibold"
                                    disabled={isLoading}
                                >
                                    Resend Code
                                </button>
                            </div>

                            <Button 
                                type="button" 
                                onClick={() => executeOTPVerify(otp.join(''))}
                                disabled={isLoading || otp.join('').length < 6}
                                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-xl shadow-xs transition-all"
                            >
                                {isLoading ? "Verifying Token..." : "Verify & Complete Login"}
                            </Button>

                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={handleBack}
                                className="w-full h-9 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                                Back to password
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Subtle Security & Compliance Footer */}
            <div className="flex flex-col items-center gap-2.5 text-center text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 text-[11px]">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span>Protected by multi-tenant isolation and 256-bit encryption</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <button 
                        type="button" 
                        onClick={() => navigate('/')} 
                        className="hover:text-foreground transition-colors font-medium"
                    >
                        Return to Homepage
                    </button>
                    <span>•</span>
                    <button 
                        type="button" 
                        onClick={() => navigate('/')} 
                        className="hover:text-primary transition-colors font-medium"
                    >
                        Need an account? Request a demo
                    </button>
                </div>
            </div>
        </div>
    );
}
