import { APIDictionary } from '@/api/APIdict';
import { Organization } from '@/interface/general';
import { useAuth } from '@/services/AuthContext';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Building2, Users, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const OrganizationHome = () => {
    const { user } = useAuth();
    const [organizationList, setOrganizationList] = useState<Organization[]>([]);
    const navigate = useNavigate();

    const fetchOrganizationList = async () => {
        try {
            const response = await axios.get(APIDictionary.Organization, { withCredentials: true });
            if (response.status === 200) {
                console.log("Organization list: ", response.data);
                
                setOrganizationList(response.data);
            }
        } catch (error) {
            console.log("Error fetching organization list: ", error);
        }
    }

    useEffect(() => {
        fetchOrganizationList();
    }, [user]);

    return (
        <div className="container mx-auto py-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Organizations</h1>
                    <p className="text-muted-foreground">Manage your organizations and their settings</p>
                </div>
                <Button onClick={() => navigate('/p/organization/create')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Organization
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizationList.map((org) => (
                    <Card key={org.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xl">{org.name}</CardTitle>
                                <Badge variant={org.isActive ? "default" : "destructive"}>
                                    {org.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                            <CardDescription>{org.industry || "No industry specified"}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center text-sm">
                                    <Building2 className="mr-2 h-4 w-4" />
                                    <span>Plan: {org.subscriptionPlan}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>{org.users?.length || 0} Users</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span>Created: {new Date(org.createdAt).toLocaleDateString()}</span>
                                </div>
                                <Button 
                                    variant="outline" 
                                    className="w-full mt-4"
                                    onClick={() => navigate(`/p/organization/${org.id}`)}
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