import { Suspense, lazy } from 'react';
import { Skeleton } from './ui/skeleton';

// Lazy load the map component
const LocationViewer = lazy(() => import('@/components/Locationviewer'));

interface LocationViewerProps {
  lat: string;
  lon: string;
}

const LazyLocationViewer = ({ lat, lon }: LocationViewerProps) => {
  return (
    <Suspense fallback={
      <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="p-4 bg-primary/5">
          <h3 className="font-medium mb-3">Current Location</h3>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="w-full h-64" />
      </div>
    }>
      <LocationViewer lat={lat} lon={lon} />
    </Suspense>
  );
};

export default LazyLocationViewer;