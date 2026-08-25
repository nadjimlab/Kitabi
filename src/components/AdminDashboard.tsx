import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  BookOpen, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Star, 
  Sparkles, 
  MapPin, 
  Building2, 
  TrendingUp, 
  Coins, 
  RefreshCw, 
  Layers, 
  ArrowLeft,
  Check,
  Trash2,
  DollarSign,
  UserRound,
  LayoutDashboard,
  Search,
  Activity
} from 'lucide-react';
import { BookListing, ReportItem, User } from '../types';
import { StorageService } from '../services/storageService';
import { WILAYAS, EDUCATION_LEVELS } from '../data/algerianData';

interface AdminDashboardProps {
  listings: BookListing[];
  onBackToApp: () => void;
  lang: 'ar' | 'fr';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  listings,
  onBackToApp,
  lang
}) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'reports' | 'users' | 'catalog' | 'wilayas' | 'monetization'>('listings');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userQuery, setUserQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadAdminData = async () => {
      const [remoteReports, remoteUsers] = await Promise.all([StorageService.getReports(), StorageService.getAllUsers()]);
      if (!cancelled) {
        setReports(remoteReports);
        setAllUsers(remoteUsers);
      }
    };
    void loadAdminData();
    return () => { cancelled = true; };
  }, []);

  const stats = StorageService.getPlatformStats(listings);
  const filteredUsers = allUsers.filter((user) => {
    const query = userQuery.trim().toLowerCase();
    return !query || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
  });

  const handleToggleFeatured = async (id: string) => {
    const target = listings.find(l => l.id === id);
    if (target) {
      await StorageService.saveListing({ ...target, isFeatured: !target.isFeatured });
      window.location.reload();
    }
  };

  const handleToggleStatus = async (id: string, status: 'active' | 'flagged' | 'completed') => {
    await StorageService.markListingStatus(id, status);
    window.location.reload();
  };

  const handleResolveReport = async (reportId: string, action: 'resolved' | 'dismissed') => {
    await StorageService.resolveReport(reportId, action);
    setReports(await StorageService.getReports());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Admin Top Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0B192C] via-[#102945] to-[#063B3B] text-white p-5 sm:p-7 rounded-[2rem] border border-slate-700/70 shadow-2xl">
        <div className="absolute -top-20 -left-16 w-56 h-56 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/15 text-amber-300 border border-amber-300/30 flex items-center justify-center shadow-inner shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-200 font-black"><Activity className="w-3.5 h-3.5" /> النظام يعمل</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black">ADMIN CONTROL</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-serif">مرحبًا بك في مركز قيادة كِتابي</h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">إدارة الإعلانات، حماية المجتمع، ومتابعة نمو المنصة من مساحة واحدة.</p>
            </div>
          </div>
          <button onClick={onBackToApp} className="bg-white/10 hover:bg-white/15 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/15 flex items-center gap-1.5 transition-colors w-full lg:w-auto justify-center">
            <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            <span>العودة إلى المنصة</span>
          </button>
        </div>
        <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-2xl bg-white/7 border border-white/10 px-3 py-2.5"><div className="text-[10px] text-slate-400">إعلانات نشطة</div><div className="text-lg font-black mt-0.5">{listings.filter((listing) => listing.status === 'active').length}</div></div>
          <div className="rounded-2xl bg-white/7 border border-white/10 px-3 py-2.5"><div className="text-[10px] text-slate-400">المستخدمون</div><div className="text-lg font-black mt-0.5">{allUsers.length}</div></div>
          <div className="rounded-2xl bg-white/7 border border-white/10 px-3 py-2.5"><div className="text-[10px] text-slate-400">بلاغات معلقة</div><div className="text-lg font-black text-amber-300 mt-0.5">{reports.filter((report) => report.status === 'pending').length}</div></div>
          <div className="rounded-2xl bg-white/7 border border-white/10 px-3 py-2.5"><div className="text-[10px] text-slate-400">التغطية</div><div className="text-lg font-black mt-0.5">{stats.activeWilayasCount}<span className="text-xs text-slate-400"> / 69</span></div></div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>إجمالي الإعلانات</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-2">{listings.length}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">✓ كل الأطوار الدراسية</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>التبادلات والتبرعات</span>
            <RefreshCw className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-2">
            {stats.activeExchanges + stats.freeDonations}
          </div>
          <div className="text-[10px] text-blue-600 font-semibold mt-1">
            {stats.activeExchanges} تبادل • {stats.freeDonations} صدقة
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>التوفير للعائلات</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-2">
            {stats.estimatedSavingsDZD.toLocaleString()} <span className="text-xs">د.ج</span>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1">معدل 450 د.ج لكل كتاب</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>تغطية الولايات</span>
            <MapPin className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-2">
            {stats.activeWilayasCount} <span className="text-xs text-slate-400">/ 69</span>
          </div>
          <div className="text-[10px] text-purple-600 font-semibold mt-1">نشطة حالياً</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>البلاغات المعلقة</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono mt-2">
            {reports.filter(r => r.status === 'pending').length}
          </div>
          <div className="text-[10px] text-rose-600 font-semibold mt-1">بحاجة للمراجعة</div>
        </div>

      </div>

      {/* Admin Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'listings' ? 'bg-[#0B192C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>إدارة الكتب والمراجعة ({listings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'reports' ? 'bg-[#0B192C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>البلاغات والأمان ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'users' ? 'bg-[#0B192C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserRound className="w-4 h-4" />
          <span>المستخدمون ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'catalog' ? 'bg-[#0B192C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>دليل المنهاج والكتب المعتمدة</span>
        </button>

        <button
          onClick={() => setActiveTab('wilayas')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'wilayas' ? 'bg-[#0B192C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>توزيع الـ 69 ولاية</span>
        </button>

        <button
          onClick={() => setActiveTab('monetization')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'monetization' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>خطة الشراكات والمكتبات (Monetization)</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-4">
        
        {/* TAB 1: Listings Moderation Table */}
        {activeTab === 'listings' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 font-serif">قائمة الإعلانات المنشورة وإجراءات الرقابة</h3>
              <span className="text-xs text-slate-500">إجمالي {listings.length} إعلان</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 text-start">الكتاب</th>
                    <th className="py-3 px-4 text-start">المستوى والمادة</th>
                    <th className="py-3 px-4 text-start">النوع والسعر</th>
                    <th className="py-3 px-4 text-start">المعلن والولاية</th>
                    <th className="py-3 px-4 text-start">الحالة والمميز</th>
                    <th className="py-3 px-4 text-start">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listings.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img src={l.photos[0]} alt="" className="w-10 h-12 rounded-lg object-cover border shrink-0" />
                          <div className="font-bold text-slate-900 max-w-[200px] truncate">{l.title}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>{l.grade}</div>
                        <div className="text-slate-400 text-[10px]">{l.subject}</div>
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {l.dealType === 'sale' ? `${l.price} د.ج` : (l.dealType === 'exchange' ? '🔄 تبادل' : '🎁 مجاني')}
                      </td>
                      <td className="py-3 px-4">
                        <div>{l.seller.name}</div>
                        <div className="text-slate-400 text-[10px]">{l.wilayaNameAr} ({l.municipality})</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            l.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                            l.status === 'flagged' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {l.status}
                          </span>
                          {l.isFeatured && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                              ★ مميز
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleFeatured(l.id)}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold"
                            title="تمييز الإعلان"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          {l.status === 'active' ? (
                            <button
                              onClick={() => handleToggleStatus(l.id, 'flagged')}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold"
                              title="حظر الإعلان"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(l.id, 'active')}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold"
                              title="تفعيل الإعلان"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Reports */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 font-serif">البلاغات الواردة من المستخدمين</h3>
            
            {reports.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">لا توجد أي بلاغات حالياً ✓</div>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[10px]">
                          {r.reasonLabel}
                        </span>
                        <span className="text-slate-500">{r.createdAt}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{r.listingTitle}</h4>
                      <p className="text-slate-700 bg-white p-2 rounded-xl border border-slate-200">
                        التفاصيل: "{r.details}"
                      </p>
                      <div className="text-slate-500 text-[11px]">
                        المبلغ: {r.reporterName} • صاحب الإعلان: {r.sellerName}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {r.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleResolveReport(r.id, 'resolved')}
                            className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl shadow text-xs"
                          >
                            معالجة وإغلاق
                          </button>
                          <button
                            onClick={() => handleResolveReport(r.id, 'dismissed')}
                            className="bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs"
                          >
                            تجاهل
                          </button>
                        </>
                      ) : (
                        <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-1 rounded-lg">
                          تم الحل ✓
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: User Directory */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-base text-slate-900 font-serif">دليل مجتمع كِتابي</h3>
                <p className="text-xs text-slate-500 mt-1">متابعة الحسابات والأدوار وحالة المجتمع من مكان واحد.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                <input value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="ابحث بالاسم أو البريد" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-9 pl-3 text-xs outline-none focus:border-emerald-500" />
              </div>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-400">لا توجد حسابات مطابقة حاليًا.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={user.avatar} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0" />
                      <div className="min-w-0"><div className="font-bold text-sm text-slate-900 truncate">{user.name}</div><div className="text-[11px] text-slate-500 truncate" dir="ltr">{user.email || 'بدون بريد'}</div></div>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 ${user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{user.role === 'admin' ? 'مسؤول' : 'مستخدم'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Algerian Catalog Manager */}
        {activeTab === 'catalog' && (
          <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 font-serif">شجرة المنهاج التربوي الجزائري المعتمد (ONPS)</h3>
            <p className="text-xs text-slate-500">
              دليل الأطوار والمستويات والشعب والمقررات الرسمية لوزارة التربية الوطنية الجزائرية
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EDUCATION_LEVELS.map(lvl => (
                <div key={lvl.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <div className="font-bold text-sm text-emerald-950 flex items-center justify-between">
                    <span>{lvl.labelAr}</span>
                    <span className="text-slate-500 font-mono text-xs">{lvl.labelFr}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{lvl.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Wilayas Heatmap & Distribution */}
        {activeTab === 'wilayas' && (
          <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 font-serif">توزيع الإعلانات عبر الـ 69 ولاية جزائرية</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              {WILAYAS.map(w => {
                const count = listings.filter(l => l.wilayaCode === w.code).length;
                return (
                  <div key={w.code} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{w.code}. {w.nameAr}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{w.nameFr}</div>
                    </div>
                    <span className={`font-black text-xs px-2 py-0.5 rounded-md ${count > 0 ? 'bg-emerald-100 text-emerald-800' : 'text-slate-300'}`}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: Monetization & Bookstore Network Architecture */}
        {activeTab === 'monetization' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
                خطة واستراتيجية تحقيق الدخل المستقبلية لـ كِتابي
              </div>
              <h3 className="text-lg font-black text-slate-900 font-serif">
                بنية التسييل والشراكات مع المكتبات ونقاط البيع الجزائرية
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-3xl">
                يبقى استخدام المنصة للأفراد والعائلات والطلبة <strong>مجاناً 100%</strong>. يتم تحقيق العوائد من خلال اشتراكات المكتبات الشريكة، الإعلانات المميزة، وتوليد العملاء المهتمين بحزم الكتب المدرسية.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              {/* Tier 1: Bookstore Partner Subscription */}
              <div className="p-5 rounded-3xl border-2 border-emerald-300 bg-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-sm">اشتراك المكتبات المعتمدة</span>
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-xl font-black text-emerald-950 font-mono">
                  3,500 <span className="text-xs font-normal">د.ج / شهرياً</span>
                </div>
                <ul className="space-y-1.5 text-slate-700">
                  <li>✓ شارة "مكتبة معتمدة" موثقة</li>
                  <li>✓ إدراج عدد غير محدود من الكتب والمراجع</li>
                  <li>✓ ظهور في أعلى نتائج البحث للولاية</li>
                  <li>✓ توجيه الزبائن للشراء يد بيد من مقر المكتبة</li>
                </ul>
              </div>

              {/* Tier 2: Featured Listings */}
              <div className="p-5 rounded-3xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">الإعلانات المميزة (Featured)</span>
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-xl font-black text-slate-900 font-mono">
                  300 <span className="text-xs font-normal">د.ج / 7 أيام</span>
                </div>
                <ul className="space-y-1.5 text-slate-700">
                  <li>✓ تثبيت الإعلان في الصفحة الرئيسية</li>
                  <li>✓ شريط "مميز" ذهبي لافت للانتباه</li>
                  <li>✓ إشعار مستخدمي نفس الولاية المتطابقين</li>
                </ul>
              </div>

              {/* Tier 3: School Bundles & Lead Gen */}
              <div className="p-5 rounded-3xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">حزم الدخول المدرسي (Lead Gen)</span>
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-xl font-black text-slate-900 font-mono">
                  عمولة شريك <span className="text-xs font-normal">مستقبلاً</span>
                </div>
                <ul className="space-y-1.5 text-slate-700">
                  <li>✓ طلب حقيبة كتب السنة كاملة بنقرة واحدة</li>
                  <li>✓ ربط الطلبات بالمكتبات المعتمدة الأقرب جغرافياً</li>
                  <li>✓ خدمات التوصيل السريع للمنازل (Yalidine, ZR Express)</li>
                </ul>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
};
