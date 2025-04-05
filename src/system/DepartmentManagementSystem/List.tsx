import { APIDictionary } from '@/api/v2/APIdict'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from '@/services/AuthContext'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAtom } from 'jotai'
import { permissionListAtom } from '@/store/atom'

interface Department {
  id: string
  name: string
  code: string
  description: string
  location: string
  budget: number
  status: boolean
  headId?: string
  departmentHead?: {
    firstName: string
    lastName: string
    id?: string
  }
}

const DepartmentSkeleton = () => {
    return (
        <Card className="cursor-pointer">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <Skeleton className="h-6 w-32 mb-1" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="text-right">
                        <Skeleton className="h-4 w-16 mb-1" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-5 w-36" />
                </div>
                <div>
                    <Skeleton className="h-4 w-28 mb-1" />
                    <Skeleton className="h-5 w-40" />
                </div>
                <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-5 w-full" />
                </div>
            </CardContent>
        </Card>
    )
}

const DepartmentCard = ({ dept, onClick, isUserHead = false }: { 
  dept: Department, 
  onClick: () => void,
  isUserHead?: boolean 
}) => {
    return (
        <Card
            className={`cursor-pointer hover:bg-accent transition-colors ${!dept.status ? 'opacity-60' : ''}`}
            onClick={onClick}
        >
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {dept.name}
                            <span className={`text-xs px-2 py-1 rounded-full ${dept.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {dept?.status ? 'Active' : 'Inactive'}
                            </span>
                            {isUserHead && (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                Head
                              </span>
                            )}
                        </CardTitle>
                        <CardDescription>{dept.code}</CardDescription>
                    </div>
                    <div className="text-right">
                        <CardDescription>Budget</CardDescription>
                        <CardTitle>₹{dept.budget?.toLocaleString() || 0}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p>{dept.location}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Department Head</p>
                    <p>{dept.departmentHead?.firstName} {dept.departmentHead?.lastName}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm truncate">{dept.description}</p>
                </div>
            </CardContent>
        </Card>
    )
}

const EmptyState = ({ message = "No departments found" }) => {
    return (
        <Card className="col-span-full">
            <CardContent className="text-center py-8">
                {message}
            </CardContent>
        </Card>
    )
}

const DepartmentSection = ({ 
    title, 
    departments, 
    onDepartmentClick,
    userId
}: { 
    title: string, 
    departments: Department[], 
    onDepartmentClick: (id: string) => void,
    userId?: string
}) => {
    if (departments.length === 0) return null;

    return (
        <div className="mb-8">
            <h2 className="text-xl font-medium mb-4">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                    <DepartmentCard
                        key={dept.id}
                        dept={dept}
                        onClick={() => onDepartmentClick(dept.id)}
                        isUserHead={dept.headId === userId}
                    />
                ))}
            </div>
        </div>
    );
};

const ListOfDepartment = () => {
    const navigate = useNavigate();
    const [allDepartments, setAllDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const [permissions] = useAtom(permissionListAtom);
    
    const [headOfDepartments, setHeadOfDepartments] = useState<Department[]>([]);
    const [ownDepartment, setOwnDepartment] = useState<Department | null>(null);
    const [otherDepartments, setOtherDepartments] = useState<Department[]>([]);

    const canViewAllDepartments = permissions?.some(p => p?.key === 'view_all_department_info');
    const canViewOwnDepartment = permissions?.some(p => p?.key === 'view_own_department_info');
    
    console.log('[DeptList] Component Mounted/Updated');
    console.log('[DeptList] User:', user);
    console.log('[DeptList] Permissions:', permissions);
    console.log('[DeptList] Can view all departments:', canViewAllDepartments);
    console.log('[DeptList] Can view own department:', canViewOwnDepartment);

    const fetchList = async () => {
        try {
            console.log('[DeptList] Fetching departments for org:', user?.orgId);
            setLoading(true);
            const response = await axios.get(`${APIDictionary.department}/org/${user?.orgId}`, { withCredentials: true });
            console.log('[DeptList] API Response:', response.data);
            setAllDepartments(response.data);
            
            processUserDepartments(response.data);
        } catch (error) {
            console.error('[DeptList] Error fetching departments:', error);
        } finally {
            setLoading(false);
        }
    };

    const processUserDepartments = (departments: Department[]) => {
        if (!user?.id) {
            console.log('[DeptList] No user ID available, skipping processing');
            return;
        }

        console.log('[DeptList] Processing departments for user:', user.id);
        
        const userHeadedDepts = departments.filter(dept => dept.headId === user.id);
        console.log('[DeptList] User headed departments:', userHeadedDepts);
        setHeadOfDepartments(userHeadedDepts);

        const userDept = departments.find(dept => dept.id === user.departmentId);
        console.log('[DeptList] User\'s own department:', userDept);
        setOwnDepartment(userDept || null);

        if (canViewAllDepartments) {
            const otherDepts = departments.filter(dept => 
                dept.headId !== user.id && dept.id !== user.departmentId
            );
            console.log('[DeptList] Other departments:', otherDepts);
            setOtherDepartments(otherDepts);
        } else {
            console.log('[DeptList] User cannot view other departments');
            setOtherDepartments([]);
        }

        if (userHeadedDepts.length === 1 && !userDept) {
            console.log('[DeptList] Auto-navigating to headed department');
            navigate(`/p/department/${userHeadedDepts[0].id}`);
        }
    };

    useEffect(() => {
        console.log('[DeptList] useEffect triggered, orgId:', user?.orgId);
        if (user?.orgId) {
            fetchList();
        }
    }, [user, permissions]);

    const handleDepartmentClick = (id: string) => {
        console.log('[DeptList] Department clicked:', id);
        navigate(`/p/department/${id}`);
    };

    console.log('[DeptList] Render state - loading:', loading);
    console.log('[DeptList] Render state - headOfDepartments:', headOfDepartments);
    console.log('[DeptList] Render state - ownDepartment:', ownDepartment);
    console.log('[DeptList] Render state - otherDepartments:', otherDepartments);

    if (loading) {
        return (
            <div className="p-4 w-full h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, index) => (
                        <DepartmentSkeleton key={index} />
                    ))}
                </div>
            </div>
        );
    }

    if (!loading && 
        headOfDepartments.length === 0 && 
        (!canViewOwnDepartment || !ownDepartment) && 
        (!canViewAllDepartments || otherDepartments.length === 0)) {
        console.log('[DeptList] No departments to show - showing empty state');
        return (
            <div className="p-4 w-full h-full">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Departments</h1>
                </div>
                <EmptyState message="You don't have access to view any departments." />
            </div>
        );
    }

    return (
        <div className="p-4 w-full h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Departments</h1>
                <Button onClick={() => navigate("/p/department/create")}>
                    Create Department
                </Button>
            </div>
            
            {headOfDepartments.length > 0 && (
                <DepartmentSection
                    title="Departments You Lead"
                    departments={headOfDepartments}
                    onDepartmentClick={handleDepartmentClick}
                    userId={user?.id}
                />
            )}
            
            {canViewOwnDepartment && ownDepartment && ownDepartment.headId !== user?.id && (
                <DepartmentSection
                    title="Your Department"
                    departments={[ownDepartment]}
                    onDepartmentClick={handleDepartmentClick}
                    userId={user?.id}
                />
            )}
            
            {canViewAllDepartments && otherDepartments.length > 0 && (
                <DepartmentSection
                    title="Other Departments"
                    departments={otherDepartments}
                    onDepartmentClick={handleDepartmentClick}
                    userId={user?.id}
                />
            )}
            
            {!loading && headOfDepartments.length === 0 && !ownDepartment && otherDepartments.length === 0 && (
                <EmptyState message="No departments found in your organization." />
            )}
        </div>
    );
};

export default ListOfDepartment