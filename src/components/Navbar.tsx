import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  PlusCircle, 
  RefreshCw, 
  User as UserIcon, 
  ShieldCheck, 
  MapPin, 
  Globe, 
  MessageSquare, 
  SlidersHorizontal,
  Sparkles,
  Store
} from 'lucide-react';
import { User, Wilaya } from '../types';
import { WILAYAS } from '../data/algerianData';

interface NavbarProps {
  currentUser: User | null;
  onOpenCreateListing: () => void;
  onNavigate: (view: 'home' | 'marketplace' | 'exchange' | 'profile' | 'admin') => void;
  currentView: string;
  selectedWilayaCode: number;
  onSelectWilaya: (code: number) => void;
  lang: 'ar' | 'fr';
  onToggleLang: () => void;
  unreadCount: number;
  isAdmin?: boolean;
  onOpenAuth: () => void;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenCreateListing,
  onNavigate,
  currentView,
  selectedWilayaCode,
  onSelectWilaya,
  lang,
  onToggleLang,
  unreadCount,
  isAdmin = false,
  onOpenAuth
}) => {
  const [showWilayaMenu, setShowWilayaMenu] = useState(false);
  const [wilayaSearch, setWilayaSearch] = useState('');

  const selectedWilaya = WILAYAS.find(w => w.code === selectedWilayaCode);

  const filteredWilayas = WILAYAS.filter(w => 
    w.nameAr.includes(wilayaSearch) || 
    w.nameFr.toLowerCase().includes(wilayaSearch.toLowerCase()) ||
    w.code.toString().includes(wilayaSearch)
  );

  return (
    <header className="sticky top-0 z-40 bg-[#0B192C] text-white border-b border-slate-800 shadow-md">
      {/* Top micro banner */}
      <div className="bg-emerald-700/80 text-emerald-100 text-xs py-1 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        <span>{lang === 'ar' ? 'منصة كتابي الجزائرية: اشري • بيع • بدّل • وفّر — 100% مجانية للعائلات والطلبة' : 'Ktabi Algérie: Achetez • Vendez • Échangez • Économisez — 100% Gratuit'}</span>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Brand */}
          <div 
            id="ktabi-brand-logo"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform duration-200 border border-emerald-400/30">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-white font-serif">كتابي</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">DZ</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline -mt-0.5">
                {lang === 'ar' ? 'منصة تبادل وبيع الكتب المدرسية' : 'Bourse aux livres scolaires'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              id="nav-btn-home"
              onClick={() => onNavigate('home')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'home' 
                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {lang === 'ar' ? 'الرئيسية' : 'Accueil'}
            </button>
            <button
              id="nav-btn-marketplace"
              onClick={() => onNavigate('marketplace')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'marketplace' 
                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {lang === 'ar' ? 'تصفح الكتب' : 'Explorer'}
            </button>
            <button
              id="nav-btn-exchange"
              onClick={() => onNavigate('exchange')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                currentView === 'exchange' 
                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
              <span>{lang === 'ar' ? 'التبادل الذكي 🔄' : 'Échange Intelligent 🔄'}</span>
            </button>
            {isAdmin && (
              <button
                id="nav-btn-admin"
                onClick={() => onNavigate('admin')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  currentView === 'admin'
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'ar' ? 'لوحة الإدارة' : 'Admin'}</span>
              </button>
            )}
          </nav>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Wilaya Selector Dropdown */}
            <div className="relative hidden sm:block">
              <button
                id="navbar-wilaya-btn"
                onClick={() => setShowWilayaMenu(!showWilayaMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-xs sm:text-sm font-medium border border-slate-700/80 text-slate-200 transition-colors"
                title={lang === 'ar' ? 'اختر ولايتك' : 'Choisir la wilaya'}
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="max-w-[85px] sm:max-w-[120px] truncate">
                  {selectedWilaya ? `${selectedWilaya.code}. ${lang === 'ar' ? selectedWilaya.nameAr : selectedWilaya.nameFr}` : (lang === 'ar' ? 'كل الولايات (69)' : '69 Wilayas')}
                </span>
              </button>

              {showWilayaMenu && (
                <div className="absolute left-0 sm:right-0 mt-2 w-72 max-h-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col p-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-1 mb-1">
                    <input
                      type="text"
                      placeholder={lang === 'ar' ? 'ابحث عن ولاية أو رقم...' : 'Rechercher une wilaya...'}
                      value={wilayaSearch}
                      onChange={(e) => setWilayaSearch(e.target.value)}
                      className="w-full bg-slate-800 text-white placeholder-slate-400 text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
                      autoFocus
                    />
                  </div>

                  <div className="overflow-y-auto max-h-60 divide-y divide-slate-800 text-xs">
                    <button
                      onClick={() => { onSelectWilaya(0); setShowWilayaMenu(false); }}
                      className={`w-full text-start px-3 py-2 hover:bg-slate-800 transition-colors flex items-center justify-between ${selectedWilayaCode === 0 ? 'text-emerald-400 font-bold bg-slate-800/50' : 'text-slate-300'}`}
                    >
                      <span>{lang === 'ar' ? 'كل ولايات الجزائر (69)' : 'Toutes les wilayas (69)'}</span>
                      <span className="text-[10px] text-slate-500">DZ</span>
                    </button>
                    {filteredWilayas.map((w) => (
                      <button
                        key={w.code}
                        onClick={() => { onSelectWilaya(w.code); setShowWilayaMenu(false); }}
                        className={`w-full text-start px-3 py-2 hover:bg-slate-800 transition-colors flex items-center justify-between ${selectedWilayaCode === w.code ? 'text-emerald-400 font-bold bg-slate-800/50' : 'text-slate-300'}`}
                      >
                        <span>{w.code}. {lang === 'ar' ? w.nameAr : w.nameFr}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{w.nameFr}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Language Toggle (AR / FR) */}
            <button
              id="navbar-lang-toggle"
              onClick={onToggleLang}
              className="p-1.5 sm:px-2 sm:py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1 transition-colors"
              title="Changer de langue / تغيير اللغة"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline uppercase">{lang === 'ar' ? 'FR' : 'عربي'}</span>
            </button>

            {/* Post Listing CTA (Primary) */}
            <button
              id="navbar-add-book-cta"
              onClick={onOpenCreateListing}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm px-2.5 sm:px-3.5 py-2 rounded-xl shadow-md shadow-emerald-950/40 hover:shadow-emerald-700/30 transition-all transform active:scale-95 shrink-0"
              aria-label={lang === 'ar' ? 'أضف كتابك' : 'Publier'}
            >
              <PlusCircle className="w-4 h-4 text-emerald-100" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'أضف كتابك' : 'Publier'}</span>
            </button>

            {/* User Profile / Phone Auth */}
            {currentUser ? (
              <button
                id="navbar-user-profile-btn"
                onClick={() => onNavigate('profile')}
                className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-800 text-slate-200 border border-slate-700/60 relative transition-colors"
                title={lang === 'ar' ? 'حسابي وإعلاناتي' : 'Mon compte'}
              >
                <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-lg object-cover border border-emerald-500/40" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">{unreadCount}</span>
                )}
              </button>
            ) : (
              <button
                id="navbar-login-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl px-3 py-2 text-xs font-bold"
              >
                <UserIcon className="w-4 h-4 text-emerald-300" />
                <span>{lang === 'ar' ? 'دخول' : 'Connexion'}</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
