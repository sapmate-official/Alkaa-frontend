import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge"
import { Progress } from '@/components/ui/progress';
import { BarChart3, Layers } from 'lucide-react';
import { OrganizationType, Department } from '../types';

interface InsightsTabProps {
  organization: OrganizationType | null;
  departments: Department[];
}

export const InsightsTab = ({ organization, departments }: InsightsTabProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Employee Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {departments.map((dept) => {
            const percentage = organization?.users?.length 
              ? Math.round((dept.users.length / organization.users.length) * 100) 
              : 0;
            
            return (
              <div key={dept.id} className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{dept.name}</span>
                  <span className="text-sm text-muted-foreground">{percentage}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Layers className="mr-2 h-5 w-5" />
            Organization Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
              <span>Total Employees</span>
              <span className="font-bold">{organization?.users?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
              <span>Total Departments</span>
              <span className="font-bold">{departments?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
              <span>Subscription Plan</span>
              {organization?.subscriptionPlan?.name === "PRO" ? (
                <Badge variant="outline" className="bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-medium border-amber-400">
                  {organization?.subscriptionPlan?.name}
                </Badge>
              ) : (
                <Badge variant="outline">{organization?.subscriptionPlan?.name || 'No Plan'}</Badge>
              )}
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
              <span>Subscription Ends</span>
              <span className="font-medium">
                {new Date(organization?.subscriptionEnd || '').toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
