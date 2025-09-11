import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from '@/services/AuthContext'
import { useEffect, useState } from 'react'
import { useDepartmentsQuery } from '@/hooks/queries/useDepartments'
import {  useNavigate } from 'react-router-dom'
import { useAtom } from 'jotai'
import { permissionListAtom } from '@/store/atom'
import CheckPermission from '@/services/PermissionCheck'
import { Input } from '@/components/ui/input'
import { 
    Search, 
    Building, 
    Users, 
    User, 
    PlusCircle, 
    Filter, 
    SortAsc, 
    SortDesc, 
    Building2 
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import RouteDict from '@/routes/RouteDict'

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
    users?: { id: string }[]
}

const DepartmentSkeleton = () => {
    return (
        <Card className="cursor-pointer shadow-sm hover:shadow-md transition-shadow">
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
                <div className="flex items-center gap-2 mt-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </CardContent>
        </Card>
    )
}

interface DepartmentCardProps {
    dept: Department
    onClick: () => void
    isUserHead?: boolean
}

const DepartmentCard = ({ dept, onClick, isUserHead = false }: DepartmentCardProps) => {
    const userCount = dept.users?.length || 0;
    
    return (
        <Card
            className={`cursor-pointer hover:bg-accent transition-all border-l-4 ${
                dept.status 
                    ? isUserHead 
                        ? 'border-l-blue-500' 
                        : 'border-l-green-500' 
                    : 'border-l-gray-300 opacity-70'
            }`}
            onClick={onClick}
        >
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            {dept.name}
                            {isUserHead && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge variant="outline" className="bg-blue-50">Head</Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>You are the department head</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                            <code className="text-xs font-mono">{dept.code}</code>
                        </CardDescription>
                    </div>
                    <Badge variant={dept?.status ? "default" : "outline"} className={dept.status ? "bg-green-100 hover:bg-green-200 text-green-800 border-none" : "text-gray-500"}>
                        {dept?.status ? 'Active' : 'Inactive'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pb-2 space-y-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{dept.location || 'No location specified'}</span>
                </div>
                {dept.departmentHead ? (
                    <div className="flex items-center gap-1 text-sm">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{dept.departmentHead?.firstName} {dept.departmentHead?.lastName}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span>No department head</span>
                    </div>
                )}
                <p className="text-sm line-clamp-2 text-muted-foreground">{dept.description || 'No description'}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{userCount} member{userCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="text-sm font-semibold">
                    ₹{dept.budget?.toLocaleString() || 0}
                </div>
            </CardFooter>
        </Card>
    )
}

const EmptyState = ({ message = "No departments found", canCreate = false, onCreateClick }: {
    message: string,
    canCreate?: boolean,
    onCreateClick?: () => void
}) => {
    return (
        <Card className="col-span-full py-8">
            <CardContent className="flex flex-col items-center justify-center">
                <Building className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground mb-4">{message}</p>
                {canCreate && onCreateClick && (
                    <Button variant="outline" onClick={onCreateClick}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create Department
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

const ListOfDepartment = () => {
    const navigate = useNavigate()
    const { toast } = useToast()
    const [allDepartments, setAllDepartments] = useState<Department[]>([])
    const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([])
    const { user } = useAuth()
    const [permissions] = useAtom(permissionListAtom)
    
    const [headOfDepartments, setHeadOfDepartments] = useState<Department[]>([])
    const [ownDepartment, setOwnDepartment] = useState<Department | null>(null)
    const [otherDepartments, setOtherDepartments] = useState<Department[]>([])
    const [activeTab, setActiveTab] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [sortField, setSortField] = useState<string>('name')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    console.log(permissions)
    const canViewAllDepartments = CheckPermission("view_list_of_department", permissions)
    const canViewOwnDepartment = CheckPermission('view_own_department_info', permissions)
    const canCreateDepartment = CheckPermission('create_new_department', permissions)
    
    // React Query fetch
    const { data: deptData, isLoading, isError } = useDepartmentsQuery(user?.orgId, !!user?.orgId)

    const processUserDepartments = (departments: Department[]) => {
        if (!user?.id) return

        const userHeadedDepts = departments.filter(dept => dept.headId === user.id)
        setHeadOfDepartments(userHeadedDepts)

        const userDept = departments.find(dept => dept.id === user.departmentId)
        setOwnDepartment(userDept || null)

        // Auto-navigate if user can only view their own department
        if (!canViewAllDepartments && canViewOwnDepartment && userDept && userHeadedDepts.length === 0) {
            navigate(RouteDict.Department.Details(userDept.id))
            return
        }

        if (canViewAllDepartments) {
            const otherDepts = departments.filter(dept => 
                dept.headId !== user.id && dept.id !== user.departmentId
            )
            setOtherDepartments(otherDepts)
        } else {
            setOtherDepartments([])
        }

        setFilteredDepartments(departments)
    }

    useEffect(() => {
        if (deptData) {
            setAllDepartments(deptData)
            processUserDepartments(deptData)
        }
    }, [deptData])
    useEffect(() => {
        if (isError) {
            toast({
                title: 'Error',
                description: 'Failed to load departments. Please try again.',
                variant: 'destructive'
            })
        }
    }, [isError, toast])

    useEffect(() => {
        let filtered = [...allDepartments]

        // Apply tab filter
        if (activeTab === 'leading') {
            filtered = headOfDepartments
        } else if (activeTab === 'my-dept') {
            filtered = ownDepartment ? [ownDepartment] : []
        } else if (activeTab === 'others') {
            filtered = otherDepartments
        }

        // Apply search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(dept => 
                dept.name.toLowerCase().includes(query) ||
                dept.code?.toLowerCase().includes(query) ||
                dept.description?.toLowerCase().includes(query) ||
                dept.location?.toLowerCase().includes(query) ||
                `${dept.departmentHead?.firstName} ${dept.departmentHead?.lastName}`.toLowerCase().includes(query)
            )
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(dept => 
                (statusFilter === 'active' && dept.status) || 
                (statusFilter === 'inactive' && !dept.status)
            )
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let comparison = 0
            
            switch (sortField) {
                case 'name':
                    comparison = a.name.localeCompare(b.name)
                    break
                case 'location':
                    comparison = (a.location || '').localeCompare(b.location || '')
                    break
                case 'budget':
                    comparison = (a.budget || 0) - (b.budget || 0)
                    break
                case 'members':
                    comparison = (a.users?.length || 0) - (b.users?.length || 0)
                    break
            }
            
            return sortDirection === 'asc' ? comparison : -comparison
        })
        
        setFilteredDepartments(filtered)
    }, [
        allDepartments, 
        activeTab, 
        searchQuery, 
        sortField, 
        sortDirection, 
        statusFilter, 
        headOfDepartments, 
        ownDepartment, 
        otherDepartments
    ])

    const handleDepartmentClick = (id: string) => {
        navigate(RouteDict.Department.Details(id))
    }

    const toggleSortDirection = () => {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    }

    if (isLoading) {
        return (
            <div className="p-4 w-full h-full">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Departments</h1>
                    <Skeleton className="h-9 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, index) => (
                        <DepartmentSkeleton key={index} />
                    ))}
                </div>
            </div>
        )
    }

    // Check if user has no access to any departments
    if (!isLoading && 
        headOfDepartments.length === 0 && 
        (!canViewOwnDepartment || !ownDepartment) && 
        (!canViewAllDepartments || otherDepartments.length === 0)) {
        return (
            <div className="p-4 w-full h-full">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Departments</h1>
                    {canCreateDepartment && (
                        <Button onClick={() => navigate(RouteDict.Department.Create)}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Create Department
                        </Button>
                    )}
                </div>
                <EmptyState 
                    message="You don't have access to view any departments." 
                    canCreate={canCreateDepartment}
                    onCreateClick={() => navigate(RouteDict.Department.Create)}
                />
            </div>
        )
    }

    // Generate tabs based on what the user has access to
    const availableTabs = [
        { id: 'all', label: 'All', count: allDepartments.length, 
          show: canViewAllDepartments || headOfDepartments.length > 0 || !!ownDepartment },
    ]
    
    if (headOfDepartments.length > 0) {
        availableTabs.push({ 
            id: 'leading', 
            label: 'Leading', 
            count: headOfDepartments.length, 
            show: true 
        })
    }
    
    if (ownDepartment && ownDepartment.headId !== user?.id) {
        availableTabs.push({ 
            id: 'my-dept', 
            label: 'My Department', 
            count: 1, 
            show: !!canViewOwnDepartment 
        })
    }
    
    if (otherDepartments.length > 0) {
        availableTabs.push({ 
            id: 'others', 
            label: 'Others', 
            count: otherDepartments.length, 
            show: !!canViewAllDepartments 
        })
    }

    // Filter out tabs that shouldn't be shown
    const displayTabs = availableTabs.filter(tab => tab.show)

    return (
        <div className="p-4 w-full h-full overflow-y-auto">
            <div className="flex flex-col space-y-4">
                {/* Header with search and action buttons */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h1 className="text-2xl font-bold">Departments</h1>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search departments..."
                                className="pl-9 w-full md:w-[250px]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        {/* Filter dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Status</DropdownMenuLabel>
                                <DropdownMenuItem 
                                    className={statusFilter === 'all' ? 'bg-accent' : ''}
                                    onClick={() => setStatusFilter('all')}
                                >
                                    All
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    className={statusFilter === 'active' ? 'bg-accent' : ''}
                                    onClick={() => setStatusFilter('active')}
                                >
                                    Active Only
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    className={statusFilter === 'inactive' ? 'bg-accent' : ''}
                                    onClick={() => setStatusFilter('inactive')}
                                >
                                    Inactive Only
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                                <DropdownMenuItem 
                                    className={sortField === 'name' ? 'bg-accent' : ''}
                                    onClick={() => setSortField('name')}
                                >
                                    Department Name
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    className={sortField === 'location' ? 'bg-accent' : ''}
                                    onClick={() => setSortField('location')}
                                >
                                    Location
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    className={sortField === 'budget' ? 'bg-accent' : ''}
                                    onClick={() => setSortField('budget')}
                                >
                                    Budget
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    className={sortField === 'members' ? 'bg-accent' : ''}
                                    onClick={() => setSortField('members')}
                                >
                                    Team Size
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        
                        {/* Sort direction toggle */}
                        <Button variant="outline" size="icon" onClick={toggleSortDirection}>
                            {sortDirection === 'asc' ? 
                                <SortAsc className="h-4 w-4" /> : 
                                <SortDesc className="h-4 w-4" />
                            }
                        </Button>
                        
                        {/* Create department button */}
                        {canCreateDepartment && (
                            <Button onClick={() => navigate(RouteDict.Department.Create)}>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Create
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tabs for different department categories */}
                {displayTabs.length > 1 && (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="mb-4">
                            {displayTabs.map((tab) => (
                                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                                    {tab.label}
                                    <Badge variant="secondary" className="ml-1 font-normal">
                                        {tab.count}
                                    </Badge>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                )}

                {/* Results count and department grid */}
                {filteredDepartments.length === 0 ? (
                    <EmptyState 
                        message={searchQuery ? "No departments match your search" : "No departments found"} 
                        canCreate={canCreateDepartment}
                        onCreateClick={() => navigate(RouteDict.Department.Create)}
                    />
                ) : (
                    <>
                        <div className="text-sm text-muted-foreground mb-2">
                            Showing {filteredDepartments.length} department{filteredDepartments.length !== 1 ? 's' : ''}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredDepartments.map((dept) => (
                                <DepartmentCard
                                    key={dept.id}
                                    dept={dept}
                                    onClick={() => handleDepartmentClick(dept.id)}
                                    isUserHead={dept.headId === user?.id}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default ListOfDepartment