import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthContext';
import { notificationService } from '@/services/NotificationService';

export function NotificationSubscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to enable notifications",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const success = await notificationService.registerPushSubscription(user.id);
      
      if (success) {
        toast({
          title: "Success",
          description: "Notifications enabled successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to enable notifications. Please check your browser permissions.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSubscribe}
      disabled={loading}
      variant="outline"
      size="sm"
    >
      {loading ? "Enabling..." : "Enable Notifications"}
    </Button>
  );
}