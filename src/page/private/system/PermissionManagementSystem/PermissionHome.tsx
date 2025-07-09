import { APIDictionary } from '@/api/v2/APIdict';
import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Permission } from '@/interface/general';
import RouteDict from '@/routes/RouteDict';
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
                <Button 
                    onClick={() => onClick(RouteDict.Permission.Create)}
                >
                    Create Permission
                </Button>
            </div>

            <ScrollArea className="h-screen">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Module</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Created At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {permissions?.map((permission) => (
                            <TableRow key={permission?.id}>
                                <TableCell>{permission?.name}</TableCell>
                                <TableCell>{permission?.module}</TableCell>
                                <TableCell>{permission?.action}</TableCell>
                                <TableCell>{permission?.description || '-'}</TableCell>
                                <TableCell>
                                    {new Date(permission?.createdAt).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))}
                        {permissions?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">
                                    No permissions found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    )
}

export default PermissionHome