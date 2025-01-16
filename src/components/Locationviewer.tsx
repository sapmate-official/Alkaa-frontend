import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

const LocationViewer = ({ lat, lon }:{lat:string,lon:string}) => {
  const [address, setAddress] = useState("");
  console.log(lat,lon);
  

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
    <div className="rounded-lg overflow-hidden border" 
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

    </div>
  );
};

export default LocationViewer;