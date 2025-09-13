export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  annualPrice: number;
  maxUsers: number;
  features?: any;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string | null;
  status: string;
  departmentId?: string;
  managerId?: string;
  department?: {
    id: string;
    name: string;
  };
  subordinates?: User[];
  // Additional fields that might be available from onboarding
  adharNumber?: string;
  panNumber?: string;
  mobileNumber?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
}

export interface OrganizationType {
  id: string;
  name: string;
  industry: string;
  subscriptionPlanId: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStart: string;
  subscriptionEnd: string;
  isActive: boolean;
  users: User[];
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  headId?: string;
  parentId?: string;
  users: {
    id: string;
    firstName: string;
    lastName: string;
  }[];
}

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string | null;
}
