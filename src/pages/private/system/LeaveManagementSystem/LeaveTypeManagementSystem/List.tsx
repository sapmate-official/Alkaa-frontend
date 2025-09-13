import { APIDictionary } from "@/services/api/v2/APIdict";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthContext";
import axios from "axios";
import { Edit2, Plus, Trash2, Clock, CheckCircle, XCircle, Calendar, Shield, RefreshCw, Search, Filter, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import RouteDict from "@/routes/RouteDict";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface LeaveType {
    id: string;
    orgId: string;
    name: string;
    description: string;
    annualLimit: number;
    requiresApproval: boolean;
    isPaid: boolean;
    carryForward: boolean;
    maxCarryForward: number;
    createdAt: string;
    updatedAt: string;
}

export default function LeaveTypeList() {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPaid, setFilterPaid] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchLeaveTypes = async () => {
        try {
            setLoading(true);
            if (!user?.orgId) return;
            const response = await axios.get(
                APIDictionary.get_all_org_leave_type(user?.orgId),
                { withCredentials: true }
            );
            console.log("Leave types:", response?.data);
            setLeaveTypes(response?.data || []);
        } catch (error) {
            console.error("Error fetching leave types:", error);
            setLeaveTypes([]);
            toast({
                title: "Error",
                description: "Failed to fetch leave types",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setIsDeleting(true);
            
            const response = await axios.delete(
                APIDictionary.leave_type(id),
                { withCredentials: true }
            );
            
            if (response.status === 200) {
                toast({
                    title: "Success",
                    description: "Leave type deleted successfully"
                });
                fetchLeaveTypes();
            }
        } catch (error: any) {
            console.error("Error deleting leave type:", error);
            
            toast({
                title: "Cannot Delete Leave Type",
                description: error.response?.data?.error || 
                    "This leave type is in use. Please ensure no employees have this leave type allocated before deleting.",
                variant: "destructive"
            });
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        fetchLeaveTypes();
    }, [user]);

    const handleEdit = (id: string) => {
        navigate(RouteDict.Leave.Types.Edit(id));
    };

    // Filter leave types based on search and paid status
    const filteredLeaveTypes = leaveTypes.filter(leaveType => {
        const matchesSearch = searchTerm === '' || 
            leaveType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            leaveType.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesPaidFilter = filterPaid === 'ALL' || 
            (filterPaid === 'PAID' && leaveType.isPaid) ||
            (filterPaid === 'UNPAID' && !leaveType.isPaid);
        
        return matchesSearch && matchesPaidFilter;
    });

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    if (loading) {
        return (
            <div className="p-6 w-full h-full overflow-y-auto bg-background">
                {/* Header Skeleton */}
                <div className="bg-card border-b border-border px-6 py-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <div>
                                <Skeleton className="h-8 w-48 mb-2" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>

                {/* Content Skeleton */}
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array(6).fill(0).map((_, i) => (
                            <Card key={i} className="p-6">
                                <Skeleton className="h-6 w-3/4 mb-4" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-2/3 mb-4" />
                                <div className="flex gap-2 mb-4">
                                    <Skeleton className="h-6 w-16" />
                                    <Skeleton className="h-6 w-20" />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Skeleton className="h-8 w-8" />
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-background overflow-hidden">
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border-b border-border px-6 py-4"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary rounded-lg">
                            <CalendarDays className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Leave Types Management
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Manage and configure leave types for your organization
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Button
                            onClick={fetchLeaveTypes}
                            variant="outline"
                            size="sm"
                            disabled={loading}
                            className="flex items-center space-x-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </Button>
                        <Button 
                            onClick={() => navigate(RouteDict.Leave.Types.Create)}
                            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            <Plus className="h-4 w-4" />
                            Create Leave Type
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Content */}
            <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto">
                {/* Search and Filter */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-4 mb-6"
                >
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search leave types by name or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-card border-border"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <div className="flex space-x-1">
                                {(['ALL', 'PAID', 'UNPAID'] as const).map((filter) => (
                                    <Button
                                        key={filter}
                                        variant={filterPaid === filter ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setFilterPaid(filter)}
                                        className="text-xs"
                                    >
                                        {filter}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-4 bg-card backdrop-blur border-border">
                            <div className="flex items-center space-x-2">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Types</p>
                                    <p className="text-xl font-bold text-foreground">{leaveTypes.length}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 bg-card backdrop-blur border-border">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-5 w-5 text-accent" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Paid Leave</p>
                                    <p className="text-xl font-bold text-foreground">
                                        {leaveTypes.filter(lt => lt.isPaid).length}
                                    </p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 bg-card backdrop-blur border-border">
                            <div className="flex items-center space-x-2">
                                <Shield className="h-5 w-5 text-chart-2" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Require Approval</p>
                                    <p className="text-xl font-bold text-foreground">
                                        {leaveTypes.filter(lt => lt.requiresApproval).length}
                                    </p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 bg-card backdrop-blur border-border">
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-5 w-5 text-chart-3" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Carry Forward</p>
                                    <p className="text-xl font-bold text-foreground">
                                        {leaveTypes.filter(lt => lt.carryForward).length}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </motion.div>

                {/* Leave Types Grid */}
                <AnimatePresence>
                    {filteredLeaveTypes.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                        >
                            <div className="p-6 bg-muted rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-4">
                                <CalendarDays className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-medium text-foreground mb-2">
                                {searchTerm || filterPaid !== 'ALL' ? 'No matching leave types' : 'No leave types found'}
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                {searchTerm || filterPaid !== 'ALL' 
                                    ? 'Try adjusting your search or filter criteria' 
                                    : 'Get started by creating your first leave type'}
                            </p>
                            {(!searchTerm && filterPaid === 'ALL') && (
                                <Button 
                                    onClick={() => navigate(RouteDict.Leave.Types.Create)}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Your First Leave Type
                                </Button>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {filteredLeaveTypes.map((leaveType, index) => (
                                <motion.div
                                    key={leaveType.id}
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-200 border-l-4 border-l-primary bg-card backdrop-blur">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                                                    <CalendarDays className="h-5 w-5 text-primary" />
                                                    {leaveType.name}
                                                </CardTitle>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(leaveType.id)}
                                                        className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Leave Type</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete "{leaveType.name}"? This action cannot be undone and may affect employee leave balances.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction 
                                                                    onClick={() => handleDelete(leaveType.id)}
                                                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                                                    disabled={isDeleting}
                                                                >
                                                                    {isDeleting ? (
                                                                        <>
                                                                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                                                                            Deleting...
                                                                        </>
                                                                    ) : (
                                                                        'Delete'
                                                                    )}
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {leaveType.description}
                                            </p>

                                            {/* Annual Limit */}
                                            <div className="flex items-center justify-between p-3  rounded-lg">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="h-4 w-4 text-primary" />
                                                    <span className="text-sm font-medium text-foreground">Annual Limit</span>
                                                </div>
                                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold">
                                                    {leaveType.annualLimit} days
                                                </Badge>
                                            </div>

                                            {/* Badges */}
                                            <div className="flex flex-wrap gap-2">
                                                <Badge 
                                                    variant={leaveType.isPaid ? "default" : "secondary"}
                                                    className={leaveType.isPaid 
                                                        ? "bg-primary/10 text-primary border-primary/20" 
                                                        : "bg-muted text-muted-foreground border-border"
                                                    }
                                                >
                                                    {leaveType.isPaid ? (
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                    ) : (
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                    )}
                                                    {leaveType.isPaid ? 'Paid' : 'Unpaid'}
                                                </Badge>

                                                {leaveType.requiresApproval && (
                                                    <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                                                        <Shield className="h-3 w-3 mr-1" />
                                                        Approval Required
                                                    </Badge>
                                                )}

                                                {leaveType.carryForward && (
                                                    <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20">
                                                        <Calendar className="h-3 w-3 mr-1" />
                                                        Carry Forward ({leaveType.maxCarryForward})
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Created Date */}
                                            <div className="pt-2 border-t border-border">
                                                <p className="text-xs text-muted-foreground">
                                                    Created on {new Date(leaveType.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}