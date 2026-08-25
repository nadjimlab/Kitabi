import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { User as FirebaseUser } from 'firebase/auth';
import { db, isFirebaseConfigured, storage } from '../lib/firebase';
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
  CachedSearchEntry,
} from '../types';
import { INITIAL_LISTINGS, INITIAL_USERS } from '../data/algerianData';

const SEARCH_CACHE_KEY = 'ktabi_search_cache_v1';
const RECENT_SEARCHES_KEY = 'ktabi_recent_searches_v1';
const LAST_FILTERS_KEY = 'ktabi_last_filters_v1';
const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_CACHE_ENTRIES = 20;
const MAX_RECENT_SEARCHES = 12;

function asRecord<T extends object>(value: T) {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function formatNow() {
  return new Date().toLocaleString('ar-DZ', { dateStyle: 'medium', timeStyle: 'short' });
}

function firestoreReady() {
  return Boolean(isFirebaseConfigured && db);
}

function firebaseReady() {
  return Boolean(firestoreReady() && storage);
}

export class StorageService {
  private static currentUser: User | null = null;
  private static currentUid: string | null = null;
  private static listingsSnapshot: BookListing[] = INITIAL_LISTINGS;

  static setAuthUser(firebaseUser: FirebaseUser | null, profile: User | null) {
    this.currentUid = firebaseUser?.uid ?? null;
    this.currentUser = profile;
  }

  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  static async getOrCreateUserProfile(firebaseUser: FirebaseUser): Promise<User> {
    if (!firestoreReady() || !db) throw new Error('Firebase غير مهيأ.');
    const userRef = doc(db, 'users', firebaseUser.uid);
    const snapshot = await getDoc(userRef);
    const stored = snapshot.exists() ? snapshot.data() : {};
    const defaults: User = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'مستخدم كتابي',
      email: firebaseUser.email || '',
      phone: firebaseUser.phoneNumber || '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.email || firebaseUser.uid)}&background=0b192c&color=fff`,
      wilayaCode: 16,
      municipality: 'الجزائر الوسطى',
      rating: 5,
      reviewsCount: 0,
      isVerified: true,
      isBookstore: false,
      joinedDate: new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long' }),
      bio: '',
      role: 'user',
    };

    if (snapshot.exists()) {
      const profile = { ...defaults, ...stored, id: firebaseUser.uid, email: String(stored.email || defaults.email) } as User;
      this.currentUser = profile;
      return profile;
    }

    const profile: User = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'مستخدم كتابي',
      email: firebaseUser.email || '',
      phone: firebaseUser.phoneNumber || '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.phoneNumber || 'K')}&background=0b192c&color=fff`,
      wilayaCode: 16,
      municipality: 'الجزائر الوسطى',
      rating: 5,
      reviewsCount: 0,
      isVerified: true,
      isBookstore: false,
      joinedDate: new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long' }),
      bio: '',
      role: 'user',
    };
    await setDoc(userRef, profile);
    this.currentUser = profile;
    return profile;
  }

  static async updateUserProfile(user: User) {
    if (!firestoreReady() || !db || !this.currentUid) return;
    await setDoc(doc(db, 'users', this.currentUid), asRecord(user), { merge: true });
    this.currentUser = user;
  }

  static async getAllUsers(): Promise<User[]> {
    if (!firestoreReady() || !db || !this.currentUid) return [];
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as User);
  }

  static getAllDemoUsers(): User[] {
    return [];
  }

  static async getListings(): Promise<BookListing[]> {
    if (!firestoreReady() || !db) {
      this.listingsSnapshot = INITIAL_LISTINGS;
      return INITIAL_LISTINGS;
    }
    try {
      const snapshot = await getDocs(collection(db, 'listings'));
      const listings = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as BookListing);
      this.listingsSnapshot = listings.length > 0 ? listings : INITIAL_LISTINGS;
      return this.listingsSnapshot;
    } catch (error) {
      console.error('Firestore listings read failed', error);
      this.listingsSnapshot = INITIAL_LISTINGS;
      return INITIAL_LISTINGS;
    }
  }

  static async getListingById(id: string): Promise<BookListing | undefined> {
    if (!firestoreReady() || !db) return this.listingsSnapshot.find((listing) => listing.id === id);
    const snapshot = await getDoc(doc(db, 'listings', id));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as BookListing) : undefined;
  }

  static async saveListing(listing: BookListing): Promise<BookListing> {
    if (!firestoreReady() || !db || !this.currentUid) throw new Error('يجب تسجيل الدخول قبل نشر إعلان.');
    await setDoc(doc(db, 'listings', listing.id), {
      ...asRecord(listing),
      sellerId: this.currentUid,
      updatedAt: formatNow(),
    });
    this.listingsSnapshot = [listing, ...this.listingsSnapshot.filter((item) => item.id !== listing.id)];
    return listing;
  }

  static async deleteListing(id: string): Promise<boolean> {
    if (!firestoreReady() || !db || !this.currentUid) return false;
    await deleteDoc(doc(db, 'listings', id));
    this.listingsSnapshot = this.listingsSnapshot.filter((listing) => listing.id !== id);
    return true;
  }

  static async markListingStatus(id: string, status: BookListing['status']): Promise<boolean> {
    if (!firestoreReady() || !db || !this.currentUid) return false;
    await updateDoc(doc(db, 'listings', id), { status, updatedAt: formatNow() });
    this.listingsSnapshot = this.listingsSnapshot.map((listing) => (listing.id === id ? { ...listing, status } : listing));
    return true;
  }

  static async incrementView(id: string) {
    if (!firestoreReady() || !db) return;
    await updateDoc(doc(db, 'listings', id), { views: increment(1) });
  }

  static async uploadBookImage(file: File, listingId: string): Promise<string> {
    if (!firebaseReady() || !storage || !this.currentUid) throw new Error('يجب تسجيل الدخول لرفع الصور.');
    if (!file.type.startsWith('image/')) throw new Error('يسمح برفع الصور فقط.');
    if (file.size > 5 * 1024 * 1024) throw new Error('حجم الصورة الأقصى هو 5 ميغابايت.');
    const extension = file.name.split('.').pop() || 'jpg';
    const imageRef = ref(storage, `book-covers/${this.currentUid}/${listingId}-${crypto.randomUUID()}.${extension}`);
    await uploadBytes(imageRef, file, { contentType: file.type, customMetadata: { ownerId: this.currentUid } });
    return getDownloadURL(imageRef);
  }

  static async deleteBookImage(url: string) {
    if (!firebaseReady() || !storage) return;
    try {
      await deleteObject(ref(storage, url));
    } catch (error) {
      console.warn('Storage image delete skipped', error);
    }
  }

  static async getFavorites(): Promise<string[]> {
    if (!firestoreReady() || !db || !this.currentUid) return [];
    const snapshot = await getDocs(collection(db, 'users', this.currentUid, 'favorites'));
    return snapshot.docs.map((item) => item.id);
  }

  static async toggleFavorite(listingId: string): Promise<boolean> {
    if (!firestoreReady() || !db || !this.currentUid) throw new Error('يجب تسجيل الدخول لحفظ المفضلة.');
    const favoriteRef = doc(db, 'users', this.currentUid, 'favorites', listingId);
    const listingRef = doc(db, 'listings', listingId);
    let isNowFavorite = false;
    await runTransaction(db, async (transaction) => {
      const favorite = await transaction.get(favoriteRef);
      isNowFavorite = !favorite.exists();
      if (favorite.exists()) {
        transaction.delete(favoriteRef);
        transaction.update(listingRef, { favoritesCount: increment(-1) });
      } else {
        transaction.set(favoriteRef, { listingId, createdAt: formatNow() });
        transaction.update(listingRef, { favoritesCount: increment(1) });
      }
    });
    return isNowFavorite;
  }

  static async getExchangeRequests(): Promise<ExchangeRequest[]> {
    if (!firestoreReady() || !db || !this.currentUid) return [];
    const requesterQuery = query(collection(db, 'exchangeRequests'), where('requesterId', '==', this.currentUid));
    const sellerQuery = query(collection(db, 'exchangeRequests'), where('ownerId', '==', this.currentUid));
    const [requesterSnapshot, sellerSnapshot] = await Promise.all([getDocs(requesterQuery), getDocs(sellerQuery)]);
    const byId = new Map<string, ExchangeRequest>();
    [...requesterSnapshot.docs, ...sellerSnapshot.docs].forEach((item) => byId.set(item.id, { id: item.id, ...item.data() } as ExchangeRequest));
    return [...byId.values()].sort((a, b) => b.id.localeCompare(a.id));
  }

  static async sendExchangeRequest(req: Omit<ExchangeRequest, 'id' | 'createdAt' | 'status'>): Promise<ExchangeRequest> {
    if (!firestoreReady() || !db || !this.currentUid) throw new Error('يجب تسجيل الدخول لإرسال طلب تبادل.');
    const requestRef = doc(collection(db, 'exchangeRequests'));
    const newRequest: ExchangeRequest = { ...req, id: requestRef.id, requesterId: this.currentUid, status: 'pending', createdAt: formatNow() };
    await setDoc(requestRef, asRecord(newRequest));
    return newRequest;
  }

  static async updateExchangeRequestStatus(id: string, status: ExchangeRequest['status']): Promise<boolean> {
    if (!firestoreReady() || !db || !this.currentUid) return false;
    await updateDoc(doc(db, 'exchangeRequests', id), { status, updatedAt: formatNow() });
    return true;
  }

  static async getChats(): Promise<ChatConversation[]> {
    if (!firestoreReady() || !db || !this.currentUid) return [];
    const chatsQuery = query(collection(db, 'chats'), where('participantIds', 'array-contains', this.currentUid), limit(50));
    const snapshot = await getDocs(chatsQuery);
    const conversations = snapshot.docs.map((item) => {
      const data = item.data() as Omit<ChatConversation, 'messages'> & { participantIds: string[]; messages?: ChatMessage[] };
      return { id: item.id, ...data, messages: data.messages || [] } as ChatConversation;
    });
    return conversations.sort((a, b) => b.lastMessageTime.localeCompare(a.lastMessageTime));
  }

  static async sendMessage(conversationId: string, text: string, senderUser: User, receiverUser: User, listing?: BookListing): Promise<ChatConversation> {
    if (!firestoreReady() || !db || !this.currentUid) throw new Error('يجب تسجيل الدخول لإرسال رسالة.');
    const conversationRef = doc(db, 'chats', conversationId);
    const timestamp = formatNow();
    const messageId = `${this.currentUid}-${Date.now()}`;
    const newMessage: ChatMessage = { id: messageId, senderId: senderUser.id, receiverId: receiverUser.id, listingId: listing?.id, text: text.trim(), timestamp, isRead: false };
    const conversation: Omit<ChatConversation, 'messages'> & { participantIds: string[] } = {
      id: conversationId,
      participantIds: [senderUser.id, receiverUser.id],
      listingId: listing?.id,
      listingTitle: listing?.title,
      listingPhoto: listing?.photos?.[0],
      listingPrice: listing?.price,
      dealType: listing?.dealType,
      participant: receiverUser,
      lastMessage: newMessage.text,
      lastMessageTime: timestamp,
      unreadCount: 0,
    };
    await setDoc(conversationRef, { ...asRecord(conversation), messages: arrayUnion(asRecord(newMessage)) }, { merge: true });
    return { ...conversation, messages: [newMessage] } as ChatConversation;
  }

  static async getReports(): Promise<ReportItem[]> {
    if (!firestoreReady() || !db || !this.currentUid) return [];
    try {
      const snapshot = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(100)));
      return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ReportItem);
    } catch {
      return [];
    }
  }

  static async submitReport(report: Omit<ReportItem, 'id' | 'status' | 'createdAt'>): Promise<ReportItem> {
    if (!firestoreReady() || !db || !this.currentUid) throw new Error('يجب تسجيل الدخول لإرسال بلاغ.');
    const reportRef = doc(collection(db, 'reports'));
    const newReport: ReportItem = { ...report, id: reportRef.id, reporterId: this.currentUid, status: 'pending', createdAt: formatNow() } as ReportItem;
    await setDoc(reportRef, asRecord(newReport));
    return newReport;
  }

  static async resolveReport(id: string, action: 'resolved' | 'dismissed'): Promise<boolean> {
    if (!firestoreReady() || !db || !this.currentUid) return false;
    await updateDoc(doc(db, 'reports', id), { status: action, resolvedAt: formatNow(), resolvedBy: this.currentUid });
    return true;
  }

  static filterListings(listings: BookListing[], filters: FilterState): BookListing[] {
    return listings.filter((item) => {
      if (item.status === 'flagged') return false;
      const q = filters.searchQuery.toLowerCase().trim();
      if (q && ![item.title, item.description, item.subject, item.grade, item.stream || '', item.wilayaNameAr, item.wilayaNameFr].some((value) => value.toLowerCase().includes(q))) return false;
      if (filters.level !== 'all' && item.level !== filters.level) return false;
      if (filters.gradeCode && item.gradeCode !== filters.gradeCode) return false;
      if (filters.stream && item.stream && !item.stream.includes(filters.stream)) return false;
      if (filters.subject && !item.subject.includes(filters.subject)) return false;
      if (filters.wilayaCode !== 0 && item.wilayaCode !== filters.wilayaCode) return false;
      if (filters.municipality && item.municipality !== filters.municipality) return false;
      if (filters.dealType !== 'all' && item.dealType !== filters.dealType) return false;
      if (filters.onlyFree && item.dealType !== 'free') return false;
      if (filters.onlyExchange && item.dealType !== 'exchange') return false;
      if (filters.condition !== 'all' && item.condition !== filters.condition) return false;
      if (filters.deliveryOnly && !item.deliveryAvailable) return false;
      if (item.dealType === 'sale' && ((filters.minPrice > 0 && item.price < filters.minPrice) || (filters.maxPrice < 5000 && item.price > filters.maxPrice))) return false;
      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price_asc') return a.price - b.price;
      if (filters.sortBy === 'price_desc') return b.price - a.price;
      if (filters.sortBy === 'popular') return (b.views + b.favoritesCount * 3) - (a.views + a.favoritesCount * 3);
      return 0;
    });
  }

  static findExchangeMatches(haveSubject: string, haveLevel: EducationLevel, wantSubject: string, wantLevel: EducationLevel, userWilaya?: number, listings: BookListing[] = this.listingsSnapshot) {
    return listings.filter((listing) => listing.status === 'active').map((listing) => {
      let score = listing.dealType === 'exchange' ? 30 : 0;
      const reasons: string[] = [];
      if (listing.level === wantLevel) {
        score += 25;
        if (wantSubject && listing.subject.includes(wantSubject)) { score += 30; reasons.push(`يقدم مادة ${listing.subject} التي تبحث عنها`); }
      }
      if (listing.exchangeFor && haveSubject && listing.exchangeFor.includes(haveSubject)) { score += 35; reasons.push(`صاحب الإعلان يبحث بالتحديد عن: "${haveSubject}"!`); }
      if (userWilaya && listing.wilayaCode === userWilaya) { score += 20; reasons.push(`في نفس ولايتك (${listing.wilayaNameAr})`); }
      return { listing, matchScore: Math.min(100, score), reasons };
    }).filter((match) => match.matchScore >= 40).sort((a, b) => b.matchScore - a.matchScore);
  }

  static getPlatformStats(listings: BookListing[] = this.listingsSnapshot) {
    const totalBooks = listings.length;
    const activeExchanges = listings.filter((listing) => listing.dealType === 'exchange').length;
    const freeDonations = listings.filter((listing) => listing.dealType === 'free').length;
    const estimatedSavingsDZD = listings.reduce((total, listing) => listing.dealType === 'free' ? total + (listing.originalPrice || 600) : listing.dealType === 'exchange' ? total + 800 : total + Math.max(0, (listing.originalPrice || 0) - (listing.price || 0)), 184500);
    return { totalBooks, activeExchanges, freeDonations, estimatedSavingsDZD, activeWilayasCount: new Set(listings.map((listing) => listing.wilayaCode)).size };
  }

  static generateCacheKey(filters: FilterState) { return JSON.stringify(filters); }

  static getCachedSearchResults(filters: FilterState): { results: BookListing[]; timestamp: number; hitCount: number; resultCount: number; isCacheValid: boolean } | null {
    try {
      const entries = JSON.parse(localStorage.getItem(SEARCH_CACHE_KEY) || '[]') as CachedSearchEntry[];
      const index = entries.findIndex((entry) => entry.cacheKey === this.generateCacheKey(filters));
      if (index < 0) return null;
      const entry = entries[index];
      if (Date.now() - entry.timestamp > CACHE_TTL_MS) { entries.splice(index, 1); localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(entries)); return null; }
      entry.hitCount = (entry.hitCount || 1) + 1;
      localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(entries));
      return { ...entry, isCacheValid: true };
    } catch { return null; }
  }

  static setCachedSearchResults(filters: FilterState, results: BookListing[]) {
    try {
      const entries = JSON.parse(localStorage.getItem(SEARCH_CACHE_KEY) || '[]') as CachedSearchEntry[];
      const cacheKey = this.generateCacheKey(filters);
      const previous = entries.find((entry) => entry.cacheKey === cacheKey);
      const next: CachedSearchEntry = { cacheKey, filters: { ...filters }, results, timestamp: Date.now(), resultCount: results.length, hitCount: previous ? previous.hitCount + 1 : 1 };
      const nextEntries = [next, ...entries.filter((entry) => entry.cacheKey !== cacheKey)].slice(0, MAX_CACHE_ENTRIES);
      localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(nextEntries));
    } catch { /* local cache is optional */ }
  }

  static invalidateSearchCache() { localStorage.removeItem(SEARCH_CACHE_KEY); }

  static getRecentSearches(): RecentSearchItem[] {
    try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]') as RecentSearchItem[]; } catch { return []; }
  }

  static saveRecentSearch(queryText: string, filters: Partial<FilterState> = {}, resultCount = 0): RecentSearchItem[] {
    const queryTextTrimmed = (queryText || '').trim();
    if (!queryTextTrimmed && (!filters.level || filters.level === 'all') && (!filters.wilayaCode || filters.wilayaCode === 0)) return this.getRecentSearches();
    const current = this.getRecentSearches().filter((item) => !(item.query.toLowerCase() === queryTextTrimmed.toLowerCase() && (item.level || 'all') === (filters.level || 'all') && (item.wilayaCode || 0) === (filters.wilayaCode || 0)));
    const next = [{ id: `search-${Date.now()}`, query: queryTextTrimmed, level: filters.level || 'all', wilayaCode: filters.wilayaCode || 0, dealType: filters.dealType || 'all', timestamp: Date.now(), resultCount }, ...current].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    return next;
  }

  static removeRecentSearch(id: string) { const next = this.getRecentSearches().filter((item) => item.id !== id); localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)); return next; }
  static clearRecentSearches() { localStorage.removeItem(RECENT_SEARCHES_KEY); return true; }
  static getLastMarketplaceFilters(): FilterState | null { try { return JSON.parse(localStorage.getItem(LAST_FILTERS_KEY) || 'null') as FilterState | null; } catch { return null; } }
  static saveLastMarketplaceFilters(filters: FilterState) { localStorage.setItem(LAST_FILTERS_KEY, JSON.stringify(filters)); }
  static getCacheStats() { const cache = JSON.parse(localStorage.getItem(SEARCH_CACHE_KEY) || '[]') as CachedSearchEntry[]; const recent = this.getRecentSearches(); return { cachedQueriesCount: cache.length, recentSearchesCount: recent.length, estimatedSavedKb: cache.reduce((sum, item) => sum + (item.hitCount || 1), 0) * 25, lastCachedAt: cache[0]?.timestamp || null }; }
}
