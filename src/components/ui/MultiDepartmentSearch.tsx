import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  X, 
  Users, 
  Building2,
  Crown,
  UserCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { multiDepartmentApi } from '@/api/multiDepartmentApi';
import { useToast } from '@/hooks/use-toast';
import { User, Department } from '@/interface/general';

interface MultiDepartmentSearchProps {
  orgId: string;
  onUserSelect?: (user: User) => void;
  onUsersFiltered?: (users: User[]) => void;
  className?: string;
}

interface SearchFilters {
  query: string;
  departmentIds: string[];
  primaryOnly: boolean;
  includeSecondary: boolean;
  minDepartments: number;
  maxDepartments: number;
  hasMultipleDepartments: boolean;
}

const defaultFilters: SearchFilters = {
  query: '',
  departmentIds: [],
  primaryOnly: false,
  includeSecondary: true,
  minDepartments: 1,
  maxDepartments: 10,
  hasMultipleDepartments: false
};

const MultiDepartmentSearch: React.FC<MultiDepartmentSearchProps> = ({
  orgId,
  onUserSelect,
  onUsersFiltered,
  className = ''
}) => {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setDepartmentsLoading(true);
        const response = await multiDepartmentApi.getDepartmentsWithStats(orgId);
        setDepartments(response.departments || []);
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load departments',
          variant: 'destructive'
        });
      } finally {
        setDepartmentsLoading(false);
      }
    };

    if (orgId) {
      fetchDepartments();
    }
  }, [orgId, toast]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchFilters: SearchFilters) => {
      if (!searchFilters.query.trim() && searchFilters.departmentIds.length === 0) {
        setSearchResults([]);
        onUsersFiltered?.([]);
        return;
      }

      try {
        setLoading(true);
        
        // Use different API endpoints based on filter criteria
        let results: User[] = [];
        
        if (searchFilters.query.trim()) {
          // Text-based search across departments
          const response = await multiDepartmentApi.searchUsersAcrossDepartments(
            orgId,
            searchFilters.query,
            searchFilters.departmentIds.length > 0 ? searchFilters.departmentIds : undefined
          );
          results = response.users || [];
        } else if (searchFilters.departmentIds.length > 0) {
          // Department-based filtering
          const promises = searchFilters.departmentIds.map(deptId =>
            multiDepartmentApi.getUsersByDepartment(orgId, deptId, {
              primaryOnly: searchFilters.primaryOnly,
              includeSecondary: searchFilters.includeSecondary
            })
          );
          
          const responses = await Promise.all(promises);
          const allUsers = responses.flatMap(response => response.users || []);
          
          // Remove duplicates based on user ID
          const userMap = new Map();
          allUsers.forEach(user => {
            if (!userMap.has(user.id)) {
              userMap.set(user.id, user);
            }
          });
          results = Array.from(userMap.values());
        }

        // Apply additional filters
        const filteredResults = applyAdvancedFilters(results, searchFilters);
        
        setSearchResults(filteredResults);
        onUsersFiltered?.(filteredResults);

      } catch (error) {
        console.error('Error searching users:', error);
        toast({
          title: 'Search Error',
          description: 'Failed to search users',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }, 300),
    [orgId, onUsersFiltered, toast]
  );

  // Apply advanced filters to results
  const applyAdvancedFilters = (users: User[], searchFilters: SearchFilters): User[] => {
    return users.filter(user => {
      const userDepartments = user.userDepartments || [];
      const departmentCount = userDepartments.length;

      // Filter by department count range
      if (departmentCount < searchFilters.minDepartments || departmentCount > searchFilters.maxDepartments) {
        return false;
      }

      // Filter by multi-department requirement
      if (searchFilters.hasMultipleDepartments && departmentCount <= 1) {
        return false;
      }

      return true;
    });
  };

  // Trigger search when filters change
  useEffect(() => {
    debouncedSearch(filters);
  }, [filters, debouncedSearch]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDepartmentToggle = (departmentId: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      departmentIds: checked 
        ? [...prev.departmentIds, departmentId]
        : prev.departmentIds.filter(id => id !== departmentId)
    }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setSearchResults([]);
    onUsersFiltered?.([]);
  };

  const getUserDepartmentCount = (user: User): number => {
    return user.userDepartments?.length || 0;
  };

  const getUserPrimaryDepartment = (user: User): Department | undefined => {
    return user.primaryDepartment || user.userDepartments?.find(ud => ud.isPrimary)?.department;
  };

  const hasActiveFilters = () => {
    return (
      filters.query.trim() !== '' ||
      filters.departmentIds.length > 0 ||
      filters.primaryOnly ||
      !filters.includeSecondary ||
      filters.minDepartments !== 1 ||
      filters.maxDepartments !== 10 ||
      filters.hasMultipleDepartments
    );
  };

  if (departmentsLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Multi-Department Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Multi-Department Search & Filter
          </CardTitle>
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or role..."
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Department Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Filter by Departments</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {departments.map((department) => (
              <div key={department.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`dept-${department.id}`}
                  checked={filters.departmentIds.includes(department.id)}
                  onCheckedChange={(checked) => 
                    handleDepartmentToggle(department.id, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={`dept-${department.id}`} 
                  className="text-sm cursor-pointer flex items-center gap-1"
                >
                  <Building2 className="h-3 w-3" />
                  {department.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="primary-only"
              checked={filters.primaryOnly}
              onCheckedChange={(checked) => handleFilterChange('primaryOnly', checked)}
            />
            <Label htmlFor="primary-only" className="text-sm cursor-pointer">
              Primary assignments only
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="multi-dept"
              checked={filters.hasMultipleDepartments}
              onCheckedChange={(checked) => handleFilterChange('hasMultipleDepartments', checked)}
            />
            <Label htmlFor="multi-dept" className="text-sm cursor-pointer">
              Multi-department users only
            </Label>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Advanced Filters
          {showAdvancedFilters ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-departments" className="text-sm">
                  Minimum Departments
                </Label>
                <Select
                  value={filters.minDepartments.toString()}
                  onValueChange={(value) => handleFilterChange('minDepartments', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-departments" className="text-sm">
                  Maximum Departments
                </Label>
                <Select
                  value={filters.maxDepartments.toString()}
                  onValueChange={(value) => handleFilterChange('maxDepartments', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-secondary"
                checked={filters.includeSecondary}
                onCheckedChange={(checked) => handleFilterChange('includeSecondary', checked)}
              />
              <Label htmlFor="include-secondary" className="text-sm cursor-pointer">
                Include secondary department assignments
              </Label>
            </div>
          </div>
        )}

        {/* Search Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Search Results ({searchResults.length})
            </Label>
            {loading && (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground">Searching...</span>
              </div>
            )}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {searchResults.map((user) => {
              const departmentCount = getUserDepartmentCount(user);
              const primaryDepartment = getUserPrimaryDepartment(user);

              return (
                <div
                  key={user.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onUserSelect?.(user)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.firstName} {user.lastName}</span>
                        {departmentCount > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            {departmentCount} departments
                          </Badge>
                        )}
                        {primaryDepartment && (
                          <div className="flex items-center gap-1">
                            <Crown className="h-3 w-3 text-yellow-600" />
                            <span className="text-xs text-muted-foreground">
                              {primaryDepartment.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {user.email}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {user.userDepartments?.map((userDept) => (
                          <Badge
                            key={userDept.id}
                            variant={userDept.isPrimary ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {userDept.department.name}
                            {userDept.isPrimary && <Crown className="h-2 w-2 ml-1" />}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <UserCheck className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && searchResults.length === 0 && hasActiveFilters() && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found matching your criteria</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default MultiDepartmentSearch;
