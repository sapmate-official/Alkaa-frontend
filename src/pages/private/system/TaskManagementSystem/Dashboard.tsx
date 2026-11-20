import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ClipboardList, 
  Plus, 
  Users, 
  BarChart3,
  ChevronRight,
  User,
  Calendar,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/providers/AuthContext';
import { useNavigate } from 'react-router-dom';
import RouteDict from '@/routes/RouteDict';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/store/useAuthStore';
import CreateTaskDialog from './components/CreateTaskDialog';
import CreateGroupDialog from './components/CreateGroupDialog';
import GroupDetailsDialog from './components/GroupDetailsDialog';
import TaskStatsCards from './components/TaskStatsCards';

import { 
  useManagerTasks, 
  useUserTasks, 
  useTaskGroups,
  Task,
  TaskGroup
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
  const permissionList = usePermissions();
  
  // TanStack Query hooks
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
  const [selectedGroup, setSelectedGroup] = useState<TaskGroup | null>(null);

  // Check if user has permission to create tasks
  const canCreateTasks = permissionList.some(p => p.key === 'task_create');

  // Tasks slices
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

  const openGroupDetails = (group: TaskGroup) => {
    setSelectedGroup(group);
    setShowGroupDetails(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Completed</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">In Progress</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive" className="text-xs">Cancelled</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="outline" className="text-xs">Pending</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return <Badge variant="destructive" className="text-xs font-semibold">{priority}</Badge>;
      case 'MEDIUM':
        return <Badge variant="secondary" className="text-xs">{priority}</Badge>;
      case 'LOW':
      default:
        return <Badge variant="outline" className="text-xs text-muted-foreground">{priority}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border border-border">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border border-border">
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardHeader><Skeleton className="h-6 w-36" /></CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const completionPercentage = taskStats.total > 0 
    ? Math.round((taskStats.completed / taskStats.total) * 100) 
    : 0;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Task Management Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage, assign, and track team tasks, groups, and deliverable pipelines</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button onClick={() => setShowCreateGroup(true)} variant="outline" size="sm">
            <Users className="h-4 w-4 mr-1.5" />
            Create Group
          </Button>
          {canCreateTasks && (
            <Button onClick={() => setShowCreateTask(true)} size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Overview */}
      <TaskStatsCards 
        stats={taskStats} 
        assignedStats={myAssignedTasks.length > 0 ? assignedTaskStats : undefined} 
      />

      {/* Dedicated Section: My Assigned Tasks */}
      {myAssignedTasks.length > 0 && (
        <Card className="border border-border bg-card shadow-xs">
          <CardHeader className="border-b border-border py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-secondary text-foreground">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">My Assigned Tasks</CardTitle>
                  <CardDescription className="text-xs">
                    {assignedTaskStats.pending} pending • {assignedTaskStats.inProgress} in progress • {assignedTaskStats.overdue} overdue
                  </CardDescription>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(RouteDict.Task.EmployeeView)}
                className="text-xs h-8"
              >
                View All ({myAssignedTasks.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {/* Quick mini-metrics breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="p-3 bg-secondary/40 border border-border/60 rounded-lg text-center">
                <div className="text-xl font-bold text-foreground tabular-nums">
                  {assignedTaskStats.pending}
                </div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">Pending</div>
              </div>
              <div className="p-3 bg-secondary/40 border border-border/60 rounded-lg text-center">
                <div className="text-xl font-bold text-foreground tabular-nums">
                  {assignedTaskStats.inProgress}
                </div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">In Progress</div>
              </div>
              <div className="p-3 bg-secondary/40 border border-border/60 rounded-lg text-center">
                <div className="text-xl font-bold text-foreground tabular-nums">
                  {assignedTaskStats.overdue}
                </div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">Overdue</div>
              </div>
              <div className="p-3 bg-secondary/40 border border-border/60 rounded-lg text-center">
                <div className="text-xl font-bold text-foreground tabular-nums">
                  {myAssignedTasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length}
                </div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">High Priority</div>
              </div>
            </div>

            {/* Top Assigned Tasks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {myAssignedTasks
                .slice()
                .sort((a, b) => {
                  const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                  const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                                      (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
                  if (priorityDiff !== 0) return priorityDiff;
                  if (a.dueDate && b.dueDate) {
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                  }
                  return 0;
                })
                .slice(0, 6)
                .map((task: Task) => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
                  
                  return (
                    <div 
                      key={task.id} 
                      className="p-4 border border-border rounded-lg bg-card hover:bg-secondary/40 cursor-pointer transition-colors space-y-3"
                      onClick={() => navigate(`${RouteDict.Task.EmployeeView}?taskId=${task.id}`)}
                      title="Click to view task details"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm text-foreground truncate flex-1">{task.title}</h4>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-[10px] shrink-0">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.description || 'No description provided.'}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                      {task.dueDate && (
                        <div className={`flex items-center gap-1.5 text-xs tabular-nums ${
                          isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'
                        }`}>
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {myAssignedTasks.length > 6 && (
              <div className="mt-4 pt-3 border-t border-border text-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate(RouteDict.Task.EmployeeView)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  View {myAssignedTasks.length - 6} more assigned tasks
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Grid: Recent Tasks I Created & Task Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Tasks I Created (7 Cols) */}
        <Card className="lg:col-span-7 border border-border bg-card shadow-xs flex flex-col justify-between">
          <CardHeader className="border-b border-border py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-semibold text-foreground">Recent Tasks I Created</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs font-mono">
                {recentTasks.length} tasks
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 flex-1">
            {recentTasks.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="p-3 rounded-full bg-secondary text-muted-foreground w-12 h-12 mx-auto flex items-center justify-center">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No tasks created yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tasks you create for team members will show up here</p>
                </div>
                {canCreateTasks && (
                  <Button 
                    onClick={() => setShowCreateTask(true)} 
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Create your first task
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task: Task) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-3.5 border border-border rounded-lg bg-card hover:bg-secondary/40 cursor-pointer transition-colors"
                    onClick={() => navigate(`${RouteDict.Task.TaskView}?taskId=${task.id}`)}
                    title="Click to view task details"
                  >
                    <div className="space-y-1 min-w-0 pr-3">
                      <h4 className="font-medium text-sm text-foreground truncate">{task.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">{task.description || 'No description'}</p>
                      <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                        {task.dueDate && (
                          <span className="text-[11px] text-muted-foreground tabular-nums flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {task.assignments?.length || 0} assigned
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Task Groups (5 Cols) */}
        <Card className="lg:col-span-5 border border-border bg-card shadow-xs flex flex-col justify-between">
          <CardHeader className="border-b border-border py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-semibold text-foreground">Task Groups</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCreateGroup(true)}
                className="h-7 text-xs px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                New Group
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5 flex-1">
            {taskGroups.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="p-3 rounded-full bg-secondary text-muted-foreground w-12 h-12 mx-auto flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No groups created yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Group related tasks by project, sprint, or team</p>
                </div>
                <Button 
                  onClick={() => setShowCreateGroup(true)} 
                  size="sm"
                  variant="outline"
                >
                  Create your first group
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {taskGroups.slice(0, 5).map((group: TaskGroup) => (
                  <div 
                    key={group.id} 
                    className="p-3.5 border border-border rounded-lg bg-card hover:bg-secondary/40 cursor-pointer transition-colors"
                    onClick={() => openGroupDetails(group)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-foreground truncate">{group.name}</h4>
                          {group.createdBy && (
                            <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                              {group.createdBy.firstName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                          {group.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">
                            {group.tasks?.length || 0} tasks
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {group.tasks?.filter((t: Task) => t.status === 'COMPLETED').length || 0} done
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {group.tasks?.filter((t: Task) => t.status === 'IN_PROGRESS').length || 0} active
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Operational Bottom Sections: Quick Navigation & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Actions (6 Cols) */}
        <Card className="lg:col-span-6 border border-border bg-card shadow-xs">
          <CardHeader className="py-4 border-b border-border">
            <CardTitle className="text-base font-semibold text-foreground">Quick Views &amp; Navigation</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                className="h-20 flex-col justify-center items-center relative border-border hover:bg-secondary/50"
                onClick={() => navigate(RouteDict.Task.EmployeeView)}
              >
                <User className="h-5 w-5 mb-1.5 text-muted-foreground" />
                <span className="text-xs font-semibold">My Tasks</span>
                {myAssignedTasks.length > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 right-2 text-[10px] px-1.5 py-0 font-mono"
                  >
                    {myAssignedTasks.length}
                  </Badge>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col justify-center items-center border-border hover:bg-secondary/50"
                onClick={() => navigate(RouteDict.Task.UserView)}
              >
                <Users className="h-5 w-5 mb-1.5 text-muted-foreground" />
                <span className="text-xs font-semibold">User Matrix</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col justify-center items-center border-border hover:bg-secondary/50"
                onClick={() => navigate(RouteDict.Task.TaskView)}
              >
                <ClipboardList className="h-5 w-5 mb-1.5 text-muted-foreground" />
                <span className="text-xs font-semibold">Task Board</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Task Progress & Health (6 Cols) */}
        <Card className="lg:col-span-6 border border-border bg-card shadow-xs">
          <CardHeader className="py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold text-foreground">Task Completion &amp; Pipeline</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Overall Team Completion</span>
                <span className="font-semibold text-foreground tabular-nums">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/60">
                <div className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Active</span>
                </div>
                <p className="text-lg font-bold text-foreground tabular-nums mt-1">
                  {taskStats.pending + taskStats.inProgress}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/60">
                <div className="text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Overdue</span>
                </div>
                <p className={`text-lg font-bold tabular-nums mt-1 ${taskStats.overdue > 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {taskStats.overdue}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/60">
                <div className="text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>Groups</span>
                </div>
                <p className="text-lg font-bold text-foreground tabular-nums mt-1">
                  {taskGroups.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
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
