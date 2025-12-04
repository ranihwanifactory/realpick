export type PropertyType = 'APARTMENT' | 'OFFICETEL' | 'VILLA' | 'ONEROOM' | 'COMMERCIAL';
export type TradeType = 'SALE' | 'JEONSE' | 'MONTHLY';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number; // For Sale/Jeonse
  deposit?: number; // For Monthly
  monthlyRent?: number; // For Monthly
  type: PropertyType;
  tradeType: TradeType;
  area: number; // in pyeong (평)
  floor: number;
  location: string;
  images: string[];
  features: string[];
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: 'MARKET' | 'POLICY' | 'FINANCE';
  date: string;
  imageUrl: string;
  source: string;
}

export const ADMIN_EMAIL = 'acehwan69@gmail.com';

export const PROPERTY_TYPES: Record<PropertyType, string> = {
  APARTMENT: '아파트',
  OFFICETEL: '오피스텔',
  VILLA: '빌라/투룸',
  ONEROOM: '원룸',
  COMMERCIAL: '상가/사무실'
};

export const TRADE_TYPES: Record<TradeType, string> = {
  SALE: '매매',
  JEONSE: '전세',
  MONTHLY: '월세'
};