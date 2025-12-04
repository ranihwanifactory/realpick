import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { Property, PropertyType, TradeType, PROPERTY_TYPES, TRADE_TYPES } from '../types';
import { Plus, Edit2, Trash2, X, Save, Image as ImageIcon } from 'lucide-react';

const Admin: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const initialFormState: Omit<Property, 'id' | 'createdAt'> = {
    title: '',
    description: '',
    price: 0,
    deposit: 0,
    monthlyRent: 0,
    type: 'APARTMENT',
    tradeType: 'SALE',
    area: 0,
    floor: 1,
    location: '',
    images: [],
    features: []
  };

  const [formData, setFormData] = useState(initialFormState);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');

  // Fetch Data
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const props: Property[] = [];
      querySnapshot.forEach((doc) => {
        props.push({ id: doc.id, ...doc.data() } as Property);
      });
      setProperties(props);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // CRUD Handlers
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update
        const docRef = doc(db, 'properties', editingId);
        await updateDoc(docRef, { ...formData });
        alert('매물이 수정되었습니다.');
      } else {
        // Create
        await addDoc(collection(db, 'properties'), {
          ...formData,
          createdAt: Date.now()
        });
        alert('새 매물이 등록되었습니다.');
      }
      setEditingId(null);
      setFormData(initialFormState);
      fetchProperties();
    } catch (error) {
      console.error("Error saving document: ", error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = (prop: Property) => {
    setEditingId(prop.id);
    setFormData({
      title: prop.title,
      description: prop.description,
      price: prop.price,
      deposit: prop.deposit || 0,
      monthlyRent: prop.monthlyRent || 0,
      type: prop.type,
      tradeType: prop.tradeType,
      area: prop.area,
      floor: prop.floor,
      location: prop.location,
      images: prop.images,
      features: prop.features || []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('정말 이 매물을 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'properties', id));
        setProperties(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    }
  };

  const addImage = () => {
    if (imageUrlInput.trim()) {
      setFormData(prev => ({ ...prev, images: [...prev.images, imageUrlInput.trim()] }));
      setImageUrlInput('');
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
      setFeatureInput('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg h-fit sticky top-24">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            {editingId ? <Edit2 className="mr-2" size={20} /> : <Plus className="mr-2" size={20} />}
            {editingId ? '매물 수정' : '새 매물 등록'}
          </h2>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
              <input 
                required 
                className="w-full p-2 border rounded-lg" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">매물 종류</label>
                <select 
                  className="w-full p-2 border rounded-lg"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as PropertyType})}
                >
                  {Object.entries(PROPERTY_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">거래 유형</label>
                <select 
                  className="w-full p-2 border rounded-lg"
                  value={formData.tradeType}
                  onChange={e => setFormData({...formData, tradeType: e.target.value as TradeType})}
                >
                  {Object.entries(TRADE_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {formData.tradeType === 'MONTHLY' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">보증금 (만원)</label>
                   <input type="number" className="w-full p-2 border rounded-lg" 
                     value={formData.deposit}
                     onChange={e => setFormData({...formData, deposit: Number(e.target.value)})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">월세 (만원)</label>
                   <input type="number" className="w-full p-2 border rounded-lg" 
                     value={formData.monthlyRent}
                     onChange={e => setFormData({...formData, monthlyRent: Number(e.target.value)})}
                   />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">가격 (만원)</label>
                <input type="number" className="w-full p-2 border rounded-lg" 
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">평수</label>
                <input type="number" className="w-full p-2 border rounded-lg" 
                  value={formData.area}
                  onChange={e => setFormData({...formData, area: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">층수</label>
                <input type="number" className="w-full p-2 border rounded-lg" 
                  value={formData.floor}
                  onChange={e => setFormData({...formData, floor: Number(e.target.value)})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">위치 (동/구)</label>
              <input 
                className="w-full p-2 border rounded-lg" 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
            </div>

             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이미지 URL</label>
              <div className="flex gap-2">
                <input 
                  className="flex-1 p-2 border rounded-lg" 
                  value={imageUrlInput}
                  placeholder="https://..."
                  onChange={e => setImageUrlInput(e.target.value)}
                />
                <button type="button" onClick={addImage} className="bg-gray-200 p-2 rounded-lg hover:bg-gray-300">
                  <Plus size={20} />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden">
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                      className="absolute top-0 right-0 bg-red-500 text-white p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">특징/태그</label>
               <div className="flex gap-2">
                  <input 
                    className="flex-1 p-2 border rounded-lg" 
                    value={featureInput}
                    placeholder="예: 남향, 역세권"
                    onChange={e => setFeatureInput(e.target.value)}
                  />
                  <button type="button" onClick={addFeature} className="bg-gray-200 p-2 rounded-lg hover:bg-gray-300">
                    <Plus size={20} />
                  </button>
               </div>
               <div className="mt-2 flex flex-wrap gap-2">
                 {formData.features.map((f, idx) => (
                   <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                     {f}
                     <X size={12} className="ml-1 cursor-pointer" onClick={() => setFormData(prev => ({...prev, features: prev.features.filter((_, i) => i !== idx)}))} />
                   </span>
                 ))}
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명</label>
              <textarea 
                rows={4}
                className="w-full p-2 border rounded-lg" 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="flex gap-2 pt-4">
              {editingId && (
                <button 
                  type="button" 
                  onClick={() => { setEditingId(null); setFormData(initialFormState); }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
              )}
              <button 
                type="submit" 
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md flex justify-center items-center gap-2"
              >
                <Save size={18} />
                {editingId ? '수정 완료' : '등록하기'}
              </button>
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
             <div className="p-6 border-b border-gray-100">
               <h2 className="text-xl font-bold">등록된 매물 목록 ({properties.length})</h2>
             </div>
             
             {loading ? (
               <div className="p-8 text-center text-gray-500">불러오는 중...</div>
             ) : properties.length === 0 ? (
               <div className="p-8 text-center text-gray-500">등록된 매물이 없습니다.</div>
             ) : (
               <div className="divide-y divide-gray-100">
                 {properties.map((prop) => (
                   <div key={prop.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                     <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                       {prop.images[0] ? (
                         <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-gray-400">
                           <ImageIcon size={24} />
                         </div>
                       )}
                     </div>
                     <div className="flex-grow min-w-0">
                       <div className="flex items-center gap-2 mb-1">
                         <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                           {TRADE_TYPES[prop.tradeType]}
                         </span>
                         <span className="text-xs font-medium text-gray-500">
                           {PROPERTY_TYPES[prop.type]}
                         </span>
                       </div>
                       <h3 className="font-bold text-gray-900 truncate">{prop.title}</h3>
                       <p className="text-sm text-gray-500 truncate">{prop.location} • {prop.area}평</p>
                       <p className="text-sm font-semibold text-blue-600 mt-1">
                          {prop.tradeType === 'MONTHLY' 
                            ? `${prop.deposit}/${prop.monthlyRent}` 
                            : `${prop.price}만원`}
                       </p>
                     </div>
                     <div className="flex flex-col gap-2">
                       <button 
                         onClick={() => handleEdit(prop)}
                         className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                       >
                         <Edit2 size={18} />
                       </button>
                       <button 
                         onClick={() => handleDelete(prop.id)}
                         className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                       >
                         <Trash2 size={18} />
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;