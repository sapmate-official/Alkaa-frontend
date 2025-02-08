import { useAuth } from '@/services/AuthContext';
import React, { useEffect } from 'react'
import { useSetAtom } from 'jotai';
import { dashboardDataAtom } from '@/store/atom';

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
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-lg text-gray-600">Logging out...</p>
        </div>
    )
}

export default Logout