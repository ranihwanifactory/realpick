import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { NewsArticle } from '../types';
import { Newspaper, TrendingUp, Scale, Landmark, Calendar, ExternalLink } from 'lucide-react';

const News: React.FC = () => {
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const newsData: NewsArticle[] = [];
        querySnapshot.forEach((doc) => {
          newsData.push({ id: doc.id, ...doc.data() } as NewsArticle);
        });
        setNewsList(newsData);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const filteredNews = activeCategory === 'ALL' 
    ? newsList 
    : newsList.filter(news => news.category === activeCategory);

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'MARKET': return <TrendingUp size={16} />;
      case 'POLICY': return <Scale size={16} />;
      case 'FINANCE': return <Landmark size={16} />;
      default: return <Newspaper size={16} />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch(cat) {
      case 'MARKET': return '시장동향';
      case 'POLICY': return '부동산정책';
      case 'FINANCE': return '금융/세금';
      default: return '전체';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">부동산 뉴스 & 인사이트</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          HomePick이 엄선한 최신 부동산 트렌드와 정책 정보를 확인하세요.
          정확한 정보로 현명한 내 집 마련을 돕습니다.
        </p>
      </div>

      {/* Categories */}
      <div className="flex justify-center mb-12">
        <div className="bg-white p-1.5 rounded-full shadow-sm border border-gray-100 flex space-x-1">
          {['ALL', 'MARKET', 'POLICY', 'FINANCE'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                activeCategory === cat 
                  ? 'bg-blue-900 text-white shadow-md' 
                  : 'bg-transparent text-gray-500 hover:bg-gray-100'
              }`}
            >
              {activeCategory === cat && getCategoryIcon(cat === 'ALL' ? 'MARKET' : cat)}
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          <p className="mt-2 text-gray-500">뉴스를 불러오는 중입니다...</p>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl">
          <p className="text-gray-500">등록된 뉴스가 없습니다.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNews.map((news) => (
            <article 
              key={news.id} 
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full"
            >
              <div className="relative h-48 overflow-hidden bg-gray-200">
                <img 
                  src={news.imageUrl || 'https://images.unsplash.com/photo-1504384308090-c54be3855833?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'} 
                  alt={news.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-blue-900 flex items-center gap-1 shadow-sm">
                  {getCategoryIcon(news.category)}
                  {getCategoryLabel(news.category)}
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center text-xs text-gray-400 mb-3 gap-2">
                  <span className="font-semibold text-blue-600">{news.source}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {news.date}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors">
                  {news.title}
                </h3>
                
                <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                  {news.summary}
                </p>
                
                <div className="mt-auto pt-4 border-t border-gray-50">
                  <button className="text-blue-600 text-sm font-bold flex items-center gap-1 group/btn">
                    자세히 보기 
                    <ExternalLink size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default News;