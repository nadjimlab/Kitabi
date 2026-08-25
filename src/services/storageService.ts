import { 
  BookListing, 
  User, 
  ExchangeRequest, 
  ChatConversation, 
  ChatMessage, 
  ReportItem, 
  FilterState, 
  EducationLevel,
  RecentSearchItem,
  CachedSearchEntry
} from '../types';
import { INITIAL_LISTINGS, INITIAL_USERS, INITIAL_EXCHANGE_REQUESTS, WILAYAS } from '../data/algerianData';

const LISTINGS_KEY = 'ktabi_listings_v1';
const FAVORITES_KEY = 'ktabi_favorites_v1';
const CURRENT_USER_KEY = 'ktabi_current_user_v1';
const REQUESTS_KEY = 'ktabi_exchange_requests_v1';
const CHATS_KEY = 'ktabi_chats_v1';
const REPORTS_KEY = 'ktabi_reports_v1';
const SEARCH_CACHE_KEY = 'ktabi_search_cache_v1';
const RECENT_SEARCHES_KEY = 'ktabi_recent_searches_v1';
const LAST_FILTERS_KEY = 'ktabi_last_filters_v1';

// Cache validity: 30 minutes (1800000 ms)
const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_CACHE_ENTRIES = 20;
const MAX_RECENT_SEARCHES = 12;

