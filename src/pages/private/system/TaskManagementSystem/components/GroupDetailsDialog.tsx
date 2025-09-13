import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Users,
  ClipboardList,
  Edit3,
  Trash2,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Calendar,
  Target,
  TrendingUp,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthContext';
import { APIDictionary } from '@/services/api/v2/APIdict';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import ManageMembersDialog from './ManageMembersDialog';
import { TaskGroupMemberService } from '../services/taskGroupMemberService';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

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
  assignments: Array<{
    id: string;
    assignedTo: User;
  }>;
}

interface TaskGroup {
  id: string;
  name: string;
  description?: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tasks: Task[];
  createdAt: string;
}

interface GroupDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: TaskGroup | null;
  onGroupUpdated?: () => void;
  onGroupDeleted?: () => void;
}

const GroupDetailsDialog: React.FC<GroupDetailsDialogProps> = ({
  open,
  onOpenChange,
  group,
  onGroupUpdated,
  onGroupDeleted,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('members');
  const [showManageMembers, setShowManageMembers] = useState(false);

  useEffect(() => {
    if (group) {
      setEditedName(group.name);
      setEditedDescription(group.description || '');
      extractGroupMembers();
    }
  }, [group]);

  // Re-extract members when the dialog opens
  useEffect(() => {
    if (open && group) {
      extractGroupMembers();
    }
  }, [open, group]);

  const extractGroupMembers = () => {
    if (!group) return;
    setGroupMembers(TaskGroupMemberService.extractGroupMembers(group));
  };

  const handleMembersUpdated = () => {
    // Refresh the group data to get updated member information
    onGroupUpdated?.();
    // Re-extract members from the updated group data
    setTimeout(() => {
      extractGroupMembers();
    }, 100);
  };

  const updateGroup = async () => {
    if (!group) return;

    try {
      setIsLoading(true);
      await axios.patch(
        `${APIDictionary.taskGroup}/${group.id}`,
        {
          name: editedName,
          description: editedDescription,
        },
        { withCredentials: true }
      );

      setIsEditing(false);
      onGroupUpdated?.();
      toast({
        title: "Success",
        description: "Group updated successfully",
      });
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: "Error",
        description: "Failed to update group",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteGroup = async () => {
    if (!group) return;

    try {
      setIsLoading(true);
      await axios.delete(`${APIDictionary.taskGroup}/${group.id}`, {
        withCredentials: true,
      });

      onGroupDeleted?.();
      toast({
        title: "Success",
        description: "Group deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      LOW: { label: 'Low', variant: 'secondary' as const },
      MEDIUM: { label: 'Medium', variant: 'default' as const },
      HIGH: { label: 'High', variant: 'destructive' as const },
      URGENT: { label: 'Urgent', variant: 'destructive' as const }
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return <Badge variant={config?.variant || 'secondary'}>{config?.label || priority}</Badge>;
  };

  const getGroupStats = () => {
    if (!group?.tasks) return { total: 0, pending: 0, inProgress: 0, completed: 0 };

    return {
      total: group.tasks.length,
      pending: group.tasks.filter(t => t.status === 'PENDING').length,
      inProgress: group.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: group.tasks.filter(t => t.status === 'COMPLETED').length,
    };
  };

  const stats = getGroupStats();
  const isOwner = group ? TaskGroupMemberService.isGroupOwner(user?.id || '', group) : false;

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-lg font-semibold"
                />
              ) : (
                <DialogTitle className="text-xl">{group.name}</DialogTitle>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isOwner && (
                <>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={updateGroup}
                        disabled={isLoading}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditedName(group.name);
                          setEditedDescription(group.description || '');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Group
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Group
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Group</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this group? This action cannot be undone.
                                All tasks in this group will remain but will no longer be grouped together.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={deleteGroup}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              placeholder="Group description..."
              className="mt-2"
            />
          ) : (
            group.description && (
              <p className="text-muted-foreground mt-1">{group.description}</p>
            )
          )}
        </DialogHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Members ({groupMembers.length})
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <ClipboardList className="h-4 w-4 mr-2" />
              Tasks ({stats.total})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Group members are users who have been assigned to tasks in this group
              </p>
              {isOwner && (
                <Button
                  onClick={() => setShowManageMembers(true)}
                  size="sm"
                  variant="outline"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Members
                </Button>
              )}
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {groupMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No members assigned to tasks in this group</p>
                </div>
              ) : (
                groupMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {(member.firstName?.[0] || '') + (member.lastName?.[0] || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.firstName} {member.lastName}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {group.tasks.filter(task => 
                        task.assignments?.some(assignment => assignment.assignedTo.id === member.id)
                      ).length} task{group.tasks.filter(task => 
                        task.assignments?.some(assignment => assignment.assignedTo.id === member.id)
                      ).length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {group.tasks.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tasks in this group</p>
                </div>
              ) : (
                group?.tasks?.map((task) => (
                  <div key={task.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {task.assignments?.length || 0} assigned
                        </div>
                      </div>
                      <span>
                        Created by {task.createdBy ? `${task.createdBy.firstName ?? ''} ${task.createdBy.lastName ?? ''}`.trim() : 'Unknown'}
                      </span>
                    </div>

                    {task.assignments && task.assignments.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Assigned to:</span>
                        <div className="flex -space-x-2">
                          {task.assignments.slice(0, 3).map((assignment) => (
                            <Avatar key={assignment.id} className="h-6 w-6 border-2 border-background">
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                {(assignment.assignedTo && ((assignment.assignedTo.firstName?.[0] || '') + (assignment.assignedTo.lastName?.[0] || ''))) || '?'}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {task.assignments.length > 3 && (
                            <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">+{task.assignments.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <ManageMembersDialog
        open={showManageMembers}
        onOpenChange={setShowManageMembers}
        group={group}
        currentMembers={groupMembers}
        onMembersUpdated={handleMembersUpdated}
      />
    </Dialog>
  );
};

export default GroupDetailsDialog;
