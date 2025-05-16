// import { useState, useEffect, FormEvent } from 'react';
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Calendar } from "@/components/ui/calendar";
// import { format } from "date-fns";
// import { backendDomain } from '@/lib/constant/Domain';
// import { useToast } from '@/hooks/use-toast';
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import axios from 'axios';
// import { useTheme } from '@/provider/ThemeProvider';

// interface LeaveType {
//   id: number;
//   name: string;
// }

// interface FormData {
//   leaveTypeId: string;
//   startDate: Date | null;
//   endDate: Date | null;
//   reason: string;
// }

// const LeaveRequestForm = () => {
//   const { toast } = useToast();
//   const [loading, setLoading] = useState(false);
//   const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
//   const {theme} = useTheme();
//   const [formData, setFormData] = useState<FormData>({
//     leaveTypeId: '',
//     startDate: null,
//     endDate: null,
//     reason: ''
//   });

//   // Fetch leave types
//   useEffect(() => {
//     const fetchLeaveTypes = async () => {
//       try {
//         const response = await axios.get(`${backendDomain}/api/v1/leave/type`, { withCredentials: true });
//         setLeaveTypes(response.data);
//       } catch (error) {
//         console.error('Failed to fetch leave types:', error);
//       }
//     };

//     fetchLeaveTypes();
//   }, []);

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     // Validation
//     if (!formData.leaveTypeId || !formData.startDate || !formData.endDate || !formData.reason) {
//       toast({
//         variant: "destructive",
//         title: "Validation Error",
//         description: "Please fill in all fields",
//       });
//       setLoading(false);
//       return;
//     }

//     try {
//       const response = await axios.post(`${backendDomain}/api/v1/employee/leave/apply`, formData, {
//         headers: { 'Content-Type': 'application/json' },
//         withCredentials: true,
//       });

//       if (response.status === 201) {
//         toast({
//           title: "Success!",
//           description: "Your leave request has been submitted successfully.",
//         });
//         // Reset form
//         setFormData({
//           leaveTypeId: '',
//           startDate: null,
//           endDate: null,
//           reason: ''
//         });
//       }
//     } catch (error) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Failed to submit leave request. Please try again.",
//       });
//       console.error('Error submitting leave request:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="container mx-auto p-4 min-h-screen">
//       <Card className="shadow-lg">
//         <CardHeader>
//           <CardTitle className="text-2xl font-bold text-center">Leave Request Form</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Left Column */}
//               <div className="space-y-6">
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium">Leave Type</label>
//                   <Select 
//                     value={formData.leaveTypeId} 
//                     onValueChange={(value) => setFormData(prev => ({ ...prev, leaveTypeId: value }))}
//                   >
//                     <SelectTrigger className="w-full">
//                       <SelectValue placeholder="Select leave type" />
//                     </SelectTrigger>
//                     <SelectContent className='bg-white dark:bg-neutral-700'>
//                       {leaveTypes.map((type: LeaveType) => (
//                         <SelectItem key={type.id} value={type.id.toString()}>
//                           {type.name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="space-y-2">
//                   <label className="text-sm font-medium">Reason for Leave</label>
//                   <Input 
//                     placeholder="Enter reason for leave" 
//                     value={formData.reason}
//                     onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
//                     className="w-full"
//                   />
//                 </div>

//                 <Button 
//                   type="submit" 
//                   className="w-full mt-4 bg-[var(--accent)] hover:bg-[var(--light-accent)] text-[var(--light-bg-primary)]"
//                   disabled={loading}
//                 >
//                   {loading ? "Submitting..." : "Submit Leave Request"}
//                 </Button>
//               </div>

//               {/* Right Column */}
//               <div className="space-y-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-2">
//                     <label className="text-sm font-medium">Start Date</label>
//                     <div className={`border rounded-lg p-2 bg-white ${theme == 'dark'?`bg-neutral-800`:`bg-white`}`}>
//                       <Calendar
//                         mode="single"
//                         selected={formData.startDate || undefined}
//                         onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date || null }))}
//                         className="w-full"
//                         disabled={(date) => 
//                           formData.endDate ? date > formData.endDate : false ||
//                           date < new Date()
//                         }
                        
//                       />
//                       {formData.startDate && (
//                         <p className="text-sm text-center mt-2 text-muted-foreground">
//                           Selected: {format(formData.startDate, "PPP")}
//                         </p>
//                       )}
//                     </div>
//                   </div>

//                   <div className="space-y-2">
//                     <label className="text-sm font-medium">End Date</label>
//                     <div className={`border rounded-lg p-2 bg-white ${theme == 'dark'?`bg-neutral-800`:`bg-white`}`}>
//                       <Calendar
//                         mode="single"
//                         selected={formData.endDate || undefined}
//                         onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date || null }))}
//                         className="w-full"
//                         disabled={(date) => 
//                           formData.startDate ? date < formData.startDate : false ||
//                           date < new Date()
//                         }
//                       />
//                       {formData.endDate && (
//                         <p className="text-sm text-center mt-2 text-muted-foreground">
//                           Selected: {format(formData.endDate, "PPP")}
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default LeaveRequestForm;