import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Loader from '@/components/Loader';
import { useAuth } from '@/providers/AuthContext';
import { useAtom } from 'jotai';
import { permissionListAtom } from '@/store/atom';
// Import TanStack Query hooks
import { 
  useUpdateTask, 
  useAssignTask, 
  useUnassignTask,
  Task 
} from '@/hooks/queries/useTasks';
import { useEmployees } from '@/hooks/queries/useEmployees';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onTaskUpdated: () => void;
  onAssignmentUpdated: () => void;
}

// Custom hook for debouncing search queries
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const EditTaskDialog: React.FC<EditTaskDialogProps> = ({
  open,
  onOpenChange,
  task,
  onTaskUpdated,
  onAssignmentUpdated
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permissionList] = useAtom(permissionListAtom);
  
  // State variables
  const [loading, setLoading] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [loadUsersOnDemand, setLoadUsersOnDemand] = useState(false);
  const [userListPage, setUserListPage] = useState(1);
  
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    priority: "MEDIUM" | "LOW" | "HIGH" | "URGENT";
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  }>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'PENDING'
  });

  // Mutation hooks
  const updateTaskMutation = useUpdateTask();
  const assignTaskMutation = useAssignTask();
  const unassignTaskMutation = useUnassignTask();

  // Check permissions - can edit assignments if user is task creator or has task_manage_all permission
  const canEditAssignments = useCallback(() => {
    if (!user || !task) return false;
    
    // Debug logging
    console.log('Edit Task Permissions Check:', {
      userId: user.id,
      taskCreatorId: task.createdBy.id,
      isTaskCreator: task.createdBy.id === user.id,
      permissionList: permissionList.map(p => p.key),
      hasManageAllPermission: permissionList.some(p => p.key === 'task_manage_all'),
      hasTaskCreatePermission: permissionList.some(p => p.key === 'task_create')
    });
    
    // System administrators with task_manage_all permission
    const hasManageAllPermission = permissionList.some(p => p.key === 'task_manage_all');
    if (hasManageAllPermission) return true;
    
    // Task creators can edit assignments
    if (task.createdBy.id === user.id) return true;
    
    return false;
  }, [user, task, permissionList]);

  // Debounce search query to reduce API calls
  const debouncedSearchQuery = useDebounce(userSearchQuery, 300);
  
  // Reset pagination when search query changes
  useEffect(() => {
    setUserListPage(1);
  }, [debouncedSearchQuery]);
  
  // Only load users when needed (when dialog opens and assignment editing is allowed)
  const shouldLoadUsers = open && canEditAssignments() && (loadUsersOnDemand || debouncedSearchQuery.length > 0);
  
  // Load users conditionally
  const { data: allUsers = [], isLoading: usersLoading } = useEmployees({ 
    orgId: shouldLoadUsers ? user?.orgId : undefined 
  });

  // Efficient user filtering with pagination
  const USERS_PER_PAGE = 50;
  
  const { filteredUsers, totalFilteredUsers, hasMoreUsers } = useMemo(() => {
    if (!allUsers.length) return { filteredUsers: [], totalFilteredUsers: 0, hasMoreUsers: false };
    
    let filtered = allUsers;
    
    // Apply search filter
    if (debouncedSearchQuery.trim()) {
      const searchTerm = debouncedSearchQuery.toLowerCase();
      filtered = allUsers.filter((user: User) => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return fullName.includes(searchTerm) || 
               user.email.toLowerCase().includes(searchTerm);
      });
    }
    
    const totalCount = filtered.length;
    
    // Apply pagination for better performance
    const startIndex = (userListPage - 1) * USERS_PER_PAGE;
    const paginatedUsers = filtered.slice(startIndex, startIndex + USERS_PER_PAGE);
    
    const hasMore = (userListPage * USERS_PER_PAGE) < totalCount;
    
    return {
      filteredUsers: paginatedUsers,
      totalFilteredUsers: totalCount,
      hasMoreUsers: hasMore
    };
  }, [allUsers, debouncedSearchQuery, userListPage]);

  // Assignment toggle handler
  const handleAssignmentToggle = useCallback(async (userId: string, isCurrentlyAssigned: boolean) => {
    try {
      if (isCurrentlyAssigned) {
        await unassignTaskMutation.mutateAsync({
          taskId: task?.id || '',
          userId
        });
        toast({
          title: "Success",
          description: "User unassigned from task"
        });
      } else {
        await assignTaskMutation.mutateAsync({
          taskId: task?.id || '',
          data: { userIds: [userId] }
        });
        toast({
          title: "Success", 
          description: "User assigned to task"
        });
      }
      
      // Refresh task data
      onAssignmentUpdated();
    } catch (error) {
      console.error('Assignment toggle error:', error);
      toast({
        title: "Error",
        description: `Failed to ${isCurrentlyAssigned ? 'unassign' : 'assign'} user`,
        variant: "destructive"
      });
    }
  }, [task, assignTaskMutation, unassignTaskMutation, onTaskUpdated, toast]);

  const handleCancel = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'PENDING'
    });
    setDueDate(undefined);
    setUserSearchQuery('');
    setLoadUsersOnDemand(false);
    setUserListPage(1);
    onOpenChange(false);
  }, [onOpenChange]);

  // Populate form with existing task data when dialog opens
  useEffect(() => {
    if (open && task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority as "MEDIUM" | "LOW" | "HIGH" | "URGENT",
        status: task.status as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
      });
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
    }
    
    // Reset search and pagination when dialog opens/closes
    if (!open) {
      setUserSearchQuery('');
      setLoadUsersOnDemand(false);
      setUserListPage(1);
      // Reset form when dialog closes to prevent stale data
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'PENDING'
      });
      setDueDate(undefined);
    }
  }, [open, task?.id]); // Add task.id as dependency to ensure form updates when task changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task) {
      toast({
        title: "Error",
        description: "No task selected for editing",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Task title is required",
        variant: "destructive"
      });
      return;
    }

    // Additional validation: ensure we're not submitting with stale task data
    if (!task.id) {
      toast({
        title: "Error",
        description: "Invalid task selected",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Update basic task details
      const updateData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        dueDate: dueDate?.toISOString()
      };

      await updateTaskMutation.mutateAsync({
        id: task.id,
        data: updateData
      });
      
      onTaskUpdated();
      onOpenChange(false);
      
      toast({
        title: "Success",
        description: "Task updated successfully"
      });
      
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(value: "MEDIUM" | "LOW" | "HIGH" | "URGENT") => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED") => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Task Assignment Management - Only for authorized users */}
            {canEditAssignments() && (
              <div className="space-y-4">
                <Label>Task Assignment</Label>
                
                {/* User Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full p-2 border border-input rounded-md pr-8"
                  />
                  <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>

                {/* Load Users Button - Only show if users not loaded yet */}
                {!loadUsersOnDemand && !userSearchQuery && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLoadUsersOnDemand(true)}
                    className="w-full"
                  >
                    Load Users for Assignment
                  </Button>
                )}

                {/* Users List - with pagination */}
                {shouldLoadUsers && (
                  <div className="border rounded-md">
                    <div className="p-3 bg-muted border-b flex justify-between items-center">
                      <span className="font-medium">
                        Available Users ({totalFilteredUsers})
                      </span>
                      {usersLoading && (
                        <Loader className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto">
                      {filteredUsers.length > 0 ? (
                        <>
                          {filteredUsers.map((user: User) => {
                            const isAssigned = task?.assignments?.some(assignment => assignment.assignedTo?.id === user.id) || false;
                            
                            return (
                              <div
                                key={user.id}
                                className="p-3 border-b last:border-b-0 flex justify-between items-center hover:bg-muted/50"
                              >
                                <div>
                                  <div className="font-medium">
                                    {user.firstName} {user.lastName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {user.email}
                                  </div>
                                </div>
                                
                                <Button
                                  type="button"
                                  variant={isAssigned ? "destructive" : "default"}
                                  size="sm"
                                  onClick={() => handleAssignmentToggle(user.id, isAssigned)}
                                  disabled={assignTaskMutation.isPending || unassignTaskMutation.isPending}
                                >
                                  {isAssigned ? 'Unassign' : 'Assign'}
                                </Button>
                              </div>
                            );
                          })}
                          
                          {/* Load More Button */}
                          {hasMoreUsers && (
                            <div className="p-3 border-t">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setUserListPage(prev => prev + 1)}
                                className="w-full"
                                disabled={usersLoading}
                              >
                                {usersLoading ? (
                                  <>
                                    <Loader className="h-4 w-4 mr-2" />
                                    Loading...
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-4 w-4 mr-2" />
                                    Load More Users
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </>
                      ) : debouncedSearchQuery.trim() ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No users found matching "{debouncedSearchQuery}"
                        </div>
                      ) : usersLoading ? (
                        <div className="p-4 text-center">
                          <Loader className="h-6 w-6 mx-auto" />
                          <div className="mt-2 text-muted-foreground">Loading users...</div>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          No users available
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Current Assignments Display */}
                {task?.assignments && task.assignments.length > 0 && (
                  <div className="border rounded-md">
                    <div className="p-3 bg-primary/10 border-b">
                      <span className="font-medium text-primary">
                        Currently Assigned ({task.assignments.length})
                      </span>
                    </div>
                    <div className="space-y-2 p-3">
                      {task.assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex justify-between items-center p-2 bg-primary/5 rounded"
                        >
                          <div>
                            <div className="font-medium">
                              {assignment.assignedTo?.firstName || ''} {assignment.assignedTo?.lastName || ''}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {assignment.assignedTo?.email || ''}
                            </div>
                          </div>
                          
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleAssignmentToggle(assignment.assignedTo?.id || '', true)}
                            disabled={unassignTaskMutation.isPending}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Read-only view for non-authorized users */}
            {!canEditAssignments() && task && task.assignments && task.assignments.length > 0 && (
              <div className="space-y-2">
                <Label>Current Assignees</Label>
                <div className="p-3 bg-muted rounded-md">
                  <div className="text-sm text-muted-foreground mb-2">
                    This task is currently assigned to:
                  </div>
                  <div className="space-y-1">
                    {task.assignments.map((assignment, idx) => (
                      <div key={idx} className="text-sm">
                        {assignment.assignedTo?.firstName || ''} {assignment.assignedTo?.lastName || ''} ({assignment.assignedTo?.email || ''})
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Note: Only task creators and system administrators can modify assignments.
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} onClick={handleSubmit}>
            {loading ? 'Updating...' : 'Update Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};