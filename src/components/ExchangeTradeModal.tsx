import React, { useState } from 'react';
import { X, RefreshCw, Check, ArrowRight, ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';
import { BookListing, User, ExchangeRequest } from '../types';
import { StorageService } from '../services/storageService';
import { LazyImage } from './LazyImage';

interface ExchangeTradeModalProps {
  targetBook: BookListing | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  userListings: BookListing[];
  onTradeProposed: (req: ExchangeRequest) => void;
  lang: 'ar' | 'fr';
}

export const ExchangeTradeModal: React.FC<ExchangeTradeModalProps> = ({
  targetBook,
  isOpen,
  onClose,
  currentUser,
  userListings,
  onTradeProposed,
  lang
}) => {
  const [selectedListingId, setSelectedListingId] = useState<string>(
    userListings.length > 0 ? userListings[0].id : 'custom'
  );
  const [customTitle, setCustomTitle] = useState('');
  const [message, setMessage] = useState('السلام عليكم أخي، هل يناسبك تبادل هذا الكتاب مع كتابي؟ والتسليم يد بيد في مكان مناسب.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !targetBook) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedBook = userListings.find(l => l.id === selectedListingId);
    const offeredTitle = selectedBook ? selectedBook.title : (customTitle.trim() || 'كتاب مدرسي للمبادلة');
    const offeredPhoto = selectedBook ? selectedBook.photos[0] : undefined;

    const newReq = await StorageService.sendExchangeRequest({
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterAvatar: currentUser.avatar,
      requesterPhone: currentUser.phone,
      targetListingId: targetBook.id,
      targetBookTitle: targetBook.title,
      ownerId: targetBook.sellerId,
      offeredListingId: selectedBook?.id,
      offeredBookTitle: offeredTitle,
      offeredBookPhoto: offeredPhoto,
      message: message.trim(),
      wilayaNameAr: `${currentUser.municipality} (${targetBook.wilayaNameAr})`,
      municipality: currentUser.municipality
    });

    setIsSubmitting(false);
    setIsSuccess(true);
    onTradeProposed(newReq);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      
      <div 
        id="exchange-trade-modal-container"
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-300 animate-spin-slow" />
            <h2 className="font-bold text-base font-serif">
              {lang === 'ar' ? 'تقديم عرض تبادل للكتب' : 'Proposer un échange'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-blue-950/60 hover:bg-blue-800 text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 font-serif">تم إرسال طلب التبادل بنجاح! 🔄</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              تم إشعار صاحب الكتاب ({targetBook.seller.name})، وسيقوم بالرد عليك في محادثات كتابي أو عبر الهاتف.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            
            {/* Target Book Preview Card */}
            <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200 flex items-center gap-3">
              <div className="w-14 h-16 rounded-xl overflow-hidden border border-blue-200 shrink-0">
                <LazyImage
                  src={targetBook.photos[0]}
                  alt={targetBook.title}
                  fallbackTitle={targetBook.title}
                  fallbackSubject={targetBook.subject}
                  aspectRatioClass="w-full h-full"
                />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                  الكتاب المطلوب
                </span>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1 font-serif">
                  {targetBook.title}
                </h4>
                <div className="text-[11px] text-slate-600">
                  صاحب الكتاب: <span className="font-semibold text-slate-800">{targetBook.seller.name}</span> ({targetBook.wilayaNameAr})
                </div>
              </div>
            </div>

            {/* Select Offered Book */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {lang === 'ar' ? 'اختر الكتاب الذي تعرضه في المقابل:' : 'Livre offert en échange:'} *
              </label>

              {userListings.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userListings.map((l) => (
                    <label
                      key={l.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        selectedListingId === l.id
                          ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="offeredBook"
                        checked={selectedListingId === l.id}
                        onChange={() => setSelectedListingId(l.id)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <img src={l.photos[0]} alt="" className="w-9 h-11 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{l.title}</div>
                        <div className="text-[10px] text-slate-500">{l.grade} • {l.subject}</div>
                      </div>
                    </label>
                  ))}
                  <label
                    className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer text-xs ${
                      selectedListingId === 'custom'
                        ? 'bg-emerald-50 border-emerald-600'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="offeredBook"
                      checked={selectedListingId === 'custom'}
                      onChange={() => setSelectedListingId('custom')}
                      className="text-emerald-600"
                    />
                    <span>كتاب آخر (كتابة العنوان يدوياً)</span>
                  </label>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    required
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="اكتب عنوان الكتاب والمستوى الذي تعرضه للمبادلة..."
                    className="w-full bg-slate-50 text-slate-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              )}

              {selectedListingId === 'custom' && userListings.length > 0 && (
                <div className="mt-2">
                  <input
                    type="text"
                    required
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="اكتب عنوان الكتاب الذي تعرضه..."
                    className="w-full bg-slate-50 text-slate-900 text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Custom Message */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'ar' ? 'رسالة مقترحة للبائع' : 'Message au vendeur'}
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-slate-600 text-xs font-bold px-3 py-2"
              >
                إلغاء
              </button>
              <button
                id="submit-exchange-trade-btn"
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isSubmitting ? 'جاري الإرسال...' : 'إرسال طلب التبادل'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
