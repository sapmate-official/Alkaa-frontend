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
        <button onClick={()=>navigate("/p/new-payroll/admin/payslip")} className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700'>
            View Payslip of All Users
        </button>
    </div>
  )
}

export default ButtonOfViewPayslipOfAllUsersPayroll