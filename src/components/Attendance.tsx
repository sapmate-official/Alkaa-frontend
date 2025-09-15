import { useState, useEffect } from "react";
import { MapPin, Clock, XCircle, History } from "lucide-react";
import LazyLocationViewer from "./LazyLocationViewer";
import { useTodaySessionsQuery, useCheckInMutation, useCheckOutMutation } from '@/hooks/queries/useAttendance';

interface Location {
  lat: number | null;
  lon: number | null;
}

const LocationComponent = () => {
  // const { user } = useAuth();
  const [location, setLocation] = useState<Location>({ lat: null, lon: null });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Use TanStack Query hooks
  const { data: todaySessions, refetch: refetchSessions } = useTodaySessionsQuery();
  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();

  // Calculate derived state from query data
  const activeSession = todaySessions?.find(s => !s.checkOutTime) || null;
  const totalHoursToday = todaySessions ? 
    todaySessions.reduce((total: number, session: any) => {
      if (session.checkOutTime) {
        const checkIn = new Date(session.checkInTime).getTime();
        const checkOut = new Date(session.checkOutTime).getTime();
        return total + (checkOut - checkIn) / (1000 * 60);
      }
      return total;
    }, 0) / 60 : 0;

  useEffect(() => {
    // No longer needed since we're using TanStack Query
  }, []);

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation not supported");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.log(error);
          
          reject("Unable to get location. Please enable location services.");
        }
      );
    });
  };

  const handleAttendance = async () => {
    try {
      setLoading(true);
      setError("");

      const locationData = await getLocation();
      setLocation(locationData as Location);

      const currentDate = new Date();
      const payload = {
        date: currentDate.toISOString().split('T')[0],
        [activeSession ? 'checkOutTime' : 'checkInTime']: currentDate.toISOString(),
        [activeSession ? 'checkOutLocation' : 'checkInLocation']: locationData
      };

      // Use TanStack Query mutations instead of direct axios calls
      if (activeSession) {
        await checkOutMutation.mutateAsync(payload);
      } else {
        await checkInMutation.mutateAsync(payload);
      }

      // Refetch sessions after successful check-in/out
      refetchSessions();

    } catch (err:any) {
      setError(err.response?.data?.message || err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  interface DurationFormatter {
    (minutes: number): string;
  }

  const formatDuration: DurationFormatter = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="p-6 rounded-lg shadow-lg w-full bg-card border">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary">
            Attendance Tracker
          </h2>
          <Clock className="w-6 h-6 text-primary" />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded bg-destructive/10 text-destructive">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Location Display */}
        <div className="flex items-center gap-2 p-3 rounded bg-secondary">
          <MapPin className="w-5 h-5 text-primary" />
          {location.lat && location.lon && (
            // <LocationViewer lat={location.lat.toString()} lon={location.lon.toString()} />
            <LazyLocationViewer lat={location.lat.toString()} lon={location.lon.toString()} />
          )}
        </div>

        {/* Daily Summary */}
        <div className="flex items-center gap-2 p-3 rounded bg-muted">
          <History className="w-5 h-5 text-primary" />
          <span>Total work today: {formatDuration(totalHoursToday * 60)}</span>
        </div>

        {/* Sessions List */}
        {todaySessions && todaySessions.length > 0 && (
          <div className="mt-2 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Today's Sessions:</h3>
            {todaySessions.map((session: any, index: number) => (
              <div key={session.id} className="p-2 rounded bg-accent/20 text-sm">
                <div>Session {index + 1}:</div>
                <div>In: {new Date(session.checkInTime).toLocaleTimeString()}</div>
                {session.checkOutTime && (
                  <div>Out: {new Date(session.checkOutTime).toLocaleTimeString()}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleAttendance}
          disabled={loading}
          className="flex items-center justify-center gap-2 p-4 rounded-md transition-all duration-200 disabled:opacity-50"
          style={{ 
            background: loading 
              ? 'hsl(var(--muted))' 
              : activeSession 
                ? 'hsl(var(--destructive))' 
                : 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))'
          }}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-t-2 border-b-2 rounded-full animate-spin border-primary-foreground" />
              <span>Processing...</span>
            </div>
          ) : (
            <>
              {activeSession ? 'Check Out' : 'Check In'}
              <Clock className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LocationComponent;