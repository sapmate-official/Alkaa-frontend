
import PayrollBreadcrumbs from '../../ui/PayrollBreadcrumbs';

const MainGenerateUsersSalaryPage = () => {
    // this is generate salary page
    // this page will fetch the list of user of this org and show the list of user
    // based on month and year there will be option of select all user or select individial user and whose salary is already generated for that particualr month and year will be disabled 
  return (
    <div className="p-4 w-full h-screen">
      {/* Breadcrumbs */}
      <PayrollBreadcrumbs />
      
      <h1 className="text-3xl font-bold mb-6">Generate Salary for All Users</h1>
      <div>MainGenerateUsersSalaryPage - Implementation needed</div>
    </div>
  )
}

export default MainGenerateUsersSalaryPage