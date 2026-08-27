import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowUpLeft, BarChart3, Bell, BookOpen, Check,
  CheckCircle2, ChevronLeft, Clock3, LayoutDashboard, LogOut, MessageSquare,
  RefreshCw, Search, ShieldCheck, ShieldOff, Star, Users, X, XCircle, Pencil, Trash2, Ban
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { createNotification } from '../services/notificationsService';
import { EDUCATION_LEVELS } from '../data/algerianData';

type Section = 'overview' | 'listings' | 'users' | 'messages' | 'reports';

interface DashboardListing {
  id: string; title: string; status: string; created_at: string; seller_id?: string;
  level?: string; deal_type?: string; condition?: string; price?: number; author?: string;
  photos?: string[]; description?: string; wilaya_name_ar?: string;
  seller?: { name?: string; email?: string; phone?: string };
}
interface DashboardUser { id: string; name: string; email: string; role: string; created_at: string; }
interface DashboardData {
  users: number; listings: number; activeListings: number; pendingListings: number;
  soldListings: number; unavailableListings: number; reservedListings: number; completedListings: number;
  pendingReports: number; ratings: number; messages: number; exchanges: number; favorites: number;
  recentListings: DashboardListing[]; recentUsers: DashboardUser[];
}
interface AdminUserRow {
  id: string; name: string; email: string; phone: string; wilaya_code: number;
  municipality?: string; whatsapp?: string | null; bio?: string | null; avatar?: string | null;
  role: string; is_verified: boolean; rating: number; created_at: string;
}
interface AdminReportRow {
  id: string; reason: string; details: string; status: string; created_at: string;
  listing_id: string; reporter_id: string;
  listing?: { title?: string } | null; reporter?: { name?: string; email?: string } | null;
}
interface AdminChatRow {
  id: string; listing_id: string | null; last_message: string; last_message_time: string;
  participant_ids: string[]; listing?: { title?: string } | null;
}

