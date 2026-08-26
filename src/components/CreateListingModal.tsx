import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  Camera, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  DollarSign, 
  RefreshCw, 
  Gift, 
  MapPin, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { BookListing, User, EducationLevel, BookCondition, DealType } from '../types';
import { WILAYAS, EDUCATION_LEVELS, GRADES_BY_LEVEL, SUBJECTS_BY_LEVEL, STREAMS } from '../data/algerianData';
import { StorageService } from '../services/storageService';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onListingCreated: (listing: BookListing) => void;
  lang: 'ar' | 'fr';
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onListingCreated,
  lang
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState<EducationLevel>('secondary');
  const [gradeCode, setGradeCode] = useState('3as');
  const [stream, setStream] = useState(STREAMS[0]);
  const [subject, setSubject] = useState(SUBJECTS_BY_LEVEL.secondary[0]);
  const [publisher, setPublisher] = useState('الديوان الوطني للمطبوعات المدرسية ONPS');
  const [year, setYear] = useState(2024);
  const [condition, setCondition] = useState<BookCondition>('like_new');
  const [dealType, setDealType] = useState<DealType>('sale');
  const [price, setPrice] = useState<number>(400);
  const [originalPrice, setOriginalPrice] = useState<number>(800);
  const [exchangeFor, setExchangeFor] = useState('');
  const [description, setDescription] = useState('');
  const [hasPencilMarks, setHasPencilMarks] = useState(false);
  const [hasAnswersIncluded, setHasAnswersIncluded] = useState(true);
  const [includesCD, setIncludesCD] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [wilayaCode, setWilayaCode] = useState<number>(currentUser.wilayaCode || 16);
  const [municipality, setMunicipality] = useState<string>(currentUser.municipality || 'باب الزوار');
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [phone, setPhone] = useState(currentUser.phone || '0550123456');

  if (!isOpen) return null;

  const currentWilaya = WILAYAS.find(w => w.code === wilayaCode) || WILAYAS[15]; // Alger default

  const handleLevelChange = (newLevel: EducationLevel) => {
    setLevel(newLevel);
    const availableGrades = GRADES_BY_LEVEL[newLevel];
    if (availableGrades && availableGrades.length > 0) {
      setGradeCode(availableGrades[0].code);
    }
    const availableSubjects = SUBJECTS_BY_LEVEL[newLevel];
    if (availableSubjects && availableSubjects.length > 0) {
      setSubject(availableSubjects[0]);
    }
  };

  const handleWilayaChange = (code: number) => {
    setWilayaCode(code);
    const w = WILAYAS.find(item => item.code === code);
    if (w && w.municipalities.length > 0) {
      setMunicipality(w.municipalities[0]);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const selectedFiles = Array.from(e.target.files || []) as File[];
    const files = selectedFiles.filter((file) => allowedTypes.has(file.type) && file.size <= 5 * 1024 * 1024).slice(0, 10);
    if (selectedFiles.some((file) => !allowedTypes.has(file.type) || file.size > 5 * 1024 * 1024)) {
      setSubmitError('يسمح فقط بصور JPG أو PNG أو WebP بحجم أقصى 5 ميغابايت للصورة.');
    }
    if (files.length === 0) return;
    const mergedFiles = [...photoFiles, ...files.filter((file) => !photoFiles.some((existing) => existing.name === file.name && existing.size === file.size))].slice(0, 10);
    setPhotoFiles(mergedFiles);
    setPhotos(mergedFiles.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
    const activeGradeObj = GRADES_BY_LEVEL[level].find(g => g.code === gradeCode);
    const gradeName = activeGradeObj ? activeGradeObj.nameAr : gradeCode;

    if (photoFiles.length < 5) throw new Error('يرجى رفع 5 صور حقيقية على الأقل: الأمام، الخلف، الوسط، والجانبان.');
    let uploadedPhotos: string[] = [];
    for (const [index, file] of photoFiles.entries()) {
      uploadedPhotos.push(await StorageService.uploadBookImage(file, `book-${Date.now()}-${index}`));
    }

    const newListing: BookListing = {
      id: crypto.randomUUID(),
      title: title.trim() || `كتاب ${subject} - ${gradeName}`,
      publisher: publisher.trim(),
      year: Number(year) || 2024,
      level,
      grade: gradeName,
      gradeCode,
      stream: level === 'secondary' ? stream : undefined,
      subject,
      condition,
      dealType,
      price: dealType === 'sale' ? Number(price) || 0 : 0,
      originalPrice: dealType === 'sale' ? Number(originalPrice) || 0 : undefined,
      exchangeFor: dealType === 'exchange' ? exchangeFor.trim() : undefined,
      description: description.trim() || 'كتاب مدرسي بحالة جيدة متاح للتسليم.',
      hasPencilMarks,
      hasAnswersIncluded,
      includesCD,
      photos: uploadedPhotos,
      wilayaCode,
      wilayaNameAr: currentWilaya.nameAr,
      wilayaNameFr: currentWilaya.nameFr,
      municipality: municipality || currentWilaya.municipalities[0],
      deliveryAvailable,
      handDeliveryOnly: !deliveryAvailable,
      sellerId: currentUser.id,
      seller: {
        ...currentUser,
        phone
      },
      createdAt: 'الآن',
      views: 1,
      favoritesCount: 0,
      isFeatured: false,
      status: 'pending'
    };

    await Promise.race([
      onListingCreated(newListing),
      new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('انتهت مهلة الاتصال. تحقق من اتصال الإنترنت ثم حاول مرة أخرى.')), 20000))
    ]);
    onClose();
    } catch (error) {
      console.error('Listing publish failed', error);
      setSubmitError(error instanceof Error ? error.message : 'تعذر نشر الإعلان. حاول مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      
      <div 
        id="create-listing-modal"
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]"
      >
        
        {/* Header */}
        <div className="bg-[#0B192C] text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base font-serif">
                {lang === 'ar' ? 'إضافة كتاب جديد في دقيقتين' : 'Publier une annonce en 2 min'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {lang === 'ar' ? 'اشري • بيع • بدّل • وفّر' : 'Vendez, échangez ou donnez vos livres'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step indicator */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-500 shrink-0">
          <button 
            onClick={() => setStep(1)} 
            className={`flex items-center gap-1.5 ${step === 1 ? 'text-brand-700 font-extrabold' : ''}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-brand-600 text-white' : 'bg-slate-300 text-slate-700'}`}>1</span>
            <span>{lang === 'ar' ? 'الصور والمستوى' : 'Photos & Niveau'}</span>
          </button>
          <div className="w-8 h-0.5 bg-slate-300" />
          <button 
            onClick={() => setStep(2)} 
            className={`flex items-center gap-1.5 ${step === 2 ? 'text-brand-700 font-extrabold' : ''}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-brand-600 text-white' : 'bg-slate-300 text-slate-700'}`}>2</span>
            <span>{lang === 'ar' ? 'الحالة والسعر/التبادل' : 'État & Prix/Échange'}</span>
          </button>
          <div className="w-8 h-0.5 bg-slate-300" />
          <button 
            onClick={() => setStep(3)} 
            className={`flex items-center gap-1.5 ${step === 3 ? 'text-brand-700 font-extrabold' : ''}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-brand-600 text-white' : 'bg-slate-300 text-slate-700'}`}>3</span>
            <span>{lang === 'ar' ? 'الموقع والنشر' : 'Localisation & Publier'}</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5 flex-1">
          {submitError && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-start gap-2"><AlertCircle className="w-5 h-5 shrink-0" /><span>{submitError}</span></div>}
          
          {/* STEP 1: Photos & Book Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Photo selection / Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {lang === 'ar' ? 'صورة الغلاف (أو اختر من الأغلفة الجاهزة)' : 'Photo de couverture'}
                </label>
                
                <div className="flex items-center gap-3">
                  <label className="relative aspect-[4/3] w-28 rounded-2xl border-2 border-dashed border-brand-400 bg-brand-50/50 hover:bg-brand-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden group shrink-0">
                    {photos[0] ? <img src={photos[0]} alt="Selected" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-brand-700"><Camera className="w-6 h-6" /><span className="text-[10px] font-bold mt-1">أضف 5 صور</span></div>}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-bold">إضافة صور</span>
                    </div>
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                  </label>

                  <div className="flex-1 space-y-1">
                    <span className="text-[11px] text-slate-500 font-medium block">{photos.length}/10 صور — اضغط لإضافة صورة أو عدة صور (الحد الأدنى 5):</span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {photos.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => { setPhotos((current) => current.filter((_, imageIndex) => imageIndex !== idx)); setPhotoFiles((current) => current.filter((_, imageIndex) => imageIndex !== idx)); }}
                          className={`w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                            photos[0] === preset ? 'border-brand-600 scale-105 shadow-sm' : 'border-slate-200 opacity-60'
                          }`}
                        >
                          <img src={preset} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'عنوان الكتاب أو المرجع' : 'Titre du manuel'} *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: الميسر في الرياضيات 3 ثانوي - مع الحلول' : 'Ex: Mathématiques 3AS Terminale'}
                  className="w-full bg-slate-50 text-slate-900 text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-brand-500 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Education Level (الطور التعليمي) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {lang === 'ar' ? 'الطور التعليمي' : 'Cycle éducatif'} *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {EDUCATION_LEVELS.map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => handleLevelChange(lvl.id)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        level === lvl.id
                          ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lang === 'ar' ? lvl.labelAr : lvl.labelFr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grade (السنة الدراسية) & Subject (المادة) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'السنة / الصف' : 'Année / Classe'} *
                  </label>
                  <select
                    value={gradeCode}
                    onChange={(e) => setGradeCode(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    {GRADES_BY_LEVEL[level].map((g) => (
                      <option key={g.code} value={g.code}>
                        {lang === 'ar' ? g.nameAr : g.nameFr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'المادة الدراسية' : 'Matière'} *
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    {SUBJECTS_BY_LEVEL[level].map((s, idx) => (
                      <option key={idx} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stream if secondary (الشعبة) */}
              {level === 'secondary' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'الشعبة (للثانوي)' : 'Filière'}
                  </label>
                  <select
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    {STREAMS.map((st, idx) => (
                      <option key={idx} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow"
                >
                  <span>التالي: الحالة والسعر</span>
                  <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                </button>
              </div>

            </div>
          )}

          {/* STEP 2: Condition & Deal Type (Sale / Exchange / Free) */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Condition (حالة الكتاب) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {lang === 'ar' ? 'حالة الكتاب' : 'État du livre'} *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'new', label: 'جديد كلياً', desc: 'لم يستعمل أبداً' },
                    { id: 'like_new', label: 'شبه جديد', desc: 'نظيف بدون خربشات' },
                    { id: 'good', label: 'حالة جيدة', desc: 'سليم ومكتمل' },
                    { id: 'acceptable', label: 'مقبول', desc: 'مستعمل ومقروء' }
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCondition(c.id as BookCondition)}
                      className={`p-2.5 rounded-xl border text-start transition-all ${
                        condition === c.id
                          ? 'bg-brand-50 text-brand-900 border-brand-600 ring-2 ring-brand-500/20 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-bold">{c.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{c.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Physical check attributes */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">تفاصيل إضافية عن النسخة:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasAnswersIncluded}
                      onChange={(e) => setHasAnswersIncluded(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>يتضمن حلول التمارين</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasPencilMarks}
                      onChange={(e) => setHasPencilMarks(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>توجد كتابات بالقلم</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includesCD}
                      onChange={(e) => setIncludesCD(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>مع القرص المدمج CD</span>
                  </label>
                </div>
              </div>

              {/* Deal Type Selection (للبيع / للتبادل / صدقة مجاناً) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {lang === 'ar' ? 'نوع العرض' : 'Type d\'offre'} *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDealType('sale')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                      dealType === 'sale'
                        ? 'bg-brand-50 text-brand-950 border-brand-600 ring-2 ring-brand-500/20 font-black'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <DollarSign className="w-5 h-5 text-brand-600 mb-1" />
                    <span className="text-xs">{lang === 'ar' ? 'للبيع (د.ج)' : 'À Vendre'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDealType('exchange')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                      dealType === 'exchange'
                        ? 'bg-blue-50 text-blue-950 border-blue-600 ring-2 ring-blue-500/20 font-black'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <RefreshCw className="w-5 h-5 text-blue-600 mb-1" />
                    <span className="text-xs">{lang === 'ar' ? 'للتبادل 🔄' : 'À Échanger'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDealType('free')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                      dealType === 'free'
                        ? 'bg-purple-50 text-purple-950 border-purple-600 ring-2 ring-purple-500/20 font-black'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Gift className="w-5 h-5 text-purple-600 mb-1" />
                    <span className="text-xs">{lang === 'ar' ? 'صدقة مجانية 🎁' : 'Don Gratuit'}</span>
                  </button>
                </div>
              </div>

              {/* Dynamic inputs based on Deal Type */}
              {dealType === 'sale' && (
                <div className="grid grid-cols-2 gap-3 bg-brand-50/50 p-3.5 rounded-2xl border border-brand-200/80">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {lang === 'ar' ? 'سعر البيع (دينار جزائري د.ج)' : 'Prix de vente (DZD)'} *
                    </label>
                    <input
                      type="number"
                      min={50}
                      step={50}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-white text-slate-900 font-bold text-sm px-3.5 py-2.5 rounded-xl border border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {lang === 'ar' ? 'السعر الأصلي جديد (اختياري)' : 'Prix d\'origine'}
                    </label>
                    <input
                      type="number"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(Number(e.target.value))}
                      className="w-full bg-white text-slate-900 text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {dealType === 'exchange' && (
                <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200">
                  <label className="block text-xs font-bold text-blue-900 mb-1">
                    {lang === 'ar' ? 'ما هو الكتاب أو المادة التي تبحث عنها بدلاً منه؟' : 'Quel livre recherchez-vous en échange?'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={exchangeFor}
                    onChange={(e) => setExchangeFor(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: أبحث عن كتاب العلوم الطبيعية 3 ثانوي أو كتاب الفلسفة' : 'Ex: Livre de Français 4AM'}
                    className="w-full bg-white text-slate-900 text-sm px-3.5 py-2.5 rounded-xl border border-blue-300 focus:outline-none font-medium"
                  />
                </div>
              )}

              {dealType === 'free' && (
                <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-200 text-xs text-purple-900 font-medium flex items-center gap-2">
                  <Gift className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>بارك الله فيك! سيظهر إعلانك بشارة صدقة مجانية وسيستفيد منه تلميذ أو عائلة محتاجة.</span>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'ملاحظات وتفاصيل إضافية' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={lang === 'ar' ? 'اكتب ملاحظات عن حالة الصفحات، مكان التسليم المفضل...' : 'Ajoutez des détails utiles...'}
                  className="w-full bg-slate-50 text-slate-900 text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-600 hover:text-slate-900 text-xs font-bold px-3 py-2"
                >
                  العودة
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow"
                >
                  <span>التالي: الموقع والتواصل</span>
                  <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: Location & Publish */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Wilaya & Municipality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'الولاية (69 ولاية)' : 'Wilaya (69 wilayas)'} *
                  </label>
                  <select
                    value={wilayaCode}
                    onChange={(e) => handleWilayaChange(Number(e.target.value))}
                    className="w-full bg-slate-50 text-slate-900 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    {WILAYAS.map(w => (
                      <option key={w.code} value={w.code}>
                        {w.code}. {lang === 'ar' ? w.nameAr : w.nameFr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'البلدية / الحي' : 'Commune'} *
                  </label>
                  <select
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    {currentWilaya.municipalities.map((m, idx) => (
                      <option key={idx} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Delivery options */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">طريقة التسليم والشحن:</span>
                <div className="space-y-2 text-xs">
                  <label className="flex items-start gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-brand-500/50 transition-colors">
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryAvailable}
                      onChange={() => setDeliveryAvailable(true)}
                      className="text-brand-600 focus:ring-brand-500 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        متوفر التوصيل والشحن (الدفع عند الاستلام)
                      </span>
                      <span className="text-[11px] text-brand-700 block mt-0.5">
                        ✓ إمكانية الشحن عبر شركات التوصيل لـ 69 ولاية مع تحصيل المبلغ يداً بيد (الدفع عند الاستلام)
                      </span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-slate-400/50 transition-colors">
                    <input
                      type="radio"
                      name="delivery"
                      checked={!deliveryAvailable}
                      onChange={() => setDeliveryAvailable(false)}
                      className="text-brand-600 focus:ring-brand-500 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        التسليم يداً بيد فقط
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        اللقاء المباشر في نفس البلدية أو الحي بدون شحن خارجي
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Phone number for contact */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'رقم الهاتف / الواتساب للتواصل المباشر' : 'Numéro de téléphone'} *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0550123456"
                  className="w-full bg-slate-50 text-slate-900 text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              {/* Summary Card */}
              <div className="bg-brand-950 text-white p-4 rounded-2xl border border-brand-700/50 space-y-1 text-xs">
                <div className="font-bold text-brand-300 text-sm font-serif">{title || `كتاب ${subject}`}</div>
                <div className="text-slate-300">
                  {currentWilaya.nameAr} ({municipality}) • {dealType === 'sale' ? `${price} د.ج` : (dealType === 'exchange' ? 'للتبادل 🔄' : 'صدقة مجانية 🎁')}
                </div>
                <div className="text-[11px] text-brand-400/90 pt-1">
                  ✓ النشر مجاني 100% وبدون أي عمولة على العائلات والطلبة
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-slate-600 hover:text-slate-900 text-xs font-bold px-3 py-2"
                >
                  العودة
                </button>
                <button
                  id="submit-create-listing-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 text-white font-black text-sm px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-950/40 active:scale-95 transition-all"
                >
                  {isSubmitting ? (
                    <span>جاري النشر...</span>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>{lang === 'ar' ? 'انشر الكتاب الآن' : 'Publier le livre'}</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </form>

      </div>
    </div>
  );
};
