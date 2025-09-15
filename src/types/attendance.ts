export interface Duration {
    hours: number;
    minutes: number;
    totalMinutes: number;
}

export interface AttendanceSession {
    id: string;
    userId: string;
    date: string;
    sessionNumber: number;
    checkInTime: string;
    checkOutTime: string;
    checkInLocation: string;
    checkOutLocation: string;
    status: string;
    notes: string;
    duration: Duration;
    ipAddress: string;
    deviceInfo: string;
    createdAt: string;
    updatedAt: string;
}
