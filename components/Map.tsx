import React, { useEffect, useRef, useState } from 'react';
import { Property } from '../types';

interface MapProps {
  properties: Property[];
  onMarkerClick: (property: Property) => void;
  isSelectingLocation: boolean;
  onMapClick: (lat: number, lng: number) => void;
  center?: { lat: number; lng: number };
}

const Map: React.FC<MapProps> = ({ properties, onMarkerClick, isSelectingLocation, onMapClick, center }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [clusterer, setClusterer] = useState<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (map) return;

    const initMap = () => {
      const { kakao } = window;
      if (!kakao || !kakao.maps) {
        return false;
      }

      // Check if container exists
      if (!mapContainer.current) return false;

      kakao.maps.load(() => {
        const options = {
          center: new kakao.maps.LatLng(center?.lat || 37.5665, center?.lng || 126.9780),
          level: 8,
        };

        const newMap = new kakao.maps.Map(mapContainer.current, options);
        setMap(newMap);

        const newClusterer = new kakao.maps.MarkerClusterer({
          map: newMap,
          averageCenter: true,
          minLevel: 5,
        });
        setClusterer(newClusterer);
        setIsMapLoaded(true);
      });
      
      return true;
    };

    // Retry initialization until script is ready
    const timer = setInterval(() => {
      if (initMap()) {
        clearInterval(timer);
      }
    }, 100);

    // Timeout fallback (stop polling after 10s)
    const timeout = setTimeout(() => {
      clearInterval(timer);
    }, 10000);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [center, map]);

  // Update Markers & Clusterer
  useEffect(() => {
    if (!map || !clusterer || !window.kakao || !isMapLoaded) return;

    // Clear old markers
    clusterer.clear();

    const newMarkers = properties.map((property) => {
      const position = new window.kakao.maps.LatLng(property.lat, property.lng);
      
      const marker = new window.kakao.maps.Marker({
        position: position,
        title: property.title,
        clickable: true
      });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        if (!isSelectingLocation) {
          onMarkerClick(property);
          map.panTo(position);
        }
      });

      return marker;
    });

    if (newMarkers.length > 0) {
      clusterer.addMarkers(newMarkers);
    }

  }, [map, clusterer, properties, onMarkerClick, isSelectingLocation, isMapLoaded]);

  // Handle Map Click
  useEffect(() => {
    if (!map || !window.kakao || !isMapLoaded) return;

    const clickHandler = (mouseEvent: any) => {
      if (isSelectingLocation) {
        const latlng = mouseEvent.latLng;
        onMapClick(latlng.getLat(), latlng.getLng());
      }
    };

    window.kakao.maps.event.addListener(map, 'click', clickHandler);

    return () => {
      window.kakao.maps.event.removeListener(map, 'click', clickHandler);
    };
  }, [map, isSelectingLocation, onMapClick, isMapLoaded]);

  // Cursor handling
  useEffect(() => {
    if (mapContainer.current) {
      mapContainer.current.style.cursor = isSelectingLocation ? 'crosshair' : 'grab';
    }
  }, [isSelectingLocation]);

  return (
    <div className="w-full h-full relative group">
      <div ref={mapContainer} className="w-full h-full bg-gray-100 relative">
         {!isMapLoaded && (
             <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-500 font-medium animate-pulse">지도를 불러오는 중입니다...</p>
                </div>
             </div>
          )}
      </div>
      {isSelectingLocation && isMapLoaded && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-xl z-30 font-bold animate-bounce whitespace-nowrap pointer-events-none">
          원하는 위치를 지도에서 클릭하세요
        </div>
      )}
    </div>
  );
};

export default Map;