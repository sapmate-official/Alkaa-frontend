import { useMemo, useState } from 'react';
import { useAuth } from '@/providers/AuthContext';
import { useAttendanceActivityQuery } from '@/hooks/queries/useAttendance';
import { useDateTimeFormat } from '@/hooks/useDateTimeFormat';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, ListFilter } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface AttendanceActivityEntry {
  id: string;
  recordId: string;
  userId: string;
  userName: string;
  employeeId: string | null;
  department: string | null;
  managerId: string | null;
  sessionNumber: number;
  status: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  timestamp: string;
  checkInTime?: string;
  checkOutTime?: string | null;
  duration?: any;
  notes?: string | null;
  locations?: {
    checkIn?: any;
    checkOut?: any;
  };
}

type ActivityScope = 'SELF' | 'SUBORDINATES' | 'ORGANIZATION';

const scopeDescriptions: Record<ActivityScope, { title: string; description: string }> = {
  SELF: {
    title: "Your Attendance Activity",
    description: "You are viewing a timeline of your own check-ins and check-outs."
  },
  SUBORDINATES: {
    title: "Team Attendance Activity",
    description: "Showing the most recent attendance actions from your direct reports."
  },
  ORGANIZATION: {
    title: "Organization Attendance Activity",
    description: "Displaying activity across the entire organization sorted by most recent."
  }
};

const ActivitySkeleton = () => (
  <TableRow>
    <TableCell colSpan={6}>
      <div className="flex items-center gap-4 py-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-28" />
      </div>
    </TableCell>
  </TableRow>
);

const AttendanceActivityPage = () => {
  const { user } = useAuth();
  const [limit, setLimit] = useState<number>(50);
  const params = useMemo(() => ({ limit }), [limit]);
  const { formatDateTime, formatTime } = useDateTimeFormat();

  const { data, isLoading, isFetching, refetch } = useAttendanceActivityQuery(user?.orgId, params);

  const activities: AttendanceActivityEntry[] = data?.data ?? [];
  const scope: ActivityScope = (data?.scope as ActivityScope) || 'SELF';
  const pagination = data?.pagination;

  const handleLimitChange = (value: string) => {
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      setLimit(parsed);
    }
  };

  const renderLocation = (entry: AttendanceActivityEntry) => {
    const targetLocation = entry.type === 'CHECK_OUT'
      ? entry.locations?.checkOut
      : entry.locations?.checkIn;

    if (!targetLocation) {
      return '—';
    }

    if (typeof targetLocation === 'string') {
      return targetLocation;
    }

    if (targetLocation?.latitude && targetLocation?.longitude) {
      return `${targetLocation.latitude}, ${targetLocation.longitude}`;
    }

    return JSON.stringify(targetLocation);
  };

  const renderDuration = (entry: AttendanceActivityEntry) => {
    if (entry.type !== 'CHECK_OUT' || !entry.duration) {
      return '—';
    }

    const { hours, minutes } = entry.duration;
    if (hours !== undefined || minutes !== undefined) {
      const safeHours = hours ?? 0;
      const safeMinutes = minutes ?? 0;
      return `${safeHours}h ${safeMinutes}m`;
    }

    if (entry.duration.totalMinutes) {
      const totalMinutes = entry.duration.totalMinutes;
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      return `${h}h ${m}m`;
    }

    return '—';
  };

  const scopeInfo = scopeDescriptions[scope];

  return (
    <div className="p-6 w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Activity</h1>
          <p className="text-muted-foreground mt-1">
            Review the latest attendance actions across your permitted scope.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={limit.toString()} onValueChange={handleLimitChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              {[25, 50, 75, 100].map((value) => (
                <SelectItem key={value} value={value.toString()}>
                  Show {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListFilter className="h-5 w-5 text-primary" />
                {scopeInfo.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {scopeInfo.description}
              </CardDescription>
            </div>
            {pagination && (
              <Badge variant="secondary">
                Showing {activities.length} of {pagination.total}
              </Badge>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => <ActivitySkeleton key={index} />)
                ) : activities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="py-12 text-center text-muted-foreground">
                        No attendance activity found for the selected scope yet.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  activities.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{entry.userName}</span>
                          {entry.employeeId && (
                            <span className="text-xs text-muted-foreground">#{entry.employeeId}</span>
                          )}
                          {entry.department && (
                            <span className="text-xs text-muted-foreground">{entry.department}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.type === 'CHECK_IN' ? 'default' : 'outline'} className={entry.type === 'CHECK_IN' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
                          {entry.type === 'CHECK_IN' ? 'Check-In' : 'Check-Out'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{formatDateTime(entry.timestamp)}</span>
                          <span className="text-xs text-muted-foreground">Local time: {formatTime(entry.timestamp)}</span>
                        </div>
                      </TableCell>
                      <TableCell>#{entry.sessionNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.status || '—'}</Badge>
                      </TableCell>
                      <TableCell>{renderDuration(entry)}</TableCell>
                      <TableCell className="max-w-xs truncate" title={renderLocation(entry)}>
                        {renderLocation(entry)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceActivityPage;
