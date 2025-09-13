import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/providers/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// Import TanStack Query hooks
import { useTaskGroup } from '@/hooks/queries/useTasks';

interface Task {
    id: string;
    title: string;
    status: string;
}

interface Member {
    id: string;
    firstName: string;
    lastName: string;
}
interface TaskGroup {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  members: { user: Member }[];
}

const TaskGroupDetails = () => {
  const { groupId } = useParams();
  
  // TanStack Query hook
  const { data: group, isLoading } = useTaskGroup(groupId || '');
  const { user } = useAuth();

  if (isLoading) {
    return (
        <div className="p-4 md:p-8">
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4 mb-6" />
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
  }

  if (!group) {
    return (
        <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Group not found. It might have been deleted or you may not have permission to view it.</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
        <header className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
            <p className="text-lg text-muted-foreground mt-1">{group.description}</p>
        </header>
        <Separator className="my-6" />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Tasks</CardTitle>
                    <CardDescription>Tasks associated with this group.</CardDescription>
                </CardHeader>
                <CardContent>
                    {group.tasks && group.tasks.length > 0 ? (
                        <ul>
                            {group.tasks.map(task => (
                                <li key={task.id} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                                    <span>{task.title}</span>
                                    <span className="text-sm text-muted-foreground">{task.status}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">No tasks found for this group.</p>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Members</CardTitle>
                    <CardDescription>Users who are part of this group.</CardDescription>
                </CardHeader>
                <CardContent>
                    {group.members && group.members.length > 0 ? (
                        <ul>
                            {group.members.map(member => (
                                <li key={member.user.id} className="p-2 rounded-md hover:bg-muted">
                                    {member.user.firstName} {member.user.lastName}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">No members found in this group.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
};

export default TaskGroupDetails;
