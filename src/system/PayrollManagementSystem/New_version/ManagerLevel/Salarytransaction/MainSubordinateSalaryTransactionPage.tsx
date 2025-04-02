import React from 'react'

const MainSubordinateSalaryTransactionPage = () => {
    //this page has two mode , either route contains one user id and the salary payroll id
    // or the route contains nothing 
    // if the route contains one user id and the salary payroll id then this page will show that particular salary's payroll details and status of payment if payment is not made then give button to make payment.
    // if the route contains nothing then this page will show the list of subordinates of this user .
    // in the list the name of subordinate and the number of due salary will be shown
    // on click of any subordincate the page will open left section and show the list of salary payrolls of that subordinate and the status of payment if payment is not made then give button to make payment.
    // there will be one top section where there will be option of select month and year and based on that give a small report of how many salary is paid and how many are not paid. based on not paid salary there will be a total amount of salary to be paid and the total number of employees whose salary is not paid. this report will be shown in the top section of this page. there will be option to download this pdf also. 
    // also there will be option of bonus and incentive . this bonus and incentive can be applicable for all or for the selected employees. this function also will be there. make sure the report should update accordingly. and also  during add bonus and incentive there will be a remarks section if needed that manager can use that feature. 
    // at the top section after select the month and year and all other staffs and after the report is created the initiate transaction button should there . 
    // i have two type of transaction one is mannaul and another is razorpay
    // if the transaction is manual then it will show the list of all employee and the corresponding transaction id form field in case of razorpay it will show that the integration is on the way. 

  return (
    <div>MainSalaryTransactionPage</div>
  )
}

export default MainSubordinateSalaryTransactionPage