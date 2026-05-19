import CheckPermission from '@/services/PermissionCheck'
import { permissionListAtom } from '@/store/atom'
import { useAtom } from 'jotai'
import { useNavigate } from 'react-router-dom'
import RouteDict from '@/routes/RouteDict'
import { Button } from '@/components/ui/button'

const ButtonOfViewPayslipOfAllSubordinatesPayroll = () => {
    const [permissions] = useAtom(permissionListAtom)
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