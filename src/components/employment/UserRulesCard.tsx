import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Calendar } from 'lucide-react';
import { employmentTypeService } from '@/services/api/employmentTypeService';
import { UserRulesSummary, EMPLOYMENT_TYPE_LABELS } from '@/types/employmentType';

interface UserRulesCardProps {
  orgId: string;
  userId: string;
}

export const UserRulesCard: React.FC<UserRulesCardProps> = ({ orgId, userId }) => {
  const [rulesSummary, setRulesSummary] = useState<UserRulesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        setIsLoading(true);
        const data = await employmentTypeService.getUserRulesSummary(orgId, userId);
        setRulesSummary(data);
      } catch (err) {
        console.error('Failed to fetch user rules:', err);
        setError('Failed to load rules');
      } finally {
        setIsLoading(false);
      }
    };

    if (orgId && userId) {
      fetchRules();
    }
  }, [orgId, userId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (error || !rulesSummary) {
    return null;
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const RuleItem = ({
    title,
    rule,
  }: {
    title: string;
    rule: { overridden: boolean; source: string; config?: any; eligible?: boolean };
  }) => {
    const isOverridden = rule.overridden;

    return (
      <div className="border-b border-gray-100 pb-3 last:border-0">
        <div className="flex items-center justify-between mb-2">
          <h4 className={`font-semibold text-sm ${isOverridden ? 'text-gray-900' : 'text-gray-700'}`}>
            {title}
          </h4>
          {isOverridden && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <Star className="w-3 h-3 mr-1" />
              Custom
            </Badge>
          )}
        </div>

        {title === 'Leave' && rule.eligible === false && (
          <p className="text-sm text-red-600">❌ Not eligible for leave</p>
        )}

        {title === 'Attendance' && rule.config && (
          <div className="text-sm text-gray-600 space-y-1">
            {rule.config.dailyMinimum && (
              <p>
                • Daily: {rule.config.dailyMinimum}
                {rule.config.dailyMaximum ? `-${rule.config.dailyMaximum}` : '+'} hours
              </p>
            )}
            {rule.config.weeklyMinimum && (
              <p>
                • Weekly: {rule.config.weeklyMinimum}
                {rule.config.weeklyMaximum ? `-${rule.config.weeklyMaximum}` : '+'} hours
              </p>
            )}
          </div>
        )}

        {!isOverridden && (
          <p className="text-xs text-gray-500 italic mt-1">Using organization defaults</p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Employment Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b">
          <span className="text-sm text-gray-600">Employment Type:</span>
          <Badge variant="secondary">{EMPLOYMENT_TYPE_LABELS[rulesSummary.employmentType]}</Badge>
        </div>

        {rulesSummary.contractEndDate && (
          <div className="flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-100">
            <Calendar className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700 font-medium">
              Contract ends: {formatDate(rulesSummary.contractEndDate)}
            </span>
          </div>
        )}

        <div className="space-y-3">
          <RuleItem title="Attendance" rule={rulesSummary.rules.attendance} />
          <RuleItem title="Leave" rule={rulesSummary.rules.leave} />
          <RuleItem title="Break" rule={rulesSummary.rules.break} />
          <RuleItem title="Payroll" rule={rulesSummary.rules.payroll} />
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Star className="w-3 h-3 text-yellow-600" />
            <span>Custom rules for your employment type</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
