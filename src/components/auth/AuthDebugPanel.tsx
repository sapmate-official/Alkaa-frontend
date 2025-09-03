import React from 'react';
import { useAuth } from '@/services/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { tokenStorage } from '@/services/AuthContext';

export const AuthDebugPanel: React.FC = () => {
    const { user, authStep, logout, resetAuthFlow } = useAuth();
    const orgData = tokenStorage.getOrgData();

    return (
        <Card className="w-full max-w-md mx-auto mt-8">
            <CardHeader>
                <CardTitle className="text-center">🔐 Auth Debug Panel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="font-medium">Auth Step:</span>
                        <Badge variant="outline">{authStep.step}</Badge>
                    </div>
                    
                    <div className="flex justify-between">
                        <span className="font-medium">User:</span>
                        <span className="text-sm">{user?.email || 'None'}</span>
                    </div>
                    
                    <div className="flex justify-between">
                        <span className="font-medium">Organization:</span>
                        <span className="text-sm">{orgData.orgName || 'None'}</span>
                    </div>
                    
                    <div className="flex justify-between">
                        <span className="font-medium">Org ID:</span>
                        <span className="text-sm font-mono">{orgData.orgId || 'None'}</span>
                    </div>
                    
                    <div className="flex justify-between">
                        <span className="font-medium">Access Token:</span>
                        <span className="text-xs">
                            {tokenStorage.getAccessToken() ? '✅ Present' : '❌ Missing'}
                        </span>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    {user && (
                        <Button 
                            onClick={logout} 
                            variant="destructive" 
                            size="sm"
                            className="flex-1"
                        >
                            Logout
                        </Button>
                    )}
                    
                    <Button 
                        onClick={resetAuthFlow} 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                    >
                        Reset Flow
                    </Button>
                </div>
                
                <div className="text-xs text-muted-foreground text-center">
                    This panel shows the current authentication state for debugging purposes.
                </div>
            </CardContent>
        </Card>
    );
};
