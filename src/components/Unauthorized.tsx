import { AlertCircle } from "lucide-react";
import { useAtomValue } from "jotai";
import { permissionListAtom } from "@/store/atom";

interface UnauthorizedProps {
  requiredPermissions?: string[];
}

const Unauthorized = ({ requiredPermissions = [] }: UnauthorizedProps) => {
  const userPermissions = useAtomValue(permissionListAtom);
  
  // Get the list of missing permissions
  const missingPermissions = requiredPermissions.filter(
    reqPerm => !userPermissions.some(userPerm => userPerm.name === reqPerm || userPerm.key === reqPerm)
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 w-full h-full">
      <AlertCircle className="w-16 h-16 text-red-500" />
      <h1 className="text-2xl font-bold text-gray-800">Unauthorized Access</h1>
      <p className="text-gray-600">You don't have permission to access this page.</p>
      
      {missingPermissions.length > 0 && (
        <div className="mt-4 max-w-md text-center">
          <h2 className="text-lg font-semibold text-gray-700">Missing Permissions:</h2>
          <ul className="list-disc pl-5 mt-2 text-left">
            {missingPermissions.map((permission, index) => (
              <li key={index} className="text-gray-600">{permission}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-gray-500">
            Please contact your administrator to request these permissions.
          </p>
        </div>
      )}
    </div>
  );
};

export default Unauthorized;
