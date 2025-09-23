import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/api/auth/authService';
import { useToast } from '@/hooks/use-toast';

export function useToggle2FA() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      return authService.toggle2FA(enabled);
    },
    onSuccess: (data) => {
      toast({
        title: "Two-Factor Authentication Updated",
        description: `2FA has been ${data.twoFactorEnabled ? 'enabled' : 'disabled'} successfully.`,
        variant: "default"
      });
      
      // Invalidate user profile queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update Two-Factor Authentication",
        description: error?.response?.data?.message || "Please try again later",
        variant: "destructive"
      });
    }
  });
}
