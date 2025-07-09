import RouteDict from '../../../../../../routes/RouteDict';

/**
 * PayrollRouteHelper - Utility class for managing payroll navigation
 * Uses RouteDict for consistent routing throughout the application
 */
export class PayrollRouteHelper {
  
  /**
   * Get the base payroll route
   */
  static getBaseRoute(): string {
    return RouteDict.Payroll.Base;
  }

  /**
   * Get dashboard route
   */
  static getDashboardRoute(): string {
    return RouteDict.Payroll.Dashboard;
  }

  /**
   * Get dashboard users route
   */
  static getDashboardUsersRoute(): string {
    return RouteDict.Payroll.DashboardUsers;
  }

  /**
   * Get generate payroll route
   */
  static getGenerateRoute(): string {
    return RouteDict.Payroll.Generate;
  }

  /**
   * Get salary transaction route
   */
  static getSalaryTransactionRoute(): string {
    return RouteDict.Payroll.SalaryTransaction;
  }

  /**
   * Get view all employees route
   */
  static getViewAllEmployeesRoute(): string {
    return RouteDict.Payroll.ViewAllEmployees;
  }

  /**
   * Get view specific employee payroll route
   */
  static getViewEmployeePayrollRoute(employeeId: string): string {
    return RouteDict.Payroll.ViewEmployeePayroll.replace(':id', employeeId);
  }

  /**
   * Get view own payroll route
   */
  static getViewOwnRoute(): string {
    return RouteDict.Payroll.ViewOwn;
  }

  /**
   * Get new version route
   */
  static getNewVersionRoute(): string {
    return RouteDict.Payroll.NewVersion;
  }

  /**
   * Get admin transaction route
   */
  static getAdminTransactionRoute(): string {
    return RouteDict.Payroll.Admin.Transaction;
  }

  /**
   * Get admin payslip route
   */
  static getAdminPayslipRoute(): string {
    return RouteDict.Payroll.Admin.Payslip;
  }

  /**
   * Get manager transaction route
   */
  static getManagerTransactionRoute(): string {
    return RouteDict.Payroll.Manager.Transaction;
  }

  /**
   * Navigation helpers for use in components
   */
  static navigationItems = [
    {
      label: 'Dashboard',
      path: RouteDict.Payroll.Dashboard,
      icon: 'dashboard',
      description: 'Main payroll dashboard'
    },
    {
      label: 'Generate Payroll',
      path: RouteDict.Payroll.Generate,
      icon: 'generate',
      description: 'Generate payroll for employees'
    },
    {
      label: 'Salary Transactions',
      path: RouteDict.Payroll.SalaryTransaction,
      icon: 'transaction',
      description: 'View salary transactions'
    },
    {
      label: 'View All Employees',
      path: RouteDict.Payroll.ViewAllEmployees,
      icon: 'employees',
      description: 'View payroll for all employees'
    },
    {
      label: 'View Own Payroll',
      path: RouteDict.Payroll.ViewOwn,
      icon: 'personal',
      description: 'View your own payroll'
    }
  ];

  /**
   * Admin specific navigation items
   */
  static adminNavigationItems = [
    {
      label: 'Admin Transactions',
      path: RouteDict.Payroll.Admin.Transaction,
      icon: 'admin-transaction',
      description: 'Manage administrative transactions'
    },
    {
      label: 'Admin Payslips',
      path: RouteDict.Payroll.Admin.Payslip,
      icon: 'admin-payslip',
      description: 'Manage payslips administration'
    }
  ];

  /**
   * Manager specific navigation items
   */
  static managerNavigationItems = [
    {
      label: 'Subordinate Transactions',
      path: RouteDict.Payroll.Manager.Transaction,
      icon: 'manager-transaction',
      description: 'Manage subordinate transactions'
    }
  ];

  /**
   * Check if current path is a payroll route
   */
  static isPayrollRoute(path: string): boolean {
    return path.startsWith(RouteDict.Payroll.Base);
  }

  /**
   * Get breadcrumb navigation for current route
   */
  static getBreadcrumbs(currentPath: string): Array<{label: string, path: string}> {
    const breadcrumbs = [
      { label: 'Home', path: RouteDict.Home },
      { label: 'Payroll', path: RouteDict.Payroll.Base }
    ];

    if (currentPath.includes('/dashboard')) {
      breadcrumbs.push({ label: 'Dashboard', path: RouteDict.Payroll.Dashboard });
    } else if (currentPath.includes('/generate')) {
      breadcrumbs.push({ label: 'Generate', path: RouteDict.Payroll.Generate });
    } else if (currentPath.includes('/salary-transaction')) {
      breadcrumbs.push({ label: 'Transactions', path: RouteDict.Payroll.SalaryTransaction });
    } else if (currentPath.includes('/view-all-employees')) {
      breadcrumbs.push({ label: 'All Employees', path: RouteDict.Payroll.ViewAllEmployees });
    } else if (currentPath.includes('/view-own')) {
      breadcrumbs.push({ label: 'My Payroll', path: RouteDict.Payroll.ViewOwn });
    } else if (currentPath.includes('/admin-transaction')) {
      breadcrumbs.push({ label: 'Admin', path: RouteDict.Payroll.Admin.Transaction });
    } else if (currentPath.includes('/admin-payslip')) {
      breadcrumbs.push({ label: 'Admin Payslips', path: RouteDict.Payroll.Admin.Payslip });
    } else if (currentPath.includes('/subordinate-transaction')) {
      breadcrumbs.push({ label: 'Subordinates', path: RouteDict.Payroll.Manager.Transaction });
    }

    return breadcrumbs;
  }
}

/**
 * Hook for using payroll routes in React components
 */
export const usePayrollRoutes = () => {
  return {
    routes: PayrollRouteHelper,
    navigationItems: PayrollRouteHelper.navigationItems,
    adminItems: PayrollRouteHelper.adminNavigationItems,
    managerItems: PayrollRouteHelper.managerNavigationItems,
    isPayrollRoute: PayrollRouteHelper.isPayrollRoute,
    getBreadcrumbs: PayrollRouteHelper.getBreadcrumbs
  };
};

export default PayrollRouteHelper;
