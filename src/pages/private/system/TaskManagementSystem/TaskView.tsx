import { useState, useEffect } from 'react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  MessageCircle,
  Plus,
  Calendar,
  Filter,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/providers/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAtom } from 'jotai';
import { permissionListAtom } from '@/store/atom';
import { useNavigate } from 'react-router-dom';
import CreateTaskDialog from './components/CreateTaskDialog';
import { EditTaskDialog } from './components/EditTaskDialog';
import TaskChatView from './components/TaskChatView';
// Import TanStack Query hooks
import { 
  useManagerTasks,
  useUserTasks,
  Task
} from '@/hooks/queries/useTasks';

const TaskView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [permissionList] = useAtom(permissionListAtom);
  
  // Use TanStack Query hooks to fetch both manager tasks and assigned tasks
  // Only fetch if user ID is available to prevent API calls with empty strings
  const { 
    data: managerTasks = [], 
    isLoading: isLoadingManagerTasks,
    refetch: refetchManagerTasks 
  } = useManagerTasks(user?.id || '');
  
  const { 
    data: userTasks = [], 
    isLoading: isLoadingUserTasks,
    refetch: refetchUserTasks 
  } = useUserTasks(user?.id || '');
  
  // Combine and deduplicate tasks with proper update handling
  const tasks = React.useMemo(() => {
    const taskMap = new Map<string, Task>();
    
    // Helper function to get the most recent task version
    const addOrUpdateTask = (task: Task) => {
      const existing = taskMap.get(task.id);
      if (!existing || new Date(task.updatedAt || task.createdAt) > new Date(existing.updatedAt || existing.createdAt)) {
        taskMap.set(task.id, task);
      }
    };
    
    // Add manager tasks
    managerTasks.forEach(addOrUpdateTask);
    
    // Add user tasks (assigned tasks) 
    userTasks.forEach(addOrUpdateTask);
    
    return Array.from(taskMap.values());
  }, [managerTasks, userTasks]);
  
  const isLoading = isLoadingManagerTasks || isLoadingUserTasks;
  
  const refetchTasks = () => {
    refetchManagerTasks();
    refetchUserTasks();
  };
  
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showTaskChat, setShowTaskChat] = useState(false);

  // Check if user has permission to create tasks (only if permissions are loaded)
  const canCreateTasks = permissionList.length > 0 && permissionList.some(p => p.key === 'task_create');
  // Check if user has management permissions (create or manage all) (only if permissions are loaded)
  const hasManagementPermissions = permissionList.length > 0 && permissionList.some(p => p.key === 'task_create' || p.key === 'task_manage_all');
  // Check if user can edit tasks (either task creator or assigned user)
  const canEditTask = (task: Task) => {
    if (!user) return false;
    // Can edit if user is the creator
    if (task.createdBy?.id === user.id) return true;
    // Can edit if user is assigned to the task
    if (task.assignments?.some(a => a.assignedTo?.id === user.id)) return true;
    return false;
  };

  useEffect(() => {
    let filtered = tasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  // Update selected task when tasks data changes
  useEffect(() => {
    if (selectedTask && tasks.length > 0) {
      const updatedTask = tasks.find(task => task.id === selectedTask.id);
      if (updatedTask) {
        // Only update if the task content has actually changed
        const hasChanged = JSON.stringify(updatedTask) !== JSON.stringify(selectedTask);
        if (hasChanged) {
          setSelectedTask(updatedTask);
        }
      } else {
        // Task was deleted or no longer accessible, clear selection
        setSelectedTask(null);
        toast({
          title: "Info",
          description: "Selected task is no longer available",
        });
      }
    }
  }, [tasks, selectedTask?.id, selectedTask?.updatedAt]); // Use stable dependencies

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };

  const handleTaskCreated = () => {
    setShowCreateTask(false);
    refetchTasks(); // Use TanStack Query refetch instead
    toast({
      title: "Success",
      description: "Task created successfully"
    });
  };

  const handleTaskUpdated = () => {
    setShowEditTask(false);
    refetchTasks(); // Use TanStack Query refetch instead
    toast({
      title: "Success",
      description: "Task updated successfully"
    });
  };

  const handleAssignmentUpdated = () => {
    refetchTasks(); // Refresh the tasks list to get updated assignments
    toast({
      title: "Success",
      description: "Assignment updated successfully"
    });
  };

  const openTaskEdit = () => {
    setShowEditTask(true);
  };

  const openTaskChat = (task: Task) => {
    setSelectedTask(task);
    setShowTaskChat(true);
  };

  const navigateToTaskDashboard = () => {
    navigate('/p/task/dashboard');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pending', variant: 'secondary' as const },
      IN_PROGRESS: { label: 'In Progress', variant: 'default' as const },
      COMPLETED: { label: 'Completed', variant: 'default' as const },
      CANCELLED: { label: 'Cancelled', variant: 'destructive' as const }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config?.variant || 'secondary'}>{config?.label || status}</Badge>;
  };

  const formatDate = (dateString: string | null | undefined, fallback: string = 'No date') => {
    if (!dateString) return fallback;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return fallback;
      return date.toLocaleDateString();
    } catch (error) {
      console.warn('Date formatting error:', error);
      return fallback;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { label: 'Low', variant: 'secondary' as const },
      MEDIUM: { label: 'Medium', variant: 'default' as const },
      HIGH: { label: 'High', variant: 'destructive' as const },
      URGENT: { label: 'Urgent', variant: 'destructive' as const }
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return <Badge variant={config?.variant || 'secondary'}>{config?.label || priority}</Badge>;
  };

  const getTaskAssignees = (task: Task) => {
    return task.assignments?.map(a => a.assignedTo).filter(assignee => 
      assignee && 
      assignee.firstName && 
      assignee.lastName &&
      typeof assignee.firstName === 'string' &&
      typeof assignee.lastName === 'string'
    ) || [];
  };

  return (
    <div className="h-full flex w-full">
      {/* Tasks List */}
      <div className="w-1/3 border-r border-border">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Tasks</h2>
            <div className="flex items-center gap-2">
              {hasManagementPermissions && (
                <Button 
                  onClick={navigateToTaskDashboard} 
                  size="sm" 
                  variant="outline"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              )}
              {canCreateTasks && (
                <Button onClick={() => setShowCreateTask(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              >
                <option value="ALL">All Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-14rem)]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-3 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="flex gap-2">
                    <div className="h-5 bg-gray-200 rounded w-16"></div>
                    <div className="h-5 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tasks found</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskSelect(task)}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors border-l-4 ${task.priority === 'HIGH' || task.priority === 'URGENT'
                      ? 'border-l-red-500'
                      : task.priority === 'MEDIUM'
                        ? 'border-l-yellow-500'
                        : 'border-l-green-500'
                    } ${selectedTask?.id === task.id ? 'bg-accent' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm truncate pr-2">{task.title}</h3>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>

                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {task.description}
                  </p>

                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(task.status)}
                    {getPriorityBadge(task.priority)}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(task.dueDate, 'No due date')}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {task.updates?.length || 0}
                    </div>
                  </div>

                  {getTaskAssignees(task).length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <div className="flex -space-x-1">
                        {getTaskAssignees(task).slice(0, 3).map((assignee, idx) => (
                          <Avatar key={assignee?.id || idx} className="h-5 w-5 border-2 border-background">
                            <AvatarFallback className="text-xs">
                              {(assignee?.firstName?.[0] || '').toUpperCase()}{(assignee?.lastName?.[0] || '').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {getTaskAssignees(task).length > 3 && (
                          <div className="h-5 w-5 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-xs">+{getTaskAssignees(task).length - 3}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Details Panel */}
      <div className="flex-1 flex flex-col">
        {selectedTask ? (
          <>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">{selectedTask.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    Created by {selectedTask.createdBy?.firstName || 'Unknown'} {selectedTask.createdBy?.lastName || 'User'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openTaskChat(selectedTask)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                  {canEditTask(selectedTask) && selectedTask.status !== 'COMPLETED' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={openTaskEdit}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                {/* Task Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Task Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Description</label>
                      <p className="mt-1">{selectedTask.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div className="mt-1">
                          {getStatusBadge(selectedTask.status)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Priority</label>
                        <div className="mt-1">
                          {getPriorityBadge(selectedTask.priority)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                        <p className="mt-1">
                          {formatDate(selectedTask.dueDate, 'No due date set')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Created</label>
                        <p className="mt-1">
                          {formatDate(selectedTask.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Assignees */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Assigned To</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getTaskAssignees(selectedTask).length === 0 ? (
                      <p className="text-muted-foreground">No one assigned</p>
                    ) : (
                      <div className="space-y-3">
                        {getTaskAssignees(selectedTask).map((assignee, idx) => (
                          <div key={assignee?.id || idx} className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {(assignee?.firstName?.[0] || '').toUpperCase()}{(assignee?.lastName?.[0] || '').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {(assignee?.firstName || '').trim()} {(assignee?.lastName || '').trim()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {assignee?.email || 'No email'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Updates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Updates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!selectedTask.updates || selectedTask.updates.length === 0 ? (
                      <p className="text-muted-foreground">No updates yet</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedTask.updates.slice(0, 5).map((update) => (
                          <div key={update.id} className="border-l-2 border-muted pl-4">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium">
                                {update.updatedBy?.firstName || 'Unknown'} {update.updatedBy?.lastName || 'User'}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(update.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{update.message}</p>
                            {update.status && (
                              <div className="mt-1">
                                {getStatusBadge(update.status)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
              <h2 className="text-xl font-medium mb-2">Select a task</h2>
              <p className="text-muted-foreground">
                Choose a task from the list to view details and manage progress
              </p>
            </div>
          </div>
        )}
      </div>

      <CreateTaskDialog
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        onTaskCreated={handleTaskCreated}
      />

      <EditTaskDialog
        open={showEditTask}
        onOpenChange={setShowEditTask}
        onTaskUpdated={handleTaskUpdated}
        onAssignmentUpdated={handleAssignmentUpdated}
        task={selectedTask}
      />

      <TaskChatView
        open={showTaskChat}
        onOpenChange={setShowTaskChat}
        task={selectedTask}
      />
    </div>
  );
};

export default TaskView;
