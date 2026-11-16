import React from 'react';
import { History, User, UserCheck } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import type { EmployeeAuditLog } from '@/hooks/queries/useEmployeeAuditHistory';

interface PreviousDetailPillProps {
  fieldKey: string;
  auditLogs?: EmployeeAuditLog[];
  className?: string;
}

export const PreviousDetailPill: React.FC<PreviousDetailPillProps> = ({
  fieldKey,
  auditLogs = [],
  className = '',
}) => {
  // Find the most recent log that recorded a diff for this specific field
  const relevantLog = auditLogs.find((log) => {
    const diff = log.metadata?.diff;
    return diff && diff[fieldKey] !== undefined;
  });

  if (!relevantLog || !relevantLog.metadata?.diff?.[fieldKey]) {
    return null;
  }

  const change = relevantLog.metadata.diff[fieldKey];
  const fromStr = change.from !== null && change.from !== undefined ? String(change.from) : '—';
  const toStr = change.to !== null && change.to !== undefined ? String(change.to) : '—';
  const isSelf = relevantLog.metadata?.isSelfEdit ?? (relevantLog.actorId === relevantLog.targetId);
  const formattedDate = new Date(relevantLog.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors cursor-pointer select-none ${className}`}
          title="Click to view change history for this field"
        >
          <History className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="truncate max-w-[120px]">Prev: {fromStr}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 space-y-2 shadow-lg border border-border bg-popover text-popover-foreground text-xs" align="start">
        <div className="flex items-center justify-between pb-1.5 border-b border-border">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-primary" />
            Field Revision
          </span>
          <span className="text-[10px] text-muted-foreground">{formattedDate}</span>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Previous:</span>
            <span className="line-through text-rose-500 dark:text-rose-400 font-medium max-w-[150px] truncate">
              {fromStr}
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Current:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold max-w-[150px] truncate">
              {toStr}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-border flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            {isSelf ? (
              <>
                <UserCheck className="w-3 h-3 text-emerald-500" />
                Self-edited by employee
              </>
            ) : (
              <>
                <User className="w-3 h-3 text-primary" />
                By {relevantLog.actor.firstName} {relevantLog.actor.lastName ?? ''}
              </>
            )}
          </span>
          <Badge variant={isSelf ? 'outline' : 'secondary'} className="text-[9px] px-1 py-0 h-4">
            {isSelf ? 'Self' : 'Admin/HR'}
          </Badge>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PreviousDetailPill;
