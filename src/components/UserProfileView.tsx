import React, { useState } from 'react';
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
  Users, 
  LogOut,
  Building2,
  SlidersHorizontal,
  ExternalLink
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
  lang
}) => {
  const [activeTab, setActiveTab] = useState<'my_listings' | 'favorites' | 'exchanges' | 'messages' | 'switch_account'>('my_listings');
  
  const demoUsers = StorageService.getAllDemoUsers();
  const exchangeRequests = StorageService.getExchangeRequests();
  const chats = StorageService.getChats();

  const myListings = listings.filter(l => l.sellerId === currentUser.id);
  const favoriteListings = listings.filter(l => favorites.includes(l.id));

  const handleMarkStatus = (id: string, status: 'active' | 'completed' | 'reserved') => {
    StorageService.markListingStatus(id, status);
    window.location.reload(); // Quick refresh state
  };

  const handleDeleteListing = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
      StorageService.deleteListing(id);
      window.location.reload();
    }
  };

  const handleUpdateExchangeStatus = (reqId: string, status: 'accepted' | 'rejected' | 'completed') => {
    StorageService.updateExchangeRequestStatus(reqId, status);
    window.location.reload();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* Profile Header Hero Card */}
      <div className="bg-gradient-to-br from-[#0B192C] via-[#10243d] to-[#16365b] text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-3 border-emerald-500 shadow-xl"
              />
              {currentUser.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-[#0B192C]">
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
                ) : (
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                    حساب فردي موثوق
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {currentUser.municipality} ({currentUser.wilayaCode})
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {currentUser.rating} ({currentUser.reviewsCount} تقييم)
                </span>
                <span>•</span>
                <span>عضو منذ {currentUser.joinedDate}</span>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-3 pt-1">
                <span className="font-mono">{currentUser.phone}</span>
                <span>•</span>
                <span>{currentUser.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenCreateListing}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة إعلان جديد</span>
            </button>
            <button
              onClick={onNavigateToAdmin}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 flex items-center gap-1"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>لوحة الإدارة</span>
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
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>إعلاناتي المعروضة ({myListings.length})</span>
        </button>

        <button
          id="profile-tab-favorites"
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'favorites'
              ? 'bg-emerald-600 text-white shadow-sm'
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
              ? 'bg-emerald-600 text-white shadow-sm'
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
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>الرسائل ({chats.length})</span>
        </button>

        <button
          id="profile-tab-switch"
          onClick={() => setActiveTab('switch_account')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'switch_account'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>تبديل الحساب التجريبي</span>
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
                <h3 className="font-bold text-slate-800 text-base">ليس لديك أي إعلانات نشطة حالياً</h3>
                <p className="text-xs text-slate-500">أضف كتبك القديمة واكسب مساحة وساعد غيرك في توفير تكاليف الدخول المدرسي.</p>
                <button
                  onClick={onOpenCreateListing}
                  className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
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
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${b.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                            {b.status === 'active' ? 'نشط ومعروض' : 'مكتمل / تم البيع'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 truncate font-serif">{b.title}</h4>
                        <div className="text-xs font-semibold text-emerald-700">
                          {b.price ? `${b.price} د.ج` : (b.dealType === 'exchange' ? 'للتبادل 🔄' : 'مجاني 🎁')}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {b.status === 'active' ? (
                          <button
                            onClick={() => handleMarkStatus(b.id, 'completed')}
                            className="text-[11px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 px-2.5 py-1 rounded-lg"
                          >
                            تحديد كـ "تم البيع/التبادل"
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkStatus(b.id, 'active')}
                            className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg"
                          >
                            إعادة تنشيط
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteListing(b.id)}
                        className="text-rose-600 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50"
                        title="حذف الإعلان"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                        req.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {req.status === 'accepted' ? 'تمت الموافقة ✓' : req.status === 'rejected' ? 'مرفوض' : 'في الانتظار 🔄'}
                      </span>
                      <span className="text-xs text-slate-500">{req.createdAt}</span>
                    </div>

                    <div className="text-sm font-bold text-slate-900 font-serif pt-1">
                      طلب تبادل: <span className="text-emerald-700">{req.offeredBookTitle}</span> 🔄 مقابل <span className="text-blue-700">{req.targetBookTitle}</span>
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
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow"
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
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm cursor-pointer transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img src={c.participant.avatar} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{c.participant.name}</h4>
                      <p className="text-xs text-slate-600 line-clamp-1">{c.lastMessage}</p>
                      {c.listingTitle && (
                        <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">
                          حول كتاب: {c.listingTitle}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-end text-[11px] text-slate-400">
                    <div>{c.lastMessageTime}</div>
                    {c.unreadCount > 0 && (
                      <span className="inline-block mt-1 w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] text-center leading-5">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 5: Switch Demo Account */}
        {activeTab === 'switch_account' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">تبديل حساب المستخدم التجريبي للتجربة</h3>
              <p className="text-xs text-slate-500">اختر من النماذج الجاهزة لتجربة التطبيق من وجهة نظر طالب، ولي أمر، أو صاحب مكتبة.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {demoUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => {
                    onSwitchUser(u);
                    setActiveTab('my_listings');
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    currentUser.id === u.id
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900">{u.name}</span>
                        {u.isBookstore && (
                          <span className="text-[9px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">مكتبة</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{u.municipality} • {u.phone}</div>
                    </div>
                  </div>

                  {currentUser.id === u.id && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">
                      الحساب الحالي ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
