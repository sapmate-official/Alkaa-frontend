import Loader from "@/components/Loader";
import { MultiTenantLoginForm } from "@/components/auth/MultiTenantLoginForm";
// import { AuthDebugPanel } from "@/components/auth/AuthDebugPanel";
import { useAuth } from "@/providers/AuthContext";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { routeUtils } from "@/utils/routeUtils";

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, authStep } = useAuth();
  
  useEffect(() => {
    if (user && !isLoading && authStep.step === 'complete') {
      // Get the intended destination from location state, or default to protected route
      const intendedPath = location.state?.from;
      const redirectTo = routeUtils.getRedirectAfterLogin(intendedPath);
      navigate(redirectTo, { replace: true });
    }
  }, [user, isLoading, authStep, navigate, location.state])
  
  if (isLoading) {
    return <Loader/>
  }
  
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <MultiTenantLoginForm />
        
        {/* Debug panel - remove in production */}
        {/* {import.meta.env.DEV && (
          <div className="mt-8">
            <AuthDebugPanel />
          </div>
        )} */}
      </div>
    </div>
  )
}
