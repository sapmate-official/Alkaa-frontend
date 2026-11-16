import { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

interface OlaMapInstance {
  on: (event: string, callback: () => void) => void;
  setCenter: (coords: [number, number]) => void;
  remove?: () => void;
  [key: string]: unknown;
}

interface OlaMarkerInstance {
  setLngLat: (coords: [number, number]) => OlaMarkerInstance;
  addTo: (map: OlaMapInstance) => OlaMarkerInstance;
  remove?: () => void;
  [key: string]: unknown;
}

const LocationViewer = ({ lat, lon }: { lat: string, lon: string }) => {
  const [address, setAddress] = useState("");
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<OlaMapInstance | null>(null);
  const markerRef = useRef<OlaMarkerInstance | null>(null);
  
  useEffect(() => {
    if (lat && lon && mapRef.current && !mapInstanceRef.current) {
      // Load both the map library and create the instance only when needed
      import("../services/OlaMap").then(async ({ createOlaMaps }) => {
        const olaMaps = createOlaMaps();
        
        // Initialize map
        const map = await olaMaps.init({
          style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
          container: 'map',
          center: [parseFloat(lon), parseFloat(lat)],
          zoom: 15,
        });
        mapInstanceRef.current = map as unknown as OlaMapInstance;

        // Add a marker after map is initialized
        mapInstanceRef.current?.on('load', () => {
          if (!markerRef.current && mapInstanceRef.current) {
            markerRef.current = (olaMaps
              .addMarker({ 
                offset: [0, -15], 
                anchor: 'bottom', 
                color: '#FF5733' 
              })
              .setLngLat([parseFloat(lon), parseFloat(lat)])
              .addTo(mapInstanceRef.current)) as unknown as OlaMarkerInstance;
          }
        });
      });
    }
  }, [lat, lon]);
  
  // Update map center and marker position when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && lat && lon) {
      const coords: [number, number] = [parseFloat(lon), parseFloat(lat)];
      mapInstanceRef.current.setCenter(coords);
      
      // Update marker position if it exists
      if (markerRef.current) {
        markerRef.current.setLngLat(coords);
      }
    }
  }, [lat, lon]);

  useEffect(() => {
    if (lat && lon) {
      // Reverse geocoding using Nominatim API
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(res => res.json())
        .then(data => setAddress(data.display_name))
        .catch(() => setAddress("Unable to fetch address"));
    }
  }, [lat, lon]);

  return (
    <div className={`rounded-lg overflow-hidden border `}
         style={{ borderColor: 'hsl(var(--border))' }}>
      <div className="p-4 bg-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
          <h3 className="font-medium">Current Location</h3>
        </div>
        
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <span className="font-medium">Latitude:</span> 
            <span>{parseFloat(lat)?.toFixed(6) || 'N/A'}</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="font-medium">Longitude:</span>
            <span>{parseFloat(lon)?.toFixed(6) || 'N/A'}</span>
          </p>
          <p className="text-xs mt-2 break-words">
            {address || 'Fetching address...'}
          </p>
        </div>
      </div>
      
      {/* Map container */}
      <div 
        id="map" 
        ref={mapRef} 
        className="w-full h-64"
        style={{ minHeight: '250px' }}
      />
    </div>
  );
};

export default LocationViewer;