import { legacyBackendDomain } from '../../../constants/Domain';

export const APIV2Dictionary = {
  user: {
    getSubordinateList: () => `${legacyBackendDomain}/api/v2/user/subordinate-list`,
    getUserList: () => `${legacyBackendDomain}/api/v2/user/user-list`,
    getManagerList: (orgId: string) => `${legacyBackendDomain}/api/v2/user/fetch-managers/org/${orgId}`,
    updateUserRole: (userId: string, prevRole: string, roleId: string) => 
      `${legacyBackendDomain}/api/v2/user/${userId}/role/${prevRole}/${roleId}`
  },
  billing: {
    // Dashboard
    getDashboard: () => `${legacyBackendDomain}/api/v2/billing/dashboard`,
    
    // Bill history
    getHistory: () => `${legacyBackendDomain}/api/v2/billing/history`,
    
    // Bill details
    getBill: (id: string) => `${legacyBackendDomain}/api/v2/billing/bill/${id}`,
    payBill: (id: string) => `${legacyBackendDomain}/api/v2/billing/bill/${id}/pay`,
    getInvoice: (id: string) => `${legacyBackendDomain}/api/v2/billing/bill/${id}/invoice`,
    
    // Public endpoints
    getPublicBill: (id: string) => `${legacyBackendDomain}/api/public/billing/${id}`,
    payPublicBill: (id: string) => `${legacyBackendDomain}/api/public/billing/${id}/payment`
  }
};
