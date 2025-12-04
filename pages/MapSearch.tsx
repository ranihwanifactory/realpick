import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Property, PROPERTY_TYPES, TRADE_TYPES } from '../types';
import { Search, MapPin, Navigation, List, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    kakao: any;
  }
}

const MapSearch: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);

  // Default Center (Gangnam Station)
  const DEFAULT_LAT = 37.4979;
  const DEFAULT_LNG = 127.0276;

  // Generate pseudo-coordinates based on ID hash (Simulation for demo)
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

  // 2. Dynamic Script Loading for Stability
  useEffect(() => {
    const scriptId = 'kakao-map-script';
    const isScriptExist = document.getElementById(scriptId);
    
    // If map is already loaded in global window, just set state
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        setMapLoaded(true);
      });
      return;
    }

    if (!isScriptExist) {
      const script = document.createElement('script');
      script.id = scriptId;
      // Using autoload=false to manually initialize via window.kakao.maps.load
      script.src = '//dapi.kakao.com/v2/maps/sdk.js?appkey=7e88cf2e2962d67bb246f38f504dc200&libraries=services,clusterer&autoload=false';
      
      script.onload = () => {
        if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => {
            setMapLoaded(true);
          });
        }
      };

      script.onerror = () => {
        console.error("Failed to load Kakao Map script");
        // Retry logic or user alert could go here
      };

      document.head.appendChild(script);
    }
  }, []);

  // 3. Initialize Map
  useEffect(() => {
    if (mapLoaded && mapContainer.current && !mapInstance.current) {
      const options = {
        center: new window.kakao.maps.LatLng(DEFAULT_LAT, DEFAULT_LNG),
        level: 5,
      };
      
      const map = new window.kakao.maps.Map(mapContainer.current, options);
      mapInstance.current = map;
      
      const zoomControl = new window.kakao.maps.ZoomControl();
      map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
    }
  }, [mapLoaded]);

  // 4. Update Markers
  useEffect(() => {
    if (!mapInstance.current || properties.length === 0 || !mapLoaded) return;

    // Clear existing overlays
    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    overlaysRef.current = [];

    properties.forEach(prop => {
      const coords = getCoordinates(prop.id);
      const position = new window.kakao.maps.LatLng(coords.lat, coords.lng);
      
      const isSelected = selectedPropId === prop.id;

      const content = document.createElement('div');
      content.className = `customoverlay ${isSelected ? 'selected' : ''}`;
      content.innerHTML = `<span class="title">${getPriceString(prop)}</span>`;

      content.onclick = (e) => {
        e.stopPropagation();
        setSelectedPropId(prop.id);
        mapInstance.current.panTo(position);
      };

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1,
        zIndex: isSelected ? 10 : 1
      });

      customOverlay.setMap(mapInstance.current);
      overlaysRef.current.push(customOverlay);
    });

  }, [properties, selectedPropId, mapLoaded]);

  const handleListClick = (prop: Property) => {
    setSelectedPropId(prop.id);
    const coords = getCoordinates(prop.id);
    if (mapInstance.current) {
      const moveLatLon = new window.kakao.maps.LatLng(coords.lat, coords.lng);
      mapInstance.current.panTo(moveLatLon);
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
        {!mapLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-50">
            <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
            <p className="text-gray-500 font-medium">지도를 불러오는 중입니다...</p>
          </div>
        )}
        <div id="map" ref={mapContainer} className="w-full h-full"></div>
        
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