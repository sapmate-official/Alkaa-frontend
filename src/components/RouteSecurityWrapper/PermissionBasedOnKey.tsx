import { useAtom } from "jotai";
import { ReactNode } from "react";
import { permissionListAtom } from "../../store/atom";
import Unauthorized from "../Unauthorized";

interface PermissionRouteProps {
  children: ReactNode;
  requiredPermissions: string[];
  requireAll?: boolean;
}

const PermissionRouteBasedOnKey = ({ children, requiredPermissions, requireAll = false }: PermissionRouteProps) => {
  const [permissionList] = useAtom(permissionListAtom);
  
  
const hasPermission = requireAll
    ? requiredPermissions.every(permission => 
            permissionList.some(p => p.key && permission && 
                p.key.trim() === permission.trim())
        )
    : requiredPermissions.some(permission => 
            permissionList.some(p => p.key && permission && 
                p.key.trim() === permission.trim())
        );


  if (!hasPermission) {
    return <Unauthorized requiredPermissions={requiredPermissions} />;
  }

  return <>{children}</>;
};

export default PermissionRouteBasedOnKey;
