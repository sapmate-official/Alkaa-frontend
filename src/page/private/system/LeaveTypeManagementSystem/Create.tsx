import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { backendDomain } from "@/lib/constant/Domain";
import { useAuth } from "@/services/AuthContext";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

const CreateLeaveType = () => {
    const { user } = useAuth();
    const {toast} = useToast()
    const navigate = useNavigate();
    const form = useForm({
        defaultValues: {
            name: '',
            description: '',
            annualLimit: 0,
            requiresApproval: true,
            isPaid: true,
            carryForward: false,
            maxCarryForward: 0
        },
    })

    const onSubmit = async (data: any) => {
        try {
            if(!user?.orgId) return null;
            const response = await axios.post(
                `${backendDomain}/api/v2/leave-type`,
                {
                    ...data,
                    orgId: user?.organization?.id ?? null
                },
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            
            navigate('/p/leavetype');
            toast?.({
                title: "Success",
                description: "Leave type created successfully",
            })
            
            form?.reset();
        } catch (error) {
            toast?.({
                title: "Error",
                description: "Failed to create leave type",
                variant: "destructive",
            })
            console.error('Error creating leave type:', error);
        }
    };

    return (
        <div className="w-full h-full mx-auto p-6 overflow-y-scroll">
            <h2 className="text-3xl font-bold tracking-tight mb-6">Create Leave Type</h2>
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
                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <Button type="submit" className="w-full">
                        Create Leave Type
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default CreateLeaveType;