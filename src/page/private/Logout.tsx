import { useAuth } from '@/services/AuthContext';
import { useEffect } from 'react'
import { useSetAtom } from 'jotai';
import { dashboardDataAtom, permissionListAtom, userIdAtom } from '@/store/atom';
import Loader from '@/components/Loader';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const setDashboardData = useSetAtom(dashboardDataAtom);
    const setPermissionList = useSetAtom(permissionListAtom);
    const setUserId = useSetAtom(userIdAtom);
    
    const handleLogout = async () => {
        // Clear all application state
        setDashboardData(null);
        setPermissionList([]);
        setUserId(null);
        
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