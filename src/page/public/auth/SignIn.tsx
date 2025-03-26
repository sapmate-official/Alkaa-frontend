import Loader from "@/components/Loader";
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/services/AuthContext";
import { useEffect } from "react";
import {  useNavigate } from "react-router-dom";

export default function SignIn() {
  const navigate = useNavigate();
  const { user,isLoading } = useAuth();
  useEffect(()=>{
    if(user  && !isLoading){
      navigate("/p/")
    }
  },[user,isLoading])
  if(isLoading){
    return <Loader/>
  }
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        
        <LoginForm />
      </div>
    </div>
  )
}
