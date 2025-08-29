import { useState, useEffect } from 'react';
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
  Send
} from 'lucide-react';
import { useAuth } from '@/services/AuthContext';
import { APIDictionary } from '@/api/v2/APIdict';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  updates: Array<{
    id: string;
    message: string;
    status: string;
    createdAt: string;
    createdBy: {
      firstName: string;
      lastName: string;
    };
  }>;
}

const EmployeeView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [newUpdate, setNewUpdate] = useState('');
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  useEffect(() => {
    fetchMyTasks();
  }, []);

  useEffect(() => {
    let filtered = tasks.filter(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, statusFilter]);

  const fetchMyTasks = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(APIDictionary.tasksByUser(user?.id || ''), { 
        withCredentials: true 
      });
      const tasksData = response.data.data || [];
      setTasks(tasksData);
      setFilteredTasks(tasksData);
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
      await axios.patch(`${APIDictionary.task}/${taskId}`, {
        status: newStatus
      }, { withCredentials: true });
      
      fetchMyTasks();
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
    }
  };

  const submitUpdate = async () => {
    if (!selectedTask || !newUpdate.trim()) return;

    try {
      setIsSubmittingUpdate(true);
      await axios.post(APIDictionary.taskUpdate, {
        taskId: selectedTask.id,
        message: newUpdate.trim()
      }, { withCredentials: true });

      setNewUpdate('');
      fetchMyTasks();
      
      const updatedTasks = tasks.map(task => {
        if (task.id === selectedTask.id) {
          return {
            ...task,
            updates: [
              {
                id: Date.now().toString(),
                message: newUpdate.trim(),
                status: task.status,
                createdAt: new Date().toISOString(),
                createdBy: {
                  firstName: user?.firstName || '',
                  lastName: user?.lastName || ''
                }
              },
              ...(task.updates || [])
            ]
          };
        }
        return task;
      });
      setTasks(updatedTasks);
      setSelectedTask(updatedTasks.find(t => t.id === selectedTask.id) || null);

      toast({
        title: "Success",
        description: "Update posted successfully"
      });
    } catch (error) {
      console.error('Error posting update:', error);
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
      <Badge variant={config?.variant || 'secondary'} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config?.label || status}
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
    return <Badge variant={config?.variant || 'secondary'}>{config?.label || priority}</Badge>;
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
    <div className="h-full flex flex-col">
      {/* Header Stats */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Tasks List */}
        <div className="w-1/3 border-r border-border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold mb-4">My Tasks</h2>
            
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search my tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-y-auto h-[calc(100vh-18rem)]">
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
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tasks found</p>
              </div>
            ) : (
              <div className="p-2">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors border-l-4 ${
                      task.dueDate && isOverdue(task.dueDate)
                        ? 'border-l-red-500' 
                        : task.priority === 'HIGH' || task.priority === 'URGENT' 
                          ? 'border-l-orange-500' 
                          : task.priority === 'MEDIUM' 
                            ? 'border-l-yellow-500' 
                            : 'border-l-green-500'
                    } ${selectedTask?.id === task.id ? 'bg-accent' : ''}`}
                  >
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm">{task.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {task.dueDate ? (
                            <span className={isOverdue(task.dueDate) ? 'text-red-600 font-medium' : ''}>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          ) : (
                            'No due date'
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {task.updates?.length || 0}
                        </div>
                      </div>
                    </div>
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
                      Assigned by {selectedTask.createdBy.firstName} {selectedTask.createdBy.lastName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedTask.status === 'PENDING' && (
                      <Button 
                        size="sm"
                        onClick={() => updateTaskStatus(selectedTask.id, 'IN_PROGRESS')}
                      >
                        Start Task
                      </Button>
                    )}
                    {selectedTask.status === 'IN_PROGRESS' && (
                      <Button 
                        size="sm"
                        onClick={() => updateTaskStatus(selectedTask.id, 'COMPLETED')}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                {/* Task Details */}
                <div className="p-4 border-b">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Task Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <p className="mt-1">{selectedTask.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
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
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                          <p className={`mt-1 ${selectedTask.dueDate && isOverdue(selectedTask.dueDate) ? 'text-red-600 font-medium' : ''}`}>
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
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b">
                    <h3 className="font-medium">Task Updates</h3>
                  </div>
                  
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {!selectedTask.updates || selectedTask.updates.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No updates yet. Start the conversation!</p>
                      </div>
                    ) : (
                      selectedTask.updates.map((update) => (
                        <div key={update.id} className="flex space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {update.createdBy.firstName[0]}{update.createdBy.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-muted rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">
                                  {update.createdBy.firstName} {update.createdBy.lastName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(update.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm">{update.message}</p>
                              {update.status && (
                                <div className="mt-2">
                                  {getStatusBadge(update.status)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Add an update to this task..."
                        value={newUpdate}
                        onChange={(e) => setNewUpdate(e.target.value)}
                        rows={2}
                        className="flex-1"
                      />
                      <Button 
                        onClick={submitUpdate}
                        disabled={!newUpdate.trim() || isSubmittingUpdate}
                        size="sm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <CheckCircle className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
                <h2 className="text-xl font-medium mb-2">Select a task</h2>
                <p className="text-muted-foreground">
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
