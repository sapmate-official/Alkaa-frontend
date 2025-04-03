import CheckPermission from '@/services/PermissionCheck'
import { permissionListAtom } from '@/store/atom'
import { useAtom } from 'jotai'
import React from 'react'

const ButtonOfGenerateUsersSalary = () => {
    // this component will render a button which will navigate to the generate salary page
    // if this user has permission to generate salary of all user and the length of user is greater than 0 then the button will be shown
    const [permissions] = useAtom(permissionListAtom)
    const hasPermission = CheckPermission('generate_salary_of_all', permissions)
    if (!hasPermission) return null
  return (
    <div>
        <button className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700'>
            Generate Salary of All Users
        </button>
    </div>
  )
}

export default ButtonOfGenerateUsersSalary