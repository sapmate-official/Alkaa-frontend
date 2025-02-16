import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { APIDictionary } from '../../api/APIdict';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Permission {
    id: string;
    name: string;
    description: string;
    module: string;
    action: string;
}
// First, add this predefined permissions array at the top of the file, after the imports

// const predefinedPermissions = [
//     // Department Management
//     { name: 'department.create', description: 'Create departments', module: 'Department', action: 'Create' },
//     { name: 'department.read', description: 'View departments', module: 'Department', action: 'Read' },
//     { name: 'department.update', description: 'Update departments', module: 'Department', action: 'Update' },
//     { name: 'department.delete', description: 'Delete departments', module: 'Department', action: 'Delete' },
//     { name: 'department.assign_users', description: 'Assign users to departments', module: 'Department', action: 'Assign' },

//     // Leave Management
//     { name: 'leave.create_types', description: 'Create leave types', module: 'Leave', action: 'Create Types' },
//     { name: 'leave.read_types', description: 'View leave types', module: 'Leave', action: 'Read Types' },
//     { name: 'leave.update_types', description: 'Update leave types', module: 'Leave', action: 'Update Types' },
//     { name: 'leave.delete_types', description: 'Delete leave types', module: 'Leave', action: 'Delete Types' },
//     { name: 'leave.request', description: 'Request leave', module: 'Leave', action: 'Request' },
//     { name: 'leave.approve', description: 'Approve leave requests', module: 'Leave', action: 'Approve' },
//     { name: 'leave.reject', description: 'Reject leave requests', module: 'Leave', action: 'Reject' },
//     { name: 'leave.view_team_leaves', description: 'View team leave requests', module: 'Leave', action: 'View Team' },
//     { name: 'leave.view_all_leaves', description: 'View all leave requests', module: 'Leave', action: 'View All' },
//     { name: 'leave.manage_balances', description: 'Manage leave balances', module: 'Leave', action: 'Manage Balances' },

//     // Attendance Management
//     { name: 'attendance.mark', description: 'Mark attendance', module: 'Attendance', action: 'Mark' },
//     { name: 'attendance.view_own', description: 'View own attendance', module: 'Attendance', action: 'View Own' },
//     { name: 'attendance.view_team', description: 'View team attendance', module: 'Attendance', action: 'View Team' },
//     { name: 'attendance.view_all', description: 'View all attendance records', module: 'Attendance', action: 'View All' },
//     { name: 'attendance.modify', description: 'Modify attendance records', module: 'Attendance', action: 'Modify' },
//     { name: 'attendance.generate_reports', description: 'Generate attendance reports', module: 'Attendance', action: 'Reports' },

//     // Payroll Management
//     { name: 'payroll.view_own', description: 'View own payroll', module: 'Payroll', action: 'View Own' },
//     { name: 'payroll.view_team', description: 'View team payroll', module: 'Payroll', action: 'View Team' },
//     { name: 'payroll.view_all', description: 'View all payroll records', module: 'Payroll', action: 'View All' },
//     { name: 'payroll.process', description: 'Process payroll', module: 'Payroll', action: 'Process' },
//     { name: 'payroll.approve', description: 'Approve payroll', module: 'Payroll', action: 'Approve' },
//     { name: 'payroll.generate_reports', description: 'Generate payroll reports', module: 'Payroll', action: 'Reports' },

//     // Bank Details
//     { name: 'bank.create', description: 'Create bank details', module: 'Bank', action: 'Create' },
//     { name: 'bank.read_own', description: 'View own bank details', module: 'Bank', action: 'Read Own' },
//     { name: 'bank.read_all', description: 'View all bank details', module: 'Bank', action: 'Read All' },
//     { name: 'bank.update', description: 'Update bank details', module: 'Bank', action: 'Update' },
//     { name: 'bank.delete', description: 'Delete bank details', module: 'Bank', action: 'Delete' },

