import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { 
  ClipboardList, 
  Plus, 
  Users, 
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/services/AuthContext';
import { APIDictionary } from '@/api/v2/APIdict';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import RouteDict from '@/routes/RouteDict';
import { useToast } from '@/hooks/use-toast';
import { useAtom } from 'jotai';
import { permissionListAtom } from '@/store/atom';
import CreateTaskDialog from './components/CreateTaskDialog';
import CreateGroupDialog from './components/CreateGroupDialog';
import GroupDetailsDialog from './components/GroupDetailsDialog';
import TaskStatsCards from './components/TaskStatsCards';

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: string;
  dueDate: string;
  createdAt: string;
  assignments?: Array<{
    assignedTo: {
      firstName: string;
      lastName: string;
    };
  }>;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [permissionList] = useAtom(permissionListAtom);
  const [isLoading, setIsLoading] = useState(true);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [taskGroups, setTaskGroups] = useState<any[]>([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  // Check if user has permission to create tasks
  const canCreateTasks = permissionList.some(p => p.key === 'task_create');

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [tasksResponse, groupsResponse] = await Promise.all([
        axios.get(`${APIDictionary.tasksByManager(user?.id || '')}`, { withCredentials: true }),
        axios.get(APIDictionary.taskGroup, { withCredentials: true })
      ]);

      const tasks: Task[] = tasksResponse.data.data || [];
      const groups = groupsResponse.data.data || [];
      
      const stats = {
        total: tasks.length,
        pending: tasks.filter((t: Task) => t.status === 'PENDING').length,
        inProgress: tasks.filter((t: Task) => t.status === 'IN_PROGRESS').length,
        completed: tasks.filter((t: Task) => t.status === 'COMPLETED').length,
        overdue: tasks.filter((t: Task) => new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length,
      };

      setTaskStats(stats);
      setRecentTasks(tasks.slice(0, 5));
      setTaskGroups(groups);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const handleTaskCreated = () => {
    fetchDashboardData();
    setShowCreateTask(false);
    toast({
      title: "Success",
      description: "Task created successfully"
    });
  };

  const handleGroupCreated = () => {
    fetchDashboardData();
    setShowCreateGroup(false);
    toast({
      title: "Success",
      description: "Task group created successfully"
    });
  };

  const handleGroupUpdated = () => {
    fetchDashboardData();
    toast({
      title: "Success",
      description: "Group updated successfully"
    });
  };

  const handleGroupDeleted = () => {
    fetchDashboardData();
    setShowGroupDetails(false);
    setSelectedGroup(null);
    toast({
      title: "Success",
      description: "Group deleted successfully"
    });
  };

  const openGroupDetails = (group: any) => {
    setSelectedGroup(group);
    setShowGroupDetails(true);
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

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 w-full h-full overflow-y-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Task Management Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 w-full h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Task Management Dashboard</h1>
          <p className="text-muted-foreground">Manage and track your team's tasks</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateGroup(true)} variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Create Group
          </Button>
          {canCreateTasks && (
            <Button onClick={() => setShowCreateTask(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          )}
        </div>
      </div>

      <TaskStatsCards stats={taskStats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardList className="h-5 w-5 mr-2" />
                Recent Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tasks created yet</p>
                  {canCreateTasks && (
                    <Button 
                      onClick={() => setShowCreateTask(true)} 
                      className="mt-4"
                      variant="outline"
                    >
                      Create your first task
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {recentTasks.map((task: Task) => (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors hover:shadow-md"
                      onClick={() => navigate(`${RouteDict.Task.TaskView}?taskId=${task.id}`)}
                      title="Click to view task details"
                    >
                      <div className="space-y-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                          {task.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                          {task.assignments?.length || 0} assigned
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Task Groups
              </CardTitle>
            </CardHeader>
            <CardContent>
              {taskGroups.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No groups created yet</p>
                  <Button 
                    onClick={() => setShowCreateGroup(true)} 
                    className="mt-4"
                    variant="outline"
                  >
                    Create your first group
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {taskGroups.map((group: any) => (
                    <div 
                      key={group.id} 
                      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 border-l-purple-500"
                      onClick={() => openGroupDetails(group)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Users className="h-4 w-4 text-purple-600" />
                            </div>
                            <h4 className="font-semibold text-base">{group.name}</h4>
                            {group.createdBy && (
                              <Badge variant="outline" className="text-xs">
                                Owner: {group.createdBy.firstName} {group.createdBy.lastName}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {group.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {group.tasks?.length || 0} tasks
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {group.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0} completed
                            </Badge>
                            {group.memberCount !== undefined && (
                              <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                                {group.memberCount} members
                              </Badge>
                            )}
                            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                              {group.tasks?.filter((t: any) => t.status === 'IN_PROGRESS').length || 0} active
                            </Badge>
                          </div>
                        </div>
                        <div className="ml-3 flex items-center">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => navigate(RouteDict.Task.UserView)}
              >
                <Users className="h-8 w-8 mb-2" />
                User View
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => navigate(RouteDict.Task.TaskView)}
              >
                <ClipboardList className="h-8 w-8 mb-2" />
                Task View
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Task Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Completion Rate</span>
                <span className="text-sm font-medium">
                  {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ 
                    width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Active Tasks</span>
                  <p className="font-medium">{taskStats.pending + taskStats.inProgress}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Overdue</span>
                  <p className="font-medium text-red-600">{taskStats.overdue}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateTaskDialog 
        open={showCreateTask} 
        onOpenChange={setShowCreateTask}
        onTaskCreated={handleTaskCreated}
      />
      
      <CreateGroupDialog 
        open={showCreateGroup} 
        onOpenChange={setShowCreateGroup}
        onGroupCreated={handleGroupCreated}
      />

      <GroupDetailsDialog
        open={showGroupDetails}
        onOpenChange={setShowGroupDetails}
        group={selectedGroup}
        onGroupUpdated={handleGroupUpdated}
        onGroupDeleted={handleGroupDeleted}
      />
    </div>
  );
};

export default Dashboard;
