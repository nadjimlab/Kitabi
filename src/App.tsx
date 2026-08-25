import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  PlusCircle, 
  RefreshCw, 
  SlidersHorizontal, 
  Sparkles, 
  MapPin, 
  ShieldCheck, 
  Heart, 
  TrendingUp, 
  Gift, 
  Layers, 
  ArrowLeft, 
  ArrowRight,
  Filter,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { 
  BookListing, 
  User, 
  FilterState, 
  EducationLevel, 
  ExchangeRequest 
} from './types';
import { StorageService } from './services/storageService';
import { supabase } from './services/supabaseClient';
import { createNotification } from './services/notificationsService';
import { EmailAuthModal } from './components/EmailAuthModal';
import { LegalPage } from './components/LegalPage';
import { EDUCATION_LEVELS, WILAYAS } from './data/algerianData';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HeroSearch } from './components/HeroSearch';
import { BookCard } from './components/BookCard';
import { BookDetailsModal } from './components/BookDetailsModal';
import { CreateListingModal } from './components/CreateListingModal';
import { ExchangeMatcher } from './components/ExchangeMatcher';
import { ExchangeTradeModal } from './components/ExchangeTradeModal';
import { ChatMessengerModal } from './components/ChatMessengerModal';
import { ReportModal } from './components/ReportModal';
import { UserProfileView } from './components/UserProfileView';
import { AdminDashboard } from './components/AdminDashboard';
import { SupabaseAdminPortal } from './components/SupabaseAdminPortal';
import { FilterDrawer } from './components/FilterDrawer';
import { RecentSearchesBar } from './components/RecentSearchesBar';
import { RecentSearchItem } from './types';

const getDefaultAvatar = (name: string, email = '') => `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || email || 'Kitabi')}&backgroundColor=0b192c&fontFamily=Arial`;

const initialFilters: FilterState = {
  searchQuery: '',
  level: 'all',
  gradeCode: '',
  stream: '',
  subject: '',
  wilayaCode: 0,
  municipality: '',
  dealType: 'all',
  condition: 'all',
  minPrice: 0,
  maxPrice: 3000,
  onlyFree: false,
  onlyExchange: false,
  deliveryOnly: false,
  sortBy: 'latest'
};

