import React, { useState } from 'react';
import { X, Flag, Check, AlertTriangle } from 'lucide-react';
import { BookListing, User } from '../types';
import { StorageService } from '../services/storageService';

interface ReportModalProps {
  book: BookListing | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  lang: 'ar' | 'fr';
}

export const ReportModal: React.FC<ReportModalProps> = ({
  book,
  isOpen,
  onClose,
  currentUser,
  lang
}) => {
  const [reason, setReason] = useState<'wrong_info' | 'prohibited_item' | 'offensive' | 'fake_account' | 'sold_already' | 'other'>('wrong_info');
  const [details, setDetails] = useState('');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen || !book) return null;

  const reasonsList = [
    { id: 'wrong_info' as const, label: 'معلومات غير مطابقة أو طبعة قديمة' },
    { id: 'sold_already' as const, label: 'الكتاب تم بيعه أو تبادله بالفعل' },
    { id: 'fake_account' as const, label: 'إعلان وهمي أو رقم هاتف غير صحيح' },
    { id: 'offensive' as const, label: 'محتوى غير لائق أو صور غير مناسبة' },
    { id: 'other' as const, label: 'سبب آخر' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeLabel = reasonsList.find(r => r.id === reason)?.label || 'إبلاغ';
    
    await StorageService.submitReport({
      listingId: book.id,
      listingTitle: book.title,
      sellerName: book.seller.name,
      reporterName: currentUser.name,
      reason,
      reasonLabel: activeLabel,
      details: details.trim() || activeLabel
    });

    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-sm">الإبلاغ عن الإعلان</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSent ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">شكراً لحرصك على أمان المنصة!</h4>
            <p className="text-xs text-slate-500">تم تحويل البلاغ لفريق الإدارة لمراجعته فوراً.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 block truncate">{book.title}</span>
              <span className="text-slate-500 text-[11px]">المعلن: {book.seller.name}</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">سبب الإبلاغ:</label>
              <div className="space-y-1.5">
                {reasonsList.map(r => (
                  <label key={r.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="reportReason"
                      checked={reason === r.id}
                      onChange={() => setReason(r.id)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-slate-800 font-medium">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">تفاصيل توضيحية:</label>
              <textarea
                rows={2}
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="أضف أي تفاصيل تفيد فريق المراجعة..."
                className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-3 py-2 text-slate-600 font-bold">
                إلغاء
              </button>
              <button
                type="submit"
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl shadow"
              >
                إرسال البلاغ
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
