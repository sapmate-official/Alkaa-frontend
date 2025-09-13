import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import {
  CheckCircle,
  ChevronRight,
  Clock,
  Edit3,
  FolderOpen,
  MessageCircle,
  MoreVertical,
  Plus,
  Search,
  UserCheck,
  Users,
  AlertCircle,
  LayoutGrid,
  List,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from '@/providers/AuthContext';
import { APIDictionary } from '@/services/api/v2/APIdict';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAtom } from 'jotai';
import { permissionListAtom } from '@/store/atom';
import CreateTaskDialog from './components/CreateTaskDialog';
import TaskChatView from './components/TaskChatView';
import GroupDetailsDialog from './components/GroupDetailsDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TaskGroup as ImportedTaskGroup, Task as ImportedTask } from '@/hooks/queries/useTasks';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

// Use the imported types to avoid conflicts
type TaskGroup = ImportedTaskGroup;
type Task = ImportedTask;

interface TaskGroupStats {
  groupId: string;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
}

const UserView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permissionList] = useAtom(permissionListAtom);
  const [users, setUsers] = useState<User[]>([]);
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTaskGroup, setSelectedTaskGroup] = useState<TaskGroup | null>(null);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [groupTasks, setGroupTasks] = useState<Task[]>([]);
  const [taskGroupStats, setTaskGroupStats] = useState<Record<string, TaskGroupStats>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [activeView, setActiveView] = useState('groups'); // 'groups' or 'users'
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskChat, setShowTaskChat] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [taskSortBy, setTaskSortBy] = useState('dueDate');

  // Check if user has permission to create tasks
  const canCreateTasks = permissionList.some(p => p.key === 'task_create');

  // Debounced search terms to prevent excessive filtering
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [debouncedGroupSearchTerm, setDebouncedGroupSearchTerm] = useState('');

  // Debounce search term updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Debounce group search term updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGroupSearchTerm(groupSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [groupSearchTerm]);

  const sortedUserTasks = useMemo(() => {
    return [...userTasks].sort((a, b) => {
      if (taskSortBy === 'dueDate') {
        return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
      }
      if (taskSortBy === 'priority') {
        const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      }
      return 0;
    });
  }, [userTasks, taskSortBy]);

  const sortedGroupTasks = useMemo(() => {
    return [...groupTasks].sort((a, b) => {
      if (taskSortBy === 'dueDate') {
        return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
      }
      if (taskSortBy === 'priority') {
        const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      }
      return 0;
    });
  }, [groupTasks, taskSortBy]);

  // Memoize filtered users and task groups
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [users, debouncedSearchTerm]);

  const filteredTaskGroups = useMemo(() => {
    return taskGroups.filter(g => 
      g.name.toLowerCase().includes(debouncedGroupSearchTerm.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(debouncedGroupSearchTerm.toLowerCase()))
    );
  }, [taskGroups, debouncedGroupSearchTerm]);

  // Fetch functions
  const fetchUsers = useCallback(async () => {
    if (!user?.orgId) return;
    
    try {
      setIsLoading(true);
      const response = await axios.get(`${APIDictionary.user}/org/${user.orgId}`, { 
        withCredentials: true 
      });
      const usersData = response.data.data || response.data || [];
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.orgId, toast]);

  const fetchTaskGroups = useCallback(async () => {
    if (!user?.orgId) return;
    
    try {
      setIsLoadingGroups(true);
      const response = await axios.get(APIDictionary.taskGroup, { 
        withCredentials: true 
      });
      const groupsData = response.data.data || response.data || [];
      setTaskGroups(groupsData);
      
      // Calculate task statistics for each group
      const taskStats = groupsData.reduce((acc: Record<string, TaskGroupStats>, group: TaskGroup) => {
        const stats: TaskGroupStats = {
          groupId: group.id,
          totalTasks: group.tasks?.length || 0,
          pendingTasks: group.tasks?.filter((t: Task) => t.status === 'PENDING').length || 0,
          inProgressTasks: group.tasks?.filter((t: Task) => t.status === 'IN_PROGRESS').length || 0,
          completedTasks: group.tasks?.filter((t: Task) => t.status === 'COMPLETED').length || 0,
        };
        acc[group.id] = stats;
        return acc;
      }, {});
      
      setTaskGroupStats(taskStats);
      
    } catch (error) {
      console.error('Error fetching task groups:', error);
      toast({
        title: "Error",
        description: "Failed to load task groups",
        variant: "destructive"
      });
    } finally {
      setIsLoadingGroups(false);
    }
  }, [user?.orgId, toast]);

  // Fetch users and task groups when component mounts
  useEffect(() => {
    fetchUsers();
    fetchTaskGroups();
  }, [fetchUsers, fetchTaskGroups]);

  const fetchUserTasks = useCallback(async (userId: string) => {
    try {
      setIsLoadingTasks(true);
      const response = await axios.get(APIDictionary.tasksByUser(userId), { 
        withCredentials: true 
      });
      setUserTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load user tasks",
        variant: "destructive"
      });
    } finally {
      setIsLoadingTasks(false);
    }
  }, [toast]);

  const fetchGroupTasks = useCallback(async (group: TaskGroup) => {
    try {
      setIsLoadingTasks(true);
      // The group already contains tasks from the initial fetch, but we can get fresh data
      const response = await axios.get(`${APIDictionary.taskGroup}/${group.id}`, { 
        withCredentials: true 
      });
      const groupData = response.data.data;
      setGroupTasks(groupData.tasks || []);
    } catch (error) {
      console.error('Error fetching group tasks:', error);
      // Fallback to the tasks already in the group object
      setGroupTasks(group.tasks || []);
      toast({
        title: "Warning",
        description: "Using cached task data. Some information might be outdated.",
        variant: "default"
      });
    } finally {
      setIsLoadingTasks(false);
    }
  }, [toast]);

  const handleUserSelect = useCallback((newSelectedUser: User) => {
    if (selectedUser && newSelectedUser.id === selectedUser.id) {
      return;
    }
    setSelectedUser(newSelectedUser);
    setSelectedTaskGroup(null); // Clear task group selection
    fetchUserTasks(newSelectedUser.id);
  }, [selectedUser, fetchUserTasks]);

  const handleTaskGroupSelect = useCallback((newSelectedGroup: TaskGroup) => {
    if (selectedTaskGroup && newSelectedGroup.id === selectedTaskGroup.id) {
      return;
    }
    setSelectedTaskGroup(newSelectedGroup);
    setSelectedUser(null); // Clear user selection
    fetchGroupTasks(newSelectedGroup);
  }, [selectedTaskGroup, fetchGroupTasks]);

  const handleTaskCreated = useCallback(() => {
    setShowCreateTask(false);
    if (selectedUser) {
      fetchUserTasks(selectedUser.id);
    } else if (selectedTaskGroup) {
      fetchGroupTasks(selectedTaskGroup);
    }
    // Refresh task groups to update stats
    fetchTaskGroups();
    toast({
      title: "Success",
      description: "Task created successfully"
    });
  }, [selectedUser, selectedTaskGroup, fetchUserTasks, fetchGroupTasks, fetchTaskGroups, toast]);

  const openTaskChat = useCallback((task: Task) => {
    setSelectedTask(task);
    setShowTaskChat(true);
  }, []);

  const openGroupDetails = useCallback((group: TaskGroup) => {
    setSelectedTaskGroup(group);
    setShowGroupDetails(true);
  }, []);

  const handleGroupUpdated = useCallback(() => {
    fetchTaskGroups();
    if (selectedTaskGroup) {
      // Refresh the selected group's tasks
      fetchGroupTasks(selectedTaskGroup);
    }
  }, [fetchTaskGroups, selectedTaskGroup, fetchGroupTasks]);

  const handleGroupDeleted = useCallback(() => {
    fetchTaskGroups();
    setShowGroupDetails(false);
    setSelectedTaskGroup(null);
    setGroupTasks([]);
  }, [fetchTaskGroups]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
      IN_PROGRESS: { label: 'In Progress', variant: 'default' as const, icon: UserCheck },
      COMPLETED: { label: 'Completed', variant: 'default' as const, icon: CheckCircle },
      CANCELLED: { label: 'Cancelled', variant: 'destructive' as const, icon: AlertCircle }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon;
    return (
      <Badge variant={config?.variant || 'secondary'} className="flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {config?.label || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { label: 'Low', variant: 'secondary' as const, className: 'border-green-500/50' },
      MEDIUM: { label: 'Medium', variant: 'secondary' as const, className: 'border-yellow-500/50' },
      HIGH: { label: 'High', variant: 'secondary' as const, className: 'border-orange-500/50' },
      URGENT: { label: 'Urgent', variant: 'destructive' as const, className: 'border-red-500/50' }
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return <Badge variant={config?.variant || 'secondary'} className={config?.className}>{config?.label || priority}</Badge>;
  };

  const renderTaskList = (tasks: Task[]) => {
    if (isLoadingTasks) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-5 bg-muted rounded w-16"></div>
                    <div className="h-5 bg-muted rounded w-12"></div>
                  </div>
                  <div className="h-3 bg-muted rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (tasks.length === 0) {
      const isUserView = activeView === 'users' && selectedUser;
      const isGroupView = activeView === 'groups' && selectedTaskGroup;

      return (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No tasks found</h3>
          <p className="text-muted-foreground mb-4 px-4">
            {isUserView ? "This user doesn't have any tasks assigned yet." : isGroupView ? "This task group is empty." : "No tasks to display."}
          </p>
          {canCreateTasks && (isUserView || isGroupView) && (
            <Button onClick={() => setShowCreateTask(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {isUserView ? 'Assign First Task' : 'Create First Task'}
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {activeView === 'users' ? 'User Tasks' : 'Group Tasks'} ({tasks.length})
          </h3>
          <Select value={taskSortBy} onValueChange={setTaskSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dueDate">Sort by Due Date</SelectItem>
              <SelectItem value="priority">Sort by Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {tasks.map((task) => (
          <Card 
            key={task.id} 
            className="hover:shadow-md transition-shadow duration-200 border-l-4"
            style={{ borderLeftColor: task.status === 'COMPLETED' ? 'var(--color-green-500)' : (activeView === 'users' ? 'var(--color-blue-500)' : 'var(--color-purple-500)') }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <CardTitle className="text-base leading-tight">{task.title}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>
                  {activeView === 'groups' && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                      <Users className="h-3 w-3" />
                      <span>Assigned to:</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {task.assignments?.slice(0, 3).map((assignment, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs font-normal">
                            {assignment.assignedTo.firstName} {assignment.assignedTo.lastName}
                          </Badge>
                        ))}
                        {task.assignments && task.assignments.length > 3 && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            +{task.assignments.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => openTaskChat(task)}
                  className="ml-2 flex-shrink-0 h-8 w-8"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(task.status)}
                  {getPriorityBadge(task.priority)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {task.dueDate && (
                    <span className={`flex items-center gap-1.5 ${
                      new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'
                        ? 'text-red-600 font-medium'
                        : ''
                    }`}>
                      <Clock className="h-3 w-3" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              {task.updates && task.updates.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-md border">
                  <p className="text-xs text-muted-foreground mb-1">Latest update:</p>
                  <p className="text-sm line-clamp-2">{task.updates[0].message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    by {task.updates[0].updatedBy.firstName} {task.updates[0].updatedBy.lastName}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col w-full bg-muted/20">
      <header className="flex items-center justify-between border-b p-4 bg-background">
        <div>
          <h1 className="text-xl font-bold">Task Management</h1>
          <p className="text-sm text-muted-foreground">Organize, assign, and track tasks across your team.</p>
        </div>
  <ToggleGroup type="single" value={activeView} onValueChange={(value: string | null) => value && setActiveView(value)} aria-label="View mode">
          <ToggleGroupItem value="groups" aria-label="Groups view" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Groups
          </ToggleGroupItem>
          <ToggleGroupItem value="users" aria-label="Users view" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </ToggleGroupItem>
        </ToggleGroup>
      </header>

      <div className="flex-1 flex w-full overflow-hidden">
        {/* Left Panel: List of Groups or Users */}
        <div className="w-1/3 border-r border-border bg-background flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{activeView === 'groups' ? 'Task Groups' : 'Team Members'}</h2>
              <div className="flex items-center text-sm text-muted-foreground">
                {activeView === 'groups' ? <FolderOpen className="h-4 w-4 mr-1" /> : <Users className="h-4 w-4 mr-1" />}
                {activeView === 'groups' ? filteredTaskGroups.length : filteredUsers.length}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={activeView === 'groups' ? "Search task groups..." : "Search team members..."}
                value={activeView === 'groups' ? groupSearchTerm : searchTerm}
                onChange={(e) => activeView === 'groups' ? setGroupSearchTerm(e.target.value) : setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 h-[calc(100vh-16rem)]">
            {activeView === 'groups' ? (
              <>
                {isLoadingGroups ? (
                  <div className="p-4 space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="p-3 animate-pulse">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-muted rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-5 bg-muted rounded w-12"></div>
                          <div className="h-5 bg-muted rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredTaskGroups.length === 0 ? (
                  <div className="p-8 text-center">
                    <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No task groups found</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredTaskGroups.map((group) => {
                      const stats = taskGroupStats[group.id];
                      const isOwner = user?.id === group.createdBy.id;
                      return (
                        <div
                          key={group.id}
                          className={`p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors border-l-4 ${
                            selectedTaskGroup?.id === group.id ? 'bg-accent border-l-purple-500' : 'border-l-transparent'
                          }`}
                          onClick={() => handleTaskGroupSelect(group)}
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <FolderOpen className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{group.name}</p>
                                <div className="flex items-center gap-1">
                                  {isOwner && (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                      Owner
                                    </Badge>
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 w-7 p-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openGroupDetails(group); }}>
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {group.description || 'No description'}
                              </p>
                            </div>
                          </div>
                          
                          {stats && (
                            <div className="flex flex-wrap gap-1 text-xs ml-13">
                              <Badge variant="outline" className="font-normal">{stats.totalTasks} tasks</Badge>
                              {stats.pendingTasks > 0 && <Badge variant="secondary" className="font-normal">{stats.pendingTasks} pending</Badge>}
                              {stats.inProgressTasks > 0 && <Badge variant="default" className="font-normal">{stats.inProgressTasks} active</Badge>}
                              {stats.completedTasks > 0 && <Badge variant="default" className="font-normal bg-green-100 text-green-800 hover:bg-green-200">{stats.completedTasks} done</Badge>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 animate-pulse">
                        <div className="w-10 h-10 bg-muted rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No team members found</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredUsers.map((userItem) => (
                      <div
                        key={userItem.id}
                        onClick={() => handleUserSelect(userItem)}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors border-l-4 ${
                          selectedUser?.id === userItem.id ? 'bg-accent border-l-blue-500' : 'border-l-transparent'
                        }`}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={userItem.avatar} alt={`${userItem.firstName} ${userItem.lastName}`} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {userItem.firstName[0]}{userItem.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {userItem.firstName} {userItem.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {userItem.email}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Panel: Details and Tasks */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {activeView === 'groups' ? (
            <>
              {selectedTaskGroup ? (
                <>
                  <div className="p-4 border-b bg-background">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FolderOpen className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold">{selectedTaskGroup.name}</h2>
                          <p className="text-sm text-muted-foreground">
                            Created by {selectedTaskGroup.createdBy.firstName} {selectedTaskGroup.createdBy.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openGroupDetails(selectedTaskGroup)}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Manage Group
                        </Button>
                        {canCreateTasks && (
                          <Button onClick={() => setShowCreateTask(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Task
                          </Button>
                        )}
                      </div>
                    </div>
                    {selectedTaskGroup.description && (
                      <p className="text-sm text-muted-foreground mt-3">
                        {selectedTaskGroup.description}
                      </p>
                    )}
                  </div>

                  <div className="flex-1 p-4 space-y-6">
                    {/* Task Group Stats */}
                    {taskGroupStats[selectedTaskGroup.id] && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Overview</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                              <List className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-purple-600">
                                {taskGroupStats[selectedTaskGroup.id].totalTasks}
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Pending</CardTitle>
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-yellow-600">
                                {taskGroupStats[selectedTaskGroup.id].pendingTasks}
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                              <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-blue-600">
                                {taskGroupStats[selectedTaskGroup.id].inProgressTasks}
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Completed</CardTitle>
                              <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-green-600">
                                {taskGroupStats[selectedTaskGroup.id].completedTasks}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}

                    {/* Group Tasks */}
                    {renderTaskList(sortedGroupTasks)}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <LayoutGrid className="h-24 w-24 mx-auto text-muted-foreground/50 mb-6" />
                    <h2 className="text-xl font-medium mb-2">Select a task group</h2>
                    <p className="text-muted-foreground max-w-xs mx-auto">
                      Choose a group from the list to view its details, stats, and associated tasks.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {selectedUser ? (
                <>
                  <div className="p-4 border-b bg-background">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={selectedUser.avatar} alt={`${selectedUser.firstName} ${selectedUser.lastName}`} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                            {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="text-xl font-semibold">
                            {selectedUser.firstName} {selectedUser.lastName}
                          </h2>
                          <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs font-normal">
                              {userTasks.length} tasks assigned
                            </Badge>
                            <Badge variant="default" className="text-xs font-normal bg-green-100 text-green-800 hover:bg-green-200">
                              {userTasks.filter(t => t.status === 'COMPLETED').length} completed
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {canCreateTasks && (
                        <Button onClick={() => setShowCreateTask(true)} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Assign Task
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 p-4">
                    {renderTaskList(sortedUserTasks)}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Users className="h-24 w-24 mx-auto text-muted-foreground/50 mb-6" />
                    <h2 className="text-xl font-medium mb-2">Select a team member</h2>
                    <p className="text-muted-foreground max-w-xs mx-auto">
                      Choose a team member from the list to view and manage their assigned tasks.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <CreateTaskDialog 
        open={showCreateTask} 
        onOpenChange={setShowCreateTask}
        onTaskCreated={handleTaskCreated}
        preselectedUser={selectedUser}
        preselectedGroup={selectedTaskGroup}
      />

      <TaskChatView 
        open={showTaskChat}
        onOpenChange={setShowTaskChat}
        task={selectedTask}
      />

      <GroupDetailsDialog
        open={showGroupDetails}
        onOpenChange={setShowGroupDetails}
        group={selectedTaskGroup}
        onGroupUpdated={handleGroupUpdated}
        onGroupDeleted={handleGroupDeleted}
      />
    </div>
  );
};

export default UserView;
