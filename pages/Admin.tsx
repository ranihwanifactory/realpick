import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { Property, PropertyType, TradeType, PROPERTY_TYPES, TRADE_TYPES, NewsArticle } from '../types';
import { Plus, Edit2, Trash2, X, Save, Image as ImageIcon, Building2, Newspaper, ArrowRight } from 'lucide-react';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PROPERTIES' | 'NEWS'>('PROPERTIES');
  
  // Property State
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [editingPropId, setEditingPropId] = useState<string | null>(null);
  
  // News State
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);

  // Property Form State
  const initialPropForm: Omit<Property, 'id' | 'createdAt'> = {
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
  const [propFormData, setPropFormData] = useState(initialPropForm);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');

  // News Form State
  const initialNewsForm: Omit<NewsArticle, 'id' | 'createdAt'> = {
    title: '',
    summary: '',
    category: 'MARKET',
    date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    imageUrl: '',
    source: ''
  };
  const [newsFormData, setNewsFormData] = useState(initialNewsForm);

  // --- Fetch Data ---
  const fetchProperties = async () => {
    setLoadingProps(true);
    try {
      const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const props: Property[] = [];
      querySnapshot.forEach((doc) => props.push({ id: doc.id, ...doc.data() } as Property));
      setProperties(props);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoadingProps(false);
    }
  };

  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const news: NewsArticle[] = [];
      querySnapshot.forEach((doc) => news.push({ id: doc.id, ...doc.data() } as NewsArticle));
      setNewsList(news);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoadingNews(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'PROPERTIES') fetchProperties();
    else fetchNews();
  }, [activeTab]);

  // --- Property Handlers ---
  const handleSaveProp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPropId) {
        await updateDoc(doc(db, 'properties', editingPropId), { ...propFormData });
        alert('매물이 수정되었습니다.');
      } else {
        await addDoc(collection(db, 'properties'), { ...propFormData, createdAt: Date.now() });
        alert('새 매물이 등록되었습니다.');
      }
      setEditingPropId(null);
      setPropFormData(initialPropForm);
      fetchProperties();
    } catch (error) {
      console.error("Error saving property: ", error);
      alert('오류가 발생했습니다.');
    }
  };

  const handleEditProp = (prop: Property) => {
    setEditingPropId(prop.id);
    setPropFormData({
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

  const handleDeleteProp = async (id: string) => {
    if (window.confirm('삭제하시겠습니까?')) {
      await deleteDoc(doc(db, 'properties', id));
      setProperties(prev => prev.filter(p => p.id !== id));
    }
  };

  const addImage = () => {
    if (imageUrlInput.trim()) {
      setPropFormData(prev => ({ ...prev, images: [...prev.images, imageUrlInput.trim()] }));
      setImageUrlInput('');
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setPropFormData(prev => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
      setFeatureInput('');
    }
  };

  // --- News Handlers ---
  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNewsId) {
        await updateDoc(doc(db, 'news', editingNewsId), { ...newsFormData });
        alert('뉴스가 수정되었습니다.');
      } else {
        await addDoc(collection(db, 'news'), { ...newsFormData, createdAt: Date.now() });
        alert('새 뉴스가 등록되었습니다.');
      }
      setEditingNewsId(null);
      setNewsFormData(initialNewsForm);
      fetchNews();
    } catch (error) {
      console.error("Error saving news: ", error);
      alert('오류가 발생했습니다.');
    }
  };

  const handleEditNews = (news: NewsArticle) => {
    setEditingNewsId(news.id);
    setNewsFormData({
      title: news.title,
      summary: news.summary,
      category: news.category,
      date: news.date,
      imageUrl: news.imageUrl,
      source: news.source
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteNews = async (id: string) => {
    if (window.confirm('삭제하시겠습니까?')) {
      await deleteDoc(doc(db, 'news', id));
      setNewsList(prev => prev.filter(n => n.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
        
        {/* Tab Switcher */}
        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex">
          <button 
            onClick={() => setActiveTab('PROPERTIES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'PROPERTIES' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Building2 size={16} /> 매물 관리
          </button>
          <button 
            onClick={() => setActiveTab('NEWS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'NEWS' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Newspaper size={16} /> 뉴스 관리
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg h-fit sticky top-24">
          {activeTab === 'PROPERTIES' ? (
            <>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                {editingPropId ? <Edit2 className="mr-2" size={20} /> : <Plus className="mr-2" size={20} />}
                {editingPropId ? '매물 수정' : '새 매물 등록'}
              </h2>
              <form onSubmit={handleSaveProp} className="space-y-4">
                {/* Property Form Fields (Same as before) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <input required className="w-full p-2 border rounded-lg" value={propFormData.title} onChange={e => setPropFormData({...propFormData, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">매물 종류</label>
                    <select className="w-full p-2 border rounded-lg" value={propFormData.type} onChange={e => setPropFormData({...propFormData, type: e.target.value as PropertyType})}>
                      {Object.entries(PROPERTY_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">거래 유형</label>
                    <select className="w-full p-2 border rounded-lg" value={propFormData.tradeType} onChange={e => setPropFormData({...propFormData, tradeType: e.target.value as TradeType})}>
                      {Object.entries(TRADE_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                </div>
                {propFormData.tradeType === 'MONTHLY' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">보증금</label><input type="number" className="w-full p-2 border rounded-lg" value={propFormData.deposit} onChange={e => setPropFormData({...propFormData, deposit: Number(e.target.value)})} /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">월세</label><input type="number" className="w-full p-2 border rounded-lg" value={propFormData.monthlyRent} onChange={e => setPropFormData({...propFormData, monthlyRent: Number(e.target.value)})} /></div>
                  </div>
                ) : (
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">가격 (만원)</label><input type="number" className="w-full p-2 border rounded-lg" value={propFormData.price} onChange={e => setPropFormData({...propFormData, price: Number(e.target.value)})} /></div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">평수</label><input type="number" className="w-full p-2 border rounded-lg" value={propFormData.area} onChange={e => setPropFormData({...propFormData, area: Number(e.target.value)})} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">층수</label><input type="number" className="w-full p-2 border rounded-lg" value={propFormData.floor} onChange={e => setPropFormData({...propFormData, floor: Number(e.target.value)})} /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">위치</label><input className="w-full p-2 border rounded-lg" value={propFormData.location} onChange={e => setPropFormData({...propFormData, location: e.target.value})} /></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이미지 URL</label>
                  <div className="flex gap-2">
                    <input className="flex-1 p-2 border rounded-lg" value={imageUrlInput} placeholder="https://..." onChange={e => setImageUrlInput(e.target.value)} />
                    <button type="button" onClick={addImage} className="bg-gray-200 p-2 rounded-lg"><Plus size={20} /></button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">{propFormData.images.map((img, idx) => (<div key={idx} className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden"><img src={img} alt="" className="w-full h-full object-cover" /><button type="button" onClick={() => setPropFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5"><X size={12} /></button></div>))}</div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">특징</label>
                   <div className="flex gap-2"><input className="flex-1 p-2 border rounded-lg" value={featureInput} onChange={e => setFeatureInput(e.target.value)} /><button type="button" onClick={addFeature} className="bg-gray-200 p-2 rounded-lg"><Plus size={20} /></button></div>
                   <div className="mt-2 flex flex-wrap gap-2">{propFormData.features.map((f, idx) => (<span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">{f}<X size={12} className="ml-1 cursor-pointer" onClick={() => setPropFormData(prev => ({...prev, features: prev.features.filter((_, i) => i !== idx)}))} /></span>))}</div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">설명</label><textarea rows={4} className="w-full p-2 border rounded-lg" value={propFormData.description} onChange={e => setPropFormData({...propFormData, description: e.target.value})} /></div>
                
                <div className="flex gap-2 pt-4">
                  {editingPropId && <button type="button" onClick={() => { setEditingPropId(null); setPropFormData(initialPropForm); }} className="flex-1 bg-gray-200 py-3 rounded-xl font-bold">취소</button>}
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md flex justify-center items-center gap-2"><Save size={18} /> {editingPropId ? '수정' : '등록'}</button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                {editingNewsId ? <Edit2 className="mr-2" size={20} /> : <Plus className="mr-2" size={20} />}
                {editingNewsId ? '뉴스 수정' : '새 뉴스 등록'}
              </h2>
              <form onSubmit={handleSaveNews} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <input required className="w-full p-2 border rounded-lg" value={newsFormData.title} onChange={e => setNewsFormData({...newsFormData, title: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                   <select className="w-full p-2 border rounded-lg" value={newsFormData.category} onChange={e => setNewsFormData({...newsFormData, category: e.target.value as any})}>
                     <option value="MARKET">시장동향</option>
                     <option value="POLICY">부동산정책</option>
                     <option value="FINANCE">금융/세금</option>
                   </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">날짜 (YYYY.MM.DD)</label>
                  <input required className="w-full p-2 border rounded-lg" value={newsFormData.date} onChange={e => setNewsFormData({...newsFormData, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">출처</label>
                  <input required className="w-full p-2 border rounded-lg" value={newsFormData.source} onChange={e => setNewsFormData({...newsFormData, source: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이미지 URL</label>
                  <input className="w-full p-2 border rounded-lg" value={newsFormData.imageUrl} onChange={e => setNewsFormData({...newsFormData, imageUrl: e.target.value})} />
                  {newsFormData.imageUrl && <img src={newsFormData.imageUrl} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-lg" />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">요약 내용</label>
                  <textarea required rows={5} className="w-full p-2 border rounded-lg" value={newsFormData.summary} onChange={e => setNewsFormData({...newsFormData, summary: e.target.value})} />
                </div>
                
                <div className="flex gap-2 pt-4">
                  {editingNewsId && <button type="button" onClick={() => { setEditingNewsId(null); setNewsFormData(initialNewsForm); }} className="flex-1 bg-gray-200 py-3 rounded-xl font-bold">취소</button>}
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md flex justify-center items-center gap-2"><Save size={18} /> {editingNewsId ? '수정' : '등록'}</button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <h2 className="text-xl font-bold">
                 {activeTab === 'PROPERTIES' ? `등록된 매물 (${properties.length})` : `등록된 뉴스 (${newsList.length})`}
               </h2>
             </div>
             
             {activeTab === 'PROPERTIES' ? (
               loadingProps ? <div className="p-8 text-center text-gray-500">불러오는 중...</div> :
               properties.length === 0 ? <div className="p-8 text-center text-gray-500">매물이 없습니다.</div> :
               <div className="divide-y divide-gray-100">
                 {properties.map((prop) => (
                   <div key={prop.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                     <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                       <img src={prop.images[0] || 'https://via.placeholder.com/100'} alt="" className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-grow min-w-0">
                       <div className="flex items-center gap-2 mb-1">
                         <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{TRADE_TYPES[prop.tradeType]}</span>
                         <span className="text-xs font-medium text-gray-500">{PROPERTY_TYPES[prop.type]}</span>
                       </div>
                       <h3 className="font-bold text-gray-900 truncate">{prop.title}</h3>
                       <p className="text-sm text-gray-500 truncate">{prop.location} • {prop.area}평</p>
                       <p className="text-sm font-semibold text-blue-600 mt-1">{prop.tradeType === 'MONTHLY' ? `${prop.deposit}/${prop.monthlyRent}` : `${prop.price}만원`}</p>
                     </div>
                     <div className="flex flex-col gap-2">
                       <button onClick={() => handleEditProp(prop)} className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg"><Edit2 size={18} /></button>
                       <button onClick={() => handleDeleteProp(prop.id)} className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg"><Trash2 size={18} /></button>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               loadingNews ? <div className="p-8 text-center text-gray-500">불러오는 중...</div> :
               newsList.length === 0 ? <div className="p-8 text-center text-gray-500">뉴스가 없습니다.</div> :
               <div className="divide-y divide-gray-100">
                 {newsList.map((news) => (
                   <div key={news.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                     <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                       <img src={news.imageUrl || 'https://via.placeholder.com/100'} alt="" className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-grow min-w-0">
                       <div className="flex items-center gap-2 mb-1">
                         <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{news.category}</span>
                         <span className="text-xs text-gray-500">{news.date}</span>
                       </div>
                       <h3 className="font-bold text-gray-900 truncate">{news.title}</h3>
                       <p className="text-sm text-gray-500 line-clamp-2 mt-1">{news.summary}</p>
                       <p className="text-xs text-blue-500 mt-1">{news.source}</p>
                     </div>
                     <div className="flex flex-col gap-2">
                       <button onClick={() => handleEditNews(news)} className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg"><Edit2 size={18} /></button>
                       <button onClick={() => handleDeleteNews(news.id)} className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg"><Trash2 size={18} /></button>
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