import CheckPermission from '@/services/PermissionCheck'
import { permissionListAtom } from '@/store/atom'
import { useAtom } from 'jotai'
import React from 'react'
import { useNavigate } from 'react-router-dom'

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
        <button onClick={()=>navigate("/p/new-payroll/subordinate/payslip")} className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700'>
            View Payslip of All Subordinates
        </button>  
    </div>
  )
}

export default ButtonOfViewPayslipOfAllSubordinatesPayroll