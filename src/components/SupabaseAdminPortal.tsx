import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowLeft, BookOpen, LayoutDashboard, Loader2, LogOut, RefreshCw, ShieldCheck, Users, XCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface DashboardData {
  users: number;
  listings: number;
  reports: number;
  activeListings: number;
  recentListings: Array<{ id: string; title: string; status: string; created_at: string }>;
}

const emptyData: DashboardData = { users: 0, listings: 0, reports: 0, activeListings: 0, recentListings: [] };

export const SupabaseAdminPortal: React.FC = () => {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = async (userId: string) => {
    setLoading(true);
    setError('');
    const profile = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (profile.error) throw profile.error;
    if (profile.data?.role !== 'admin') {
      setIsAdmin(false);
      throw new Error('هذا الحساب ليس مسؤولًا في Supabase. يجب أن تكون قيمة role مساوية admin.');
    }
    setIsAdmin(true);
    const [users, listings, activeListings, reports, recentListings] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('listings').select('id,title,status,created_at').order('created_at', { ascending: false }).limit(8),
    ]);
    const failed = [users, listings, activeListings, reports, recentListings].find((result) => result.error);
    if (failed?.error) throw failed.error;
    setData({
      users: users.count || 0,
      listings: listings.count || 0,
      activeListings: activeListings.count || 0,
      reports: reports.count || 0,
      recentListings: (recentListings.data || []) as DashboardData['recentListings'],
    });
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: sessionData }) => {
      if (!mounted) return;
      const user = sessionData.session?.user;
      setSessionEmail(user?.email || null);
      if (!user) { setLoading(false); return; }
      try { await loadDashboard(user.id); } catch (err) { setError(err instanceof Error ? err.message : 'تعذر تحميل لوحة الإدارة.'); setLoading(false); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      setSessionEmail(authSession?.user?.email || null);
      if (!authSession?.user) { setIsAdmin(false); setData(emptyData); setLoading(false); }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true); setError('');
    const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (result.error) setError(result.error.message);
    else if (result.data.user) {
      setSessionEmail(result.data.user.email || null);
      try { await loadDashboard(result.data.user.id); } catch (err) { setError(err instanceof Error ? err.message : 'تعذر تحميل لوحة الإدارة.'); }
    }
    setSubmitting(false);
  };

  const signOut = async () => { await supabase.auth.signOut(); setSessionEmail(null); setIsAdmin(false); };
  const refreshDashboard = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      try { await loadDashboard(userData.user.id); } catch (err) { setError(err instanceof Error ? err.message : 'تعذر تحديث لوحة الإدارة.'); setLoading(false); }
    }
  };
  const formattedUrl = useMemo(() => new URL(import.meta.env.VITE_SUPABASE_URL || 'https://glmutfebrsmylxltjboe.supabase.co').hostname, []);

  if (!sessionEmail || !isAdmin) {
    return <div dir="rtl" className="min-h-screen bg-[#081426] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white text-slate-900 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-[#0B192C] via-[#123456] to-emerald-900 p-7 text-white">
          <div className="flex items-center justify-between"><div className="w-12 h-12 rounded-2xl bg-emerald-400/20 flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-emerald-300" /></div><span className="text-[10px] tracking-[0.2em] text-emerald-200 font-black">KITABI CONTROL</span></div>
          <h1 className="text-2xl font-black mt-6">مركز إدارة كتابي</h1><p className="text-slate-300 text-sm mt-1">لوحة مستقلة وآمنة تعمل عبر Supabase</p>
        </div>
        <form onSubmit={signIn} className="p-6 space-y-4">
          {error && <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-3 text-xs leading-5 flex gap-2"><XCircle className="w-4 h-4 shrink-0" />{error}</div>}
          <label className="block text-xs font-bold">البريد الإلكتروني<input required type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-emerald-500" /></label>
          <label className="block text-xs font-bold">كلمة المرور<input required type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-emerald-500" /></label>
          <button disabled={submitting} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black p-3 flex items-center justify-center gap-2 disabled:opacity-60">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}دخول إلى لوحة الإدارة</button>
          <p className="text-[11px] text-slate-400 text-center">يجب إنشاء الحساب أولًا في Supabase Auth ثم تعيين role = admin في profiles.</p>
          <p className="text-[10px] text-slate-300 text-center" dir="ltr">{formattedUrl}</p>
        </form>
      </div>
    </div>;
  }

  return <div dir="rtl" className="min-h-screen bg-[#f6f8fb] text-slate-900">
    <aside className="fixed inset-y-0 right-0 hidden w-64 bg-[#0B192C] text-white p-5 lg:block"><div className="flex items-center gap-3 border-b border-white/10 pb-5"><div className="w-10 h-10 rounded-xl bg-emerald-400/20 flex items-center justify-center"><BookOpen className="text-emerald-300" /></div><div><div className="font-black">كِتابي</div><div className="text-[10px] text-slate-400">Control Center</div></div></div><nav className="mt-7 space-y-2"><div className="rounded-xl bg-emerald-500/15 text-emerald-300 px-3 py-3 flex items-center gap-3 text-sm font-bold"><LayoutDashboard className="w-4 h-4" />نظرة عامة</div><div className="px-3 py-3 text-slate-400 flex items-center gap-3 text-sm"><Users className="w-4 h-4" />المستخدمون</div><div className="px-3 py-3 text-slate-400 flex items-center gap-3 text-sm"><BookOpen className="w-4 h-4" />الإعلانات</div><div className="px-3 py-3 text-slate-400 flex items-center gap-3 text-sm"><AlertTriangle className="w-4 h-4" />البلاغات</div></nav></aside>
    <main className="lg:mr-64 p-4 sm:p-8 max-w-[1500px]"><header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"><div><div className="text-xs text-slate-500 font-bold mb-2">Supabase / Kitabi / Control</div><h1 className="text-2xl sm:text-3xl font-black">نظرة عامة</h1><p className="text-sm text-slate-500 mt-1">مرحبًا بك، {sessionEmail}</p></div><div className="flex gap-2"><button onClick={refreshDashboard} className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600"><RefreshCw className="w-4 h-4" /></button><button onClick={signOut} className="rounded-xl bg-[#0B192C] text-white p-3 flex items-center gap-2 text-xs font-bold"><LogOut className="w-4 h-4" />خروج</button></div></header>
      {loading ? <div className="rounded-3xl bg-white border border-slate-200 p-12 flex justify-center"><Loader2 className="animate-spin text-emerald-600" /></div> : <><div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5"><div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm"><Users className="w-5 h-5 text-blue-600" /><div className="text-3xl font-black mt-4">{data.users}</div><div className="text-xs text-slate-500 mt-1">إجمالي المستخدمين</div></div><div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm"><BookOpen className="w-5 h-5 text-emerald-600" /><div className="text-3xl font-black mt-4">{data.listings}</div><div className="text-xs text-slate-500 mt-1">إجمالي الإعلانات</div></div><div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm"><Activity className="w-5 h-5 text-violet-600" /><div className="text-3xl font-black mt-4">{data.activeListings}</div><div className="text-xs text-slate-500 mt-1">إعلانات نشطة</div></div><div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm"><AlertTriangle className="w-5 h-5 text-amber-600" /><div className="text-3xl font-black mt-4">{data.reports}</div><div className="text-xs text-slate-500 mt-1">بلاغات معلقة</div></div></div><section className="mt-6 rounded-3xl bg-white border border-slate-200 overflow-hidden"><div className="p-5 border-b border-slate-100 flex items-center justify-between"><div><h2 className="font-black">آخر الإعلانات</h2><p className="text-xs text-slate-500 mt-1">مراقبة النشاط الجديد في المنصة</p></div><span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full font-bold">مباشر</span></div>{data.recentListings.length === 0 ? <div className="p-10 text-center text-sm text-slate-400">لا توجد إعلانات حتى الآن</div> : <div className="divide-y divide-slate-100">{data.recentListings.map((listing) => <div key={listing.id} className="p-4 flex items-center justify-between gap-3"><div><div className="font-bold text-sm">{listing.title}</div><div className="text-xs text-slate-400 mt-1">{new Date(listing.created_at).toLocaleDateString('ar-DZ')}</div></div><span className="text-[11px] rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1">{listing.status}</span></div>)}</div>}</section></>}
    </main>
  </div>;
};
