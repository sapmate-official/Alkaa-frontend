import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar, Crown, Building2, User, Clock, ArrowRight } from 'lucide-react';
import { multiDepartmentApi } from '@/api/multiDepartmentApi';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface DepartmentAssignmentHistoryProps {
  userId: string;
  className?: string;
  showTitle?: boolean;
  limit?: number;
}

interface HistoryEntry {
  id: string;
  action: 'ASSIGN' | 'UNASSIGN' | 'UPDATE' | 'MIGRATE';
  departmentId: string;
  departmentName: string;
  isPrimary: boolean;
  role?: string;
  assignedAt: string;
  assignedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  details?: any;
}

const DepartmentAssignmentHistory: React.FC<DepartmentAssignmentHistoryProps> = ({
  userId,
  className = '',
  showTitle = true,
  limit = 10
}) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await multiDepartmentApi.getUserDepartmentHistory(userId);
      setHistory(response.history || []);
    } catch (error) {
      console.error('Error fetching department history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load department assignment history',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchHistory();
    }
  }, [userId]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'ASSIGN':
        return <ArrowRight className="h-4 w-4 text-green-600" />;
      case 'UNASSIGN':
        return <ArrowRight className="h-4 w-4 text-red-600 rotate-180" />;
      case 'UPDATE':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'MIGRATE':
        return <ArrowRight className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'ASSIGN':
        return 'text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'UNASSIGN':
        return 'text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300';
      case 'UPDATE':
        return 'text-blue-700 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      case 'MIGRATE':
        return 'text-purple-700 bg-purple-100 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'text-gray-700 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'ASSIGN':
        return 'Assigned';
      case 'UNASSIGN':
        return 'Removed';
      case 'UPDATE':
        return 'Updated';
      case 'MIGRATE':
        return 'Migrated';
      default:
        return action;
    }
  };

  const displayedHistory = expanded ? history : history.slice(0, limit);

  if (loading) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Department Assignment History
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Department Assignment History
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No department assignment history found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Department Assignment History
            <Badge variant="secondary" className="ml-auto">
              {history.length} {history.length === 1 ? 'entry' : 'entries'}
            </Badge>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {displayedHistory.map((entry, index) => (
            <div
              key={entry.id}
              className={`flex items-start gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/30 ${
                index === 0 ? 'bg-muted/20' : ''
              }`}
            >
              {/* Action Icon */}
              <div className="flex-shrink-0 mt-1">
                {getActionIcon(entry.action)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs px-2 py-1 ${getActionColor(entry.action)}`}>
                      {getActionText(entry.action)}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Building2 className="h-4 w-4" />
                      {entry.departmentName}
                    </div>
                    {entry.isPrimary && (
                      <div title="Primary Department">
                        <Crown className="h-4 w-4 text-yellow-500" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(entry.assignedAt), 'MMM dd, yyyy')}
                  </div>
                </div>

                {/* Role and Additional Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {entry.role && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Role: {entry.role}
                    </div>
                  )}
                  {entry.assignedBy && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      By: {entry.assignedBy.firstName} {entry.assignedBy.lastName}
                    </div>
                  )}
                </div>

                {/* Action-specific details */}
                {entry.action === 'UPDATE' && entry.details && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="flex flex-wrap gap-2">
                      {entry.details.changes?.map((change: any, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-muted rounded">
                          {change.field}: {change.from} → {change.to}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Show More/Less Button */}
        {history.length > limit && (
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-muted-foreground hover:text-foreground"
            >
              {expanded ? 'Show Less' : `Show All (${history.length})`}
            </Button>
          </div>
        )}

        {/* Timeline indicator */}
        {displayedHistory.length > 0 && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Showing {displayedHistory.length} of {history.length} entries
            {history.length > 0 && (
              <span className="ml-2">
                • Latest: {format(new Date(history[0]?.assignedAt), 'MMM dd, yyyy')}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DepartmentAssignmentHistory;
