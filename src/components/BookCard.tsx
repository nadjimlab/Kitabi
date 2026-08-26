import React from 'react';
import { 
  MapPin, 
  Heart, 
  Eye, 
  Star, 
  CheckCircle2, 
  RefreshCw, 
  Gift, 
  Tag, 
  MessageCircle,
  Share2,
  Sparkles,
  Truck
} from 'lucide-react';
import { BookListing, BookCondition, DealType } from '../types';
import { LazyImage } from './LazyImage';

interface BookCardProps {
  book: BookListing;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelectBook: (book: BookListing) => void;
  onQuickExchange?: (book: BookListing) => void;
  lang: 'ar' | 'fr';
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  isFavorite,
  onToggleFavorite,
  onSelectBook,
  onQuickExchange,
  lang
}) => {
  const getConditionBadge = (condition: BookCondition) => {
    switch (condition) {
      case 'new':
        return {
          label: lang === 'ar' ? 'جديد كلياً' : 'Neuf',
          bg: 'bg-brand-500/10 text-brand-700 border-brand-500/30'
        };
      case 'like_new':
        return {
          label: lang === 'ar' ? 'شبه جديد' : 'Comme neuf',
          bg: 'bg-blue-500/10 text-blue-700 border-blue-500/30'
        };
      case 'good':
        return {
          label: lang === 'ar' ? 'حالة جيدة' : 'Bon état',
          bg: 'bg-amber-500/10 text-amber-700 border-amber-500/30'
        };
      case 'acceptable':
        return {
          label: lang === 'ar' ? 'مقبول' : 'Acceptable',
          bg: 'bg-slate-500/10 text-slate-700 border-slate-500/30'
        };
    }
  };

  const cond = getConditionBadge(book.condition);

  return (
    <div 
      id={`book-card-${book.id}`}
      className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-brand-500/40 transition-all duration-300 flex flex-col overflow-hidden relative"
    >
      {/* Featured ribbon if applicable */}
      {book.isFeatured && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
          <Sparkles className="w-3 h-3" />
          <span>{lang === 'ar' ? 'مميز' : 'En vedette'}</span>
        </div>
      )}

      {/* Image Container with Cover Photo & Overlays */}
      <div 
        onClick={() => onSelectBook(book)}
        className="relative aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer group"
      >
        <LazyImage
          src={book.photos[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'}
          alt={book.title}
          fallbackTitle={book.title}
          fallbackSubject={book.subject}
          aspectRatioClass="aspect-[4/3]"
          className="group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none z-10" />

        {/* Favorite Button */}
        <button
          id={`book-card-fav-${book.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(book.id);
          }}
          className={`absolute top-2.5 left-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
            isFavorite 
              ? 'bg-rose-500 text-white shadow-md shadow-rose-900/30 scale-110' 
              : 'bg-black/30 hover:bg-black/50 text-white'
          }`}
          title={isFavorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Deal Type Badge Overlay */}
        <div className="absolute bottom-2.5 right-2.5 z-20">
          {book.dealType === 'sale' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-600/95 backdrop-blur text-white text-xs font-black shadow-md">
              <span>{book.price}</span>
              <span className="text-[10px] font-medium">د.ج</span>
            </span>
          )}
          {book.dealType === 'exchange' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/95 backdrop-blur text-white text-xs font-black shadow-md">
              <RefreshCw className="w-3 h-3" />
              <span>{lang === 'ar' ? 'للتبادل 🔄' : 'Échange'}</span>
            </span>
          )}
          {book.dealType === 'free' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/95 backdrop-blur text-white text-xs font-black shadow-md">
              <Gift className="w-3 h-3 text-amber-300" />
              <span>{lang === 'ar' ? 'صدقة مجاناً 🎁' : 'Gratuit (Don)'}</span>
            </span>
          )}
        </div>

        {/* Education Level Badge Overlay */}
        <div className="absolute bottom-2.5 left-2.5 z-20">
          <span className="px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur text-[10px] font-bold text-slate-200 border border-slate-700/50">
            {book.grade}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        
        <div>
          {/* Metadata Row: Condition + Subject */}
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cond.bg}`}>
              {cond.label}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[150px]">
              {book.subject}
            </span>
          </div>

          {/* Title */}
          <h3 
            onClick={() => onSelectBook(book)}
            className="text-sm font-bold text-slate-900 line-clamp-2 hover:text-brand-700 cursor-pointer transition-colors leading-snug mb-2 font-serif"
            title={book.title}
          >
            {book.title}
          </h3>

          {/* Tags row: Stream & Shipping */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {book.stream && (
              <span className="text-[10px] text-brand-800 bg-brand-50 px-2 py-0.5 rounded font-medium border border-brand-200/60 truncate max-w-full">
                {book.stream}
              </span>
            )}
            {book.deliveryAvailable && (
              <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold border border-blue-200/60 inline-flex items-center gap-1">
                <Truck className="w-3 h-3 text-blue-600" />
                <span>{lang === 'ar' ? 'شحن (الدفع عند الاستلام)' : 'Livraison COD'}</span>
              </span>
            )}
          </div>

          {/* Exchange Target note if dealType === exchange */}
          {book.dealType === 'exchange' && book.exchangeFor && (
            <div className="text-[11px] text-blue-800 bg-blue-50/80 p-1.5 rounded-lg border border-blue-200/60 line-clamp-1 mb-2">
              <span className="font-bold">{lang === 'ar' ? 'مطلوب بدلاً منه: ' : 'Recherche: '}</span>
              <span>{book.exchangeFor}</span>
            </div>
          )}
        </div>

        {/* Footer info: Location & Seller */}
        <div className="pt-2 border-t border-slate-100 mt-2 flex flex-col gap-2">
          
          <div className="flex items-center justify-between text-xs text-slate-500">
            {/* Wilaya & Municipality */}
            <div className="flex items-center gap-1 text-slate-600 truncate">
              <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span className="truncate font-medium text-[11px]">
                {book.municipality}، {lang === 'ar' ? book.wilayaNameAr : book.wilayaNameFr} ({book.wilayaCode})
              </span>
            </div>

            {/* Time / Views */}
            <span className="text-[10px] text-slate-400 shrink-0">
              {book.createdAt}
            </span>
          </div>

          {/* Seller mini row & Quick CTA */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <img
                src={book.seller.avatar}
                alt={book.seller.name}
                className="w-5 h-5 rounded-full object-cover border border-slate-200"
              />
              <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[90px]">
                {book.seller.name.split(' ')[0]}
              </span>
              {book.seller.isVerified && (
                <CheckCircle2 className="w-3 h-3 text-brand-500" title="بائع موثوق" />
              )}
            </div>

            <button
              id={`book-card-details-btn-${book.id}`}
              onClick={() => onSelectBook(book)}
              className="text-xs font-bold text-brand-700 hover:text-brand-800 hover:bg-brand-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
              <span>{lang === 'ar' ? 'التفاصيل' : 'Détails'}</span>
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
