import { APIDictionary } from '@/api/APIdict';
import Loader from '@/components/Loader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Permission } from '@/interface/general';
import axios from 'axios';
import React from 'react'
import { useNavigate } from 'react-router-dom';

const PermissionHome = () => {
    const [permissions, setPermissions] = React.useState<Permission[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const navigate = useNavigate();

    const fetchAllPermissions = async () => {   
        try {
            const response = await axios.get(APIDictionary.Permission, { withCredentials: true });
            const data = response.data;
            setPermissions(data);
        } catch (error) {
            console.error("Error fetching permissions", error);
        } finally {
            setIsLoading(false);
        }
    }

    React.useEffect(() => {
        fetchAllPermissions();
    }, [])

    const onClick = (href: string) => {
        navigate(href)
    }

    if (isLoading) {
        return <Loader/>
    }

    return (
        <div className="p-4 w-full">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Permission Management</h1>
                <button 
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => onClick('/p/permission/create')}
                >
                    Create Permission
                </button>
            </div>

<ScrollArea className='h-screen'>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 border-b text-left">Name</th>
                            <th className="px-6 py-3 border-b text-left">Module</th>
                            <th className="px-6 py-3 border-b text-left">Action</th>
                            <th className="px-6 py-3 border-b text-left">Description</th>
                            <th className="px-6 py-3 border-b text-left">Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {permissions.map((permission) => (
                            <tr key={permission.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 border-b">{permission.name}</td>
                                <td className="px-6 py-4 border-b">{permission.module}</td>
                                <td className="px-6 py-4 border-b">{permission.action}</td>
                                <td className="px-6 py-4 border-b">{permission.description || '-'}</td>
                                <td className="px-6 py-4 border-b">
                                    {new Date(permission.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {permissions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center">
                                    No permissions found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
</ScrollArea>

        </div>
    )
}

export default PermissionHome