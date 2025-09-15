import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Crown, Activity } from 'lucide-react';
import { 
  TaskGroupMemberService
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
  createdBy: User;
  tasks: any[];
}

interface GroupMembershipCardProps {
  group: TaskGroup;
  currentUser?: User;
}

/**
 * Example component demonstrating the use of enhanced member management functions
 */
const GroupMembershipCard: React.FC<GroupMembershipCardProps> = ({ group, currentUser }) => {
  const memberCount = TaskGroupMemberService.getMemberCount(group);
  const isCurrentUserMember = currentUser ? TaskGroupMemberService.isGroupMember(currentUser.id, group) : false;
  const { owner, members } = TaskGroupMemberService.getMembersByRole(group);
  const summary = TaskGroupMemberService.getGroupMembershipSummary(group);
  
  const currentUserTaskCount = currentUser ? TaskGroupMemberService.getMemberTaskCount(currentUser.id, group) : 0;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Group Membership
          <Badge variant="outline">{memberCount} members</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Group Basic Info */}
        <div className="space-y-2">
          <h3 className="font-semibold">{group.name}</h3>
          {group.description && (
            <p className="text-sm text-muted-foreground">{group.description}</p>
          )}
        </div>

        {/* Owner Information */}
        {owner && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
            <Crown className="h-4 w-4 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {owner.firstName} {owner.lastName}
              </p>
              <p className="text-xs text-muted-foreground">Group Owner</p>
            </div>
          </div>
        )}

        {/* Membership Statistics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-lg font-bold text-blue-600">{summary.totalMembers}</span>
            </div>
            <p className="text-xs text-blue-600">Total Members</p>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-lg font-bold text-green-600">{summary.membersWithTasks}</span>
            </div>
            <p className="text-xs text-green-600">Active Members</p>
          </div>
        </div>

        {/* Current User Status */}
        {currentUser && (
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Your Status</p>
              <Badge variant={isCurrentUserMember ? "default" : "secondary"}>
                {isCurrentUserMember ? "Member" : "Not a Member"}
              </Badge>
            </div>
            
            {isCurrentUserMember && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserCheck className="h-4 w-4" />
                <span>{currentUserTaskCount} task{currentUserTaskCount !== 1 ? 's' : ''} assigned</span>
              </div>
            )}
          </div>
        )}

        {/* Member List Preview */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Members ({members.length})</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {members.slice(0, 5).map((member) => {
              const taskCount = TaskGroupMemberService.getMemberTaskCount(member.id, group);
              return (
                <div key={member.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                  <span>{member.firstName} {member.lastName}</span>
                  <Badge variant="outline" className="text-xs">
                    {taskCount} task{taskCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
              );
            })}
            {members.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                +{members.length - 5} more members
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• {summary.membersWithoutTasks} member{summary.membersWithoutTasks !== 1 ? 's' : ''} without tasks</p>
          <p>• {group.tasks.length} total task{group.tasks.length !== 1 ? 's' : ''} in group</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupMembershipCard;
