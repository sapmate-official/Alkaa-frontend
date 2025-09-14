import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { backendDomain } from "@/constants/Domain";
import RouteDict from "@/routes/RouteDict";
import { useAuth } from "@/providers/AuthContext";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
    CalendarDays, 
    ArrowLeft, 
    Save, 
    Settings, 
    CheckCircle, 
    XCircle, 
    Shield, 
    Calendar,
    Info,
    Clock
} from "lucide-react";
import { useState } from "react";

const CreateLeaveType = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            setIsSubmitting(true);
            if(!user?.orgId) return null;
            await axios.post(
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

            navigate(RouteDict.Leave.Types.List);
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
        } finally {
            setIsSubmitting(false);
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Button
                            variant="ghost"
                            onClick={() => navigate(RouteDict.Leave.Types.List)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="p-2 bg-green-500 rounded-lg">
                            <CalendarDays className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                Create Leave Type
                            </h1>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Define a new leave type for your organization
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Settings className="h-3 w-3 mr-1" />
                        Configuration
                    </Badge>
                </div>
            </motion.div>

            {/* Content */}
            <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Basic Information */}
                            <motion.div
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: 0.1 }}
                            >
                                <Card className="shadow-lg">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b">
                                        <div className="flex items-center space-x-2">
                                            <Info className="h-5 w-5 text-blue-500" />
                                            <div>
                                                <CardTitle className="text-lg">Basic Information</CardTitle>
                                                <CardDescription>
                                                    Define the basic details of your leave type
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                rules={{ required: "Leave type name is required" }}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium">Name *</FormLabel>
                                                        <FormControl>
                                                            <Input 
                                                                placeholder="e.g., Annual Leave, Sick Leave" 
                                                                className="bg-white dark:bg-slate-800"
                                                                {...field} 
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            A clear, descriptive name for this leave type
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="annualLimit"
                                                rules={{ required: "Annual limit is required", min: { value: 0, message: "Must be 0 or greater" } }}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium flex items-center space-x-1">
                                                            <Calendar className="h-4 w-4 text-blue-500" />
                                                            <span>Annual Limit (Days) *</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input 
                                                                type="number" 
                                                                min="0"
                                                                placeholder="e.g., 21"
                                                                className="bg-white dark:bg-slate-800"
                                                                {...field}
                                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Maximum days allowed per year
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">Description</FormLabel>
                                                    <FormControl>
                                                        <Textarea 
                                                            placeholder="Provide additional details about this leave type..."
                                                            className="resize-none min-h-[100px] bg-white dark:bg-slate-800" 
                                                            {...field} 
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Optional description to help employees understand when to use this leave type
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Leave Configuration */}
                            <motion.div
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: 0.2 }}
                            >
                                <Card className="shadow-lg">
                                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-b">
                                        <div className="flex items-center space-x-2">
                                            <Settings className="h-5 w-5 text-green-500" />
                                            <div>
                                                <CardTitle className="text-lg">Leave Configuration</CardTitle>
                                                <CardDescription>
                                                    Configure policies and rules for this leave type
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Left Column */}
                                            <div className="space-y-6">
                                                <FormField
                                                    control={form.control}
                                                    name="isPaid"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                    className="mt-1"
                                                                />
                                                            </FormControl>
                                                            <div className="space-y-1 leading-none">
                                                                <FormLabel className="font-medium flex items-center space-x-2">
                                                                    {field.value ? (
                                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                                    ) : (
                                                                        <XCircle className="h-4 w-4 text-gray-400" />
                                                                    )}
                                                                    <span>Is Paid Leave</span>
                                                                </FormLabel>
                                                                <FormDescription className="text-xs">
                                                                    Employees will receive full salary during this leave
                                                                </FormDescription>
                                                            </div>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="requiresApproval"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                    className="mt-1"
                                                                />
                                                            </FormControl>
                                                            <div className="space-y-1 leading-none">
                                                                <FormLabel className="font-medium flex items-center space-x-2">
                                                                    {field.value ? (
                                                                        <Shield className="h-4 w-4 text-orange-500" />
                                                                    ) : (
                                                                        <Clock className="h-4 w-4 text-gray-400" />
                                                                    )}
                                                                    <span>Requires Approval</span>
                                                                </FormLabel>
                                                                <FormDescription className="text-xs">
                                                                    Manager approval needed before leave is granted
                                                                </FormDescription>
                                                            </div>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Right Column */}
                                            <div className="space-y-6">
                                                <FormField
                                                    control={form.control}
                                                    name="carryForward"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                    className="mt-1"
                                                                />
                                                            </FormControl>
                                                            <div className="space-y-1 leading-none">
                                                                <FormLabel className="font-medium flex items-center space-x-2">
                                                                    {field.value ? (
                                                                        <Calendar className="h-4 w-4 text-purple-500" />
                                                                    ) : (
                                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                                    )}
                                                                    <span>Allow Carry Forward</span>
                                                                </FormLabel>
                                                                <FormDescription className="text-xs">
                                                                    Unused days can be carried to next year
                                                                </FormDescription>
                                                            </div>
                                                        </FormItem>
                                                    )}
                                                />

                                                {form.watch("carryForward") && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        <FormField
                                                            control={form.control}
                                                            name="maxCarryForward"
                                                            rules={{ 
                                                                required: form.watch("carryForward") ? "Max carry forward is required" : false,
                                                                min: { value: 0, message: "Must be 0 or greater" }
                                                            }}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-sm font-medium">Max Carry Forward Days</FormLabel>
                                                                    <FormControl>
                                                                        <Input 
                                                                            type="number"
                                                                            min="0"
                                                                            placeholder="e.g., 5"
                                                                            className="bg-white dark:bg-slate-800"
                                                                            {...field}
                                                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription>
                                                                        Maximum days that can be carried forward
                                                                    </FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Action Buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex justify-end space-x-4 pt-6"
                            >
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={() => navigate(RouteDict.Leave.Types.List)}
                                    disabled={isSubmitting}
                                    className="min-w-[120px]"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="min-w-[160px] bg-green-600 hover:bg-green-700"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Create Leave Type
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default CreateLeaveType;