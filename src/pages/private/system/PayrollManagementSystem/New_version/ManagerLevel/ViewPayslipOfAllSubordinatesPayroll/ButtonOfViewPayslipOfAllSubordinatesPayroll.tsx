import CheckPermission from '@/services/PermissionCheck'
import { permissionListAtom } from '@/store/atom'
import { useAtom } from 'jotai'
import { useNavigate } from 'react-router-dom'
import RouteDict from '@/routes/RouteDict'
import { Button } from '@/components/ui/button'

const ButtonOfViewPayslipOfAllSubordinatesPayroll = () => {
    // this component will call the permission atom of this user and fetch the length of subordinates via api
    // if length is greater than 0 and the permission of [view subordinates payslip] is true then this button will be shown
    // this button will redirect to the view payslip of all subordinates page
    // this button will be shown on the dashboard of payroll and the view payslip of all subordinates page
    const [permissions] = useAtom(permissionListAtom)
    const hasPermission = CheckPermission("view_salary_slip_of_subordinates",permissions)
    if(!hasPermission) return null
    const navigate = useNavigate()

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