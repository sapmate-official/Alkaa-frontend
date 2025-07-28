import { Button } from '@/components/ui/button'
import RouteDict from '@/routes/RouteDict'
import CheckPermission from '@/services/PermissionCheck'
import { permissionListAtom } from '@/store/atom'
import { useAtom } from 'jotai'
import { useNavigate } from 'react-router-dom'

const ButtonOfViewPayslipOfAllUsersPayroll = () => {

    const [permissions] = useAtom(permissionListAtom)
    const hasPermission = CheckPermission("view_salary_slip_of_all",permissions)
    if(!hasPermission) return null
    const navigate = useNavigate()
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