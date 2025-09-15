import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Coffee, Play, Square, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { 
  useActiveBreak, 
  useStartBreak, 
  useEndBreak, 
  useBreakHistory, 
  useBreakTimer, 
  useLocationPermission 
} from '../../../hooks/useAttendance';
import { BreakRecord, StartBreakRequest } from '../../../types/attendance';

interface BreakManagementProps {
  userId: string;
}

const BreakManagement: React.FC<BreakManagementProps> = ({ userId }) => {
  const [selectedBreakType, setSelectedBreakType] = useState<string>('REGULAR');
  const [showHistory, setShowHistory] = useState(false);

  const { data: activeBreakData } = useActiveBreak(userId);
  const { data: breakHistoryData } = useBreakHistory(userId, {
    fromDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 7 days
    toDate: new Date().toISOString().split('T')[0]
  });

  const startBreakMutation = useStartBreak(userId);
  const endBreakMutation = useEndBreak(userId);
  const { getCurrentLocation, hasPermission } = useLocationPermission();

  const activeBreak = activeBreakData?.data || null;
  const { formatTime, isOnBreak } = useBreakTimer(activeBreak);
  const breakHistory = breakHistoryData?.data?.breaks || [];

  const handleStartBreak = async () => {
    try {
      let location;
      if (hasPermission) {
        try {
          const position = await getCurrentLocation();
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (error) {
          console.warn('Could not get location:', error);
        }
      }

      const breakRequest: StartBreakRequest = {
        breakType: selectedBreakType,
        location
      };

      await startBreakMutation.mutateAsync(breakRequest);
    } catch (error) {
      console.error('Failed to start break:', error);
    }
  };

  const handleEndBreak = async () => {
    if (!activeBreak) return;

    try {
      let location;
      if (hasPermission) {
        try {
          const position = await getCurrentLocation();
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (error) {
          console.warn('Could not get location:', error);
        }
      }

      await endBreakMutation.mutateAsync({
        breakId: activeBreak.id,
        location
      });
    } catch (error) {
      console.error('Failed to end break:', error);
    }
  };

  const getBreakTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'LUNCH': 'Lunch Break',
      'TEA': 'Tea Break',
      'REGULAR': 'Regular Break',
      'EMERGENCY': 'Emergency Break',
      'PERSONAL': 'Personal Break'
    };
    return labels[type] || type;
  };

  const getBreakTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'LUNCH': 'bg-green-100 text-green-800',
      'TEA': 'bg-yellow-100 text-yellow-800',
      'REGULAR': 'bg-blue-100 text-blue-800',
      'EMERGENCY': 'bg-red-100 text-red-800',
      'PERSONAL': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Break Management</h2>
          <p className="text-gray-600">Manage your break times and track break history</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? 'Hide History' : 'View History'}
        </Button>
      </div>

      {/* Current Break Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            Break Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isOnBreak ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge className={getBreakTypeColor(activeBreak!.breakType)}>
                    {getBreakTypeLabel(activeBreak!.breakType)}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Started at {new Date(activeBreak!.startTime).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-2xl font-mono font-bold">
                    {formatTime.formatted}
                  </span>
                </div>
              </div>

              {activeBreak?.startLocation && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>
                    Location tracked: {activeBreak.startLocation.latitude.toFixed(4)}, {activeBreak.startLocation.longitude.toFixed(4)}
                  </span>
                </div>
              )}

              {activeBreak?.hasViolation && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Break violation detected: {activeBreak.violationReason}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleEndBreak} 
                disabled={endBreakMutation.isPending}
                className="w-full"
                variant="destructive"
              >
                <Square className="h-4 w-4 mr-2" />
                {endBreakMutation.isPending ? 'Ending Break...' : 'End Break'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active break</h3>
                <p className="text-gray-500">Select a break type to start your break</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Break Type
                  </label>
                  <Select value={selectedBreakType} onValueChange={setSelectedBreakType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select break type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LUNCH">Lunch Break</SelectItem>
                      <SelectItem value="TEA">Tea Break</SelectItem>
                      <SelectItem value="REGULAR">Regular Break</SelectItem>
                      <SelectItem value="EMERGENCY">Emergency Break</SelectItem>
                      <SelectItem value="PERSONAL">Personal Break</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleStartBreak} 
                  disabled={startBreakMutation.isPending}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {startBreakMutation.isPending ? 'Starting Break...' : 'Start Break'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Break History */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Break History</CardTitle>
            <CardDescription>Your break activity from the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {breakHistory.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent breaks</h3>
                <p className="text-gray-500">Your break history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {breakHistory.map((breakRecord: BreakRecord) => (
                  <div 
                    key={breakRecord.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge className={getBreakTypeColor(breakRecord.breakType)}>
                        {getBreakTypeLabel(breakRecord.breakType)}
                      </Badge>
                      <div>
                        <div className="text-sm font-medium">
                          {new Date(breakRecord.startTime).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(breakRecord.startTime).toLocaleTimeString()} - {' '}
                          {breakRecord.endTime 
                            ? new Date(breakRecord.endTime).toLocaleTimeString()
                            : 'Ongoing'
                          }
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {breakRecord.duration && (
                        <span className="text-sm font-medium">
                          {formatDuration(breakRecord.duration)}
                        </span>
                      )}
                      {breakRecord.hasViolation && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      {breakRecord.forcedEndBy && (
                        <Badge variant="outline" className="text-xs">
                          Force Ended
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BreakManagement;
