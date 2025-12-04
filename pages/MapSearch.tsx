import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Property, PROPERTY_TYPES, TRADE_TYPES } from '../types';
import { Search, MapPin, Navigation, List } from 'lucide-react';

declare global {
  interface Window {
    kakao: any;
  }
}

const MapSearch: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);

  // Default Center (Gangnam Station)
  const DEFAULT_LAT = 37.4979;
  const DEFAULT_LNG = 127.0276;

  // Generate consistent pseudo-coordinates around Gangnam for demo purposes
  // In a real app, these would come from the database
  const getCoordinates = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Random offset within approx 1-2km
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

  // Fetch Data
  useEffect(() => {
    const fetchProps = async () => {
      try {
        const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data: Property[] = [];
        snap.forEach(d => data.push({ id: d.id, ...d.data() } as Property));
        setProperties(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProps();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!loading && mapContainer.current && window.kakao) {
      window.kakao.maps.load(() => {
        const options = {
          center: new window.kakao.maps.LatLng(DEFAULT_LAT, DEFAULT_LNG),
          level: 5,
        };
        
        // Create Map
        const map = new window.kakao.maps.Map(mapContainer.current, options);
        mapInstance.current = map;

        // Zoom Control
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
      });
    }
  }, [loading]);

  // Update Markers (Custom Overlays)
  useEffect(() => {
    if (!mapInstance.current || properties.length === 0) return;

    // Clear existing overlays
    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    overlaysRef.current = [];

    properties.forEach(prop => {
      const coords = getCoordinates(prop.id);
      const position = new window.kakao.maps.LatLng(coords.lat, coords.lng);
      
      const isSelected = selectedPropId === prop.id;

      // Create Custom Overlay Element
      const content = document.createElement('div');
      content.className = `customoverlay ${isSelected ? 'selected' : ''}`;
      content.innerHTML = `
        <span class="title">
          ${getPriceString(prop)}
        </span>
      `;

      // Handle Click on Marker
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

  }, [properties, selectedPropId]);

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
      {/* Left Sidebar - Property List */}
      <div className="w-96 flex-shrink-0 border-r border-gray-200 flex flex-col bg-white z-10 shadow-xl">
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
             <button className="text-xs font-semibold text-blue-600">필터 설정</button>
           </div>
        </div>

        <div className="flex-grow overflow-y-auto no-scrollbar p-4 space-y-4 bg-gray-50">
          {loading ? (
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

      {/* Right Area - Kakao Map */}
      <div className="flex-grow relative bg-gray-100">
        <div id="map" ref={mapContainer} className="w-full h-full"></div>
        
        {/* Floating Controls */}
        <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Navigation size={16} className="text-blue-600" />
          <span className="text-sm font-bold text-gray-800">지도를 움직여 매물을 찾아보세요</span>
        </div>
      </div>
    </div>
  );
};

export default MapSearch;