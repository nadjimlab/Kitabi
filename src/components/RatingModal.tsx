import React, { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import { BookListing, User } from '../types';
import { submitSellerRating } from '../services/ratingsService';

interface RatingModalProps { book: BookListing | null; currentUser: User; isOpen: boolean; onClose: () => void; onSubmitted: () => void; }
export const RatingModal: React.FC<RatingModalProps> = ({ book, currentUser, isOpen, onClose, onSubmitted }) => {
  const [value, setValue] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  if (!isOpen || !book) return null;
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { await submitSellerRating({ reviewer_id: currentUser.id, seller_id: book.seller.id, listing_id: book.id, rating: value, comment: comment.trim() }); onSubmitted(); onClose(); } catch (err) { setError(err instanceof Error ? err.message : 'تعذر حفظ التقييم'); } finally { setSaving(false); } };
  return <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"><form onSubmit={submit} className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"><div className="bg-[#0B192C] text-white p-5 flex items-center justify-between"><div><h2 className="font-black text-lg">قيّم صاحب الكتاب</h2><p className="text-xs text-slate-300 mt-1 line-clamp-1">{book.seller.name} · {book.title}</p></div><button type="button" onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20"><X className="w-5 h-5" /></button></div><div className="p-5"><p className="text-sm font-bold text-slate-700 mb-3">كيف كانت تجربتك؟</p><div className="flex items-center justify-center gap-2 mb-5" dir="ltr">{[1,2,3,4,5].map((star) => <button type="button" key={star} aria-label={`${star} نجوم`} onClick={() => setValue(star)}><Star className={`w-9 h-9 transition-colors ${star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} /></button>)}</div><textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={300} placeholder="أضف تعليقًا اختياريًا عن التعامل..." className="w-full min-h-24 p-3 rounded-xl border border-slate-200 text-sm text-slate-800 resize-none focus:outline-none focus:border-emerald-500" />{error && <p className="text-xs text-rose-600 mt-2">{error}</p>}<button disabled={saving} className="w-full mt-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black flex items-center justify-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}إرسال التقييم</button></div></form></div>;
};
