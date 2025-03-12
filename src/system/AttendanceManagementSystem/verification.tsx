import React, { useState, useEffect } from "react";
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
import { APIDictionary } from "@/api/v2/APIdict";
import axios from "axios";
import { useAuth } from "@/services/AuthContext";
import { useToast } from "@/hooks/use-toast";
import LocationViewer from "@/components/Locationviewer";

// Types
type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";
type AttendanceVerificationStatus = "UNVERIFIED" | "VERIFIED" | "REJECTED";

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

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
  checkInLocation: Location;
  checkOutLocation?: Location;
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
}

// Mock data for demonstration - with multiple sessions per day
const mockUsers: User[] = [
  {
    id: "user1",
    name: "John Doe",
    email: "john.doe@example.com",
    department: "Engineering",
    position: "Software Developer",
  },
  {
    id: "user2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    department: "Marketing",
    position: "Marketing Specialist",
  },
  {
    id: "user3",
    name: "Robert Johnson",
    email: "robert.johnson@example.com",
    department: "Sales",
    position: "Sales Representative",
  },
];

// Generate mock data for multiple days and sessions
const generateMockData = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const startDate = new Date("2025-03-01");
  const endDate = new Date("2025-03-07");
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    for (const user of mockUsers) {
      // Morning session
      records.push({
        id: `${user.id}-${format(date, "yyyy-MM-dd")}-1`,
        userId: user.id,
        date: new Date(date),
        sessionNumber: 1,
        checkInTime: new Date(new Date(date).setHours(9, Math.floor(Math.random() * 15), 0)),
        checkOutTime: new Date(new Date(date).setHours(12, 30 + Math.floor(Math.random() * 30), 0)),
        checkInLocation: { lat: 37.7749, lng: -122.4194, address: "123 Market St, San Francisco, CA" },
        checkOutLocation: { lat: 37.7749, lng: -122.4194, address: "123 Market St, San Francisco, CA" },
        status: Math.random() > 0.8 ? "LATE" : "PRESENT",
        duration: { hours: 3, minutes: 30 + Math.floor(Math.random() * 30) },
        createdAt: new Date(date),
        updatedAt: new Date(date),
        deviceInfo: "iPhone 15 Pro",
        ipAddress: "192.168.1.1",
        verificationStatus: "UNVERIFIED",
        user: user,
      });
      
      // Afternoon session
      records.push({
        id: `${user.id}-${format(date, "yyyy-MM-dd")}-2`,
        userId: user.id,
        date: new Date(date),
        sessionNumber: 2,
        checkInTime: new Date(new Date(date).setHours(13, 30 + Math.floor(Math.random() * 15), 0)),
        checkOutTime: new Date(new Date(date).setHours(17, 30 + Math.floor(Math.random() * 30), 0)),
        checkInLocation: { lat: 37.7833, lng: -122.4167, address: "456 Mission St, San Francisco, CA" },
        checkOutLocation: { lat: 37.7833, lng: -122.4167, address: "456 Mission St, San Francisco, CA" },
        status: Math.random() > 0.9 ? "HALF_DAY" : "PRESENT",
        duration: { hours: 4, minutes: Math.floor(Math.random() * 30) },
        createdAt: new Date(date),
        updatedAt: new Date(date),
        deviceInfo: "MacBook Pro",
        ipAddress: "192.168.1.2",
        verificationStatus: "UNVERIFIED",
        user: user,
      });
      
      // Random third session for some users (remote work)
      if (Math.random() > 0.7) {
        records.push({
          id: `${user.id}-${format(date, "yyyy-MM-dd")}-3`,
          userId: user.id,
          date: new Date(date),
          sessionNumber: 3,
          checkInTime: new Date(new Date(date).setHours(20, Math.floor(Math.random() * 30), 0)),
          checkOutTime: new Date(new Date(date).setHours(22, Math.floor(Math.random() * 30), 0)),
          checkInLocation: { lat: 37.8044, lng: -122.2712, address: "Remote - Home Office" },
          checkOutLocation: { lat: 37.8044, lng: -122.2712, address: "Remote - Home Office" },
          status: "PRESENT",
          duration: { hours: 2, minutes: Math.floor(Math.random() * 30) },
          createdAt: new Date(date),
          updatedAt: new Date(date),
          deviceInfo: "iPad Pro",
          ipAddress: "10.0.0.1",
          verificationStatus: "UNVERIFIED",
          user: user,
        });
      }
    }
  }
  
  return records;
};

const mockAttendanceRecords = generateMockData();

