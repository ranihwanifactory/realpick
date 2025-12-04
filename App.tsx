import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from './services/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { UserProfile, ADMIN_EMAIL, Property, PropertyType, PROPERTY_TYPES } from './types';
import { Menu, User as UserIcon, LogOut, Search, MapPin, Building2, Filter, ChevronDown, Check, X } from 'lucide-react';

// Components
import Admin from './pages/Admin';
import AuthModal from './components/AuthModal';
import PropertyCard from './components/PropertyCard';

// User Context
const UserContext = createContext<{ user: UserProfile | null, loading: boolean }>({ user: null, loading: true });

// Main App Component
const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAdmin: firebaseUser.email === ADMIN_EMAIL
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <UserContext.Provider value={{ user, loading: authLoading }}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/admin" 
              element={user?.isAdmin ? <Admin /> : <Navigate to="/" replace />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </UserContext.Provider>
  );
};

// Layout Component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useContext(UserContext);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                  <Building2 size={24} />
                </div>
                <span className="font-bold text-xl tracking-tight text-gray-900">HomePick</span>
              </Link>
              
              <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600">
                <Link to="/" className={`${location.pathname === '/' ? 'text-blue-600' : 'hover:text-blue-600'} transition-colors`}>매물찾기</Link>
                <a href="#" className="hover:text-blue-600 transition-colors">지도검색</a>
                <a href="#" className="hover:text-blue-600 transition-colors">부동산뉴스</a>
                {user?.isAdmin && (
                  <Link to="/admin" className="text-red-500 hover:text-red-700 font-bold">관리자 페이지</Link>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-2">
                     {user.photoURL ? (
                       <img src={user.photoURL} alt="profile" className="w-8 h-8 rounded-full border" />
                     ) : (
                       <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"><UserIcon size={16} /></div>
                     )}
                     <span className="text-sm font-medium">{user.displayName || '사용자'}님</span>
                  </div>
                  <button 
                    onClick={() => signOut(auth)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                    title="로그아웃"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg"
                >
                  로그인 / 가입
                </button>
              )}
              
              <button className="md:hidden p-2 text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4">
             <Link to="/" className="block py-2 font-medium" onClick={() => setIsMenuOpen(false)}>매물찾기</Link>
             <a href="#" className="block py-2 font-medium" onClick={() => setIsMenuOpen(false)}>지도검색</a>
             {user?.isAdmin && (
               <Link to="/admin" className="block py-2 font-medium text-red-500" onClick={() => setIsMenuOpen(false)}>관리자 페이지</Link>
             )}
          </div>
        )}
      </nav>

      <main>
        {children}
      </main>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <footer className="bg-gray-900 text-gray-400 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4 text-white">
              <Building2 size={24} />
              <span className="font-bold text-xl">HomePick</span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              대한민국 최고의 부동산 플랫폼 HomePick입니다.<br/>
              허위매물 없는 정직한 중개로 보답하겠습니다.
            </p>
            <p className="text-xs">© 2024 HomePick Korea. All rights reserved.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">서비스</h4>
            <ul className="space-y-2 text-sm">
              <li>매물 검색</li>
              <li>지도 찾기</li>
              <li>시세 조회</li>
              <li>분양 정보</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">고객센터</h4>
            <ul className="space-y-2 text-sm">
              <li>공지사항</li>
              <li>자주 묻는 질문</li>
              <li>1:1 문의</li>
              <li>제휴 문의</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Home Page Component
