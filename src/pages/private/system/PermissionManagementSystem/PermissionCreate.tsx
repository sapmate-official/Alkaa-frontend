import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RouteDict from '@/routes/RouteDict';
import { usePermissions, useCreatePermission } from '@/hooks/queries/usePermissions';

const PermissionCreate = () => {
    const navigate = useNavigate();
    const { data: permissions = [] } = usePermissions();
    const createPermissionMutation = useCreatePermission();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        module: '',
        action: ''
    });
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await createPermissionMutation.mutateAsync({
                name: formData.name,
                description: formData.description || undefined,
                module: formData.module || undefined,
                action: formData.action
            });
            setFormData({
                name: '',
                description: '',
                module: '',
                action: ''
            });
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
            setError(errorObj.response?.data?.message || errorObj.message || 'Failed to create permission');
        }
    };

    const loading = createPermissionMutation.isPending;

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Permission</h1>
                    <p className="text-sm text-muted-foreground">Define new capability and access boundaries</p>
                </div>
                <Button 
                    variant="outline"
                    onClick={() => navigate(RouteDict.Permission.Base)}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Permissions
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Card */}
                <Card className="lg:col-span-5 border border-border shadow-xs">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Permission Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    name="name"
                                    placeholder="e.g. employee.read"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="module">Module</Label>
                                    <Input
                                        id="module"
                                        type="text"
                                        name="module"
                                        placeholder="e.g. Employee"
                                        value={formData.module}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="action">Action</Label>
                                    <Input
                                        id="action"
                                        type="text"
                                        name="action"
                                        placeholder="e.g. Read"
                                        value={formData.action}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Describe what this permission permits"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    required
                                />
                            </div>

                            {error && <p className="text-xs text-destructive">{error}</p>}

                            <Button type="submit" disabled={loading} className="w-full">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Creating...' : 'Create Permission'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Existing Permissions List */}
                <Card className="lg:col-span-7 border border-border shadow-xs overflow-hidden flex flex-col">
                    <CardHeader className="border-b border-border py-4">
                        <CardTitle className="text-base font-semibold">Existing Permissions ({permissions.length})</CardTitle>
                    </CardHeader>
                    <div className="flex-1 overflow-x-auto max-h-[500px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Module</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {permissions.map((permission) => (
                                    <TableRow key={permission.id} className="hover:bg-muted/50">
                                        <TableCell className="font-mono text-xs">{permission.name}</TableCell>
                                        <TableCell>{permission.module}</TableCell>
                                        <TableCell>{permission.action}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">{permission.description}</TableCell>
                                    </TableRow>
                                ))}
                                {permissions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            No permissions found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PermissionCreate;
