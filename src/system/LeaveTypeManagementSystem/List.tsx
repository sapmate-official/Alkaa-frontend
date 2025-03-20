import { APIDictionary } from "@/api/v2/APIdict";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/services/AuthContext";
import axios from "axios";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

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
    const {user} = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchLeaveTypes = async () => {
        try {
            if (!user?.orgId) return;
            const response = await axios.get(
                APIDictionary.get_all_org_leave_type(user?.orgId)
            );
            console.log("Leave types:", response?.data);
            setLeaveTypes(response?.data || []);
        } catch (error) {
            console.error("Error fetching leave types:", error);
            setLeaveTypes([]);
        }
    };
    const handleDelete = async (id: string) => {
        try {
            setIsDeleting(true);
            
            // Send delete request - backend will handle validation
            const response = await axios.delete(
                APIDictionary.leave_type(id)
            );
            
            if (response.status === 204) {
                toast({
                    title: "Success",
                    description: "Leave type deleted successfully"
                });
                // Refresh the list
                fetchLeaveTypes();
            }
        } catch (error: any) {
            console.error("Error deleting leave type:", error);
            
            // Display the specific error message from the backend
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
        navigate(`/p/leavetype/edit/${id}`);
    };

    return (
        <div className="p-4 w-full h-full overflow-y-auto">
           <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Leave Types</h2>
                <Button 
                    onClick={()=>navigate("/p/leavetype/create")}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Create Leave Type
                </Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Annual Limit</TableHead>
                        <TableHead>Approval Required</TableHead>
                        <TableHead>Paid Leave</TableHead>
                        <TableHead>Carry Forward</TableHead>
                        <TableHead>Max Carry Forward</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leaveTypes?.map((leaveType) => (
                        <TableRow key={leaveType?.id}>
                            <TableCell>{leaveType?.name}</TableCell>
                            <TableCell>{leaveType?.description}</TableCell>
                            <TableCell>{leaveType?.annualLimit}</TableCell>
                            <TableCell>{leaveType?.requiresApproval ? "Yes" : "No"}</TableCell>
                            <TableCell>{leaveType?.isPaid ? "Yes" : "No"}</TableCell>
                            <TableCell>{leaveType?.carryForward ? "Yes" : "No"}</TableCell>
                            <TableCell>{leaveType?.maxCarryForward}</TableCell>
                            
                            <TableCell>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(leaveType?.id)}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Leave Type</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete "{leaveType.name}"? This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction 
                                                    onClick={() => handleDelete(leaveType?.id)}
                                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? "Deleting..." : "Delete"}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}