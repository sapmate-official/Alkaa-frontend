import { backendDomain } from './constant/Domain';

export const APIDictionary = {
    setPassword: `${backendDomain}/api/v1/general/set-password`,
    leaveTypeList: `${backendDomain}/api/v1/leave/type`,
    list_of_leave_manager: `${backendDomain}/api/v1/manager/list-of-leave`,
    list_of_leave_employee: `${backendDomain}/api/v1/employee/list-of-leave`,
    leaveRequest: `${backendDomain}/api/v1/employee/leave/apply`,
    respondLeaveRequest: `${backendDomain}/api/v1/manager/respond-leave`,
    leaveTypeCreate: `${backendDomain}/api/v1/manager/leave-type/create`,
    leaveBalance:`${backendDomain}/api/v1/employee/leave-balance`,
    employee_list:`${backendDomain}/api/v1/manager/employee-list`,
    create_employee:`${backendDomain}/api/v1/employee/register`,
    checkIn:`${backendDomain}/api/v1/attendance/check-in`,
    checkOut:`${backendDomain}/api/v1/attendance/check-out`,
    todaySessions:`${backendDomain}/api/v1/attendance/session/`,
    attendanceHistory:`${backendDomain}/api/v1/attendance/history`,
};