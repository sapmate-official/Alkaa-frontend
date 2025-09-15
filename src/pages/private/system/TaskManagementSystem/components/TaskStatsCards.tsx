import { Card, CardContent} from '@/components/ui/card';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
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

const TaskStatsCards = ({ stats, assignedStats }: TaskStatsCardsProps) => {
  const statCards = [
    {
      title: 'Total Created',
      subtitle: assignedStats ? `(${assignedStats.total} assigned to me)` : '',
      value: stats.total,
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'In Progress',
      subtitle: assignedStats ? `(${assignedStats.inProgress} mine)` : '',
      value: stats.inProgress,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Completed',
      subtitle: assignedStats ? `(${assignedStats.completed} mine)` : '',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Overdue',
      subtitle: assignedStats ? `(${assignedStats.overdue} mine)` : '',
      value: stats.overdue,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TaskStatsCards;
