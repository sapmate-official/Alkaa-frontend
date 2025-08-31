import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users,
  X,
  UserPlus,
  UserMinus,
  Search,
} from 'lucide-react';
import { useAuth } from '@/services/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  TaskGroupMemberService,
  addMembersToGroup,
  removeMembersFromGroup 
} from '../services/taskGroupMemberService';

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
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ManageMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: TaskGroup | null;
  currentMembers: User[];
  onMembersUpdated: () => void;
}

const ManageMembersDialog: React.FC<ManageMembersDialogProps> = ({
  open,
  onOpenChange,
  group,
  currentMembers,
  onMembersUpdated,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<string[]>([]);
  const [selectedUsersToRemove, setSelectedUsersToRemove] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAllUsers();
      setSelectedUsersToAdd([]);
      setSelectedUsersToRemove([]);
      setSearchTerm('');
    }
  }, [open]);

  const fetchAllUsers = async () => {
    try {
      const users = await TaskGroupMemberService.getOrganizationUsers(user?.orgId || '');
      setAllUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  const addMembers = async () => {
    if (!group || selectedUsersToAdd.length === 0) return;

    try {
      setIsLoading(true);
      const result = await addMembersToGroup(group.id, selectedUsersToAdd);

      toast({
        title: "Success",
        description: result.message || `Added ${selectedUsersToAdd.length} member(s) to the group`,
      });

      setSelectedUsersToAdd([]);
      onMembersUpdated();
    } catch (error) {
      console.error('Error adding members:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add members to the group",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeMembers = async () => {
    if (!group || selectedUsersToRemove.length === 0) return;

    try {
      setIsLoading(true);
      const result = await removeMembersFromGroup(group.id, selectedUsersToRemove);

      toast({
        title: "Success",
        description: result.message || `Removed ${selectedUsersToRemove.length} member(s) from the group`,
      });

      setSelectedUsersToRemove([]);
      setShowRemoveConfirm(false);
      onMembersUpdated();
    } catch (error) {
      console.error('Error removing members:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove members from the group",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserToAdd = (userId: string) => {
    setSelectedUsersToAdd(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleUserToRemove = (userId: string) => {
    setSelectedUsersToRemove(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Filter users for adding (exclude current members)
  const availableUsers = TaskGroupMemberService.searchUsers(
    TaskGroupMemberService.getAvailableUsers(allUsers, currentMembers),
    searchTerm
  );

  // Filter current members for removal
  const removableMembers = TaskGroupMemberService.searchUsers(currentMembers, searchTerm);

  const isOwner = group ? TaskGroupMemberService.isGroupOwner(user?.id || '', group) : false;

  if (!group) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Group Members - {group.name}
            </DialogTitle>
          </DialogHeader>

          {!isOwner && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                Only the group creator can manage members.
              </p>
            </div>
          )}

          {isOwner && (
            <>
              {/* Tab Selection */}
              <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                <Button
                  variant={activeTab === 'add' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('add')}
                  className="flex-1"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Members
                </Button>
                <Button
                  variant={activeTab === 'remove' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('remove')}
                  className="flex-1"
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remove Members
                </Button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Add Members Tab */}
              {activeTab === 'add' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Select users to add to the group ({selectedUsersToAdd.length} selected)
                    </p>
                    {selectedUsersToAdd.length > 0 && (
                      <Button
                        onClick={addMembers}
                        disabled={isLoading}
                        size="sm"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add {selectedUsersToAdd.length} Member{selectedUsersToAdd.length !== 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>

                  {/* Selected Users to Add */}
                  {selectedUsersToAdd.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
                      {selectedUsersToAdd.map(userId => {
                        const user = allUsers.find(u => u.id === userId);
                        return user ? (
                          <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                            {user.firstName} {user.lastName}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => toggleUserToAdd(userId)}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Available Users List */}
                  <div className="max-h-80 overflow-y-auto space-y-2 border rounded-lg p-3">
                    {availableUsers.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {searchTerm ? 'No users found matching your search' : 'All organization members are already in this group'}
                      </p>
                    ) : (
                      availableUsers.map(user => (
                        <div key={user.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-lg">
                          <Checkbox
                            id={`add-user-${user.id}`}
                            checked={selectedUsersToAdd.includes(user.id)}
                            onCheckedChange={() => toggleUserToAdd(user.id)}
                          />
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {user.firstName[0]}{user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <Label htmlFor={`add-user-${user.id}`} className="flex-1 cursor-pointer">
                            <div>
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Remove Members Tab */}
              {activeTab === 'remove' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Select members to remove from the group ({selectedUsersToRemove.length} selected)
                    </p>
                    {selectedUsersToRemove.length > 0 && (
                      <Button
                        onClick={() => setShowRemoveConfirm(true)}
                        disabled={isLoading}
                        variant="destructive"
                        size="sm"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove {selectedUsersToRemove.length} Member{selectedUsersToRemove.length !== 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>

                  {/* Selected Users to Remove */}
                  {selectedUsersToRemove.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-red-50 rounded-lg">
                      {selectedUsersToRemove.map(userId => {
                        const member = currentMembers.find(m => m.id === userId);
                        return member ? (
                          <Badge key={userId} variant="destructive" className="flex items-center gap-1">
                            {member.firstName} {member.lastName}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => toggleUserToRemove(userId)}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Current Members List */}
                  <div className="max-h-80 overflow-y-auto space-y-2 border rounded-lg p-3">
                    {removableMembers.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {searchTerm ? 'No members found matching your search' : 'No members in this group'}
                      </p>
                    ) : (
                      removableMembers.map(member => (
                        <div key={member.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-lg">
                          <Checkbox
                            id={`remove-user-${member.id}`}
                            checked={selectedUsersToRemove.includes(member.id)}
                            onCheckedChange={() => toggleUserToRemove(member.id)}
                          />
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {member.firstName[0]}{member.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <Label htmlFor={`remove-user-${member.id}`} className="flex-1 cursor-pointer">
                            <div>
                              <p className="font-medium">{member.firstName} {member.lastName}</p>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Members</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedUsersToRemove.length} member{selectedUsersToRemove.length !== 1 ? 's' : ''} from this group?
              This will remove them from all tasks in this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={removeMembers}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Members
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageMembersDialog;