// Google Maps Component
const LocationMap: React.FC<{ location?: Location }> = ({ location }) => {
  if (!location || !location.lat || !location.lng) return <div className="h-64 bg-gray-100 flex items-center justify-center">No location data available</div>;
  console.log(location);
  
  return (
    <LocationViewer lat={location.lat.toString()} lon={location.lng.toString()}/>
  );
};

const AttendanceVerificationComponent: React.FC = () => {
    const {user} = useAuth()
    const {toast} = useToast()
  const [records, setRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date("2025-03-01"));
  const [endDate, setEndDate] = useState<Date>(new Date("2025-03-07"));
  const [managerNotes, setManagerNotes] = useState("");
  
  // Filters
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  
  // Bulk verification state
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [bulkActionNote, setBulkActionNote] = useState("");
  const fetchAttendanceManagerVerificationRecords = async () => {
    try {
      const response = await axios.get(`${APIDictionary.attendance}/manager/verification/${user?.id}`, {
        withCredentials: true,
      });
      if (response.data) {
        setRecords(response.data);
        
      }
    } catch (error) {
      console.error("Failed to fetch attendance records:", error);
      toast({
        title: "Failed to fetch attendance records",
        description: "An error occurred while fetching attendance records. Please try again later.",
        variant: "destructive",
      })
    }
  }
  useEffect(() => {
    fetchAttendanceManagerVerificationRecords();
  }, []);

  const postverficiationCall = async (attendanceId: string, verificationStatus: AttendanceVerificationStatus) => {
    try {
        const response = await axios.post(`${APIDictionary.attendance}/manager/verification`, {
            userId:user?.id,
            attendanceId,
            verificationStatus,
        }, {
            withCredentials: true,
        });
        if (response.data) {
            fetchAttendanceManagerVerificationRecords();
            toast({
            title: "Attendance record verified",
            description: "The attendance record has been successfully verified.",
            variant: "default",
            })
        }
        }
        catch (error) {
            console.error("Failed to verify attendance record:", error);
            toast({
                title: "Failed to verify attendance record",
                description: "An error occurred while verifying the attendance record. Please try again later.",
                variant: "destructive",
            })
        }
    }
  const verifyAttendance = (id: string, status: AttendanceVerificationStatus, notes: string) => {
    postverficiationCall(id, status)
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
        .forEach((record) => postverficiationCall(record.id, status));
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
  };



  const deselectAllRecords = () => {
    setSelectedRecordIds([]);
  };

  // Get unique users from records
  const uniqueUsers = Array.from(new Set(records.map(record => record.userId)))
    .map(userId => {
      const user = records.find(record => record.userId === userId)?.user;
      return user ? { id: user.id, name: user.name } : null;
    })
    .filter((user): user is { id: string; name: string } => user !== null);

  const filteredRecords = records.filter((record) => {
    // Filter by date range
    const recordDate = new Date(record.date);
    const isInDateRange = recordDate >= startDate && recordDate <= endDate;
    
    // Filter by user
    const userMatch = selectedUsers.length === 0 || selectedUsers.includes(record.userId);
    
    // Filter by status
    const statusMatch = statusFilter === "all" || record.status === statusFilter;
    
    // Filter by verification status
    const verificationMatch = 
      verificationFilter === "all" || 
      record.verificationStatus === verificationFilter;
    
    return isInDateRange && userMatch && statusMatch && verificationMatch;
  });

  // Group records by date and user
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
    <div className="container mx-auto py-8 overflow-y-scroll h-full">
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
                                      />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {index === 0 ? (
                                        <>
                                          <div>{record.user.name}</div>
                                          <div className="text-xs text-gray-500">{record.user.department}</div>
                                        </>
                                      ) : (
                                        <div className="w-4 h-4 bg-gray-300 rounded-full mx-auto"></div>
                                      )}
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
                                          title="Quick Verify"
                                        >
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => verifyAttendance(record.id, "REJECTED", record.notes || "")}
                                          title="Quick Reject"
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

      {/* Details Dialog */}
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
                    <LocationMap location={selectedRecord.checkInLocation} />
                    <div className="mt-2 text-sm text-gray-500">
                      {selectedRecord.checkInLocation.address || "No address information"}
                    </div>
                  </TabsContent>
                  <TabsContent value="checkout">
                    <LocationMap location={selectedRecord.checkOutLocation} />
                    <div className="mt-2 text-sm text-gray-500">
                      {selectedRecord.checkOutLocation?.address || "No checkout location recorded"}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

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
                  >
                    Reject
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => verifyAttendance(selectedRecord.id, "VERIFIED", managerNotes)}
                  >
                    Verify
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