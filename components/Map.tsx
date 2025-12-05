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
  
  // Track initialization to prevent double init in Strict Mode
  const isInitialized = useRef(false);

  // Initialize Map
  useEffect(() => {
    if (isInitialized.current) return;
    
    const initMap = () => {
      const { kakao } = window;
      if (!kakao || !kakao.maps || !mapContainer.current) return;

      // Mark as initialized to prevent duplicates
      isInitialized.current = true;

      const options = {
        center: new kakao.maps.LatLng(center?.lat || 37.5665, center?.lng || 126.9780), // Default to Seoul City Hall
        level: 8,
      };

      const newMap = new kakao.maps.Map(mapContainer.current, options);
      setMap(newMap);

      // Initialize Clusterer
      const newClusterer = new kakao.maps.MarkerClusterer({
        map: newMap,
        averageCenter: true,
        minLevel: 5,
      });
      setClusterer(newClusterer);
    };

    // Retry logic to ensure Kakao script is loaded
    const tryInit = () => {
       if (window.kakao && window.kakao.maps) {
          // IMPORTANT: Use kakao.maps.load when autoload=false is used
          window.kakao.maps.load(initMap);
       } else {
          setTimeout(tryInit, 100);
       }
    };

    tryInit();

  }, []); // Run once on mount

  // Handle Properties & Markers
  useEffect(() => {
    if (!map || !clusterer || !window.kakao) return;

    // Clear existing markers
    clusterer.clear();

    const newMarkers = properties.map((property) => {
      const position = new window.kakao.maps.LatLng(property.lat, property.lng);
      
      const marker = new window.kakao.maps.Marker({
        position: position,
        title: property.title
      });

      // Add click event
      window.kakao.maps.event.addListener(marker, 'click', () => {
        if (!isSelectingLocation) {
          onMarkerClick(property);
          map.panTo(position);
        }
      });

      return marker;
    });

    clusterer.addMarkers(newMarkers);

  }, [map, clusterer, properties, onMarkerClick, isSelectingLocation]);

  // Handle Map Click (for selection)
  useEffect(() => {
    if (!map || !window.kakao) return;

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
  }, [map, isSelectingLocation, onMapClick]);

  // Cursor style
  useEffect(() => {
    if (mapContainer.current) {
      mapContainer.current.style.cursor = isSelectingLocation ? 'crosshair' : 'grab';
    }
  }, [isSelectingLocation]);

  return (
    <div className="w-full h-full relative group">
      <div ref={mapContainer} className="w-full h-full bg-gray-100 relative">
          {/* Loading Placeholder inside the container */}
          {!map && (
             <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10 text-gray-500">
                <span className="animate-pulse">지도를 불러오는 중입니다...</span>
             </div>
          )}
      </div>
      {isSelectingLocation && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-xl z-30 font-bold animate-bounce whitespace-nowrap">
          원하는 위치를 지도에서 클릭하세요
        </div>
      )}
    </div>
  );
};

export default Map;