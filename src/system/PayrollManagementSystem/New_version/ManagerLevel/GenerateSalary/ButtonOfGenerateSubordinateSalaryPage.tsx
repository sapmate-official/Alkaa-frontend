import CheckPermission from '@/services/PermissionCheck'
import { permissionListAtom } from '@/store/atom'
import { useAtom } from 'jotai'
import React from 'react'
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
        <button onClick={()=>navigate("/p/new-payroll/subordinate/generate")} className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700'>
            Generate Salary of Subordinates
        </button>
    </div>
  )
}

export default ButtonOfGenerateSubordinateSalaryPage