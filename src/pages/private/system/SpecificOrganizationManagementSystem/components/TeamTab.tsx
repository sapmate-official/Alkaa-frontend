import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Users } from 'lucide-react';
import { TeamMember } from '../types';

interface TeamTabProps {
  teamMembers: TeamMember[];
  isLoading: boolean;
  onUserClick: (userId: string) => void;
}

export const TeamTab = ({ 
  teamMembers, 
  isLoading, 
  onUserClick 
}: TeamTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          My Team
        </CardTitle>
        <CardDescription>
          Employees reporting to you: {teamMembers?.length || 0}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : teamMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMembers.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => onUserClick(member.id)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {member.firstName?.[0]}{member.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{member.firstName} {member.lastName}</div>
                  <div className="text-sm text-muted-foreground">
                    {member.employeeId ? `ID: ${member.employeeId}` : 'No Employee ID'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No team members reporting to you
          </div>
        )}
      </CardContent>
    </Card>
  );
};
