import React, { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout } from './services/firebase';
import { Property, ADMIN_EMAIL, PropertyType, UserProfile } from './types';
import KakaoMap from './components/KakaoMap';
import PropertyCard from './components/PropertyCard';
import AdminPanel from './components/AdminPanel';
import { Map, List, LogIn, LogOut, PlusCircle, LayoutGrid, Search } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Properties Listener
  useEffect(() => {
    // Create query
    const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const props = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
      setProperties(props);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      // Fallback for demo if Firestore fails (e.g. permission denied)
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'properties', id));
    } catch (error) {
      console.error("Error deleting document: ", error);
      alert("삭제 실패: 권한을 확인해주세요.");
    }
  };

  const filteredProperties = properties.filter(p => 
    filterType === 'ALL' ? true : p.type === filterType
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm h-16">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setViewMode('LIST')}>
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <LayoutGrid size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              <span className="text-blue-600">K</span>-Estate
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="hidden md:flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('LIST')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'LIST' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                리스트
              </button>
              <button 
                onClick={() => setViewMode('MAP')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'MAP' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                지도
              </button>
            </div>

            {/* User Actions */}
            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button 
                    onClick={() => setShowAdminPanel(true)}
                    className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors"
                  >
                    <PlusCircle size={14} /> 관리자
                  </button>
                )}
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200" />
                <button onClick={logout} className="text-gray-500 hover:text-red-500">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                <LogIn size={16} /> 로그인
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row relative">
        
        {/* Map View (Conditional on Mobile, always visible in Map Mode on Desktop if split view desired, but keeping it simple modes for now) */}
        {viewMode === 'MAP' && (
          <div className="absolute inset-0 z-10 md:relative md:flex-1 h-[calc(100vh-64px)]">
             <KakaoMap 
               properties={filteredProperties} 
               onMarkerClick={(p) => setSelectedProperty(p)} 
             />
             
             {/* Map Overlay Filter */}
             <div className="absolute top-4 left-4 z-20 flex gap-2 overflow-x-auto max-w-[90vw] pb-2 hide-scrollbar">
               <button 
                 onClick={() => setFilterType('ALL')}
                 className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg whitespace-nowrap ${filterType === 'ALL' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
               >
                 전체
               </button>
               {Object.entries(PropertyType).map(([key, value]) => (
                  <button 
                    key={key}
                    onClick={() => setFilterType(key)}
                    className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg whitespace-nowrap ${filterType === key ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    {value}
                  </button>
               ))}
             </div>

             {/* Selected Property Popup on Map */}
             {selectedProperty && (
               <div className="absolute bottom-8 left-4 right-4 md:left-auto md:right-8 md:w-96 z-20 animate-slide-up">
                 <div className="relative">
                   <button 
                     onClick={() => setSelectedProperty(null)}
                     className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-md border z-30"
                   >
                     <span className="sr-only">Close</span>
                     <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                   </button>
                   <PropertyCard 
                     property={selectedProperty} 
                     onClick={() => {}} 
                     isAdmin={isAdmin}
                     onDelete={handleDelete}
                   />
                 </div>
               </div>
             )}

             {/* Toggle to List View (Mobile Floating Button) */}
             <button 
               onClick={() => setViewMode('LIST')}
               className="md:hidden absolute bottom-24 right-4 bg-white p-3 rounded-full shadow-xl z-20 text-gray-700"
             >
               <List size={24} />
             </button>
          </div>
        )}

        {/* List View */}
        {viewMode === 'LIST' && (
          <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
            {/* Filters */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h2 className="text-3xl font-bold text-gray-900 mb-2">어떤 집을 찾고 계신가요?</h2>
                   <p className="text-gray-500">최신 부동산 매물을 한눈에 확인하세요.</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                   <button 
                     onClick={() => setFilterType('ALL')}
                     className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${filterType === 'ALL' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                   >
                     전체
                   </button>
                   {Object.entries(PropertyType).map(([key, value]) => (
                      <button 
                        key={key}
                        onClick={() => setFilterType(key)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${filterType === key ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {value}
                      </button>
                   ))}
                </div>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">등록된 매물이 없습니다</h3>
                <p className="text-gray-500 mt-1">관리자에게 문의하거나 필터를 변경해보세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {filteredProperties.map((prop) => (
                  <PropertyCard 
                    key={prop.id} 
                    property={prop} 
                    onClick={() => {
                       setSelectedProperty(prop);
                       setViewMode('MAP');
                    }}
                    isAdmin={isAdmin}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
            
            {/* Toggle to Map View (Mobile Floating Button) */}
            <button 
               onClick={() => setViewMode('MAP')}
               className="md:hidden fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-xl z-20 hover:bg-blue-700 transition-colors"
             >
               <Map size={24} />
             </button>
          </div>
        )}
      </main>

      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <AdminPanel 
          onClose={() => setShowAdminPanel(false)} 
          onSuccess={() => {
            // Refresh handled by snapshot listener
          }} 
        />
      )}
    </div>
  );
};

export default App;