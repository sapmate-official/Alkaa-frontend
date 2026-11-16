import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  History,
  UserCheck,
  User,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useEmployeeAuditHistory } from '@/hooks/queries/useEmployeeAuditHistory';

interface EmployeeRevisionHistoryCardProps {
  userId: string;
  isOwnProfile?: boolean;
  className?: string;
}

export const EmployeeRevisionHistoryCard: React.FC<EmployeeRevisionHistoryCardProps> = ({
  userId,
  isOwnProfile = false,
  className = '',
}) => {
  const { data: logs = [], isLoading, refetch, isFetching } = useEmployeeAuditHistory(userId);
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});

  // Filter logs that represent profile or employee updates with recorded diffs
  const diffLogs = logs.filter((log) => {
    return (
      log.metadata?.diff &&
      Object.keys(log.metadata.diff).length > 0
    );
  });

  const toggleExpand = (logId: string) => {
    setExpandedLogIds((prev) => ({
      ...prev,
      [logId]: !prev[logId],
    }));
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <Card className={`border border-border/70 shadow-sm ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-72 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border border-border/70 shadow-sm overflow-hidden ${className}`}>
      <CardHeader className="bg-muted/30 border-b border-border/50 pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Revision History & Change Audit
          </CardTitle>
          <CardDescription className="text-xs">
            Complete before-and-after audit log of changes made to this employee's profile
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {diffLogs.length} {diffLogs.length === 1 ? 'Revision' : 'Revisions'}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => refetch()}
            title="Refresh history"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {diffLogs.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-border rounded-lg bg-card/40">
            <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-60" />
            <p className="text-sm font-medium text-foreground">No Profile Changes Recorded</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              All profile fields currently match their initial values. When details are edited, previous values and timestamps will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {diffLogs.map((log) => {
              const diff = log.metadata?.diff ?? {};
              const diffEntries = Object.entries(diff);
              const isSelf = log.metadata?.isSelfEdit ?? (log.actorId === log.targetId);
              const isExpanded = expandedLogIds[log.id] ?? true;

              return (
                <div
                  key={log.id}
                  className="rounded-lg border border-border bg-card/60 backdrop-blur-sm shadow-xs overflow-hidden transition-colors hover:border-primary/40"
                >
                  {/* Revision Summary Header */}
                  <div
                    className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/20 cursor-pointer select-none"
                    onClick={() => toggleExpand(log.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        isSelf ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'
                      }`}>
                        {isSelf ? <UserCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {isSelf ? (
                              isOwnProfile ? 'Self-Updated by You' : 'Self-Updated by Employee'
                            ) : (
                              `Updated by ${log.actor.firstName} ${log.actor.lastName ?? ''}`.trim()
                            )}
                          </span>
                          <Badge
                            variant={isSelf ? 'outline' : 'secondary'}
                            className="text-[10px] px-1.5 py-0 h-4 font-normal"
                          >
                            {isSelf ? 'Self Edit' : 'Admin / HR Edit'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {log.description || `${diffEntries.length} field(s) modified`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-muted-foreground/80" />
                        {formatDate(log.createdAt)}
                      </span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>

                  {/* Field Diff Table */}
                  {isExpanded && (
                    <div className="p-3 sm:p-4 border-t border-border/50 overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="text-muted-foreground border-b border-border/40 font-medium">
                            <th className="pb-2 font-medium w-1/3">Field</th>
                            <th className="pb-2 font-medium w-1/3">Previous Value</th>
                            <th className="pb-2 font-medium w-1/3">Updated Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {diffEntries.map(([fieldKey, change]) => {
                            const fieldLabel = change.label || fieldKey;
                            const prevStr = change.from !== null && change.from !== undefined ? String(change.from) : '—';
                            const newStr = change.to !== null && change.to !== undefined ? String(change.to) : '—';

                            return (
                              <tr key={fieldKey} className="group hover:bg-muted/20">
                                <td className="py-2.5 font-medium text-foreground pr-2">
                                  {fieldLabel}
                                </td>
                                <td className="py-2.5 pr-2">
                                  <span className="inline-block line-through text-rose-500 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded text-[11px] font-mono max-w-[200px] truncate" title={prevStr}>
                                    {prevStr}
                                  </span>
                                </td>
                                <td className="py-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <ArrowRight className="w-3 h-3 text-muted-foreground opacity-50 shrink-0" />
                                    <span className="inline-block text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded text-[11px] font-mono max-w-[200px] truncate" title={newStr}>
                                      {newStr}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeRevisionHistoryCard;
