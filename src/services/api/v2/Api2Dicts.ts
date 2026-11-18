import { backendDomain } from '../../../constants/Domain';

export const APIV2Dictionary = {
  user: {
    getSubordinateList: () => `${backendDomain}/api/v2/user/subordinate-list`,
    getUserList: () => `${backendDomain}/api/v2/user/user-list`,
    getManagerList: (orgId: string) => `${backendDomain}/api/v2/user/fetch-managers/org/${orgId}`,
    updateUserRole: (userId: string, prevRole: string, roleId: string) => 
      `${backendDomain}/api/v2/user/${userId}/role/${prevRole}/${roleId}`
  },
  billing: {
    // Dashboard
    getDashboard: () => `${backendDomain}/api/v2/billing/dashboard`,
    
    // Bill history
    getHistory: () => `${backendDomain}/api/v2/billing/history`,
    
    // Bill details
    getBill: (id: string) => `${backendDomain}/api/v2/billing/bill/${id}`,
    payBill: (id: string) => `${backendDomain}/api/v2/billing/bill/${id}/pay`,
    getInvoice: (id: string) => `${backendDomain}/api/v2/billing/bill/${id}/invoice`,
    
    // Public endpoints
    getPublicBill: (id: string) => `${backendDomain}/api/public/billing/${id}`,
    payPublicBill: (id: string) => `${backendDomain}/api/public/billing/${id}/payment`
  }
};
