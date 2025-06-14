import { Button } from '@/components/ui/button'
import CheckPermission from '@/services/PermissionCheck'
import { permissionListAtom } from '@/store/atom'
import { useAtom } from 'jotai'
import { useNavigate } from 'react-router-dom'

const ButtonOfSubordinateSalaryTransaction = () => {
    // this component will call the permission atom of this user and fetch the length of subordinates via api
    // if length is greater than 0 and the permission of [send salary to subordinates] is true then this button will be shown
    // this button will redirect to the salary transaction page
    // this button will be shown on the dashboard of payroll
    const [permissions] = useAtom(permissionListAtom)
    const hasPermission = CheckPermission("send_salary_to_subordinates",permissions)
    if(!hasPermission) return null
  const navigate = useNavigate()
  return (
    <div>
        <Button onClick={()=>navigate("/p/new-payroll/subordinate/transaction")}>
            Salary Transaction
        </Button>
    </div>
  )
}

export default ButtonOfSubordinateSalaryTransaction