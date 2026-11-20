import { ReactNode } from "react";
import { usePermissions } from "@/store/useAuthStore";
import Unauthorized from "../Unauthorized";

interface PermissionRouteProps {
  children: ReactNode;
  requiredPermissions: string[];
  requireAll?: boolean;
}

const PermissionRoute = ({ children, requiredPermissions, requireAll = false }: PermissionRouteProps) => {
  const permissionList = usePermissions();

  const hasPermission = requireAll
    ? requiredPermissions.every(permission => 
        permissionList.some(p => p.name === permission)
      )
    : requiredPermissions.some(permission => 
        permissionList.some(p => p.name === permission)
      );

  if (!hasPermission) {
    return <Unauthorized />;
  }

  return <>{children}</>;
};

export default PermissionRoute;
