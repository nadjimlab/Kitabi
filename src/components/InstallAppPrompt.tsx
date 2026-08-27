import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISSED_KEY = 'kitabi-pwa-install-dismissed-v1';

export const InstallAppPrompt: React.FC = () => {
  const [installEvent, setInstallEvent] = useState<DeferredInstallPrompt | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === '1');

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as DeferredInstallPrompt);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isIos && !isStandalone && !localStorage.getItem(DISMISSED_KEY)) setShowIosHelp(true);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const close = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
    setShowIosHelp(false);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  if (dismissed || (!installEvent && !showIosHelp)) return null;

  return (
    <div dir="rtl" className="fixed bottom-[5.25rem] sm:bottom-5 right-3 left-3 sm:left-auto sm:w-[360px] z-[65] rounded-2xl bg-[#0B192C] text-white border border-slate-700 shadow-2xl p-4">
      <button onClick={close} aria-label="إغلاق" className="absolute left-2 top-2 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
      <div className="flex items-start gap-3 pl-5">
        <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center shrink-0"><Download className="w-5 h-5" /></div>
        <div>
          <h3 className="font-black text-sm">ثبّت كِتابي كتطبيق</h3>
          {showIosHelp ? (
            <p className="text-[11px] text-slate-300 leading-5 mt-1">من Safari اضغط زر المشاركة ثم اختر «إضافة إلى الشاشة الرئيسية».</p>
          ) : (
            <p className="text-[11px] text-slate-300 leading-5 mt-1">وصول أسرع من شاشة هاتفك أو حاسوبك، بدون تحميل من متجر التطبيقات.</p>
          )}
          {installEvent && <button onClick={() => void install()} className="mt-2 rounded-lg bg-brand-500 hover:bg-brand-400 px-3 py-1.5 text-[11px] font-black">تثبيت الآن</button>}
        </div>
      </div>
    </div>
  );
};
