import { useAtom } from "jotai";
import { ReactNode } from "react";
import { permissionListAtom } from "../../store/atom";
import Unauthorized from "../Unauthorized";
import { useAuth } from "../../providers/AuthContext";

interface PermissionRouteProps {
  children: ReactNode;
  requiredPermissions: string[];
  requireAll?: boolean;
}

const PermissionRouteBasedOnKey = ({ children, requiredPermissions, requireAll = false }: PermissionRouteProps) => {
  const [permissionList] = useAtom(permissionListAtom);
  const { user } = useAuth();

  // SuperAdmins have platform-wide access and bypass all individual tenant permission gates
  if (user?.superAdmin || user?.isSuperAdmin || permissionList.some(p => p.key === '*')) {
    return <>{children}</>;
  }

  const hasPermission = requireAll
    ? requiredPermissions.every(permission => 
            permissionList.some(p => p.key && permission && 
                (p.key.trim() === permission.trim() || p.key === '*'))
        )
    : requiredPermissions.some(permission => 
            permissionList.some(p => p.key && permission && 
                (p.key.trim() === permission.trim() || p.key === '*'))
        );

  if (!hasPermission) {
    return <Unauthorized requiredPermissions={requiredPermissions} />;
  }

  return <>{children}</>;
};

export default PermissionRouteBasedOnKey;
