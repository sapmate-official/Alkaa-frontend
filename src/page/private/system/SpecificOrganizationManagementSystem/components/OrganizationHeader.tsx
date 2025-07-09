import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Info, Lock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OrganizationType } from '../types';
import RouteDict from '@/routes/RouteDict';

interface OrganizationHeaderProps {
  organization: OrganizationType | null;
  canViewBasicDetails: boolean;
  canViewDetailedInfo: boolean;
}

export const OrganizationHeader = ({ 
  organization, 
  canViewBasicDetails, 
  canViewDetailedInfo 
}: OrganizationHeaderProps) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Permission info banner */}
      {!canViewDetailedInfo && (
        <Alert variant="default" className="bg-muted/40 border border-muted mb-4">
          <Info className="h-5 w-5" />
          <AlertDescription>
            You're viewing organization information with limited access. Some details may be restricted based on your permissions.
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Organization Details Card */}
      {canViewBasicDetails ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{organization?.name}</CardTitle>
                <CardDescription>Organization Details</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                {canViewBasicDetails && (
                  <Badge variant={organization?.isActive ? "default" : "destructive"}>
                    {organization?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                )}
                {canViewDetailedInfo && (
                  <Settings 
                    className="cursor-pointer" 
                    onClick={() => navigate(RouteDict.Organization.Settings)} 
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {canViewBasicDetails && (
                <div>
                  <h3 className="font-medium">Industry</h3>
                  <p className="text-sm text-muted-foreground">{organization?.industry || 'N/A'}</p>
                </div>
              )}
              
              {canViewDetailedInfo && (
                <>
                  <div>
                    <h3 className="font-medium">Subscription</h3>
                    <p className="text-sm text-muted-foreground">{organization?.subscriptionPlan?.name || 'No Plan'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Subscription Period</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(organization?.subscriptionStart || '').toLocaleDateString()} -
                      {new Date(organization?.subscriptionEnd || '').toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-dashed bg-muted/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-muted-foreground">
                  <Shield className="h-5 w-5 mr-2" />
                  Organization Basic Details
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <Lock className="h-8 w-8 text-muted mb-2" />
              <p className="text-muted-foreground">
                You don't have permission to view basic organization details.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
