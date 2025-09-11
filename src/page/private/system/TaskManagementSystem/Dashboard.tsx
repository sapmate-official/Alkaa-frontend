import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { 
  ClipboardList, 
  Plus, 
  Users, 
  BarChart3,
  ChevronRight,
  User,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/services/AuthContext';
import { useNavigate } from 'react-router-dom';
import RouteDict from '@/routes/RouteDict';
import { useToast } from '@/hooks/use-toast';
import { useAtom } from 'jotai';
import { permissionListAtom } from '@/store/atom';
import CreateTaskDialog from './components/CreateTaskDialog';
import CreateGroupDialog from './components/CreateGroupDialog';
import GroupDetailsDialog from './components/GroupDetailsDialog';
import TaskStatsCards from './components/TaskStatsCards';
// Import TanStack Query hooks
import { 
  useManagerTasks, 
  useUserTasks, 
  useTaskGroups,
  Task
} from '@/hooks/queries/useTasks';

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [permissionList] = useAtom(permissionListAtom);
  
  // TanStack Query hooks replace direct axios calls
  const { 
    data: managerTasks = [], 
    isLoading: isLoadingManagerTasks,
    refetch: refetchManagerTasks
  } = useManagerTasks(user?.id || '');
  
  const { 
    data: assignedTasks = [], 
    isLoading: isLoadingAssignedTasks,
    refetch: refetchAssignedTasks
  } = useUserTasks(user?.id || '');
  
  const { 
    data: taskGroups = [], 
    isLoading: isLoadingTaskGroups,
    refetch: refetchTaskGroups
  } = useTaskGroups();

  const isLoading = isLoadingManagerTasks || isLoadingAssignedTasks || isLoadingTaskGroups;
  
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  // Check if user has permission to create tasks
  const canCreateTasks = permissionList.some(p => p.key === 'task_create');

  // Calculate stats from TanStack Query data
  const recentTasks = managerTasks?.slice(0, 5) || [];
  const myAssignedTasks = assignedTasks || [];

  // Calculate task stats
  const taskStats: TaskStats = {
    total: managerTasks?.length || 0,
    pending: managerTasks?.filter((t: Task) => t.status === 'PENDING').length || 0,
    inProgress: managerTasks?.filter((t: Task) => t.status === 'IN_PROGRESS').length || 0,
    completed: managerTasks?.filter((t: Task) => t.status === 'COMPLETED').length || 0,
    overdue: managerTasks?.filter((t: Task) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length || 0,
  };

  const assignedTaskStats: TaskStats = {
    total: assignedTasks?.length || 0,
    pending: assignedTasks?.filter((t: Task) => t.status === 'PENDING').length || 0,
    inProgress: assignedTasks?.filter((t: Task) => t.status === 'IN_PROGRESS').length || 0,
    completed: assignedTasks?.filter((t: Task) => t.status === 'COMPLETED').length || 0,
    overdue: assignedTasks?.filter((t: Task) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length || 0,
  };

  const handleTaskCreated = () => {
    refetchManagerTasks();
    refetchAssignedTasks();
    refetchTaskGroups();
    setShowCreateTask(false);
    toast({
      title: "Success",
      description: "Task created successfully"
    });
  };

  const handleGroupCreated = () => {
    refetchTaskGroups();
    setShowCreateGroup(false);
    toast({
      title: "Success",
      description: "Task group created successfully"
    });
  };

  const handleGroupUpdated = () => {
    refetchTaskGroups();
    toast({
      title: "Success",
      description: "Group updated successfully"
    });
  };

  const handleGroupDeleted = () => {
    refetchTaskGroups();
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

      {/* Assigned Tasks Notification */}
      {myAssignedTasks.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">You have {myAssignedTasks.length} task{myAssignedTasks.length !== 1 ? 's' : ''} assigned to you</h4>
                  <p className="text-sm text-blue-700">
                    {myAssignedTasks.filter(t => t.status === 'PENDING').length} pending • {' '}
                    {myAssignedTasks.filter(t => t.status === 'IN_PROGRESS').length} in progress • {' '}
                    {myAssignedTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length} overdue
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(RouteDict.Task.EmployeeView)}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  View My Tasks
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <TaskStatsCards 
        stats={taskStats} 
        assignedStats={myAssignedTasks.length > 0 ? assignedTaskStats : undefined} 
      />

      {/* Assigned Tasks Section - Show prominently if user has assigned tasks */}
      {myAssignedTasks.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                My Assigned Tasks ({myAssignedTasks.length})
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(RouteDict.Task.EmployeeView)}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Quick Stats for Assigned Tasks */}
            <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {myAssignedTasks.filter(t => t.status === 'PENDING').length}
                </div>
                <div className="text-xs text-blue-700">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {myAssignedTasks.filter(t => t.status === 'IN_PROGRESS').length}
                </div>
                <div className="text-xs text-orange-700">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {myAssignedTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length}
                </div>
                <div className="text-xs text-red-700">Overdue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {myAssignedTasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length}
                </div>
                <div className="text-xs text-purple-700">High Priority</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myAssignedTasks
                .sort((a, b) => {
                  // Sort by priority: URGENT > HIGH > MEDIUM > LOW
                  const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                  const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                                      (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
                  if (priorityDiff !== 0) return priorityDiff;
                  
                  // Then by due date (closest first)
                  if (a.dueDate && b.dueDate) {
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                  }
                  return 0;
                })
                .slice(0, 6)
                .map((task: Task) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
                const isHighPriority = task.priority === 'HIGH' || task.priority === 'URGENT';
                
                return (
                  <div 
                    key={task.id} 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:shadow-md border-l-4 ${
                      isOverdue 
                        ? 'border-l-red-500 hover:bg-red-50' 
                        : isHighPriority 
                        ? 'border-l-orange-500 hover:bg-orange-50'
                        : 'border-l-blue-500 hover:bg-blue-50'
                    }`}
                    onClick={() => navigate(`${RouteDict.Task.EmployeeView}?taskId=${task.id}`)}
                    title="Click to view task details"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm truncate flex-1">{task.title}</h4>
                        {isOverdue && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full ml-2">
                            Overdue
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                      {task.dueDate && (
                        <div className={`flex items-center gap-1 text-xs ${
                          isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
                        }`}>
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {myAssignedTasks.length > 6 && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(RouteDict.Task.EmployeeView)}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  View {myAssignedTasks.length - 6} more assigned tasks
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <ClipboardList className="h-5 w-5 mr-2" />
                  Recent Tasks I Created
                </div>
                <span className="text-sm text-muted-foreground">
                  {recentTasks.length} tasks
                </span>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col relative"
                onClick={() => navigate(RouteDict.Task.EmployeeView)}
              >
                <User className="h-8 w-8 mb-2" />
                My Tasks
                {myAssignedTasks.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {myAssignedTasks.length}
                  </Badge>
                )}
              </Button>
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

        {/* My Assigned Tasks Summary */}
        {myAssignedTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                My Assigned Tasks ({myAssignedTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {myAssignedTasks.slice(0, 3).map((task: Task) => (
                  <div 
                    key={task.id} 
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`${RouteDict.Task.EmployeeView}?taskId=${task.id}`)}
                  >
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>
                ))}
                {myAssignedTasks.length > 3 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate(RouteDict.Task.EmployeeView)}
                  >
                    View all {myAssignedTasks.length} assigned tasks
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
