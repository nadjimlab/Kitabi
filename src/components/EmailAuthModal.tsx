import React, { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole, Mail, UserPlus, X } from 'lucide-react';
import { auth, isFirebaseConfigured } from '../lib/firebase';

interface EmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'fr';
  onAuthenticated: () => void | Promise<void>;
}

export const EmailAuthModal: React.FC<EmailAuthModalProps> = ({ isOpen, onClose, lang, onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setMode('login');
      setName('');
      setEmail('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!auth) {
      setError('المصادقة غير مهيأة. تحقق من متغيرات Firebase.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (mode === 'register') {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      await onAuthenticated();
      onClose();
    } catch (authError) {
      console.error(authError);
      const code = (authError as { code?: string }).code;
      const messages: Record<string, string> = {
        'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
        'auth/email-already-in-use': 'هذا البريد مستخدم مسبقًا.',
        'auth/weak-password': 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.',
        'auth/invalid-email': 'أدخل بريدًا إلكترونيًا صحيحًا.',
        'auth/too-many-requests': 'محاولات كثيرة. حاول بعد قليل.',
        'permission-denied': 'تم تسجيل الدخول، لكن صلاحية قراءة ملف المستخدم مرفوضة في Firestore. راجع قواعد users.',
        'failed-precondition': 'قاعدة Firestore غير مهيأة أو غير متاحة لهذا المشروع.',
        'unavailable': 'تعذر الاتصال بـ Firebase. تحقق من الإنترنت وحاول مجددًا.',
      };
      setError(messages[code || ''] || 'تعذر إتمام العملية. تأكد من تفعيل Email/Password في Firebase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-[#0B192C] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              {mode === 'login' ? <LockKeyhole className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-bold text-base">{mode === 'login' ? 'الدخول إلى كتابي' : 'إنشاء حساب في كتابي'}</h2>
              <p className="text-[11px] text-slate-400">{lang === 'ar' ? 'حساب آمن بالبريد الإلكتروني' : 'Compte sécurisé par e-mail'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!isFirebaseConfigured && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>أضف متغيرات Firebase إلى ملف البيئة أولًا.</span>
            </div>
          )}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم</label>
              <input type="text" required value={name} onChange={(event) => setName(event.target.value)} placeholder="اسمك الكامل" className="w-full bg-slate-50 text-slate-900 text-sm px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500" />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني</label>
            <div className="relative"><Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" /><input type="email" required dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full bg-slate-50 text-slate-900 text-sm pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500" /></div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور</label>
            <div className="relative"><LockKeyhole className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" /><input type="password" required minLength={6} dir="ltr" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6 أحرف على الأقل" className="w-full bg-slate-50 text-slate-900 text-sm pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500" /></div>
          </div>
          <button type="submit" disabled={isSubmitting || !isFirebaseConfigured} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm px-4 py-3 rounded-xl flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'login' ? <CheckCircle2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>{mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}</span>
          </button>
          {error && <p className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs font-medium">{error}</p>}
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="w-full text-slate-600 hover:text-emerald-700 text-xs font-bold">
            {mode === 'login' ? 'ليس لديك حساب؟ أنشئ حسابًا جديدًا' : 'لديك حساب بالفعل؟ سجّل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
};
