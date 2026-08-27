import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole, Mail, UserPlus, X, KeyRound } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

interface EmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'fr';
  onAuthenticated: () => void | Promise<void>;
  recoveryMode?: boolean;
}

export const EmailAuthModal: React.FC<EmailAuthModalProps> = ({ isOpen, onClose, lang, onAuthenticated, recoveryMode = false }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'update'>(recoveryMode ? 'update' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<TurnstileInstance>(null);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
  const needsCaptcha = Boolean(turnstileSiteKey) && mode !== 'update';

  useEffect(() => {
    if (!isOpen) {
      setMode('login');
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setError('');
      setNotice('');
      setCaptchaToken('');
    } else if (recoveryMode) {
      setMode('update');
      setError('');
      setNotice('');
    }
  }, [isOpen, recoveryMode]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (needsCaptcha && !captchaToken) {
      setError('أكمل اختبار الأمان أولًا.');
      return;
    }
    setIsSubmitting(true);
    try {
      const captchaOptions = needsCaptcha ? { captchaToken } : {};
      if (mode === 'forgot') {
        const result = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/`, ...captchaOptions });
        if (result.error) throw result.error;
        setNotice('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني. افحص صندوق الوارد والرسائل غير المرغوبة.');
        captchaRef.current?.reset();
        setCaptchaToken('');
        return;
      }
      if (mode === 'update') {
        if (password.length < 6) throw new Error('كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.');
        if (password !== confirmPassword) throw new Error('كلمتا المرور غير متطابقتين.');
        const result = await supabase.auth.updateUser({ password });
        if (result.error) throw result.error;
        setNotice('تم تحديث كلمة المرور بنجاح. يمكنك الآن استعمالها لتسجيل الدخول.');
        setPassword('');
        setConfirmPassword('');
        return;
      }
      const result = mode === 'register'
        ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() || 'مستخدم كتابي' }, ...captchaOptions } })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password, options: captchaOptions });
      if (result.error) throw result.error;
      if (mode === 'register' && !result.data.session) {
        setNotice('تم إنشاء الحساب. تحقق من بريدك الإلكتروني ثم سجّل الدخول.');
        captchaRef.current?.reset();
        setCaptchaToken('');
        return;
      }
      await onAuthenticated();
      onClose();
    } catch (authError) {
      const code = (authError as { code?: string }).code || '';
      const messages: Record<string, string> = {
        invalid_credentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
        email_exists: 'هذا البريد مستخدم مسبقًا.',
        weak_password: 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.',
        invalid_email: 'أدخل بريدًا إلكترونيًا صحيحًا.',
        over_request_rate_limit: 'محاولات كثيرة. حاول بعد قليل.',
        signup_disabled: 'إنشاء الحسابات غير مفعّل في Supabase Auth.',
        email_not_confirmed: 'تحقق من بريدك الإلكتروني قبل تسجيل الدخول.',
        captcha_failed: 'فشل اختبار الأمان. أعد المحاولة.',
        bad_captcha: 'فشل اختبار الأمان. أعد المحاولة.',
        network_error: 'تعذر الاتصال بـSupabase. تحقق من الإنترنت وحاول مجددًا.',
      };
      const message = messages[code] || (authError instanceof Error ? authError.message : 'تعذر إتمام العملية عبر Supabase.');
      setError(code ? `${message} (${code})` : message);
      if (needsCaptcha) { captchaRef.current?.reset(); setCaptchaToken(''); }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-[#0B192C] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center">
              {mode === 'update' ? <KeyRound className="w-4 h-4" /> : mode === 'forgot' ? <Mail className="w-4 h-4" /> : mode === 'login' ? <LockKeyhole className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-bold text-base">{mode === 'update' ? 'تعيين كلمة مرور جديدة' : mode === 'forgot' ? 'استعادة كلمة المرور' : mode === 'login' ? 'الدخول إلى كتابي' : 'إنشاء حساب في كتابي'}</h2>
              <p className="text-[11px] text-slate-400">{lang === 'ar' ? 'حساب آمن بالبريد الإلكتروني' : 'Compte sécurisé par e-mail'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!isSupabaseConfigured && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>أضف متغيرات Supabase إلى ملف البيئة أولًا.</span>
            </div>
          )}
          {mode === 'update' ? (
            <>
              <p className="text-xs text-slate-500 leading-6">اكتب كلمة مرور جديدة لحسابك. يجب أن تتكون من 6 أحرف على الأقل.</p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور الجديدة</label>
                <div className="relative"><LockKeyhole className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" /><input type="password" required minLength={6} dir="ltr" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6 أحرف على الأقل" className="w-full bg-slate-50 text-slate-900 text-sm pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-brand-500" /></div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تأكيد كلمة المرور</label>
                <div className="relative"><KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" /><input type="password" required minLength={6} dir="ltr" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="أعد كتابة كلمة المرور" className="w-full bg-slate-50 text-slate-900 text-sm pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-brand-500" /></div>
              </div>
            </>
          ) : (
            <>
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم</label>
                  <input type="text" required value={name} onChange={(event) => setName(event.target.value)} placeholder="اسمك الكامل" className="w-full bg-slate-50 text-slate-900 text-sm px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-brand-500" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني</label>
                <div className="relative"><Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" /><input type="email" required dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full bg-slate-50 text-slate-900 text-sm pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-brand-500" /></div>
              </div>
              {mode !== 'forgot' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور</label>
                  <div className="relative"><LockKeyhole className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" /><input type="password" required minLength={6} dir="ltr" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6 أحرف على الأقل" className="w-full bg-slate-50 text-slate-900 text-sm pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-brand-500" /></div>
                </div>
              )}
            </>
          )}
          {needsCaptcha && (
            <div className="flex justify-center rounded-xl border border-slate-100 bg-slate-50 p-2">
              <Turnstile ref={captchaRef} siteKey={turnstileSiteKey} onSuccess={setCaptchaToken} onExpire={() => setCaptchaToken('')} onError={() => { setCaptchaToken(''); setError('تعذر تحميل اختبار الأمان. تحقق من إعدادات Turnstile.'); }} language="ar" theme="light" />
            </div>
          )}
          <button type="submit" disabled={isSubmitting || !isSupabaseConfigured} className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-black text-sm px-4 py-3 rounded-xl flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'update' ? <KeyRound className="w-4 h-4" /> : mode === 'forgot' ? <Mail className="w-4 h-4" /> : mode === 'login' ? <CheckCircle2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>{mode === 'update' ? 'حفظ كلمة المرور الجديدة' : mode === 'forgot' ? 'إرسال رابط الاستعادة' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}</span>
          </button>
          {notice && <p className="bg-brand-50 border border-brand-200 text-brand-800 rounded-xl p-3 text-xs font-medium leading-5">{notice}</p>}
          {error && <p className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs font-medium">{error}</p>}
          {mode === 'login' && <button type="button" onClick={() => { setMode('forgot'); setError(''); setNotice(''); }} className="w-full text-brand-700 hover:text-brand-900 text-xs font-bold">نسيت كلمة المرور؟</button>}
          {mode !== 'update' && <button type="button" onClick={() => { setMode(mode === 'login' || mode === 'forgot' ? 'register' : 'login'); setError(''); setNotice(''); setCaptchaToken(''); }} className="w-full text-slate-600 hover:text-brand-700 text-xs font-bold">{mode === 'register' ? 'لديك حساب بالفعل؟ سجّل الدخول' : 'ليس لديك حساب؟ أنشئ حسابًا جديدًا'}</button>}
          {mode === 'forgot' && <button type="button" onClick={() => { setMode('login'); setError(''); setNotice(''); setCaptchaToken(''); }} className="w-full text-slate-500 hover:text-brand-700 text-xs font-bold">العودة إلى تسجيل الدخول</button>}
        </form>
      </div>
    </div>
  );
};
