import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle, Clock, Calendar } from 'lucide-react';
import { useAttendanceRules, useCreateRule, useToggleRule, useDeleteRule } from '../../../hooks/useAttendance';
import { CreateRuleRequest, AttendanceRule } from '../../../types/attendance';

interface AttendanceRulesManagerProps {
  orgId: string;
}

const AttendanceRulesManager: React.FC<AttendanceRulesManagerProps> = ({ orgId }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<AttendanceRule | null>(null);
  const [newRule, setNewRule] = useState<CreateRuleRequest>({
    ruleType: 'LATE_ARRIVAL',
    threshold: 0,
    penalty: 0,
    description: '',
    isActive: true
  });

  const { data: rulesData, isLoading, error } = useAttendanceRules(orgId);
  const createRuleMutation = useCreateRule(orgId);
  const toggleRuleMutation = useToggleRule(orgId);
  const deleteRuleMutation = useDeleteRule(orgId);

  // Handle different response structures and add debug logging
  console.log('Rules Data Debug:', { rulesData, orgId });
  
  const rules = useMemo(() => {
    if (!rulesData) return [];
    
    // Try different possible data structures
    const data = rulesData as any; // Type assertion to handle unknown structure
    
    // Check if it's the expected API response format
    if (data.success && data.data) {
      if (Array.isArray(data.data)) {
        console.log('Using rulesData.data (array format):', data.data);
        return data.data;
      }
      if (Array.isArray(data.data.rules)) {
        console.log('Using rulesData.data.rules:', data.data.rules);
        return data.data.rules;
      }
      // Handle the case where rules are in a nested object format
      if (data.data.rules && typeof data.data.rules === 'object' && !Array.isArray(data.data.rules)) {
        console.log('Converting rules object to array:', data.data.rules);
        // Convert rules object to array format - use proper rule IDs from backend if available
        return Object.entries(data.data.rules).map(([ruleType, ruleData]: [string, any]) => {
          // If rule has an ID from backend, use it; otherwise generate consistent ID
          const ruleId = ruleData.id || `rule-${ruleType.toLowerCase()}-${orgId}`;
          
          // Extract threshold value from complex object or use simple value
          let thresholdValue = 0;
          if (ruleData.thresholds && Array.isArray(ruleData.thresholds) && ruleData.thresholds.length > 0) {
            thresholdValue = ruleData.thresholds[0].minutes || 0;
          } else if (typeof ruleData.threshold === 'object') {
            thresholdValue = ruleData.threshold.minutes || ruleData.threshold.value || 0;
          } else {
            thresholdValue = ruleData.threshold || 0;
          }
          
          // Extract penalty value from complex object or use simple value
          let penaltyValue = 0;
          if (ruleData.penalties && typeof ruleData.penalties === 'object') {
            penaltyValue = ruleData.penalties.unauthorized || ruleData.penalties.amount || 0;
          } else if (typeof ruleData.penalty === 'object') {
            penaltyValue = ruleData.penalty.amount || ruleData.penalty.value || 0;
          } else {
            penaltyValue = ruleData.penalty || 0;
          }
          
          return {
            id: ruleId,
            ruleType: ruleType.toUpperCase(),
            threshold: thresholdValue,
            penalty: penaltyValue,
            description: ruleData.description || `${ruleType.replace(/([A-Z])/g, ' $1').trim()} rule`,
            isActive: ruleData.isActive || false,
            ...ruleData
          };
        });
      }
    }
    
    if (Array.isArray(data)) {
      console.log('Using rulesData directly:', data);
      return data;
    }
    
    console.warn('Could not determine rules array structure, falling back to empty array');
    return [];
  }, [rulesData, orgId]);

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      // Check if this is a generated ID (not a real database ID)
      if (ruleId.startsWith('rule-')) {
        // This means the rule doesn't exist in database yet, so create it first
        const ruleTypeFromId = ruleId.replace(`rule-`, '').replace(`-${orgId}`, '');
        const ruleTypeMapping: Record<string, string> = {
          'latearrival': 'LATE_ARRIVAL',
          'earlydeparture': 'EARLY_DEPARTURE',
          'minimumhours': 'MINIMUM_HOURS',
          'breakviolation': 'BREAK_VIOLATION',
          'geofenceviolation': 'GEOFENCE_VIOLATION',
          'absenteeism': 'ABSENTEEISM'
        };
        
        const actualRuleType = ruleTypeMapping[ruleTypeFromId] || ruleTypeFromId.toUpperCase();
        
        // Create the rule first with default values
        const createRuleRequest: CreateRuleRequest = {
          ruleType: actualRuleType,
          threshold: 15, // Default threshold
          penalty: 0, // Default penalty
          description: `Default ${actualRuleType.replace('_', ' ').toLowerCase()} rule`,
          isActive: isActive
        };
        
        await createRuleMutation.mutateAsync(createRuleRequest);
      } else {
        // This is a real database ID, proceed with toggle
        await toggleRuleMutation.mutateAsync({ ruleId, isActive });
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await deleteRuleMutation.mutateAsync(ruleId);
      } catch (error) {
        console.error('Failed to delete rule:', error);
      }
    }
  };

  const handleEditRule = (rule: AttendanceRule) => {
    setEditingRule(rule);
    // Pre-populate the form with rule data
    setNewRule({
      ruleType: rule.ruleType,
      threshold: typeof rule.threshold === 'object' ? (rule.threshold as any)?.minutes || 0 : rule.threshold,
      penalty: typeof rule.penalty === 'object' ? (rule.penalty as any)?.amount || 0 : rule.penalty,
      description: rule.description || '',
      isActive: rule.isActive
    });
    setIsCreating(true); // Reuse the same form for editing
  };

  const handleSaveRule = async () => {
    try {
      if (editingRule) {
        // Update existing rule
        if (editingRule.id.startsWith('rule-')) {
          // This is a default rule that needs to be created first
          await createRuleMutation.mutateAsync(newRule);
        } else {
          // This is an existing rule in database - update it
          await createRuleMutation.mutateAsync({
            ...newRule,
            // For updates, we'll use create/update endpoint
          });
        }
      } else {
        // Create new rule
        await createRuleMutation.mutateAsync(newRule);
      }
      
      // Reset form
      setIsCreating(false);
      setEditingRule(null);
      setNewRule({
        ruleType: 'LATE_ARRIVAL',
        threshold: 0,
        penalty: 0,
        description: '',
        isActive: true
      });
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsCreating(false);
    setEditingRule(null);
    setNewRule({
      ruleType: 'LATE_ARRIVAL',
      threshold: 0,
      penalty: 0,
      description: '',
      isActive: true
    });
  };

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'LATE_ARRIVAL': 'Late Arrival',
      'EARLY_DEPARTURE': 'Early Departure',
      'MINIMUM_HOURS': 'Minimum Hours',
      'BREAK_VIOLATION': 'Break Violation',
      'GEOFENCE_VIOLATION': 'Geofence Violation',
      'ABSENTEEISM': 'Absenteeism'
    };
    return labels[type] || type;
  };

  const getRuleTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'LATE_ARRIVAL': 'bg-yellow-100 text-yellow-800',
      'EARLY_DEPARTURE': 'bg-orange-100 text-orange-800',
      'MINIMUM_HOURS': 'bg-blue-100 text-blue-800',
      'BREAK_VIOLATION': 'bg-purple-100 text-purple-800',
      'GEOFENCE_VIOLATION': 'bg-pink-100 text-pink-800',
      'ABSENTEEISM': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load attendance rules. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Attendance Rules</h2>
          <p className="text-gray-600">Manage progressive deduction rules and penalties</p>
        </div>
        <Button onClick={() => {
          setEditingRule(null);
          setIsCreating(true);
        }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* Create Rule Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRule ? 'Edit Attendance Rule' : 'Create New Attendance Rule'}</CardTitle>
            <CardDescription>
              {editingRule ? 'Modify the rule conditions and penalties' : 'Define a new rule with conditions and progressive penalties'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rule-type">Rule Type</Label>
                <Select 
                  value={newRule.ruleType} 
                  onValueChange={(value) => setNewRule({...newRule, ruleType: value})}
                  disabled={!!editingRule} // Disable when editing
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rule type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LATE_ARRIVAL">Late Arrival</SelectItem>
                    <SelectItem value="EARLY_DEPARTURE">Early Departure</SelectItem>
                    <SelectItem value="MINIMUM_HOURS">Minimum Hours</SelectItem>
                    <SelectItem value="BREAK_VIOLATION">Break Violation</SelectItem>
                    <SelectItem value="GEOFENCE_VIOLATION">Geofence Violation</SelectItem>
                    <SelectItem value="ABSENTEEISM">Absenteeism</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="threshold">Threshold (minutes)</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={newRule.threshold}
                  onChange={(e) => setNewRule({...newRule, threshold: parseInt(e.target.value) || 0})}
                  placeholder="Enter threshold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newRule.description || ''}
                  onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                  placeholder="Describe when this rule applies"
                />
              </div>
              <div>
                <Label htmlFor="penalty">Penalty Amount</Label>
                <Input
                  id="penalty"
                  type="number"
                  value={newRule.penalty}
                  onChange={(e) => setNewRule({...newRule, penalty: parseInt(e.target.value) || 0})}
                  placeholder="Enter penalty amount"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                checked={newRule.isActive}
                onCheckedChange={(checked) => setNewRule({...newRule, isActive: checked})}
              />
              <Label>Active</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveRule}
                disabled={!newRule.description || createRuleMutation.isPending}
              >
                {createRuleMutation.isPending ? 'Saving...' : (editingRule ? 'Update Rule' : 'Create Rule')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      <div className="grid gap-4">
        {(!Array.isArray(rules) || rules.length === 0) ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rules configured</h3>
                <p className="text-gray-500">Create your first attendance rule to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          Array.isArray(rules) && rules.map((rule: AttendanceRule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={getRuleTypeColor(rule.ruleType)}>
                      {getRuleTypeLabel(rule.ruleType)}
                    </Badge>
                    <div>
                      <CardTitle className="text-lg">{getRuleTypeLabel(rule.ruleType)}</CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={rule.isActive}
                      onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                      disabled={toggleRuleMutation.isPending}
                    />
                    <Button variant="ghost" size="sm" onClick={() => handleEditRule(rule)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteRule(rule.id)}
                      disabled={deleteRuleMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      Threshold: {typeof rule.threshold === 'object' ? (rule.threshold as any)?.minutes || 0 : rule.threshold} minutes
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      Penalty: {typeof rule.penalty === 'object' ? (rule.penalty as any)?.amount || 0 : rule.penalty}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {rule.isActive ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Active</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-400">Inactive</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AttendanceRulesManager;
