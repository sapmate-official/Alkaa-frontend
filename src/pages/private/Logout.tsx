import { useAuth } from '@/providers/AuthContext';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import Loader from '@/components/Loader';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    
    const handleLogout = async () => {
        // Clear all application state in Zustand
        useAuthStore.getState().logout();
        useAppStore.getState().resetAppStore();
        
        // Clear browser history to prevent back button access
        window.history.replaceState(null, '', '/auth/signin');
        
        // Perform logout which will clear tokens and navigate to login
        await logout();
        
        // Force navigation to login page with replace to clear stack
        navigate('/auth/signin', { replace: true });
    };

    useEffect(() => {
        handleLogout();
    }, []);
    
    return (
        <Loader/>
    )
}

export default Logout