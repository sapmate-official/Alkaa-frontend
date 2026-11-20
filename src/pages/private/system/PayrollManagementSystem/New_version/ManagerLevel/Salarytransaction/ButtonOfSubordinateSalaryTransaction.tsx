import { Button } from '@/components/ui/button'
import CheckPermission from '@/services/PermissionCheck'
import { usePermissions } from '@/store/useAuthStore'
import { useNavigate } from 'react-router-dom'
import RouteDict from '@/routes/RouteDict'

const ButtonOfSubordinateSalaryTransaction = () => {
    // this component will call the permission atom of this user and fetch the length of subordinates via api
    // if length is greater than 0 and the permission of [send salary to subordinates] is true then this button will be shown
    // this button will redirect to the salary transaction page
    // this button will be shown on the dashboard of payroll
    const navigate = useNavigate()
    const permissions = usePermissions()
    const hasPermission = CheckPermission("send_salary_to_subordinates",permissions)
    if(!hasPermission) return null
  return (
    <div>
        <Button onClick={() => navigate(RouteDict.Payroll.Manager.Transaction)}>
            Salary Transaction
        </Button>
    </div>
  )
}

export default ButtonOfSubordinateSalaryTransaction