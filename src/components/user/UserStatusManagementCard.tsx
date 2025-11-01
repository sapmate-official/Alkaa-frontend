import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Pause, 
  Play,
  RotateCcw,
  Calendar
} from 'lucide-react'
import { TerminationDialog } from '@/components/user/TerminationDialog'
import { useUpdateUserStatus, useReactivateUser } from '@/hooks/queries/useUserStatus'
import { User } from '@/types/general'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface UserStatusManagementCardProps {
  user: User
  canManageStatus: boolean
}

export const UserStatusManagementCard: React.FC<UserStatusManagementCardProps> = ({
  user,
  canManageStatus
}) => {
  const [showTerminateDialog, setShowTerminateDialog] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<'activate' | 'suspend' | 'inactive' | null>(null)

  const updateStatusMutation = useUpdateUserStatus()
  const reactivateMutation = useReactivateUser()

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          label: 'Active'
        }
      case 'inactive':
        return {
          icon: <Pause className="h-5 w-5" />,
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          label: 'Inactive'
        }
      case 'suspended':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
          label: 'Suspended'
        }
      case 'terminated':
        return {
          icon: <XCircle className="h-5 w-5" />,
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          label: 'Terminated'
        }
      default:
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          label: status
        }
    }
  }

  const handleStatusChange = (newStatus: 'activate' | 'suspend' | 'inactive') => {
    setPendingAction(newStatus)
    setShowConfirmDialog(true)
  }

  const confirmStatusChange = async () => {
    if (!pendingAction) return

    const statusMap = {
      activate: 'active',
      suspend: 'suspended',
      inactive: 'inactive'
    }

    await updateStatusMutation.mutateAsync({
      userId: user.id,
      data: {
        status: statusMap[pendingAction] as any,
        reason: `User ${pendingAction}d by admin`
      }
    })

    setShowConfirmDialog(false)
    setPendingAction(null)
  }

  const handleReactivate = async () => {
    await reactivateMutation.mutateAsync({
      userId: user.id,
      data: {
        reason: 'User reactivated by admin'
      }
    })
  }

  const statusConfig = getStatusConfig(user.status)

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>User Status</span>
            <Badge className={`${statusConfig.color} flex items-center gap-1.5 px-3 py-1`}>
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.terminationDate && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <Calendar className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Scheduled Termination
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {new Date(user.terminationDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          {canManageStatus && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Quick Actions</p>
              <div className="flex flex-wrap gap-2">
                {user.status === 'active' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange('inactive')}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Mark Inactive
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange('suspend')}
                      disabled={updateStatusMutation.isPending}
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Suspend
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowTerminateDialog(true)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Terminate
                    </Button>
                  </>
                )}

                {(user.status === 'inactive' || user.status === 'suspended') && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleStatusChange('activate')}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Activate
                    </Button>
                    {user.status === 'inactive' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange('suspend')}
                        disabled={updateStatusMutation.isPending}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Suspend
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowTerminateDialog(true)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Terminate
                    </Button>
                  </>
                )}

                {user.status === 'terminated' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleReactivate}
                    disabled={reactivateMutation.isPending}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reactivate User
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TerminationDialog
        open={showTerminateDialog}
        onOpenChange={setShowTerminateDialog}
        user={user}
      />

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {pendingAction} {user.firstName} {user.lastName}?
              {pendingAction === 'suspend' && (
                <span className="block mt-2 text-orange-600 dark:text-orange-400">
                  This will immediately block the user's access to the system.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
