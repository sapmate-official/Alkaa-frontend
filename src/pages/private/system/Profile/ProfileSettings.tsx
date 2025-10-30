import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/AuthContext';
import { useToggle2FA } from '@/hooks/useAuth';
import { 
  ShieldCheckIcon, 
  KeyIcon, 
  BellIcon,
  UserIcon,
  CogIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/skeleton';
import PasswordChangeModal from '@/components/auth/PasswordChangeModal';

const ProfileSettings = () => {
  const { user } = useAuth();
  const toggle2FAMutation = useToggle2FA();
  
  // State for settings
  const [is2FAEnabled, setIs2FAEnabled] = useState(
    (user as any)?.twoFactorEnabled || false
  );
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] = useState(false);

  const handleToggle2FA = async (enabled: boolean) => {
    setIs2FAEnabled(enabled);
    try {
      await toggle2FAMutation.mutateAsync(enabled);
    } catch (error) {
      // Revert the state if the mutation fails
      setIs2FAEnabled(!enabled);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (!user) {
    return (
      <div className="p-6 w-full h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-900/20">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-900/20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-primary/10 p-2">
              <CogIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Profile Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your account security and preferences
              </p>
            </div>
          </div>
        </motion.div>

        {/* Security Settings */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-primary/90">
                <ShieldCheckIcon className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure your account security preferences and authentication methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-2 mt-1">
                    <KeyIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="2fa-toggle" className="text-base font-medium">
                        Two-Factor Authentication
                      </Label>
                      <Badge variant={is2FAEnabled ? "default" : "secondary"} className="text-xs">
                        {is2FAEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account by requiring a verification code
                    </p>
                    <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                      <InformationCircleIcon className="w-3 h-3" />
                      <span>Recommended for enhanced security</span>
                    </div>
                  </div>
                </div>
                <Switch
                  id="2fa-toggle"
                  checked={is2FAEnabled}
                  onCheckedChange={handleToggle2FA}
                  disabled={toggle2FAMutation.isPending}
                />
              </div>

              <Separator />

              {/* Password Security */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-2 mt-1">
                    <KeyIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Password</Label>
                    <p className="text-sm text-muted-foreground">
                      Manage your account password and keep your account secure
                    </p>
                    <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                      <InformationCircleIcon className="w-3 h-3" />
                      <span>Change regularly for better security</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsPasswordChangeModalOpen(true)}
                >
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Preferences */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-primary/90">
                <BellIcon className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Control how you receive notifications from the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 p-2 mt-1">
                    <BellIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email-notifications" className="text-base font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important updates and reminders
                    </p>
                  </div>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  disabled
                />
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-2 mt-1">
                    <BellIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="push-notifications" className="text-base font-medium">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications on your device for real-time updates
                    </p>
                  </div>
                </div>
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                  disabled
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <InformationCircleIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Coming Soon</span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Notification preferences will be available in a future update
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Information */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-primary/90">
                <UserIcon className="w-5 h-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your basic account details and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-base font-medium">{user.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Employee ID</Label>
                  <p className="text-base font-medium">{user.employeeId || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
                  <Badge variant={
                    user.status === 'active' ? 'default' :
                    user.status === 'terminated' ? 'destructive' :
                    user.status === 'suspended' ? 'destructive' : 'secondary'
                  }>
                    {user.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                  <p className="text-base font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={isPasswordChangeModalOpen}
        onClose={() => setIsPasswordChangeModalOpen(false)}
      />
    </div>
  );
};

export default ProfileSettings;
