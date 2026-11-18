import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  Users, 
  Clock, 
  Calendar, 
  CreditCard, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  Send,
  UserCheck,
  FileText,
  BadgeCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RouteDict from '@/routes/RouteDict';
import { submitDemoRequest } from '@/services/api/publicApi';
import { useToast } from '@/hooks/use-toast';
import ThemeToggle from '@/components/ThemeSwitchButtonComponent';
import { tokenStorage } from '@/services/api/client';

export const AlkaaLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // If user is already authenticated, redirect straight to their workspace
  useEffect(() => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    if (
      (accessToken && !tokenStorage.isTokenExpired(accessToken)) ||
      (refreshToken && !tokenStorage.isTokenExpired(refreshToken))
    ) {
      navigate(RouteDict.Protected, { replace: true });
    }
  }, [navigate]);

  // Demo Request Form State (wired directly to backend POST /api/v1/public/demo-request)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phoneNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Active module tab for interactive preview
  const [activeTab, setActiveTab] = useState<'payroll' | 'attendance' | 'directory' | 'leave'>('payroll');

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.company.trim() || !formData.email.trim() || !formData.phoneNumber.trim()) {
      toast({
        title: "Incomplete details",
        description: "Please complete all fields to request your tailored demonstration.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitDemoRequest(formData);
      setIsSubmitted(true);
      toast({
        title: "Demo Request Submitted",
        description: res.message || "Thank you! Our workforce solutions specialist will contact you shortly.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit demo request";
      toast({
        title: "Submission Error",
        description: msg,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-primary">
      {/* Top Enterprise Navigation */}
      <header className="sticky top-0 z-50 w-full bg-background/85 backdrop-blur-md border-b border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/25 transition-transform group-hover:scale-105">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-foreground">ALKAA</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  HRMS
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">Workforce Operating System</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#modules" className="hover:text-foreground transition-colors">Core Modules</a>
            <a href="#solutions" className="hover:text-foreground transition-colors">Why ALKAA</a>
            <a href="#security" className="hover:text-foreground transition-colors">Security &amp; Compliance</a>
          </nav>

          {/* Actions: Theme Toggle, Sign In, Request Demo */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle className="h-8 w-8 text-muted-foreground hover:text-foreground" />
            <Button 
              variant="ghost" 
              onClick={() => navigate(RouteDict.SignInPage)}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted px-3"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => {
                const el = document.getElementById('demo-form-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-xl shadow-xs px-4"
            >
              Book a Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:py-24 border-b border-border/80 overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Core Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Professional Category Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide border border-primary/20">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Modern Human Resource Management System (HRMS)</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.12]">
                Complete workforce operations. <br />
                <span className="text-primary">From hire to payroll.</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                ALKAA is the modern HRMS platform designed for forward-thinking enterprises. Unify employee lifecycle records, geofenced attendance tracking, multi-tier leave approvals, and 100% compliant automated payroll into one elegant workspace.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <Button 
                  onClick={() => navigate(RouteDict.SignInPage)}
                  className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl shadow-sm shadow-primary/20 gap-2"
                >
                  <span>Launch Employee Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const el = document.getElementById('demo-form-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="h-11 px-6 border-border text-foreground font-semibold text-sm rounded-xl hover:bg-muted"
                >
                  Schedule Demo
                </Button>
              </div>

              {/* Enterprise Trust Proof Points */}
              <div className="pt-6 border-t border-border/70 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>100% Automated Payroll</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Geofenced &amp; Mobile Shifts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Multi-Tenant Org Isolation</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-Converting Demo Request Card */}
            <div id="demo-form-section" className="lg:col-span-5">
              <Card className="border border-border shadow-lg bg-card text-card-foreground rounded-2xl overflow-hidden">
                <CardContent className="p-7 sm:p-8">
                  <div className="mb-6 text-left">
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Fast-Track Onboarding</span>
                    <h3 className="text-2xl font-bold text-foreground mt-1 tracking-tight">Request a Personalized Demo</h3>
                    <p className="text-xs text-muted-foreground mt-1">See how ALKAA transforms your company's HR and payroll in a 15-minute guided session.</p>
                  </div>

                  {isSubmitted ? (
                    <div className="py-10 text-center space-y-4">
                      <div className="w-14 h-14 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-7 w-7" />
                      </div>
                      <h4 className="font-bold text-foreground text-lg">Thank You for Your Request!</h4>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                        Our HR solutions engineer will reach out to <strong>{formData.email}</strong> with customized demo access and sandbox credentials.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setIsSubmitted(false);
                          setFormData({ name: '', company: '', email: '', phoneNumber: '' });
                        }}
                        className="text-xs rounded-xl mt-2"
                      >
                        Submit another request
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleDemoSubmit} className="space-y-4 text-left">
                      <div className="space-y-1.5">
                        <Label htmlFor="demo-name" className="text-xs font-semibold text-foreground">Your Full Name</Label>
                        <Input
                          id="demo-name"
                          placeholder="Marcus Vance"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          disabled={isSubmitting}
                          required
                          className="h-10 text-xs border-input bg-background text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-primary rounded-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="demo-company" className="text-xs font-semibold text-foreground">Company Name</Label>
                        <Input
                          id="demo-company"
                          placeholder="Acme Global Technologies"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          disabled={isSubmitting}
                          required
                          className="h-10 text-xs border-input bg-background text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-primary rounded-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="demo-email" className="text-xs font-semibold text-foreground">Work Email Address</Label>
                        <Input
                          id="demo-email"
                          type="email"
                          placeholder="marcus@acmeglobal.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          disabled={isSubmitting}
                          required
                          className="h-10 text-xs border-input bg-background text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-primary rounded-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="demo-phone" className="text-xs font-semibold text-foreground">Phone Number</Label>
                        <Input
                          id="demo-phone"
                          type="tel"
                          placeholder="+1 (555) 234-5678"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          disabled={isSubmitting}
                          required
                          className="h-10 text-xs border-input bg-background text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-primary rounded-xl"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl shadow-xs gap-2 transition-all mt-2"
                      >
                        <Send className="h-4 w-4" />
                        <span>{isSubmitting ? 'Submitting Request...' : 'Schedule Personalized Demo'}</span>
                      </Button>

                      <div className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1.5 pt-1">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        <span>Enterprise multi-tenant privacy • 256-bit encryption</span>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Live Operational Metrics Banner */}
      <section className="py-12 bg-muted/40 border-b border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">99.98%</div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payroll Accuracy</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">15 min</div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Average Monthly Pay Run</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">&lt; 1 sec</div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Geofence Punch Verification</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">100%</div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statutory Tax Compliance</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core HRMS Modules Showcase */}
      <section id="modules" className="py-20 bg-background border-b border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">The All-in-One HR Suite</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
              Every HR tool your organization needs, under one roof.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
              Eliminate disconnected spreadsheets and scattered software. ALKAA connects your employee records, daily attendance, leave balances, and payroll disbursements seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Module 1: Employee Directory & Profiles */}
            <div className="p-7 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all text-left space-y-3.5 group">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Core HR &amp; Employee Directory</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Centralized digital profiles with document storage, emergency contacts, compensation history, bank account verification, and automated employee onboarding workflows.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" /> Multi-branch org charts &amp; hierarchy
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" /> Digital onboarding checklist
                </li>
              </ul>
            </div>

            {/* Module 2: Geofenced Attendance */}
            <div className="p-7 rounded-2xl bg-card border border-border hover:border-emerald-500/50 hover:shadow-md transition-all text-left space-y-3.5 group">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Smart Attendance &amp; Shifts</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Precise GPS geofenced punch-in/out, biometric terminal sync, multi-shift scheduling, automated overtime calculations, and manager verification queues.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" /> Geofenced office perimeter validation
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" /> Daily regularization requests
                </li>
              </ul>
            </div>

            {/* Module 3: Leave Management */}
            <div className="p-7 rounded-2xl bg-card border border-border hover:border-amber-500/50 hover:shadow-md transition-all text-left space-y-3.5 group">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Time-Off &amp; Leave Balances</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Configure custom leave policies (Casual, Sick, Annual, Maternity). Real-time accrual tracking, team vacation calendars, and single-click manager approval flows.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-3.5 w-3.5 text-amber-500" /> Automated monthly quota credit
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-3.5 w-3.5 text-amber-500" /> Conflict-free team calendar view
                </li>
              </ul>
            </div>

            {/* Module 4: Automated Payroll Engine */}
            <div className="p-7 rounded-2xl bg-card border border-border hover:border-blue-500/50 hover:shadow-md transition-all text-left space-y-3.5 group">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Automated Payroll &amp; Payslips</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Run flawless monthly payroll in minutes. Automated Provident Fund (PF), Tax (TDS), insurance deductions, bank export files, and instant digital payslip generation.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-3.5 w-3.5 text-blue-500" /> One-click bulk salary generation
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-3.5 w-3.5 text-blue-500" /> Encrypted PDF payslip delivery
                </li>
              </ul>
            </div>

            {/* Module 5: Role-Based Access Control */}
            <div className="p-7 rounded-2xl bg-card border border-border hover:border-purple-500/50 hover:shadow-md transition-all text-left space-y-3.5 group">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Granular Roles &amp; Permissions</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Customizable access tiers for Executives, HR Managers, Department Leads, and Employees. Ensure data confidentiality with department-level permission presets.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-3.5 w-3.5 text-purple-500" /> Pre-built role templates
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-3.5 w-3.5 text-purple-500" /> Comprehensive immutable audit trails
                </li>
              </ul>
            </div>

            {/* Module 6: Employee Self-Service (ESS) */}
            <div className="p-7 rounded-2xl bg-card border border-border hover:border-indigo-500/50 hover:shadow-md transition-all text-left space-y-3.5 group">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <UserCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Employee Self-Service (ESS)</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Give employees direct control to check their attendance logs, download historical payslips, apply for time off, and update personal bank credentials on desktop or mobile.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-3.5 w-3.5 text-indigo-500" /> 24/7 personal HR portal
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-3.5 w-3.5 text-indigo-500" /> Real-time mobile notifications
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Experience Showcase */}
      <section id="solutions" className="py-20 bg-muted/30 border-b border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Experience the Platform</span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground mt-2">
              Designed for Speed, Clarity, and Accuracy
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              See how ALKAA eliminates repetitive administrative overhead for HR leaders.
            </p>
          </div>

          {/* Interactive Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1.5 rounded-xl bg-card border border-border shadow-xs gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('payroll')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'payroll' 
                    ? 'bg-primary text-primary-foreground shadow-xs' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Automated Payroll
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('attendance')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'attendance' 
                    ? 'bg-primary text-primary-foreground shadow-xs' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Geofenced Attendance
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('leave')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'leave' 
                    ? 'bg-primary text-primary-foreground shadow-xs' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Leave Management
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'directory' 
                    ? 'bg-primary text-primary-foreground shadow-xs' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Employee Lifecycle
              </button>
            </div>
          </div>

          {/* Tab Content Preview Card */}
          <div className="max-w-4xl mx-auto">
            <Card className="border border-border shadow-md bg-card text-card-foreground rounded-2xl overflow-hidden text-left">
              <CardContent className="p-8 sm:p-10">
                {activeTab === 'payroll' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-6 space-y-4">
                      <span className="text-xs font-bold text-primary uppercase">Zero-Error Pay Runs</span>
                      <h4 className="text-2xl font-bold text-foreground">Generate 100+ Payslips in Under 3 Minutes</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Automatic integration with monthly attendance, approved unpaid leaves, and predefined salary structures. Statutory taxes and deductions are calculated with 100% precision.
                      </p>
                      <div className="space-y-2 pt-2 text-xs font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Automated PF, TDS, and insurance breakdowns
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Direct-to-bank disburse spreadsheet exports
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Instant PDF payslip dispatch to employee inboxes
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-6 p-5 rounded-xl bg-muted/60 border border-border space-y-3 font-mono text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-border">
                        <span className="text-muted-foreground">Cycle</span>
                        <span className="font-semibold text-foreground">November 2026</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Headcount</span>
                        <span className="font-semibold text-foreground">128 Employees</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Gross Compensation</span>
                        <span className="font-semibold text-foreground">$412,850.00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Statutory Deductions</span>
                        <span className="font-semibold text-foreground">-$48,910.00</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-border font-bold text-sm text-primary">
                        <span>Net Disbursement</span>
                        <span>$363,940.00</span>
                      </div>
                      <div className="pt-2">
                        <div className="w-full h-2 rounded-full bg-emerald-500/20 overflow-hidden">
                          <div className="w-full h-full bg-emerald-500 rounded-full" />
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans mt-1 block text-right font-medium">
                          ✓ Reconciliation Complete
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'attendance' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-6 space-y-4">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Geofenced Shifts</span>
                      <h4 className="text-2xl font-bold text-foreground">Eliminate Buddy Punching &amp; Ghost Hours</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Configure office geofences with custom radiuses down to 50 meters. Employees clock in via mobile GPS verification, and shift exceptions are flagged instantly for manager review.
                      </p>
                      <div className="space-y-2 pt-2 text-xs font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Precise coordinate validation upon punch
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Auto-calculate late entries, early leaves &amp; OT
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Seamless integration with biometric hardware
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-6 p-5 rounded-xl bg-muted/60 border border-border space-y-3 font-mono text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-border">
                        <span className="text-muted-foreground">Office Location</span>
                        <span className="font-semibold text-foreground">HQ - Manhattan Branch</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Geofence Radius</span>
                        <span className="font-semibold text-foreground">75 meters</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Today's Check-Ins</span>
                        <span className="font-semibold text-emerald-500">114 Present (95%)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Regularization Queue</span>
                        <span className="font-semibold text-amber-500">2 Pending Reviews</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'leave' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-6 space-y-4">
                      <span className="text-xs font-bold text-amber-500 uppercase">Seamless Time-Off</span>
                      <h4 className="text-2xl font-bold text-foreground">No More Lost Emails or Approval Delays</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Employees check their remaining balances in real time and submit requests with one tap. Managers receive instant notifications and can approve or decline directly with notes.
                      </p>
                      <div className="space-y-2 pt-2 text-xs font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-amber-500" /> Customized policy tiers (Casual, Sick, Vacation)
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-amber-500" /> Multi-tier manager approval chains
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-amber-500" /> Automated sync with monthly payroll deductions
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-6 p-5 rounded-xl bg-muted/60 border border-border space-y-3 font-mono text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-border">
                        <span className="text-muted-foreground">Employee Request</span>
                        <span className="font-semibold text-foreground">Alex Rivera (Product)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Leave Category</span>
                        <span className="font-semibold text-foreground">Annual Vacation (3 Days)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Balance Remaining</span>
                        <span className="font-semibold text-foreground">11 Days</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-border font-semibold text-emerald-500">
                        <span>Approval Status</span>
                        <span>Approved by Manager</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'directory' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-6 space-y-4">
                      <span className="text-xs font-bold text-primary uppercase">People Directory</span>
                      <h4 className="text-2xl font-bold text-foreground">One Single Source of Truth for Your Team</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Store essential tax details, statutory KYC documents, past appraisals, and emergency contacts in fully encrypted, searchable records.
                      </p>
                      <div className="space-y-2 pt-2 text-xs font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" /> Visual departmental hierarchy &amp; reporting lines
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" /> Automated onboarding document upload
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" /> Secure role assignment &amp; account provisioning
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-6 p-5 rounded-xl bg-muted/60 border border-border space-y-3 font-mono text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-border">
                        <span className="text-muted-foreground">Active Workspaces</span>
                        <span className="font-semibold text-foreground">3 Regional Branches</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Departments</span>
                        <span className="font-semibold text-foreground">Engineering, Sales, HR, Ops</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Onboarding Status</span>
                        <span className="font-semibold text-emerald-500">4 New Hires Joining</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Enterprise Security & Compliance Section */}
      <section id="security" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Enterprise Security</span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground mt-2">
              Enterprise-Grade Protection for Your People Data
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Your payroll and employee records demand uncompromised privacy, regulatory compliance, and high availability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Multi-Tenant Data Isolation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Each company operates in strict organization-level cryptographic separation. Zero risk of cross-tenant data leaks or unauthorized data access.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Two-Factor Authentication (2FA)</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every sensitive session is protected with multi-tenant verification and time-based one-time passcodes (OTP) for maximum executive security.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Regulatory Audit Trails</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Immutable activity logging for all salary modifications, employee record changes, and role reassignments to ensure seamless statutory compliance audits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Footer CTA */}
      <section className="py-16 bg-muted/40 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Ready to elevate your workforce operations?
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Experience the HRMS platform built for growing teams, reliable payroll, and happy employees.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Button 
              onClick={() => navigate(RouteDict.SignInPage)}
              className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl shadow-xs"
            >
              Sign In to Your Workspace
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                const el = document.getElementById('demo-form-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="h-11 px-6 border-border text-foreground font-semibold text-sm rounded-xl hover:bg-muted"
            >
              Request a Free Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Enterprise Footer */}
      <footer className="py-10 bg-background border-t border-border text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              A
            </div>
            <span className="font-bold text-foreground">ALKAA HRMS</span>
            <span>•</span>
            <span>Enterprise Workforce Management Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <button 
              type="button" 
              onClick={() => navigate(RouteDict.SignInPage)} 
              className="hover:text-foreground font-medium transition-colors"
            >
              Employee Portal
            </button>
            <span>•</span>
            <button 
              type="button" 
              onClick={() => {
                const el = document.getElementById('demo-form-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }} 
              className="hover:text-foreground font-medium transition-colors"
            >
              Book Demo
            </button>
            <span>•</span>
            <span>Owned by Shapenxt.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AlkaaLandingPage;
