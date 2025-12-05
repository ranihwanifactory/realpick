import React from 'react';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onLogin: () => void;
  onLogout: () => void;
  isAdmin: boolean;
  onOpenAdminPanel: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogin, onLogout, isAdmin, onOpenAdminPanel }) => {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-md shadow-md">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 text-white p-2 rounded-lg font-bold text-xl">
          PE
        </div>
        <span className="text-xl font-bold text-gray-800 hidden sm:block">PrimeEstate</span>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            {isAdmin && (
              <button
                onClick={onOpenAdminPanel}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-medium transition shadow-lg flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">매물 등록</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <img 
                src={user.photoURL || "https://picsum.photos/40/40"} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-gray-300"
              />
              <button
                onClick={onLogout}
                className="text-gray-600 hover:text-red-600 text-sm font-medium transition"
              >
                로그아웃
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={onLogin}
            className="bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-full text-sm font-medium transition shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
               <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            구글 로그인
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;