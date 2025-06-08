import { Button } from '@/components/ui/button'
import CheckPermission from '@/services/PermissionCheck'
import { permissionListAtom } from '@/store/atom'
import { useAtom } from 'jotai'
import { useNavigate } from 'react-router-dom'

const ButtonOfGenerateSubordinateSalaryPage = () => {
    // this component will render a button which will navigate to the generate salary page
    // if this user has permission to generate salary of subordinates and the length of subordinates is greater than 0 then the button will be shown
    const [permissions] = useAtom(permissionListAtom)
    const hasPermission = CheckPermission("generate_salary_of_subordinates",permissions)
    if(!hasPermission) return null
    const navigate = useNavigate()
  return (
    <div>
        <Button onClick={()=>navigate("/p/new-payroll/subordinate/generate")} >
            Generate Salary of Subordinates
        </Button>
    </div>
  )
}

export default ButtonOfGenerateSubordinateSalaryPage