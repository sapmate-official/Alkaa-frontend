import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

interface TaskStatsCardsProps {
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  assignedStats?: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
}

const TaskStatsCards: React.FC<TaskStatsCardsProps> = ({ stats, assignedStats }) => {
  const statCards = [
    {
      title: 'Total Created',
      subtitle: assignedStats ? `${assignedStats.total} assigned to me` : undefined,
      value: stats.total,
      icon: ClipboardList,
      indicator: null
    },
    {
      title: 'In Progress',
      subtitle: assignedStats ? `${assignedStats.inProgress} assigned to me` : undefined,
      value: stats.inProgress,
      icon: Clock,
      indicator: stats.inProgress > 0 ? 'bg-amber-500' : null
    },
    {
      title: 'Completed',
      subtitle: assignedStats ? `${assignedStats.completed} assigned to me` : undefined,
      value: stats.completed,
      icon: CheckCircle2,
      indicator: stats.completed > 0 ? 'bg-emerald-500' : null
    },
    {
      title: 'Overdue',
      subtitle: assignedStats ? `${assignedStats.overdue} assigned to me` : undefined,
      value: stats.overdue,
      icon: AlertCircle,
      indicator: stats.overdue > 0 ? 'bg-destructive' : null
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="border border-border bg-card shadow-xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.title}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</p>
                  {stat.indicator && (
                    <span className={`h-2 w-2 rounded-full ${stat.indicator}`} />
                  )}
                </div>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                )}
              </div>
              <div className="p-2.5 rounded-xl bg-secondary text-foreground">
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TaskStatsCards;
