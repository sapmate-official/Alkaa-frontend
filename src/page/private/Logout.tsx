import { useAuth } from '@/services/AuthContext';
import { useEffect } from 'react'
import { useSetAtom } from 'jotai';
import { dashboardDataAtom, permissionListAtom } from '@/store/atom';
import Loader from '@/components/Loader';

const Logout = () => {
    const { logout } = useAuth();
    const setDashboardData = useSetAtom(dashboardDataAtom);
    const setPermissionList = useSetAtom(permissionListAtom)
    const handleLogout = () => {
        logout();
        setDashboardData(null); // Clear dashboard data
        setPermissionList([]); // Clear permission list
    };

    useEffect(()=>{
        handleLogout()
    },[])
    
    return (
        <Loader/>
    )
}

export default Logout