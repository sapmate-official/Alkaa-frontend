import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Import TanStack Query hooks
import { useTaskGroups } from '@/hooks/queries/useTasks';

const TaskGroupList = () => {
  // TanStack Query hook
  const { data: groups = [], isLoading } = useTaskGroups();

  if (isLoading) {
    return (
        <div className="p-4 md:p-8">
            <Skeleton className="h-8 w-1/3 mb-6" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-1/4" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
        <header className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Task Groups</h1>
            <p className="text-lg text-muted-foreground mt-1">A list of all task groups in your organization.</p>
        </header>
        {groups.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => {
                    const memberCount = group._count?.members ?? 0;
                    return (
                    <Link to={`/p/task/group/${group.id}`} key={group.id} className="block">
                        <Card className="hover:shadow-lg transition-shadow duration-200 h-full">
                            <CardHeader>
                                <CardTitle>{group.name}</CardTitle>
                                <CardDescription>{group.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                )})}
            </div>
        ) : (
            <div className="flex items-center justify-center h-64">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>No Groups Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>There are no task groups in this organization yet.</p>
                    </CardContent>
                </Card>
            </div>
        )}
    </div>
  );
};

export default TaskGroupList;
