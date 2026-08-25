import React, { useEffect, useRef, useState } from 'react';
import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Phone, X } from 'lucide-react';
import { auth, isFirebaseConfigured } from '../lib/firebase';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'fr';
  onAuthenticated: () => void;
}

function normalizeAlgerianPhone(value: string) {
  const compact = value.replace(/[\s-]/g, '');
  if (compact.startsWith('+')) return compact;
  if (compact.startsWith('0')) return `+213${compact.slice(1)}`;
  return `+213${compact}`;
}

export const PhoneAuthModal: React.FC<PhoneAuthModalProps> = ({
  isOpen,
  onClose,
  lang,
  onAuthenticated,
}) => {
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !auth || recaptchaRef.current) return;
    recaptchaRef.current = new RecaptchaVerifier(auth, 'phone-auth-recaptcha', {
      size: 'normal',
      callback: () => setError(''),
      'expired-callback': () => setError('انتهت صلاحية التحقق، حاول مرة أخرى.'),
    });

    return () => {
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setStep('phone');
      setCode('');
      setError('');
      confirmationRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!auth || !recaptchaRef.current) {
      setError('المصادقة غير مهيأة بعد. تحقق من إعدادات Firebase.');
      return;
    }
    setIsSubmitting(true);
    try {
      confirmationRef.current = await signInWithPhoneNumber(
        auth,
        normalizeAlgerianPhone(phone),
        recaptchaRef.current,
      );
      setStep('code');
    } catch (authError) {
      console.error(authError);
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
      setError('تعذر إرسال رمز التحقق. تأكد من الرقم ومن تفعيل Phone Auth في Firebase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!confirmationRef.current) return;
    setError('');
    setIsSubmitting(true);
    try {
      await confirmationRef.current.confirm(code.trim());
      onAuthenticated();
      onClose();
    } catch (authError) {
      console.error(authError);
      setError('رمز التحقق غير صحيح أو منتهي الصلاحية.');
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
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base">{lang === 'ar' ? 'الدخول إلى كتابي' : 'Connexion à Ktabi'}</h2>
              <p className="text-[11px] text-slate-400">{lang === 'ar' ? 'دخول آمن عبر رقم الهاتف' : 'Connexion sécurisée par téléphone'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!isFirebaseConfigured && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>أضف متغيرات Firebase إلى ملف البيئة أولاً لتفعيل الدخول الحقيقي.</span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الهاتف الجزائري</label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0550 12 34 56"
                  className="w-full bg-slate-50 text-slate-900 text-base px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">قد تصلك رسالة SMS، وقد تطبق شركة الاتصالات رسومًا عادية.</p>
              </div>
              <div id="phone-auth-recaptcha" className="min-h-[78px] flex justify-center" />
              <button
                type="submit"
                disabled={isSubmitting || !isFirebaseConfigured}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm px-4 py-3 rounded-xl flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                <span>إرسال رمز التحقق</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmCode} className="space-y-4">
              <div className="text-center space-y-1">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="font-bold text-slate-900">تحقق من رسائلك</h3>
                <p className="text-xs text-slate-500">أدخل الرمز المكوّن من 6 أرقام المرسل إلى {phone}</p>
              </div>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                minLength={6}
                maxLength={6}
                dir="ltr"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full bg-slate-50 text-slate-900 text-center tracking-[0.5em] text-xl px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm px-4 py-3 rounded-xl flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>تأكيد الدخول</span>
              </button>
              <button type="button" onClick={() => setStep('phone')} className="w-full text-slate-600 hover:text-emerald-700 text-xs font-bold flex items-center justify-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> تغيير الرقم
              </button>
            </form>
          )}

          {error && <p className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs font-medium">{error}</p>}
        </div>
      </div>
    </div>
  );
};
