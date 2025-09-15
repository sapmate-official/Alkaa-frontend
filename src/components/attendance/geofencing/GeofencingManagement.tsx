import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { MapPin, Plus, Edit, Trash2, CheckCircle, Clock, Navigation } from 'lucide-react';
import { 
  useGeofences, 
  useCreateGeofence, 
  useUpdateGeofence, 
  useDeleteGeofence,
  useValidateLocation,
  useLocationPermission
} from '../../../hooks/useAttendance';
import { Geofence, CreateGeofenceRequest, ValidateLocationRequest } from '../../../interface/attendance';

interface GeofencingManagementProps {
  orgId: string;
}

const GeofencingManagement: React.FC<GeofencingManagementProps> = ({ orgId }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
  const [testLocation, setTestLocation] = useState({ latitude: '', longitude: '' });
  const [newGeofence, setNewGeofence] = useState<CreateGeofenceRequest>({
    name: '',
    description: '',
    type: 'OFFICE',
    latitude: 0,
    longitude: 0,
    radius: 100,
    isActive: true
  });

  const { data: geofencesData, isLoading } = useGeofences(orgId);
  const createGeofenceMutation = useCreateGeofence(orgId);
  const updateGeofenceMutation = useUpdateGeofence(orgId);
  const deleteGeofenceMutation = useDeleteGeofence(orgId);
  const validateLocationMutation = useValidateLocation(orgId);
  const { getCurrentLocation, hasPermission } = useLocationPermission();

  const geofences = geofencesData?.data || [];

  const handleCreateGeofence = async () => {
    try {
      await createGeofenceMutation.mutateAsync(newGeofence);
      setIsCreating(false);
      setNewGeofence({
        name: '',
        description: '',
        type: 'OFFICE',
        latitude: 0,
        longitude: 0,
        radius: 100,
        isActive: true
      });
    } catch (error) {
      console.error('Failed to create geofence:', error);
    }
  };

  const handleUpdateGeofence = async () => {
    if (!editingGeofence) return;
    
    try {
      await updateGeofenceMutation.mutateAsync({
        geofenceId: editingGeofence.id,
        updates: newGeofence
      });
      setEditingGeofence(null);
    } catch (error) {
      console.error('Failed to update geofence:', error);
    }
  };

  const handleDeleteGeofence = async (geofenceId: string) => {
    if (window.confirm('Are you sure you want to delete this geofence?')) {
      try {
        await deleteGeofenceMutation.mutateAsync(geofenceId);
      } catch (error) {
        console.error('Failed to delete geofence:', error);
      }
    }
  };

  const handleEditGeofence = (geofence: Geofence) => {
    setEditingGeofence(geofence);
    setNewGeofence({
      name: geofence.name,
      description: geofence.description || '',
      type: geofence.type,
      latitude: geofence.latitude,
      longitude: geofence.longitude,
      radius: geofence.radius,
      isActive: geofence.isActive
    });
    setIsCreating(true);
  };

  const handleUseCurrentLocation = async () => {
    if (!hasPermission) {
      alert('Location permission is required to use current location');
      return;
    }

    try {
      const position = await getCurrentLocation();
      setNewGeofence({
        ...newGeofence,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    } catch (error) {
      console.error('Failed to get current location:', error);
      alert('Failed to get current location');
    }
  };

  const handleTestLocation = async () => {
    const lat = parseFloat(testLocation.latitude);
    const lng = parseFloat(testLocation.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid coordinates');
      return;
    }

    try {
      const request: ValidateLocationRequest = {
        latitude: lat,
        longitude: lng
      };
      
      const result = await validateLocationMutation.mutateAsync(request);
      console.log('Validation result:', result);
    } catch (error) {
      console.error('Failed to validate location:', error);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'OFFICE': 'bg-blue-100 text-blue-800',
      'BRANCH': 'bg-green-100 text-green-800',
      'WORKSITE': 'bg-purple-100 text-purple-800',
      'CLIENT_LOCATION': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Geofencing Management</h2>
          <p className="text-gray-600">Configure location-based attendance zones</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Geofence
        </Button>
      </div>

      {/* Create/Edit Geofence Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingGeofence ? 'Edit Geofence' : 'Create New Geofence'}
            </CardTitle>
            <CardDescription>
              Define a geographical boundary for attendance tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newGeofence.name}
                  onChange={(e) => setNewGeofence({...newGeofence, name: e.target.value})}
                  placeholder="Enter geofence name"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={newGeofence.type} 
                  onValueChange={(value) => setNewGeofence({...newGeofence, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFFICE">Office</SelectItem>
                    <SelectItem value="BRANCH">Branch</SelectItem>
                    <SelectItem value="WORKSITE">Worksite</SelectItem>
                    <SelectItem value="CLIENT_LOCATION">Client Location</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newGeofence.description}
                onChange={(e) => setNewGeofence({...newGeofence, description: e.target.value})}
                placeholder="Optional description"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={newGeofence.latitude}
                  onChange={(e) => setNewGeofence({
                    ...newGeofence,
                    latitude: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={newGeofence.longitude}
                  onChange={(e) => setNewGeofence({
                    ...newGeofence,
                    longitude: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div>
                <Label htmlFor="radius">Radius (meters)</Label>
                <Input
                  id="radius"
                  type="number"
                  value={newGeofence.radius}
                  onChange={(e) => setNewGeofence({
                    ...newGeofence,
                    radius: parseInt(e.target.value) || 100
                  })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={handleUseCurrentLocation}
                disabled={!hasPermission}
                className="flex items-center gap-2"
              >
                <Navigation className="h-4 w-4" />
                Use Current Location
              </Button>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={newGeofence.isActive}
                  onCheckedChange={(checked) => setNewGeofence({...newGeofence, isActive: checked})}
                />
                <Label>Active</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreating(false);
                  setEditingGeofence(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={editingGeofence ? handleUpdateGeofence : handleCreateGeofence}
                disabled={!newGeofence.name || createGeofenceMutation.isPending || updateGeofenceMutation.isPending}
              >
                {editingGeofence ? 'Update' : 'Create'} Geofence
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Test Location Validation</CardTitle>
          <CardDescription>
            Test if coordinates are within any geofence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="test-lat">Test Latitude</Label>
              <Input
                id="test-lat"
                type="number"
                step="any"
                value={testLocation.latitude}
                onChange={(e) => setTestLocation({...testLocation, latitude: e.target.value})}
                placeholder="Enter latitude"
              />
            </div>
            <div>
              <Label htmlFor="test-lng">Test Longitude</Label>
              <Input
                id="test-lng"
                type="number"
                step="any"
                value={testLocation.longitude}
                onChange={(e) => setTestLocation({...testLocation, longitude: e.target.value})}
                placeholder="Enter longitude"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleTestLocation}
                disabled={validateLocationMutation.isPending}
                className="w-full"
              >
                Test Location
              </Button>
            </div>
          </div>

          {validateLocationMutation.data && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Validation Result: {validateLocationMutation.data.data.isValid ? 'Valid' : 'Invalid'} location
                {validateLocationMutation.data.data.geofences?.length > 0 && (
                  <span> - Found {validateLocationMutation.data.data.geofences.length} nearby geofence(s)</span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Geofences List */}
      <div className="grid gap-4">
        {geofences.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No geofences configured</h3>
                <p className="text-gray-500">Create your first geofence to enable location-based attendance</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          geofences.map((geofence: Geofence) => (
            <Card key={geofence.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={getTypeColor(geofence.type)}>
                      {geofence.type}
                    </Badge>
                    <div>
                      <CardTitle className="text-lg">{geofence.name}</CardTitle>
                      {geofence.description && (
                        <CardDescription>{geofence.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditGeofence(geofence)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteGeofence(geofence.id)}
                      disabled={deleteGeofenceMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Coordinates:</span>
                    <div className="font-mono">
                      {geofence.latitude.toFixed(6)}, {geofence.longitude.toFixed(6)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Radius:</span>
                    <div>{geofence.radius} meters</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <div className="flex items-center space-x-1">
                      {geofence.isActive ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-400">Inactive</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <div>{new Date(geofence.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default GeofencingManagement;
