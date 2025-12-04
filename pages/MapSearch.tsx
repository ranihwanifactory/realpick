import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Property, PROPERTY_TYPES, TRADE_TYPES } from '../types';
import { Search, MapPin, Navigation, List, Loader2, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    kakao: any;
  }
}

const MapSearch: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const markersMapRef = useRef<Map<string, any>>(new Map());

  // Default Center (Gangnam Station)
  const DEFAULT_LAT = 37.4979;
  const DEFAULT_LNG = 127.0276;

  // Generate pseudo-coordinates based on ID hash
  const getCoordinates = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const latOffset = ((hash % 100) / 3000) * (hash % 2 === 0 ? 1 : -1);
    const lngOffset = (((hash >> 2) % 100) / 3000) * (hash % 3 === 0 ? 1 : -1);
    
    return {
      lat: DEFAULT_LAT + latOffset,
      lng: DEFAULT_LNG + lngOffset
    };
  };

  const formatMoney = (num: number) => {
    if (num >= 10000) {
      const uk = (num / 10000).toFixed(1);
      return `${uk}억`;
    }
    return `${num}만`;
  };

  const getPriceString = (prop: Property) => {
    if (prop.tradeType === 'MONTHLY') {
      return `월 ${prop.monthlyRent}`;
    }
    return formatMoney(prop.price);
  };

  // Helper to generate dynamic SVG marker image with text
  const createMarkerImage = (text: string, isSelected: boolean) => {
    if (!window.kakao || !window.kakao.maps) return null;

    const width = text.length * 9 + 20;
    const height = 32;
    const bgColor = isSelected ? '#2563EB' : '#FFFFFF';
    const textColor = isSelected ? '#FFFFFF' : '#374151';
    const borderColor = isSelected ? '#1D4ED8' : '#9CA3AF';
    
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height + 6}" viewBox="0 0 ${width} ${height + 6}">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.2"/>
          </filter>
        </defs>
        <g filter="url(#shadow)">
          <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="6" ry="6" fill="${bgColor}" stroke="${borderColor}" stroke-width="1"/>
          <path d="M${width / 2 - 4} ${height - 1.5} L${width / 2} ${height + 3} L${width / 2 + 4} ${height - 1.5} Z" fill="${bgColor}" stroke="${borderColor}" stroke-width="0" />
        </g>
        <text x="${width / 2}" y="${height / 2 + 1}" font-family="sans-serif" font-size="12" font-weight="bold" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${text}</text>
      </svg>
    `;
    
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    
    return new window.kakao.maps.MarkerImage(
      url,
      new window.kakao.maps.Size(width, height + 6),
      { offset: new window.kakao.maps.Point(width / 2, height + 6) }
    );
  };

  // 1. Fetch Property Data
  useEffect(() => {
    const fetchProps = async () => {
      try {
        const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data: Property[] = [];
        snap.forEach(d => data.push({ id: d.id, ...d.data() } as Property));
        setProperties(data);
      } catch (err) {
        console.error("Failed to fetch properties:", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchProps();
  }, []);

  // 2. Robust Poll for Kakao Map Script with Timeout
  useEffect(() => {
    let intervalId: any;
    let timeoutId: any;

    const checkKakao = () => {
      if (window.kakao && window.kakao.maps) {
        // Script loaded, now load the map system
        window.kakao.maps.load(() => {
          setMapLoaded(true);
        });
        return true;
      }
      return false;
    };

    if (!checkKakao()) {
      intervalId = setInterval(() => {
        if (checkKakao()) {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
        }
      }, 500);

      // Set a 10-second timeout
      timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        if (!window.kakao || !window.kakao.maps) {
          setMapError("지도 스크립트를 불러오지 못했습니다. 새로고침 해주세요.");
        }
      }, 10000);
    }

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, []);

  // 3. Initialize Map & Clusterer
  useEffect(() => {
    if (mapLoaded && mapContainer.current && !mapInstance.current) {
      try {
        const options = {
          center: new window.kakao.maps.LatLng(DEFAULT_LAT, DEFAULT_LNG),
          level: 5,
        };
        
        const map = new window.kakao.maps.Map(mapContainer.current, options);
        mapInstance.current = map;
        
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        // Initialize Clusterer
        if (window.kakao.maps.MarkerClusterer) {
          clustererRef.current = new window.kakao.maps.MarkerClusterer({
            map: map,
            averageCenter: true,
            minLevel: 6,
            disableClickZoom: false,
            styles: [{ 
              width: '50px', 
              height: '50px',
              background: 'rgba(37, 99, 235, 0.9)',
              borderRadius: '25px',
              color: '#fff',
              textAlign: 'center',
              fontWeight: 'bold',
              lineHeight: '50px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }]
          });
        }
      } catch (e) {
        console.error("Map initialization error:", e);
        setMapError("지도 초기화 중 오류가 발생했습니다.");
      }
    }
  }, [mapLoaded]);

  // 4. Create and Cluster Markers
  useEffect(() => {
    if (!mapInstance.current || !clustererRef.current || properties.length === 0 || !mapLoaded) return;

    // Clear existing
    clustererRef.current.clear();
    markersMapRef.current.clear();

    const newMarkers = properties.map(prop => {
      const coords = getCoordinates(prop.id);
      const position = new window.kakao.maps.LatLng(coords.lat, coords.lng);
      const priceStr = getPriceString(prop);
      const isSelected = selectedPropId === prop.id;
      
      const image = createMarkerImage(priceStr, isSelected);
      
      const marker = new window.kakao.maps.Marker({
        position: position,
        image: image,
        zIndex: isSelected ? 10 : 0
      });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        setSelectedPropId(prop.id);
        mapInstance.current.panTo(position);
      });

      markersMapRef.current.set(prop.id, marker);
      return marker;
    });

    clustererRef.current.addMarkers(newMarkers);

  }, [properties, mapLoaded]);

  // 5. Update Selected Marker Visuals
  useEffect(() => {
    if (markersMapRef.current.size === 0 || !mapLoaded) return;

    properties.forEach(prop => {
      const marker = markersMapRef.current.get(prop.id);
      if (marker) {
        const isSelected = selectedPropId === prop.id;
        const priceStr = getPriceString(prop);
        const image = createMarkerImage(priceStr, isSelected);
        if (image) {
          marker.setImage(image);
          marker.setZIndex(isSelected ? 10 : 0);
        }
      }
    });
  }, [selectedPropId, properties, mapLoaded]);

  const handleListClick = (prop: Property) => {
    setSelectedPropId(prop.id);
    const coords = getCoordinates(prop.id);
    if (mapInstance.current && window.kakao) {
      const moveLatLon = new window.kakao.maps.LatLng(coords.lat, coords.lng);
      mapInstance.current.panTo(moveLatLon);
      
      if (mapInstance.current.getLevel() > 5) {
        mapInstance.current.setLevel(5, { animate: true });
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* List Sidebar */}
      <div className="w-96 flex-shrink-0 border-r border-gray-200 flex flex-col bg-white z-10 shadow-xl relative">
        <div className="p-4 border-b border-gray-100">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
               type="text" 
               placeholder="지역 또는 단지명 검색"
               className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
             />
           </div>
           <div className="flex items-center justify-between mt-3">
             <h2 className="font-bold text-gray-800">매물 목록 ({properties.length})</h2>
           </div>
        </div>

        <div className="flex-grow overflow-y-auto no-scrollbar p-4 space-y-4 bg-gray-50">
          {loadingData ? (
             <div className="space-y-4">
               {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"/>)}
             </div>
          ) : (
            properties.map(prop => (
              <div 
                key={prop.id}
                onClick={() => handleListClick(prop)}
                className={`bg-white p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedPropId === prop.id 
                    ? 'border-blue-500 ring-2 ring-blue-100 shadow-md' 
                    : 'border-gray-100 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="flex gap-3">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={prop.images[0] || 'https://via.placeholder.com/200'} alt="" className="w-full h-full object-cover"/>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        prop.tradeType === 'SALE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {TRADE_TYPES[prop.tradeType]}
                      </span>
                      <span className="text-[10px] text-gray-500">{PROPERTY_TYPES[prop.type]}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm truncate mb-1">
                      {prop.tradeType === 'MONTHLY' 
                        ? `${prop.deposit}/${prop.monthlyRent}` 
                        : formatMoney(prop.price)}
                    </h3>
                    <p className="text-xs text-gray-500 truncate mb-1">{prop.title}</p>
                    <p className="text-xs text-gray-400">{prop.area}평 • {prop.floor}층</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-grow relative bg-gray-100 w-full h-full">
        {mapError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-50 px-4 text-center">
            <AlertCircle className="text-red-500 mb-2" size={48} />
            <p className="text-gray-800 font-bold mb-1">지도를 불러올 수 없습니다</p>
            <p className="text-gray-500 text-sm">{mapError}</p>
          </div>
        ) : !mapLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-50">
            <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
            <p className="text-gray-500 font-medium">지도를 불러오는 중입니다...</p>
          </div>
        )}
        <div id="map" ref={mapContainer} style={{ width: '100%', height: '100%' }}></div>
        
        {/* Floating Controls */}
        <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 pointer-events-none">
          <Navigation size={16} className="text-blue-600" />
          <span className="text-sm font-bold text-gray-800">지도를 움직여 매물을 찾아보세요</span>
        </div>
      </div>
    </div>
  );
};

export default MapSearch;