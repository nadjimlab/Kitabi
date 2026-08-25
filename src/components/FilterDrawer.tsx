import React from 'react';
import { X, SlidersHorizontal, RotateCcw, Check, Sparkles, MapPin } from 'lucide-react';
import { FilterState, EducationLevel, BookCondition, DealType } from '../types';
import { WILAYAS, EDUCATION_LEVELS, GRADES_BY_LEVEL, SUBJECTS_BY_LEVEL, STREAMS } from '../data/algerianData';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  totalResultsCount: number;
  lang: 'ar' | 'fr';
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onResetFilters,
  totalResultsCount,
  lang
}) => {
  if (!isOpen) return null;

  const currentWilaya = WILAYAS.find(w => w.code === filters.wilayaCode);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      
      <div 
        id="filter-drawer-panel"
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden"
      >
        
        {/* Header */}
        <div className="bg-[#0B192C] text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm font-serif">
              {lang === 'ar' ? 'تصفية وبحث متقدم في الكتب' : 'Filtres de recherche'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetFilters}
              className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Filters Body */}
        <div className="overflow-y-auto p-5 space-y-5 flex-1 text-xs">
          
          {/* Deal Type Quick Pills */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">نوع العرض (بيع / تبادل / تبرع)</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'sale', label: 'للبيع' },
                { id: 'exchange', label: 'تبادل 🔄' },
                { id: 'free', label: 'مجاني 🎁' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onFilterChange({ dealType: t.id as any })}
                  className={`py-2 px-1 rounded-xl font-bold border transition-all text-center ${
                    filters.dealType === t.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Education Level */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">الطور التعليمي</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onFilterChange({ level: 'all', gradeCode: '', stream: '', subject: '' })}
                className={`p-2 rounded-xl font-bold border text-start ${
                  filters.level === 'all' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                جميع الأطوار والمستويات
              </button>
              {EDUCATION_LEVELS.map(lvl => (
                <button
                  key={lvl.id}
                  onClick={() => onFilterChange({ level: lvl.id, gradeCode: '', stream: '', subject: '' })}
                  className={`p-2 rounded-xl font-bold border text-start ${
                    filters.level === lvl.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {lvl.labelAr}
                </button>
              ))}
            </div>
          </div>

          {/* Grade if level selected */}
          {filters.level !== 'all' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">السنة / الصف</label>
              <select
                value={filters.gradeCode}
                onChange={(e) => onFilterChange({ gradeCode: e.target.value })}
                className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-none"
              >
                <option value="">كل سنوات الطور</option>
                {GRADES_BY_LEVEL[filters.level].map(g => (
                  <option key={g.code} value={g.code}>{g.nameAr}</option>
                ))}
              </select>
            </div>
          )}

          {/* Stream if secondary */}
          {filters.level === 'secondary' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">الشعبة (الثانوي)</label>
              <select
                value={filters.stream}
                onChange={(e) => onFilterChange({ stream: e.target.value })}
                className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-none"
              >
                <option value="">كل الشعب (علمي، أدبي، تقني...)</option>
                {STREAMS.map((st, i) => (
                  <option key={i} value={st}>{st}</option>
                ))}
              </select>
            </div>
          )}

          {/* Location: Wilaya & Municipality */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">الولاية والبلدية (69 ولاية)</label>
            <select
              value={filters.wilayaCode}
              onChange={(e) => onFilterChange({ wilayaCode: Number(e.target.value), municipality: '' })}
              className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-none"
            >
              <option value={0}>كل ولايات الجزائر (69 ولاية)</option>
              {WILAYAS.map(w => (
                <option key={w.code} value={w.code}>{w.code}. {w.nameAr} ({w.nameFr})</option>
              ))}
            </select>

            {currentWilaya && currentWilaya.municipalities.length > 0 && (
              <select
                value={filters.municipality}
                onChange={(e) => onFilterChange({ municipality: e.target.value })}
                className="w-full bg-slate-50 text-slate-800 p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-none"
              >
                <option value="">جميع بلديات ولاية {currentWilaya.nameAr}</option>
                {currentWilaya.municipalities.map((m, i) => (
                  <option key={i} value={m}>{m}</option>
                ))}
              </select>
            )}
          </div>

          {/* Condition */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">حالة الكتاب</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'all', label: 'أي حالة' },
                { id: 'new', label: 'جديد كلياً' },
                { id: 'like_new', label: 'شبه جديد' },
                { id: 'good', label: 'حالة جيدة' }
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => onFilterChange({ condition: c.id as any })}
                  className={`p-2 rounded-xl border font-bold text-center ${
                    filters.condition === c.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Price Range Slider */}
          <div>
            <div className="flex items-center justify-between font-bold text-slate-700 mb-1">
              <span>الحد الأقصى للسعر:</span>
              <span className="text-emerald-700 font-mono font-black">{filters.maxPrice} د.ج</span>
            </div>
            <input
              type="range"
              min={100}
              max={3000}
              step={50}
              value={filters.maxPrice}
              onChange={(e) => onFilterChange({ maxPrice: Number(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Quick Checkbox Toggles */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={filters.onlyFree}
                onChange={(e) => onFilterChange({ onlyFree: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>عرض الكتب المهداة مجاناً فقط (صدقة 🎁)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={filters.deliveryOnly}
                onChange={(e) => onFilterChange({ deliveryOnly: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>إعلانات توفر الشحن والتوصيل (الدفع عند الاستلام)</span>
            </label>
          </div>

        </div>

        {/* Footer Apply Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600 font-semibold">
            {totalResultsCount} كتاب يطابق هذه المعايير
          </div>
          <button
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-all active:scale-95"
          >
            تطبيق النتائج ({totalResultsCount})
          </button>
        </div>

      </div>
    </div>
  );
};
