import React from 'react';
import { Property, PropertyType, DealType } from '../types';
import { formatFullPrice } from '../utils/format';
import { MapPin, Building, Ruler } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick, isAdmin, onDelete }) => {
  return (
    <div 
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100 flex flex-col h-full cursor-pointer group"
      onClick={onClick}
    >
      {/* Image Section */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-200">
        <img 
          src={property.imageUrl} 
          alt={property.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-1">
          <span className={`px-2 py-1 text-xs font-bold rounded-md text-white
            ${property.dealType === 'SALE' ? 'bg-blue-600' : ''}
            ${property.dealType === 'JEONSE' ? 'bg-green-600' : ''}
            ${property.dealType === 'WOLSE' ? 'bg-orange-500' : ''}
          `}>
            {DealType[property.dealType]}
          </span>
          <span className="px-2 py-1 text-xs font-medium bg-black/60 text-white rounded-md backdrop-blur-sm">
            {PropertyType[property.type]}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
          {formatFullPrice(property.dealType, property.price, property.deposit)}
        </h3>
        
        <div className="flex items-center text-gray-500 text-sm mb-3">
           <Ruler size={14} className="mr-1" />
           <span>{property.area}m² ({Math.round(property.area / 3.30579)}평)</span>
           <span className="mx-2">•</span>
           <span>{property.floor}층</span>
        </div>

        <h4 className="font-medium text-gray-800 line-clamp-1 mb-1">{property.title}</h4>
        
        <div className="flex items-center text-gray-400 text-xs mt-auto">
          <MapPin size={12} className="mr-1" />
          <span className="truncate">{property.address}</span>
        </div>
      </div>

      {/* Admin Actions */}
      {isAdmin && onDelete && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if(window.confirm('정말 삭제하시겠습니까?')) onDelete(property.id);
            }}
            className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 hover:bg-red-50 rounded"
          >
            매물 삭제
          </button>
        </div>
      )}
    </div>
  );
};

export default PropertyCard;