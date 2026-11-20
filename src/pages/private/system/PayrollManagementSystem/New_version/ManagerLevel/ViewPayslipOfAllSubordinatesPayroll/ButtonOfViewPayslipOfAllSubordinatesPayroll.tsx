import CheckPermission from '@/services/PermissionCheck'
import { usePermissions } from '@/store/useAuthStore'
import { useNavigate } from 'react-router-dom'
import RouteDict from '@/routes/RouteDict'
import { Button } from '@/components/ui/button'

const ButtonOfViewPayslipOfAllSubordinatesPayroll = () => {
    const permissions = usePermissions()
    const navigate = useNavigate()
    const hasPermission = CheckPermission("view_salary_slip_of_subordinates",permissions)
    if(!hasPermission) return null

  return (
    <div>
        <Button 
            onClick={() => navigate(RouteDict.Payroll.Manager.Payslip)} 
            className=''
        >
            View Payslip of All Subordinates
        </Button>  
    </div>
  )
}

export default ButtonOfViewPayslipOfAllSubordinatesPayroll