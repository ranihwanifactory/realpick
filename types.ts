export interface Property {
  id: string;
  title: string;
  description: string;
  price: number; // In Won (KRW)
  deposit?: number; // For Rent (Wolse/Jeonse)
  type: 'APT' | 'VILLA' | 'OFFICETEL' | 'HOUSE';
  dealType: 'SALE' | 'JEONSE' | 'WOLSE';
  area: number; // m2
  floor: number;
  address: string;
  lat: number;
  lng: number;
  imageUrl: string;
  createdAt: number;
}

export enum PropertyType {
  APT = '아파트',
  VILLA = '빌라/주택',
  OFFICETEL = '오피스텔',
  HOUSE = '단독주택'
}

export enum DealType {
  SALE = '매매',
  JEONSE = '전세',
  WOLSE = '월세'
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
}

export const ADMIN_EMAIL = 'acehwan69@gmail.com';