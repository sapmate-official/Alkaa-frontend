import { Permission } from "@/interface/general";

const CheckPermission = (key: string, permissionList: Permission[]) => {
    if (!key || !permissionList) return false;
    return permissionList.some(permission => permission?.key?.trim() === key.trim());
}
export default CheckPermission;