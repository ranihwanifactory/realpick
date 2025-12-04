import React, { useState } from 'react';
import { NewsArticle } from '../types';
import { Newspaper, TrendingUp, Scale, Landmark, Calendar, ExternalLink } from 'lucide-react';

// Mock Data for News
const MOCK_NEWS: NewsArticle[] = [
  {
    id: '1',
    title: '2024년 하반기 부동산 시장 전망: 수도권 반등 시작되나?',
    summary: '서울 주요 지역의 아파트 거래량이 증가세를 보이며 하반기 부동산 시장의 회복 기대감이 커지고 있습니다. 전문가들의 분석을 들어봅니다.',
    category: 'MARKET',
    date: '2024.05.20',
    imageUrl: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    source: '부동산데일리'
  },
  {
    id: '2',
    title: '전세사기 피해 방지법 국회 본회의 통과',
    summary: '임차인의 보증금을 보호하기 위한 특별법 개정안이 통과되었습니다. 주요 변경 사항과 임차인이 알아야 할 주의사항을 정리했습니다.',
    category: 'POLICY',
    date: '2024.05.18',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    source: '정책뉴스'
  },
  {
    id: '3',
    title: '신생아 특례대출 금리 인하, 신혼부부 내 집 마련 기회',
    summary: '정부가 저출산 대책의 일환으로 신생아 특례대출의 금리를 추가 인하하기로 결정했습니다. 대출 한도와 조건이 어떻게 바뀌었는지 확인하세요.',
    category: 'FINANCE',
    date: '2024.05.15',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    source: '금융인사이트'
  },
  {
    id: '4',
    title: 'GTX-A 노선 개통 한 달, 동탄·수서 역세권 집값 들썩',
    summary: 'GTX-A 노선 개통 이후 동탄역 인근 아파트 호가가 상승세를 보이고 있습니다. 교통 호재가 실제 시장에 미치는 영향을 분석했습니다.',
    category: 'MARKET',
    date: '2024.05.10',
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    source: '메트로경제'
  },
  {
    id: '5',
    title: '재건축 초과이익 환수제 완화, 강남권 정비사업 탄력',
    summary: '재초환 완화 법안 시행으로 인해 그동안 주춤했던 강남권 주요 재건축 단지들의 사업 속도가 빨라질 것으로 예상됩니다.',
    category: 'POLICY',
    date: '2024.05.05',
    imageUrl: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    source: '건설타임즈'
  }
];

const News: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const filteredNews = activeCategory === 'ALL' 
    ? MOCK_NEWS 
    : MOCK_NEWS.filter(news => news.category === activeCategory);

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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredNews.map((news) => (
          <article 
            key={news.id} 
            className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full"
          >
            <div className="relative h-48 overflow-hidden">
              <img 
                src={news.imageUrl} 
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
    </div>
  );
};

export default News;