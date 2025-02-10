import { APIDictionary } from "@/api/APIdict";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/services/AuthContext";
import axios from "axios";
import { Edit2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

    const fetchLeaveTypes = async () => {
        try {
            if (!user?.orgId) return;
            const response = await axios.get(
                APIDictionary.get_all_org_leave_type(user?.orgId || ""),
            );
            console.log("Leave types:", response.data);
            setLeaveTypes(response.data);
        } catch (error) {
            console.error("Error fetching leave types:", error);
        }
    };

    useEffect(() => {
        fetchLeaveTypes();
    }, [user]);

    const handleEdit = (id: string) => {
        navigate(`/p/leavetype/edit/${id}`);
    };

    return (
        <div className="p-4">
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
                    {leaveTypes.map((leaveType) => (
                        <TableRow key={leaveType.id}>
                            <TableCell>{leaveType.name}</TableCell>
                            <TableCell>{leaveType.description}</TableCell>
                            <TableCell>{leaveType.annualLimit}</TableCell>
                            <TableCell>{leaveType.requiresApproval ? "Yes" : "No"}</TableCell>
                            <TableCell>{leaveType.isPaid ? "Yes" : "No"}</TableCell>
                            <TableCell>{leaveType.carryForward ? "Yes" : "No"}</TableCell>
                            <TableCell>{leaveType.maxCarryForward}</TableCell>
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(leaveType.id)}
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}