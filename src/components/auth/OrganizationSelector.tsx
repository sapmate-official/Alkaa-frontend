import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowLeft, ChevronRight } from 'lucide-react';

interface Organization {
    orgId: string;
    orgName: string;
    userId: string;
    userStatus: string;
}

interface OrganizationSelectorProps {
    organizations: Organization[];
    email: string;
    onSelect: (orgId: string) => void;
    onBack: () => void;
    isLoading?: boolean;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
    organizations,
    email,
    onSelect,
    onBack,
    isLoading = false
}) => {
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

    const handleSelect = () => {
        if (selectedOrgId) {
            onSelect(selectedOrgId);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <Card>
                <CardHeader className="text-center space-y-4">
                    <div className="flex items-center justify-between">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onBack}
                            className="h-8 w-8"
                            disabled={isLoading}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex-1" />
                    </div>
                    <div className="flex flex-col items-center">
                        <img src="/logo.svg" alt="Alkaa Logo" className="h-16 w-auto mb-4" />
                        <CardTitle className="text-xl">Select Organization</CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                            We found multiple organizations for <strong>{email}</strong>
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        {organizations.map((org) => (
                            <div
                                key={org.orgId}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                    selectedOrgId === org.orgId
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => setSelectedOrgId(org.orgId)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            <Building2 className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-sm">{org.orgName}</h3>
                                            <Badge 
                                                variant="secondary" 
                                                className={`text-xs mt-1 ${getStatusColor(org.userStatus)}`}
                                            >
                                                {org.userStatus}
                                            </Badge>
                                        </div>
                                    </div>
                                    <ChevronRight 
                                        className={`h-4 w-4 transition-colors ${
                                            selectedOrgId === org.orgId ? 'text-primary' : 'text-gray-400'
                                        }`} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <Button
                        onClick={handleSelect}
                        disabled={!selectedOrgId || isLoading}
                        className="w-full"
                    >
                        {isLoading ? "Proceeding..." : "Continue"}
                    </Button>
                    
                    <p className="text-xs text-center text-muted-foreground">
                        Select the organization you want to access
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
