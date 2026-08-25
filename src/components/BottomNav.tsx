import React from 'react';
import { Home, Search, PlusCircle, RefreshCw, User, Shield } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: 'home' | 'marketplace' | 'exchange' | 'profile' | 'admin') => void;
  onOpenCreateListing: () => void;
  lang: 'ar' | 'fr';
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenCreateListing,
  lang,
  unreadCount = 0
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B192C]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-around">
        
        {/* Home */}
        <button
          id="bottom-nav-home"
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            currentView === 'home'
              ? 'text-emerald-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">
            {lang === 'ar' ? 'الرئيسية' : 'Accueil'}
          </span>
        </button>

        {/* Search / Marketplace */}
        <button
          id="bottom-nav-marketplace"
          onClick={() => onNavigate('marketplace')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            currentView === 'marketplace'
              ? 'text-emerald-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">
            {lang === 'ar' ? 'البحث' : 'Explorer'}
          </span>
        </button>

        {/* Center CTA Button - Post Book */}
        <button
          id="bottom-nav-create"
          onClick={onOpenCreateListing}
          className="flex flex-col items-center justify-center -mt-5 group"
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 group-active:scale-90 transition-transform border-4 border-[#0B192C]">
            <PlusCircle className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-bold text-emerald-400 mt-0.5">
            {lang === 'ar' ? 'نشر كتاب' : 'Publier'}
          </span>
        </button>

        {/* Exchange Matcher */}
        <button
          id="bottom-nav-exchange"
          onClick={() => onNavigate('exchange')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            currentView === 'exchange'
              ? 'text-emerald-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RefreshCw className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">
            {lang === 'ar' ? 'التبادل' : 'Échanges'}
          </span>
        </button>

        {/* Profile / Account */}
        <button
          id="bottom-nav-profile"
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl relative transition-all ${
            currentView === 'profile'
              ? 'text-emerald-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#0B192C]"></span>
          )}
          <span className="text-[10px] leading-tight">
            {lang === 'ar' ? 'حسابي' : 'Compte'}
          </span>
        </button>

      </div>
    </div>
  );
};
