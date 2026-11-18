import Loader from "@/components/Loader";
import { MultiTenantLoginForm } from "@/components/auth/MultiTenantLoginForm";
import { useAuth } from "@/providers/AuthContext";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { routeUtils } from "@/utils/routeUtils";
import { 
  Building2, 
  Users, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  Sparkles,
  Lock
} from "lucide-react";

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    if (user && !isLoading) {
      const intendedPath = location.state?.from;
      const redirectTo = routeUtils.getRedirectAfterLogin(intendedPath);
      navigate(redirectTo, { replace: true });
    }
  }, [user, isLoading, navigate, location.state]);
  
  if (isLoading) {
    return <Loader />;
  }
  
  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Left Showcase Banner (Visible on Desktop lg: screens) */}
      <div className="hidden lg:flex lg:col-span-5 bg-slate-950 text-white relative overflow-hidden flex-col justify-between p-10 xl:p-14 border-r border-slate-800/60">
        {/* Subtle decorative mesh gradient in background */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Brand Header */}
        <div 
          className="relative z-10 flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/30">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white">ALKAA</span>
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary-foreground border border-primary/30 uppercase">
                HRMS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Workforce Operating System</p>
          </div>
        </div>

        {/* Middle: HRMS Value Proposition & Highlights */}
        <div className="relative z-10 space-y-6 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>The Enterprise People Platform</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-[1.2]">
            Streamlined HR, attendance &amp; payroll in one workspace.
          </h2>

          <p className="text-sm text-slate-400 leading-relaxed max-w-md">
            Sign in to access your employee portal, review team schedules, manage leave balances, and execute compliant payroll runs.
          </p>

          {/* Core Feature Points */}
          <div className="space-y-3.5 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <span>Digital Employee Profiles &amp; Lifecycle Records</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <span>Geofenced GPS &amp; Biometric Attendance Tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <CreditCard className="h-4 w-4" />
              </div>
              <span>Automated Monthly Payroll &amp; Encrypted Payslips</span>
            </div>
          </div>

          {/* Social Proof / Trust Quote */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 space-y-2 mt-4">
            <p className="italic leading-relaxed">
              "ALKAA streamlined our candidate onboarding and multi-branch payroll into one unified 15-minute workflow."
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <div className="w-6 h-6 rounded-full bg-primary/30 text-primary-foreground font-bold text-[10px] flex items-center justify-center">
                MV
              </div>
              <div>
                <span className="font-semibold text-white block text-[11px]">Marcus Vance</span>
                <span className="text-[10px] text-slate-400 block">VP of People Operations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Enterprise Compliance Badges */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-primary" />
            <span>256-bit AES Data Encryption</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>SOC 2 Type II Compliant</span>
          </div>
        </div>
      </div>

      {/* Right Form Panel: Interactive Multi-Tenant Login Form */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 min-h-screen">
        <div className="w-full max-w-md my-auto">
          <MultiTenantLoginForm />
        </div>
      </div>
    </div>
  );
}
