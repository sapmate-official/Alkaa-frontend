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
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/providers/AuthContext';
import { APIDictionary } from '@/services/api/v2/APIdict';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
  updates: Array<{
    id: string;
    message: string;
    status: string;
    createdAt: string;
    updatedBy?: {
      firstName: string;
      lastName: string;
    };
  }>;
}

const EmployeeView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [newUpdate, setNewUpdate] = useState('');
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [isMobileTaskDetailsOpen, setIsMobileTaskDetailsOpen] = useState(false);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedTask?.updates?.length) {
      scrollToBottom();
    }
  }, [selectedTask?.updates?.length]);

  // Helper function to update both tasks and filtered tasks
  const updateTasksState = (newTasks: Task[]) => {
    setTasks(newTasks);
    
    // Apply current filters to the new tasks
    let filtered = newTasks.filter(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    setFilteredTasks(filtered);
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  // Handle task selection from URL parameters
  useEffect(() => {
    const taskId = searchParams.get('taskId');
    if (taskId && tasks.length > 0) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setSelectedTask(task);
        setIsMobileTaskDetailsOpen(true); // Open details on mobile
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

  useEffect(() => {
    let filtered = tasks.filter(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    setFilteredTasks(filtered);
    
    // If selectedTask exists, ensure it stays updated with the latest data from tasks
    // but only if it's actually different (not a reference change)
    if (selectedTask) {
      const updatedSelectedTask = tasks.find(task => task.id === selectedTask.id);
      if (updatedSelectedTask && 
          (updatedSelectedTask.updates?.length !== selectedTask.updates?.length ||
           JSON.stringify(updatedSelectedTask) !== JSON.stringify(selectedTask))) {
        setSelectedTask(updatedSelectedTask);
      }
    }
  }, [tasks, searchTerm, statusFilter]);

  const fetchMyTasks = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(APIDictionary.tasksByUser(user?.id || ''), { 
        withCredentials: true 
      });
      const tasksData = response.data.data || [];
      updateTasksState(tasksData);
    } catch (error) {
      console.error('Error fetching my tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load your tasks",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      setUpdatingTaskId(taskId);
      
      // Optimistic update - update UI immediately
      const updatedTasks = tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus }
          : task
      );
      updateTasksState(updatedTasks);
      
      // Update selected task if it's the one being updated
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }

      // Make API call
      const response = await axios.patch(`${APIDictionary.task}/${taskId}`, {
        status: newStatus
      }, { withCredentials: true });

      // Update with server response to ensure consistency
      if (response.data.success && response.data.data) {
        const serverTask = response.data.data;
        const finalUpdatedTasks = tasks.map(task => 
          task.id === taskId ? { ...task, ...serverTask } : task
        );
        updateTasksState(finalUpdatedTasks);
        
        if (selectedTask?.id === taskId) {
          setSelectedTask({ ...selectedTask, ...serverTask });
        }
      }
      
      toast({
        title: "Success",
        description: "Task status updated successfully"
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      
      // Revert optimistic update on error
      fetchMyTasks();
      
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

    const originalMessage = newUpdate.trim();

    try {
      setIsSubmittingUpdate(true);
      
      // Clear input immediately for better UX
      setNewUpdate('');

      // Make API call first
      const response = await axios.post(APIDictionary.taskUpdate(selectedTask.id), {
        message: originalMessage
      }, { withCredentials: true });

      // Handle successful response
      if (response.data.success && response.data.data) {
        const serverUpdate = response.data.data;
        
        // Create updated selected task first
        const updatedSelectedTask = {
          ...selectedTask,
          updates: [...(selectedTask.updates || []), serverUpdate]
        };
        
        // Update tasks state with new update
        const updatedTasks = tasks.map(task => {
          if (task.id === selectedTask.id) {
            return updatedSelectedTask;
          }
          return task;
        });
        
        // Update both states with the same data to ensure consistency
        setTasks(updatedTasks);
        setSelectedTask(updatedSelectedTask);
        
        // Apply current filters to maintain filtered view
        let filtered = updatedTasks.filter(task => 
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (statusFilter !== 'ALL') {
          filtered = filtered.filter(task => task.status === statusFilter);
        }

        setFilteredTasks(filtered);

        toast({
          title: "Success",
          description: "Update posted successfully"
        });
      }
    } catch (error) {
      console.error('Error posting update:', error);
      
      // Restore the text on error
      setNewUpdate(originalMessage);
      
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
      CANCELLED: { label: 'Cancelled', variant: 'destructive' as const, icon: AlertCircle }
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
      {/* Header Stats */}
      <div className="p-2 sm:p-4 border-b flex-shrink-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
          <Card>
            <CardContent className="p-2 sm:p-4">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-orange-600">{stats.pending}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Pending</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-4">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">In Progress</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-4">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Completed</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-4">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.overdue}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Overdue</div>
              </div>
            </CardContent>
          </Card>
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
            <h2 className="text-base sm:text-lg font-semibold mb-4">My Tasks</h2>
            
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
                <div className="flex-shrink-0 p-2 sm:p-4 border-b max-h-60 sm:max-h-80 overflow-y-auto custom-scrollbar mobile-scroll-momentum">
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
