import { useState, useEffect } from 'react';

export const useDeviceInfo = () => {
  return {
    deviceInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
    },
  };
};

export const useIpAddress = () => {
  const [ipAddress, setIpAddress] = useState<string>('');

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then((response) => response.json())
      .then((data) => setIpAddress(data.ip));
  }, []);

  return { ipAddress };
};

export const useGeolocation = () => {
  const [location, setLocation] = useState<{latitude: number; longitude: number} | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      });
    }
  }, []);

  return { location };
};