import { backendDomain } from '../../lib/constant/Domain';

export const APIV2Dictionary = {
  user: {
    getSubordinateList: () => `${backendDomain}/api/v2/user/subordinate-list`,
    getUserList: () => `${backendDomain}/api/v2/user/user-list`,
    getManagerList: (orgId: string) => `${backendDomain}/api/v2/user/fetch-managers/org/${orgId}`,
    updateUserRole: (userId: string, prevRole: string, roleId: string) => 
      `${backendDomain}/api/v2/user/${userId}/role/${prevRole}/${roleId}`
  }
};
