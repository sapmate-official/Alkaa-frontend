import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { APIDictionary } from "@/services/api/v2/APIdict";
import axios from "axios";
import { useAuth } from "@/providers/AuthContext";
import { useToast } from "@/hooks/use-toast";
import LazyLocationViewer from "@/components/LazyLocationViewer";
import { useAtomValue } from 'jotai';
import { permissionListAtom } from '@/store/atom';

// Types
type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";
type AttendanceVerificationStatus = "UNVERIFIED" | "VERIFIED" | "REJECTED";

interface User {
  id: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
}

interface AttendanceRecord {
  id: string;
  userId: string;
  date: Date;
  sessionNumber: number;
  checkInTime: Date;
  checkOutTime?: Date;
  checkInLocation: string;
  checkOutLocation?: string;
  status: AttendanceStatus;
  notes?: string;
  duration?: {
    hours: number;
    minutes: number;
  };
  createdAt: Date;
  updatedAt: Date;
  deviceInfo?: string;
  ipAddress?: string;
  verificationStatus: AttendanceVerificationStatus;
  user: User;
  UserDailyReport?: { 
    id: string;
    reportContent: any;
  }[];
}

const AttendanceVerificationComponent: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const permissionList = useAtomValue(permissionListAtom);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [, setLoading] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [managerNotes, setManagerNotes] = useState("");

  // Filters
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");

  // Bulk verification state
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [bulkActionNote, setBulkActionNote] = useState("");

  // Check for permissions
  const hasVerifyAllPermission = useMemo(() => {
    return permissionList.some(permission => 
      permission.key === 'view_all_user_attendance'
    );
  }, [permissionList]);

  const hasVerifySubordinatesPermission = useMemo(() => {
    return permissionList.some(permission => 
      permission.key === 'view_subordinates_attendance'
    );
  }, [permissionList]);

  // Modified fetch function that checks permissions
  const fetchAttendanceRecords = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      let response;
      
      if (hasVerifyAllPermission) {
        // User can verify all attendance records
        response = await axios.get(`${APIDictionary.attendance}/admin/verification/${user.id}`, {
          withCredentials: true,
        });
      } else if (hasVerifySubordinatesPermission) {
        // User can only verify subordinates' attendance
        response = await axios.get(`${APIDictionary.attendance}/manager/verification/${user.id}`, {
          withCredentials: true,
        });
      } else {
        // User has no verification permissions
        toast({
          title: "Access Denied",
          description: "You don't have permission to verify attendance records.",
          variant: "destructive",
        });
        return;
      }
      
      if (response?.data) {
        setRecords(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch attendance records:", error);
      toast({
        title: "Failed to fetch attendance records",
        description: "An error occurred while fetching attendance records. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAttendanceRecords();
  }, [user?.id, hasVerifyAllPermission, hasVerifySubordinatesPermission]);

  const postVerificationCall = async (attendanceId: string, verificationStatus: AttendanceVerificationStatus) => {
    try {
      let endpoint = `${APIDictionary.attendance}/manager/verification`;
      
      // Use admin endpoint if user has permission to verify all
      if (hasVerifyAllPermission) {
        endpoint = `${APIDictionary.attendance}/admin/verification`;
      }
      
      const response = await axios.post(endpoint, {
        userId: user?.id,
        attendanceId,
        verificationStatus,
      }, {
        withCredentials: true,
      });
      
      if (response.data) {
        fetchAttendanceRecords();
        toast({
          title: "Attendance record verified",
          description: "The attendance record has been successfully verified.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Failed to verify attendance record:", error);
      toast({
        title: "Failed to verify attendance record",
        description: "An error occurred while verifying the attendance record. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const verifyAttendance = (id: string, status: AttendanceVerificationStatus, notes: string) => {
    postVerificationCall(id, status);
    setRecords(
      records.map((record) =>
        record.id === id
          ? { ...record, verificationStatus: status, notes: notes || record.notes }
          : record
      )
    );

    setIsDetailsOpen(false);
  };

  const bulkVerifyAttendance = (status: AttendanceVerificationStatus) => {
    records
      .filter((record) => selectedRecordIds.includes(record.id))
      .forEach((record) => postVerificationCall(record.id, status));
    setRecords(
      records.map((record) =>
        selectedRecordIds.includes(record.id)
          ? { ...record, verificationStatus: status, notes: bulkActionNote || record.notes }
          : record
      )
    );
    setSelectedRecordIds([]);
    setBulkActionNote("");
  };

  const toggleRecordSelection = (id: string) => {
    setSelectedRecordIds(
      selectedRecordIds.includes(id)
        ? selectedRecordIds.filter((recordId) => recordId !== id)
        : [...selectedRecordIds, id]
    );
    console.log(selectedRecord);
    
  };

  const deselectAllRecords = () => {
    setSelectedRecordIds([]);
  };

  const isVerificationDisabled = (_status: AttendanceVerificationStatus): boolean => {
    // return status === "VERIFIED" || status === "REJECTED";
    
    
    return false;
  };

  const uniqueUsers = Array.from(new Set(records.map(record => record.userId)))
    .map(userId => {
      const user = records.find(record => record.userId === userId)?.user;
      return user ? { id: user.id, name: user.name } : null;
    })
    .filter((user): user is { id: string; name: string } => user !== null);

  const filteredRecords = records.filter((record) => {
    const recordDate = new Date(record.date);
    const isInDateRange = recordDate >= startDate && recordDate <= endDate;
    const userMatch = selectedUsers.length === 0 || selectedUsers.includes(record.userId);
    const statusMatch = statusFilter === "all" || record.status === statusFilter;
    const verificationMatch =
      verificationFilter === "all" ||
      record.verificationStatus === verificationFilter;

    return isInDateRange && userMatch && statusMatch && verificationMatch;
  });

  const groupedRecords: Record<string, Record<string, AttendanceRecord[]>> = {};

  filteredRecords.forEach(record => {
    const dateKey = format(new Date(record.date), "yyyy-MM-dd");
    const userKey = record.userId;

    if (!groupedRecords[dateKey]) {
      groupedRecords[dateKey] = {};
    }

    if (!groupedRecords[dateKey][userKey]) {
      groupedRecords[dateKey][userKey] = [];
    }

    groupedRecords[dateKey][userKey].push(record);
  });

  const openDetails = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    console.log(record);
    
    if (record.UserDailyReport && record.UserDailyReport.length > 0) {
      try {
        const reportData = typeof record.UserDailyReport[0].reportContent === 'string' 
          ? JSON.parse(record.UserDailyReport[0].reportContent) 
          : record.UserDailyReport[0].reportContent;
        setSelectedReport(reportData);
      } catch (error) {
        console.error("Error parsing report data:", error);
        setSelectedReport(null);
      }
    } else {
      setSelectedReport(null);
    }
    
    setManagerNotes(record.notes || "");
    setIsDetailsOpen(true);
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case "PRESENT":
        return <Badge className="bg-green-500">Present</Badge>;
      case "ABSENT":
        return <Badge className="bg-red-500">Absent</Badge>;
      case "LATE":
        return <Badge className="bg-yellow-500">Late</Badge>;
      case "HALF_DAY":
        return <Badge className="bg-blue-500">Half Day</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getVerificationBadge = (status: AttendanceVerificationStatus) => {
    switch (status) {
      case "VERIFIED":
        return <Badge className="bg-green-500">Verified</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500">Rejected</Badge>;
      case "UNVERIFIED":
        return <Badge className="bg-gray-500">Unverified</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="w-full px-6 py-8 overflow-y-auto h-full">
      <Card>
        <CardHeader>
          <CardTitle>Employee Attendance Verification</CardTitle>
          <CardDescription>
            Review and verify employee attendance records across multiple days and sessions
          </CardDescription>
        </CardHeader>
        <CardContent >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 ">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Employee</label>
              <Select
                value={selectedUsers.length === 1 ? selectedUsers[0] : ""}
                onValueChange={(value) => {
                  if (value === "all") {
                    setSelectedUsers([]);
                  } else {
                    setSelectedUsers([value]);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {uniqueUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="LATE">Late</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="HALF_DAY">Half Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Verification</label>
                <Select
                  value={verificationFilter}
                  onValueChange={setVerificationFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="UNVERIFIED">Unverified</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedRecordIds.length > 0 && (
            <div className="bg-background p-4 mb-6 rounded-md border">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">
                  {selectedRecordIds.length} records selected
                </h3>
                <Button variant="ghost" size="sm" onClick={deselectAllRecords}>
                  Clear selection
                </Button>
              </div>
              <Textarea
                placeholder="Add notes for bulk action..."
                value={bulkActionNote}
                onChange={(e) => setBulkActionNote(e.target.value)}
                className="mb-3 h-16"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => bulkVerifyAttendance("REJECTED")}
                >
                  Reject Selected
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => bulkVerifyAttendance("VERIFIED")}
                >
                  Verify Selected
                </Button>
              </div>
            </div>
          )}

          {Object.keys(groupedRecords).length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No attendance records found for the selected filters.
            </div>
          ) : (
            <div className="space-y-4 ">
              {Object.keys(groupedRecords).sort().map(dateKey => (
                <Accordion type="single" collapsible key={dateKey}>
                  <AccordionItem value={dateKey}>
                    <AccordionTrigger>
                      <div className="flex w-full justify-between pr-4">
                        <span>{format(new Date(dateKey), "EEEE, MMMM d, yyyy")}</span>
                        <span className="text-sm text-gray-500">
                          {Object.values(groupedRecords[dateKey]).flat().length} sessions
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2">
                        <div className="flex justify-between mb-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const dateRecordIds = Object.values(groupedRecords[dateKey])
                                .flat()
                                .map(record => record.id);
                              setSelectedRecordIds([...new Set([...selectedRecordIds, ...dateRecordIds])]);
                            }}
                          >
                            Select All for This Day
                          </Button>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={Object.values(groupedRecords[dateKey])
                                    .flat()
                                    .every(record => selectedRecordIds.includes(record.id))}
                                  onChange={() => {
                                    const dateRecordIds = Object.values(groupedRecords[dateKey])
                                      .flat()
                                      .map(record => record.id);

                                    const allSelected = dateRecordIds.every(id =>
                                      selectedRecordIds.includes(id)
                                    );

                                    if (allSelected) {
                                      setSelectedRecordIds(selectedRecordIds.filter(
                                        id => !dateRecordIds.includes(id)
                                      ));
                                    } else {
                                      setSelectedRecordIds([...new Set([
                                        ...selectedRecordIds,
                                        ...dateRecordIds
                                      ])]);
                                    }
                                  }}
                                />
                              </TableHead>
                              <TableHead>Employee</TableHead>
                              <TableHead>Session</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Verification</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.keys(groupedRecords[dateKey]).map(userKey => (
                              groupedRecords[dateKey][userKey]
                                .sort((a, b) => a.sessionNumber - b.sessionNumber)
                                .map((record, index) => (
                                  <TableRow key={record.id}>
                                    <TableCell>
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={selectedRecordIds.includes(record.id)}
                                        onChange={() => toggleRecordSelection(record.id)}
                                        disabled={isVerificationDisabled(record.verificationStatus)}
                                      />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      <div>{record.user.name}</div>
                                      <div className="text-xs text-gray-500">
                                        {record.user.department}
                                        {index > 0 && <span className="ml-1 text-blue-500">(Session {record.sessionNumber})</span>}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">
                                        Session {record.sessionNumber}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div>{format(new Date(record.checkInTime), "h:mm a")}</div>
                                      <div className="text-xs text-gray-500">
                                        {record.checkOutTime
                                          ? format(new Date(record.checkOutTime), "h:mm a")
                                          : "Not checked out"}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {record.duration
                                        ? `${record.duration.hours}h ${record.duration.minutes}m`
                                        : "N/A"}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                                    <TableCell>{getVerificationBadge(record.verificationStatus)}</TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex gap-1 justify-end">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => verifyAttendance(record.id, "VERIFIED", record.notes || "")}
                                          title={isVerificationDisabled(record.verificationStatus) ? "Already verified/rejected" : "Quick Verify"}
                                          disabled={isVerificationDisabled(record.verificationStatus)}
                                          className={isVerificationDisabled(record.verificationStatus) ? "opacity-50 cursor-not-allowed" : ""}
                                        >
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => verifyAttendance(record.id, "REJECTED", record.notes || "")}
                                          title={isVerificationDisabled(record.verificationStatus) ? "Already verified/rejected" : "Quick Reject"}
                                          disabled={isVerificationDisabled(record.verificationStatus)}
                                          className={isVerificationDisabled(record.verificationStatus) ? "opacity-50 cursor-not-allowed" : ""}
                                        >
                                          <XCircle className="h-4 w-4 text-red-500" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openDetails(record)}
                                        >
                                          Details
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRecord && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Attendance Record Details</DialogTitle>
              <DialogDescription>
                {selectedRecord.user.name} - {format(new Date(selectedRecord.date), "MMMM d, yyyy")} - Session {selectedRecord.sessionNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Employee Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-sm">Name:</span> {selectedRecord.user.name}
                  </div>
                  <div>
                    <span className="font-medium text-sm">Department:</span> {selectedRecord.user.department || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium text-sm">Position:</span> {selectedRecord.user.position || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium text-sm">Email:</span> {selectedRecord.user.email}
                  </div>
                </div>

                <h3 className="text-lg font-medium mb-2 mt-6">Attendance Details</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-sm">Session:</span> {selectedRecord.sessionNumber}
                  </div>
                  <div>
                    <span className="font-medium text-sm">Status:</span> {getStatusBadge(selectedRecord.status)}
                  </div>
                  <div>
                    <span className="font-medium text-sm">Check In:</span> {format(new Date(selectedRecord.checkInTime), "h:mm a")}
                  </div>
                  <div>
                    <span className="font-medium text-sm">Check Out:</span>{" "}
                    {selectedRecord.checkOutTime
                      ? format(new Date(selectedRecord.checkOutTime), "h:mm a")
                      : "Not checked out"}
                  </div>
                  <div>
                    <span className="font-medium text-sm">Duration:</span>{" "}
                    {selectedRecord.duration
                      ? `${selectedRecord.duration.hours}h ${selectedRecord.duration.minutes}m`
                      : "N/A"}
                  </div>
                  <div>
                    <span className="font-medium text-sm">Device:</span> {selectedRecord.deviceInfo || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium text-sm">IP Address:</span> {selectedRecord.ipAddress || "N/A"}
                  </div>
                </div>
              </div>

              <div>
                <Tabs defaultValue="checkin">
                  <TabsList className="w-full">
                    <TabsTrigger value="checkin" className="flex-1">Check-in Location</TabsTrigger>
                    <TabsTrigger value="checkout" className="flex-1">Check-out Location</TabsTrigger>
                  </TabsList>
                  <TabsContent value="checkin">
                    {
                      selectedRecord.checkInLocation  &&
                      <LazyLocationViewer lat={selectedRecord?.checkInLocation?.split(",")[0]} lon={selectedRecord?.checkInLocation?.split(",")[1]} />
                    }
                    {
                      !selectedRecord.checkInLocation &&
                     <div className="flex items-center justify-center h-64 bg-gray-100">
                      <div className="text-gray-500">
                      No location data exists
                      </div>
                     </div>
                    }
                  </TabsContent>
                  <TabsContent value="checkout">
                    {
                      selectedRecord.checkOutLocation  &&
                      <LazyLocationViewer lat={selectedRecord?.checkOutLocation?.split(",")[0]} lon={selectedRecord?.checkOutLocation?.split(",")[1]} />
                    }
                    {
                      !selectedRecord.checkOutLocation &&
                     <div className="flex items-center justify-center h-64 bg-gray-100">
                      <div className="text-gray-500">
                      No location data exists
                      </div>
                     </div>
                    }
                    
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {selectedReport && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Daily Task Report</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  {Object.keys(selectedReport).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(selectedReport).map(([key, value], index) => (
                        <div key={index} className="p-3 bg-white rounded-md border">
                          <div className="font-medium text-blue-600 mb-1">{key}</div>
                          <div className="text-gray-700">{String(value)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No report data available.</p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Verification Notes</h3>
              <Textarea
                placeholder="Add notes for verification..."
                value={managerNotes}
                onChange={(e) => setManagerNotes(e.target.value)}
                className="min-h-24"
              />
            </div>

            <DialogFooter className="mt-6">
              <div className="flex gap-2 w-full justify-between">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                >
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => verifyAttendance(selectedRecord.id, "REJECTED", managerNotes)}
                    disabled={isVerificationDisabled(selectedRecord.verificationStatus)}
                    className={isVerificationDisabled(selectedRecord.verificationStatus) ? "opacity-50" : ""}
                  >
                    {isVerificationDisabled(selectedRecord.verificationStatus) 
                      ? selectedRecord.verificationStatus === "REJECTED" ? "Already Rejected" : "Already Verified" 
                      : "Reject"}
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => verifyAttendance(selectedRecord.id, "VERIFIED", managerNotes)}
                    disabled={isVerificationDisabled(selectedRecord.verificationStatus)}
                    className={isVerificationDisabled(selectedRecord.verificationStatus) ? "opacity-50" : ""}
                  >
                    {isVerificationDisabled(selectedRecord.verificationStatus) 
                      ? selectedRecord.verificationStatus === "VERIFIED" ? "Already Verified" : "Already Rejected" 
                      : "Verify"}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
export default AttendanceVerificationComponent;