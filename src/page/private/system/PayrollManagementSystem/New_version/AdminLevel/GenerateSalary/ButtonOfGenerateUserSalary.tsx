import { Button } from '@/components/ui/button'
import CheckPermission from '@/services/PermissionCheck'
import { permissionListAtom } from '@/store/atom'
import { useAtom } from 'jotai'
import { useNavigate } from 'react-router-dom'
import RouteDict from '@/routes/RouteDict'

const ButtonOfGenerateUsersSalary = () => {
    // this component will render a button which will navigate to the generate salary page
    // if this user has permission to generate salary of all user and the length of user is greater than 0 then the button will be shown
    const [permissions] = useAtom(permissionListAtom)
    const hasPermission = CheckPermission('generate_salary_of_all', permissions)
    const navigate = useNavigate()
    
    if (!hasPermission) return null
    
  return (
    <div>
        <Button onClick={() => navigate(RouteDict.Payroll.Generate)}>
            Generate Salary of All Users
        </Button>
    </div>
  )
}

export default ButtonOfGenerateUsersSalary