export default function App() {
  // Navigation & Language
  const [currentView, setCurrentView] = useState<'home' | 'marketplace' | 'exchange' | 'profile' | 'admin' | 'control' | 'terms' | 'privacy'>('home');
  const [lang, setLang] = useState<'ar' | 'fr'>('ar');

  // Application Data States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [listings, setListings] = useState<BookListing[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [pendingView, setPendingView] = useState<'admin' | 'profile' | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // Search Results Caching & History States
  const [displayedListings, setDisplayedListings] = useState<BookListing[]>([]);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<number | null>(null);
  const [cacheHitCount, setCacheHitCount] = useState<number>(1);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(StorageService.getRecentSearches());

  // Modals & Drawers
  const [selectedBook, setSelectedBook] = useState<BookListing | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [tradeTargetBook, setTradeTargetBook] = useState<BookListing | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [reportTargetBook, setReportTargetBook] = useState<BookListing | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // In-App Chat Modal
  const [chatTargetUser, setChatTargetUser] = useState<User | null>(null);
  const [chatTargetBook, setChatTargetBook] = useState<BookListing | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState(StorageService.getPlatformStats([]));
  const isAdmin = currentUser?.role === 'admin';

  // Language & RTL Setup
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Supabase Authentication lifecycle
  useEffect(() => {
    let mounted = true;
    const loadProfile = async (userId: string, email = '') => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error;
      if (!mounted) return;
      const profile: User = {
        id: data.id,
        name: data.name || 'مستخدم كتابي',
        email: data.email || email,
        phone: data.phone || '',
        whatsapp: data.whatsapp || undefined,
        avatar: data.avatar || getDefaultAvatar(data.name, data.email || email),
        wilayaCode: data.wilaya_code || 16,
        municipality: data.municipality || '',
        rating: Number(data.rating || 5),
        reviewsCount: data.reviews_count || 0,
        isVerified: data.is_verified ?? false,
        isBookstore: data.is_bookstore ?? false,
        bookstoreName: data.bookstore_name || undefined,
        joinedDate: data.joined_date || new Date().toISOString(),
        bio: data.bio || undefined,
        role: data.role === 'admin' ? 'admin' : 'user',
      };
      setCurrentUser(profile);
    };
    supabase.auth.getSession().then(async ({ data: sessionData }) => {
      try {
        const user = sessionData.session?.user;
        if (user) await loadProfile(user.id, user.email || '');
        else if (mounted) setCurrentUser(null);
      } catch (error) {
        console.error('Supabase profile error', error);
        if (mounted) setCurrentUser(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) await loadProfile(session.user.id, session.user.email || '');
        else if (mounted) setCurrentUser(null);
      } catch (error) {
        console.error('Supabase auth profile error', error);
        if (mounted) setCurrentUser(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  // Guard direct URL access to protected routes and resume the requested view after auth.
  useEffect(() => {
    if (authLoading) return;
    const route = window.location.pathname.replace(/^\//, '').split('/')[0];
    if (route === 'admin' || route === 'control') {
      // Both URLs now open the independent Supabase control center.
      // Do not invoke the legacy Firebase guard for the admin route.
      setCurrentView('control');
      return;
    }
    if (route === 'terms' || route === 'privacy' || route === 'marketplace' || route === 'exchange') {
      setCurrentView(route);
    }
  }, [authLoading, currentUser, isAdmin]);

  useEffect(() => {
    if (!authLoading && pendingView && currentUser) {
      if (pendingView === 'admin' && currentUser.role === 'admin') {
        setCurrentView('admin');
        window.history.replaceState({}, '', '/admin');
      } else if (pendingView === 'profile') {
        setCurrentView('profile');
        window.history.replaceState({}, '', '/profile');
      }
      setPendingView(null);
      setIsAuthOpen(false);
    }
  }, [authLoading, currentUser, pendingView]);

  // Load public listings and private user data from Firestore
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      const [remoteListings, remoteFavorites, remoteChats] = await Promise.all([
        StorageService.getListings(),
        currentUser ? StorageService.getFavorites() : Promise.resolve([]),
        currentUser ? StorageService.getChats() : Promise.resolve([]),
      ]);
      if (!cancelled) {
        setListings(remoteListings);
        setFavorites(remoteFavorites);
        setChats(remoteChats);
        setStats(StorageService.getPlatformStats(remoteListings));
      }
    };
    void loadData();
    return () => { cancelled = true; };
  }, [currentUser]);

  // Restore last marketplace filters on first mount
  useEffect(() => {
    const saved = StorageService.getLastMarketplaceFilters();
    if (saved) setFilters(saved);
  }, []);

  // Search Results Local Caching Engine
  useEffect(() => {
    const cached = StorageService.getCachedSearchResults(filters);
    if (cached) {
      setDisplayedListings(cached.results);
      setIsFromCache(true);
      setCacheTimestamp(cached.timestamp);
      setCacheHitCount(cached.hitCount);
    } else {
      const freshResults = StorageService.filterListings(listings, filters);
      setDisplayedListings(freshResults);
      setIsFromCache(false);
      const now = Date.now();
      setCacheTimestamp(now);
      setCacheHitCount(1);
      StorageService.setCachedSearchResults(filters, freshResults);
    }

    // Save recent search if non-empty query or custom level/wilaya
    if (filters.searchQuery.trim() || (filters.level && filters.level !== 'all') || (filters.wilayaCode && filters.wilayaCode !== 0)) {
      const fresh = StorageService.filterListings(listings, filters);
      const updated = StorageService.saveRecentSearch(filters.searchQuery, filters, fresh.length);
      setRecentSearches(updated);
    }

    StorageService.saveLastMarketplaceFilters(filters);
  }, [listings, filters]);

  // Force-refresh search results & update cache
  const handleForceRefreshResults = () => {
    const fresh = StorageService.filterListings(listings, filters);
    setDisplayedListings(fresh);
    setIsFromCache(false);
    const now = Date.now();
    setCacheTimestamp(now);
    setCacheHitCount(1);
    StorageService.setCachedSearchResults(filters, fresh);
  };

  // Recent Searches Actions
  const handleSelectRecentSearch = (item: RecentSearchItem) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: item.query,
      level: item.level || 'all',
      wilayaCode: item.wilayaCode || 0,
      dealType: item.dealType || 'all'
    }));
    navigate('marketplace');
  };

  const handleRemoveRecentSearch = (id: string) => {
    const updated = StorageService.removeRecentSearch(id);
    setRecentSearches(updated);
  };

  const handleClearRecentSearches = () => {
    StorageService.clearRecentSearches();
    setRecentSearches([]);
  };

  // Refresh listings & stats from Firestore
  const refreshData = async () => {
    const [nextListings, nextFavorites, nextChats] = await Promise.all([
      StorageService.getListings(),
      currentUser ? StorageService.getFavorites() : Promise.resolve([]),
      currentUser ? StorageService.getChats() : Promise.resolve([]),
    ]);
    setListings(nextListings);
    setFavorites(nextFavorites);
    setChats(nextChats);
    setStats(StorageService.getPlatformStats(nextListings));
    setRecentSearches(StorageService.getRecentSearches());
  };

  const handleUpdateAvatar = async (file: File) => {
    if (!currentUser) return;
    if (file.size > 5 * 1024 * 1024) { window.alert('حجم الصورة يجب ألا يتجاوز 5 ميغابايت.'); return; }
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `avatars/${currentUser.id}/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('book-images').upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) { window.alert(`تعذر رفع الصورة: ${uploadError.message}`); return; }
    const { data: publicData } = supabase.storage.from('book-images').getPublicUrl(path);
    const { error: profileError } = await supabase.from('profiles').update({ avatar: publicData.publicUrl, updated_at: new Date().toISOString() }).eq('id', currentUser.id);
    if (profileError) { window.alert(`تعذر تحديث الملف الشخصي: ${profileError.message}`); return; }
    setCurrentUser({ ...currentUser, avatar: publicData.publicUrl });
  };

  const handleAuthSuccess = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error('لم يتم العثور على جلسة Supabase بعد تسجيل الدخول.');
    const { data: profileData, error } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    if (error) throw error;
    setCurrentUser({
      id: profileData.id, name: profileData.name || 'مستخدم كتابي', email: profileData.email || data.user.email || '',
      phone: profileData.phone || '', avatar: profileData.avatar || getDefaultAvatar(profileData.name, profileData.email || data.user.email || ''), wilayaCode: profileData.wilaya_code || 16,
      municipality: profileData.municipality || '', rating: Number(profileData.rating || 5), reviewsCount: profileData.reviews_count || 0,
      isVerified: profileData.is_verified ?? false, isBookstore: profileData.is_bookstore ?? false,
      joinedDate: profileData.joined_date || new Date().toISOString(), role: profileData.role === 'admin' ? 'admin' : 'user',
    });
  };

  // Toggle favorite
  const handleToggleFavorite = async (listingId: string) => {
    if (!currentUser) { setIsAuthOpen(true); return; }
    const listing = listings.find((item) => item.id === listingId);
    const wasFavorite = favorites.includes(listingId);
    await StorageService.toggleFavorite(listingId);
    if (!wasFavorite && listing && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(listing.sellerId || '')) {
      try { await createNotification({ recipient_id: listing.sellerId, actor_id: currentUser.id, listing_id: listing.id, type: 'favorite', title: 'إضافة إلى المفضلة', message: `أضاف ${currentUser.name} كتابك إلى المفضلة.` }); } catch (error) { console.warn('Favorite notification failed', error); }
    }
    await refreshData();
  };

  // Filter updates
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  // Search from Hero or Navbar
  const handleHeroSearch = (query: string, level?: EducationLevel | 'all') => {
    setFilters(prev => ({
      ...prev,
      searchQuery: query,
      level: level !== undefined ? level : prev.level
    }));
    navigate('marketplace');
  };

  // Book Selection
  const handleSelectBook = async (book: BookListing) => {
    void StorageService.incrementView(book.id);
    setSelectedBook(book);
    setIsDetailsOpen(true);
  };

  // Creation callback
  const handleListingCreated = async (newListing: BookListing) => {
    await StorageService.saveListing(newListing);
    await refreshData();
    setSelectedBook(newListing);
    setIsDetailsOpen(true);
  };

  // Start chat with user
  const handleOpenChat = (targetUser: User, book?: BookListing) => {
    if (!currentUser) { setIsAuthOpen(true); return; }
    setChatTargetUser(targetUser);
    setChatTargetBook(book || null);
    setIsChatModalOpen(true);
  };

  // Filtered Listings computed
  const filteredListings = StorageService.filterListings(listings, filters);

  // Home Featured & Latest sections
  const featuredListings = listings.filter(l => l.isFeatured && l.status === 'active');
  const latestListings = listings.filter(l => l.status === 'active').slice(0, 8);
  const freeListings = listings.filter(l => l.dealType === 'free' && l.status === 'active');

  const unreadChatCount = chats.reduce((acc, chat) => acc + chat.unreadCount, 0);

  const navigate = (view: 'home' | 'marketplace' | 'exchange' | 'profile' | 'admin' | 'terms' | 'privacy') => {
    if (view === 'admin' && !currentUser) {
      setPendingView('admin');
      setIsAuthOpen(true);
      return;
    }
    if (view === 'admin' && !isAdmin) {
      setCurrentView('home');
      window.history.replaceState({}, '', '/');
      return;
    }
    if (view === 'exchange' && !currentUser) {
      setPendingView('profile');
      setIsAuthOpen(true);
      return;
    }
    if (view === 'profile' && !currentUser) {
      setPendingView('profile');
      setIsAuthOpen(true);
      return;
    }
    setCurrentView(view);
    window.history.replaceState({}, '', view === 'home' ? '/' : `/${view}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans pb-20 md:pb-0">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenCreateListing={() => currentUser ? setIsCreateOpen(true) : setIsAuthOpen(true)}
        onNavigate={navigate}
        currentView={currentView}
        selectedWilayaCode={filters.wilayaCode}
        onSelectWilaya={(code) => handleFilterChange({ wilayaCode: code })}
        lang={lang}
        onToggleLang={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
        unreadCount={unreadChatCount}
        isAdmin={isAdmin}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main App Views */}
      <main className="flex-1">
        
        {/* VIEW 1: HOME */}
        {currentView === 'home' && (
          <div className="space-y-8 sm:space-y-12">
            
            {/* Hero Search & Live Impact */}
            <HeroSearch
              onSearch={handleHeroSearch}
              onOpenCreateListing={() => currentUser ? setIsCreateOpen(true) : setIsAuthOpen(true)}
              stats={stats}
              lang={lang}
              selectedWilayaCode={filters.wilayaCode}
              onSelectWilaya={(code) => handleFilterChange({ wilayaCode: code })}
              recentSearches={recentSearches}
              onSelectRecentSearch={handleSelectRecentSearch}
            />

            {/* Quick Education Stages Pills Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 font-serif">تصفح الكتب حسب الطور الدراسي</h3>
                    <p className="text-xs text-slate-500">اختر المرحلة لتصفية جميع المواد وسنوات الدراسة مباشرة</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                  {EDUCATION_LEVELS.map(lvl => (
                    <button
                      key={lvl.id}
                      onClick={() => {
                        handleFilterChange({ level: lvl.id });
                        navigate('marketplace');
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-200 hover:border-emerald-300 transition-all flex items-center gap-1.5"
                    >
                      <span>{lang === 'ar' ? lvl.labelAr : lvl.labelFr}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Featured Listings Section */}
            {featuredListings.length > 0 && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 font-serif">
                      {lang === 'ar' ? 'كتب مميزة ونادرة للطلب المباشر' : 'Manuels en vedette'}
                    </h2>
                  </div>
                  <button
                    onClick={() => navigate('marketplace')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <span>عرض الكل</span>
                    <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {featuredListings.map(book => (
                    <BookCard
                      key={book.id}
                      book={book}
                      isFavorite={favorites.includes(book.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onSelectBook={handleSelectBook}
                      lang={lang}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Latest Listings Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 font-serif">
                    {lang === 'ar' ? 'أحدث الكتب المعروضة في الجزائر' : 'Dernières annonces'}
                  </h2>
                </div>
                <button
                  onClick={() => navigate('marketplace')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>تصفح كل الكتب ({listings.length})</span>
                  <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {latestListings.map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                    isFavorite={favorites.includes(book.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectBook={handleSelectBook}
                    lang={lang}
                  />
                ))}
              </div>
            </div>

            {/* Free Donations Banner (صدقة جارية) */}
            {freeListings.length > 0 && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-[#0B192C] text-white p-6 sm:p-8 rounded-3xl border border-purple-800/50 shadow-lg relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 relative z-10">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 bg-purple-500/30 text-purple-200 text-xs font-bold px-3 py-1 rounded-full border border-purple-400/30">
                        <Gift className="w-3.5 h-3.5 text-amber-300" />
                        <span>ركن الصدقة والتبرع بالكتب مجاناً لوجه الله</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black font-serif">
                        كتب مجانية مهداة للتلاميذ والعائلات المحتاجة
                      </h3>
                    </div>

                    <button
                      onClick={() => {
                        handleFilterChange({ dealType: 'free' });
                        navigate('marketplace');
                      }}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow transition-colors shrink-0"
                    >
                      تصفح جميع الكتب المجانية
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
                    {freeListings.slice(0, 4).map(book => (
                      <div
                        key={book.id}
                        onClick={() => handleSelectBook(book)}
                        className="bg-slate-900/80 backdrop-blur p-2.5 rounded-2xl border border-purple-500/30 hover:border-amber-400 cursor-pointer transition-all text-xs"
                      >
                        <img src={book.photos[0]} alt="" className="w-full aspect-[4/3] rounded-xl object-cover mb-2" />
                        <div className="font-bold text-white line-clamp-1">{book.title}</div>
                        <div className="text-[10px] text-purple-300 mt-0.5">{book.wilayaNameAr} • مجاناً 0 د.ج</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Smart Exchange Matcher Promo Banner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-700">
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider bg-emerald-950/60 px-3 py-1 rounded-full text-emerald-300 border border-emerald-500/30">
                    بدّل ووفّر 100%
                  </span>
                  <h3 className="text-xl sm:text-3xl font-black font-serif">
                    هل تبحث عن تبادل كتابك القديم بكتاب جديد؟
                  </h3>
                  <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
                    استخدم نظام التبادل الذكي لمطابقة كتبك فورياً مع طلبات التلاميذ في نفس ولايتك وبلديتك.
                  </p>
                </div>

                <button
                  id="home-promo-exchange-btn"
                    onClick={() => navigate('exchange')}
                  className="bg-white text-emerald-950 hover:bg-emerald-50 font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg flex items-center gap-2 transition-transform active:scale-95 shrink-0"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-700 animate-spin-slow" />
                  <span>ابدأ التبادل الآن 🔄</span>
                </button>
              </div>
            </div>

            {/* Bookstore & Partner Section (Lead Gen Architecture) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 font-serif">
                      أنت صاحب مكتبة أو نقطة بيع معتمدة في الجزائر؟
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-lg">
                      انضم مجاناً لشبكة "مكتبات كِتابي المعتمدة" واعرض مخزونك من الكتب والكراريس لأولياء الأمور والطلبة في ولايتك.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    alert('مرحباً بك! يمكنك التبديل لحساب "مكتبة النجاح المعتمدة" من صفحة الحساب لتجربة واجهة المكتبات.');
                    navigate('profile');
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs px-5 py-3 rounded-2xl border border-slate-700 transition-colors shrink-0"
                >
                  انضم كـ مكتبة شريكة
                </button>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: MARKETPLACE / EXPLORER */}
        {currentView === 'marketplace' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
            
            {/* Marketplace Top Controls */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              
              {/* Search Bar + Filter Drawer Button */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={filters.searchQuery}
                    onChange={(e) => handleFilterChange({ searchQuery: e.target.value })}
                    placeholder={lang === 'ar' ? 'ابحث عن كتاب، مادة، مستوى، أو ولاية...' : 'Recherche de livres...'}
                    className="w-full bg-slate-50 text-slate-900 text-xs sm:text-sm pr-10 pl-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
                  />
                </div>

                <button
                  id="marketplace-open-filters-btn"
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold px-4 py-2.5 sm:py-3 rounded-2xl flex items-center gap-2 shadow-sm transition-colors shrink-0"
                >
                  <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">تصفية متقدمة</span>
                  <span className="sm:hidden">تصفية</span>
                </button>
              </div>

              {/* Quick Deal Type Tabs (All / Sale / Exchange / Free) */}
              <div className="flex items-center justify-between gap-2 flex-wrap border-t border-slate-100 pt-3 text-xs">
                
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'all', label: 'جميع الإعلانات' },
                    { id: 'sale', label: 'للبيع (د.ج)' },
                    { id: 'exchange', label: 'للتبادل 🔄' },
                    { id: 'free', label: 'صدقة مجاناً 🎁' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleFilterChange({ dealType: t.id as any })}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                        filters.dealType === t.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Sort Order Selector */}
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                  <span>الترتيب:</span>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                    className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 font-bold focus:outline-none"
                  >
                    <option value="latest">الأحدث أولاً</option>
                    <option value="price_asc">الأقل سعراً</option>
                    <option value="price_desc">الأعلى سعراً</option>
                    <option value="popular">الأكثر تفاعلاً</option>
                  </select>
                </div>

              </div>

            </div>

            {/* Active Filters Summary Chips */}
            {(filters.level !== 'all' || filters.wilayaCode !== 0 || filters.dealType !== 'all' || filters.searchQuery) && (
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
                <span className="font-bold">المعايير المحددة:</span>
                {filters.searchQuery && (
                  <span className="bg-white border px-2.5 py-1 rounded-lg">بحث: "{filters.searchQuery}"</span>
                )}
                {filters.level !== 'all' && (
                  <span className="bg-white border px-2.5 py-1 rounded-lg">الطور: {EDUCATION_LEVELS.find(l => l.id === filters.level)?.labelAr}</span>
                )}
                {filters.wilayaCode !== 0 && (
                  <span className="bg-white border px-2.5 py-1 rounded-lg">الولاية: {WILAYAS.find(w => w.code === filters.wilayaCode)?.nameAr}</span>
                )}
                {filters.dealType !== 'all' && (
                  <span className="bg-white border px-2.5 py-1 rounded-lg">النوع: {filters.dealType}</span>
                )}
                <button
                  onClick={handleResetFilters}
                  className="text-rose-600 font-bold hover:underline mr-2"
                >
                  مسح التصفية ×
                </button>
              </div>
            )}

            {/* Local Storage Search Caching & History Bar */}
            <RecentSearchesBar
              recentSearches={recentSearches}
              onSelectRecentSearch={handleSelectRecentSearch}
              onRemoveRecentSearch={handleRemoveRecentSearch}
              onClearRecentSearches={handleClearRecentSearches}
              isFromCache={isFromCache}
              cacheTimestamp={cacheTimestamp}
              cacheHitCount={cacheHitCount}
              onRefreshResults={handleForceRefreshResults}
              lang={lang}
            />

            {/* Results Counter & Cache Indicator */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold flex-wrap gap-2">
              <span>تم العثور على {displayedListings.length} كتاب</span>
              {isFromCache && (
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 text-[11px]">
                  ⚡ مسترجع من الذاكرة المحلية (توفير الإنترنت)
                </span>
              )}
            </div>

            {/* Book Cards Grid */}
            {displayedListings.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">لم يتم العثور على كتب تطابق بحثك</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  جرب تغيير كلمات البحث أو إزالة بعض معايير التصفية، أو كن أول من يضيف هذا الكتاب!
                </p>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow"
                >
                  ➕ أضف هذا الكتاب للمنصة
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {displayedListings.map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                    isFavorite={favorites.includes(book.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectBook={handleSelectBook}
                    onQuickExchange={(b) => {
                      setTradeTargetBook(b);
                      setIsTradeModalOpen(true);
                    }}
                    lang={lang}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* VIEW 3: EXCHANGE MATCHER */}
        {currentView === 'exchange' && (
          <ExchangeMatcher
            currentUser={currentUser}
            onOpenTradeModal={(target) => {
              setTradeTargetBook(target);
              setIsTradeModalOpen(true);
            }}
            onSelectBook={handleSelectBook}
            lang={lang}
          />
        )}

        {/* VIEW 4: USER PROFILE & LISTINGS */}
        {currentView === 'profile' && currentUser && (
          <UserProfileView
            currentUser={currentUser}
            onSwitchUser={() => undefined}
            listings={listings}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectBook={handleSelectBook}
            onOpenCreateListing={() => setIsCreateOpen(true)}
            onOpenChatWithUser={(target) => handleOpenChat(target)}
            onNavigateToAdmin={() => navigate('admin')}
            onSignOut={() => { void supabase.auth.signOut(); setCurrentUser(null); navigate('home'); }}
            onUpdateAvatar={handleUpdateAvatar}
            isAdmin={isAdmin}
            lang={lang}
          />
        )}

        {/* VIEW 5: ADMIN DASHBOARD */}
        {currentView === 'control' && <SupabaseAdminPortal />}

        {currentView === 'admin' && <SupabaseAdminPortal />}

        {currentView === 'terms' && <LegalPage type="terms" onBack={() => navigate('home')} lang={lang} />}
        {currentView === 'privacy' && <LegalPage type="privacy" onBack={() => navigate('home')} lang={lang} />}

      </main>

      {/* Footer */}
      <footer className="bg-[#0B192C] text-white border-t border-slate-800 pt-12 pb-16 sm:pb-12 mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            
            {/* Col 1: Brand & Tagline */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-xl font-black font-serif">كِتابي • Ktabi</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-xs">
                المنصة الجزائرية الأولى لتبادل وبيع وشراء الكتب المدرسية والجامعية المستعملة والجديدة عبر 69 ولاية مع خيار الشحن والدفع عند الاستلام.
              </p>
              <div className="text-emerald-400 font-bold text-xs">
                "اشري • بيع • بدّل • وفّر"
              </div>
            </div>

            {/* Col 2: Education Cycles */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm font-serif">الأطوار الدراسية</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li>التعليم الابتدائي (1AP - 5AP)</li>
                <li>التعليم المتوسط BEM (1AM - 4AM)</li>
                <li>التعليم الثانوي BAC لجميع الشعب</li>
                <li>المراجع الجامعية والتكوين المهني</li>
                <li>قصص وقواميس وكتب أطفال</li>
              </ul>
            </div>

            {/* Col 3: Safe Exchange Tips */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm font-serif">إرشادات التبادل والشحن</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li>✓ التبادل والتسليم يداً بيد في الأماكن العامة</li>
                <li>✓ إمكانية الشحن لـ 69 ولاية مع خاصية الدفع عند الاستلام</li>
                <li>✓ فحص حالة الصفحات والتمارين قبل الاستلام</li>
                <li>✓ الخدمة مجانية 100% بدون عمولات خفية</li>
                <li>✓ الإبلاغ عن أي إعلان وهمي أو غير لائق</li>
              </ul>
            </div>

            {/* Col 4: Platform coverage */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm font-serif">تغطية 69 ولاية جزائرية</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                من الجزائر، وهران، قسنطينة، سطيف، عنابة، تيزي وزو، باتنة إلى أدرار وتمنراست.
              </p>
              {isAdmin && (
                <div className="pt-2">
                  <button
                    onClick={() => navigate('admin')}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 text-[11px]"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>دخول الإدارة والرقابة</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
            <div>
              © 2025 كِتابي (Ktabi.dz) — جميع الحقوق محفوظة لخدمة التعليم والعائلات الجزائرية.
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('privacy')} className="hover:text-white transition-colors">سياسة الخصوصية</button>
              <span>•</span>
              <button onClick={() => navigate('terms')} className="hover:text-white transition-colors">شروط الاستخدام</button>
              <span>•</span>
              <button onClick={() => window.location.href = 'mailto:contact@ktabi.dz'} className="hover:text-white transition-colors">تواصل مع الإدارة</button>
            </div>
          </div>

        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentView={currentView}
        onNavigate={navigate}
        onOpenCreateListing={() => currentUser ? setIsCreateOpen(true) : setIsAuthOpen(true)}
        lang={lang}
        unreadCount={unreadChatCount}
      />

      {/* MODAL 1: Book Details Deep View */}
      <BookDetailsModal
        book={selectedBook}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        isFavorite={selectedBook ? favorites.includes(selectedBook.id) : false}
        onToggleFavorite={handleToggleFavorite}
        currentUser={currentUser}
          onOpenChat={(b, seller) => {
            if (!currentUser) { setIsAuthOpen(true); return; }
            setIsDetailsOpen(false);
            handleOpenChat(seller, b);
          }}
          onOpenExchangeModal={(b) => {
            if (!currentUser) { setIsAuthOpen(true); return; }
            setTradeTargetBook(b);
            setIsTradeModalOpen(true);
          }}
          onOpenReportModal={(b) => {
            if (!currentUser) { setIsAuthOpen(true); return; }
            setReportTargetBook(b);
            setIsReportModalOpen(true);
          }}
        onSelectRelatedBook={handleSelectBook}
          relatedBooks={
            selectedBook
              ? listings.filter(l => l.id !== selectedBook.id && (l.level === selectedBook.level || l.wilayaCode === selectedBook.wilayaCode))
              : []
          }
        lang={lang}
      />

      {/* MODAL 2: Create Listing in Under 2 Minutes */}
      {currentUser && (
        <CreateListingModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          currentUser={currentUser}
          onListingCreated={handleListingCreated}
          lang={lang}
        />
      )}

      {/* MODAL 3: Propose Exchange Trade */}
      {currentUser && (
        <ExchangeTradeModal
          targetBook={tradeTargetBook}
          isOpen={isTradeModalOpen}
          onClose={() => setIsTradeModalOpen(false)}
          currentUser={currentUser}
          userListings={listings.filter(l => l.sellerId === currentUser.id)}
            onTradeProposed={(request) => { void refreshData(); if (tradeTargetBook && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tradeTargetBook.sellerId || '')) { void createNotification({ recipient_id: tradeTargetBook.sellerId, actor_id: currentUser.id, listing_id: tradeTargetBook.id, type: 'exchange', title: 'طلب تبادل جديد', message: `${currentUser.name} أرسل طلب تبادل لكتابك.` }).catch((error) => console.warn('Exchange notification failed', error)); } void request; }}
          lang={lang}
        />
      )}

      {/* MODAL 4: In-App Chat Messenger */}
      {currentUser && (
        <ChatMessengerModal
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
          currentUser={currentUser}
          targetUser={chatTargetUser}
          targetBook={chatTargetBook}
          lang={lang}
        />
      )}

      {/* MODAL 5: Report Listing */}
      {currentUser && (
        <ReportModal
          book={reportTargetBook}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          currentUser={currentUser}
          lang={lang}
        />
      )}

      <EmailAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        lang={lang}
        onAuthenticated={handleAuthSuccess}
      />

      {/* DRAWER: Advanced Filters Sheet */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalResultsCount={filteredListings.length}
        lang={lang}
      />

    </div>
  );
}
