import React from 'react';
import { 
  History, 
  Trash2, 
  Zap, 
  RotateCw, 
  Database, 
  MapPin, 
  GraduationCap, 
  X,
  Clock,
  Sparkles
} from 'lucide-react';
import { RecentSearchItem, EducationLevel } from '../types';
import { EDUCATION_LEVELS, WILAYAS } from '../data/algerianData';

interface RecentSearchesBarProps {
  recentSearches: RecentSearchItem[];
  onSelectRecentSearch: (item: RecentSearchItem) => void;
  onRemoveRecentSearch: (id: string) => void;
  onClearRecentSearches: () => void;
  isFromCache: boolean;
  cacheTimestamp: number | null;
  cacheHitCount?: number;
  onRefreshResults: () => void;
  lang: 'ar' | 'fr';
}

export const RecentSearchesBar: React.FC<RecentSearchesBarProps> = ({
  recentSearches,
  onSelectRecentSearch,
  onRemoveRecentSearch,
  onClearRecentSearches,
  isFromCache,
  cacheTimestamp,
  cacheHitCount = 1,
  onRefreshResults,
  lang
}) => {
  // Format relative cache time
  const formatCacheTime = (ts: number) => {
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 15) return lang === 'ar' ? 'الآن' : "À l'instant";
    if (diffSec < 60) return lang === 'ar' ? `منذ ${diffSec} ثانية` : `Il y a ${diffSec}s`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return lang === 'ar' ? `منذ ${diffMin} دقيقة` : `Il y a ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    return lang === 'ar' ? `منذ ${diffHours} ساعة` : `Il y a ${diffHours}h`;
  };

  const getLevelLabel = (lvl?: EducationLevel | 'all') => {
    if (!lvl || lvl === 'all') return null;
    const found = EDUCATION_LEVELS.find(l => l.id === lvl);
    return found ? (lang === 'ar' ? found.labelAr : found.labelFr) : null;
  };

  const getWilayaLabel = (code?: number) => {
    if (!code || code === 0) return null;
    const found = WILAYAS.find(w => w.code === code);
    return found ? (lang === 'ar' ? found.nameAr : found.nameFr) : null;
  };

  return (
    <div className="space-y-2.5">
      {/* Cache Status Banner (when served from localStorage cache) */}
      {isFromCache && cacheTimestamp && (
        <div className="bg-gradient-to-r from-brand-50 via-teal-50 to-brand-50 border border-brand-200/80 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-brand-900 font-medium">
            <div className="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            </div>
            <div>
              <div className="font-bold flex items-center gap-1.5 flex-wrap">
                <span>{lang === 'ar' ? 'نتائج مسترجعة فورياً من التخزين المؤقت المحلي (توفير البيانات)' : 'Résultats chargés depuis le cache local (Économie de données)'}</span>
                <span className="text-[10px] bg-brand-200/80 text-brand-800 px-1.5 py-0.5 rounded font-mono font-bold">
                  {formatCacheTime(cacheTimestamp)}
                </span>
              </div>
              <p className="text-[11px] text-brand-700 hidden sm:block">
                {lang === 'ar' 
                  ? 'تم تقليل استهلاك باقة 3G/4G عبر استرجاع نتائج البحث السابقة من الذاكرة المحلية للجهاز.' 
                  : 'Chargement ultra-rapide sans re-télécharger les données.'}
              </p>
            </div>
          </div>

          <button
            onClick={onRefreshResults}
            title={lang === 'ar' ? 'تحديث النتائج من الخادم والذاكرة' : 'Actualiser les résultats'}
            className="bg-white hover:bg-brand-100 text-brand-800 border border-brand-300 font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors text-xs shrink-0 shadow-xs active:scale-95"
          >
            <RotateCw className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'تحديث فوري' : 'Actualiser'}</span>
          </button>
        </div>
      )}

      {/* Recent Searches Chips list */}
      {recentSearches.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-bold shrink-0 ml-1">
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>{lang === 'ar' ? 'عمليات البحث الأخيرة:' : 'Recherches récentes:'}</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            {recentSearches.slice(0, 8).map(item => {
              const lvlLabel = getLevelLabel(item.level);
              const wilayaLabel = getWilayaLabel(item.wilayaCode);

              return (
                <div
                  key={item.id}
                  className="group inline-flex items-center gap-1.5 bg-slate-100 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 rounded-xl px-2.5 py-1 transition-all text-slate-700 hover:text-brand-900 shrink-0"
                >
                  <button
                    onClick={() => onSelectRecentSearch(item)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-start"
                  >
                    <Clock className="w-3 h-3 text-slate-400 group-hover:text-brand-500" />
                    <span>{item.query ? `"${item.query}"` : (lang === 'ar' ? 'تصفية سريعة' : 'Filtre rapide')}</span>

                    {lvlLabel && (
                      <span className="text-[10px] bg-slate-200 group-hover:bg-brand-200/70 text-slate-700 group-hover:text-brand-800 px-1 py-0.2 rounded">
                        {lvlLabel}
                      </span>
                    )}

                    {wilayaLabel && (
                      <span className="text-[10px] bg-slate-200 group-hover:bg-brand-200/70 text-slate-700 group-hover:text-brand-800 px-1 py-0.2 rounded">
                        {wilayaLabel}
                      </span>
                    )}

                    {item.resultCount > 0 && (
                      <span className="text-[10px] text-slate-400 group-hover:text-brand-600 font-mono">
                        ({item.resultCount})
                      </span>
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRecentSearch(item.id);
                    }}
                    title={lang === 'ar' ? 'حذف من السجل' : 'Supprimer'}
                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {recentSearches.length > 2 && (
              <button
                onClick={onClearRecentSearches}
                className="text-[11px] font-bold text-slate-400 hover:text-rose-600 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                <Trash2 className="w-3 h-3" />
                <span>{lang === 'ar' ? 'مسح السجل' : 'Effacer'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
