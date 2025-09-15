# TanStack Query Implementation Guide

This document provides comprehensive examples of how to use the TanStack Query hooks implemented for all modules in the Alkaa platform.

## Table of Contents

1. [Roles & Permissions](#roles--permissions)
2. [Tasks Management](#tasks-management) 
3. [Holidays Management](#holidays-management)
4. [Payroll Management](#payroll-management)
5. [Billing Management](#billing-management)
6. [Notifications](#notifications)
7. [Authentication & Public Pages](#authentication--public-pages)
8. [Best Practices](#best-practices)
9. [Error Handling](#error-handling)
10. [Performance Optimization](#performance-optimization)

## Roles & Permissions

### Basic Usage

```tsx
import { useRoles, useCreateRole, useAssignPermissions } from '@/hooks/queries'

function RoleManagement() {
  const { data: roles, isLoading, error } = useRoles()
  const createRoleMutation = useCreateRole()
  const assignPermissionsMutation = useAssignPermissions()

  const handleCreateRole = async () => {
    try {
      await createRoleMutation.mutateAsync({
        name: 'Manager',
        description: 'Department manager role',
        permissions: ['READ_USERS', 'MANAGE_TASKS']
      })
      // Success handled automatically by TanStack Query
    } catch (error) {
      console.error('Failed to create role:', error)
    }
  }

  const handleAssignPermissions = async (roleId: string, permissionIds: string[]) => {
    await assignPermissionsMutation.mutateAsync({
      roleId,
      data: { permissionIds }
    })
  }

  if (isLoading) return <div>Loading roles...</div>
  if (error) return <div>Error loading roles</div>

  return (
    <div>
      {roles?.map(role => (
        <div key={role.id}>
          <h3>{role.name}</h3>
          <p>{role.description}</p>
          <button onClick={() => handleAssignPermissions(role.id, ['NEW_PERMISSION'])}>
            Assign Permissions
          </button>
        </div>
      ))}
      <button onClick={handleCreateRole}>Create New Role</button>
    </div>
  )
}
```

### Permission Management

```tsx
import { usePermissions, usePermissionCategories, useCreatePermissionPreset } from '@/hooks/queries'

function PermissionManager() {
  const { data: permissions } = usePermissions({ category: 'SYSTEM' })
  const { data: categories } = usePermissionCategories()
  const createPresetMutation = useCreatePermissionPreset()

  const handleCreatePreset = async () => {
    await createPresetMutation.mutateAsync({
      name: 'Basic User',
      description: 'Standard user permissions',
      permissionIds: ['READ_PROFILE', 'UPDATE_PROFILE'],
      isDefault: true
    })
  }

  return (
    <div>
      <h2>Permission Categories</h2>
      {categories?.map(category => (
        <div key={category.id}>
          <h3>{category.name}</h3>
          <ul>
            {category.permissions.map(permission => (
              <li key={permission.id}>{permission.name}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
```

## Tasks Management

### Task CRUD Operations

```tsx
import { 
  useTasks, 
  useCreateTask, 
  useUpdateTask, 
  useAssignTask,
  useTaskUpdates 
} from '@/hooks/queries'

function TaskManagement() {
  const { data: tasks, isLoading } = useTasks({ status: 'PENDING' })
  const createTaskMutation = useCreateTask()
  const updateTaskMutation = useUpdateTask()
  const assignTaskMutation = useAssignTask()

  const handleCreateTask = async () => {
    await createTaskMutation.mutateAsync({
      title: 'New Task',
      description: 'Task description',
      priority: 'HIGH',
      dueDate: '2024-12-31',
      groupId: 'group-id',
      assignees: ['user-1', 'user-2']
    })
  }

  const handleUpdateTaskStatus = async (taskId: string) => {
    await updateTaskMutation.mutateAsync({
      id: taskId,
      data: { status: 'IN_PROGRESS' }
    })
  }

  const handleAssignTask = async (taskId: string, userIds: string[]) => {
    await assignTaskMutation.mutateAsync({
      taskId,
      data: { userIds }
    })
  }

  if (isLoading) return <div>Loading tasks...</div>

  return (
    <div>
      {tasks?.map(task => (
        <TaskCard 
          key={task.id} 
          task={task}
          onUpdateStatus={handleUpdateTaskStatus}
          onAssign={handleAssignTask}
        />
      ))}
      <button onClick={handleCreateTask}>Create Task</button>
    </div>
  )
}
```

### Task Group Management

```tsx
import { 
  useTaskGroups, 
  useCreateTaskGroup, 
  useAddGroupMembers,
  useTaskGroup 
} from '@/hooks/queries'

function TaskGroupManagement() {
  const { data: groups } = useTaskGroups()
  const { data: groupDetails } = useTaskGroup('group-id')
  const createGroupMutation = useCreateTaskGroup()
  const addMembersMutation = useAddGroupMembers()

  const handleCreateGroup = async () => {
    await createGroupMutation.mutateAsync({
      name: 'Development Team',
      description: 'Frontend development tasks',
      members: ['user-1', 'user-2']
    })
  }

  const handleAddMembers = async (groupId: string, userIds: string[]) => {
    await addMembersMutation.mutateAsync({
      groupId,
      userIds
    })
  }

  return (
    <div>
      {groups?.map(group => (
        <div key={group.id}>
          <h3>{group.name}</h3>
          <p>Members: {group._count?.members}</p>
          <p>Tasks: {group._count?.tasks}</p>
          <button onClick={() => handleAddMembers(group.id, ['new-user'])}>
            Add Members
          </button>
        </div>
      ))}
    </div>
  )
}
```

## Holidays Management

### Holiday Operations

```tsx
import { 
  useHolidays, 
  useHolidayCalendar, 
  useCreateHoliday,
  useHolidayTypes,
  useBulkCreateHolidays 
} from '@/hooks/queries'

function HolidayManagement() {
  const { data: holidays } = useHolidays()
  const { data: calendar } = useHolidayCalendar(2024, 12)
  const { data: holidayTypes } = useHolidayTypes()
  const createHolidayMutation = useCreateHoliday()
  const bulkCreateMutation = useBulkCreateHolidays()

  const handleCreateHoliday = async () => {
    await createHolidayMutation.mutateAsync({
      name: 'New Year',
      description: 'New Year celebration',
      date: '2024-01-01',
      isRecurring: true,
      holidayTypeId: 'national-holiday-type',
      isActive: true
    })
  }

  const handleBulkCreate = async () => {
    const holidaysToCreate = [
      {
        name: 'Christmas',
        date: '2024-12-25',
        holidayTypeId: 'national-holiday-type'
      },
      {
        name: 'Boxing Day',
        date: '2024-12-26',
        holidayTypeId: 'national-holiday-type'
      }
    ]
    
    await bulkCreateMutation.mutateAsync(holidaysToCreate)
  }

  return (
    <div>
      <h2>Holidays Calendar</h2>
      {calendar?.map(entry => (
        <div key={entry.id}>
          <strong>{entry.name}</strong> - {entry.date}
          <span className={`badge ${entry.type.color}`}>
            {entry.type.name}
          </span>
        </div>
      ))}
      
      <button onClick={handleCreateHoliday}>Add Holiday</button>
      <button onClick={handleBulkCreate}>Bulk Import</button>
    </div>
  )
}
```

## Payroll Management

### Payroll Processing

```tsx
import { 
  usePayrolls, 
  usePayrollStats, 
  useGeneratePayroll,
  useBulkGeneratePayroll,
  useApprovePayroll,
  useProcessPayroll 
} from '@/hooks/queries'

function PayrollManagement() {
  const { data: payrolls } = usePayrolls({ status: 'PENDING' })
  const { data: stats } = usePayrollStats()
  const generateMutation = useGeneratePayroll()
  const bulkGenerateMutation = useBulkGeneratePayroll()
  const approveMutation = useApprovePayroll()
  const processMutation = useProcessPayroll()

  const handleGeneratePayroll = async (userId: string) => {
    await generateMutation.mutateAsync({
      userId,
      month: 12,
      year: 2024
    })
  }

  const handleBulkGenerate = async (userIds: string[]) => {
    await bulkGenerateMutation.mutateAsync({
      userIds,
      month: 12,
      year: 2024
    })
  }

  const handleApprove = async (payrollId: string) => {
    await approveMutation.mutateAsync(payrollId)
  }

  const handleProcessPayments = async (payrollIds: string[]) => {
    await processMutation.mutateAsync({
      payrollIds,
      paymentMethod: 'BANK_TRANSFER',
      notes: 'December 2024 salary payment'
    })
  }

  return (
    <div>
      <div className="stats">
        <h2>Payroll Statistics</h2>
        <p>Total Employees: {stats?.totalEmployees}</p>
        <p>Processed: {stats?.processedPayrolls}</p>
        <p>Pending: {stats?.pendingPayrolls}</p>
        <p>Total Amount: ${stats?.totalPayrollAmount}</p>
      </div>

      <div className="payrolls">
        {payrolls?.map(payroll => (
          <div key={payroll.id}>
            <h3>{payroll.user.firstName} {payroll.user.lastName}</h3>
            <p>Net Pay: ${payroll.netPay}</p>
            <p>Status: {payroll.status}</p>
            
            {payroll.status === 'PENDING' && (
              <button onClick={() => handleApprove(payroll.id)}>
                Approve
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Billing Management

### Invoice and Payment Processing

```tsx
import { 
  useBills, 
  useBillInvoice, 
  useCreatePayment,
  useProcessPayment,
  useBillingStats,
  useMarkBillAsPaid 
} from '@/hooks/queries'

function BillingManagement() {
  const { data: bills } = useBills({ status: 'PENDING' })
  const { data: stats } = useBillingStats()
  const createPaymentMutation = useCreatePayment()
  const processPaymentMutation = useProcessPayment()
  const markPaidMutation = useMarkBillAsPaid()

  const handleCreatePayment = async (billId: string) => {
    await createPaymentMutation.mutateAsync({
      billId,
      amount: 1000,
      paymentMethod: 'CREDIT_CARD',
      paymentGateway: 'stripe'
    })
  }

  const handleProcessPayment = async (paymentId: string) => {
    await processPaymentMutation.mutateAsync({
      paymentId,
      status: 'COMPLETED',
      transactionId: 'txn_12345'
    })
  }

  const handleMarkAsPaid = async (billId: string) => {
    await markPaidMutation.mutateAsync({
      billId,
      paymentDetails: {
        method: 'BANK_TRANSFER',
        reference: 'REF123'
      }
    })
  }

  return (
    <div>
      <div className="billing-stats">
        <h2>Billing Overview</h2>
        <p>Total Revenue: ${stats?.totalRevenue}</p>
        <p>Pending Amount: ${stats?.pendingAmount}</p>
        <p>Overdue Amount: ${stats?.overdueAmount}</p>
      </div>

      <div className="bills">
        {bills?.map(bill => (
          <div key={bill.id}>
            <h3>{bill.organization.name}</h3>
            <p>Amount: ${bill.amount}</p>
            <p>Due Date: {bill.dueDate}</p>
            <p>Status: {bill.status}</p>
            
            <button onClick={() => handleCreatePayment(bill.id)}>
              Process Payment
            </button>
            <button onClick={() => handleMarkAsPaid(bill.id)}>
              Mark as Paid
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Notifications

### Notification Center

```tsx
import { 
  useUnreadNotifications, 
  useNotificationStats,
  useMarkAsRead,
  useMarkAllAsRead,
  useNotificationPreferences,
  useSendBulkNotification 
} from '@/hooks/queries'

function NotificationCenter({ userId }: { userId: string }) {
  const { data: unreadNotifications } = useUnreadNotifications(userId)
  const { data: stats } = useNotificationStats(userId)
  const { data: preferences } = useNotificationPreferences(userId)
  const markAsReadMutation = useMarkAsRead()
  const markAllReadMutation = useMarkAllAsRead()
  const sendBulkMutation = useSendBulkNotification()

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsReadMutation.mutateAsync(notificationId)
  }

  const handleMarkAllAsRead = async () => {
    await markAllReadMutation.mutateAsync(userId)
  }

  const handleSendBulkNotification = async () => {
    await sendBulkMutation.mutateAsync({
      title: 'System Maintenance',
      message: 'System will be down for maintenance',
      type: 'WARNING',
      category: 'SYSTEM',
      recipientIds: ['user-1', 'user-2'],
      priority: 'HIGH'
    })
  }

  return (
    <div>
      <div className="notification-header">
        <h2>Notifications ({stats?.unread})</h2>
        <button onClick={handleMarkAllAsRead}>
          Mark All Read
        </button>
      </div>

      <div className="notifications">
        {unreadNotifications?.map(notification => (
          <div key={notification.id} className={`notification ${notification.type}`}>
            <h4>{notification.title}</h4>
            <p>{notification.message}</p>
            <small>{notification.createdAt}</small>
            
            <button onClick={() => handleMarkAsRead(notification.id)}>
              Mark Read
            </button>
          </div>
        ))}
      </div>

      <div className="preferences">
        <h3>Notification Preferences</h3>
        <p>Email: {preferences?.emailNotifications ? 'Enabled' : 'Disabled'}</p>
        <p>Push: {preferences?.pushNotifications ? 'Enabled' : 'Disabled'}</p>
        <p>SMS: {preferences?.smsNotifications ? 'Enabled' : 'Disabled'}</p>
      </div>
    </div>
  )
}
```

## Authentication & Public Pages

### Login Flow

```tsx
import { useLogin, useCheckEmail, useVerifyPassword } from '@/hooks/queries'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const { data: emailCheck } = useCheckEmail(email)
  const loginMutation = useLogin()
  const verifyPasswordMutation = useVerifyPassword()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // First verify password
      await verifyPasswordMutation.mutateAsync({
        email,
        password
      })
      
      // Then login
      await loginMutation.mutateAsync({
        email,
        password,
        rememberMe: true
      })
      
      // Redirect on success
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        {emailCheck && !emailCheck.exists && (
          <p>Email not found</p>
        )}
      </div>
      
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
      </div>
      
      <button 
        type="submit" 
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

### Password Reset Flow

```tsx
import { useForgotPassword, useResetPassword, useValidateToken } from '@/hooks/queries'

function PasswordReset({ token }: { token?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const { data: tokenValidation } = useValidateToken(token || '')
  const forgotPasswordMutation = useForgotPassword()
  const resetPasswordMutation = useResetPassword()

  const handleForgotPassword = async () => {
    await forgotPasswordMutation.mutateAsync({ email })
  }

  const handleResetPassword = async () => {
    if (!token) return
    
    await resetPasswordMutation.mutateAsync({
      token,
      password,
      confirmPassword: password
    })
  }

  if (token) {
    if (!tokenValidation?.valid) {
      return <div>Invalid or expired token</div>
    }

    return (
      <form onSubmit={(e) => {
        e.preventDefault()
        handleResetPassword()
      }}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New Password"
        />
        <button type="submit">Reset Password</button>
      </form>
    )
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleForgotPassword()
    }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit">Send Reset Link</button>
    </form>
  )
}
```

## Best Practices

### 1. Query Key Organization

```tsx
// Use the centralized query keys
import { taskKeys, notificationKeys } from '@/hooks/queries'

// Good: Consistent query key structure
const { data } = useQuery({
  queryKey: taskKeys.userTasks(userId),
  queryFn: () => fetchUserTasks(userId)
})

// Good: Using filters in query keys
const { data } = useTasks({ 
  status: 'PENDING',
  priority: 'HIGH' 
})
```

### 2. Optimistic Updates

```tsx
function TaskStatusUpdate({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient()
  const updateTaskMutation = useUpdateTask()

  const handleStatusChange = async (newStatus: string) => {
    // Optimistic update
    queryClient.setQueryData(
      taskKeys.detail(taskId),
      (old: Task) => old ? { ...old, status: newStatus } : old
    )

    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        data: { status: newStatus }
      })
    } catch (error) {
      // Revert on error
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
    }
  }

  return (
    <select onChange={(e) => handleStatusChange(e.target.value)}>
      <option value="PENDING">Pending</option>
      <option value="IN_PROGRESS">In Progress</option>
      <option value="COMPLETED">Completed</option>
    </select>
  )
}
```

### 3. Background Data Fetching

```tsx
function Dashboard() {
  // Fetch critical data immediately
  const { data: userTasks } = useUserTasks(userId)
  
  // Fetch less critical data in background
  const { data: notifications } = useUnreadNotifications(userId, {
    ...queryOptions.background
  })
  
  // Fetch stats with longer stale time
  const { data: stats } = usePayrollStats(userId, {
    ...queryOptions.static
  })

  return (
    <div>
      <TaskSummary tasks={userTasks} />
      <NotificationBadge count={notifications?.length} />
      <StatsWidget stats={stats} />
    </div>
  )
}
```

### 4. Conditional Queries

```tsx
function UserProfile({ userId }: { userId?: string }) {
  // Only fetch if userId is available
  const { data: user } = useUser(userId, {
    enabled: !!userId
  })
  
  // Dependent query - only fetch permissions if user is loaded
  const { data: permissions } = useUserPermissions(userId!, {
    enabled: !!userId && !!user
  })

  if (!userId) return <div>Please select a user</div>
  if (!user) return <div>Loading user...</div>

  return (
    <div>
      <h1>{user.firstName} {user.lastName}</h1>
      <div>Permissions: {permissions?.length}</div>
    </div>
  )
}
```

## Error Handling

### Global Error Handling

```tsx
import { useAuthenticatedQuery, useAuthenticatedMutation } from '@/hooks/queries'

function ComponentWithErrorHandling() {
  // Automatically handles auth errors
  const { data, error } = useAuthenticatedQuery(
    ['protected-data'],
    fetchProtectedData
  )

  // Custom error handling
  const mutation = useAuthenticatedMutation(updateData, {
    onError: (error) => {
      if (error.response?.status === 403) {
        toast.error('You do not have permission to perform this action')
      } else {
        toast.error('Something went wrong')
      }
    }
  })

  if (error) {
    return <ErrorBoundary error={error} />
  }

  return <div>{/* Component content */}</div>
}
```

### Retry Strategies

```tsx
function DataComponent() {
  const { data, error, refetch } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    retry: (failureCount, error) => {
      // Don't retry on client errors
      if (error.response?.status >= 400 && error.response?.status < 500) {
        return false
      }
      // Retry up to 3 times for server errors
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  if (error) {
    return (
      <div>
        <p>Failed to load data</p>
        <button onClick={() => refetch()}>Try Again</button>
      </div>
    )
  }

  return <div>{/* Data content */}</div>
}
```

## Performance Optimization

### 1. Selective Invalidation

```tsx
function useOptimizedTaskUpdate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateTask,
    onSuccess: (updatedTask) => {
      // Only invalidate specific queries
      queryClient.setQueryData(
        taskKeys.detail(updatedTask.id),
        updatedTask
      )
      
      // Selectively invalidate list views
      queryClient.invalidateQueries({
        queryKey: taskKeys.userTasks(updatedTask.assignments[0]?.assignedToId),
        exact: false
      })
    }
  })
}
```

### 2. Prefetching

```tsx
function TaskList() {
  const queryClient = useQueryClient()
  const { data: tasks } = useTasks()

  const handleTaskHover = (taskId: string) => {
    // Prefetch task details on hover
    queryClient.prefetchQuery({
      queryKey: taskKeys.detail(taskId),
      queryFn: () => fetchTaskById(taskId),
      staleTime: 5 * 60 * 1000
    })
  }

  return (
    <div>
      {tasks?.map(task => (
        <div 
          key={task.id}
          onMouseEnter={() => handleTaskHover(task.id)}
        >
          {task.title}
        </div>
      ))}
    </div>
  )
}
```

### 3. Pagination and Infinite Queries

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'

function InfiniteNotificationsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['notifications', 'infinite'],
    queryFn: ({ pageParam = 0 }) =>
      fetchNotifications({ offset: pageParam, limit: 20 }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length * 20 : undefined,
  })

  return (
    <div>
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.notifications.map(notification => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </React.Fragment>
      ))}
      
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? 'Loading more...'
          : hasNextPage
          ? 'Load More'
          : 'Nothing more to load'}
      </button>
    </div>
  )
}
```

This comprehensive implementation provides a robust, scalable, and maintainable query layer for your entire application using TanStack Query best practices.
