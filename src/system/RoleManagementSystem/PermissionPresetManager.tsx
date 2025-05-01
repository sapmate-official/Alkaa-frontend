import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/services/AuthContext';
import { APIDictionary } from '@/api/v2/APIdict';
import { Permission } from '@/interface/general';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit, Plus } from 'lucide-react';

interface PermissionPreset {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

interface PermissionPresetManagerProps {
  permissions: Permission[];
  onSelectPreset: (permissionIds: string[]) => void;
}

const PermissionPresetManager: React.FC<PermissionPresetManagerProps> = ({
  permissions,
  onSelectPreset,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [presets, setPresets] = useState<PermissionPreset[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editingPreset, setEditingPreset] = useState<PermissionPreset | null>(null);
  const [isLoading, setIsLoading] = useState({
    fetch: false,
    create: false,
    update: false,
    delete: false,
  });

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    setIsLoading((prev) => ({ ...prev, fetch: true }));
    try {
      const response = await axios.get(`${APIDictionary.permissionPreset}/org/${user?.orgId}`);
      setPresets(response.data);
    } catch (error) {
      console.error('Error fetching presets:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch permission presets',
        variant: 'destructive',
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, fetch: false }));
    }
  };

  const handleCreatePreset = async () => {
    setIsLoading((prev) => ({ ...prev, create: true }));
    try {
      const newPreset = {
        name: newPresetName,
        description: newPresetDescription,
        orgId: user?.orgId,
        permissions: selectedPermissions,
      };

      await axios.post(APIDictionary.permissionPreset, newPreset);
      toast({
        title: 'Success',
        description: 'Permission preset created successfully',
      });
      fetchPresets();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating preset:', error);
      toast({
        title: 'Error',
        description: 'Failed to create permission preset',
        variant: 'destructive',
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleUpdatePreset = async () => {
    if (!editingPreset) return;
    
    setIsLoading((prev) => ({ ...prev, update: true }));
    try {
      const updatedPreset = {
        name: newPresetName,
        description: newPresetDescription,
        permissions: selectedPermissions,
      };

      await axios.put(`${APIDictionary.permissionPreset}/${editingPreset.id}`, updatedPreset);
      toast({
        title: 'Success',
        description: 'Permission preset updated successfully',
      });
      fetchPresets();
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error updating preset:', error);
      toast({
        title: 'Error',
        description: 'Failed to update permission preset',
        variant: 'destructive',
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, update: false }));
    }
  };

  const handleDeletePreset = async (id: string) => {
    setIsLoading((prev) => ({ ...prev, delete: true }));
    try {
      await axios.delete(`${APIDictionary.permissionPreset}/${id}`);
      toast({
        title: 'Success',
        description: 'Permission preset deleted successfully',
      });
      fetchPresets();
    } catch (error) {
      console.error('Error deleting preset:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete permission preset',
        variant: 'destructive',
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, delete: false }));
    }
  };

  const handleEditPreset = (preset: PermissionPreset) => {
    setEditingPreset(preset);
    setNewPresetName(preset.name);
    setNewPresetDescription(preset.description || '');
    setSelectedPermissions(preset.permissions);
    setIsEditDialogOpen(true);
  };

  const handleSelectPreset = (preset: PermissionPreset) => {
    onSelectPreset(preset.permissions);
    toast({
      title: 'Success',
      description: `Applied "${preset.name}" preset to role permissions`,
    });
  };

  const resetForm = () => {
    setNewPresetName('');
    setNewPresetDescription('');
    setSelectedPermissions([]);
    setEditingPreset(null);
  };

  const createDialogContent = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Permission Preset</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="preset-name">Preset Name</Label>
          <Input
            id="preset-name"
            placeholder="Enter preset name"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preset-description">Description (Optional)</Label>
          <Input
            id="preset-description"
            placeholder="Enter description"
            value={newPresetDescription}
            onChange={(e) => setNewPresetDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Select Permissions</Label>
          <div className="h-60 overflow-y-auto border rounded p-2 space-y-2">
            {permissions.map((permission) => (
              <div key={permission.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`perm-${permission.id}`}
                  checked={selectedPermissions.includes(permission.id)}
                  onCheckedChange={(checked) => {
                    setSelectedPermissions((prev) =>
                      checked
                        ? [...prev, permission.id]
                        : prev.filter((id) => id !== permission.id)
                    );
                  }}
                />
                <Label htmlFor={`perm-${permission.id}`}>{permission.name}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => {
            setIsCreateDialogOpen(false);
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreatePreset}
          disabled={!newPresetName || selectedPermissions.length === 0 || isLoading.create}
        >
          {isLoading.create ? 'Creating...' : 'Create Preset'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  const editDialogContent = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Permission Preset</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="preset-name">Preset Name</Label>
          <Input
            id="preset-name"
            placeholder="Enter preset name"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preset-description">Description (Optional)</Label>
          <Input
            id="preset-description"
            placeholder="Enter description"
            value={newPresetDescription}
            onChange={(e) => setNewPresetDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Select Permissions</Label>
          <div className="h-60 overflow-y-auto border rounded p-2 space-y-2">
            {permissions.map((permission) => (
              <div key={permission.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`perm-edit-${permission.id}`}
                  checked={selectedPermissions.includes(permission.id)}
                  onCheckedChange={(checked) => {
                    setSelectedPermissions((prev) =>
                      checked
                        ? [...prev, permission.id]
                        : prev.filter((id) => id !== permission.id)
                    );
                  }}
                />
                <Label htmlFor={`perm-edit-${permission.id}`}>{permission.name}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => {
            setIsEditDialogOpen(false);
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpdatePreset}
          disabled={!newPresetName || selectedPermissions.length === 0 || isLoading.update}
        >
          {isLoading.update ? 'Updating...' : 'Update Preset'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Permission Presets</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Create Preset
            </Button>
          </DialogTrigger>
          {createDialogContent}
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {presets.map((preset) => (
          <Card key={preset.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-md">{preset.name}</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditPreset(preset)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDeletePreset(preset.id)}
                    disabled={isLoading.delete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {preset.description && (
                <p className="text-sm text-muted-foreground mb-2">{preset.description}</p>
              )}
              <p className="text-sm mb-1">
                <span className="font-semibold">{preset.permissions.length}</span> permissions
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleSelectPreset(preset)}
              >
                Apply Preset
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        {editDialogContent}
      </Dialog>
    </div>
  );
};

export default PermissionPresetManager;