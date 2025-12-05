import React from 'react';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  onClose: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClose }) => {
  const formatPrice = (price: number) => {
    if (price >= 10000) {
      const eok = Math.floor(price / 10000);
      const man = price % 10000;
      return `${eok}억 ${man > 0 ? man + '만원' : ''}`;
    }
    return `${price}만원`;
  };

  const getTypeLabel = (type: Property['type']) => {
    const labels = {
      apartment: '아파트',
      house: '주택',
      studio: '원룸/오피스텔',
      land: '토지'
    };
    return labels[type] || '기타';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 bg-white sm:rounded-2xl shadow-2xl z-40 overflow-hidden animate-slide-up border border-gray-100 flex flex-col max-h-[60vh] sm:max-h-[80vh]">
      <div className="relative h-48 sm:h-56 bg-gray-200 shrink-0">
        <img 
          src={property.imageUrl} 
          alt={property.title} 
          className="w-full h-full object-cover"
        />
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition backdrop-blur-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm">
          {getTypeLabel(property.type)}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
           <h3 className="text-white text-xl font-bold truncate shadow-sm">{property.title}</h3>
        </div>
      </div>
      
      <div className="p-5 overflow-y-auto">
        <div className="flex justify-between items-baseline mb-4">
          <span className="text-2xl font-extrabold text-indigo-600">{formatPrice(property.price)}</span>
          <span className="text-xs text-gray-400">{new Date(property.createdAt).toLocaleDateString()}</span>
        </div>
        
        <p className="text-gray-600 text-sm leading-relaxed mb-6 whitespace-pre-line">
          {property.description || "상세 설명이 없습니다."}
        </p>

        <div className="mt-auto">
            <button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                문의하기
            </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;