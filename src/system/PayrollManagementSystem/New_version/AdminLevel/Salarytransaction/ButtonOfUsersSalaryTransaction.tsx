import { Button } from '@/components/ui/button'
import CheckPermission from '@/services/PermissionCheck'
import { permissionListAtom } from '@/store/atom'
import { useAtom } from 'jotai'

const ButtonOfUsersSalaryTransaction = () => {
    // this component will call the permission atom of this user and fetch the length of user via api
    // if length is greater than 0 and the permission of [send salary to all user] is true then this button will be shown
    // this button will redirect to the salary transaction page
    // this button will be shown on the dashboard of payroll
    const [permissions] = useAtom(permissionListAtom)
    const hasPermission = CheckPermission("send_salary_to_all",permissions)
    if(!hasPermission) return null
  return (
    <div>
        <Button >
            Salary Transaction of All Users
        </Button>
    </div>
  )
}

export default ButtonOfUsersSalaryTransaction