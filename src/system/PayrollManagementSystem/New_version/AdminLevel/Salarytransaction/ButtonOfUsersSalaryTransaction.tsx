import CheckPermission from '@/services/PermissionCheck'
import { permissionListAtom } from '@/store/atom'
import { useAtom } from 'jotai'
import React from 'react'

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
        <button className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700'>
            Salary Transaction of All Users
        </button>
    </div>
  )
}

export default ButtonOfUsersSalaryTransaction