//     // Holiday Management
//     { name: 'holiday.create', description: 'Create holidays', module: 'Holiday', action: 'Create' },
//     { name: 'holiday.read', description: 'View holidays', module: 'Holiday', action: 'Read' },
//     { name: 'holiday.update', description: 'Update holidays', module: 'Holiday', action: 'Update' },
//     { name: 'holiday.delete', description: 'Delete holidays', module: 'Holiday', action: 'Delete' },

//     // Notification Management
//     { name: 'notification.create_template', description: 'Create notification templates', module: 'Notification', action: 'Create Template' },
//     { name: 'notification.read_template', description: 'View notification templates', module: 'Notification', action: 'Read Template' },
//     { name: 'notification.update_template', description: 'Update notification templates', module: 'Notification', action: 'Update Template' },
//     { name: 'notification.delete_template', description: 'Delete notification templates', module: 'Notification', action: 'Delete Template' },
//     { name: 'notification.send', description: 'Send notifications', module: 'Notification', action: 'Send' },

//     // Organization Settings
//     { name: 'org.manage_settings', description: 'Manage organization settings', module: 'Organization', action: 'Manage Settings' },
//     { name: 'org.view_settings', description: 'View organization settings', module: 'Organization', action: 'View Settings' },
//     { name: 'org.manage_subscription', description: 'Manage organization subscription', module: 'Organization', action: 'Manage Subscription' },
// ];
const PermissionCreate = () => {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        module: '',
        action: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchPermissions = async () => {
        try {
            const response = await axios.get(APIDictionary.Permission);
            setPermissions(response.data);
        } catch (err) {
            setError('Failed to fetch permissions');
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post(APIDictionary.Permission, formData);
            setFormData({ name: '', description: '', module: '', action: '' });
            fetchPermissions(); // Refresh the list
        } catch (err) {
            setError('Failed to create permission');
        } finally {
            setLoading(false);
        }
    };
    // Add this function inside the PermissionCreate component
    // const handleBulkCreate = async () => {
    //     setLoading(true);
    //     setError('');

    //     try {
    //         for (const permission of predefinedPermissions) {
    //             await axios.post(APIDictionary.Permission, permission);
    //         }
    //         fetchPermissions(); // Refresh the list after creating all permissions
    //     } catch (err) {
    //         setError('Failed to create some permissions');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    return (
        <div className="p-4 w-full">
            <h2 className="text-2xl font-bold mb-4">Permission Management</h2>
            <div className='flex justify-center'>

                {/* Create Permission Form */}
                <div className="bg-white p-4 rounded-lg shadow mb-6 w-full">
                    <h3 className="text-xl font-semibold mb-4">Create New Permission</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-2">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Module</label>
                                <input
                                    type="text"
                                    name="module"
                                    value={formData.module}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Action</label>
                                <input
                                    type="text"
                                    name="action"
                                    value={formData.action}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                        </div>
                        {error && <p className="text-red-500 mt-2">{error}</p>}
                        <div className='flex gap-5 justify-start'>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                            >
                                {loading ? 'Creating...' : 'Create Permission'}
                            </button>

                        </div>
                    </form>
                </div>

                {/* Permissions List */}
                    <div className="bg-white p-4 rounded-lg shadow ">
                        <h3 className="text-xl font-semibold mb-4">Existing Permissions</h3>
                <ScrollArea className='h-screen'>
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="px-4 py-2">Name</th>
                                        <th className="px-4 py-2">Module</th>
                                        <th className="px-4 py-2">Action</th>
                                        <th className="px-4 py-2">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {permissions.map((permission) => (
                                        <tr key={permission.id} className="border-b">
                                            <td className="px-4 py-2">{permission.name}</td>
                                            <td className="px-4 py-2">{permission.module}</td>
                                            <td className="px-4 py-2">{permission.action}</td>
                                            <td className="px-4 py-2">{permission.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                </ScrollArea>
                    </div>

            </div>

        </div>
    );
};

export default PermissionCreate;