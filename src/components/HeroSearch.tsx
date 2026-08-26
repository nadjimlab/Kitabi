import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  MapPin, 
  BookOpen, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  Coins, 
  ArrowLeft, 
  ArrowRight,
  PlusCircle,
  GraduationCap,
  Award,
  Backpack,
  Building2,
  Clock
} from 'lucide-react';
import { EducationLevel, RecentSearchItem } from '../types';
import { EDUCATION_LEVELS, WILAYAS } from '../data/algerianData';

interface HeroSearchProps {
  onSearch: (query: string, level?: EducationLevel | 'all') => void;
  onOpenCreateListing: () => void;
  stats: {
    totalBooks: number;
    activeExchanges: number;
    freeDonations: number;
    estimatedSavingsDZD: number;
    activeWilayasCount: number;
  };
  lang: 'ar' | 'fr';
  selectedWilayaCode: number;
  onSelectWilaya: (code: number) => void;
  recentSearches?: RecentSearchItem[];
  onSelectRecentSearch?: (item: RecentSearchItem) => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  onSearch,
  onOpenCreateListing,
  stats,
  lang,
  selectedWilayaCode,
  onSelectWilaya,
  recentSearches = [],
  onSelectRecentSearch
}) => {
  const [query, setQuery] = useState('');
  const [activeLevel, setActiveLevel] = useState<EducationLevel | 'all'>('all');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, activeLevel);
  };

  const quickTags = [
    { labelAr: "كتب البكالوريا 2025", labelFr: "BAC 2025", q: "بكالوريا", level: "secondary" as EducationLevel },
    { labelAr: "السنة 4 متوسط (BEM)", labelFr: "BEM 4AM", q: "متوسط", level: "middle" as EducationLevel },
    { labelAr: "كتب الابتدائي كاملة", labelFr: "Primaire complet", q: "ابتدائي", level: "primary" as EducationLevel },
    { labelAr: "سلاسل الميسر والهباج", labelFr: "Séries El Mouyasser", q: "الميسر", level: "secondary" as EducationLevel },
    { labelAr: "كتب مهداة مجاناً (صدقة)", labelFr: "Dons gratuits", q: "صدقة", level: 'all' as const }
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#0B192C] via-[#0e233d] to-[#122e4f] text-white pt-8 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
      {/* Subtle geometric and ambient glow backgrounds */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Tagline & Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-950/80 border border-brand-500/30 text-brand-300 text-xs sm:text-sm font-semibold mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{lang === 'ar' ? 'المنصة الجزائرية الأولى لتبادل الكتب المدرسية' : '1ère bourse de livres scolaires en Algérie'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight sm:leading-snug font-serif">
            {lang === 'ar' ? (
              <>
                كتابي: <span className="bg-gradient-to-r from-brand-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">اشري • بيع • بدّل • وفّر</span>
              </>
            ) : (
              <>
                Ktabi: <span className="bg-gradient-to-r from-brand-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">Achetez • Vendez • Échangez</span>
              </>
            )}
          </h1>

          <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-2xl font-medium">
            {lang === 'ar' 
              ? 'تصفح آلاف الكتب المدرسية والمراجع لجميع الأطوار (الابتدائي، المتوسط، الثانوي، والجامعي) في 69 ولاية جزائرية، مع إمكانية التبادل المباشر، التبرع، والشحن بالدفع عند الاستلام.' 
              : 'Trouvez et échangez vos manuels scolaires et parascolaires dans 69 wilayas. Livraison et paiement à la livraison disponibles.'}
          </p>
        </div>

        {/* Main Search Bar Card */}
        <div className="bg-slate-900/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-700/80 shadow-2xl shadow-black/40 mb-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5">
            
            {/* Input field */}
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-3.5 sm:top-3.5 w-5 h-5 text-slate-400" />
              <input
                id="hero-search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={lang === 'ar' ? 'ابحث عن كتاب، مادة (رياضيات، فيزياء...)، مستوى (3 ثانوي BAC)...' : 'Rechercher un manuel, matière, niveau (ex: 3AS BAC)...'}
                className="w-full bg-slate-800 text-white placeholder-slate-400 text-sm sm:text-base pr-11 pl-4 py-3 sm:py-3.5 rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-medium"
              />
            </div>

            {/* Wilaya Filter inside Search */}
            <div className="sm:w-48">
              <select
                id="hero-wilaya-select"
                value={selectedWilayaCode}
                onChange={(e) => onSelectWilaya(Number(e.target.value))}
                className="w-full h-full bg-slate-800 text-white text-xs sm:text-sm px-3 py-3 sm:py-3.5 rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500 transition-colors"
              >
                <option value={0}>{lang === 'ar' ? 'جميع الولايات (69)' : '69 Wilayas'}</option>
                {WILAYAS.map(w => (
                  <option key={w.code} value={w.code}>
                    {w.code}. {lang === 'ar' ? w.nameAr : w.nameFr}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Submit Button */}
            <button
              id="hero-search-submit-btn"
              type="submit"
              className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm sm:text-base px-6 py-3 sm:py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-950 active:scale-95 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>{lang === 'ar' ? 'بحث سريع' : 'Rechercher'}</span>
            </button>

          </form>

          {/* Quick Trending Tags */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              {lang === 'ar' ? 'الأكثر طلباً:' : 'Populaire:'}
            </span>
            {quickTags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(tag.q);
                  setActiveLevel(tag.level);
                  onSearch(tag.q, tag.level);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-brand-900/40 hover:text-brand-300 text-slate-300 border border-slate-700/60 transition-colors text-[11px] font-medium"
              >
                {lang === 'ar' ? tag.labelAr : tag.labelFr}
              </button>
            ))}
          </div>

          {/* Recent Searches history in Hero (if any) */}
          {recentSearches && recentSearches.length > 0 && onSelectRecentSearch && (
            <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-400" />
                {lang === 'ar' ? 'عملياتك الأخيرة (مخزنة محلياً):' : 'Vos recherches récentes:'}
              </span>
              {recentSearches.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectRecentSearch(item)}
                  className="px-2.5 py-0.5 rounded-lg bg-brand-950/70 hover:bg-brand-900/90 text-brand-300 border border-brand-800/60 transition-colors text-[11px] font-semibold flex items-center gap-1"
                >
                  <span>{item.query ? `"${item.query}"` : 'تصفية سابقة'}</span>
                  {item.resultCount > 0 && (
                    <span className="text-[9px] text-brand-400 font-mono">({item.resultCount})</span>
                  )}
                </button>
              ))}
            </div>
          )}

        </div>

        {/* Education Level Quick Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 mb-8">
          {EDUCATION_LEVELS.map((lvl) => {
            const getIcon = () => {
              switch(lvl.id) {
                case 'primary': return <Backpack className="w-5 h-5" />;
                case 'middle': return <GraduationCap className="w-5 h-5" />;
                case 'secondary': return <Award className="w-5 h-5" />;
                case 'university': return <Building2 className="w-5 h-5" />;
                default: return <BookOpen className="w-5 h-5" />;
              }
            };

            return (
              <button
                key={lvl.id}
                id={`level-card-${lvl.id}`}
                onClick={() => {
                  setActiveLevel(lvl.id);
                  onSearch('', lvl.id);
                }}
                className="group p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-slate-700/60 hover:border-brand-500/50 transition-all text-start flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${lvl.color} text-white shadow-sm group-hover:scale-110 transition-transform`}>
                    {getIcon()}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">
                    {lvl.id === 'primary' ? '1AP-5AP' : lvl.id === 'middle' ? '1AM-4AM' : lvl.id === 'secondary' ? '1AS-3AS' : 'SUP'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-brand-300 transition-colors">
                    {lang === 'ar' ? lvl.labelAr : lvl.labelFr}
                  </h3>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {lang === 'ar' ? lvl.desc : lvl.labelFr}
                  </p>
                </div>
              </button>
            );
          })}
        </div>


        {/* Quick Hero CTA to post book */}
        <div className="mt-6 flex items-center justify-center">
          <button
            id="hero-quick-publish-cta"
            onClick={onOpenCreateListing}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-lg shadow-amber-950/40 hover:scale-105 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>{lang === 'ar' ? '➕ هل لديك كتب لا تحتاجها؟ أضفها في دقيقتين وساعد غيرك' : '➕ Vous avez des manuels? Publiez en 2 minutes'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
