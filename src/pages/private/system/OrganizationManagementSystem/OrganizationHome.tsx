import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Building2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import RouteDict from '@/routes/RouteDict';
import { useOrganizations } from '@/hooks/queries';

const OrganizationHome = () => {
    const navigate = useNavigate();

    // Use TanStack Query hook
    const { data: organizationList = [], isLoading, error } = useOrganizations();

    if (isLoading) {
        return (
            <div className="container mx-auto py-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <Skeleton className="h-10 w-48" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-32 mb-2" />
                                <Skeleton className="h-4 w-48" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-6 overflow-y-auto">
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-destructive mb-2">Error Loading Organizations</h3>
                    <p className="text-muted-foreground">Failed to load organization data. Please try again.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 overflow-y-auto ">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Organizations</h1>
                    <p className="text-muted-foreground">Manage your organizations and their settings</p>
                </div>
                <Button onClick={() => navigate(RouteDict.SuperAdmin.Create)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Organization
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizationList?.map((org) => (
                    <Card key={org?.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xl">{org?.name}</CardTitle>
                                <Badge variant={org?.isActive ? "default" : "destructive"}>
                                    {org?.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                            <CardDescription>{org?.industry || "No industry specified"}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center text-sm">
                                    <Building2 className="mr-2 h-4 w-4" />
                                    <span>Plan: {org?.subscriptionPlan?.name}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>{org?.users?.length || 0} Users</span>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full mt-4"
                                    onClick={() => navigate(RouteDict.SuperAdmin.OrganizationDetails(org?.id))}
                                >
                                    View Details
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {organizationList.length === 0 && (
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium">No organizations found</h3>
                    <p className="text-muted-foreground">Create your first organization to get started</p>
                </div>
            )}
        </div>
    );
}

export default OrganizationHome;