const emptyData: DashboardData = { users: 0, listings: 0, activeListings: 0, pendingListings: 0, soldListings: 0, unavailableListings: 0, reservedListings: 0, completedListings: 0, pendingReports: 0, ratings: 0, messages: 0, exchanges: 0, favorites: 0, recentListings: [], recentUsers: [] };
const dateLabel = (value: string) => new Date(value).toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' });
const dateTimeLabel = (value: string) => new Date(value).toLocaleString('ar-DZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const isToday = (value: string) => new Date(value).toDateString() === new Date().toDateString();

const LEVEL_LABELS: Record<string, string> = Object.fromEntries(EDUCATION_LEVELS.map((l) => [l.id, l.labelAr]));
const CONDITION_LABELS: Record<string, string> = { new: 'جديد تماماً', like_new: 'شبه جديد', good: 'حالة جيدة', acceptable: 'مقبول' };
const STATUS_LABELS: Record<string, { label: string; classes: string }> = {
  active: { label: 'نشط', classes: 'bg-brand-50 text-brand-700 border-brand-200' },
  pending: { label: 'قيد المراجعة', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  flagged: { label: 'موقوف', classes: 'bg-rose-50 text-rose-700 border-rose-200' },
  reserved: { label: 'محجوز', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: 'مكتمل', classes: 'bg-slate-100 text-slate-600 border-slate-200' },
  sold: { label: 'مباع', classes: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  unavailable: { label: 'غير متوفر', classes: 'bg-orange-50 text-orange-700 border-orange-200' },
};
const REPORT_REASON_LABELS: Record<string, string> = {
  wrong_info: 'معلومات خاطئة', prohibited_item: 'محتوى ممنوع', offensive: 'محتوى مسيء',
  fake_account: 'حساب وهمي', sold_already: 'تم بيعه مسبقاً', other: 'سبب آخر',
};
const REPORT_STATUS_LABELS: Record<string, { label: string; classes: string }> = {
  pending: { label: 'بانتظار المراجعة', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  resolved: { label: 'تمت المعالجة', classes: 'bg-brand-50 text-brand-700 border-brand-200' },
  dismissed: { label: 'مرفوض', classes: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const StatusBadge: React.FC<{ status: string; map: Record<string, { label: string; classes: string }> }> = ({ status, map }) => {
  const info = map[status] || { label: status, classes: 'bg-slate-100 text-slate-600 border-slate-200' };
  return <span className={`text-[10px] rounded-full px-2.5 py-1 font-bold border ${info.classes}`}>{info.label}</span>;
};

export const SupabaseAdminPortal: React.FC = () => {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [reviewListing, setReviewListing] = useState<DashboardListing | null>(null);

  // Per-section state, loaded lazily the first time a tab is opened.
  const [listings, setListings] = useState<DashboardListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsLoaded, setListingsLoaded] = useState(false);
  const [listingSearch, setListingSearch] = useState('');
  const [listingStatusFilter, setListingStatusFilter] = useState<'all' | string>('all');

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleBusyId, setRoleBusyId] = useState<string | null>(null);
  const [listingBusyId, setListingBusyId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [userForm, setUserForm] = useState({ name: '', phone: '', whatsapp: '', municipality: '', bio: '' });
  const [userSaveBusy, setUserSaveBusy] = useState(false);

  const [reports, setReports] = useState<AdminReportRow[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsLoaded, setReportsLoaded] = useState(false);
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | string>('pending');

  const [chats, setChats] = useState<AdminChatRow[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsLoaded, setChatsLoaded] = useState(false);

  const loadDashboard = async (userId: string) => {
    setLoading(true); setError('');
    const profile = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (profile.error) throw profile.error;
    if (profile.data?.role !== 'admin') { setIsAdmin(false); throw new Error('هذا الحساب ليس مسؤولًا في Supabase.'); }
    setIsAdmin(true);
    const optional = async (query: PromiseLike<any>) => {
      const result = await query;
      return result.error ? { data: null, count: 0, error: null } : result;
    };
    const [users_, listings_, listingStatuses, reports_, ratings, messages, exchanges, favorites, recentListings, recentUsers] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('status'),
      optional(supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
      optional(supabase.from('ratings').select('id', { count: 'exact', head: true })),
      optional(supabase.from('messages').select('id', { count: 'exact', head: true })),
      optional(supabase.from('exchange_requests').select('id', { count: 'exact', head: true })),
      optional(supabase.from('favorites').select('listing_id', { count: 'exact', head: true })),
      supabase.from('listings').select('id,title,status,created_at,level,deal_type,photos,description,condition,price,seller_id').order('created_at', { ascending: false }).limit(6),
      supabase.from('profiles').select('id,name,email,role,created_at').order('created_at', { ascending: false }).limit(5),
    ]);
    const failed = [users_, listings_, listingStatuses, recentListings, recentUsers].find((result) => result.error);
    if (failed?.error) throw failed.error;
    const statusCounts = ((listingStatuses.data || []) as Array<{ status?: string }>).reduce<Record<string, number>>((counts, row) => {
      const status = row.status || 'unknown';
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {});
    setData({
      users: users_.count || 0, listings: listings_.count || 0, activeListings: statusCounts.active || 0,
      pendingListings: statusCounts.pending || 0, soldListings: statusCounts.sold || 0, unavailableListings: statusCounts.unavailable || 0,
      reservedListings: statusCounts.reserved || 0, completedListings: statusCounts.completed || 0,
      pendingReports: reports_.count || 0, ratings: ratings.count || 0,
      messages: messages.count || 0, exchanges: exchanges.count || 0, favorites: favorites.count || 0,
      recentListings: (recentListings.data || []) as DashboardListing[], recentUsers: (recentUsers.data || []) as DashboardUser[],
    });
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: sessionData }) => {
      if (!mounted) return;
      const user = sessionData.session?.user;
      setSessionEmail(user?.email || null);
      setSessionUserId(user?.id || null);
      if (!user) { setLoading(false); return; }
      try { await loadDashboard(user.id); } catch (err) { setError(err instanceof Error ? err.message : 'تعذر تحميل لوحة الإدارة.'); setLoading(false); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email || null);
      setSessionUserId(session?.user?.id || null);
      if (!session?.user) { setIsAdmin(false); setData(emptyData); setLoading(false); }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault(); setSubmitting(true); setError('');
    const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (result.error) setError(result.error.message);
    else if (result.data.user) {
      setSessionEmail(result.data.user.email || null);
      setSessionUserId(result.data.user.id);
      try { await loadDashboard(result.data.user.id); } catch (err) { setError(err instanceof Error ? err.message : 'تعذر تحميل لوحة الإدارة.'); }
    }
    setSubmitting(false);
  };
  const signOut = async () => { await supabase.auth.signOut(); setSessionEmail(null); setIsAdmin(false); };
  const refreshDashboard = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) { try { await loadDashboard(userData.user.id); } catch (err) { setError(err instanceof Error ? err.message : 'تعذر تحديث لوحة الإدارة.'); setLoading(false); } }
  };

  const openReviewListing = async (listing: DashboardListing) => {
    setReviewListing(listing);
    if (!listing.seller_id) return;
    const { data: seller } = await supabase.from('profiles').select('name,email,phone').eq('id', listing.seller_id).maybeSingle();
    if (seller) setReviewListing({ ...listing, seller });
  };

  const openListingById = async (listingId: string) => {
    const { data: row, error: fetchError } = await supabase
      .from('listings')
      .select('id,title,status,created_at,level,deal_type,photos,description,condition,price,seller_id')
      .eq('id', listingId)
      .maybeSingle();
    if (fetchError || !row) { setError('تعذر العثور على هذا الإعلان (قد يكون محذوفاً).'); return; }
    await openReviewListing(row as DashboardListing);
  };

  const moderateListing = async (listingId: string, status: 'active' | 'flagged') => {
    setError('');
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const note = status === 'flagged'
      ? window.prompt('اكتب سبب حجب الإعلان ليظهر للناشر:', 'يرجى تعديل الصور أو المعلومات.')
      : 'تمت الموافقة بعد المراجعة.';
    if (status === 'flagged' && note === null) return;
    const listingOwner = reviewListing?.seller_id || listings.find((item) => item.id === listingId)?.seller_id;
    const { error: updateError } = await supabase.from('listings')
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: userData.user.id, moderation_note: note || 'يرجى مراجعة الإعلان.' })
      .eq('id', listingId);
    if (updateError) { setError(updateError.message); return; }
    if (listingOwner) {
      try {
        await createNotification({
          recipient_id: listingOwner,
          actor_id: userData.user.id,
          listing_id: listingId,
          type: 'listing_status',
          title: status === 'active' ? 'تم قبول إعلانك' : 'تم حجب إعلانك',
          message: status === 'active'
            ? 'تمت مراجعة كتابك والموافقة عليه، وأصبح ظاهرًا في السوق.'
            : `تم حجب إعلانك. السبب: ${note || 'يرجى مراجعة معلومات الكتاب.'}`,
        });
      } catch (notificationError) {
        console.warn('Moderation notification failed', notificationError);
      }
    }
    setReviewListing(null);
    await loadDashboard(userData.user.id);
    if (listingsLoaded) await loadListings();
  };

  const deleteListing = async (listing: DashboardListing) => {
    if (!window.confirm(`حذف إعلان «${listing.title}» نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    setListingBusyId(listing.id); setError('');
    const marker = `/storage/v1/object/public/book-images/`;
    const paths = (listing.photos || []).flatMap((photo) => {
      const index = photo.indexOf(marker);
      return index >= 0 ? [decodeURIComponent(photo.slice(index + marker.length))] : [];
    });
    if (paths.length) {
      const { error: storageError } = await supabase.storage.from('book-images').remove(paths);
      if (storageError) console.warn('Listing image cleanup skipped', storageError);
    }
    const { error: deleteError } = await supabase.from('listings').delete().eq('id', listing.id);
    if (deleteError) { setError('تعذر حذف الإعلان: ' + deleteError.message); setListingBusyId(null); return; }
    setListings((prev) => prev.filter((item) => item.id !== listing.id));
    setReviewListing(null);
    setListingBusyId(null);
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) await loadDashboard(userData.user.id);
  };

  const openUserEditor = (user: AdminUserRow) => {
    setEditingUser(user);
    setUserForm({ name: user.name || '', phone: user.phone || '', whatsapp: user.whatsapp || '', municipality: user.municipality || '', bio: user.bio || '' });
    setError('');
  };

  const saveUserEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingUser || !userForm.name.trim()) { setError('يرجى كتابة اسم المستخدم.'); return; }
    setUserSaveBusy(true); setError('');
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) { setUserSaveBusy(false); return; }
    const { error: updateError } = await supabase.from('profiles').update({
      name: userForm.name.trim(), phone: userForm.phone.trim(), whatsapp: userForm.whatsapp.trim() || null,
      municipality: userForm.municipality.trim(), bio: userForm.bio.trim() || null,
    }).eq('id', editingUser.id);
    if (updateError) setError('تعذر حفظ بيانات المستخدم: ' + updateError.message);
    else {
      setUsers((prev) => prev.map((user) => user.id === editingUser.id ? { ...user, ...userForm, name: userForm.name.trim(), phone: userForm.phone.trim(), whatsapp: userForm.whatsapp.trim() || null, municipality: userForm.municipality.trim(), bio: userForm.bio.trim() || null } : user));
      setEditingUser(null);
    }
    setUserSaveBusy(false);
  };

  const loadListings = async () => {
    setListingsLoading(true);
    const { data: rows, error: fetchError } = await supabase
      .from('listings')
      .select('id,title,author,level,condition,deal_type,price,status,created_at,photos,description,seller_id,wilaya_name_ar')
      .order('created_at', { ascending: false })
      .limit(150);
    if (fetchError) setError(fetchError.message);
    const listingRows = (rows || []) as unknown as DashboardListing[];
    const sellerIds = [...new Set(listingRows.map((row) => row.seller_id).filter(Boolean))] as string[];
    const { data: sellerRows } = sellerIds.length ? await supabase.from('profiles').select('id,name,email,phone').in('id', sellerIds) : { data: [] };
    const sellerById = new Map((sellerRows || []).map((seller) => [String(seller.id), seller]));
    setListings(listingRows.map((listing) => ({ ...listing, seller: sellerById.get(String(listing.seller_id)) || undefined })));
    setListingsLoading(false); setListingsLoaded(true);
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    const { data: rows, error: fetchError } = await supabase
      .from('profiles')
      .select('id,name,email,phone,wilaya_code,municipality,whatsapp,bio,avatar,role,is_verified,rating,created_at')
      .order('created_at', { ascending: false })
      .limit(300);
    if (fetchError) setError(fetchError.message);
    setUsers((rows || []) as AdminUserRow[]);
    setUsersLoading(false); setUsersLoaded(true);
  };

  const toggleAdminRole = async (user: AdminUserRow) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    const confirmMsg = nextRole === 'admin'
      ? `منح "${user.name || user.email}" صلاحيات المسؤول؟`
      : `سحب صلاحيات المسؤول من "${user.name || user.email}"؟`;
    if (!window.confirm(confirmMsg)) return;
    setRoleBusyId(user.id); setError('');
    const { error: updateError } = await supabase.from('profiles').update({ role: nextRole }).eq('id', user.id);
    setRoleBusyId(null);
    if (updateError) { setError('تعذر تغيير الصلاحية: ' + updateError.message); return; }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)));
  };

  const loadReports = async () => {
    setReportsLoading(true);
    const { data: rows, error: fetchError } = await supabase
      .from('reports')
      .select('id,reason,details,status,created_at,listing_id,reporter_id')
      .order('created_at', { ascending: false })
      .limit(150);
    if (fetchError) {
      setError(fetchError.message);
      setReportsLoading(false); setReportsLoaded(true);
      return;
    }
    const reportRows = (rows || []) as Array<AdminReportRow>;
    const listingIds = [...new Set(reportRows.map((row) => row.listing_id).filter(Boolean))];
    const reporterIds = [...new Set(reportRows.map((row) => row.reporter_id).filter(Boolean))];
    const [{ data: listingRows }, { data: reporterRows }] = await Promise.all([
      listingIds.length ? supabase.from('listings').select('id,title').in('id', listingIds) : Promise.resolve({ data: [] }),
      reporterIds.length ? supabase.from('profiles').select('id,name,email').in('id', reporterIds) : Promise.resolve({ data: [] }),
    ]);
    const titles = new Map((listingRows || []).map((row) => [String(row.id), { title: row.title }]));
    const reporters = new Map((reporterRows || []).map((row) => [String(row.id), { name: row.name, email: row.email }]));
    setReports(reportRows.map((row) => ({ ...row, listing: titles.get(row.listing_id) || null, reporter: reporters.get(row.reporter_id) || null })));
    setReportsLoading(false); setReportsLoaded(true);
  };

  const resolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    setError('');
    const { error: updateError } = await supabase.from('reports').update({ status }).eq('id', reportId);
    if (updateError) { setError(updateError.message); return; }
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
    await refreshDashboard();
  };

  const loadChats = async () => {
    setChatsLoading(true);
    const { data: rows, error: fetchError } = await supabase
      .from('chats')
      .select('id,listing_id,last_message,last_message_time,participant_ids')
      .order('last_message_time', { ascending: false })
      .limit(60);
    if (fetchError) {
      setError(fetchError.message);
      setChatsLoading(false); setChatsLoaded(true);
      return;
    }
    const chatRows = (rows || []) as Array<AdminChatRow>;
    const listingIds = [...new Set(chatRows.map((row) => row.listing_id).filter(Boolean))] as string[];
    const { data: listingRows } = listingIds.length ? await supabase.from('listings').select('id,title').in('id', listingIds) : { data: [] };
    const titles = new Map((listingRows || []).map((row) => [String(row.id), { title: row.title }]));
    setChats(chatRows.map((row) => ({ ...row, listing: row.listing_id ? titles.get(row.listing_id) || null : null })));
    setChatsLoading(false); setChatsLoaded(true);
  };

  useEffect(() => {
    if (!isAdmin) return;
    if (activeSection === 'listings' && !listingsLoaded) void loadListings();
    if (activeSection === 'users' && !usersLoaded) void loadUsers();
    if (activeSection === 'reports' && !reportsLoaded) void loadReports();
    if (activeSection === 'messages' && !chatsLoaded) void loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, isAdmin]);

  const maxActivity = useMemo(() => Math.max(data.users, data.listings, data.messages, data.exchanges, 1), [data]);

  const filteredListings = useMemo(() => {
    const q = listingSearch.trim().toLowerCase();
    return listings.filter((l) => {
      const matchesQuery = !q || l.title?.toLowerCase().includes(q) || l.seller?.name?.toLowerCase().includes(q) || l.seller?.email?.toLowerCase().includes(q);
      const matchesStatus = listingStatusFilter === 'all' || l.status === listingStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [listings, listingSearch, listingStatusFilter]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [users, userSearch]);

  const filteredReports = useMemo(() => {
    if (reportStatusFilter === 'all') return reports;
    return reports.filter((r) => r.status === reportStatusFilter);
  }, [reports, reportStatusFilter]);

  const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'listings', label: 'الإعلانات', icon: BookOpen },
    { id: 'users', label: 'المستخدمون', icon: Users },
    { id: 'messages', label: 'المحادثات', icon: MessageSquare },
    { id: 'reports', label: 'البلاغات', icon: AlertTriangle },
  ];

  if (!sessionEmail || !isAdmin) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#071426] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-[2rem] bg-white text-slate-900 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-[#0B192C] via-[#123456] to-brand-900 p-7 text-white">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-brand-400/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-brand-300" />
              </div>
              <span className="text-[10px] tracking-[0.2em] text-brand-200 font-black">KITABI CONTROL</span>
            </div>
            <h1 className="text-2xl font-black mt-6 font-serif">مركز إدارة كتابي</h1>
            <p className="text-slate-300 text-sm mt-1">لوحة مستقلة وآمنة تعمل عبر Supabase فقط</p>
          </div>
          <form onSubmit={signIn} className="p-6 space-y-4">
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-3 text-xs leading-5 flex gap-2">
                <XCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            <label className="block text-xs font-bold">
              البريد الإلكتروني
              <input required type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-brand-500" />
            </label>
            <label className="block text-xs font-bold">
              كلمة المرور
              <input required type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-brand-500" />
            </label>
            <button disabled={submitting} className="w-full rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black p-3 flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              دخول إلى لوحة الإدارة
            </button>
            <p className="text-[11px] text-slate-400 text-center">الوصول مخصص للمسؤولين المعتمدين فقط.</p>
          </form>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'المستخدمون', value: data.users, icon: Users, tone: 'blue', note: 'حسابات مسجلة' },
    { label: 'كل الإعلانات', value: data.listings, icon: BookOpen, tone: 'brand', note: `${data.activeListings} متاحة · ${data.pendingListings} قيد المراجعة` },
    { label: 'التفاعلات', value: data.messages + data.favorites, icon: Activity, tone: 'violet', note: `${data.messages} رسالة · ${data.favorites} حفظ` },
    { label: 'تحتاج مراجعة', value: data.pendingReports, icon: AlertTriangle, tone: 'amber', note: 'بلاغات معلقة' },
  ];
  const listingStatusCards = [
    { label: 'متاحة الآن', value: data.activeListings, icon: CheckCircle2, tone: 'brand', bar: 'bg-brand-500' },
    { label: 'مباعة', value: data.soldListings, icon: Check, tone: 'indigo', bar: 'bg-indigo-500' },
    { label: 'غير متوفرة', value: data.unavailableListings, icon: ShieldOff, tone: 'orange', bar: 'bg-orange-500' },
    { label: 'قيد المراجعة', value: data.pendingListings, icon: Clock3, tone: 'amber', bar: 'bg-amber-500' },
    { label: 'محجوزة', value: data.reservedListings, icon: Clock3, tone: 'blue', bar: 'bg-blue-500' },
    { label: 'مكتملة', value: data.completedListings, icon: CheckCircle2, tone: 'slate', bar: 'bg-slate-500' },
  ];
  const statusToneClasses: Record<string, string> = { brand: 'bg-brand-50 text-brand-600', indigo: 'bg-indigo-50 text-indigo-600', orange: 'bg-orange-50 text-orange-600', amber: 'bg-amber-50 text-amber-600', blue: 'bg-blue-50 text-blue-600', slate: 'bg-slate-100 text-slate-600' };
  const toneClasses: Record<string, string> = { blue: 'bg-blue-50 text-blue-600', brand: 'bg-brand-50 text-brand-600', violet: 'bg-violet-50 text-violet-600', amber: 'bg-amber-50 text-amber-600' };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f7fb] text-slate-900">

      {/* Listing review modal — shared across Overview / Listings / Reports */}
      {reviewListing && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-brand-600 font-bold">مراجعة الإعلان</div>
                <h2 className="text-xl font-black mt-1 font-serif">{reviewListing.title}</h2>
              </div>
              <button onClick={() => setReviewListing(null)} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 shrink-0"><X className="w-5 h-5 mx-auto" /></button>
            </div>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {(reviewListing.photos || []).map((photo, index) => (
                <div key={`${photo}-${index}`} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={photo} alt={`صورة ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-xs font-black text-slate-500 mb-3">معلومات الناشر</div>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div><span className="text-slate-400 block text-xs">الاسم</span><strong>{reviewListing.seller?.name || 'غير متوفر'}</strong></div>
                <div><span className="text-slate-400 block text-xs">البريد</span><strong dir="ltr" className="text-xs">{reviewListing.seller?.email || 'غير متوفر'}</strong></div>
                <div><span className="text-slate-400 block text-xs">الهاتف</span><strong dir="ltr" className="text-xs">{reviewListing.seller?.phone || 'غير متوفر'}</strong></div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 p-4 text-sm leading-7">
              <div><strong>الحالة:</strong> {CONDITION_LABELS[reviewListing.condition || ''] || reviewListing.condition || 'غير محددة'} · <strong>السعر:</strong> {reviewListing.price || 0} دج</div>
              <div className="mt-2 text-slate-600">{reviewListing.description || 'لا يوجد وصف.'}</div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {reviewListing.status !== 'active' && <button onClick={() => void moderateListing(reviewListing.id, 'active')} className="flex-1 min-w-[150px] rounded-xl bg-brand-600 text-white p-3 font-black">اعتماد ونشر</button>}
              {reviewListing.status !== 'flagged' && <button onClick={() => void moderateListing(reviewListing.id, 'flagged')} className="flex-1 min-w-[150px] rounded-xl bg-amber-600 text-white p-3 font-black">حجب الإعلان</button>}
              <button onClick={() => void deleteListing(reviewListing)} disabled={listingBusyId === reviewListing.id} className="flex-1 min-w-[150px] rounded-xl bg-slate-800 text-white p-3 font-black disabled:opacity-50">حذف نهائي</button>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center">
          <form onSubmit={saveUserEdit} className="w-full max-w-lg rounded-3xl bg-white shadow-2xl p-5 sm:p-7" dir="rtl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-brand-600 font-bold">إدارة الحساب</div>
                <h2 className="text-xl font-black mt-1 font-serif">تعديل بيانات المستخدم</h2>
                <p className="text-xs text-slate-400 mt-1" dir="ltr">{editingUser.email}</p>
              </div>
              <button type="button" onClick={() => setEditingUser(null)} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600"><X className="w-5 h-5 mx-auto" /></button>
            </div>
            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              <label className="text-xs font-bold text-slate-700">الاسم<input required value={userForm.name} onChange={(e) => setUserForm((form) => ({ ...form, name: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-brand-500" /></label>
              <label className="text-xs font-bold text-slate-700">الهاتف<input value={userForm.phone} onChange={(e) => setUserForm((form) => ({ ...form, phone: e.target.value }))} dir="ltr" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-brand-500" /></label>
              <label className="text-xs font-bold text-slate-700">واتساب<input value={userForm.whatsapp} onChange={(e) => setUserForm((form) => ({ ...form, whatsapp: e.target.value }))} dir="ltr" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-brand-500" /></label>
              <label className="text-xs font-bold text-slate-700">البلدية<input value={userForm.municipality} onChange={(e) => setUserForm((form) => ({ ...form, municipality: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-brand-500" /></label>
              <label className="text-xs font-bold text-slate-700 sm:col-span-2">نبذة مختصرة<textarea rows={3} value={userForm.bio} onChange={(e) => setUserForm((form) => ({ ...form, bio: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-brand-500 resize-none" /></label>
            </div>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setEditingUser(null)} className="flex-1 rounded-xl bg-slate-100 text-slate-700 p-3 font-bold">إلغاء</button>
              <button type="submit" disabled={userSaveBusy} className="flex-1 rounded-xl bg-brand-600 text-white p-3 font-black disabled:opacity-50">{userSaveBusy ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 right-0 hidden w-72 bg-[#08182d] text-white lg:flex flex-col p-5 z-20">
        <div className="flex items-center gap-3 pb-6 border-b border-white/10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-950/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="font-black text-lg font-serif">كِتابي</div>
            <div className="text-[10px] text-brand-300 tracking-widest">CONTROL CENTER</div>
          </div>
        </div>
        <div className="mt-8 text-[10px] font-black tracking-widest text-slate-500">إدارة المنصة</div>
        <nav className="mt-3 space-y-1.5">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === id ? 'bg-brand-500/15 text-brand-300 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id === 'reports' && data.pendingReports > 0 && (
                <span className="mr-auto bg-amber-400 text-slate-950 text-[10px] min-w-5 h-5 rounded-full flex items-center justify-center px-1">{data.pendingReports}</span>
              )}
              {id === 'listings' && data.pendingListings > 0 && (
                <span className="mr-auto bg-brand-400 text-slate-950 text-[10px] min-w-5 h-5 rounded-full flex items-center justify-center px-1">{data.pendingListings}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-gradient-to-br from-brand-500/15 to-blue-500/10 border border-white/10 p-4">
          <div className="flex items-center gap-2 text-brand-300 text-xs font-black"><ShieldCheck className="w-4 h-4" />حالة النظام</div>
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-300"><span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />متصل بـ Supabase فقط</div>
        </div>
      </aside>

      <main className="lg:mr-72 min-h-screen">
        <header className="sticky top-0 z-10 bg-[#f5f7fb]/90 backdrop-blur-xl border-b border-slate-200/70">
          <div className="px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] text-slate-400 font-bold mb-1">Supabase / Kitabi / Control</div>
              <h1 className="text-xl sm:text-2xl font-black font-serif">{navItems.find((n) => n.id === activeSection)?.label}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-400">
                <Search className="w-4 h-4" />بحث سريع
              </div>
              <button onClick={refreshDashboard} className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:border-brand-400 transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={signOut} className="h-10 rounded-xl bg-[#08182d] text-white px-3 sm:px-4 flex items-center gap-2 text-xs font-black">
                <LogOut className="w-4 h-4" /><span className="hidden sm:inline">خروج</span>
              </button>
            </div>
          </div>
          <div className="lg:hidden px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
            {navItems.map(({ id, label }) => (
              <button key={id} onClick={() => setActiveSection(id)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold ${activeSection === id ? 'bg-[#08182d] text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className="p-4 sm:p-8 max-w-[1500px] mx-auto">
          {error && (
            <div className="mb-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 p-4 text-sm flex items-center gap-2">
              <XCircle className="w-5 h-5 shrink-0" />{error}
            </div>
          )}

          {activeSection === 'overview' && (
            <>
              <section className="rounded-[2rem] bg-gradient-to-br from-[#0a203b] via-[#12395b] to-[#0d3a5c] p-5 sm:p-8 text-white relative overflow-hidden">
                <div className="absolute -left-10 -top-16 w-56 h-56 rounded-full bg-brand-300/10 blur-2xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-[11px] font-bold text-brand-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-300 animate-pulse" />المراقبة المباشرة
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black mt-4 font-serif">مرحبًا بك في مركز التحكم</h2>
                    <p className="text-slate-300 text-sm mt-2">إليك صورة حية عن نشاط منصة كتابي اليوم.</p>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-slate-300">المسؤول المتصل</div>
                    <div className="font-bold text-sm mt-1 truncate max-w-[240px]" dir="ltr">{sessionEmail}</div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5 mt-6">
                {statCards.map(({ label, value, icon: Icon, tone, note }) => (
                  <div key={label} className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toneClasses[tone]}`}><Icon className="w-5 h-5" /></div>
                      <ArrowUpLeft className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black mt-5">{loading ? '—' : value}</div>
                    <div className="text-xs font-bold text-slate-500 mt-1">{label}</div>
                    <div className="text-[10px] text-slate-400 mt-2">{note}</div>
                  </div>
                ))}
              </section>

              <section className="mt-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div><h3 className="font-black">حالة الكتب بالتفصيل</h3><p className="text-xs text-slate-400 mt-1">توزيع الإعلانات حسب حالتها الحالية</p></div>
                  <BarChart3 className="w-5 h-5 text-brand-600" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {listingStatusCards.map(({ label, value, icon: Icon, tone, bar }) => {
                    const percentage = data.listings > 0 ? Math.round((value / data.listings) * 100) : 0;
                    return <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                      <div className="flex items-center justify-between gap-2"><span className={`w-9 h-9 rounded-xl flex items-center justify-center ${statusToneClasses[tone]}`}><Icon className="w-4 h-4" /></span><span className="text-[11px] font-black text-slate-400">{percentage}%</span></div>
                      <div className="text-2xl font-black mt-3">{loading ? '—' : value}</div>
                      <div className="text-xs font-bold text-slate-600 mt-1">{label}</div>
                      <div className="h-1.5 bg-white rounded-full mt-3 overflow-hidden"><div className={`h-full rounded-full ${bar}`} style={{ width: `${percentage}%` }} /></div>
                    </div>;
                  })}
                </div>
              </section>

              <div className="grid xl:grid-cols-12 gap-5 mt-6">
                <section className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div><h3 className="font-black">آخر الإعلانات</h3><p className="text-xs text-slate-400 mt-1">النشاط الأحدث في السوق</p></div>
                    <button onClick={() => setActiveSection('listings')} className="text-xs text-brand-700 font-bold flex items-center gap-1">عرض الكل<ChevronLeft className="w-3.5 h-3.5" /></button>
                  </div>
                  {data.recentListings.length === 0 ? (
                    <div className="p-12 text-center text-sm text-slate-400">لا توجد إعلانات بعد</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {data.recentListings.map((listing) => (
                        <div key={listing.id} className="p-4 flex items-center gap-3">
                          <button onClick={() => void openReviewListing(listing)} className="w-14 h-14 rounded-xl overflow-hidden bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-slate-200">
                            {listing.photos?.[0] ? <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-5 h-5" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <button onClick={() => void openReviewListing(listing)} className="font-bold text-sm truncate block text-right hover:text-brand-700">{listing.title}</button>
                            <div className="text-[11px] text-slate-400 mt-1">{LEVEL_LABELS[listing.level || ''] || listing.level || 'كتاب'} · {CONDITION_LABELS[listing.condition || ''] || 'حالة غير محددة'} · {dateLabel(listing.created_at)}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={listing.status} map={STATUS_LABELS} />
                            {listing.status === 'pending' && (
                              <>
                                <button onClick={() => void moderateListing(listing.id, 'active')} title="اعتماد الإعلان" className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center hover:bg-brand-200"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => void moderateListing(listing.id, 'flagged')} title="رفض الإعلان" className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center hover:bg-rose-200"><XCircle className="w-3.5 h-3.5" /></button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                  <div className="flex items-center justify-between">
                    <div><h3 className="font-black">صحة المنصة</h3><p className="text-xs text-slate-400 mt-1">مؤشرات النشاط الحالية</p></div>
                    <BarChart3 className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="mt-6 space-y-5">
                    {([
                      ['المستخدمون', data.users, Users, 'bg-blue-500'],
                      ['الإعلانات', data.listings, BookOpen, 'bg-brand-500'],
                      ['الرسائل', data.messages, MessageSquare, 'bg-violet-500'],
                      ['طلبات التبادل', data.exchanges, RefreshCw, 'bg-amber-500'],
                    ] as [string, number, typeof Users, string][]).map(([label, value, Icon, color]) => (
                      <div key={label}>
                        <div className="flex items-center justify-between text-xs font-bold mb-2">
                          <span className="flex items-center gap-2 text-slate-600"><Icon className="w-4 h-4 text-slate-400" />{label}</span>
                          <span>{value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(4, (value / maxActivity) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-7 pt-5 border-t border-slate-100 flex items-center gap-2 text-xs text-brand-700 font-bold">
                    <CheckCircle2 className="w-4 h-4" />المصادقة وقاعدة البيانات متصلتان
                  </div>
                </section>
              </div>

              <div className="grid xl:grid-cols-12 gap-5 mt-5">
                <section className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                  <div className="flex items-center justify-between">
                    <div><h3 className="font-black">المستخدمون الجدد</h3><p className="text-xs text-slate-400 mt-1">آخر الحسابات المسجلة</p></div>
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="mt-4 space-y-2">
                    {data.recentUsers.length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-400">لا يوجد مستخدمون بعد</div>
                    ) : data.recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-blue-500 text-white flex items-center justify-center font-black text-xs">{(user.name || user.email || 'م').slice(0, 1)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold truncate">{user.name || 'مستخدم كتابي'}</div>
                          <div className="text-[11px] text-slate-400 truncate" dir="ltr">{user.email}</div>
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] text-slate-500 block">{dateLabel(user.created_at)}</span>
                          {isToday(user.created_at) && <span className="text-[10px] text-brand-600 font-bold">جديد اليوم</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="xl:col-span-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-5">
                  <div className="flex items-start justify-between">
                    <div><h3 className="font-black text-amber-950">مركز المراجعة</h3><p className="text-xs text-amber-800/70 mt-1">عناصر تحتاج إلى انتباهك</p></div>
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-700 flex items-center justify-center"><Bell className="w-5 h-5" /></div>
                  </div>
                  <div className="mt-6 space-y-3">
                    <button onClick={() => setActiveSection('reports')} className="w-full flex items-center gap-3 bg-white/70 hover:bg-white rounded-xl p-3 text-right transition-colors">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /><span className="flex-1 text-xs font-bold text-amber-950">بلاغات بانتظار المراجعة</span><strong className="text-lg text-amber-700">{data.pendingReports}</strong>
                    </button>
                    <div className="flex items-center gap-3 bg-white/50 rounded-xl p-3">
                      <Star className="w-4 h-4 text-amber-500" /><span className="flex-1 text-xs font-bold text-amber-950">التقييمات المسجلة</span><strong className="text-lg text-amber-700">{data.ratings}</strong>
                    </div>
                    <div className="flex items-center gap-3 bg-white/50 rounded-xl p-3">
                      <Clock3 className="w-4 h-4 text-amber-600" /><span className="flex-1 text-xs font-bold text-amber-950">الحالة</span><strong className="text-xs text-brand-700">مباشر</strong>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}

          {activeSection === 'listings' && (
            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={listingSearch} onChange={(e) => setListingSearch(e.target.value)} placeholder="ابحث بعنوان الكتاب أو اسم البائع..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {(['all', 'pending', 'active', 'flagged', 'reserved', 'completed'] as const).map((s) => (
                    <button key={s} onClick={() => setListingStatusFilter(s)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold border ${listingStatusFilter === s ? 'bg-[#08182d] text-white border-[#08182d]' : 'bg-white border-slate-200 text-slate-500'}`}>
                      {s === 'all' ? 'الكل' : STATUS_LABELS[s]?.label || s}
                    </button>
                  ))}
                </div>
              </div>
              {listingsLoading ? (
                <div className="p-12 text-center text-sm text-slate-400 flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />جاري التحميل...</div>
              ) : filteredListings.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-400">لا توجد إعلانات مطابقة</div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="divide-y divide-slate-100 min-w-[640px]">
                    {filteredListings.map((listing) => (
                      <div key={listing.id} className="p-4 flex items-center gap-3">
                        <button onClick={() => void openReviewListing(listing)} className="w-14 h-14 rounded-xl overflow-hidden bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-slate-200">
                          {listing.photos?.[0] ? <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-5 h-5" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <button onClick={() => void openReviewListing(listing)} className="font-bold text-sm truncate block text-right hover:text-brand-700">{listing.title}</button>
                          <div className="text-[11px] text-slate-400 mt-1">{LEVEL_LABELS[listing.level || ''] || listing.level} · {CONDITION_LABELS[listing.condition || ''] || listing.condition} · {listing.wilaya_name_ar}</div>
                          <div className="text-[11px] text-slate-500 mt-1">الناشر: {listing.seller?.name || listing.seller?.email || 'غير معروف'} · {dateLabel(listing.created_at)}</div>
                        </div>
                        <div className="text-sm font-black text-slate-700 shrink-0 hidden sm:block">{listing.deal_type === 'free' ? 'مجاني' : listing.deal_type === 'exchange' ? 'تبادل' : `${listing.price} دج`}</div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={listing.status} map={STATUS_LABELS} />
                          {listing.status === 'pending' && (
                            <>
                              <button onClick={() => void moderateListing(listing.id, 'active')} title="اعتماد الإعلان" className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center hover:bg-brand-200"><Check className="w-3.5 h-3.5" /></button>
                              <button onClick={() => void moderateListing(listing.id, 'flagged')} title="حجب الإعلان" className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center hover:bg-rose-200"><Ban className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                          {listing.status === 'flagged' ? (
                            <button onClick={() => void moderateListing(listing.id, 'active')} title="إعادة نشر الإعلان" className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center hover:bg-brand-200"><Check className="w-3.5 h-3.5" /></button>
                          ) : listing.status !== 'pending' && (
                            <button onClick={() => void moderateListing(listing.id, 'flagged')} title="حجب الإعلان" className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center hover:bg-amber-200"><Ban className="w-3.5 h-3.5" /></button>
                          )}
                          <button onClick={() => void deleteListing(listing)} disabled={listingBusyId === listing.id} title="حذف الإعلان نهائيًا" className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {activeSection === 'users' && (
            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100">
                <div className="relative max-w-md">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="ابحث بالاسم أو البريد الإلكتروني..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                </div>
              </div>
              {usersLoading ? (
                <div className="p-12 text-center text-sm text-slate-400 flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />جاري التحميل...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-400">لا يوجد مستخدمون مطابقون</div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="divide-y divide-slate-100 min-w-[640px]">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-blue-500 text-white flex items-center justify-center font-black text-sm shrink-0">{(user.name || user.email || 'م').slice(0, 1)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold truncate flex items-center gap-1.5">
                            {user.name || 'مستخدم كتابي'}
                            {user.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate" dir="ltr">{user.email}</div>
                        </div>
                        <div className="text-[11px] text-slate-500 hidden sm:block shrink-0">{dateLabel(user.created_at)}</div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] rounded-full px-2.5 py-1 font-bold border ${user.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {user.role === 'admin' ? 'مسؤول' : 'مستخدم'}
                          </span>
                          <button onClick={() => openUserEditor(user)} title="تعديل بيانات المستخدم" className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center hover:bg-blue-100"><Pencil className="w-3.5 h-3.5" /></button>
                          <button
                            onClick={() => void toggleAdminRole(user)}
                            disabled={roleBusyId === user.id || user.id === sessionUserId}
                            title={user.id === sessionUserId ? 'لا يمكنك تعديل صلاحيتك الخاصة' : user.role === 'admin' ? 'سحب صلاحية المسؤول' : 'منح صلاحية مسؤول'}
                            className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 disabled:opacity-40"
                          >
                            {roleBusyId === user.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : user.role === 'admin' ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {activeSection === 'messages' && (
            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100">
                <h3 className="font-black">أحدث المحادثات</h3>
                <p className="text-xs text-slate-400 mt-1">نظرة عامة على النشاط بين المستخدمين — بدون عرض تفاصيل خاصة</p>
              </div>
              {chatsLoading ? (
                <div className="p-12 text-center text-sm text-slate-400 flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />جاري التحميل...</div>
              ) : chats.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-400">لا توجد محادثات بعد</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {chats.map((chat) => (
                    <div key={chat.id} className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0"><MessageSquare className="w-5 h-5" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold truncate">{chat.listing?.title || 'محادثة عامة'}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{chat.last_message || 'لا توجد رسائل بعد'}</div>
                      </div>
                      <div className="text-[11px] text-slate-500 shrink-0">{dateTimeLabel(chat.last_message_time)}</div>
                      {chat.listing_id && (
                        <button onClick={() => void openListingById(chat.listing_id!)} className="text-[11px] text-brand-700 font-bold shrink-0 hover:underline">عرض الإعلان</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeSection === 'reports' && (
            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(['pending', 'resolved', 'dismissed', 'all'] as const).map((s) => (
                  <button key={s} onClick={() => setReportStatusFilter(s)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold border ${reportStatusFilter === s ? 'bg-[#08182d] text-white border-[#08182d]' : 'bg-white border-slate-200 text-slate-500'}`}>
                    {s === 'all' ? 'الكل' : REPORT_STATUS_LABELS[s]?.label}
                  </button>
                ))}
              </div>
              {reportsLoading ? (
                <div className="p-12 text-center text-sm text-slate-400 flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />جاري التحميل...</div>
              ) : filteredReports.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-400">لا توجد بلاغات هنا</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredReports.map((report) => (
                    <div key={report.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold">{REPORT_REASON_LABELS[report.reason] || report.reason}</span>
                          <StatusBadge status={report.status} map={REPORT_STATUS_LABELS} />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">الإعلان: {report.listing?.title || 'إعلان محذوف'} · المُبلِّغ: {report.reporter?.name || report.reporter?.email || 'غير معروف'} · {dateLabel(report.created_at)}</div>
                        {report.details && <div className="text-xs text-slate-600 mt-1.5">{report.details}</div>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => void openListingById(report.listing_id)} className="text-[11px] text-brand-700 font-bold hover:underline px-2">عرض الإعلان</button>
                        {report.status === 'pending' && (
                          <>
                            <button onClick={() => void resolveReport(report.id, 'resolved')} className="text-[11px] font-bold rounded-lg bg-brand-100 text-brand-700 px-3 py-1.5 hover:bg-brand-200">تمت المعالجة</button>
                            <button onClick={() => void resolveReport(report.id, 'dismissed')} className="text-[11px] font-bold rounded-lg bg-slate-100 text-slate-600 px-3 py-1.5 hover:bg-slate-200">تجاهل</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

        </div>
      </main>
    </div>
  );
};
