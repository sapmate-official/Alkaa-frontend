import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
// Import TanStack Query hooks
import { useEmployees, useTaskGroups, useCreateTask } from '@/hooks/queries';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
  preselectedUser?: User | null;
  preselectedGroup?: TaskGroup | null;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TaskGroup {
  id: string;
  name: string;
  description?: string;
}

interface TaskGroup {
  id: string;
  name: string;
  description?: string;
  members?: Array<{ user: User }>;
}

const CreateTaskDialog = ({ open, onOpenChange, onTaskCreated, preselectedUser, preselectedGroup }: CreateTaskDialogProps) => {
  const { toast } = useToast();
  
  // Use TanStack Query hooks instead of local state
  const { data: users = [] } = useEmployees();
  const { data: taskGroups = [] } = useTaskGroups();
  const createTaskMutation = useCreateTask();
  
  const [loading, setLoading] = useState(false);
  const [dueDate, setDueDate] = useState<Date>();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    priority: "MEDIUM" | "LOW" | "HIGH" | "URGENT";
  }>({
    title: '',
    description: '',
    priority: 'MEDIUM'
  });

  // Handle preselected user or group
  useEffect(() => {
    if (open) {
      if (preselectedUser) {
        setSelectedUsers([preselectedUser.id]);
        setSelectedGroups([]);
      } else if (preselectedGroup) {
        setSelectedGroups([preselectedGroup.id]);
        setSelectedUsers([]);
      } else {
        setSelectedUsers([]);
        setSelectedGroups([]);
      }
    }
  }, [open, preselectedUser, preselectedGroup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Task title is required",
        variant: "destructive"
      });
      return;
    }

    if (selectedUsers.length === 0 && selectedGroups.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please assign the task to at least one user or group",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const taskData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        dueDate: dueDate?.toISOString(),
        assignedToIds: selectedUsers,
        groupIds: selectedGroups
      };

      await createTaskMutation.mutateAsync(taskData);
      
      onTaskCreated();
      resetForm();
      
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', priority: 'MEDIUM' });
    setDueDate(undefined);
    setSelectedUsers([]);
    setSelectedGroups([]);
    setUserSearchQuery('');
    setGroupSearchQuery('');
  };

  // Filter functions
  const filteredUsers = users.filter((user: User) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return fullName.includes(userSearchQuery.toLowerCase()) || 
           user.email.toLowerCase().includes(userSearchQuery.toLowerCase());
  });

  const filteredGroups = taskGroups.filter((group: TaskGroup) => 
    group.name.toLowerCase().includes(groupSearchQuery.toLowerCase())
  );

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(id => id !== userId));
  };

  const removeGroup = (groupId: string) => {
    setSelectedGroups(prev => prev.filter(id => id !== groupId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
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
            </div>

            <div className="space-y-4">
              <Label>Assign to Users *</Label>
              
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedUsers.map(userId => {
                    const user = users.find((u: User) => u.id === userId);
                    return user ? (
                      <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                        {user.firstName} {user.lastName}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeUser(userId)}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}

              <div className="space-y-2">
                <Input
                  placeholder="Search users by name or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="mb-2"
                />
                
                <div className="h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user: User) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                        <Label htmlFor={`user-${user.id}`} className="text-sm">
                          {user.firstName} {user.lastName} ({user.email})
                        </Label>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground p-2">
                      {userSearchQuery ? 'No users found matching your search.' : 'No users available.'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Assign to Groups</Label>
              
              {selectedGroups.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedGroups.map(groupId => {
                    const group = taskGroups.find((g: TaskGroup) => g.id === groupId);
                    return group ? (
                      <Badge key={groupId} variant="outline" className="flex items-center gap-1">
                        {group.name}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeGroup(groupId)}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}

              <div className="space-y-2">
                <Input
                  placeholder="Search groups by name..."
                  value={groupSearchQuery}
                  onChange={(e) => setGroupSearchQuery(e.target.value)}
                  className="mb-2"
                />
                
                <div className="h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                  {filteredGroups.length > 0 ? (
                    filteredGroups.map((group: TaskGroup) => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`group-${group.id}`}
                          checked={selectedGroups.includes(group.id)}
                          onCheckedChange={() => toggleGroupSelection(group.id)}
                        />
                        <Label htmlFor={`group-${group.id}`} className="text-sm">
                          {group.name} ({group.members?.length || 0} members)
                        </Label>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground p-2">
                      {groupSearchQuery ? 'No groups found matching your search.' : 'No groups available.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} onClick={handleSubmit}>
            {loading ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
