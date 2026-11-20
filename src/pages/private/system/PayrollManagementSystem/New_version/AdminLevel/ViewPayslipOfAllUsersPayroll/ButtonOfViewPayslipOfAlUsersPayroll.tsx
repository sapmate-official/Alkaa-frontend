import { Button } from '@/components/ui/button'
import RouteDict from '@/routes/RouteDict'
import CheckPermission from '@/services/PermissionCheck'
import { usePermissions } from '@/store/useAuthStore'
import { useNavigate } from 'react-router-dom'

const ButtonOfViewPayslipOfAllUsersPayroll = () => {
    const permissions = usePermissions()
    const navigate = useNavigate()
    const hasPermission = CheckPermission("view_salary_slip_of_all",permissions)
    if(!hasPermission) return null
  return (
    <div>
        <Button
            onClick={() => navigate(RouteDict.Payroll.Admin.Payslip)} 
            className=''
        >
            View Payslip of All Users
        </Button>
    </div>
  )
}

export default ButtonOfViewPayslipOfAllUsersPayroll