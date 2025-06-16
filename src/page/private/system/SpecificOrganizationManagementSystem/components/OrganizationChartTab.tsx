import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Network, Building2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { APIDictionary } from '@/api/v2/APIdict';
import { toast } from '@/hooks/use-toast';

interface OrgChartNode {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeId?: string;
  role?: string;
  position?: string;
  type: 'department' | 'user';
  departmentName?: string;
  isHead?: boolean;
  isManager?: boolean;
  managerId?: string;
  managerName?: string;
  subordinates?: string[];
  children: OrgChartNode[];
  parentId?: string;
  level: number;
  color?: string;
}

interface OrgChartNodeComponent {
  node: OrgChartNode;
  onNodeClick: (nodeId: string, nodeType: 'user' | 'department') => void;
  canViewDetails: boolean;
}

// Utility function for connection line colors
const getConnectionLineColor = (node: OrgChartNode) => {
  if (node.isHead) return 'border-red-400';
  if (node.isManager) return 'border-green-400';
  if (node.type === 'department') return 'border-blue-400';
  return 'border-gray-400';
};

const OrgChartNodeBox = ({ node, onNodeClick, canViewDetails }: OrgChartNodeComponent) => {  const getNodeColor = (node: OrgChartNode) => {
    if (node.type === 'department') return 'bg-blue-50 border-blue-300';
    if (node.isHead) return 'bg-red-50 border-red-300';
    if (node.isManager) return 'bg-green-50 border-green-300';
    return 'bg-yellow-50 border-yellow-300';
  };  const getBadgeColor = (node: OrgChartNode) => {
    if (node.isHead) return 'bg-red-500 text-white';
    if (node.isManager) return 'bg-green-500 text-white';
    if (node.type === 'department') return 'bg-blue-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const getTextColor = (node: OrgChartNode) => {
    if (node.type === 'department') return 'text-blue-800';
    if (node.isHead) return 'text-red-800';
    if (node.isManager) return 'text-green-800';
    return 'text-gray-800';
  };

  const handleClick = () => {
    if (node.type === 'user') {
      onNodeClick(node.id.replace('user-', ''), 'user');
    } else {
      onNodeClick(node.id.replace('dept-', ''), 'department');
    }
  };

  return (
    <div className="relative">      <div
        className={`
          relative bg-white rounded-xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 
          cursor-pointer min-w-[200px] max-w-[220px] p-4 mx-2 mb-4 transform hover:scale-105
          ${getNodeColor(node)}
        `}
        onClick={canViewDetails ? handleClick : undefined}
        title={node.type === 'user' && node.managerName ? `Reports to: ${node.managerName}` : undefined}
      >{/* Add Button for expandable nodes */}
        {node.children.length > 0 && (
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
            <div className="bg-white rounded-full border-2 border-gray-400 p-1 shadow-md">
              <Plus className="h-4 w-4 text-gray-600" />
            </div>
          </div>
        )}

        <div className="flex flex-col items-center text-center">
          {/* Avatar/Icon */}
          {node.type === 'user' ? (
            <Avatar className="h-12 w-12 mb-3">
              <AvatarFallback className={`text-sm font-medium ${getTextColor(node)}`}>
                {node.firstName?.[0]}{node.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-3 ${getNodeColor(node)}`}>
              <Building2 className={`h-6 w-6 ${getTextColor(node)}`} />
            </div>
          )}

          {/* Name */}
          <h3 className={`font-semibold text-sm mb-1 ${getTextColor(node)} leading-tight`}>
            {node.name}
          </h3>          {/* Role/Department info */}
          {node.type === 'user' && (
            <div className="text-xs text-gray-600 mb-2 text-center">
              <div>{node.position || node.role || 'Employee'}</div>
              {node.managerName && (
                <div className="text-xs text-blue-600 mt-1">
                  Reports to: {node.managerName}
                </div>
              )}
            </div>
          )}{/* Badges */}
          <div className="flex flex-wrap gap-1 justify-center">
            {node.isHead && (
              <Badge className={`text-xs px-2 py-0 ${getBadgeColor(node)}`}>
                Head
              </Badge>
            )}
            {node.isManager && !node.isHead && (
              <Badge className={`text-xs px-2 py-0 ${getBadgeColor(node)}`}>
                Manager
              </Badge>
            )}
            {node.type === 'department' && (
              <Badge className={`text-xs px-2 py-0 ${getBadgeColor(node)}`}>
                Department
              </Badge>
            )}
            {node.type === 'user' && !node.isHead && !node.isManager && (
              <Badge className={`text-xs px-2 py-0 ${getBadgeColor(node)}`}>
                Employee
              </Badge>
            )}
          </div>          {/* Employee ID and subordinate count for users */}
          {node.type === 'user' && (
            <div className="text-xs text-gray-500 mt-1 space-y-1">
              {node.employeeId && (
                <div>ID: {node.employeeId}</div>
              )}
              {node.isManager && node.subordinates && node.subordinates.length > 0 && (
                <div className="font-medium text-green-600">
                  Manages: {node.subordinates.length} {node.subordinates.length === 1 ? 'person' : 'people'}
                </div>
              )}
            </div>
          )}

          {/* Member count for departments */}
          {node.type === 'department' && node.children.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {node.children.filter(child => child.type === 'user').length} members
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const OrgChartLevel = ({ 
  nodes, 
  onNodeClick, 
  canViewDetails 
}: { 
  nodes: OrgChartNode[]; 
  onNodeClick: (nodeId: string, nodeType: 'user' | 'department') => void;
  canViewDetails: boolean;
}) => {
  if (nodes.length === 0) return null;

  return (
    <div className="flex flex-col items-center">
      {/* Current level nodes */}
      <div className="flex flex-wrap justify-center items-start gap-4 mb-8">
        {nodes.map((node) => (
          <div key={node.id} className="flex flex-col items-center">
            <OrgChartNodeBox 
              node={node} 
              onNodeClick={onNodeClick}
              canViewDetails={canViewDetails}            />
              {/* Connection line down */}
            {node.children.length > 0 && (
              <div className={`w-0 h-8 border-l-2 ${getConnectionLineColor(node)}`}></div>
            )}
            
            {/* Children */}
            {node.children.length > 0 && (
              <div className="relative">                {/* Horizontal line */}
                {node.children.length > 1 && (
                  <div className={`absolute top-0 left-0 right-0 h-0 border-t-2 ${getConnectionLineColor(node)} transform translate-y-0`}></div>
                )}
                
                {/* Children nodes */}
                <div className="flex justify-center items-start gap-4 pt-6">
                  {node.children.map((child) => (
                    <div key={child.id} className="flex flex-col items-center">                      {/* Vertical line to child */}
                      <div className={`w-0 h-8 border-l-2 ${getConnectionLineColor(node)} -mt-8`}></div>
                      
                      <OrgChartNodeBox 
                        node={child} 
                        onNodeClick={onNodeClick}
                        canViewDetails={canViewDetails}
                      />
                        {/* Recursively render children */}
                      {child.children.length > 0 && (                        <div className="mt-6">
                          <div className={`w-0 h-8 border-l-2 ${getConnectionLineColor(child)}`}></div>
                          <OrgChartLevel 
                            nodes={child.children} 
                            onNodeClick={onNodeClick}
                            canViewDetails={canViewDetails}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface OrganizationChartTabProps {
  organization: any;
  canViewDetailedInfo: boolean;
  canViewAllDepartments: boolean;
  canViewDepartmentList: boolean;
  onUserClick: (userId: string) => void;
}

export const OrganizationChartTab = ({ 
  organization, 
  canViewDetailedInfo, 
  canViewAllDepartments,
  canViewDepartmentList,
  onUserClick 
}: OrganizationChartTabProps) => {
  const [orgChart, setOrgChart] = useState<OrgChartNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOrganizationChart = async () => {
    if (!organization?.id) return;
    
    setIsLoading(true);
    try {
      // Try to use the new optimized organization chart API
      const response = await axios.get(
        APIDictionary.OrganizationChart(organization.id),
        { withCredentials: true }
      );
        if (response.data && response.data.chart) {
        console.log('Organization Chart API Response:', response.data);
        console.log('Chart Data:', response.data.chart);
        const chartData = convertToNodeStructure(response.data.chart);
        console.log('Converted Chart Data:', chartData);
        setOrgChart(chartData);
      } else {
        console.log('No chart data in response, falling back to alternative method');
        await fetchOrganizationChartFallback();
      }
      
    } catch (error) {
      console.error('Failed to fetch organization chart data:', error);
      await fetchOrganizationChartFallback();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrganizationChartFallback = async () => {
    try {
      // Fetch departments with their hierarchical structure
      const departmentsResponse = await axios.get(
        `${APIDictionary.department}/org/${organization.id}`,
        { withCredentials: true }
      );
      
      // Fetch organization users
      const orgResponse = await axios.get(
        `${APIDictionary.Organization}/${organization.id}`,
        { withCredentials: true }
      );      const departments = departmentsResponse.data || [];
      const users = orgResponse.data?.users || [];
      
      console.log('Fallback method - Departments:', departments);
      console.log('Fallback method - Users:', users);

      // Build the organization chart structure
      const chartData = buildOrganizationChart(departments, users);
      console.log('Fallback Chart Data:', chartData);
      setOrgChart(chartData);
      
    } catch (error) {
      console.error('Failed to fetch organization chart data (fallback):', error);
      toast({
        title: 'Error',
        description: 'Failed to load organization chart',
        variant: 'destructive'
      });
    }
  };
  const convertToNodeStructure = (hierarchyData: any[]): OrgChartNode[] => {
    const convertNode = (node: any, level: number = 0): OrgChartNode => {
      if (node.type === 'department') {
        return {
          id: `dept-${node.id}`,
          name: node.name,
          type: 'department',
          children: (node.children || []).map((child: any) => convertNode(child, level + 1)),
          level,
          parentId: node.parentId ? `dept-${node.parentId}` : undefined
        };
      } else {
        const manager = node.manager || (node.managerId ? { firstName: 'Unknown', lastName: 'Manager' } : null);
        return {
          id: `user-${node.id}`,
          name: `${node.firstName} ${node.lastName}`,
          firstName: node.firstName,
          lastName: node.lastName,
          email: node.email,
          employeeId: node.employeeId,
          position: node.position || node.role,
          type: 'user',
          departmentName: node.department?.name,
          isHead: node.isHead,
          isManager: node.isManager || (node.subordinates && node.subordinates.length > 0),
          managerId: node.managerId ? `user-${node.managerId}` : undefined,
          managerName: manager ? `${manager.firstName} ${manager.lastName}` : undefined,
          subordinates: (node.subordinates || []).map((sub: any) => `user-${sub.id || sub}`),
          children: (node.children || []).map((child: any) => convertNode(child, level + 1)),
          level,
          parentId: node.departmentId ? `dept-${node.departmentId}` : undefined
        };
      }
    };

    return hierarchyData.map(node => convertNode(node));
  };
  const buildOrganizationChart = (departments: any[], users: any[]): OrgChartNode[] => {
    // Create department nodes
    const departmentNodes: OrgChartNode[] = departments.map(dept => ({
      id: `dept-${dept.id}`,
      name: dept.name,
      type: 'department',
      children: [],
      parentId: dept.parentId ? `dept-${dept.parentId}` : undefined,
      level: 0
    }));

    // Create user nodes with manager information
    const userNodes: OrgChartNode[] = users.map(user => {
      const manager = users.find(u => u.id === user.managerId);
      const subordinateIds = users.filter(u => u.managerId === user.id).map(u => u.id);

      return {
        id: `user-${user.id}`,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        employeeId: user.employeeId,
        position: user.position || user.role || 'Employee',
        type: 'user',
        departmentName: user.department?.name,
        isHead: departments.some(dept => dept.headId === user.id),
        isManager: subordinateIds.length > 0,
        managerId: user.managerId ? `user-${user.managerId}` : undefined,
        managerName: manager ? `${manager.firstName} ${manager.lastName}` : undefined,
        subordinates: subordinateIds.map(id => `user-${id}`),
        children: [],
        parentId: user.departmentId ? `dept-${user.departmentId}` : undefined,
        level: 0
      };
    });

    // Combine all nodes
    const allNodes = [...departmentNodes, ...userNodes];
    const nodeMap = new Map(allNodes.map(node => [node.id, node]));
    const rootNodes: OrgChartNode[] = [];

    // Build hierarchy
    userNodes.forEach(user => {
      if (user.managerId && nodeMap.has(user.managerId)) {
        const manager = nodeMap.get(user.managerId)!;
        manager.children.push(user);
        user.level = manager.level + 1;
      } else if (user.isHead) {
        rootNodes.push(user);
      }
    });

    departmentNodes.forEach(dept => {
      if (dept.parentId && nodeMap.has(dept.parentId)) {
        const parent = nodeMap.get(dept.parentId)!;
        parent.children.push(dept);
        dept.level = parent.level + 1;
      } else {
        rootNodes.push(dept);
      }
    });

    // Sort children
    const sortChildren = (nodes: OrgChartNode[]) => {
      nodes.forEach(node => {
        node.children.sort((a, b) => {
          if (a.type === 'department' && b.type === 'user') return -1;
          if (a.type === 'user' && b.type === 'department') return 1;

          if (a.type === 'user' && b.type === 'user') {
            if (a.isHead && !b.isHead) return -1;
            if (!a.isHead && b.isHead) return 1;
            if (a.isManager && !b.isManager) return -1;
            if (!a.isManager && b.isManager) return 1;
          }

          return a.name.localeCompare(b.name);
        });

        sortChildren(node.children);
      });
    };

    sortChildren(rootNodes);
    return rootNodes;
  };

  const handleNodeClick = (nodeId: string, nodeType: 'user' | 'department') => {
    if (nodeType === 'user' && canViewDetailedInfo) {
      onUserClick(nodeId);
    } else if (nodeType === 'department' && canViewAllDepartments) {
      navigate(`/p/department/${nodeId}`);
    }
  };

  useEffect(() => {
    if (organization && (canViewAllDepartments || canViewDepartmentList)) {
      fetchOrganizationChart();
    }
  }, [organization, canViewAllDepartments, canViewDepartmentList]);

  // Check permissions
  if (!canViewAllDepartments && !canViewDepartmentList) {
    return (
      <Card>        <CardHeader>
          <CardTitle className="flex items-center">
            <Network className="mr-2 h-5 w-5" />
            Organization Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-4xl text-gray-300 mb-4">🔒</div>
            <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              You don't have permission to view the organization chart.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>        <div className="flex items-center justify-between">
          <div>            <CardTitle className="flex items-center">
              <Network className="mr-2 h-5 w-5" />
              Organization Chart
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Visual hierarchy showing departments and manager-subordinate relationships
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-3">Legend:</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Department</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Department Head</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Manager</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span>Employee</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Lines show reporting relationships. "Reports to" shows direct manager.
          </p>
        </div>
        {isLoading ? (
          <div className="flex flex-col items-center space-y-8">
            {/* Loading skeleton for org chart */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center">
                <Skeleton className="h-24 w-48 rounded-lg mb-4" />
              </div>
            </div>
            <div className="flex justify-center gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <Skeleton className="h-20 w-40 rounded-lg mb-4" />
                </div>
              ))}
            </div>
          </div>
        ) : orgChart.length === 0 ? (          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Network className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Organization Chart Available</h3>
            <p className="text-muted-foreground">
              The organization structure and manager hierarchy are not set up yet or you don't have access to view them.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Contact your administrator to set up departments and manager relationships.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto overflow-y-auto max-h-[800px] p-4">
            <div className="min-w-full">
              <OrgChartLevel 
                nodes={orgChart} 
                onNodeClick={handleNodeClick}
                canViewDetails={canViewDetailedInfo || canViewAllDepartments}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
