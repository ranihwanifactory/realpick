import React from 'react';
import { Property, PROPERTY_TYPES, TRADE_TYPES } from '../types';
import { MapPin, Ruler, Layers } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick }) => {
  // Format price helper
  const formatPrice = () => {
    if (property.tradeType === 'MONTHLY') {
      return `보 ${formatNumber(property.deposit || 0)} / 월 ${formatNumber(property.monthlyRent || 0)}`;
    }
    return formatNumber(property.price);
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      const uk = Math.floor(num / 10000);
      const rest = num % 10000;
      return `${uk}억 ${rest > 0 ? rest.toLocaleString() : ''}`;
    }
    return num.toLocaleString() + '만원';
  };

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      <div className="relative h-48 overflow-hidden bg-gray-200">
        <img 
          src={property.images[0] || 'https://picsum.photos/400/300'} 
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
          {TRADE_TYPES[property.tradeType]}
        </div>
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-gray-800 text-xs font-semibold px-2 py-1 rounded-md">
          {PROPERTY_TYPES[property.type]}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-2">
          <h2 className="text-xl font-bold text-gray-900 truncate">{formatPrice()}</h2>
          <p className="text-sm text-gray-500 truncate">{property.title}</p>
        </div>

        <div className="flex items-center text-gray-500 text-xs mb-4 space-x-3">
          <div className="flex items-center">
            <Ruler size={14} className="mr-1" />
            <span>{property.area}평</span>
          </div>
          <div className="flex items-center">
            <Layers size={14} className="mr-1" />
            <span>{property.floor}층</span>
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center text-gray-400 text-xs">
          <MapPin size={14} className="mr-1" />
          <span className="truncate">{property.location}</span>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;