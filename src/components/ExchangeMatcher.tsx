import React, { useState } from 'react';
import { 
  RefreshCw, 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  SlidersHorizontal, 
  BookOpen, 
  Send,
  Star,
  Eye,
  Info
} from 'lucide-react';
import { BookListing, User, EducationLevel } from '../types';
import { EDUCATION_LEVELS, SUBJECTS_BY_LEVEL, WILAYAS } from '../data/algerianData';
import { StorageService } from '../services/storageService';
import { LazyImage } from './LazyImage';

interface ExchangeMatcherProps {
  currentUser: User;
  onOpenTradeModal: (targetBook: BookListing) => void;
  onSelectBook: (book: BookListing) => void;
  lang: 'ar' | 'fr';
}

export const ExchangeMatcher: React.FC<ExchangeMatcherProps> = ({
  currentUser,
  onOpenTradeModal,
  onSelectBook,
  lang
}) => {
  // Matching Inputs
  const [haveLevel, setHaveLevel] = useState<EducationLevel>('middle');
  const [haveSubject, setHaveSubject] = useState('الرياضيات');
  const [wantLevel, setWantLevel] = useState<EducationLevel>('secondary');
  const [wantSubject, setWantSubject] = useState('الرياضيات');
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number>(currentUser.wilayaCode || 16);

  // Compute matches
  const matches = StorageService.findExchangeMatches(
    haveSubject,
    haveLevel,
    wantSubject,
    wantLevel,
    selectedWilayaCode
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#0B192C] via-[#11253e] to-[#153457] text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-3 border border-emerald-500/30">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
            <span>{lang === 'ar' ? 'محرك التبادل الذكي للكتب المدرسية' : 'Bourse d\'échange intelligente'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black font-serif leading-snug">
            {lang === 'ar' ? 'وجدنا تطابقًا محتملًا 🔄' : 'Trouvez des échanges parfaits 🔄'}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 font-medium leading-relaxed">
            {lang === 'ar'
              ? 'اختر الكتاب الذي تملكه والكتاب الذي تحتاجه للعام الدراسي الجديد، وسيقوم النظام بمطابقتك فوراً مع تلاميذ وعائلات في نفس ولايتك للتبادل يداً بيد دون دفع أي دينار!'
              : 'Associez vos anciens manuels scolaires avec ceux dont vous avez besoin cette année dans votre wilaya.'}
          </p>
        </div>
      </div>

      {/* Matchmaker Interactive Controller */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          {/* Left: What you HAVE (ماذا تملك؟) */}
          <div className="bg-amber-50/50 p-4 sm:p-5 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">1</span>
              <span>{lang === 'ar' ? 'ماذا تملك؟ (كتاب مستعمل للمبادلة)' : 'Que possédez-vous?'}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الطور التعليمي</label>
              <select
                value={haveLevel}
                onChange={(e) => {
                  const lvl = e.target.value as EducationLevel;
                  setHaveLevel(lvl);
                  setHaveSubject(SUBJECTS_BY_LEVEL[lvl][0]);
                }}
                className="w-full bg-white text-slate-900 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-amber-300 focus:outline-none font-semibold"
              >
                {EDUCATION_LEVELS.map(lvl => (
                  <option key={lvl.id} value={lvl.id}>{lvl.labelAr}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المادة أو السلسلة</label>
              <select
                value={haveSubject}
                onChange={(e) => setHaveSubject(e.target.value)}
                className="w-full bg-white text-slate-900 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-amber-300 focus:outline-none"
              >
                {SUBJECTS_BY_LEVEL[haveLevel].map((s, i) => (
                  <option key={i} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: What you WANT (ماذا تحتاج؟) */}
          <div className="bg-emerald-50/50 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 space-y-3">
            <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">2</span>
              <span>{lang === 'ar' ? 'ماذا تحتاج؟ (الكتاب المطلوب)' : 'Que cherchez-vous?'}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الطور التعليمي المطلوب</label>
              <select
                value={wantLevel}
                onChange={(e) => {
                  const lvl = e.target.value as EducationLevel;
                  setWantLevel(lvl);
                  setWantSubject(SUBJECTS_BY_LEVEL[lvl][0]);
                }}
                className="w-full bg-white text-slate-900 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-emerald-300 focus:outline-none font-semibold"
              >
                {EDUCATION_LEVELS.map(lvl => (
                  <option key={lvl.id} value={lvl.id}>{lvl.labelAr}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المادة المطلوبة</label>
              <select
                value={wantSubject}
                onChange={(e) => setWantSubject(e.target.value)}
                className="w-full bg-white text-slate-900 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-emerald-300 focus:outline-none"
              >
                {SUBJECTS_BY_LEVEL[wantLevel].map((s, i) => (
                  <option key={i} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Wilaya Filter inside Matcher */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-semibold w-full sm:w-auto">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>نطاق المطابقة الجغرافي:</span>
            <select
              value={selectedWilayaCode}
              onChange={(e) => setSelectedWilayaCode(Number(e.target.value))}
              className="bg-slate-50 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 font-bold focus:outline-none"
            >
              <option value={0}>كل الولايات</option>
              {WILAYAS.map(w => (
                <option key={w.code} value={w.code}>{w.code}. {w.nameAr}</option>
              ))}
            </select>
          </div>

          <div className="text-emerald-700 font-bold text-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{matches.length} تطابق مباشر متاح للتبادل الآن</span>
          </div>
        </div>

      </div>

      {/* Matches Results List */}
      <div className="space-y-4">
        
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 font-serif flex items-center gap-2">
            <span>النتائج المتطابقة مع طلبك</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {matches.length}
            </span>
          </h2>
        </div>

        {matches.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">لا توجد كتب مطابقة تماماً لهذه التوليفة حالياً</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              جرب تغيير المادة أو توسيع نطاق الولاية، أو أضف كتابك كإعلان تبادل وسنقوم بإشعارك فور توفر كتاب مماثل.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {matches.map(({ listing, matchScore, reasons }) => (
              <div
                key={listing.id}
                className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-emerald-100 hover:border-emerald-500 shadow-sm hover:shadow-lg transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between"
              >
                
                <div className="flex items-start sm:items-center gap-4 flex-1">
                  {/* Photo */}
                  <div 
                    onClick={() => onSelectBook(listing)}
                    className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 shrink-0 cursor-pointer relative"
                  >
                    <LazyImage 
                      src={listing.photos[0]} 
                      alt={listing.title}
                      fallbackTitle={listing.title}
                      fallbackSubject={listing.subject}
                      aspectRatioClass="h-full w-full"
                    />
                    <div className="absolute top-1 right-1 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md z-20">
                      {matchScore}% تطابق
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {listing.grade}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {listing.subject}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {listing.wilayaNameAr} ({listing.municipality})
                      </span>
                    </div>

                    <h3 
                      onClick={() => onSelectBook(listing)}
                      className="font-bold text-sm sm:text-base text-slate-900 hover:text-emerald-700 cursor-pointer font-serif line-clamp-1"
                    >
                      {listing.title}
                    </h3>

                    {/* Match Reasons */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {reasons.map((r, i) => (
                        <span key={i} className="text-[10px] bg-emerald-100/70 text-emerald-900 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{r}</span>
                        </span>
                      ))}
                    </div>

                    {/* Seller row */}
                    <div className="text-xs text-slate-500 flex items-center gap-2 pt-1">
                      <span>صاحب الكتاب: <strong className="text-slate-700">{listing.seller.name}</strong></span>
                      <span>•</span>
                      <span className="text-amber-500 font-bold flex items-center">
                        <Star className="w-3 h-3 fill-current mr-0.5" />
                        {listing.seller.rating}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    onClick={() => onSelectBook(listing)}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
                  >
                    معاينة الكتاب
                  </button>

                  <button
                    id={`propose-match-swap-${listing.id}`}
                    onClick={() => onOpenTradeModal(listing)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-950/30 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>طلب تبادل فوري 🔄</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
