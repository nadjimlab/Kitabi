import React, { useEffect, useState } from 'react';
import { 
  User as UserIcon, 
  BookOpen, 
  Heart, 
  RefreshCw, 
  MessageSquare, 
  CheckCircle2, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Trash2, 
  Check, 
  PlusCircle, 
  ShieldCheck, 
  LogOut,
  Building2,
  SlidersHorizontal,
  ExternalLink,
  ImagePlus,
  Pencil,
  Save,
  X
} from 'lucide-react';
import { User, BookListing, ExchangeRequest, ChatConversation } from '../types';
import { StorageService } from '../services/storageService';
import { BookCard } from './BookCard';

interface UserProfileViewProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  listings: BookListing[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelectBook: (book: BookListing) => void;
  onOpenCreateListing: () => void;
  onOpenChatWithUser: (targetUser: User, book?: BookListing) => void;
  onNavigateToAdmin: () => void;
  onSignOut: () => void;
  onUpdateAvatar?: (file: File) => void | Promise<void>;
  isAdmin?: boolean;
  lang: 'ar' | 'fr';
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  onSwitchUser,
  listings,
  favorites,
  onToggleFavorite,
  onSelectBook,
  onOpenCreateListing,
  onOpenChatWithUser,
  onNavigateToAdmin,
  onSignOut,
  onUpdateAvatar,
  isAdmin = false,
  lang
}) => {
  const [activeTab, setActiveTab] = useState<'my_listings' | 'favorites' | 'exchanges' | 'messages'>('my_listings');
  const [exchangeRequests, setExchangeRequests] = useState<ExchangeRequest[]>([]);
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: currentUser.name, phone: currentUser.phone || '', whatsapp: currentUser.whatsapp || '', municipality: currentUser.municipality || '', bio: currentUser.bio || '' });
  const [editingListing, setEditingListing] = useState<BookListing | null>(null);
  const [listingForm, setListingForm] = useState({ title: '', price: '', condition: 'good' as BookListing['condition'], description: '', dealType: 'sale' as BookListing['dealType'] });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadPrivateData = async () => {
      const [requests, conversations] = await Promise.all([StorageService.getExchangeRequests(), StorageService.getChats()]);
      if (!cancelled) {
        setExchangeRequests(requests);
        setChats(conversations);
      }
    };
    void loadPrivateData();
    return () => { cancelled = true; };
  }, [currentUser.id]);

  const myListings = listings.filter(l => l.sellerId === currentUser.id);
  const favoriteListings = listings.filter(l => favorites.includes(l.id));

  const handleMarkStatus = async (id: string, status: 'active' | 'completed' | 'reserved' | 'sold' | 'unavailable') => {
    await StorageService.markListingStatus(id, status);
    window.location.reload();
  };

  const handleDeleteListing = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
      await StorageService.deleteListing(id);
      window.location.reload();
    }
  };

  const handleUpdateExchangeStatus = async (reqId: string, status: 'accepted' | 'rejected' | 'completed') => {
    await StorageService.updateExchangeRequestStatus(reqId, status);
    window.location.reload();
  };

  const openProfileEditor = () => {
    setProfileForm({ name: currentUser.name, phone: currentUser.phone || '', whatsapp: currentUser.whatsapp || '', municipality: currentUser.municipality || '', bio: currentUser.bio || '' });
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) { window.alert('يرجى كتابة الاسم.'); return; }
    setSavingEdit(true);
    try {
      const updatedUser = { ...currentUser, name: profileForm.name.trim(), phone: profileForm.phone.trim(), whatsapp: profileForm.whatsapp.trim() || undefined, municipality: profileForm.municipality.trim(), bio: profileForm.bio.trim() || undefined };
      await StorageService.updateUserProfile(updatedUser);
      onSwitchUser(updatedUser);
      setEditingProfile(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'تعذر حفظ معلومات الملف الشخصي.');
    } finally { setSavingEdit(false); }
  };

  const openListingEditor = (listing: BookListing) => {
    setEditingListing(listing);
    setListingForm({ title: listing.title, price: String(listing.price || 0), condition: listing.condition, description: listing.description, dealType: listing.dealType });
  };

  const handleSaveListing = async () => {
    if (!editingListing || !listingForm.title.trim() || !listingForm.description.trim()) { window.alert('يرجى إكمال عنوان الإعلان والوصف.'); return; }
    setSavingEdit(true);
    try {
      const updatedListing: BookListing = { ...editingListing, title: listingForm.title.trim(), price: Number(listingForm.price) || 0, condition: listingForm.condition, description: listingForm.description.trim(), dealType: listingForm.dealType };
      await StorageService.updateListing(updatedListing);
      setEditingListing(null);
      window.location.reload();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'تعذر تحديث الإعلان.');
    } finally { setSavingEdit(false); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* Profile Header Hero Card */}
      <div className="bg-gradient-to-br from-[#0B192C] via-[#10243d] to-[#16365b] text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(currentUser.name || 'Kitabi')}&backgroundColor=0b192c&fontFamily=Arial`}
                alt={currentUser.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-3 border-brand-500 shadow-xl"
              />
              {onUpdateAvatar && (
                <label className="absolute -top-2 -left-2 w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center cursor-pointer shadow-lg border-2 border-[#0B192C] hover:bg-brand-400 transition-colors" title="تغيير صورة الحساب">
                  <ImagePlus className="w-4 h-4" />
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onUpdateAvatar(file); event.currentTarget.value = ''; }} />
                </label>
              )}
              {currentUser.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-brand-500 text-white p-1 rounded-full border-2 border-[#0B192C]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white font-serif">{currentUser.name}</h1>
                {currentUser.isBookstore ? (
                  <span className="text-[11px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    مكتبة معتمدة
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-400" />
                  {currentUser.municipality} ({currentUser.wilayaCode})
                </span>
                {currentUser.reviewsCount > 0 && <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {currentUser.rating} ({currentUser.reviewsCount} تقييم)
                </span>}
                {currentUser.joinedDate && <span>عضو منذ {currentUser.joinedDate}</span>}
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-3 pt-1 flex-wrap">
                {currentUser.phone && <><span className="font-mono">{currentUser.phone}</span><span>•</span></>}
                <span>{currentUser.email}</span>
              </div>
              <button onClick={openProfileEditor} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-slate-100 hover:bg-slate-700">
                <Pencil className="w-3.5 h-3.5" /> تعديل معلوماتي
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenCreateListing}
              className="flex-1 sm:flex-none bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة إعلان جديد</span>
            </button>
            {isAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 flex items-center gap-1"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>لوحة الإدارة</span>
              </button>
            )}
            <button
              onClick={onSignOut}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-rose-400/20 flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج</span>
            </button>
          </div>

        </div>

      </div>

      {/* Tabs Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        
        <button
          id="profile-tab-my-listings"
          onClick={() => setActiveTab('my_listings')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'my_listings'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>إعلاناتي ({myListings.length})</span>
        </button>

        <button
          id="profile-tab-favorites"
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'favorites'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>المفضلة ({favoriteListings.length})</span>
        </button>

        <button
          id="profile-tab-exchanges"
          onClick={() => setActiveTab('exchanges')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'exchanges'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>طلبات التبادل ({exchangeRequests.length})</span>
        </button>

        <button
          id="profile-tab-messages"
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'messages'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>الرسائل ({chats.length})</span>
        </button>

      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        
        {/* Tab 1: My Listings */}
        {activeTab === 'my_listings' && (
          <div>
            {myListings.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-base">ليس لديك أي إعلانات حالياً</h3>
                <p className="text-xs text-slate-500">أضف كتبك القديمة واكسب مساحة وساعد غيرك في توفير تكاليف الدخول المدرسي.</p>
                <button
                  onClick={onOpenCreateListing}
                  className="bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  ➕ إضافة أول كتاب
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myListings.map((b) => (
                  <div key={b.id} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
                    <div className="flex items-start gap-3">
                      <img src={b.photos[0]} alt="" className="w-16 h-20 rounded-xl object-cover border border-slate-200 shrink-0" />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {b.grade}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${b.status === 'active' ? 'bg-brand-100 text-brand-800' : b.status === 'pending' ? 'bg-amber-100 text-amber-800' : b.status === 'flagged' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>
                            {b.status === 'active' ? 'مقبول ومعروض' : b.status === 'pending' ? 'قيد المراجعة' : b.status === 'flagged' ? 'مرفوض' : b.status === 'sold' ? 'مباع' : b.status === 'unavailable' ? 'غير متوفر' : b.status === 'completed' ? 'مكتمل' : 'محجوز'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 truncate font-serif">{b.title}</h4>
                        <div className="text-xs font-semibold text-brand-700">
                          {b.price ? `${b.price} د.ج` : (b.dealType === 'exchange' ? 'للتبادل 🔄' : 'مجاني 🎁')}
                        </div>
                        {b.status === 'pending' && <div className="text-[11px] text-amber-700 mt-1">إعلانك قيد مراجعة المسؤول وسيظهر بعد الموافقة.</div>}
                        {b.status === 'flagged' && <div className="text-[11px] text-rose-700 mt-1">سبب الرفض: {b.moderationNote || 'يرجى مراجعة الصور والمعلومات وتعديل الإعلان.'}</div>}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        {(b.status === 'active' || b.status === 'pending') ? <>
                          <button
                            onClick={() => handleMarkStatus(b.id, 'unavailable')}
                            className="text-[11px] font-bold text-amber-800 hover:bg-amber-100 bg-amber-50 px-2.5 py-1.5 rounded-lg"
                          >
                            غير متوفر
                          </button>
                          <button
                            onClick={() => handleMarkStatus(b.id, 'sold')}
                            className="text-[11px] font-bold text-blue-800 hover:bg-blue-100 bg-blue-50 px-2.5 py-1.5 rounded-lg"
                          >
                            مباع
                          </button>
                        </> : <button
                          onClick={() => handleMarkStatus(b.id, 'active')}
                          className="text-[11px] font-bold text-brand-700 hover:bg-brand-100 bg-brand-50 px-2.5 py-1.5 rounded-lg"
                        >
                          إعادة عرض الكتاب
                        </button>}
                        <button
                          onClick={() => openListingEditor(b)}
                          className="text-[11px] font-bold text-slate-700 hover:bg-slate-200 bg-slate-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5" /> تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteListing(b.id)}
                          className="text-[11px] font-bold text-rose-700 hover:bg-rose-100 bg-rose-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> حذف نهائي
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Favorites */}
        {activeTab === 'favorites' && (
          <div>
            {favoriteListings.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
                <Heart className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-base">قائمة المفضلة فارغة</h3>
                <p className="text-xs text-slate-500">اضغط على أيقونة القلب على أي كتاب لحفظه والرجوع إليه لاحقاً.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {favoriteListings.map(b => (
                  <BookCard
                    key={b.id}
                    book={b}
                    isFavorite={true}
                    onToggleFavorite={onToggleFavorite}
                    onSelectBook={onSelectBook}
                    lang={lang}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Exchanges */}
        {activeTab === 'exchanges' && (
          <div className="space-y-3">
            {exchangeRequests.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
                <RefreshCw className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-base">لا توجد طلبات تبادل معلقة</h3>
              </div>
            ) : (
              exchangeRequests.map((req) => (
                <div key={req.id} className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        req.status === 'accepted' ? 'bg-brand-100 text-brand-800' :
                        req.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {req.status === 'accepted' ? 'تمت الموافقة ✓' : req.status === 'rejected' ? 'مرفوض' : 'في الانتظار 🔄'}
                      </span>
                      <span className="text-xs text-slate-500">{req.createdAt}</span>
                    </div>

                    <div className="text-sm font-bold text-slate-900 font-serif pt-1">
                      طلب تبادل: <span className="text-brand-700">{req.offeredBookTitle}</span> 🔄 مقابل <span className="text-blue-700">{req.targetBookTitle}</span>
                    </div>

                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-xl">
                      "{req.message}"
                    </p>

                    <div className="text-xs text-slate-500 flex items-center gap-2 pt-1">
                      <span>المرسل: <strong>{req.requesterName}</strong></span>
                      <span>•</span>
                      <span>الهاتف: <strong className="font-mono">{req.requesterPhone}</strong></span>
                      <span>•</span>
                      <span>{req.wilayaNameAr}</span>
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleUpdateExchangeStatus(req.id, 'accepted')}
                        className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow"
                      >
                        قبول التبادل
                      </button>
                      <button
                        onClick={() => handleUpdateExchangeStatus(req.id, 'rejected')}
                        className="bg-slate-100 hover:bg-rose-50 text-rose-600 font-bold text-xs px-3 py-2 rounded-xl border border-slate-200"
                      >
                        رفض
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Messages */}
        {activeTab === 'messages' && (
          <div className="space-y-3">
            {chats.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-base">لا توجد محادثات سابقة</h3>
                <p className="text-xs text-slate-500">عند مراسلة أي بائع أو مشتري ستظهر كل المحادثات هنا.</p>
              </div>
            ) : (
              chats.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onOpenChatWithUser(c.participant)}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-brand-500 shadow-sm cursor-pointer transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img src={c.participant.avatar} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{c.participant.name}</h4>
                      <p className="text-xs text-slate-600 line-clamp-1">{c.lastMessage}</p>
                      {c.listingTitle && (
                        <span className="text-[10px] text-brand-800 font-semibold bg-brand-50 px-2 py-0.5 rounded mt-1 inline-block">
                          حول كتاب: {c.listingTitle}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-end text-[11px] text-slate-400">
                    <div>{c.lastMessageTime}</div>
                    {c.unreadCount > 0 && (
                      <span className="inline-block mt-1 w-5 h-5 rounded-full bg-brand-600 text-white font-bold text-[10px] text-center leading-5">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}


        {editingProfile && (
          <div className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm p-4 flex items-center justify-center" dir="rtl">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-black text-slate-900">تعديل معلوماتي</h2>
                  <p className="text-xs text-slate-500 mt-1">حدّث المعلومات التي تظهر في ملفك للمتعاملين معك.</p>
                </div>
                <button onClick={() => setEditingProfile(false)} className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200" aria-label="إغلاق"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">الاسم
                  <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-sm font-bold text-slate-700">الهاتف
                    <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} dir="ltr" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                  </label>
                  <label className="block text-sm font-bold text-slate-700">واتساب
                    <input value={profileForm.whatsapp} onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })} dir="ltr" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                  </label>
                </div>
                <label className="block text-sm font-bold text-slate-700">البلدية
                  <input value={profileForm.municipality} onChange={(e) => setProfileForm({ ...profileForm, municipality: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                </label>
                <label className="block text-sm font-bold text-slate-700">نبذة عنك
                  <textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} rows={4} className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                </label>
              </div>
              <div className="mt-6 flex gap-2">
                <button onClick={() => setEditingProfile(false)} className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200">إلغاء</button>
                <button onClick={() => void handleSaveProfile()} disabled={savingEdit} className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {savingEdit ? 'جارٍ الحفظ...' : 'حفظ المعلومات'}</button>
              </div>
            </div>
          </div>
        )}

        {editingListing && (
          <div className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm p-4 flex items-center justify-center" dir="rtl">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-black text-slate-900">تعديل الإعلان</h2>
                  <p className="text-xs text-slate-500 mt-1">تعديل السعر أو المعلومات قد يعيد الإعلان النشط إلى المراجعة.</p>
                </div>
                <button onClick={() => setEditingListing(null)} className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200" aria-label="إغلاق"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">عنوان الكتاب
                  <input value={listingForm.title} onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-sm font-bold text-slate-700">السعر (دج)
                    <input type="number" min="0" value={listingForm.price} onChange={(e) => setListingForm({ ...listingForm, price: e.target.value })} dir="ltr" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                  </label>
                  <label className="block text-sm font-bold text-slate-700">الحالة
                    <select value={listingForm.condition} onChange={(e) => setListingForm({ ...listingForm, condition: e.target.value as BookListing['condition'] })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
                      <option value="new">جديد</option><option value="like_new">شبه جديد</option><option value="good">حالة جيدة</option><option value="acceptable">مقبول</option>
                    </select>
                  </label>
                </div>
                <label className="block text-sm font-bold text-slate-700">نوع المعاملة
                  <select value={listingForm.dealType} onChange={(e) => setListingForm({ ...listingForm, dealType: e.target.value as BookListing['dealType'] })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
                    <option value="sale">بيع</option><option value="exchange">تبادل</option><option value="free">مجاني</option>
                  </select>
                </label>
                <label className="block text-sm font-bold text-slate-700">الوصف
                  <textarea value={listingForm.description} onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })} rows={5} className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                </label>
                <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">الصور الحالية محفوظة. إذا غيّرت معلومات إعلان منشور، سيُعاد إلى «قيد المراجعة» لحماية المستخدمين.</div>
              </div>
              <div className="mt-6 flex gap-2">
                <button onClick={() => setEditingListing(null)} className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200">إلغاء</button>
                <button onClick={() => void handleSaveListing()} disabled={savingEdit} className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {savingEdit ? 'جارٍ الحفظ...' : 'حفظ الإعلان'}</button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
