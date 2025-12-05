import React, { useEffect, useRef, useState } from 'react';
import { Property } from '../types';
import { formatKoreanPrice } from '../utils/format';
import { Search } from 'lucide-react';

interface KakaoMapProps {
  properties: Property[];
  onMarkerClick: (property: Property) => void;
  center?: { lat: number; lng: number };
}

const KakaoMap: React.FC<KakaoMapProps> = ({ properties, onMarkerClick, center }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [keyword, setKeyword] = useState('');
  const markersRef = useRef<any[]>([]);
  const overlaysRef = useRef<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize Map with robust loading check
  useEffect(() => {
    const checkKakao = () => {
      // Check if the script exists and the maps library is ready
      if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
        return true;
      }
      return false;
    };

    if (checkKakao()) {
      window.kakao.maps.load(() => setIsLoaded(true));
    } else {
      const intervalId = setInterval(() => {
        if (checkKakao()) {
          clearInterval(intervalId);
          window.kakao.maps.load(() => setIsLoaded(true));
        }
      }, 100);
      return () => clearInterval(intervalId);
    }
  }, []);

  // Create Map Instance
  useEffect(() => {
    if (isLoaded && mapContainer.current && !map) {
      const options = {
        center: new window.kakao.maps.LatLng(center?.lat || 37.5665, center?.lng || 126.9780), // Seoul City Hall default
        level: 7,
      };
      const createdMap = new window.kakao.maps.Map(mapContainer.current, options);
      
      // Add controls
      const zoomControl = new window.kakao.maps.ZoomControl();
      createdMap.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
      const mapTypeControl = new window.kakao.maps.MapTypeControl();
      createdMap.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);
      
      setMap(createdMap);
    }
  }, [isLoaded]); // center dependency removed to prevent re-creation, handled by panTo if needed

  // Handle Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!map || !keyword.trim()) return;

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(keyword, (data: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const bounds = new window.kakao.maps.LatLngBounds();
        // Extend bounds for the top results (up to 5)
        const limit = Math.min(data.length, 5);
        for (let i = 0; i < limit; i++) {
          bounds.extend(new window.kakao.maps.LatLng(data[i].y, data[i].x));
        }
        map.setBounds(bounds);
      } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
        alert('검색 결과가 존재하지 않습니다.');
      } else if (status === window.kakao.maps.services.Status.ERROR) {
        alert('검색 중 오류가 발생했습니다.');
      }
    });
  };

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
      
      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1 
      });

      customOverlay.setMap(map);
      overlaysRef.current.push(customOverlay);

      content.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent map click
        onMarkerClick(property);
        map.panTo(position);
      });
    });

  }, [map, properties, onMarkerClick]);

  return (
    <div className="w-full h-full relative z-0 group">
      <div ref={mapContainer} className="w-full h-full bg-gray-100 rounded-lg" />
      
      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-50">
           <div className="flex flex-col items-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
             <p className="text-gray-500 text-sm">지도를 불러오는 중...</p>
           </div>
        </div>
      )}

      {/* Map Search Bar */}
      {isLoaded && (
        <div className="absolute top-4 right-4 z-20 w-full max-w-[200px] md:max-w-xs transition-all">
          <form onSubmit={handleSearch} className="relative shadow-xl rounded-lg overflow-hidden group-focus-within:ring-2 ring-blue-500">
            <input 
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="지역/건물 검색"
              className="w-full pl-4 pr-10 py-2.5 bg-white text-gray-800 text-sm font-medium focus:outline-none"
            />
            <button 
              type="submit" 
              className="absolute right-0 top-0 h-full px-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Search size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default KakaoMap;