import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import PermissionRouteBasedOnKey from '@/components/RouteSecurityWrapper/PermissionBasedOnKey'

// Lazy load components for better performance
const ListOfDepartment = lazy(() => import('./List'))
const CreateDepartment = lazy(() => import('./Create'))
const SpecificDepartmentView = lazy(() => import('./View'))
const SpecificDepartmentEdit = lazy(() => import('./Edit'))



const DepartmentManagementSystem = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <PermissionRouteBasedOnKey requiredPermissions={["view_all_department_info","view_own_department_info"]}>
            <ListOfDepartment />
          </PermissionRouteBasedOnKey>
        } 
      />
      <Route 
        path="/create" 
        element={
          <PermissionRouteBasedOnKey requiredPermissions={["create_new_department"]}>
            <CreateDepartment />
          </PermissionRouteBasedOnKey>
        } 
      />
      <Route 
        path="/:id" 
        element={
          <PermissionRouteBasedOnKey requiredPermissions={["view_all_department_info","view_own_department_info"]}>
            <SpecificDepartmentView />
          </PermissionRouteBasedOnKey>
        } 
      />
      <Route 
        path="/edit/:id" 
        element={
          <PermissionRouteBasedOnKey requiredPermissions={["edit_department"]}>
            <SpecificDepartmentEdit />
          </PermissionRouteBasedOnKey>
        } 
      />
    </Routes>
  )
}

export default DepartmentManagementSystem
