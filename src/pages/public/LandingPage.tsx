import React, { useState } from 'react';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  ChartPie,
  Clock,
  Building2,
  ArrowRight,
  Users,
  Shield,
  Zap,
  CheckCircle,
  Database,
  Lock,
  BarChart3,
  DollarSign,
  UserCheck,
  FileText,
  Bell,
  Target,
  Award,
  Briefcase,
  Activity,
  Code2,
  Server,
  Layers,
  Workflow,
  Sparkles,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import RouteDict from '@/routes/RouteDict';

// interface FeatureCardProps {
//   title: string;
//   description: string;
//   icon: React.ReactNode;
//   category?: string;
// }

// const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, category }) => (
//   <Card className="border border-border bg-card hover:shadow-lg transition-all duration-300 hover:scale-105 group">
//     <CardHeader className="pb-2">
//       <div className="mb-2 text-primary group-hover:scale-110 transition-transform duration-300">{icon}</div>
//       {category && <div className="text-xs text-primary font-medium mb-1">{category}</div>}
//       <CardTitle className="text-lg font-semibold">{title}</CardTitle>
//     </CardHeader>
//     <CardContent>
//       <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
//     </CardContent>
//   </Card>
// );

// interface MetricCardProps {
//   value: string;
//   label: string;
//   icon: React.ReactNode;
//   description?: string;
// }

// const MetricCard: React.FC<MetricCardProps> = ({ value, label, icon, description }) => (
//   <Card className="text-center border-border bg-card/50 backdrop-blur hover:bg-card transition-colors">
//     <CardContent className="p-6">
//       <div className="text-primary mb-3 flex justify-center">
//         {icon}
//       </div>
//       <div className="text-3xl font-bold text-primary mb-1">{value}</div>
//       <div className="text-sm font-medium text-foreground mb-1">{label}</div>
//       {description && <div className="text-xs text-muted-foreground">{description}</div>}
//     </CardContent>
//   </Card>
// );

interface TechStackItemProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

const TechStackItem: React.FC<TechStackItemProps> = ({ name, description, icon, category }) => (
  <Card className="border border-border bg-card hover:shadow-md transition-all duration-300 hover:border-primary/50">
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <div className="text-primary mt-1">{icon}</div>
        <div className="flex-1">
          <div className="text-xs text-primary font-medium mb-1">{category}</div>
          <h4 className="font-semibold text-sm mb-1">{name}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

interface SecurityFeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  compliance?: string[];
}

