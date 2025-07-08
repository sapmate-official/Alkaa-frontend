const RouteDict = {
    // Public Routes
    LandingPage: "/",
    SignInPage: "/auth/signin",
    SignUpPage: "/auth/signup",
    SetPassword: "/reset-password/:token",
    DashboardPreview: "/dashboard-preview",

    // Protected Routes Base
    Protected: "/p",

    // Home/Dashboard
    Home: "/p/",
    Dashboard: "/p/home",

    // Profile Management
    Profile: {
        Base: "/p/profile",
        Info: "/p/profile/info",
        Edit: "/p/profile/edit",
        BankDetails: "/p/profile/bank-details",
        SalaryParameter: "/p/profile/salary-parameter",
    },

    // Employee Management System
    Employee: {
        Base: "/p/employee",
        Management: "/p/employee/management",
        Create: "/p/employee/create",
        CreateNew: "/p/employee/create-new",
        RoleAssignment: "/p/employee/role-assignment",
        List: "/p/employee/list",
        Details: "/p/employee/:id",
    },

    // Attendance Management System
    Attendance: {
        Base: "/p/attendance",
        Panel: "/p/attendance/panel",
        LivePanel: "/p/attendance/live-panel",
        History: "/p/attendance/history",
        PastDays: "/p/attendance/pastdays",
        Verification: "/p/attendance/verification",
        AdminVerification: "/p/attendance/admin-verification",
    },

    // Leave Management System
    Leave: {
        Base: "/p/leave",
        Request: "/p/leave/request",
        Balance: "/p/leave/balance",
        History: "/p/leave/history",
        Approval: "/p/leave/approval",
        Types: "/p/leave/types",
        TypeCreate: "/p/leave/types/create",
        TypeEdit: "/p/leave/types/edit/:id",
    },

    // Payroll Management System
    Payroll: {
        Base: "/p/payroll",
        Dashboard: "/p/payroll/dashboard",
        DashboardUsers: "/p/payroll/dashboard-users",
        Generate: "/p/payroll/generate",
        SalaryTransaction: "/p/payroll/salary-transaction",
        ViewAllEmployees: "/p/payroll/view-all-employees",
        ViewEmployeePayroll: "/p/payroll/view-employee/:id",
        ViewOwn: "/p/payroll/view-own",
        NewVersion: "/p/payroll/new-version",
    },

    // New Payroll System (Alternative)
    NewPayroll: {
        Base: "/p/new-payroll",
        Dashboard: "/p/new-payroll/dashboard",
        Generate: "/p/new-payroll/generate",
        History: "/p/new-payroll/history",
        ViewSlip: "/p/new-payroll/slip/:id",
    },

    // Department Management System
    Department: {
        Base: "/p/department",
        List: "/p/department/list",
        Create: "/p/department/create",
        Edit: "/p/department/edit/:id",
        Details: "/p/department/:id",
        HeadAssignment: "/p/department/head-assignment",
    },

    // Organization Management System
    Organization: {
        Base: "/p/organization",
        Details: "/p/organization/details",
        Settings: "/p/organization/settings",
        Chart: "/p/organization/chart",
        TeamDetails: "/p/organization/team-details",
        AdminManagement: "/p/organization/admin-management",
        Complete: "/p/organization/complete",
    },

    // Role Management System
    Role: {
        Base: "/p/role",
        List: "/p/role/list",
        Create: "/p/role/create",
        Edit: "/p/role/edit/:id",
        Permissions: "/p/role/permissions",
        Assignment: "/p/role/assignment",
    },

    // Permission Management System
    Permission: {
        Base: "/p/permission",
        List: "/p/permission/list",
        Create: "/p/permission/create",
        Edit: "/p/permission/edit/:id",
        Categories: "/p/permission/categories",
        Presets: "/p/permission/presets",
        PresetCreate: "/p/permission/presets/create",
        PresetEdit: "/p/permission/presets/edit/:id",
    },

    // Holiday Management System
    Holiday: {
        Base: "/p/holiday",
        List: "/p/holiday/list",
        Create: "/p/holiday/create",
        Edit: "/p/holiday/edit/:id",
        Types: "/p/holiday/types",
        TypeCreate: "/p/holiday/types/create",
        TypeEdit: "/p/holiday/types/edit/:id",
        Calendar: "/p/holiday/calendar",
    },

    // Billing Management System
    Billing: {
        Base: "/p/billing",
        Dashboard: "/p/billing/dashboard",
        Details: "/p/billing/details/:id",
        History: "/p/billing/history",
        Payment: "/p/billing/payment/:id",
        Invoice: "/p/billing/invoice/:id",
    },

    // Notification Management System
    Notification: {
        Base: "/p/notification",
        List: "/p/notification/list",
        Templates: "/p/notification/templates",
        TemplateCreate: "/p/notification/templates/create",
        TemplateEdit: "/p/notification/templates/edit/:id",
        Settings: "/p/notification/settings",
        Send: "/p/notification/send",
    },

    // Activity Log Management System
    ActivityLog: {
        Base: "/p/activity-log",
        List: "/p/activity-log/list",
        Stats: "/p/activity-log/stats",
        UserActivities: "/p/activity-log/user/:userId",
    },

    // Leave Request Management System
    LeaveRequest: {
        Base: "/p/leave-request",
        List: "/p/leave-request/list",
        Create: "/p/leave-request/create",
        Details: "/p/leave-request/:id",
        Approval: "/p/leave-request/approval",
        MyRequests: "/p/leave-request/my-requests",
        TeamRequests: "/p/leave-request/team-requests",
    },

    // Leave Balance Management System
    LeaveBalance: {
        Base: "/p/leave-balance",
        View: "/p/leave-balance/view",
        Adjust: "/p/leave-balance/adjust",
        History: "/p/leave-balance/history",
        UserBalance: "/p/leave-balance/user/:userId",
    },

    // Leave Type Management System
    LeaveType: {
        Base: "/p/leave-type",
        List: "/p/leave-type/list",
        Create: "/p/leave-type/create",
        Edit: "/p/leave-type/edit/:id",
        Settings: "/p/leave-type/settings",
    },

    // System Management
    System: {
        Base: "/p/system",
        Settings: "/p/system/settings",
        Logs: "/p/system/logs",
        Maintenance: "/p/system/maintenance",
        Backup: "/p/system/backup",
        Updates: "/p/system/updates",
    },

    // Super Admin Routes (for organization management)
    SuperAdmin: {
        Base: "/p/organization",
        Organizations: "/p/organization/list",
        OrganizationDetails: "/p/organization/:id/details",
        OrganizationUsers: "/p/organization/:id/users",
        OrganizationAdmins: "/p/organization/:id/admins",
        OrganizationBills: "/p/organization/:id/bills",
        BillingStats: "/p/organization/billing/stats",
        SubscriptionPlans: "/p/organization/subscription-plans",
    },

    // Specific Organization Management (Client Side)
    ClientOrganization: {
        Base: "/p/organization",
        Dashboard: "/p/organization/dashboard",
        Settings: "/p/organization/settings",
        Structure: "/p/organization/structure",
        Hierarchy: "/p/organization/hierarchy",
    },

    // Authentication & Session
    Logout: "/p/logout",

    // Dynamic Routes with Parameters
    Dynamic: {
        UserProfile: (userId: string) => `/p/profile/user/${userId}`,
        EmployeeDetails: (employeeId: string) => `/p/employee/${employeeId}`,
        DepartmentDetails: (deptId: string) => `/p/department/${deptId}`,
        RoleDetails: (roleId: string) => `/p/role/${roleId}`,
        PayrollSlip: (slipId: string) => `/p/payroll/slip/${slipId}`,
        LeaveRequestDetails: (requestId: string) => `/p/leave-request/${requestId}`,
        BillDetails: (billId: string) => `/p/billing/${billId}`,
        HolidayDetails: (holidayId: string) => `/p/holiday/${holidayId}`,
        NotificationDetails: (notificationId: string) => `/p/notification/${notificationId}`,
        OrganizationDetails: (orgId: string) => `/p/organization/${orgId}`,
        PermissionDetails: (permissionId: string) => `/p/permission/${permissionId}`,
        ActivityLogUser: (userId: string) => `/p/activity-log/user/${userId}`,
        LeaveBalanceUser: (userId: string) => `/p/leave-balance/user/${userId}`,
        AttendanceUser: (userId: string) => `/p/attendance/user/${userId}`,
    },

    // API Patterns (for reference)
    ApiPatterns: {
        ResetPassword: (token: string) => `/reset-password/${token}`,
        UserSpecific: (userId: string, path: string) => `/p/${path}/user/${userId}`,
        OrgSpecific: (orgId: string, path: string) => `/p/${path}/org/${orgId}`,
        EditForm: (id: string, module: string) => `/p/${module}/edit/${id}`,
        DetailsView: (id: string, module: string) => `/p/${module}/${id}`,
    },

    // Module Base Paths (for navigation)
    Modules: {
        Profile: "/p/profile",
        Employee: "/p/employee", 
        Attendance: "/p/attendance",
        Leave: "/p/leave",
        Payroll: "/p/payroll",
        NewPayroll: "/p/new-payroll",
        Department: "/p/department",
        Organization: "/p/organization",
        Role: "/p/role",
        Permission: "/p/permission",
        Holiday: "/p/holiday",
        Billing: "/p/billing",
        Notification: "/p/notification",
        ActivityLog: "/p/activity-log",
        LeaveRequest: "/p/leave-request",
        LeaveBalance: "/p/leave-balance",
        LeaveType: "/p/leave-type",
        System: "/p/system",
    },

    // Utility Routes
    Utils: {
        Back: () => -1,
        Refresh: () => 0,
        isPublicRoute: (path: string) => {
            const publicRoutes = ["/", "/auth/signin", "/dashboard-preview"];
            return publicRoutes.includes(path) || path.startsWith("/reset-password");
        },
        isProtectedRoute: (path: string) => {
            return path.startsWith("/p/");
        },
        getModuleFromPath: (path: string) => {
            const pathParts = path.split("/");
            return pathParts[2] || "home";
        },
        buildPath: (base: string, ...segments: string[]) => {
            return [base, ...segments].join("/").replace(/\/+/g, "/");
        }
    }
};

export default RouteDict;

// Export specific route groups for easier imports
export const PublicRoutes = {
    LandingPage: RouteDict.LandingPage,
    SignInPage: RouteDict.SignInPage,
    SignUpPage: RouteDict.SignUpPage,
    SetPassword: RouteDict.SetPassword,
    DashboardPreview: RouteDict.DashboardPreview,
};

export const ProtectedRoutes = {
    Home: RouteDict.Home,
    Dashboard: RouteDict.Dashboard,
    Profile: RouteDict.Profile,
    Employee: RouteDict.Employee,
    Attendance: RouteDict.Attendance,
    Leave: RouteDict.Leave,
    Payroll: RouteDict.Payroll,
    Department: RouteDict.Department,
    Organization: RouteDict.Organization,
    Billing: RouteDict.Billing,
    System: RouteDict.System,
    Logout: RouteDict.Logout,
};

export const AdminRoutes = {
    SuperAdmin: RouteDict.SuperAdmin,
    Role: RouteDict.Role,
    Permission: RouteDict.Permission,
    System: RouteDict.System,
};

export const ModuleRoutes = RouteDict.Modules;
export const DynamicRoutes = RouteDict.Dynamic;
export const RouteUtils = RouteDict.Utils;