import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Heart, 
  Share2, 
  Flag, 
  Phone, 
  MessageCircle, 
  MessageSquare, 
  RefreshCw, 
  CheckCircle2, 
  Star, 
  BookOpen, 
  Calendar, 
  Building2, 
  Check, 
  ShieldCheck, 
  Sparkles,
  Truck,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { BookListing, User, BookCondition } from '../types';
import { LazyImage } from './LazyImage';

interface BookDetailsModalProps {
  book: BookListing | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  currentUser: User;
  onOpenChat: (book: BookListing, seller: User) => void;
  onOpenExchangeModal: (book: BookListing) => void;
  onOpenReportModal: (book: BookListing) => void;
  onSelectRelatedBook: (book: BookListing) => void;
  relatedBooks: BookListing[];
  lang: 'ar' | 'fr';
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  book,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  currentUser,
  onOpenChat,
  onOpenExchangeModal,
  onOpenReportModal,
  onSelectRelatedBook,
  relatedBooks,
  lang
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [copiedToast, setCopiedToast] = useState(false);

  if (!isOpen || !book) return null;

  const handleShare = () => {
    const text = `كتاب: ${book.title} - ${book.price ? book.price + ' د.ج' : 'للتبادل/مجاني'} على منصة كتابي الجزائرية`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const getWhatsAppLink = () => {
    const phone = book.seller.whatsapp || book.seller.phone;
    // Normalize Algerian phone to international format 213...
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '213' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('213')) {
      cleanPhone = '213' + cleanPhone;
    }
    
    const message = encodeURIComponent(
      `السلام عليكم أخي ${book.seller.name}، أنا مهتم بكتاب "${book.title}" المعروض في منصة كتابي (ولاية ${book.wilayaNameAr} - ${book.municipality}). هل ما زال متوفراً؟`
    );
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  const getConditionText = (condition: BookCondition) => {
    switch (condition) {
      case 'new': return { label: 'جديد تماماً (غير مستعمل)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'like_new': return { label: 'شبه جديد (استعمال خفيف جداً بدون تشطيب)', color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'good': return { label: 'حالة جيدة (سليم ونظيف)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'acceptable': return { label: 'مقبول (مستعمل ومقروء)', color: 'text-slate-700 bg-slate-100 border-slate-200' };
    }
  };

  const conditionInfo = getConditionText(book.condition);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      
      {/* Modal Card */}
      <div 
        id="book-details-modal-container"
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        
        {/* Sticky Header with Navigation & Actions */}
        <div className="bg-slate-900 text-white px-4 py-3 sm:px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {book.grade}
            </span>
            {book.isFeatured && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {lang === 'ar' ? 'مميز' : 'En vedette'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Share */}
            <button
              id="details-share-btn"
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors relative"
              title="مشاركة الإعلان"
            >
              <Share2 className="w-4 h-4" />
              {copiedToast && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold py-1 px-2 rounded-md shadow whitespace-nowrap">
                  تم نسخ الرابط!
                </span>
              )}
            </button>

            {/* Favorite */}
            <button
              id="details-favorite-btn"
              onClick={() => onToggleFavorite(book.id)}
              className={`p-2 rounded-xl transition-colors ${
                isFavorite 
                  ? 'bg-rose-500 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
              title="المفضلة"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            {/* Report */}
            <button
              id="details-report-btn"
              onClick={() => onOpenReportModal(book)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
              title="الإبلاغ عن الإعلان"
            >
              <Flag className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              id="details-close-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Gallery Section (Left on LTR, Right on RTL) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
                <LazyImage
                  src={book.photos[selectedPhotoIndex] || book.photos[0]}
                  alt={book.title}
                  fallbackTitle={book.title}
                  fallbackSubject={book.subject}
                  aspectRatioClass="aspect-[4/3]"
                  priority={true}
                />
                
                {/* Price / Deal Type Badge */}
                <div className="absolute bottom-3 right-3">
                  {book.dealType === 'sale' && (
                    <div className="bg-emerald-600/95 backdrop-blur text-white px-3.5 py-1.5 rounded-xl font-black text-lg shadow-lg flex items-baseline gap-1">
                      <span>{book.price}</span>
                      <span className="text-xs font-semibold">د.ج</span>
                      {book.originalPrice && (
                        <span className="text-xs line-through text-emerald-200/80 mr-1.5 font-normal">
                          {book.originalPrice} د.ج
                        </span>
                      )}
                    </div>
                  )}
                  {book.dealType === 'exchange' && (
                    <div className="bg-blue-600/95 backdrop-blur text-white px-3 py-1.5 rounded-xl font-black text-sm shadow-lg flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'للتبادل فقط 🔄' : 'Pour Échange'}</span>
                    </div>
                  )}
                  {book.dealType === 'free' && (
                    <div className="bg-purple-600/95 backdrop-blur text-white px-3.5 py-1.5 rounded-xl font-black text-sm shadow-lg flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{lang === 'ar' ? 'صدقة مجانية لوجه الله 🎁' : 'Don Gratuit'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnails if multiple photos */}
              {book.photos.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {book.photos.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        selectedPhotoIndex === idx ? 'border-emerald-600 scale-105' : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={p} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Location & Delivery Info Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {book.municipality}، ولاية {lang === 'ar' ? book.wilayaNameAr : book.wilayaNameFr} ({book.wilayaCode})
                  </span>
                </div>
                <div className="flex items-start gap-2 text-slate-700">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold block">
                      {book.deliveryAvailable 
                        ? (lang === 'ar' ? 'التوصيل متوفر لجميع البلديات والشحن لـ 69 ولاية' : 'Livraison disponible pour 69 wilayas') 
                        : (lang === 'ar' ? 'التسليم يداً بيد فقط في نفس المنطقة' : 'Remise en main propre uniquement')}
                    </span>
                    {book.deliveryAvailable && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300/80">
                        <span>✓ الدفع عند الاستلام (Paiement à la livraison)</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Book Details & Specs (Right/Left) */}
            <div className="lg:col-span-7 space-y-5">
              
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${conditionInfo.color}`}>
                    {conditionInfo.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {book.subject}
                  </span>
                  {book.stream && (
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {book.stream}
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug font-serif">
                  {book.title}
                </h1>

                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span>نُشر: {book.createdAt}</span>
                  <span>•</span>
                  <span>{book.views} مشاهدة</span>
                  <span>•</span>
                  <span>{book.favoritesCount} مهتمين</span>
                </div>
              </div>

              {/* If exchange type, highlight wanted exchange book */}
              {book.dealType === 'exchange' && book.exchangeFor && (
                <div className="bg-blue-50 border-2 border-blue-200 p-3.5 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-900">
                      {lang === 'ar' ? 'الكتاب المطلوب بدلاً منه:' : 'Livre recherché en échange:'}
                    </div>
                    <div className="text-sm font-semibold text-blue-800 mt-0.5">
                      {book.exchangeFor}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {lang === 'ar' ? 'وصف الكتاب وتفاصيل النسخة' : 'Description du manuel'}
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/60">
                  {book.description}
                </p>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-400 font-medium">المستوى والمرحلة</div>
                  <div className="font-bold text-slate-800 mt-0.5">{book.grade}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-400 font-medium">المادة الدراسية</div>
                  <div className="font-bold text-slate-800 mt-0.5">{book.subject}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-400 font-medium">دار النشر / المنهاج</div>
                  <div className="font-bold text-slate-800 mt-0.5">{book.publisher || 'الديوان الوطني ONPS'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-400 font-medium">طبعة سنة</div>
                  <div className="font-bold text-slate-800 mt-0.5">{book.year || '2024'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-400 font-medium">الحلول والتمارين</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {book.hasAnswersIncluded ? 'نعم متضمنة ومفصلة' : 'دروس ومواضيع'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-400 font-medium">كتابات بالقلم</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {book.hasPencilMarks ? 'توجد بعض الملاحظات' : 'نظيف تماماً'}
                  </div>
                </div>
              </div>

              {/* Seller Profile Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#122e4f] text-white border border-slate-700 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={book.seller.avatar}
                      alt={book.seller.name}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{book.seller.name}</span>
                        {book.seller.isVerified && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" title="بائع موثوق" />
                        )}
                        {book.seller.isBookstore && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40">
                            مكتبة معتمدة
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                        <span className="flex items-center text-amber-400 font-bold">
                          <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                          {book.seller.rating} ({book.seller.reviewsCount} تقييم)
                        </span>
                        <span>•</span>
                        <span>عضو منذ {book.seller.joinedDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {book.seller.bio && (
                  <p className="text-xs text-slate-300 italic mb-3 border-t border-slate-800 pt-2">
                    "{book.seller.bio}"
                  </p>
                )}

                {/* Primary Action Buttons Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
                  
                  {/* WhatsApp Direct */}
                  <a
                    id="action-whatsapp-direct"
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 text-center"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-200" />
                    <span>واتساب</span>
                  </a>

                  {/* Direct Phone Call */}
                  <a
                    id="action-call-direct"
                    href={`tel:${book.seller.phone}`}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 transition-all active:scale-95 text-center"
                  >
                    <Phone className="w-4 h-4 text-amber-400" />
                    <span>اتصال</span>
                  </a>

                  {/* In-App Chat */}
                  <button
                    id="action-in-app-chat"
                    onClick={() => onOpenChat(book, book.seller)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 transition-all active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <span>دردشة كِتابي</span>
                  </button>

                  {/* Propose Exchange */}
                  <button
                    id="action-propose-trade"
                    onClick={() => onOpenExchangeModal(book)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>طلب تبادل 🔄</span>
                  </button>

                </div>
              </div>

            </div>

          </div>

          {/* Related Listings Carousel / Section */}
          {relatedBooks.length > 0 && (
            <div className="pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  {lang === 'ar' ? 'كتب ومراجع أخرى لنفس المستوى الدراسي' : 'Autres manuels similaires'}
                </h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedBooks.slice(0, 4).map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectRelatedBook(rel)}
                    className="group bg-slate-50 hover:bg-white p-2.5 rounded-2xl border border-slate-200 hover:border-emerald-500/40 shadow-sm cursor-pointer transition-all"
                  >
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-200 mb-2">
                      <img src={rel.photos[0]} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 line-clamp-1">{rel.title}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-semibold">
                      <span>{rel.price ? `${rel.price} د.ج` : (rel.dealType === 'exchange' ? 'تبادل' : 'مجاني')}</span>
                      <span>{rel.wilayaNameAr}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
