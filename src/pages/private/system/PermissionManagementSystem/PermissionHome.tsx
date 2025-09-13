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
import RouteDict from '@/routes/RouteDict';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions'

const PermissionHome = () => {
    const navigate = useNavigate();
    const { data: permissions, isLoading } = usePermissions()

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