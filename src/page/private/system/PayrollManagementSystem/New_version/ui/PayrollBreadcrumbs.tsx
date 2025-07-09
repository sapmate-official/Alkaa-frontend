import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { usePayrollRoutes } from '../utils/PayrollRouteHelper';

interface PayrollBreadcrumbsProps {
  className?: string;
}

/**
 * PayrollBreadcrumbs - Breadcrumb navigation component for payroll module
 * Uses RouteDict through PayrollRouteHelper for consistent navigation
 */
const PayrollBreadcrumbs: React.FC<PayrollBreadcrumbsProps> = ({ className = '' }) => {
  const location = useLocation();
  const { getBreadcrumbs } = usePayrollRoutes();
  
  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <nav className={`payroll-breadcrumbs ${className}`} aria-label="Breadcrumb navigation">
      <ol className="breadcrumb-list">
        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="breadcrumb-item">
            {index < breadcrumbs.length - 1 ? (
              <>
                <Link 
                  to={crumb.path} 
                  className="breadcrumb-link"
                  aria-label={`Navigate to ${crumb.label}`}
                >
                  {crumb.label}
                </Link>
                <span className="breadcrumb-separator" aria-hidden="true">
                  /
                </span>
              </>
            ) : (
              <span className="breadcrumb-current" aria-current="page">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default PayrollBreadcrumbs;
