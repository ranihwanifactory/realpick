import React, { useEffect, useRef, useState } from 'react';
import { Property, PropertyType, DealType } from '../types';
import { formatKoreanPrice } from '../utils/format';

interface KakaoMapProps {
  properties: Property[];
  onMarkerClick: (property: Property) => void;
  center?: { lat: number; lng: number };
}

const KakaoMap: React.FC<KakaoMapProps> = ({ properties, onMarkerClick, center }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const markersRef = useRef<any[]>([]);
  const overlaysRef = useRef<any[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      console.error("Kakao Maps SDK not loaded");
      return;
    }

    if (mapContainer.current) {
      const options = {
        center: new window.kakao.maps.LatLng(center?.lat || 37.5665, center?.lng || 126.9780), // Seoul City Hall default
        level: 7, // Zoom level
      };
      const createdMap = new window.kakao.maps.Map(mapContainer.current, options);
      
      // Add zoom control
      const zoomControl = new window.kakao.maps.ZoomControl();
      createdMap.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
      
      setMap(createdMap);
    }
  }, []); // Run once on mount

  // Update Markers
  useEffect(() => {
    if (!map || !properties) return;

    // Clear existing markers and overlays
    markersRef.current.forEach(marker => marker.setMap(null));
    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    markersRef.current = [];
    overlaysRef.current = [];

    // Create new markers
    properties.forEach((property) => {
      const position = new window.kakao.maps.LatLng(property.lat, property.lng);
      
      // Custom content for marker (Price Bubble)
      const content = document.createElement('div');
      content.className = `
        px-3 py-1 rounded-full shadow-lg border-2 text-xs font-bold cursor-pointer transition-transform hover:scale-110
        ${property.dealType === 'SALE' ? 'bg-blue-600 border-white text-white' : ''}
        ${property.dealType === 'JEONSE' ? 'bg-green-600 border-white text-white' : ''}
        ${property.dealType === 'WOLSE' ? 'bg-orange-500 border-white text-white' : ''}
      `;
      content.innerHTML = `
        <span>${formatKoreanPrice(property.price)}</span>
      `;
      
      // We use CustomOverlay for the price bubble effect instead of standard Marker
      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1 
      });

      customOverlay.setMap(map);
      overlaysRef.current.push(customOverlay);

      // Add click event to the content element manually since CustomOverlay doesn't have onClick
      content.addEventListener('click', () => {
        onMarkerClick(property);
        // Pan to location
        map.panTo(position);
      });
    });

  }, [map, properties, onMarkerClick]);

  return (
    <div className="w-full h-full relative z-0">
      <div ref={mapContainer} className="w-full h-full rounded-lg shadow-inner bg-gray-200" />
      {!window.kakao && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-50">
           <p className="text-gray-500">지도를 불러오는 중입니다...</p>
        </div>
      )}
    </div>
  );
};

export default KakaoMap;