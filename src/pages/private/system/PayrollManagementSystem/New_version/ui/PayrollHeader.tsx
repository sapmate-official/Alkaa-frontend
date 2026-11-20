import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/store/useAuthStore';
import CheckPermission from '@/services/PermissionCheck';
import RouteDict from '@/routes/RouteDict';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Users, 
  UserCheck, 
  CreditCard, 
  PlusCircle, 
  Receipt 
} from 'lucide-react';

interface PayrollHeaderProps {
  title?: string;
  description?: string;
  activeTab?: 'dashboard' | 'admin-payslip' | 'subordinate-payslip' | 'admin-transaction' | 'generate' | 'custom-payslip';
}

export const PayrollHeader: React.FC<PayrollHeaderProps> = ({
  title = 'Payroll Management',
  description = 'Manage payroll runs, employee payslips, and salary transactions',
  activeTab = 'dashboard'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = usePermissions();

  const canViewAllPayslips = CheckPermission('view_salary_slip_of_all', permissions);
  const canViewSubordinatePayslips = CheckPermission('view_salary_slip_of_subordinates', permissions);
  const canSendSalaryToAll = CheckPermission('send_salary_to_all', permissions);
  const canGenerateSalary = CheckPermission('generate_salary_of_all', permissions);

  // Tab definitions
  const tabs = [
    {
      id: 'dashboard',
      label: 'My Payslips',
      icon: FileText,
      path: RouteDict.Payroll.Dashboard,
      visible: true
    },
    {
      id: 'admin-payslip',
      label: 'All Employees',
      icon: Users,
      path: RouteDict.Payroll.Admin.Payslip,
      visible: canViewAllPayslips
    },
    {
      id: 'subordinate-payslip',
      label: 'Subordinates',
      icon: UserCheck,
      path: RouteDict.Payroll.Manager.Payslip,
      visible: canViewSubordinatePayslips
    },
    {
      id: 'admin-transaction',
      label: 'Transactions',
      icon: CreditCard,
      path: RouteDict.Payroll.Admin.Transaction,
      visible: canSendSalaryToAll
    },
    {
      id: 'generate',
      label: 'Generate Salary',
      icon: PlusCircle,
      path: RouteDict.Payroll.Generate,
      visible: canGenerateSalary
    },
    {
      id: 'custom-payslip',
      label: 'Custom Payslip',
      icon: Receipt,
      path: '/p/payroll/custom-payslip',
      visible: canViewAllPayslips
    }
  ].filter(tab => tab.visible);

  return (
    <div className="space-y-4 border-b border-border pb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Navigation Tabs adhering to color-styling-guide: 1 hue accent, neutral surfaces */}
      <nav className="flex space-x-1 overflow-x-auto no-scrollbar pt-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id || location.pathname === tab.path;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-secondary text-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default PayrollHeader;
