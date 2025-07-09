import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { permissionListAtom } from '@/store/atom'
import { useAtom } from 'jotai'
import CheckPermission from '@/services/PermissionCheck'

// Lazy load components for better performance
const ListOfDepartment = lazy(() => import('./List'))
const CreateDepartment = lazy(() => import('./Create'))
const SpecificDepartmentView = lazy(() => import('./View'))
const SpecificDepartmentEdit = lazy(() => import('./Edit'))

// Permission-based route component
const PermissionRoute = ({ 
  children, 
  permissionKey 
}: { 
  children: React.ReactNode
  permissionKey: string 
}) => {
  const [permissions] = useAtom(permissionListAtom)
  const hasPermission = CheckPermission(permissionKey, permissions)
  
  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-medium">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            You don't have permission to access this feature
          </p>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}

const DepartmentManagementSystem = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <PermissionRoute permissionKey="view_all_department_info">
            <ListOfDepartment />
          </PermissionRoute>
        } 
      />
      <Route 
        path="/create" 
        element={
          <PermissionRoute permissionKey="create_new_department">
            <CreateDepartment />
          </PermissionRoute>
        } 
      />
      <Route 
        path="/:id" 
        element={
          <PermissionRoute permissionKey="view_all_department_info">
            <SpecificDepartmentView />
          </PermissionRoute>
        } 
      />
      <Route 
        path="/edit/:id" 
        element={
          <PermissionRoute permissionKey="edit_department">
            <SpecificDepartmentEdit />
          </PermissionRoute>
        } 
      />
    </Routes>
  )
}

export default DepartmentManagementSystem
