/**
 * Example of Enhanced Task Group Member Management Integration
 * 
 * This file shows how to integrate the enhanced member management functions
 * into the existing UserView component for better task group management.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  TrendingUp, 
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TaskGroupMemberService } from '../services/taskGroupMemberService';
import { batchMemberOperations, useMemberManagement } from '../utils/memberManagementUtils';

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
  createdBy: User;
  tasks: any[];
}

interface EnhancedGroupCardProps {
  group: TaskGroup;
  currentUser: User;
  allUsers: User[];
  onGroupUpdated: () => void;
}

/**
 * Enhanced Task Group Card with advanced member management
 */
const EnhancedGroupCard: React.FC<EnhancedGroupCardProps> = ({
  group,
  currentUser,
  allUsers,
  onGroupUpdated
}) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use the enhanced member management hook
  const {
    getMemberStats,
    getMembersByRole,
    checkMembership,
    getHealthMetrics,
    getActivityAnalysis
  } = useMemberManagement(group);
  
  // Memoized calculations
  const memberStats = useMemo(() => getMemberStats(), [getMemberStats]);
  const { owner, members } = useMemo(() => getMembersByRole(), [getMembersByRole]);
  const isCurrentUserMember = useMemo(() => checkMembership(currentUser.id), [checkMembership, currentUser.id]);
  const isOwner = useMemo(() => TaskGroupMemberService.isGroupOwner(currentUser.id, group), [currentUser.id, group]);
  const healthMetrics = useMemo(() => getHealthMetrics(), [getHealthMetrics]);
  const activityAnalysis = useMemo(() => getActivityAnalysis(), [getActivityAnalysis]);
  
  
  // Quick add/remove functions
  const handleQuickAddMembers = useCallback(async () => {
    try {
      setIsProcessing(true);
      
      // Get available users (not already members)
      const availableUsers = TaskGroupMemberService.getAvailableUsers(allUsers, members);
      
      if (availableUsers.length === 0) {
        toast({
          title: "No Users Available",
          description: "All organization members are already in this group.",
          variant: "default"
        });
        return;
      }
      
      // For demonstration, add the first 2 available users
      const usersToAdd = availableUsers.slice(0, 2).map(user => user.id);
      
      const result = await batchMemberOperations.addMembersWithValidation(
        group.id,
        usersToAdd,
        allUsers,
        members
      );
      
      toast({
        title: "Members Added",
        description: result.summary,
        variant: "default"
      });
      
      onGroupUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add members",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [group.id, allUsers, members, toast, onGroupUpdated]);
  
  const handleQuickRemoveInactiveMembers = useCallback(async () => {
    try {
      setIsProcessing(true);
      
      // Find members with no tasks
      const inactiveMembers = members.filter(member => 
        TaskGroupMemberService.getMemberTaskCount(member.id, group) === 0 &&
        member.id !== owner?.id // Don't remove the owner
      );
      
      if (inactiveMembers.length === 0) {
        toast({
          title: "No Inactive Members",
          description: "All members have assigned tasks.",
          variant: "default"
        });
        return;
      }
      
      const userIdsToRemove = inactiveMembers.map(member => member.id);
      
      const result = await batchMemberOperations.removeMembersWithConfirmation(
        group.id,
        userIdsToRemove,
        members
      );
      
      toast({
        title: "Inactive Members Removed",
        description: `Removed ${result.removedMemberDetails.length} inactive members`,
        variant: "default"
      });
      
      onGroupUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove members",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [group, members, owner, toast, onGroupUpdated]);
  
  if (!memberStats || !healthMetrics) return null;
  
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {group.name}
            <Badge variant="outline">
              {memberStats.totalMembers} members
            </Badge>
          </CardTitle>
          
          {/* Health Score Badge */}
          <Badge 
            variant={healthMetrics.healthScore >= 70 ? "default" : healthMetrics.healthScore >= 40 ? "secondary" : "destructive"}
            className="flex items-center gap-1"
          >
            {healthMetrics.healthScore >= 70 ? (
              <CheckCircle className="h-3 w-3" />
            ) : healthMetrics.healthScore >= 40 ? (
              <Activity className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            Health: {healthMetrics.healthScore}%
          </Badge>
        </div>
        
        {group.description && (
          <p className="text-sm text-muted-foreground">{group.description}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{memberStats.totalMembers}</div>
            <div className="text-xs text-blue-600">Members</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{memberStats.membersWithTasks}</div>
            <div className="text-xs text-green-600">Active</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-600">{healthMetrics.taskMetrics.totalTasks}</div>
            <div className="text-xs text-orange-600">Tasks</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">{healthMetrics.taskMetrics.completionRate}%</div>
            <div className="text-xs text-purple-600">Complete</div>
          </div>
        </div>
        
        {/* Current User Status */}
        <div className="p-3 border rounded-lg bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Your Status in this Group</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={isCurrentUserMember ? "default" : "secondary"}>
                  {isCurrentUserMember ? "Member" : "Not a Member"}
                </Badge>
                {isOwner && <Badge variant="outline">Owner</Badge>}
              </div>
            </div>
            
            {isCurrentUserMember && (
              <div className="text-right">
                <div className="text-lg font-bold">
                  {TaskGroupMemberService.getMemberTaskCount(currentUser.id, group)}
                </div>
                <div className="text-xs text-muted-foreground">Your Tasks</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Top Performers */}
        {activityAnalysis.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Top Performers</span>
            </div>
            <div className="space-y-1">
              {activityAnalysis.slice(0, 3).map((analysis, index) => (
                <div key={analysis.member.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 flex items-center justify-center text-xs p-0">
                      {index + 1}
                    </Badge>
                    <span>{analysis.member.firstName} {analysis.member.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {analysis.stats.totalTasks} tasks
                    </span>
                    <Badge variant={analysis.stats.completionRate >= 80 ? "default" : "secondary"} className="text-xs">
                      {Math.round(analysis.stats.completionRate)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Owner Actions */}
        {isOwner && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Quick Actions</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleQuickAddMembers}
                disabled={isProcessing}
                className="flex-1"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Add Members
              </Button>
              
              {memberStats.membersWithoutTasks > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleQuickRemoveInactiveMembers}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  <UserMinus className="h-4 w-4 mr-1" />
                  Remove Inactive
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Health Insights */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Average {healthMetrics.taskMetrics.averageTasksPerMember} tasks per member</p>
          <p>• {healthMetrics.memberMetrics.activeMemberPercentage}% of members are active</p>
          {memberStats.membersWithoutTasks > 0 && (
            <p className="text-orange-600">• {memberStats.membersWithoutTasks} member{memberStats.membersWithoutTasks !== 1 ? 's' : ''} without tasks</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Example of enhanced member search and filtering
 */
const EnhancedMemberSearch: React.FC<{
  allUsers: User[];
  currentMembers: User[];
  group: TaskGroup;
  onUsersSelected: (users: User[]) => void;
}> = ({ allUsers, currentMembers, group, onUsersSelected }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'available' | 'members' | 'active' | 'inactive'>('available');
  
  const filteredUsers = useMemo(() => {
    let filtered = allUsers;
    
    // Apply search term
    if (searchTerm) {
      filtered = TaskGroupMemberService.searchUsers(filtered, searchTerm);
    }
    
    // Apply filter type
    switch (filterType) {
      case 'available':
        filtered = TaskGroupMemberService.getAvailableUsers(filtered, currentMembers);
        break;
      case 'members':
        filtered = filtered.filter(user => 
          currentMembers.some(member => member.id === user.id)
        );
        break;
      case 'active':
        filtered = filtered.filter(user => 
          TaskGroupMemberService.getMemberTaskCount(user.id, group) > 0
        );
        break;
      case 'inactive':
        filtered = currentMembers.filter(user => 
          TaskGroupMemberService.getMemberTaskCount(user.id, group) === 0
        );
        break;
    }
    
    return filtered;
  }, [allUsers, currentMembers, group, searchTerm, filterType]);
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="available">Available Users</option>
          <option value="members">Current Members</option>
          <option value="active">Active Members</option>
          <option value="inactive">Inactive Members</option>
        </select>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
      </div>
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {filteredUsers.map(user => {
          const taskCount = TaskGroupMemberService.getMemberTaskCount(user.id, group);
          const isMember = TaskGroupMemberService.isGroupMember(user.id, group);
          
          return (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 cursor-pointer"
              onClick={() => onUsersSelected([user])}
            >
              <div>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              
              <div className="flex items-center gap-2">
                {isMember && (
                  <Badge variant="outline" className="text-xs">
                    {taskCount} task{taskCount !== 1 ? 's' : ''}
                  </Badge>
                )}
                <Badge variant={isMember ? "default" : "secondary"}>
                  {isMember ? "Member" : "Available"}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { EnhancedGroupCard, EnhancedMemberSearch };
