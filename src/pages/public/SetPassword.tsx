import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { APIDictionary } from '../../services/api/v2/APIdict';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, ShieldCheck } from 'lucide-react';
import RouteDict from '@/routes/RouteDict';

const SetPassword = () => {
  const { token } = useParams();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get state from navigation if it's an inactive user reset
  const isInactiveUserReset = location.state?.isInactiveUserReset;
  const userEmail = location.state?.userEmail;
  const userName = location.state?.userName;
  const orgName = location.state?.orgName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(APIDictionary.setPassword, {
        password,
        verificationToken: token,
      });

      toast({
        title: "Success",
        description: isInactiveUserReset 
          ? "Your password has been reset and account activated successfully. You can now sign in."
          : "Your password has been set successfully.",
        variant: "default",
      });

      // Clear the navigation state when going back to sign in
      navigate(RouteDict.SignInPage, { replace: true });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set password. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-[420px]">
        <CardHeader className="space-y-1">
          {isInactiveUserReset ? (
            <>
              <div className="flex items-center justify-center mb-2">
                <ShieldCheck className="h-8 w-8 text-orange-500" />
              </div>
              <CardTitle className="text-2xl text-center">Account Activation Required</CardTitle>
              <CardDescription className="text-center space-y-2">
                <div>Hello {userName},</div>
                <div>Your account at <strong>{orgName}</strong> is currently inactive.</div>
                <div>Please set a new password to activate your account and sign in.</div>
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl text-center">Set New Password</CardTitle>
              <CardDescription className="text-center">
                Enter your new password below
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isInactiveUserReset && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                <strong>Email:</strong> {userEmail}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                required
                minLength={8}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                minLength={8}
              />
            </div>
            
            <Button 
              className="w-full" 
              type="submit" 
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {isInactiveUserReset ? 'Activate Account' : 'Set Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetPassword;