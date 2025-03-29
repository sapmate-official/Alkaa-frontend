import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function NotificationTest() {
  const { toast } = useToast();

  const handleShowTest = async () => {
    try {
      if (!('Notification' in window)) {
        toast({
          title: "Error",
          description: "This browser doesn't support notifications",
          variant: "destructive"
        });
        return;
      }
      
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: "Error",
          description: "Notification permission denied",
          variant: "destructive"
        });
        return;
      }
      
      // Show a test notification
      new Notification('Test Notification', {
        body: 'This is a test notification from Alkaa',
        icon: '/assets/logo_icon.svg'
      });
      
      toast({
        title: "Success",
        description: "Test notification shown"
      });
    } catch (error) {
      console.error('Test notification error:', error);
      toast({
        title: "Error",
        description: "Failed to show test notification",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={handleShowTest}
      variant="outline"
      size="sm"
    >
      Test Notification
    </Button>
  );
}