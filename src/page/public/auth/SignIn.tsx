import Loader from "@/components/Loader";
import { MultiTenantLoginForm } from "@/components/auth/MultiTenantLoginForm";
// import { AuthDebugPanel } from "@/components/auth/AuthDebugPanel";
import { useAuth } from "@/services/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RouteDict from "@/routes/RouteDict";

export default function SignIn() {
  const navigate = useNavigate();
  const { user, isLoading, authStep } = useAuth();
  
  useEffect(() => {
    if (user && !isLoading && authStep.step === 'complete') {
      navigate(RouteDict.Protected)
    }
  }, [user, isLoading, authStep, navigate])
  
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
