import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  MessageCircle, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  ArrowLeft,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '@/providers/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { permissionListAtom } from '@/store/atom';
import RouteDict from '@/routes/RouteDict';

// Import TanStack Query hooks
import { 
  useUserTasks,
  useUpdateTask,
  useCreateTaskUpdate,
  Task
} from '@/hooks/queries/useTasks';

const EmployeeView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [permissionList] = useAtom(permissionListAtom);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [newUpdate, setNewUpdate] = useState('');
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [isMobileTaskDetailsOpen, setIsMobileTaskDetailsOpen] = useState(false);

  // TanStack Query hooks
  const { 
    data: tasks = [], 
    isLoading
  } = useUserTasks(user?.id || '');
  
  const updateTaskMutation = useUpdateTask();
  const createTaskUpdateMutation = useCreateTaskUpdate();

  // Check if user has management permissions
  const hasTaskCreate = permissionList.some(p => p.key === 'task_create');
  const hasTaskManageAll = permissionList.some(p => p.key === 'task_manage_all');
  console.log(hasTaskCreate,hasTaskManageAll)
  const canAccessDashboard = hasTaskCreate || hasTaskManageAll;

  // Handle navigation to dashboard
  const handleNavigateToDashboard = () => {
    navigate(RouteDict.Task.Dashboard);
  };

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedTask?.updates?.length) {
      scrollToBottom();
    }
  }, [selectedTask?.updates?.length]);

  // Filter tasks based on search term and status
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchTerm === '' || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle task selection from URL parameters
  useEffect(() => {
    const taskId = searchParams.get('taskId');
    if (taskId && tasks.length > 0) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setSelectedTask(task);
        setIsMobileTaskDetailsOpen(true);
        toast({
          title: "Task Selected",
          description: `Viewing details for "${task.title}"`,
        });
      } else {
        toast({
          title: "Task Not Found",
          description: "The requested task could not be found.",
          variant: "destructive"
        });
      }
      // Clear the URL parameter after processing
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('taskId');
        return newParams;
      });
    }
  }, [tasks, searchParams, setSearchParams, toast]);

  const updateTaskStatus = async (taskId: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') => {
    try {
      setUpdatingTaskId(taskId);
      
      const updatedTask = await updateTaskMutation.mutateAsync({
        id: taskId,
        data: { status: newStatus }
      });
      
      // Update selected task if it's the one being updated
      if (selectedTask?.id === taskId) {
        setSelectedTask(updatedTask);
      }
      
      toast({
        title: "Success",
        description: "Task status updated successfully"
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive"
      });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const submitUpdate = async () => {
    if (!selectedTask || !newUpdate.trim()) return;

    const messageText = newUpdate.trim();

    try {
      setIsSubmittingUpdate(true);
      setNewUpdate('');
      
      await createTaskUpdateMutation.mutateAsync({
        taskId: selectedTask.id,
        data: { message: messageText }
      });

      toast({
        title: "Success",
        description: "Update posted successfully"
      });
    } catch (error) {
      console.error('Error posting update:', error);
      setNewUpdate(messageText);
      
      toast({
        title: "Error",
        description: "Failed to post update",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
      IN_PROGRESS: { label: 'In Progress', variant: 'default' as const, icon: Clock },
      COMPLETED: { label: 'Completed', variant: 'default' as const, icon: CheckCircle },
      CANCELLED: { label: 'Cancelled', variant: "destructive" as const, icon: AlertCircle }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;
    return (
      <Badge variant={config?.variant || 'secondary'} className="flex items-center gap-1 text-xs">
        <Icon className="h-3 w-3" />
        <span className="hidden sm:inline">{config?.label || status}</span>
        <span className="sm:hidden">{(config?.label || status).slice(0, 4)}</span>
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { label: 'Low', variant: 'secondary' as const },
      MEDIUM: { label: 'Medium', variant: 'default' as const },
      HIGH: { label: 'High', variant: 'destructive' as const },
      URGENT: { label: 'Urgent', variant: 'destructive' as const }
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return (
      <Badge variant={config?.variant || 'secondary'} className="text-xs">
        <span className="hidden sm:inline">{config?.label || priority}</span>
        <span className="sm:hidden">{(config?.label || priority).slice(0, 3)}</span>
      </Badge>
    );
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && selectedTask?.status !== 'COMPLETED';
  };

  const getTaskStats = () => {
    const pending = tasks.filter(t => t.status === 'PENDING').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const overdue = tasks.filter(t => t.dueDate && isOverdue(t.dueDate)).length;
    
    return { pending, inProgress, completed, overdue };
  };

  const stats = getTaskStats();

  return (
    <div className="h-full flex flex-col w-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="p-2 sm:p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-semibold">My Tasks</h1>
          {canAccessDashboard && (
            <Button
              onClick={handleNavigateToDashboard}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex min-h-0 relative">
        {/* Tasks List - Full width on mobile when no task selected, hidden when task selected */}
        <div className={`${
          selectedTask && isMobileTaskDetailsOpen 
            ? 'hidden lg:flex' 
            : 'flex'
        } w-full lg:w-1/3 border-r border-border flex-col min-h-0`}>
          <div className="p-2 sm:p-4 border-b flex-shrink-0">
            <div className="mb-4">
              <h2 className="text-base sm:text-lg font-semibold mb-2">Overview</h2>
              <div className="flex justify-around text-center text-xs sm:text-sm">
                <div>
                  <div className="font-bold text-orange-600">{stats.pending}</div>
                  <div className="text-muted-foreground">Pending</div>
                </div>
                <div>
                  <div className="font-bold text-blue-600">{stats.inProgress}</div>
                  <div className="text-muted-foreground">In Progress</div>
                </div>
                <div>
                  <div className="font-bold text-green-600">{stats.completed}</div>
                  <div className="text-muted-foreground">Completed</div>
                </div>
                <div>
                  <div className="font-bold text-red-600">{stats.overdue}</div>
                  <div className="text-muted-foreground">Overdue</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search my tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar mobile-scroll-momentum">
            {isLoading ? (
              <div className="p-2 sm:p-4 space-y-3">
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
              <div className="p-4 sm:p-8 text-center">
                <CheckCircle className="h-8 sm:h-12 w-8 sm:w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-sm sm:text-base">No tasks found</p>
              </div>
            ) : (
              <div className="p-1 sm:p-2">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      setSelectedTask(task);
                      setIsMobileTaskDetailsOpen(true);
                    }}
                    className={`p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors border-l-4 mb-2 mobile-touch-friendly ${
                      task.dueDate && isOverdue(task.dueDate)
                        ? 'border-l-red-500' 
                        : task.priority === 'HIGH' || task.priority === 'URGENT' 
                          ? 'border-l-orange-500' 
                          : task.priority === 'MEDIUM' 
                            ? 'border-l-yellow-500' 
                            : 'border-l-green-500'
                    } ${selectedTask?.id === task.id ? 'bg-accent' : ''} ${
                      updatingTaskId === task.id ? 'opacity-70' : ''
                    }`}
                  >
                    <div className="space-y-2">
                      <h3 className="font-medium text-xs sm:text-sm break-words">{task.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                        {task.description}
                      </p>
                      
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {task.dueDate ? (
                            <span className={`text-xs ${isOverdue(task.dueDate) ? 'text-red-600 font-medium' : ''}`}>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-xs">No due date</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          <span className="text-xs">{task.updates?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Task Details Panel - Full width on mobile when task selected */}
        <div className={`${
          selectedTask && isMobileTaskDetailsOpen 
            ? 'flex w-full absolute inset-0 bg-background z-10 lg:relative lg:flex-1 lg:z-auto' 
            : 'hidden lg:flex lg:flex-1'
        } flex-col min-h-0`}>
          {selectedTask ? (
            <>
              <div className="p-2 sm:p-4 border-b flex-shrink-0">
                <div className="flex items-center justify-between gap-2">
                  {/* Mobile back button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileTaskDetailsOpen(false)}
                    className="lg:hidden flex-shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="space-y-1 min-w-0 flex-1">
                    <h2 className="text-sm sm:text-lg font-semibold break-words">{selectedTask.title}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                      Assigned by {selectedTask.createdBy?.firstName || 'Unknown'} {selectedTask.createdBy?.lastName || 'User'}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                    {selectedTask.status === 'PENDING' && (
                      <Button 
                        size="sm"
                        onClick={() => updateTaskStatus(selectedTask.id, 'IN_PROGRESS')}
                        disabled={updatingTaskId === selectedTask.id}
                        className="text-xs sm:text-sm px-2 sm:px-4"
                      >
                        {updatingTaskId === selectedTask.id ? 'Starting...' : 'Start Task'}
                      </Button>
                    )}
                    {selectedTask.status === 'IN_PROGRESS' && (
                      <Button 
                        size="sm"
                        onClick={() => updateTaskStatus(selectedTask.id, 'COMPLETED')}
                        disabled={updatingTaskId === selectedTask.id}
                        className="text-xs sm:text-sm px-2 sm:px-4"
                      >
                        {updatingTaskId === selectedTask.id ? 'Completing...' : 'Mark Complete'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                {/* Task Details */}
                <div className="flex-shrink-0 p-2 sm:p-4 border-b overflow-y-auto custom-scrollbar mobile-scroll-momentum">
                  <Card>
                    <CardHeader className="pb-2 sm:pb-4">
                      <CardTitle className="text-sm sm:text-base">Task Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 p-2 sm:p-4">
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-muted-foreground">Description</label>
                        <p className="mt-1 break-words text-sm">{selectedTask.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div>
                          <label className="text-xs sm:text-sm font-medium text-muted-foreground">Status</label>
                          <div className="mt-1">
                            {getStatusBadge(selectedTask.status)}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs sm:text-sm font-medium text-muted-foreground">Priority</label>
                          <div className="mt-1">
                            {getPriorityBadge(selectedTask.priority)}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs sm:text-sm font-medium text-muted-foreground">Due Date</label>
                          <p className={`mt-1 text-sm ${selectedTask.dueDate && isOverdue(selectedTask.dueDate) ? 'text-red-600 font-medium' : ''}`}>
                            {selectedTask.dueDate 
                              ? new Date(selectedTask.dueDate).toLocaleDateString() 
                              : 'No due date set'
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Chat Interface */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-2 sm:p-4 border-b flex-shrink-0">
                    <h3 className="font-medium text-sm sm:text-base">Task Updates</h3>
                  </div>
                  
                  {/* Messages Container - Fixed height with scroll */}
                  <div className="flex-1 min-h-0 flex flex-col">
                    <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 custom-scrollbar mobile-scroll-momentum">
                      {!selectedTask.updates || selectedTask.updates.length === 0 ? (
                        <div className="text-center py-4 sm:py-8">
                          <MessageCircle className="h-8 sm:h-12 w-8 sm:w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground text-sm">No updates yet. Start the conversation!</p>
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          {selectedTask.updates
                            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                            .map((update) => (
                            <div key={update.id} className="flex space-x-2 sm:space-x-3">
                              <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                                <AvatarFallback className="text-xs">
                                  {update.updatedBy?.firstName?.[0] || 'U'}{update.updatedBy?.lastName?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="bg-muted rounded-lg p-2 sm:p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs sm:text-sm font-medium truncate">
                                      {update.updatedBy?.firstName || 'Unknown'} {update.updatedBy?.lastName || 'User'}
                                    </span>
                                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                      {new Date(update.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-xs sm:text-sm break-words">{update.message}</p>
                                  {update.status && (
                                    <div className="mt-2">
                                      {getStatusBadge(update.status)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}

                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    {/* Message Input - Fixed at bottom */}
                    <div className="p-2 sm:p-4 border-t bg-background flex-shrink-0">
                      <div className="flex space-x-2">
                        <Textarea
                          placeholder="Add an update to this task..."
                          value={newUpdate}
                          onChange={(e) => setNewUpdate(e.target.value)}
                          rows={2}
                          className="flex-1 resize-none text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (newUpdate.trim() && !isSubmittingUpdate) {
                                submitUpdate();
                              }
                            }
                          }}
                        />
                        <Button 
                          onClick={submitUpdate}
                          disabled={!newUpdate.trim() || isSubmittingUpdate}
                          size="sm"
                          className="flex-shrink-0 px-2 sm:px-4"
                        >
                          {isSubmittingUpdate ? (
                            <div className="flex items-center gap-1 sm:gap-2">
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                              <span className="hidden sm:inline">Posting...</span>
                            </div>
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <CheckCircle className="h-16 sm:h-24 w-16 sm:w-24 mx-auto text-muted-foreground mb-4 sm:mb-6" />
                <h2 className="text-lg sm:text-xl font-medium mb-2">Select a task</h2>
                <p className="text-muted-foreground text-sm sm:text-base px-4">
                  Choose a task from the list to view details and post updates
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeView;