export class StorageService {
  // Initialize storage if empty
  static init() {
    if (!localStorage.getItem(LISTINGS_KEY)) {
      localStorage.setItem(LISTINGS_KEY, JSON.stringify(INITIAL_LISTINGS));
    }
    if (!localStorage.getItem(FAVORITES_KEY)) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(["book-1", "book-3"]));
    }
    if (!localStorage.getItem(CURRENT_USER_KEY)) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(INITIAL_USERS[0]));
    }
    if (!localStorage.getItem(REQUESTS_KEY)) {
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(INITIAL_EXCHANGE_REQUESTS));
    }
    if (!localStorage.getItem(CHATS_KEY)) {
      const initialChats: ChatConversation[] = [
        {
          id: "chat-1",
          listingId: "book-1",
          listingTitle: "الميسر في الرياضيات 3 ثانوي",
          listingPrice: 450,
          dealType: "sale",
          listingPhoto: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
          participant: INITIAL_USERS[1], // Fatima
          lastMessage: "السلام عليكم أخي، هل يمكن التسليم غداً في باب الزوار؟",
          lastMessageTime: "14:30",
          unreadCount: 1,
          messages: [
            {
              id: "m-1",
              senderId: INITIAL_USERS[1].id,
              receiverId: INITIAL_USERS[0].id,
              text: "السلام عليكم أخي أمين، مهتمة بكتاب الرياضيات، هل النسخة كاملة بدون تمزيق؟",
              timestamp: "14:20",
              isRead: true
            },
            {
              id: "m-2",
              senderId: INITIAL_USERS[0].id,
              receiverId: INITIAL_USERS[1].id,
              text: "وعليكم السلام ورحمة الله، نعم أختي الكتاب بحالة شبه جديدة تماماً.",
              timestamp: "14:25",
              isRead: true
            },
            {
              id: "m-3",
              senderId: INITIAL_USERS[1].id,
              receiverId: INITIAL_USERS[0].id,
              text: "ممتاز، هل يمكن التسليم غداً في باب الزوار أمام محطة الترامواي؟",
              timestamp: "14:30",
              isRead: false
            }
          ]
        }
      ];
      localStorage.setItem(CHATS_KEY, JSON.stringify(initialChats));
    }
    if (!localStorage.getItem(REPORTS_KEY)) {
      const initialReports: ReportItem[] = [
        {
          id: "rep-1",
          listingId: "book-4",
          listingTitle: "سلسلة الهباج في العلوم الفيزيائية",
          sellerName: "مكتبة النجاح المعتمدة",
          reporterName: "مستخدم تجريبي",
          reason: "wrong_info",
          reasonLabel: "معلومات غير مطابقة للنسخة",
          details: "الطبعة المصورة ليست لسنة 2024 بل 2022",
          status: "pending",
          createdAt: "منذ 3 ساعات"
        }
      ];
      localStorage.setItem(REPORTS_KEY, JSON.stringify(initialReports));
    }
  }

  // --- Current User Management ---
  static getCurrentUser(): User {
    this.init();
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      return stored ? JSON.parse(stored) : INITIAL_USERS[0];
    } catch {
      return INITIAL_USERS[0];
    }
  }

  static setCurrentUser(user: User) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  static getAllDemoUsers(): User[] {
    return INITIAL_USERS;
  }

  // --- Listings Management ---
  static getListings(): BookListing[] {
    this.init();
    try {
      const stored = localStorage.getItem(LISTINGS_KEY);
      return stored ? JSON.parse(stored) : INITIAL_LISTINGS;
    } catch {
      return INITIAL_LISTINGS;
    }
  }

  static getListingById(id: string): BookListing | undefined {
    const listings = this.getListings();
    return listings.find(l => l.id === id);
  }

  static saveListing(listing: BookListing): BookListing {
    const listings = this.getListings();
    const existingIndex = listings.findIndex(l => l.id === listing.id);
    if (existingIndex >= 0) {
      listings[existingIndex] = listing;
    } else {
      listings.unshift(listing);
    }
    localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
    this.invalidateSearchCache();
    return listing;
  }

  static deleteListing(id: string): boolean {
    const listings = this.getListings();
    const filtered = listings.filter(l => l.id !== id);
    localStorage.setItem(LISTINGS_KEY, JSON.stringify(filtered));
    this.invalidateSearchCache();
    return true;
  }

  static markListingStatus(id: string, status: 'active' | 'reserved' | 'completed' | 'flagged'): boolean {
    const listings = this.getListings();
    const target = listings.find(l => l.id === id);
    if (target) {
      target.status = status;
      localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
      this.invalidateSearchCache();
      return true;
    }
    return false;
  }

  static incrementView(id: string) {
    const listings = this.getListings();
    const target = listings.find(l => l.id === id);
    if (target) {
      target.views = (target.views || 0) + 1;
      localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
    }
  }

  // --- Favorites Management ---
  static getFavorites(): string[] {
    this.init();
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static toggleFavorite(listingId: string): boolean {
    const favs = this.getFavorites();
    const listings = this.getListings();
    const listing = listings.find(l => l.id === listingId);
    
    let isNowFavorite = false;
    if (favs.includes(listingId)) {
      const newFavs = favs.filter(id => id !== listingId);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
      if (listing) {
        listing.favoritesCount = Math.max(0, (listing.favoritesCount || 1) - 1);
      }
      isNowFavorite = false;
    } else {
      favs.push(listingId);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
      if (listing) {
        listing.favoritesCount = (listing.favoritesCount || 0) + 1;
      }
      isNowFavorite = true;
    }
    localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
    return isNowFavorite;
  }

  static isFavorite(listingId: string): boolean {
    const favs = this.getFavorites();
    return favs.includes(listingId);
  }

  // --- Exchange Requests ---
  static getExchangeRequests(): ExchangeRequest[] {
    this.init();
    try {
      const stored = localStorage.getItem(REQUESTS_KEY);
      return stored ? JSON.parse(stored) : INITIAL_EXCHANGE_REQUESTS;
    } catch {
      return INITIAL_EXCHANGE_REQUESTS;
    }
  }

  static sendExchangeRequest(req: Omit<ExchangeRequest, 'id' | 'createdAt' | 'status'>): ExchangeRequest {
    const requests = this.getExchangeRequests();
    const newReq: ExchangeRequest = {
      ...req,
      id: `req-${Date.now()}`,
      status: 'pending',
      createdAt: 'الآن'
    };
    requests.unshift(newReq);
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    return newReq;
  }

  static updateExchangeRequestStatus(id: string, status: 'accepted' | 'rejected' | 'completed'): boolean {
    const requests = this.getExchangeRequests();
    const target = requests.find(r => r.id === id);
    if (target) {
      target.status = status;
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
      return true;
    }
    return false;
  }

  // --- Chats & In-App Messenger ---
  static getChats(): ChatConversation[] {
    this.init();
    try {
      const stored = localStorage.getItem(CHATS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static sendMessage(conversationId: string, text: string, senderUser: User, receiverUser: User, listing?: BookListing): ChatConversation {
    const chats = this.getChats();
    let conv = chats.find(c => c.id === conversationId);
    
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: senderUser.id,
      receiverId: receiverUser.id,
      listingId: listing?.id,
      text,
      timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };

    if (conv) {
      conv.messages.push(newMsg);
      conv.lastMessage = text;
      conv.lastMessageTime = newMsg.timestamp;
    } else {
      conv = {
        id: conversationId,
        listingId: listing?.id,
        listingTitle: listing?.title,
        listingPhoto: listing?.photos[0],
        listingPrice: listing?.price,
        dealType: listing?.dealType,
        participant: receiverUser,
        lastMessage: text,
        lastMessageTime: newMsg.timestamp,
        unreadCount: 0,
        messages: [newMsg]
      };
      chats.unshift(conv);
    }
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
    return conv;
  }

  // --- Reports ---
  static getReports(): ReportItem[] {
    this.init();
    try {
      const stored = localStorage.getItem(REPORTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static submitReport(report: Omit<ReportItem, 'id' | 'status' | 'createdAt'>): ReportItem {
    const reports = this.getReports();
    const newRep: ReportItem = {
      ...report,
      id: `rep-${Date.now()}`,
      status: 'pending',
      createdAt: 'الآن'
    };
    reports.unshift(newRep);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    return newRep;
  }

  static resolveReport(id: string, action: 'resolved' | 'dismissed'): boolean {
    const reports = this.getReports();
    const target = reports.find(r => r.id === id);
    if (target) {
      target.status = action;
      localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
      return true;
    }
    return false;
  }

  // --- Smart Filtering Helper ---
  static filterListings(listings: BookListing[], filters: FilterState): BookListing[] {
    return listings.filter(item => {
      if (item.status === 'flagged') return false;

      // Search Query in title, description, subject, or author
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchSubject = item.subject.toLowerCase().includes(q);
        const matchGrade = item.grade.toLowerCase().includes(q);
        const matchStream = item.stream ? item.stream.toLowerCase().includes(q) : false;
        const matchWilaya = item.wilayaNameAr.includes(q) || item.wilayaNameFr.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchSubject && !matchGrade && !matchStream && !matchWilaya) {
          return false;
        }
      }

      // Education Level
      if (filters.level !== 'all' && item.level !== filters.level) {
        return false;
      }

      // Grade Code
      if (filters.gradeCode && item.gradeCode !== filters.gradeCode) {
        return false;
      }

      // Stream
      if (filters.stream && item.stream && !item.stream.includes(filters.stream)) {
        return false;
      }

      // Subject
      if (filters.subject && !item.subject.includes(filters.subject)) {
        return false;
      }

      // Wilaya Code
      if (filters.wilayaCode !== 0 && item.wilayaCode !== filters.wilayaCode) {
        return false;
      }

      // Municipality
      if (filters.municipality && item.municipality !== filters.municipality) {
        return false;
      }

      // Deal Type
      if (filters.dealType !== 'all' && item.dealType !== filters.dealType) {
        return false;
      }

      // Only Free
      if (filters.onlyFree && item.dealType !== 'free') {
        return false;
      }

      // Only Exchange
      if (filters.onlyExchange && item.dealType !== 'exchange') {
        return false;
      }

      // Condition
      if (filters.condition !== 'all' && item.condition !== filters.condition) {
        return false;
      }

      // Delivery Only
      if (filters.deliveryOnly && !item.deliveryAvailable) {
        return false;
      }

      // Price bounds
      if (item.dealType === 'sale') {
        if (filters.minPrice > 0 && item.price < filters.minPrice) return false;
        if (filters.maxPrice < 5000 && item.price > filters.maxPrice) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price_asc') {
        return a.price - b.price;
      }
      if (filters.sortBy === 'price_desc') {
        return b.price - a.price;
      }
      if (filters.sortBy === 'popular') {
        return (b.views + b.favoritesCount * 3) - (a.views + a.favoritesCount * 3);
      }
      // default: latest
      return 0;
    });
  }

  // --- Exchange Matching Engine ---
  static findExchangeMatches(haveSubject: string, haveLevel: EducationLevel, wantSubject: string, wantLevel: EducationLevel, userWilaya?: number) {
    const listings = this.getListings().filter(l => l.status === 'active');
    
    return listings.map(listing => {
      let score = 0;
      const reasons: string[] = [];

      // If listing is an exchange
      if (listing.dealType === 'exchange') {
        score += 30;
      }

      // Does the listing offer what the user WANTS?
      if (listing.level === wantLevel) {
        score += 25;
        if (wantSubject && listing.subject.includes(wantSubject)) {
          score += 30;
          reasons.push(`يقدم مادة ${listing.subject} التي تبحث عنها`);
        }
      }

      // Does the listing search for what the user HAS?
      if (listing.exchangeFor && haveSubject && listing.exchangeFor.includes(haveSubject)) {
        score += 35;
        reasons.push(`صاحب الإعلان يبحث بالتحديد عن: "${haveSubject}"!`);
      }

      // Wilaya match (same province)
      if (userWilaya && listing.wilayaCode === userWilaya) {
        score += 20;
        reasons.push(`في نفس ولايتك (${listing.wilayaNameAr})`);
      }

      return {
        listing,
        matchScore: Math.min(100, score),
        reasons
      };
    }).filter(m => m.matchScore >= 40)
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  // --- Platform Financial & Social Impact Stats ---
  static getPlatformStats() {
    const listings = this.getListings();
    const totalBooks = listings.length;
    const activeExchanges = listings.filter(l => l.dealType === 'exchange').length;
    const freeDonations = listings.filter(l => l.dealType === 'free').length;
    
    // Estimate total DZD saved for Algerian families (difference between original price & used price + exchanged book values)
    const estimatedSavingsDZD = listings.reduce((acc, curr) => {
      if (curr.dealType === 'free') {
        return acc + (curr.originalPrice || 600);
      }
      if (curr.dealType === 'exchange') {
        return acc + 800; // Average saved vs buying new
      }
      if (curr.originalPrice && curr.price) {
        return acc + Math.max(0, curr.originalPrice - curr.price);
      }
      return acc + 350;
    }, 184500); // Starter baseline saved

    const activeWilayasCount = new Set(listings.map(l => l.wilayaCode)).size;

    return {
      totalBooks,
      activeExchanges,
      freeDonations,
      estimatedSavingsDZD,
      activeWilayasCount
    };
  }

  // ==========================================
  // --- Search Results Caching Subsystem ---
  // ==========================================

  static generateCacheKey(filters: FilterState): string {
    return JSON.stringify({
      q: (filters.searchQuery || '').trim().toLowerCase(),
      lvl: filters.level || 'all',
      gc: filters.gradeCode || '',
      st: filters.stream || '',
      sub: filters.subject || '',
      w: filters.wilayaCode || 0,
      mun: filters.municipality || '',
      dt: filters.dealType || 'all',
      cond: filters.condition || 'all',
      min: filters.minPrice || 0,
      max: filters.maxPrice || 3000,
      free: !!filters.onlyFree,
      exc: !!filters.onlyExchange,
      deliv: !!filters.deliveryOnly,
      sb: filters.sortBy || 'latest'
    });
  }

  /**
   * Retrieves cached search results for the given filter state if available & valid.
   */
  static getCachedSearchResults(filters: FilterState): { 
    results: BookListing[]; 
    timestamp: number; 
    hitCount: number; 
    resultCount: number;
    isCacheValid: boolean;
  } | null {
    try {
      const stored = localStorage.getItem(SEARCH_CACHE_KEY);
      if (!stored) return null;

      const cacheEntries: CachedSearchEntry[] = JSON.parse(stored);
      const targetKey = this.generateCacheKey(filters);
      const entryIndex = cacheEntries.findIndex(e => e.cacheKey === targetKey);

      if (entryIndex === -1) return null;

      const entry = cacheEntries[entryIndex];
      const ageMs = Date.now() - entry.timestamp;

      // If expired (older than CACHE_TTL_MS), evict entry
      if (ageMs > CACHE_TTL_MS) {
        cacheEntries.splice(entryIndex, 1);
        localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(cacheEntries));
        return null;
      }

      // Cache hit: Increment hit count and update entry
      entry.hitCount = (entry.hitCount || 1) + 1;
      localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(cacheEntries));

      return {
        results: entry.results,
        timestamp: entry.timestamp,
        hitCount: entry.hitCount,
        resultCount: entry.resultCount,
        isCacheValid: true
      };
    } catch {
      return null;
    }
  }

  /**
   * Caches the search results in localStorage for subsequent instant retrieval.
   */
  static setCachedSearchResults(filters: FilterState, results: BookListing[]) {
    try {
      const stored = localStorage.getItem(SEARCH_CACHE_KEY);
      let cacheEntries: CachedSearchEntry[] = stored ? JSON.parse(stored) : [];

      const targetKey = this.generateCacheKey(filters);
      const existingIdx = cacheEntries.findIndex(e => e.cacheKey === targetKey);

      const newEntry: CachedSearchEntry = {
        cacheKey: targetKey,
        filters: { ...filters },
        results: [...results],
        timestamp: Date.now(),
        resultCount: results.length,
        hitCount: existingIdx >= 0 ? (cacheEntries[existingIdx].hitCount || 1) + 1 : 1
      };

      if (existingIdx >= 0) {
        cacheEntries[existingIdx] = newEntry;
      } else {
        cacheEntries.unshift(newEntry);
      }

      // Keep only most recent MAX_CACHE_ENTRIES entries to prevent quota overflow
      if (cacheEntries.length > MAX_CACHE_ENTRIES) {
        cacheEntries = cacheEntries.slice(0, MAX_CACHE_ENTRIES);
      }

      localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(cacheEntries));
    } catch (e) {
      console.warn('LocalStorage cache write error (quota reached or private mode):', e);
    }
  }

  /**
   * Invalidate search cache when data changes (e.g. new listing, deletion, or manual refresh)
   */
  static invalidateSearchCache() {
    try {
      localStorage.removeItem(SEARCH_CACHE_KEY);
    } catch {
      // ignore
    }
  }

  // ==========================================
  // --- Recent Searches History Subsystem ---
  // ==========================================

  static getRecentSearches(): RecentSearchItem[] {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static saveRecentSearch(
    query: string, 
    filters: Partial<FilterState> = {}, 
    resultCount: number = 0
  ): RecentSearchItem[] {
    const trimmed = (query || '').trim();
    // Do not save completely empty queries with default filters
    if (!trimmed && (!filters.level || filters.level === 'all') && (!filters.wilayaCode || filters.wilayaCode === 0)) {
      return this.getRecentSearches();
    }

    try {
      let recent = this.getRecentSearches();

      // Deduplicate matching query + level + wilaya
      recent = recent.filter(r => {
        const sameQuery = r.query.toLowerCase() === trimmed.toLowerCase();
        const sameLevel = (r.level || 'all') === (filters.level || 'all');
        const sameWilaya = (r.wilayaCode || 0) === (filters.wilayaCode || 0);
        return !(sameQuery && sameLevel && sameWilaya);
      });

      const newItem: RecentSearchItem = {
        id: 'search-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        query: trimmed,
        level: filters.level || 'all',
        wilayaCode: filters.wilayaCode || 0,
        dealType: filters.dealType || 'all',
        timestamp: Date.now(),
        resultCount
      };

      recent.unshift(newItem);

      if (recent.length > MAX_RECENT_SEARCHES) {
        recent = recent.slice(0, MAX_RECENT_SEARCHES);
      }

      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
      return recent;
    } catch {
      return [];
    }
  }

  static removeRecentSearch(id: string): RecentSearchItem[] {
    try {
      let recent = this.getRecentSearches();
      recent = recent.filter(r => r.id !== id);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
      return recent;
    } catch {
      return [];
    }
  }

  static clearRecentSearches(): boolean {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      return true;
    } catch {
      return false;
    }
  }

  // ==========================================
  // --- Persistent Marketplace Filter State ---
  // ==========================================

  static getLastMarketplaceFilters(): FilterState | null {
    try {
      const stored = localStorage.getItem(LAST_FILTERS_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  static saveLastMarketplaceFilters(filters: FilterState) {
    try {
      localStorage.setItem(LAST_FILTERS_KEY, JSON.stringify(filters));
    } catch {
      // ignore
    }
  }

  static getCacheStats(): {
    cachedQueriesCount: number;
    recentSearchesCount: number;
    estimatedSavedKb: number;
    lastCachedAt: number | null;
  } {
    try {
      const storedCache = localStorage.getItem(SEARCH_CACHE_KEY);
      const storedRecent = localStorage.getItem(RECENT_SEARCHES_KEY);

      const cacheEntries: CachedSearchEntry[] = storedCache ? JSON.parse(storedCache) : [];
      const recentEntries: RecentSearchItem[] = storedRecent ? JSON.parse(storedRecent) : [];

      const totalHits = cacheEntries.reduce((acc, c) => acc + (c.hitCount || 1), 0);
      // Rough estimation: each cache hit saves ~15-40 KB of JSON / assets payload
      const estimatedSavedKb = totalHits * 25;
      const lastCachedAt = cacheEntries.length > 0 ? cacheEntries[0].timestamp : null;

      return {
        cachedQueriesCount: cacheEntries.length,
        recentSearchesCount: recentEntries.length,
        estimatedSavedKb,
        lastCachedAt
      };
    } catch {
      return {
        cachedQueriesCount: 0,
        recentSearchesCount: 0,
        estimatedSavedKb: 0,
        lastCachedAt: null
      };
    }
  }
}
