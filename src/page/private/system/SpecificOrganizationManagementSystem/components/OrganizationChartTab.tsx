import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Network, User, Users, Maximize2 } from 'lucide-react';
import axios from 'axios';
import { APIDictionary } from '@/api/v2/APIdict';
import { toast } from '@/hooks/use-toast';
import { 
  ReactFlow, 
  Node, 
  Edge, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  Position,
  MarkerType,
  Handle,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAuth } from '@/services/AuthContext';

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  position?: string;
  role?: string;
  departmentName?: string;
  managerId?: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  subordinates?: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
  isHead?: boolean;
  isManager?: boolean;
}

interface CustomNodeData {
  user: UserData;
  onUserClick: (userId: string) => void;
  canViewDetails: boolean;
  isCurrentUser?: boolean;
  subordinateCount: number;
}

// Custom Node Component for User
const UserNode = ({ data }: { data: CustomNodeData }) => {
  const { user, onUserClick, canViewDetails, isCurrentUser, subordinateCount } = data;
  
  const getNodeColor = () => {
    if (isCurrentUser) return 'bg-purple-50 border-purple-400 shadow-purple-200';
    if (user.isHead) return 'bg-red-50 border-red-300 shadow-red-200';
    if (user.isManager) return 'bg-green-50 border-green-300 shadow-green-200';
    return 'bg-blue-50 border-blue-300 shadow-blue-200';
  };

  const getBadgeColor = () => {
    if (user.isHead) return 'bg-red-500 text-white';
    if (user.isManager) return 'bg-green-500 text-white';
    return 'bg-blue-500 text-white';
  };

  const getTextColor = () => {
    if (isCurrentUser) return 'text-purple-800';
    if (user.isHead) return 'text-red-800';
    if (user.isManager) return 'text-green-800';
    return 'text-blue-800';
  };

  const handleClick = () => {
    if (canViewDetails) {
      onUserClick(user.id);
    }
  };

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div
        className={`
          relative bg-white rounded-xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 
          cursor-pointer min-w-[200px] max-w-[220px] p-4 transform hover:scale-105
          ${getNodeColor()}
        `}
        onClick={handleClick}
      >
        <div className="flex flex-col items-center text-center">
          {/* Current User Indicator */}
          {isCurrentUser && (
            <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
              You
            </div>
          )}

          {/* Avatar */}
          <Avatar className="h-12 w-12 mb-3">
            <AvatarFallback className={`text-sm font-medium ${getTextColor()}`}>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>

          {/* Name */}
          <h3 className={`font-semibold text-sm mb-1 ${getTextColor()} leading-tight`}>
            {user.firstName} {user.lastName}
          </h3>

          {/* Position */}
          <div className="text-xs text-gray-600 mb-2 text-center">
            <div>{user.position || user.role || 'Employee'}</div>
            {user.departmentName && (
              <div className="text-xs text-gray-500 mt-1">
                {user.departmentName}
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1 justify-center mb-2">
            {user.isHead && (
              <Badge className={`text-xs px-2 py-0 ${getBadgeColor()}`}>
                Head
              </Badge>
            )}
            {user.isManager && !user.isHead && (
              <Badge className={`text-xs px-2 py-0 ${getBadgeColor()}`}>
                Manager
              </Badge>
            )}
            {!user.isHead && !user.isManager && (
              <Badge className={`text-xs px-2 py-0 ${getBadgeColor()}`}>
                Employee
              </Badge>
            )}
          </div>

          {/* Employee ID and subordinate count */}
          <div className="text-xs text-gray-500 space-y-1">
            {user.employeeId && (
              <div>ID: {user.employeeId}</div>
            )}
            {subordinateCount > 0 && (
              <div className="font-medium text-green-600 flex items-center justify-center gap-1">
                <Users className="h-3 w-3" />
                {subordinateCount} {subordinateCount === 1 ? 'report' : 'reports'}
              </div>
            )}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

const nodeTypes = {
  userNode: UserNode,
};

interface OrganizationChartTabProps {
  organization: any;
  canViewDetailedInfo: boolean;
  canViewAllDepartments: boolean;
  canViewDepartmentList: boolean;
  onUserClick: (userId: string) => void;
}

interface OrganizationChartFlowProps extends OrganizationChartTabProps {
  onAdminStatusChange?: (isAdmin: boolean) => void;
}

const OrganizationChartFlow = ({ 
  organization, 
  canViewDetailedInfo,
  onUserClick,
  onAdminStatusChange 
}: OrganizationChartFlowProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const { setViewport } = useReactFlow();
  const { user: currentUser } = useAuth();

  const fetchOrganizationData = async () => {
    if (!organization?.id) return;
    
    setIsLoading(true);
    try {
      // Use the manager-subordinate focused API with current user as center
      const response = await axios.get(
        APIDictionary.OrganizationManagerChart(organization.id, currentUser?.id),
        { withCredentials: true }
      );

      let userData: UserData[] = [];
      
      if (response.data && response.data.chart) {
        // Extract users from the manager-subordinate chart structure
        userData = extractUsersFromManagerChart(response.data.chart);
        // Set organization admin status
        const adminStatus = response.data.isOrgAdmin || false;
        setIsOrgAdmin(adminStatus);
        onAdminStatusChange?.(adminStatus);
      } else {
        // Fallback: try the regular chart endpoint
        const fallbackResponse = await axios.get(
          APIDictionary.OrganizationChart(organization.id),
          { withCredentials: true }
        );
        
        if (fallbackResponse.data && fallbackResponse.data.chart) {
          userData = extractUsersFromChart(fallbackResponse.data.chart);
        } else {
          // Final fallback: fetch users directly from organization API
          const orgResponse = await axios.get(
            `${APIDictionary.Organization}/${organization.id}`,
            { withCredentials: true }
          );
          userData = orgResponse.data?.users || [];
        }
        setIsOrgAdmin(false); // Default to false for fallback
      }

      console.log('Fetched user data:', userData);
      console.log('Is Organization Admin:', isOrgAdmin);
      setUsers(userData);
      
    } catch (error) {
      console.error('Failed to fetch organization data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organization chart',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractUsersFromChart = (chartData: any[]): UserData[] => {
    const users: UserData[] = [];
    
    const extractFromNode = (node: any) => {
      if (node.type === 'user') {
        users.push({
          id: node.id,
          firstName: node.firstName,
          lastName: node.lastName,
          email: node.email,
          employeeId: node.employeeId,
          position: node.position,
          role: node.role,
          departmentName: node.departmentName,
          managerId: node.managerId,
          manager: node.manager,
          subordinates: node.subordinates || [],
          isHead: node.isHead,
          isManager: node.isManager || (node.subordinates && node.subordinates.length > 0)
        });
      }
      
      if (node.children) {
        node.children.forEach(extractFromNode);
      }
    };

    chartData.forEach(extractFromNode);
    return users;
  };

  const extractUsersFromManagerChart = (chartData: any[]): UserData[] => {
    const users: UserData[] = [];
    
    const extractFromManagerNode = (node: any) => {
      if (node.type === 'user') {
        users.push({
          id: node.id,
          firstName: node.firstName,
          lastName: node.lastName,
          email: node.email,
          employeeId: node.employeeId,
          position: node.position,
          role: node.role,
          departmentName: node.departmentName || (node.department ? node.department.name : undefined),
          managerId: node.managerId,
          manager: node.manager,
          subordinates: node.subordinates || [],
          isHead: node.isHead,
          isManager: node.isManager || (node.subordinates && node.subordinates.length > 0)
        });
      }
      
      if (node.children && node.children.length > 0) {
        node.children.forEach(extractFromManagerNode);
      }
    };

    chartData.forEach(extractFromManagerNode);
    return users;
  };

  const { flowNodes, flowEdges } = useMemo(() => {
    if (users.length === 0) return { flowNodes: [], flowEdges: [] };

    // Create a map for quick lookup
    const userMap = new Map(users.map(user => [user.id, user]));
    
    // Find the current user's position in hierarchy
    const currentUserId = currentUser?.id;
    let startUserId = currentUserId;
    
    // Ensure we start from the current user if available
    const currentUserData = userMap.get(currentUserId || '');
    if (!currentUserData) {
      // If current user is not found, start from a top-level user (CEO or someone without a manager)
      const topLevelUser = users.find(user => !user.managerId && (user.subordinates?.length || 0) > 0);
      if (topLevelUser) {
        startUserId = topLevelUser.id;
      } else {
        // If no clear hierarchy, just start with the first user
        startUserId = users[0]?.id;
      }
    }

    // Build hierarchy with better positioning
    const processedUsers = new Set<string>();
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Layout configuration - more spread out for better visibility
    const LEVEL_HEIGHT = 220;
    const NODE_WIDTH = 240;
    const HORIZONTAL_SPACING = 80;

    const buildManagerSubordinateHierarchy = (
      userId: string, 
      level: number = 0, 
      parentX: number = 0, 
      siblingIndex: number = 0, 
      totalSiblings: number = 1
    ) => {
      if (processedUsers.has(userId)) return;
      processedUsers.add(userId);

      const user = userMap.get(userId);
      if (!user) return;

      // Calculate position - center the current user at level 0
      const baseX = totalSiblings === 1 ? parentX : 
                   parentX + (siblingIndex - (totalSiblings - 1) / 2) * (NODE_WIDTH + HORIZONTAL_SPACING);
      const x = baseX;
      const y = level * LEVEL_HEIGHT;

      // Count subordinates
      const subordinateCount = user.subordinates?.length || 0;

      // Create node
      nodes.push({
        id: userId,
        type: 'userNode',
        position: { x, y },
        data: {
          user,
          onUserClick,
          canViewDetails: canViewDetailedInfo,
          isCurrentUser: userId === currentUserId,
          subordinateCount
        }
      });

      // Process subordinates (below current user)
      if (user.subordinates && user.subordinates.length > 0) {
        user.subordinates.forEach((subordinate, index) => {
          const subordinateId = typeof subordinate === 'string' ? subordinate : subordinate.id;
          
          // Create edge from manager to subordinate
          edges.push({
            id: `${userId}-${subordinateId}`,
            source: userId,
            target: subordinateId,
            type: 'smoothstep',
            animated: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#64748b'
            },
            style: {
              stroke: '#64748b',
              strokeWidth: 2,
            }
          });

          // Process subordinate
          buildManagerSubordinateHierarchy(
            subordinateId, 
            level + 1, 
            x, 
            index, 
            user.subordinates!.length
          );
        });
      }

      // Process manager (above current user) - only for the starting user
      if (level === 0 && user.managerId && !processedUsers.has(user.managerId)) {
        const manager = userMap.get(user.managerId);
        if (manager) {
          // Place manager above current user
          const managerY = -LEVEL_HEIGHT;
          nodes.push({
            id: user.managerId,
            type: 'userNode',
            position: { x: x, y: managerY },
            data: {
              user: manager,
              onUserClick,
              canViewDetails: canViewDetailedInfo,
              isCurrentUser: user.managerId === currentUserId,
              subordinateCount: manager.subordinates?.length || 0
            }
          });

          // Create edge from manager to current user
          edges.push({
            id: `${user.managerId}-${userId}`,
            source: user.managerId,
            target: userId,
            type: 'smoothstep',
            animated: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#64748b'
            },
            style: {
              stroke: '#64748b',
              strokeWidth: 2,
            }
          });

          processedUsers.add(user.managerId);

          // Process manager's other subordinates (siblings of current user)
          if (manager.subordinates) {
            manager.subordinates.forEach((sibling, index) => {
              const siblingId = typeof sibling === 'string' ? sibling : sibling.id;
              if (siblingId !== userId && !processedUsers.has(siblingId)) {
                // Position siblings to the left and right of current user
                const siblingOffset = (index + 1) * (NODE_WIDTH + HORIZONTAL_SPACING);
                const siblingX = x + (index % 2 === 0 ? siblingOffset : -siblingOffset);
                buildManagerSubordinateHierarchy(siblingId, 0, siblingX, 0, 1);
              }
            });
          }

          // Also try to show manager's manager (grandparent)
          if (manager.managerId && !processedUsers.has(manager.managerId)) {
            const grandManager = userMap.get(manager.managerId);
            if (grandManager) {
              const grandManagerY = -2 * LEVEL_HEIGHT;
              nodes.push({
                id: manager.managerId,
                type: 'userNode',
                position: { x: x, y: grandManagerY },
                data: {
                  user: grandManager,
                  onUserClick,
                  canViewDetails: canViewDetailedInfo,
                  isCurrentUser: manager.managerId === currentUserId,
                  subordinateCount: grandManager.subordinates?.length || 0
                }
              });

              // Create edge from grandmanager to manager
              edges.push({
                id: `${manager.managerId}-${user.managerId}`,
                source: manager.managerId,
                target: user.managerId,
                type: 'smoothstep',
                animated: false,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 20,
                  height: 20,
                  color: '#64748b'
                },
                style: {
                  stroke: '#64748b',
                  strokeWidth: 2,
                }
              });

              processedUsers.add(manager.managerId);
            }
          }
        }
      }
    };

    buildManagerSubordinateHierarchy(startUserId || users[0]?.id || '');

    // If we haven't processed all users, add them as separate roots
    const unprocessedUsers = users.filter(user => !processedUsers.has(user.id));
    unprocessedUsers.forEach((user, index) => {
      if (!user.managerId) { // Only add users without managers as separate roots
        const rootX = (index + 1) * (NODE_WIDTH + HORIZONTAL_SPACING) * 2;
        buildManagerSubordinateHierarchy(user.id, 0, rootX, 0, 1);
      }
    });

    return { flowNodes: nodes, flowEdges: edges };
  }, [users, currentUser?.id, canViewDetailedInfo, onUserClick]);

  const centerOnCurrentUser = useCallback(() => {
    if (!currentUser?.id) return;
    
    const currentUserNode = flowNodes.find(node => node.id === currentUser.id);
    if (currentUserNode) {
      const centerX = window.innerWidth / 2 - 120; // Account for node width
      const centerY = window.innerHeight / 2 - 100; // Account for node height
      
      setViewport({ 
        x: -currentUserNode.position.x + centerX, 
        y: -currentUserNode.position.y + centerY, 
        zoom: 1 
      });
    }
  }, [flowNodes, currentUser?.id, setViewport]);

  const fitView = useCallback(() => {
    if (flowNodes.length === 0) return;
    
    const padding = 50;
    const minX = Math.min(...flowNodes.map(n => n.position.x)) - padding;
    const maxX = Math.max(...flowNodes.map(n => n.position.x + 240)) + padding; // Node width = 240
    const minY = Math.min(...flowNodes.map(n => n.position.y)) - padding;
    const maxY = Math.max(...flowNodes.map(n => n.position.y + 180)) + padding; // Node height ≈ 180
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    const availableWidth = window.innerWidth * 0.85;
    const availableHeight = window.innerHeight * 0.65;
    
    const zoom = Math.min(
      availableWidth / width,
      availableHeight / height,
      1.2 // Max zoom level
    );
    
    setViewport({ 
      x: -minX * zoom + (window.innerWidth - width * zoom) / 2, 
      y: -minY * zoom + (window.innerHeight * 0.15), 
      zoom 
    });
  }, [flowNodes, setViewport]);

  useEffect(() => {
    fetchOrganizationData();
  }, [organization, currentUser?.id]);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  // Center on current user when data loads
  useEffect(() => {
    if (flowNodes.length > 0 && currentUser?.id) {
      const timer = setTimeout(() => {
        centerOnCurrentUser();
      }, 200); // Slightly longer delay for better rendering
      
      return () => clearTimeout(timer);
    }
  }, [flowNodes, centerOnCurrentUser, currentUser?.id]);

  if (isLoading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-4 w-48" />
          <div className="flex space-x-4">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
          </div>
          <div className="text-sm text-muted-foreground">
            Loading manager-subordinate hierarchy...
          </div>
        </div>
      </div>
    );
  }

  if (flowNodes.length === 0) {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center text-center">
        <Network className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Organization Chart Available</h3>
        <p className="text-muted-foreground">
          No manager-subordinate relationships found or you don't have access to view them.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full relative">
      {/* Control Buttons */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={centerOnCurrentUser}
          className="bg-white/90 backdrop-blur-sm hover:bg-white"
          disabled={!currentUser?.id}
        >
          <User className="h-4 w-4 mr-1" />
          Find Me
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={fitView}
          className="bg-white/90 backdrop-blur-sm hover:bg-white"
        >
          <Maximize2 className="h-4 w-4 mr-1" />
          Fit View
        </Button>
      </div>

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView={false}
        attributionPosition="bottom-left"
        className="bg-gray-50"
        minZoom={0.3}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background color="#aaa" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export const OrganizationChartTab = (props: OrganizationChartTabProps) => {
  const { canViewAllDepartments, canViewDepartmentList } = props;
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);

  // Check permissions
  if (!canViewAllDepartments && !canViewDepartmentList) {
    return (
      <Card>
        <CardHeader>
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

  const getChartDescription = () => {
    if (isOrgAdmin) {
      return "Complete organization hierarchy - you have full access as an organization admin";
    }
    return "Your reporting hierarchy - showing your subordinates, manager, and colleagues";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Network className="mr-2 h-5 w-5" />
              Manager-Subordinate Hierarchy
              {isOrgAdmin && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Admin View
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {getChartDescription()}
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
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span>You</span>
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
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Employee</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {isOrgAdmin 
              ? "Full organization view. Arrows show reporting direction."
              : "Limited view based on your position. Arrows show reporting direction. Use \"Find Me\" to center on your position."
            }
          </p>
        </div>

        <ReactFlowProvider>
          <OrganizationChartFlow {...props} onAdminStatusChange={setIsOrgAdmin} />
        </ReactFlowProvider>
      </CardContent>
    </Card>
  );
};
