import React from 'react';
import { ArrowLeft, BookOpen, ShieldCheck, FileText } from 'lucide-react';

interface LegalPageProps {
  type: 'terms' | 'privacy';
  onBack: () => void;
  lang: 'ar' | 'fr';
}

export const LegalPage: React.FC<LegalPageProps> = ({ type, onBack, lang }) => {
  const isPrivacy = type === 'privacy';
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900 text-xs font-bold mb-6">
        <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" /> العودة إلى المنصة
      </button>
      <article className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-7 text-slate-700 leading-relaxed">
        <header className="flex items-start gap-4 border-b border-slate-100 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            {isPrivacy ? <ShieldCheck className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-emerald-700 font-black">كِتابي • Kitabi</p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif mt-1">{isPrivacy ? 'سياسة الخصوصية' : 'شروط الاستخدام'}</h1>
            <p className="text-xs text-slate-500 mt-2">آخر تحديث: أغسطس 2026</p>
          </div>
        </header>

        {isPrivacy ? (
          <>
            <section><h2 className="text-lg font-black text-slate-900 font-serif mb-2">1. البيانات التي نجمعها</h2><p>عند تسجيل الدخول برقم الهاتف، تحفظ Kitabi معرّف Firebase UID ورقم الهاتف وبعض بيانات الملف الشخصي التي يضيفها المستخدم. كما تحفظ بيانات الإعلانات والمحادثات وطلبات التبادل والبلاغات اللازمة لتشغيل الخدمة.</p></section>
            <section><h2 className="text-lg font-black text-slate-900 font-serif mb-2">2. كيف نستخدم البيانات</h2><p>تُستخدم البيانات لعرض الإعلانات، ربط المستخدمين، تشغيل المراسلة، معالجة طلبات التبادل، ومراجعة البلاغات. لا نبيع بيانات المستخدمين ولا نستخدم رقم الهاتف لإرسال رسائل تسويقية غير مطلوبة.</p></section>
            <section><h2 className="text-lg font-black text-slate-900 font-serif mb-2">3. الصور والملفات</h2><p>تُرفع صور الكتب إلى Firebase Storage ضمن مسار محمي مرتبط بمعرّف المستخدم، مع تقييد النوع والحجم. احذف أي صورة أو إعلان لم تعد ترغب في نشره.</p></section>
            <section><h2 className="text-lg font-black text-slate-900 font-serif mb-2">4. حقوقك</h2><p>يمكنك طلب تصحيح بياناتك أو حذف إعلانك أو التواصل مع الإدارة بخصوص أي بلاغ أو طلب متعلق ببياناتك.</p></section>
          </>
        ) : (
          <>
            <section><h2 className="text-lg font-black text-slate-900 font-serif mb-2">1. قبول الشروط</h2><p>باستخدام Kitabi، تقر بأنك ستستعمل المنصة بطريقة قانونية ومحترمة، وأن البيانات التي تقدمها في الإعلانات صحيحة قدر الإمكان.</p></section>
            <section><h2 className="text-lg font-black text-slate-900 font-serif mb-2">2. الإعلانات والتعاملات</h2><p>Kitabi توفر مساحة للتواصل بين العائلات والطلبة. يتحمل صاحب الإعلان مسؤولية دقة الوصف والسعر والصور، ويتحمل الطرفان مسؤولية الاتفاق على التسليم أو الشحن في مكان آمن.</p></section>
            <section><h2 className="text-lg font-black text-slate-900 font-serif mb-2">3. المحتوى الممنوع</h2><p>يُمنع نشر إعلانات وهمية أو مسيئة أو مخالفة للقانون أو صور لا علاقة لها بالكتاب. يمكن الإبلاغ عن أي محتوى مخالف، وتحتفظ الإدارة بحق إخفائه أو حذفه.</p></section>
            <section><h2 className="text-lg font-black text-slate-900 font-serif mb-2">4. الخدمة المجانية</h2><p>النشر والتصفح مجانيان في النسخة الحالية. قد تتغير بعض المزايا مستقبلًا مع إعلان ذلك بوضوح، دون ضمان توفر أي إعلان أو إتمام أي عملية بين المستخدمين.</p></section>
          </>
        )}

        <footer className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-600" /> منصة كتب مجتمعية للعائلات والطلبة في الجزائر.</footer>
      </article>
    </div>
  );
};
