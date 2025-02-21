import { useAuth } from '@/services/AuthContext';
import { useEffect } from 'react'
import { useSetAtom } from 'jotai';
import { dashboardDataAtom } from '@/store/atom';
import Loader from '@/components/Loader';

const Logout = () => {
    const { logout } = useAuth();
    const setDashboardData = useSetAtom(dashboardDataAtom);
    
    const handleLogout = () => {
        logout();
        setDashboardData(null); // Clear dashboard data
    };

    useEffect(()=>{
        handleLogout()
    },[])
    
    return (
        <Loader/>
    )
}

export default Logout