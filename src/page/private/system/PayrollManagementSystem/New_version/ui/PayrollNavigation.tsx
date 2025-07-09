import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePayrollRoutes } from '../utils/PayrollRouteHelper';

interface PayrollNavigationProps {
  userRole?: 'admin' | 'manager' | 'employee';
  className?: string;
}

/**
 * PayrollNavigation - Navigation component for payroll module
 * Uses RouteDict through PayrollRouteHelper for consistent routing
 */
const PayrollNavigation: React.FC<PayrollNavigationProps> = ({ 
  userRole = 'employee', 
  className = '' 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { routes, navigationItems, adminItems, managerItems } = usePayrollRoutes();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActivePath = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const getNavigationItems = () => {
    let items = [...navigationItems];
    
    if (userRole === 'admin') {
      items = items.concat(adminItems);
    }
    
    if (userRole === 'manager' || userRole === 'admin') {
      items = items.concat(managerItems);
    }
    
    return items;
  };

  return (
    <nav className={`payroll-navigation ${className}`}>
      <div className="navigation-header">
        <h3>Payroll Management</h3>
      </div>
      
      <ul className="navigation-list">
        {getNavigationItems().map((item, index) => (
          <li key={index} className="navigation-item">
            <button
              onClick={() => handleNavigation(item.path)}
              className={`navigation-link ${isActivePath(item.path) ? 'active' : ''}`}
              title={item.description}
            >
              <span className={`icon ${item.icon}`}></span>
              <span className="label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      
      {/* Quick Actions */}
      <div className="quick-actions">
        <h4>Quick Actions</h4>
        <button 
          onClick={() => handleNavigation(routes.getDashboardRoute())}
          className="quick-action-btn"
        >
          Go to Dashboard
        </button>
        <button 
          onClick={() => handleNavigation(routes.getViewOwnRoute())}
          className="quick-action-btn"
        >
          View My Payroll
        </button>
      </div>
    </nav>
  );
};

export default PayrollNavigation;
