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
  const markersRef = useRef<any[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;

    const initMap = () => {
      const { kakao } = window;
      if (!kakao || !kakao.maps) return;

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

    // Check if script is loaded, otherwise wait
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(initMap);
    } else {
      // Retry or handle error - for now assume index.html loaded it
      const interval = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(interval);
          window.kakao.maps.load(initMap);
        }
      }, 100);
    }
  }, []); // Run once on mount

  // Handle Properties & Markers
  useEffect(() => {
    if (!map || !clusterer || !window.kakao) return;

    // Clear existing markers
    if (clusterer) {
      clusterer.clear();
    }
    markersRef.current = [];

    const newMarkers = properties.map((property) => {
      const position = new window.kakao.maps.LatLng(property.lat, property.lng);
      
      // Determine marker image based on type (optional, using default for now or simple colors)
      // Custom content for marker could be used here for nicer UX
      
      const marker = new window.kakao.maps.Marker({
        position: position,
        title: property.title
      });

      // Add click event
      window.kakao.maps.event.addListener(marker, 'click', () => {
        if (!isSelectingLocation) {
          onMarkerClick(property);
          
          // Pan to marker
          map.panTo(position);
        }
      });

      return marker;
    });

    clusterer.addMarkers(newMarkers);
    markersRef.current = newMarkers;

  }, [map, clusterer, properties, onMarkerClick, isSelectingLocation]);

  // Handle Map Click (for selection)
  useEffect(() => {
    if (!map || !window.kakao) return;

    const clickHandler = (mouseEvent: any) => {
      if (isSelectingLocation) {
        const latlng = mouseEvent.latLng;
        onMapClick(latlng.getLat(), latlng.getLng());
      } else {
        // Close property card if clicking elsewhere? handled by App state usually
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
      <div ref={mapContainer} className="w-full h-full bg-gray-100" />
      {isSelectingLocation && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-xl z-30 font-bold animate-bounce">
          원하는 위치를 지도에서 클릭하세요
        </div>
      )}
    </div>
  );
};

export default Map;