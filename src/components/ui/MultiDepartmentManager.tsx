import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { MultiDepartmentSelector } from '@/components/ui/MultiDepartmentSelector';
import { User, Department } from '@/interface/general';
import { multiDepartmentUtils } from '@/utils/multiDepartmentUtils';
import { APIDictionary } from '@/api/v2/APIdict';
import axios from 'axios';
import { 
  Users, 
  Building, 
  Crown, 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface MultiDepartmentManagerProps {
  user: User;
  departments: Department[];
  onUserUpdate?: (updatedUser: User) => void;
  canEdit?: boolean;
  className?: string;
}

export const MultiDepartmentManager: React.FC<MultiDepartmentManagerProps> = ({
  user,
  departments,
  onUserUpdate,
  canEdit = false,
  className = '',
}) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [primaryDepartmentId, setPrimaryDepartmentId] = useState<string | undefined>();
  const [departmentRoles, setDepartmentRoles] = useState<{ departmentId: string; role: string }[]>([]);

  // Initialize form data when dialog opens
  useEffect(() => {
    if (isDialogOpen && user.userDepartments) {
      const currentDeptIds = user.userDepartments.map(ud => ud.departmentId);
      const currentPrimary = user.userDepartments.find(ud => ud.isPrimary)?.departmentId;
      const currentRoles = user.userDepartments.map(ud => ({
        departmentId: ud.departmentId,
        role: ud.role || 'Member'
      }));

      setSelectedDepartments(currentDeptIds);
      setPrimaryDepartmentId(currentPrimary);
      setDepartmentRoles(currentRoles);
    } else if (isDialogOpen) {
      // Fallback to legacy department
      if (user.departmentId) {
        setSelectedDepartments([user.departmentId]);
        setPrimaryDepartmentId(user.departmentId);
        setDepartmentRoles([{ departmentId: user.departmentId, role: 'Member' }]);
      } else {
        setSelectedDepartments([]);
        setPrimaryDepartmentId(undefined);
        setDepartmentRoles([]);
      }
    }
  }, [isDialogOpen, user]);

  const handleSave = async () => {
    if (selectedDepartments.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one department must be selected',
        variant: 'destructive'
      });
      return;
    }

    if (!primaryDepartmentId || !selectedDepartments.includes(primaryDepartmentId)) {
      toast({
        title: 'Validation Error',
        description: 'Primary department must be in the selected departments',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Create department assignments data
      const departmentAssignments = selectedDepartments.map(deptId => {
        const role = departmentRoles.find(r => r.departmentId === deptId);
        return {
          departmentId: deptId,
          isPrimary: deptId === primaryDepartmentId,
          role: role?.role || 'Member'
        };
      });

      // Update user departments
      const response = await axios.put(
        `${APIDictionary.user}/${user.id}/departments`,
        {
          departments: departmentAssignments,
          primaryDepartmentId
        },
        { withCredentials: true }
      );

      toast({
        title: 'Success',
        description: 'Department assignments updated successfully'
      });

      // Update local user data
      if (onUserUpdate && response.data) {
        onUserUpdate(response.data);
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating departments:', error);
      toast({
        title: 'Error',
        description: 'Failed to update department assignments',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromDepartment = async (departmentId: string) => {
    if (!canEdit) return;
    
    if (selectedDepartments.length <= 1) {
      toast({
        title: 'Cannot Remove',
        description: 'User must belong to at least one department',
        variant: 'destructive'
      });
      return;
    }

    try {
      await axios.delete(
        `${APIDictionary.user}/${user.id}/departments/${departmentId}`,
        { withCredentials: true }
      );

      toast({
        title: 'Success',
        description: 'User removed from department successfully'
      });

      // Refresh user data
      if (onUserUpdate) {
        const response = await axios.get(`${APIDictionary.user}/${user.id}`, { withCredentials: true });
        onUserUpdate(response.data);
      }
    } catch (error) {
      console.error('Error removing from department:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove user from department',
        variant: 'destructive'
      });
    }
  };

  const allUserDepartments = multiDepartmentUtils.getAllDepartments(user);
  const primaryDepartment = multiDepartmentUtils.getPrimaryDepartment(user);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Department Assignments
            </CardTitle>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Manage Departments
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {allUserDepartments.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No departments assigned</p>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Departments
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Primary Department */}
              {primaryDepartment && (
                <div className="p-4 border rounded-lg bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Crown className="h-5 w-5 text-yellow-600" />
                      <div>
                        <h4 className="font-medium">{primaryDepartment.name}</h4>
                        <p className="text-sm text-muted-foreground">Primary Department</p>
                        {primaryDepartment.code && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {primaryDepartment.code}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">
                        {multiDepartmentUtils.getUserRoleInDepartment(user, primaryDepartment.id) || 'Member'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Secondary Departments */}
              {allUserDepartments.filter(dept => dept.id !== primaryDepartment?.id).map((dept) => {
                const role = multiDepartmentUtils.getUserRoleInDepartment(user, dept.id);
                
                return (
                  <div key={dept.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{dept.name}</h4>
                          <p className="text-sm text-muted-foreground">Secondary Assignment</p>
                          {dept.code && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {dept.code}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {role || 'Member'}
                        </Badge>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFromDepartment(dept.id)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Summary */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                <Users className="h-4 w-4" />
                <span>
                  {allUserDepartments.length} department{allUserDepartments.length !== 1 ? 's' : ''} assigned
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Department Assignments</DialogTitle>
            <DialogDescription>
              Assign the user to one or more departments and specify their roles.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <MultiDepartmentSelector
              departments={departments}
              selectedDepartments={selectedDepartments}
              primaryDepartmentId={primaryDepartmentId}
              departmentRoles={departmentRoles}
              onSelectionChange={(deptIds, primaryId, roles) => {
                setSelectedDepartments(deptIds);
                setPrimaryDepartmentId(primaryId);
                setDepartmentRoles(roles || []);
              }}
              showRoles={true}
              availableRoles={['Member', 'Lead', 'Supervisor', 'Assistant']}
              placeholder="Select departments..."
              maxSelections={10}
            />

            {/* Current State Preview */}
            {selectedDepartments.length > 0 && (
              <div className="mt-6 p-4 border rounded-lg bg-muted/20">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Assignment Preview
                </h4>
                <div className="space-y-2">
                  {selectedDepartments.map((deptId) => {
                    const dept = departments.find(d => d.id === deptId);
                    const role = departmentRoles.find(r => r.departmentId === deptId);
                    const isPrimary = primaryDepartmentId === deptId;
                    
                    if (!dept) return null;

                    return (
                      <div key={deptId} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {isPrimary ? (
                            <Crown className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <Building className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium">{dept.name}</span>
                          {isPrimary && (
                            <Badge variant="default" className="text-xs">Primary</Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {role?.role || 'Member'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || selectedDepartments.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MultiDepartmentManager;
