import React from 'react';
import { usePermissions } from '@/store/useAuthStore';

interface PermissionGuardProps {
  requiredPermission: string | string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  requiredPermission,
  requireAll = false,
  children,
  fallback = null
}) => {
  const permissions = usePermissions();
  
  // Convert to array if single permission
  const requiredPermissions = Array.isArray(requiredPermission) 
    ? requiredPermission
    : [requiredPermission];
  
  const hasPermission = requireAll
    ? requiredPermissions.every(perm => 
        permissions?.some(p => p?.key === perm)
      )
    : requiredPermissions.some(perm => 
        permissions?.some(p => p?.key === perm)
      );

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGuard;
