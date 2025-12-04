import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Property, PROPERTY_TYPES, TRADE_TYPES } from '../types';
import { Search, Map as MapIcon, List, MapPin, Navigation, Minus, Plus } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';

const MapSearch: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
  
  // Map Simulation State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  // Generate consistent random coordinates for properties for the demo
  const getPseudoCoordinates = (id: string) => {
    // Simple hash function to get a number from string
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Map to percentage (10% to 90% to stay in view)
    const x = Math.abs(hash % 80) + 10;
    const y = Math.abs((hash >> 3) % 80) + 10;
    return { x, y };
  };

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mapRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  const selectedProperty = properties.find(p => p.id === selectedPropId);

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
                onClick={() => setSelectedPropId(prop.id)}
                className={`bg-white p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedPropId === prop.id 
                    ? 'border-blue-500 ring-2 ring-blue-100 shadow-md' 
                    : 'border-gray-100 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="flex gap-3">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={prop.images[0] || 'https://picsum.photos/200'} alt="" className="w-full h-full object-cover"/>
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

      {/* Right Area - Interactive Map Canvas */}
      <div className="flex-grow relative bg-gray-100 overflow-hidden select-none cursor-move">
        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-1">
          <button onClick={handleZoomIn} className="p-2 hover:bg-gray-50 rounded text-gray-600"><Plus size={20} /></button>
          <div className="h-px bg-gray-100 w-full"></div>
          <button onClick={handleZoomOut} className="p-2 hover:bg-gray-50 rounded text-gray-600"><Minus size={20} /></button>
        </div>

        <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Navigation size={16} className="text-blue-600" />
          <span className="text-sm font-bold text-gray-800">지도를 드래그하여 매물을 찾아보세요</span>
        </div>
        
        {/* Draggable Map Layer */}
        <div 
          ref={mapRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          className="absolute inset-[-50%] w-[200%] h-[200%] bg-[#e5e9f2]"
        >
          {/* Grid Pattern Background */}
          <div className="w-full h-full opacity-30" 
            style={{ 
              backgroundImage: 'radial-gradient(#a0aec0 1px, transparent 1px)', 
              backgroundSize: '40px 40px' 
            }}
          ></div>

          {/* Simulated Map Features (Abstract) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] border-4 border-gray-300 rounded-[3rem] opacity-20"></div>
          <div className="absolute top-[40%] left-[30%] w-[20%] h-[20%] bg-blue-200 rounded-full opacity-20 blur-3xl"></div>

          {/* Property Markers */}
          {properties.map(prop => {
            const coords = getPseudoCoordinates(prop.id);
            const isSelected = selectedPropId === prop.id;
            return (
              <div 
                key={prop.id}
                onClick={(e) => { e.stopPropagation(); setSelectedPropId(prop.id); }}
                className="absolute transition-all duration-300 hover:z-50 cursor-pointer group"
                style={{ 
                  left: `${coords.x}%`, 
                  top: `${coords.y}%`,
                  zIndex: isSelected ? 40 : 10
                }}
              >
                <div className={`relative flex flex-col items-center transition-transform duration-200 ${isSelected ? 'scale-110' : 'scale-100 hover:scale-110'}`}>
                  {/* Price Tag Bubble */}
                  <div className={`
                    px-2.5 py-1.5 rounded-lg shadow-lg font-bold text-xs whitespace-nowrap mb-1
                    flex items-center gap-1 transition-colors
                    ${isSelected 
                      ? 'bg-blue-600 text-white ring-2 ring-white' 
                      : 'bg-white text-gray-800 hover:bg-blue-600 hover:text-white'}
                  `}>
                    {isSelected && <MapPin size={12} fill="currentColor" />}
                    {prop.tradeType === 'MONTHLY' ? `월 ${prop.monthlyRent}` : formatMoney(prop.price)}
                  </div>
                  
                  {/* Arrow for Bubble */}
                  <div className={`w-2 h-2 rotate-45 -mt-2 ${isSelected ? 'bg-blue-600' : 'bg-white group-hover:bg-blue-600'}`}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Helper for price formatting inside MapSearch
const formatMoney = (num: number) => {
  if (num >= 10000) {
    const uk = (num / 10000).toFixed(1);
    return `${uk}억`;
  }
  return `${num}만`;
};

export default MapSearch;