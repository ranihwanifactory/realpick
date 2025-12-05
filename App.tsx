import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Map from './components/Map';
import PropertyForm from './components/PropertyForm';
import PropertyCard from './components/PropertyCard';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { UserProfile, Property } from './types';

const ADMIN_EMAIL = 'acehwan69@gmail.com';

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [newPropertyLocation, setNewPropertyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
        setIsAdmin(firebaseUser.email === ADMIN_EMAIL);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Properties Listener
  useEffect(() => {
    const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedProperties = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
      setProperties(loadedProperties);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
      alert("로그인에 실패했습니다.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setIsAdmin(false); // Reset admin state immediately
  };

  const handleOpenAdminPanel = () => {
    setIsFormOpen(true);
    setNewPropertyLocation(null); // Reset location when opening fresh
    setIsSelectingLocation(false);
  };

  const handleSelectLocationMode = () => {
    setIsFormOpen(false); // Hide form temporarily
    setIsSelectingLocation(true); // Enable map click mode
    setSelectedProperty(null); // Deselect any active property
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (isSelectingLocation) {
      setNewPropertyLocation({ lat, lng });
      setIsSelectingLocation(false);
      setIsFormOpen(true); // Re-open form
    } else {
      // If clicking map in normal mode, deselect property
      setSelectedProperty(null);
    }
  };

  return (
    <div className="w-full h-screen relative flex flex-col overflow-hidden">
      {/* Navigation */}
      <Navbar 
        user={user} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
        isAdmin={isAdmin}
        onOpenAdminPanel={handleOpenAdminPanel}
      />

      {/* Main Map Area */}
      <div className="flex-1 relative">
        <Map 
          properties={properties}
          onMarkerClick={setSelectedProperty}
          isSelectingLocation={isSelectingLocation}
          onMapClick={handleMapClick}
        />
        
        {/* Helper overlay when map is empty or loading */}
        {properties.length === 0 && (
           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md px-6 py-4 rounded-xl shadow-lg pointer-events-none z-10 text-center">
             <p className="text-gray-500 font-medium">등록된 매물이 없습니다.</p>
             {isAdmin && <p className="text-indigo-600 text-sm mt-1">우측 상단 '매물 등록' 버튼을 눌러보세요.</p>}
           </div>
        )}
      </div>

      {/* Property Details Card */}
      {selectedProperty && (
        <PropertyCard 
          property={selectedProperty} 
          onClose={() => setSelectedProperty(null)} 
        />
      )}

      {/* Admin Property Form Modal */}
      {isAdmin && (
        <PropertyForm 
          user={user!}
          isOpen={isFormOpen} 
          onClose={() => {
            setIsFormOpen(false);
            setNewPropertyLocation(null);
          }}
          selectedLocation={newPropertyLocation}
          onSelectLocationMode={handleSelectLocationMode}
        />
      )}
    </div>
  );
}

export default App;