const Home: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProps, setFilteredProps] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    const fetchProps = async () => {
      try {
        const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data: Property[] = [];
        snap.forEach(d => data.push({ id: d.id, ...d.data() } as Property));
        setProperties(data);
        setFilteredProps(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProps();
  }, []);

  useEffect(() => {
    let result = properties;

    // Filter by Category
    if (activeCategory !== 'ALL') {
      result = result.filter(p => p.type === activeCategory);
    }

    // Filter by Search
    if (searchTerm) {
      result = result.filter(p => 
        p.title.includes(searchTerm) || 
        p.location.includes(searchTerm) || 
        p.features.some(f => f.includes(searchTerm))
      );
    }

    setFilteredProps(result);
  }, [activeCategory, searchTerm, properties]);

  return (
    <>
      {/* Hero Section */}
      <div className="relative bg-blue-900 text-white py-20 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 opacity-95 z-10"></div>
          <img src="https://images.unsplash.com/photo-1448630360428-65456885c650?ixlib=rb-4.0.3&auto=format&fit=crop&w=2067&q=80" className="w-full h-full object-cover opacity-30" alt="Background" />
        </div>
        
        <div className="relative z-20 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            어떤 집을 찾고 계신가요?<br />
            <span className="text-blue-300">HomePick</span>에서 시작하세요.
          </h1>
          <p className="text-blue-100 text-lg mb-10">
            아파트, 오피스텔, 원룸까지. 허위매물 없는 깨끗한 부동산
          </p>

          <div className="bg-white p-2 rounded-2xl shadow-xl max-w-2xl mx-auto flex">
            <div className="flex-grow flex items-center px-4 border-r border-gray-200">
               <Search className="text-gray-400 mr-3" />
               <input 
                 type="text" 
                 placeholder="지역명, 지하철역, 건물명으로 검색" 
                 className="w-full py-3 outline-none text-gray-700"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-colors">
              검색
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="sticky top-16 z-30 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar">
          <div className="flex space-x-2 py-4 min-w-max">
            <button 
              onClick={() => setActiveCategory('ALL')}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeCategory === 'ALL' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              전체
            </button>
            {Object.entries(PROPERTY_TYPES).map(([key, label]) => (
              <button 
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeCategory === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Listing Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {activeCategory === 'ALL' ? '최신 등록 매물' : `${PROPERTY_TYPES[activeCategory as PropertyType]} 매물`}
          </h2>
          <span className="text-gray-500 text-sm">{filteredProps.length}개의 매물</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-80 bg-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredProps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProps.map(prop => (
              <PropertyCard key={prop.id} property={prop} onClick={() => setSelectedProperty(prop)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="inline-block p-4 bg-gray-50 rounded-full mb-4">
              <Filter className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">조건에 맞는 매물이 없습니다.</h3>
            <p className="text-gray-500">다른 검색어나 카테고리를 선택해보세요.</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedProperty(null)}></div>
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto animate-slide-in-right">
            <button 
              onClick={() => setSelectedProperty(null)}
              className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full hover:bg-white"
            >
              <X size={24} />
            </button>
            
            <div className="h-80 bg-gray-200 relative">
               <img src={selectedProperty.images[0]} alt="Main" className="w-full h-full object-cover" />
               <div className="absolute bottom-4 left-4 flex gap-2 overflow-x-auto max-w-full pr-4">
                  {selectedProperty.images.map((img, i) => (
                    <img key={i} src={img} className="w-16 h-16 rounded-lg border-2 border-white object-cover cursor-pointer hover:opacity-80 transition-opacity" />
                  ))}
               </div>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  {PROPERTY_TYPES[selectedProperty.type]}
                </span>
                <span className="text-sm font-bold bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
                  {selectedProperty.tradeType === 'SALE' ? '매매' : selectedProperty.tradeType === 'JEONSE' ? '전세' : '월세'}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                 {selectedProperty.tradeType === 'MONTHLY' 
                   ? `보증금 ${selectedProperty.deposit} / 월세 ${selectedProperty.monthlyRent}` 
                   : `${(selectedProperty.price / 10000).toFixed(1)}억`}
              </h1>
              <p className="text-lg text-gray-600 mb-6 border-b pb-6 border-gray-100">{selectedProperty.title}</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <span className="text-xs text-gray-500 block mb-1">전용면적</span>
                  <span className="font-bold text-gray-900">{selectedProperty.area}평</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                   <span className="text-xs text-gray-500 block mb-1">층수</span>
                   <span className="font-bold text-gray-900">{selectedProperty.floor}층</span>
                </div>
                <div className="col-span-2 bg-gray-50 p-4 rounded-xl flex items-center">
                   <MapPin className="text-gray-400 mr-2" />
                   <span className="font-bold text-gray-900">{selectedProperty.location}</span>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-lg mb-3">상세 정보</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {selectedProperty.description}
                </p>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-lg mb-3">특징</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProperty.features.map((feature, i) => (
                    <span key={i} className="flex items-center text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">
                      <Check size={14} className="mr-1" />
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 p-4 bg-white border-t border-gray-100 flex gap-3">
               <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95">
                 문의하기
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;