const SecurityFeature: React.FC<SecurityFeatureProps> = ({ title, description, icon, compliance }) => (
  <Card className="border border-border bg-card hover:shadow-md transition-all duration-300">
    <CardContent className="p-6">
      <div className="text-primary mb-3">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      {compliance && (
        <div className="flex flex-wrap gap-1">
          {compliance.map((item, index) => (
            <span key={index} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              {item}
            </span>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

const AlkaaLandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ scrollBehavior: 'smooth' }}>
      <style>
        {`
          html {
            scroll-behavior: smooth;
          }
        `}
      </style>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-xl items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo_icon.svg" alt="Alkaa Logo" className="h-8 w-8" />
            <span className="text-xl font-bold">Alkaa</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <Button onClick={()=>navigate(RouteDict.SignInPage)} variant="outline">Sign In</Button>
            <Button onClick={()=>navigate(RouteDict.SignUpPage)}>Register</Button>
          </nav>
          
          <div className="md:hidden">
            <Button 
              variant="outline" 
              className="h-10 w-10 p-0" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Toggle menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                  </>
                )}
              </svg>
            </Button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden p-4 border-t border-border/40 bg-background">
            <nav className="flex flex-col gap-4">
              <a 
                href="#features" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={()=>navigate(RouteDict.SignInPage)} variant="outline">Sign In</Button>
                <Button onClick={()=>navigate(RouteDict.SignUpPage)}>Register</Button>
              </div>
            </nav>
          </div>
        )}
      </header>      <main className="flex-1">
        {/* Modern Enterprise SaaS Hero Section */}
        <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden bg-gradient-to-b from-background via-secondary/20 to-background border-b border-border/60">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
          
          <div className="container max-w-screen-xl px-4 md:px-8 relative z-10">
            <div className="flex flex-col items-center text-center">
              <div className="max-w-4xl space-y-6">
                {/* 1. Announcement Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary transition-all hover:bg-primary/15">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>ALKAA 2.0 • Unified Enterprise Workforce Operating System</span>
                  <ArrowRight className="h-3 w-3" />
                </div>

                {/* 2. Main Heading */}
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-foreground">
                  From HR Chaos to{" "}
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Workforce Harmony
                  </span>
                </h1>

                {/* 3. Description */}
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  Streamline your workforce with our enterprise cloud-native HR platform. From candidate invitation and KYC verification to shift attendance and automated multi-tenant payroll.
                </p>

                {/* 4. Value Propositions Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 max-w-2xl mx-auto text-left">
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-card border border-border shadow-xs">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">Digital Onboarding</div>
                      <div className="text-[11px] text-muted-foreground">Candidate KYC & Reviews</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-card border border-border shadow-xs">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">Multi-Tenant</div>
                      <div className="text-[11px] text-muted-foreground">Isolated Workspaces</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-card border border-border shadow-xs">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">Real-Time Sync</div>
                      <div className="text-[11px] text-muted-foreground">Live Shifts & Attendance</div>
                    </div>
                  </div>
                </div>

                {/* 5. CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-3 justify-center items-center">
                  <Button 
                    onClick={() => navigate(RouteDict.SignUpPage)} 
                    className="text-sm font-semibold px-7 py-5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:shadow-lg"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-sm font-medium px-7 py-5 border-border bg-card hover:bg-secondary transition-all"
                    onClick={() => navigate(RouteDict.SignInPage)}
                  >
                    Sign In to Workspace
                  </Button>
                </div>
              </div>

              {/* 7. Product Preview UI Centerpiece Mockup */}
              <div className="mt-14 w-full max-w-5xl relative">
                {/* Floating Telemetry Badge - Top Right */}
                <div className="hidden lg:flex items-center gap-2.5 absolute -top-4 -right-4 z-20 px-3.5 py-2 rounded-xl bg-card border border-border shadow-lg animate-bounce duration-1000">
                  <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-foreground">Sarah Jenkins Verified</div>
                    <div className="text-[10px] text-muted-foreground">DevOps Lead • Account Provisioned</div>
                  </div>
                </div>

                {/* Floating Telemetry Badge - Bottom Left */}
                <div className="hidden lg:flex items-center gap-2.5 absolute -bottom-5 -left-4 z-20 px-3.5 py-2 rounded-xl bg-card border border-border shadow-lg">
                  <div className="p-1 rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-foreground">Nov 2026 Payroll Executed</div>
                    <div className="text-[10px] text-emerald-600 font-medium">100% Disbursed across 142 Staff</div>
                  </div>
                </div>

                {/* Browser Shell Frame */}
                <div className="rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden text-left">
                  {/* Browser Window Bar */}
                  <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-400" />
                      <span className="w-3 h-3 rounded-full bg-amber-400" />
                      <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-card/80 border border-border/80 text-[11px] text-muted-foreground font-mono">
                      <Lock className="h-3 w-3 text-emerald-500" />
                      <span>https://app.alkaa.io/dashboard/command-center</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                      Acme Technologies
                    </Badge>
                  </div>

                  {/* Mockup Dashboard Content */}
                  <div className="p-5 md:p-6 space-y-5 bg-card">
                    {/* Metric Cards Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                      <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/80">
                        <div className="text-xs text-muted-foreground font-medium">Total Headcount</div>
                        <div className="text-2xl font-bold text-foreground mt-1">142</div>
                        <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> +4 this cycle
                        </div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/80">
                        <div className="text-xs text-muted-foreground font-medium">Present Today</div>
                        <div className="text-2xl font-bold text-foreground mt-1">94.2%</div>
                        <div className="text-[11px] text-muted-foreground mt-1">134 Clocked In</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/80">
                        <div className="text-xs text-muted-foreground font-medium">Onboarding Pipeline</div>
                        <div className="text-2xl font-bold text-primary mt-1">6</div>
                        <div className="text-[11px] text-amber-600 font-medium mt-1">2 Pending Review</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/80">
                        <div className="text-xs text-muted-foreground font-medium">Leave Requests</div>
                        <div className="text-2xl font-bold text-foreground mt-1">3</div>
                        <div className="text-[11px] text-muted-foreground mt-1">1 Requires Approval</div>
                      </div>
                    </div>

                    {/* Mini Data Table Snapshot */}
                    <div className="rounded-xl border border-border overflow-hidden">
                      <div className="px-4 py-2.5 bg-secondary/40 border-b border-border flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span>Recent Candidate Verification Queue</span>
                        <span className="text-[11px] text-primary font-normal">View Pipeline →</span>
                      </div>
                      <div className="divide-y divide-border text-xs">
                        <div className="px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                              SJ
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">Sarah Jenkins</div>
                              <div className="text-[11px] text-muted-foreground">Senior DevOps Engineer • Engineering</div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-200 text-[10px]">
                            Under Review
                          </Badge>
                        </div>
                        <div className="px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-700 font-bold text-xs flex items-center justify-center">
                              DK
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">David Kim</div>
                              <div className="text-[11px] text-muted-foreground">Senior UI/UX Designer • Product Design</div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px]">
                            Verified
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Mission & Overview Section */}
        <section className="py-24 bg-secondary/20">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Platform Capabilities</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Modern HR & Workforce Operations
              </h2>
              <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Empowering organizations with structured employee directories, verified KYC onboarding, attendance tracking, and reliable payroll management.
              </p>
            </div>

            {/* Key Pillars Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
              <div className="text-center p-8 rounded-2xl bg-gradient-to-b from-card to-card/50 border border-border/50 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Automated Flows</h3>
                <p className="text-xs text-muted-foreground">Digital candidate onboarding, KYC submission, and document verification.</p>
              </div>
              
              <div className="text-center p-8 rounded-2xl bg-gradient-to-b from-card to-card/50 border border-border/50 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Role-Based Access</h3>
                <p className="text-xs text-muted-foreground">Granular permissions with complete audit trails for every organizational action.</p>
              </div>
              
              <div className="text-center p-8 rounded-2xl bg-gradient-to-b from-card to-card/50 border border-border/50 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Multi-Tenant</h3>
                <p className="text-xs text-muted-foreground">Strict organizational data isolation across branches, departments, and roles.</p>
              </div>
              
              <div className="text-center p-8 rounded-2xl bg-gradient-to-b from-card to-card/50 border border-border/50 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Live Workforce KPIs</h3>
                <p className="text-xs text-muted-foreground">Real-time attendance summaries, shift tracking, and salary analytics.</p>
              </div>
            </div>

            {/* Complete Employee Lifecycle */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-3xl p-12 border border-border/50">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold mb-4">Complete Employee Lifecycle Management</h3>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  From recruitment to exit, Alkaa covers every aspect of employee management with integrated modules.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserCheck className="h-10 w-10 text-primary" />
                  </div>
                  <h4 className="text-xl font-semibold mb-3">Onboarding & Management</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Complete employee data management with document handling, verification processes, 
                    and automated workflows for seamless onboarding.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Activity className="h-10 w-10 text-green-500" />
                  </div>
                  <h4 className="text-xl font-semibold mb-3">Tracking & Analytics</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Real-time attendance monitoring with location verification, performance tracking, 
                    and comprehensive reporting for data-driven insights.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <DollarSign className="h-10 w-10 text-blue-500" />
                  </div>
                  <h4 className="text-xl font-semibold mb-3">Payroll & Benefits</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Comprehensive salary calculation with tax management, payment processing, 
                    and automated compliance with regulatory requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Architecture Section */}
        <section className="py-20">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
                Architected for Modern <span className="text-primary">Enterprise Workforces</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
                Alkaa provides a unified, multi-tenant workforce management suite connecting administrators, managers, and employees on a single secure platform.
              </p>
            </div>

            {/* Core Modules Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 border border-border bg-card hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Organization Command Center</h3>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  Real-time visibility over your workforce. Monitor shift headcounts, pending onboarding reviews, and operational KPIs from an intuitive administrative dashboard.
                </p>
                <ul className="space-y-2.5 text-sm">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span>Real-time workforce KPIs & telemetry</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span>Multi-tenant organization oversight</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span>Department & designation hierarchies</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-8 border border-border bg-card hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                  <UserCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Employee Self-Service</h3>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  Empower staff with an easy self-service portal. Employees can clock in shifts, view leave balances, submit requests, and manage personal tasks seamlessly.
                </p>
                <ul className="space-y-2.5 text-sm">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span>One-click shift clock-in and punch history</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span>Live leave balance wallets & request flows</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span>Interactive task board & work assignments</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-8 border border-border bg-card hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Tenant Isolation & Governance</h3>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  Strict tenant isolation guarantees organizational data privacy. Includes granular role-based permissions and immutable activity audit logs across all actions.
                </p>
                <ul className="space-y-2.5 text-sm">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span>Tenant-isolated database partition</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span>Granular RBAC (Admin, Manager, Staff)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span>Audit trail logging for all mutations</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* Comprehensive HR Suite */}
        <section id="features" className="py-24 bg-secondary/20">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
                <Briefcase className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Complete Feature Set</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Everything You Need for <span className="text-primary">HR Excellence</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
                Every tool you need to manage your workforce efficiently. From onboarding to payroll, 
                handle the complete employee lifecycle with ease and precision.
              </p>
            </div>
            
            {/* Feature Categories */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Employee Management */}
              <div className="group">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-16 h-16 mb-6 bg-primary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-xs text-primary font-semibold mb-2 uppercase tracking-wider">Employee Management</div>
                  <h3 className="text-xl font-bold mb-4">User & Organization</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Complete employee directory with hierarchical organizational structure, 
                    department management, and role-based access control.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Employee directory & profiles</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Department hierarchy</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Role-based permissions</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Time & Attendance */}
              <div className="group">
                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-8 border border-green-500/20 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-16 h-16 mb-6 bg-green-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Clock className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="text-xs text-green-600 font-semibold mb-2 uppercase tracking-wider">Time Tracking</div>
                  <h3 className="text-xl font-bold mb-4">Attendance System</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Real-time check-in/check-out with location verification, session tracking, 
                    and automated attendance reports with verification workflows.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>GPS location tracking</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Multiple session support</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Attendance verification</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Leave Management */}
              <div className="group">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl p-8 border border-blue-500/20 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-16 h-16 mb-6 bg-blue-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="text-xs text-blue-600 font-semibold mb-2 uppercase tracking-wider">Leave Management</div>
                  <h3 className="text-xl font-bold mb-4">Advanced Leave System</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Configurable leave types, balance tracking, approval workflows, 
                    and calendar integration with carryover support.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Flexible leave types</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Approval workflows</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Balance carryover</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Payroll */}
              <div className="group">
                <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-2xl p-8 border border-orange-500/20 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-16 h-16 mb-6 bg-orange-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="h-8 w-8 text-orange-500" />
                  </div>
                  <div className="text-xs text-orange-600 font-semibold mb-2 uppercase tracking-wider">Payroll</div>
                  <h3 className="text-xl font-bold mb-4">Automated Processing</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Complete salary calculation with tax management, allowances, 
                    deductions, and automated payslip generation.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Tax calculations</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Payslip generation</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Payment processing</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Performance & Analytics */}
              <div className="group">
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-2xl p-8 border border-purple-500/20 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-16 h-16 mb-6 bg-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <ChartPie className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="text-xs text-purple-600 font-semibold mb-2 uppercase tracking-wider">Performance</div>
                  <h3 className="text-xl font-bold mb-4">Analytics & Insights</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Track employee performance with comprehensive analytics, 
                    reporting, and data-driven insights for better decisions.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Performance tracking</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Advanced reporting</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Data insights</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Onboarding */}
              <div className="group">
                <div className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 rounded-2xl p-8 border border-pink-500/20 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-16 h-16 mb-6 bg-pink-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <UserCheck className="h-8 w-8 text-pink-500" />
                  </div>
                  <div className="text-xs text-pink-600 font-semibold mb-2 uppercase tracking-wider">Onboarding</div>
                  <h3 className="text-xl font-bold mb-4">Employee Onboarding</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Structured onboarding workflows with document management, 
                    verification processes, and automated communications.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Document management</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Workflow automation</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Verification processes</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Communication */}
              <div className="group">
                <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-2xl p-8 border border-cyan-500/20 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-16 h-16 mb-6 bg-cyan-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Bell className="h-8 w-8 text-cyan-500" />
                  </div>
                  <div className="text-xs text-cyan-600 font-semibold mb-2 uppercase tracking-wider">Communication</div>
                  <h3 className="text-xl font-bold mb-4">Notification System</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Multi-channel notifications with email, push, and in-app messaging. 
                    Customizable templates and user preferences.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Multi-channel delivery</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Custom templates</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>User preferences</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Compliance */}
              <div className="group">
                <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-2xl p-8 border border-red-500/20 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-16 h-16 mb-6 bg-red-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="text-xs text-red-600 font-semibold mb-2 uppercase tracking-wider">Compliance</div>
                  <h3 className="text-xl font-bold mb-4">Audit & Compliance</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Complete audit trails, activity logging, and compliance features 
                    for regulatory requirements and data governance.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Activity logging</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Audit trails</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Compliance reporting</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology & Architecture Section */}
        <section className="py-20 bg-secondary/30">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Scale & Performance</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Modern enterprise web architecture engineered for speed, type safety, and high-availability operations.
              </p>
            </div>

            {/* Tech Stack Overview */}
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <TechStackItem
                category="Frontend"
                name="React + TypeScript"
                description="Modern React 18 with TypeScript and Tailwind CSS for responsive interfaces"
                icon={<Code2 className="h-5 w-5" />}
              />
              <TechStackItem
                category="Backend"
                name="Node.js + Express"
                description="High-performance typed REST APIs with structured error boundaries"
                icon={<Server className="h-5 w-5" />}
              />
              <TechStackItem
                category="Database"
                name="PostgreSQL + Prisma"
                description="Relational database with schema-backed type safety and transactional integrity"
                icon={<Database className="h-5 w-5" />}
              />
              <TechStackItem
                category="Security"
                name="Tenant Partitioning"
                description="Multi-tenant context isolation with role-based access control and audit logging"
                icon={<Shield className="h-5 w-5" />}
              />
            </div>

            {/* Architecture Highlights */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 border-border bg-card">
                <div className="text-primary mb-4">
                  <Layers className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-4">Multi-Tenant Architecture</h3>
                <ul className="space-y-3 text-muted-foreground text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    Complete data isolation between client organizations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    Dedicated organization workspaces and subdomains
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    Organization-specific policies and holiday schedules
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    Scoped role permissions and administrative delegation
                  </li>
                </ul>
              </Card>

              <Card className="p-8 border-border bg-card">
                <div className="text-primary mb-4">
                  <Workflow className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-4">RESTful API Design</h3>
                <ul className="space-y-3 text-muted-foreground text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    Clean RESTful endpoints for all workforce operations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    Structured request validation and clear error handling
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    Multi-tenant context injection and session tokens
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    Comprehensive activity event logging for audit compliance
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* Platform Architecture & Data Protection Section */}
        <section className="py-20">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Enterprise Platform Architecture</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Built with multi-tenant organization isolation, granular role-based permissions, and comprehensive activity logging.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <SecurityFeature
                title="Data Protection"
                description="Isolated organization data stores with secure transport and automatic scheduled backups."
                icon={<Lock className="h-6 w-6" />}
                compliance={["Tenant Isolation", "Automated Backups", "Encrypted Transport"]}
              />
              <SecurityFeature
                title="Access Control"
                description="Multi-factor authentication, granular role-based permissions, and secure session management."
                icon={<Shield className="h-6 w-6" />}
                compliance={["RBAC", "MFA", "Session Control"]}
              />
              <SecurityFeature
                title="Audit & Governance"
                description="Complete event activity logging and operational controls across all organizational workflows."
                icon={<Award className="h-6 w-6" />}
                compliance={["Activity Logs", "User Audits", "Event History"]}
              />
            </div>

            {/* Platform Stats */}
            <div className="grid sm:grid-cols-4 gap-6 mt-12">
              <div className="text-center p-6 bg-card rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-sm text-muted-foreground">High Availability</div>
              </div>
              <div className="text-center p-6 bg-card rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary mb-2">Multi-Tenant</div>
                <div className="text-sm text-muted-foreground">Tenant Partitioning</div>
              </div>
              <div className="text-center p-6 bg-card rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary mb-2">Real-Time</div>
                <div className="text-sm text-muted-foreground">Audit Activity Logs</div>
              </div>
              <div className="text-center p-6 bg-card rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary mb-2">Daily</div>
                <div className="text-sm text-muted-foreground">Automated Backups</div>
              </div>
            </div>
          </div>
        </section>

        {/* Streamlined Call to Action */}
        <section className="py-20 bg-secondary/30 border-t border-border">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Streamline Your Workforce Operations
              </h2>
              <p className="text-base md:text-lg text-muted-foreground mb-8">
                Empower your organization with unified employee directories, verified KYC onboarding, attendance tracking, and reliable multi-tenant payroll.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate(RouteDict.SignUpPage)} 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm px-8 py-5 font-semibold shadow-md"
                >
                  Register Organization
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="outline"
                  className="text-sm px-8 py-5 font-semibold bg-card hover:bg-secondary"
                  onClick={() => navigate(RouteDict.SignInPage)}
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Modern Enterprise Footer */}
      <footer className="bg-secondary/40 border-t border-border py-12">
        <div className="container max-w-screen-xl px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-border/60">
            {/* Brand Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <img src="/logo_icon.svg" alt="Alkaa Logo" className="h-7 w-7" />
                <span className="text-lg font-bold text-foreground">Alkaa</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                Complete HR & Workforce Operating System. Streamline onboarding, attendance, leave management, and multi-tenant operations.
              </p>
            </div>

            {/* Quick Working Navigation */}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <button 
                type="button"
                onClick={() => navigate(RouteDict.SignInPage)} 
                className="text-muted-foreground hover:text-primary font-medium transition-colors"
              >
                Sign In
              </button>
              <button 
                type="button"
                onClick={() => navigate(RouteDict.SignUpPage)} 
                className="text-muted-foreground hover:text-primary font-medium transition-colors"
              >
                Register
              </button>
            </div>
          </div>

          {/* Bottom Attribution */}
          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
            <div>
              &copy; {new Date().getFullYear()} Alkaa. All rights reserved.
            </div>
            <div>
              Owned by Shapenxt.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AlkaaLandingPage;