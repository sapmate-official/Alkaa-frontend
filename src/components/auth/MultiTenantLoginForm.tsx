import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/AuthContext";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, CheckCircle2, Sparkles, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { OrganizationSelector } from "@/components/auth/OrganizationSelector";
import { OTPVerification } from "@/components/auth/OTPVerification";
import { Badge } from "@/components/ui/badge";

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
        } catch (err: unknown) {
            console.log(err);
            
            setError(err instanceof Error ? err.message : "Failed to check email");
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
            setError(err instanceof Error ? err.message : "Failed to verify password");
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
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to verify OTP");
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
            <Card className="overflow-hidden border border-border/80 shadow-lg bg-card">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form 
                        className="p-6 md:p-8 flex flex-col justify-between" 
                        onSubmit={authStep.step === 'email' ? handleEmailSubmit : handlePasswordSubmit}
                    >
                        <div className="flex flex-col gap-5">
                            <div className="flex items-center justify-between">
                                {authStep.step === 'password' ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleBack}
                                        className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                                        disabled={isLoading}
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                        <span>Change Email</span>
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate("/")}
                                        className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                        <span>Back to Home</span>
                                    </Button>
                                )}
                            </div>
                            
                            <div className="flex flex-col items-center text-center">
                                <img src="/logo.svg" alt="Alkaa Logo" className="h-12 w-auto mb-3" />
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    {authStep.step === 'email' ? 'Sign In to Your Workspace' : 'Enter Password'}
                                </h1>
                                <p className="text-sm text-muted-foreground mt-1.5">
                                    {authStep.step === 'email' 
                                        ? 'Enter your work email to access your organization dashboard' 
                                        : `Enter your password for ${selectedOrganization?.orgName || 'your account'}`
                                    }
                                </p>
                            </div>

                            {/* Email Field */}
                            {authStep.step === 'email' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Work Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="alex.morgan@acme.com"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={isLoading}
                                            className="pl-10 h-10 border-border focus-visible:ring-primary"
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Password Field */}
                            {authStep.step === 'password' && (
                                <>
                                    <div className="p-3 bg-secondary/50 border border-border/80 rounded-lg flex items-center justify-between text-xs">
                                        <div className="truncate pr-2">
                                            <div className="font-semibold text-foreground truncate">{email}</div>
                                            <div className="text-muted-foreground text-[11px] flex items-center gap-1 mt-0.5">
                                                <Building2 className="h-3 w-3 text-primary" />
                                                <span className="truncate">{selectedOrganization?.orgName || 'Organization Workspace'}</span>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0">
                                            Verified
                                        </Badge>
                                    </div>
                                    
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                                            <button
                                                type="button"
                                                className="text-xs text-primary hover:underline font-medium"
                                                onClick={() => {
                                                    toast({
                                                        title: "Password Assistance",
                                                        description: "Please reach out to your organization administrator or HR team to reset your account password.",
                                                    });
                                                }}
                                            >
                                                Forgot password?
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                placeholder="••••••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                disabled={isLoading}
                                                className="pl-10 pr-10 h-10 border-border focus-visible:ring-primary"
                                                autoComplete="current-password"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {error && (
                                <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg font-medium">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all" disabled={isLoading}>
                                {isLoading 
                                    ? (authStep.step === 'email' ? "Checking Workspace..." : "Verifying Credentials...") 
                                    : (authStep.step === 'email' ? "Continue to Workspace →" : "Sign In & Send OTP →")
                                }
                            </Button>
                        </div>
                    </form>
                    
                    {/* Right Branded Feature & Trust Showcase Panel */}
                    <div className="relative hidden md:flex flex-col justify-between p-8 bg-gradient-to-br from-primary/5 via-secondary/40 to-primary/10 border-l border-border/70">
                        {/* Header Copy */}
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold tracking-wide uppercase mb-3">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Workforce Operating System</span>
                            </div>
                            <h2 className="text-xl font-bold tracking-tight text-foreground leading-snug">
                                Manage Onboarding, Shifts & Payroll in Real Time
                            </h2>
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                Experience instant tenant provisioning, automated biometric shift sync, and verified compliance chains for global enterprise teams.
                            </p>
                        </div>

                        {/* Interactive Live Telemetry Card */}
                        <div className="my-5 p-4 rounded-xl bg-card border border-border shadow-sm space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="font-semibold text-foreground">Acme Technologies</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20">Production</span>
                            </div>
                            <div>
                                <div className="flex items-baseline justify-between text-xs mb-1.5">
                                    <span className="text-muted-foreground">Today's Shift Attendance</span>
                                    <span className="font-bold text-foreground">134 / 142 (94.2%)</span>
                                </div>
                                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full" style={{ width: '94.2%' }} />
                                </div>
                            </div>
                            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                                <span className="text-muted-foreground">Payroll Run</span>
                                <span className="text-emerald-600 font-medium flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Nov 2026 Disbursed
                                </span>
                            </div>
                        </div>

                        {/* Customer Quote */}
                        <div className="p-3.5 rounded-lg bg-card/70 border border-border/60 text-xs text-muted-foreground space-y-2">
                            <p className="italic text-[11px] leading-relaxed">
                                "ALKAA streamlined our candidate onboarding and multi-branch payroll into one unified 15-minute workflow."
                            </p>
                            <div className="flex items-center gap-2 pt-0.5">
                                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center">
                                    MV
                                </div>
                                <div>
                                    <div className="font-semibold text-foreground text-[11px]">Marcus Vance</div>
                                    <div className="text-[10px] text-muted-foreground">VP of People Operations</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="text-balance text-center text-xs text-muted-foreground">
                Owned by Shapenxt.
            </div>
        </div>
    );
}
