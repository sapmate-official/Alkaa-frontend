import React, { useState, useEffect } from 'react';
import { ChevronsUpDown, X, Crown, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Department } from '@/interface/general';

interface MultiDepartmentSelectorProps {
  departments: Department[];
  selectedDepartments: string[];
  primaryDepartmentId?: string;
  departmentRoles?: { departmentId: string; role: string }[];
  onSelectionChange: (departmentIds: string[], primaryId?: string, roles?: { departmentId: string; role: string }[]) => void;
  disabled?: boolean;
  maxSelections?: number;
  showRoles?: boolean;
  availableRoles?: string[];
  placeholder?: string;
  className?: string;
}

export const MultiDepartmentSelector: React.FC<MultiDepartmentSelectorProps> = ({
  departments,
  selectedDepartments,
  primaryDepartmentId,
  departmentRoles = [],
  onSelectionChange,
  disabled = false,
  maxSelections,
  showRoles = false,
  availableRoles = ['Member', 'Lead', 'Supervisor'],
  placeholder = "Select departments...",
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [internalRoles, setInternalRoles] = useState<{ departmentId: string; role: string }[]>(departmentRoles);

  useEffect(() => {
    setInternalRoles(departmentRoles);
  }, [departmentRoles]);

  const handleDepartmentToggle = (departmentId: string) => {
    if (disabled) return;

    let newSelection: string[];
    let newPrimary = primaryDepartmentId;
    let newRoles = [...internalRoles];

    if (selectedDepartments.includes(departmentId)) {
      // Remove department
      newSelection = selectedDepartments.filter(id => id !== departmentId);
      newRoles = newRoles.filter(r => r.departmentId !== departmentId);
      
      // If removing primary department, set new primary
      if (primaryDepartmentId === departmentId && newSelection.length > 0) {
        newPrimary = newSelection[0];
      } else if (newSelection.length === 0) {
        newPrimary = undefined;
      }
    } else {
      // Add department
      if (maxSelections && selectedDepartments.length >= maxSelections) {
        return;
      }
      
      newSelection = [...selectedDepartments, departmentId];
      
      // If no primary department set, make this the primary
      if (!primaryDepartmentId) {
        newPrimary = departmentId;
      }
      
      // Add default role if showing roles
      if (showRoles) {
        newRoles.push({ departmentId, role: availableRoles[0] });
      }
    }

    setInternalRoles(newRoles);
    onSelectionChange(newSelection, newPrimary, newRoles);
  };

  const handlePrimaryChange = (departmentId: string) => {
    if (disabled || !selectedDepartments.includes(departmentId)) return;
    
    onSelectionChange(selectedDepartments, departmentId, internalRoles);
  };

  const handleRoleChange = (departmentId: string, role: string) => {
    if (disabled) return;
    
    const newRoles = internalRoles.map(r => 
      r.departmentId === departmentId ? { ...r, role } : r
    );
    
    setInternalRoles(newRoles);
    onSelectionChange(selectedDepartments, primaryDepartmentId, newRoles);
  };

  const selectedDepartmentNames = departments
    .filter(dept => selectedDepartments.includes(dept.id))
    .map(dept => dept.name);

  const getDisplayText = () => {
    if (selectedDepartments.length === 0) {
      return placeholder;
    } else if (selectedDepartments.length === 1) {
      return selectedDepartmentNames[0];
    } else {
      return `${selectedDepartments.length} departments selected`;
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Department Selector */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Departments</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={disabled}
            >
              <span className="truncate">{getDisplayText()}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search departments..." />
              <CommandEmpty>No departments found.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {departments.map((department) => (
                    <CommandItem
                      key={department.id}
                      value={department.name}
                      onSelect={() => handleDepartmentToggle(department.id)}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        checked={selectedDepartments.includes(department.id)}
                        className="data-[state=checked]:bg-primary"
                      />
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <span className="font-medium">{department.name}</span>
                        {department.code && (
                          <span className="text-xs text-muted-foreground ml-1">({department.code})</span>
                        )}
                      </div>
                      {primaryDepartmentId === department.id && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Departments Display */}
      {selectedDepartments.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Selected Departments</Label>
          <div className="space-y-2">
            {selectedDepartments.map((deptId) => {
              const department = departments.find(d => d.id === deptId);
              const roleInfo = internalRoles.find(r => r.departmentId === deptId);
              
              if (!department) return null;

              return (
                <div key={deptId} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{department.name}</span>
                    {primaryDepartmentId === deptId && (
                      <Badge variant="secondary" className="text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Primary
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Role Selector */}
                    {showRoles && (
                      <Select
                        value={roleInfo?.role || availableRoles[0]}
                        onValueChange={(role) => handleRoleChange(deptId, role)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {/* Primary Department Selector */}
                    {selectedDepartments.length > 1 && (
                      <Button
                        variant={primaryDepartmentId === deptId ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePrimaryChange(deptId)}
                        disabled={disabled}
                        className="h-8"
                      >
                        <Crown className="h-3 w-3 mr-1" />
                        {primaryDepartmentId === deptId ? "Primary" : "Set Primary"}
                      </Button>
                    )}
                    
                    {/* Remove Department */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDepartmentToggle(deptId)}
                      disabled={disabled}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {selectedDepartments.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {selectedDepartments.length} of {maxSelections || departments.length} departments selected
        </div>
      )}
    </div>
  );
};

export default MultiDepartmentSelector;
