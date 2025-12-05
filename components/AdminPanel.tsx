import React, { useState } from 'react';
import { Property, PropertyType, DealType } from '../types';
import { X, Plus, Upload } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface AdminPanelProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Property>>({
    type: 'APT',
    dealType: 'SALE',
    floor: 1,
    area: 84,
    price: 0,
    deposit: 0,
    lat: 37.5665,
    lng: 126.9780,
    imageUrl: 'https://picsum.photos/800/600',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'price' || name === 'deposit' || name === 'area' || name === 'floor' || name === 'lat' || name === 'lng') 
        ? parseFloat(value) 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.title || !formData.address || !formData.price) {
        alert("필수 정보를 입력해주세요.");
        setLoading(false);
        return;
      }

      const newProperty = {
        ...formData,
        createdAt: Date.now(),
      };

      await addDoc(collection(db, 'properties'), newProperty);
      alert('매물이 성공적으로 등록되었습니다.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error adding property: ", error);
      alert('매물 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Plus className="text-blue-600" size={24} />
            새 매물 등록
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">매물 제목</label>
              <input 
                name="title" 
                required 
                placeholder="예: 강남역 도보 5분 채광 좋은 오피스텔" 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명</label>
              <input 
                name="description" 
                placeholder="특징이나 장점을 간략히" 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Type & Deal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">건물 형태</label>
              <select 
                name="type" 
                className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                onChange={handleChange}
                value={formData.type}
              >
                {Object.entries(PropertyType).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">거래 종류</label>
              <select 
                name="dealType" 
                className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                onChange={handleChange}
                value={formData.dealType}
              >
                {Object.entries(DealType).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price */}
          <div className="bg-blue-50 p-4 rounded-xl space-y-4">
            <h3 className="font-semibold text-blue-900 text-sm">가격 정보 (단위: 원)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.dealType === 'WOLSE' ? '보증금' : '매매가/전세금'}
                </label>
                <input 
                  type="number" 
                  name="price" 
                  required 
                  placeholder="숫자만 입력 (예: 100000000)" 
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                  onChange={handleChange}
                />
              </div>
              {formData.dealType === 'WOLSE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">월세</label>
                  <input 
                    type="number" 
                    name="deposit" // Using deposit field for monthly rent in WOLSE case for simplicity in this form logic, swapped in display
                    required 
                    placeholder="숫자만 입력" 
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">전용면적 (m²)</label>
              <input 
                type="number" 
                name="area" 
                className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                onChange={handleChange}
                defaultValue={84}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">층수</label>
              <input 
                type="number" 
                name="floor" 
                className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                onChange={handleChange}
                defaultValue={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이미지 URL</label>
              <input 
                name="imageUrl" 
                className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                placeholder="https://..."
                defaultValue="https://picsum.photos/800/600"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">위치 정보</label>
            <input 
              name="address" 
              required
              placeholder="상세 주소 입력" 
              className="w-full p-2 border border-gray-300 rounded-lg outline-none"
              onChange={handleChange}
            />
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs text-gray-500">위도 (Latitude)</label>
                  <input name="lat" type="number" step="any" defaultValue={37.5665} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm" />
               </div>
               <div>
                  <label className="text-xs text-gray-500">경도 (Longitude)</label>
                  <input name="lng" type="number" step="any" defaultValue={126.9780} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm" />
               </div>
            </div>
            <p className="text-xs text-gray-400">* 실제 서비스에서는 주소 검색 API로 자동 입력됩니다. 테스트를 위해 위도/경도를 직접 수정하거나 기본값(서울 시청)을 사용하세요.</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? '등록 중...' : '매물 등록하기'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;