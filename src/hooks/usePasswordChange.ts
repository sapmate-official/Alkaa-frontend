import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { backendDomain } from '@/constants/Domain';
import { useAuth } from '@/providers/AuthContext';

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordResponse {
  message: string;
}

const changePassword = async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
  const token = localStorage.getItem('token');
  
  const response = await axios.put(
    `${backendDomain}/api/v1/auth/change-password`,
    data,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
};

export const useChangePassword = () => {
  const { logout } = useAuth();

  return useMutation({
    mutationFn: changePassword,
    onSuccess: (data) => {
      // Password changed successfully
      console.log('Password changed:', data.message);
    },
    onError: (error: any) => {
      // Handle specific error cases
      if (error.response?.status === 401) {
        // Token expired or invalid - logout user
        logout();
      }
      console.error('Password change failed:', error.response?.data?.error || error.message);
    }
  });
};

export default useChangePassword;
