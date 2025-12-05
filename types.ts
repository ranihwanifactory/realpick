export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  type: 'apartment' | 'house' | 'studio' | 'land';
  lat: number;
  lng: number;
  imageUrl: string;
  createdAt: number;
  createdBy: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Global window extension for Kakao
declare global {
  interface Window {
    kakao: any;
  }
}