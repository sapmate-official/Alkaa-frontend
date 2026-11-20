import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
        <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Permission Management</h1>
                    <p className="text-sm text-muted-foreground">System-level permissions and capabilities</p>
                </div>
                <Button 
                    onClick={() => onClick(RouteDict.Permission.Create)}
                >
                    Create Permission
                </Button>
            </div>

            <Card className="border border-border shadow-xs overflow-hidden">
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
                            <TableRow key={permission?.id} className="hover:bg-muted/50">
                                <TableCell className="font-mono text-xs">{permission?.name}</TableCell>
                                <TableCell>{permission?.module}</TableCell>
                                <TableCell>{permission?.action}</TableCell>
                                <TableCell className="text-muted-foreground">{permission?.description || '-'}</TableCell>
                                <TableCell className="tabular-nums text-xs text-muted-foreground">
                                    {new Date(permission?.createdAt).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))}
                        {permissions?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    No permissions found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}

export default PermissionHome;