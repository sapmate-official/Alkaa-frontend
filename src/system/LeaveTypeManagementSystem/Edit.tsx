import { APIDictionary } from "@/api/APIdict";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/services/AuthContext";
import axios from "axios";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

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
}

const EditLeaveType = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const form = useForm<LeaveType>({
        defaultValues: {
            name: '',
            description: '',
            annualLimit: 0,
            requiresApproval: true,
            isPaid: true,
            carryForward: false,
            maxCarryForward: 0,
        },
    });

    // Fetch leave type data
    useEffect(() => {
        const fetchLeaveType = async () => {
            try {
                const response = await axios.get(
                    APIDictionary.leave_type(id || "")
                );
                form.reset(response.data);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch leave type",
                    variant: "destructive",
                });
                navigate('/p/leavetype');
            }
        };

        if (id) {
            fetchLeaveType();
        }
    }, [id]);

    const onSubmit = async (data: LeaveType) => {
        try {
            await axios.put(
                APIDictionary.leave_type(id || ""),
                {
                    ...data,
                    orgId: user?.orgId,
                }
            );

            toast({
                title: "Success",
                description: "Leave type updated successfully",
            });
            navigate('/p/leavetype');
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update leave type",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="w-full h-full mx-auto p-6 overflow-y-scroll">
            <h2 className="text-3xl font-bold tracking-tight mb-6">Edit Leave Type</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter leave type name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea 
                                        placeholder="Enter description"
                                        className="resize-none" 
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="annualLimit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Annual Limit</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        min="0"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target?.value) || 0)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="requiresApproval"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal">
                                    Requires Approval
                                </FormLabel>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="isPaid"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal">
                                    Is Paid Leave
                                </FormLabel>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="carryForward"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal">
                                    Allow Carry Forward
                                </FormLabel>
                            </FormItem>
                        )}
                    />

                    {form.watch("carryForward") && (
                        <FormField
                            control={form.control}
                            name="maxCarryForward"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Max Carry Forward Days</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number"
                                            min="0"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target?.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <div className="flex justify-end gap-4">
                        <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => navigate('/p/leavetype')}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            Update Leave Type
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default EditLeaveType;