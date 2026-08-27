import { supabase, isSupabaseConfigured, SUPABASE_BUCKET } from './supabaseClient';
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

const SEARCH_CACHE_KEY = 'ktabi_search_cache_v1';
const RECENT_SEARCHES_KEY = 'ktabi_recent_searches_v1';
const LAST_FILTERS_KEY = 'ktabi_last_filters_v1';
const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_CACHE_ENTRIES = 20;
const MAX_RECENT_SEARCHES = 12;

function asProfileRecord(user: User): Record<string, unknown> {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar, wilaya_code: user.wilayaCode, municipality: user.municipality, rating: user.rating, reviews_count: user.reviewsCount, is_verified: user.isVerified, is_bookstore: user.isBookstore, bookstore_name: user.bookstoreName, joined_date: user.joinedDate, bio: user.bio, role: user.role };
}

export class StorageService {
  private static currentUser: User | null = null;
  private static currentUid: string | null = null;
  private static listingsSnapshot: BookListing[] = [];

  static setAuthUser(userId: string | null, profile: User | null) {
    this.currentUid = userId;
    this.currentUser = profile;
  }

  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  static async updateUserProfile(user: User) {
    if (!isSupabaseConfigured || !this.currentUid || this.currentUid !== user.id) throw new Error('يجب تسجيل الدخول لتعديل هذا الملف الشخصي.');
    const { error } = await supabase.from('profiles').update({
      name: user.name.trim(),
      phone: user.phone.trim(),
      whatsapp: user.whatsapp?.trim() || null,
      municipality: user.municipality.trim(),
      bio: user.bio?.trim() || null,
    }).eq('id', this.currentUid);
    if (error) throw new Error(`تعذر حفظ معلومات الملف الشخصي (${error.code || 'Supabase'}): ${error.message}`);
    this.currentUser = user;
  }

  static async updateListing(listing: BookListing): Promise<BookListing> {
    if (!isSupabaseConfigured || !this.currentUid) throw new Error('يجب تسجيل الدخول قبل تعديل الإعلان.');
    const nextStatus = listing.status === 'active' ? 'pending' : listing.status;
    const row = {
      title: listing.title.trim(),
      author: listing.author?.trim() || null,
      publisher: listing.publisher?.trim() || null,
      publication_year: listing.year || null,
      level: listing.level,
      grade: listing.grade.trim(),
      grade_code: listing.gradeCode.trim(),
      stream: listing.stream?.trim() || null,
      subject: listing.subject.trim(),
      condition: listing.condition,
      deal_type: listing.dealType,
      price: listing.price,
      original_price: listing.originalPrice || null,
      exchange_for: listing.exchangeFor?.trim() || null,
      description: listing.description.trim(),
      updated_at: new Date().toISOString(),
      status: nextStatus,
      reviewed_at: null,
      reviewed_by: null,
      moderation_note: listing.status === 'active' ? 'تم تعديل الإعلان ويحتاج إلى مراجعة جديدة.' : listing.moderationNote || null,
    };
    const { error } = await supabase.from('listings').update(row).eq('id', listing.id).eq('seller_id', this.currentUid);
    if (error) throw error;
    const updated = { ...listing, status: nextStatus, moderationNote: row.moderation_note || undefined };
    this.listingsSnapshot = this.listingsSnapshot.map((item) => item.id === listing.id ? updated : item);
    return updated;
  }

  private static mapSupabaseUser(row: Record<string, unknown>): User {
    const email = String(row.email || '');
    const name = String(row.name || 'مستخدم كتابي');
    return {
      id: String(row.id || ''),
      name,
      email,
      phone: String(row.phone || ''),
      whatsapp: row.whatsapp ? String(row.whatsapp) : undefined,
      avatar: String(row.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0b192c&color=fff`),
      wilayaCode: Number(row.wilaya_code || 16),
      municipality: String(row.municipality || ''),
      rating: Number(row.rating || 0),
      reviewsCount: Number(row.reviews_count || 0),
      isVerified: Boolean(row.is_verified),
      isBookstore: Boolean(row.is_bookstore),
      bookstoreName: row.bookstore_name ? String(row.bookstore_name) : undefined,
      joinedDate: String(row.joined_date || ''),
      bio: row.bio ? String(row.bio) : undefined,
      role: row.role === 'admin' ? 'admin' : 'user',
    };
  }

  static async getAllUsers(): Promise<User[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row) => this.mapSupabaseUser(row as Record<string, unknown>));
  }

  static getAllDemoUsers(): User[] {
    return [];
  }

  static async getListings(): Promise<BookListing[]> {
    if (!isSupabaseConfigured) { this.listingsSnapshot = []; return []; }
    try {
      const listingsQuery = supabase.from('listings').select('*').order('created_at', { ascending: false });
      const viewerId = this.currentUser?.id || this.currentUid;
      const { data, error } = viewerId ? await listingsQuery.or(`status.eq.active,seller_id.eq.${viewerId}`) : await listingsQuery.eq('status', 'active');
      if (error) throw error;
      const rows = data || [];
      const sellerIds = [...new Set(rows.map((row) => String((row as Record<string, unknown>).seller_id || '')).filter(Boolean))];
      const { data: sellers, error: sellersError } = sellerIds.length ? await supabase.from('profiles').select('*').in('id', sellerIds) : { data: [], error: null };
      if (sellersError) throw sellersError;
      const sellerById = new Map((sellers || []).map((seller) => [String(seller.id), seller]));
      const listings = rows.map((row) => {
        const record = row as Record<string, unknown>;
        return this.mapSupabaseListing({ ...record, seller: sellerById.get(String(record.seller_id || '')) || {} });
      });
      this.listingsSnapshot = listings;
      return listings;
    } catch (error) {
      console.warn('Supabase listings read failed', error);
      this.listingsSnapshot = [];
      return [];
    }
  }
  private static mapSupabaseListing(row: Record<string, unknown>): BookListing {
    const sellerRow = (row.seller || {}) as Record<string, unknown>;
    const sellerId = String(row.seller_id || '');
    const seller = ({ id: sellerId, name: String(sellerRow.name || 'مستخدم كتابي'), email: String(sellerRow.email || ''), phone: String(sellerRow.phone || ''), avatar: String(sellerRow.avatar || ''), wilayaCode: Number(sellerRow.wilaya_code || row.wilaya_code || 16), municipality: String(sellerRow.municipality || row.municipality || ''), rating: Number(sellerRow.rating || 0), reviewsCount: Number(sellerRow.reviews_count || 0), isVerified: Boolean(sellerRow.is_verified), isBookstore: Boolean(sellerRow.is_bookstore), joinedDate: String(sellerRow.joined_date || ''), role: (sellerRow.role as User['role']) || 'user' }) as User;
    return { id: String(row.id), title: String(row.title || ''), author: row.author ? String(row.author) : undefined, publisher: row.publisher ? String(row.publisher) : undefined, year: row.publication_year ? Number(row.publication_year) : undefined, level: String(row.level || 'general') as EducationLevel, grade: String(row.grade || ''), gradeCode: String(row.grade_code || ''), stream: row.stream ? String(row.stream) : undefined, subject: String(row.subject || ''), condition: String(row.condition || 'good') as BookListing['condition'], dealType: String(row.deal_type || 'sale') as BookListing['dealType'], price: Number(row.price || 0), originalPrice: row.original_price ? Number(row.original_price) : undefined, exchangeFor: row.exchange_for ? String(row.exchange_for) : undefined, description: String(row.description || ''), photos: Array.isArray(row.photos) ? row.photos as string[] : [], wilayaCode: Number(row.wilaya_code || 16), wilayaNameAr: String(row.wilaya_name_ar || ''), wilayaNameFr: String(row.wilaya_name_fr || ''), municipality: String(row.municipality || ''), deliveryAvailable: Boolean(row.delivery_available), handDeliveryOnly: Boolean(row.hand_delivery_only), hasPencilMarks: Boolean(row.has_pencil_marks), hasAnswersIncluded: Boolean(row.has_answers_included), includesCD: Boolean(row.includes_cd), sellerId, seller, createdAt: String(row.created_at || ''), views: Number(row.views || 0), favoritesCount: Number(row.favorites_count || 0), isFeatured: Boolean(row.is_featured), status: String(row.status || 'active') as BookListing['status'], moderationNote: row.moderation_note ? String(row.moderation_note) : undefined, reviewedAt: row.reviewed_at ? String(row.reviewed_at) : undefined };
  }

  static async getListingById(id: string): Promise<BookListing | undefined> {
    if (!isSupabaseConfigured) return undefined;
    const { data: row, error } = await supabase.from('listings').select('*').eq('id', id).maybeSingle();
    if (error || !row) return undefined;
    const { data: seller } = await supabase.from('profiles').select('*').eq('id', row.seller_id).maybeSingle();
    return this.mapSupabaseListing({ ...(row as Record<string, unknown>), seller: seller || {} });
  }

  static async saveListing(listing: BookListing): Promise<BookListing> {
    if (!isSupabaseConfigured || !this.currentUid) throw new Error('يجب تسجيل الدخول قبل نشر إعلان.');
    const sellerId = this.currentUid;
    const row = { id: listing.id, seller_id: sellerId, title: listing.title.trim(), author: listing.author?.trim() || null, publisher: listing.publisher?.trim() || null, publication_year: listing.year || null, level: listing.level, grade: listing.grade.trim(), grade_code: listing.gradeCode.trim(), stream: listing.stream?.trim() || null, subject: listing.subject.trim(), condition: listing.condition, deal_type: listing.dealType, price: listing.price, original_price: listing.originalPrice || null, exchange_for: listing.exchangeFor?.trim() || null, description: listing.description.trim(), photos: listing.photos, wilaya_code: listing.wilayaCode, wilaya_name_ar: listing.wilayaNameAr, wilaya_name_fr: listing.wilayaNameFr, municipality: listing.municipality, delivery_available: listing.deliveryAvailable, hand_delivery_only: listing.handDeliveryOnly, has_pencil_marks: Boolean(listing.hasPencilMarks), has_answers_included: Boolean(listing.hasAnswersIncluded), includes_cd: Boolean(listing.includesCD), views: 0, favorites_count: 0, is_featured: false, status: 'pending' as const };
    const { data: inserted, error } = await supabase.from('listings').insert(row).select('id').single();
    if (error || !inserted) {
      if (error?.code === '42501') throw new Error(`رفضت سياسة RLS نشر الإعلان. UID الجلسة: ${sellerId}.`);
      throw error || new Error('تعذر حفظ الإعلان في Supabase.');
    }
    const saved = { ...listing, id: String(inserted.id), sellerId, status: 'pending' as const, views: 0, favoritesCount: 0, isFeatured: false };
    this.listingsSnapshot = [saved, ...this.listingsSnapshot.filter((item) => item.id !== listing.id)];
    return saved;
  }

  static async deleteListing(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !this.currentUid) return false;
    const { error } = await supabase.from('listings').delete().eq('id', id).eq('seller_id', this.currentUid);
    if (error) throw error;
    this.listingsSnapshot = this.listingsSnapshot.filter((listing) => listing.id !== id);
    return true;
  }

  static async markListingStatus(id: string, status: BookListing['status']): Promise<boolean> {
    if (!isSupabaseConfigured || !this.currentUid) return false;
    const { error } = await supabase.from('listings').update({ status, updated_at: new Date().toISOString() }).eq('id', id).eq('seller_id', this.currentUid);
    if (error) throw error;
    this.listingsSnapshot = this.listingsSnapshot.map((listing) => (listing.id === id ? { ...listing, status } : listing));
    return true;
  }

  static async incrementView(id: string) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.rpc('increment_listing_views', { p_listing_id: id });
    if (error) console.warn('Supabase view increment failed', error);
  }

  static async uploadBookImage(file: File, listingId: string): Promise<string> {
    const ownerId = this.currentUser?.id || this.currentUid;
    if (!isSupabaseConfigured || !ownerId) throw new Error('يجب تسجيل الدخول لرفع الصور.');
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowedTypes.has(file.type)) throw new Error('يسمح فقط بصور JPG أو PNG أو WebP.');
    if (file.size > 5 * 1024 * 1024) throw new Error('حجم الصورة الأقصى هو 5 ميغابايت.');
    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${ownerId}/${listingId}-${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  static async deleteBookImage(url: string) {
    if (!isSupabaseConfigured) return;
    const marker = `/storage/v1/object/public/${SUPABASE_BUCKET}/`;
    const markerIndex = url.indexOf(marker);
    if (markerIndex < 0) return;
    const path = decodeURIComponent(url.slice(markerIndex + marker.length));
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).remove([path]);
    if (error) console.warn('Supabase image delete skipped', error);
  }

  static async getFavorites(): Promise<string[]> {
    if (!isSupabaseConfigured || !this.currentUid) return [];
    const { data, error } = await supabase.from('favorites').select('listing_id').eq('user_id', this.currentUid);
    if (error) throw error;
    return (data || []).map((row) => String(row.listing_id));
  }

  static async toggleFavorite(listingId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !this.currentUid) throw new Error('يجب تسجيل الدخول لحفظ المفضلة.');
    const { data: existing, error: readError } = await supabase.from('favorites').select('listing_id').eq('user_id', this.currentUid).eq('listing_id', listingId).maybeSingle();
    if (readError) throw readError;
    if (existing) {
      const { error } = await supabase.from('favorites').delete().eq('user_id', this.currentUid).eq('listing_id', listingId);
      if (error) throw error;
      return false;
    }
    const { error } = await supabase.from('favorites').insert({ user_id: this.currentUid, listing_id: listingId });
    if (error) throw error;
    return true;
  }

  private static mapExchangeRequest(row: Record<string, unknown>, requester: Record<string, unknown>, target: Record<string, unknown>, offered: Record<string, unknown> | undefined): ExchangeRequest {
    const targetTitle = String(target.title || row.target_book_title || '');
    return {
      id: String(row.id),
      requesterId: String(row.requester_id),
      requesterName: String(requester.name || 'مستخدم كتابي'),
      requesterAvatar: String(requester.avatar || ''),
      requesterPhone: String(requester.phone || ''),
      targetListingId: String(row.target_listing_id),
      targetBookTitle: targetTitle,
      ownerId: String(row.owner_id),
      offeredListingId: row.offered_listing_id ? String(row.offered_listing_id) : undefined,
      offeredBookTitle: String(offered?.title || row.offered_book_title || ''),
      offeredBookPhoto: Array.isArray(offered?.photos) ? String(offered?.photos[0] || '') : undefined,
      message: String(row.message || ''),
      wilayaNameAr: String(row.wilaya_name_ar || ''),
      municipality: String(row.municipality || ''),
      status: String(row.status || 'pending') as ExchangeRequest['status'],
      createdAt: String(row.created_at || ''),
    };
  }

  static async getExchangeRequests(): Promise<ExchangeRequest[]> {
    if (!isSupabaseConfigured || !this.currentUid) return [];
    const { data: rows, error } = await supabase.from('exchange_requests').select('*').or(`requester_id.eq.${this.currentUid},owner_id.eq.${this.currentUid}`).order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    const requests = rows || [];
    if (!requests.length) return [];
    const profileIds = [...new Set(requests.flatMap((row) => [String(row.requester_id), String(row.owner_id)]))];
    const listingIds = [...new Set(requests.flatMap((row) => [String(row.target_listing_id), row.offered_listing_id ? String(row.offered_listing_id) : '']).filter(Boolean))];
    const [{ data: profiles, error: profilesError }, { data: listings, error: listingsError }] = await Promise.all([
      supabase.from('profiles').select('*').in('id', profileIds),
      supabase.from('listings').select('id,title,photos').in('id', listingIds),
    ]);
    if (profilesError) throw profilesError;
    if (listingsError) throw listingsError;
    const profileById = new Map((profiles || []).map((row) => [String(row.id), row as Record<string, unknown>]));
    const listingById = new Map((listings || []).map((row) => [String(row.id), row as Record<string, unknown>]));
    return requests.map((row) => this.mapExchangeRequest(row as Record<string, unknown>, profileById.get(String(row.requester_id)) || {}, listingById.get(String(row.target_listing_id)) || {}, row.offered_listing_id ? listingById.get(String(row.offered_listing_id)) : undefined));
  }

  static async sendExchangeRequest(req: Omit<ExchangeRequest, 'id' | 'createdAt' | 'status'>): Promise<ExchangeRequest> {
    if (!isSupabaseConfigured || !this.currentUid) throw new Error('يجب تسجيل الدخول لإرسال طلب تبادل.');
    const { data: target, error: targetError } = await supabase.from('listings').select('id,title,seller_id,status').eq('id', req.targetListingId).maybeSingle();
    if (targetError) throw targetError;
    if (!target || target.status !== 'active') throw new Error('هذا الكتاب لم يعد متاحًا للتبادل.');
    const offeredListingId = req.offeredListingId || null;
    let offered: Record<string, unknown> | undefined;
    if (offeredListingId) {
      const { data, error } = await supabase.from('listings').select('id,title,photos,seller_id,status').eq('id', offeredListingId).eq('seller_id', this.currentUid).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('الكتاب المقترح غير موجود ضمن إعلاناتك.');
      offered = data as Record<string, unknown>;
    }
    const insertRow = {
      requester_id: this.currentUid,
      target_listing_id: String(target.id),
      owner_id: String(target.seller_id),
      offered_listing_id: offered ? String(offered.id) : null,
      offered_book_title: String(offered?.title || req.offeredBookTitle || '').trim(),
      message: String(req.message || '').trim().slice(0, 2000),
      wilaya_name_ar: String(this.currentUser?.municipality || req.wilayaNameAr || '').trim(),
      municipality: String(this.currentUser?.municipality || req.municipality || '').trim(),
      status: 'pending',
    };
    const { data: inserted, error } = await supabase.from('exchange_requests').insert(insertRow).select('*').single();
    if (error || !inserted) throw error || new Error('تعذر إرسال طلب التبادل.');
    return this.mapExchangeRequest(inserted as Record<string, unknown>, this.currentUser ? asProfileRecord(this.currentUser) : {}, target as Record<string, unknown>, offered);
  }

  static async updateExchangeRequestStatus(id: string, status: ExchangeRequest['status']): Promise<boolean> {
    if (!isSupabaseConfigured || !this.currentUid || !['accepted', 'rejected', 'completed'].includes(status)) return false;
    const { error } = await supabase.from('exchange_requests').update({ status }).eq('id', id).or(`requester_id.eq.${this.currentUid},owner_id.eq.${this.currentUid}`);
    if (error) throw error;
    return true;
  }

  static async getChats(): Promise<ChatConversation[]> {
    if (!isSupabaseConfigured || !this.currentUid) return [];
    const { data: chatRows, error: chatsError } = await supabase.from('chats').select('*').contains('participant_ids', [this.currentUid]).order('last_message_time', { ascending: false }).limit(50);
    if (chatsError) throw chatsError;
    const chats = chatRows || [];
    if (!chats.length) return [];
    const chatIds = chats.map((row) => String(row.id));
    const participantIds = [...new Set(chats.flatMap((row) => (Array.isArray(row.participant_ids) ? row.participant_ids : []).map(String)))];
    const listingIds = [...new Set(chats.map((row) => row.listing_id ? String(row.listing_id) : '').filter(Boolean))];
    const [{ data: messageRows, error: messagesError }, { data: profiles, error: profilesError }, { data: listings, error: listingsError }] = await Promise.all([
      supabase.from('messages').select('*').in('chat_id', chatIds).order('created_at', { ascending: true }),
      supabase.from('profiles').select('*').in('id', participantIds),
      listingIds.length ? supabase.from('listings').select('id,title,photos,price,deal_type').in('id', listingIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (messagesError) throw messagesError;
    if (profilesError) throw profilesError;
    if (listingsError) throw listingsError;
    const profileById = new Map((profiles || []).map((row) => [String(row.id), row as Record<string, unknown>]));
    const listingById = new Map((listings || []).map((row) => [String(row.id), row as Record<string, unknown>]));
    const messagesByChat = new Map<string, ChatMessage[]>();
    for (const row of messageRows || []) {
      const message: ChatMessage = { id: String(row.id), senderId: String(row.sender_id), receiverId: String(row.receiver_id), listingId: row.listing_id ? String(row.listing_id) : undefined, text: String(row.text || ''), timestamp: String(row.created_at || ''), isRead: Boolean(row.is_read) };
      const list = messagesByChat.get(String(row.chat_id)) || [];
      list.push(message);
      messagesByChat.set(String(row.chat_id), list);
    }
    return chats.map((row) => {
      const ids = Array.isArray(row.participant_ids) ? row.participant_ids.map(String) : [];
      const otherId = ids.find((id) => id !== this.currentUid) || this.currentUid;
      const participant = this.mapSupabaseUser(profileById.get(otherId) || { id: otherId });
      const listing = row.listing_id ? listingById.get(String(row.listing_id)) : undefined;
      return { id: String(row.id), listingId: row.listing_id ? String(row.listing_id) : undefined, listingTitle: listing?.title ? String(listing.title) : undefined, listingPhoto: Array.isArray(listing?.photos) ? String(listing.photos[0] || '') : undefined, listingPrice: listing?.price !== undefined ? Number(listing.price) : undefined, dealType: listing?.deal_type as BookListing['dealType'] | undefined, participant, lastMessage: String(row.last_message || ''), lastMessageTime: String(row.last_message_time || ''), unreadCount: (messagesByChat.get(String(row.id)) || []).filter((message) => message.receiverId === this.currentUid && !message.isRead).length, messages: messagesByChat.get(String(row.id)) || [] };
    });
  }

  static async sendMessage(_conversationId: string, text: string, _senderUser: User, receiverUser: User, listing?: BookListing): Promise<ChatConversation> {
    if (!isSupabaseConfigured || !this.currentUid) throw new Error('يجب تسجيل الدخول لإرسال رسالة.');
    const messageText = text.trim().slice(0, 2000);
    if (!messageText) throw new Error('لا يمكن إرسال رسالة فارغة.');
    if (!receiverUser.id || receiverUser.id === this.currentUid) throw new Error('المستلم غير صالح.');
    const { data: existingRows, error: existingError } = await supabase.from('chats').select('*').contains('participant_ids', [this.currentUid, receiverUser.id]).order('last_message_time', { ascending: false }).limit(1);
    if (existingError) throw existingError;
    let chat = existingRows?.[0] as Record<string, unknown> | undefined;
    const timestamp = new Date().toISOString();
    if (!chat) {
      const { data: created, error } = await supabase.from('chats').insert({ listing_id: listing?.id || null, participant_ids: [this.currentUid, receiverUser.id], last_message: messageText, last_message_time: timestamp }).select('*').single();
      if (error || !created) throw error || new Error('تعذر إنشاء المحادثة.');
      chat = created as Record<string, unknown>;
    }
    const { data: insertedMessage, error: messageError } = await supabase.from('messages').insert({ chat_id: String(chat.id), sender_id: this.currentUid, receiver_id: receiverUser.id, listing_id: listing?.id || (chat.listing_id ? String(chat.listing_id) : null), text: messageText, is_read: false }).select('*').single();
    if (messageError || !insertedMessage) throw messageError || new Error('تعذر إرسال الرسالة.');
    const { error: updateError } = await supabase.from('chats').update({ last_message: messageText, last_message_time: timestamp }).eq('id', String(chat.id));
    if (updateError) throw updateError;
    const message: ChatMessage = { id: String(insertedMessage.id), senderId: this.currentUid, receiverId: receiverUser.id, listingId: insertedMessage.listing_id ? String(insertedMessage.listing_id) : undefined, text: messageText, timestamp: String(insertedMessage.created_at || timestamp), isRead: false };
    return { id: String(chat.id), listingId: listing?.id || (chat.listing_id ? String(chat.listing_id) : undefined), listingTitle: listing?.title, listingPhoto: listing?.photos?.[0], listingPrice: listing?.price, dealType: listing?.dealType, participant: receiverUser, lastMessage: messageText, lastMessageTime: timestamp, unreadCount: 0, messages: [message] };
  }

  private static mapReport(row: Record<string, unknown>, listing: Record<string, unknown>, reporter: Record<string, unknown>): ReportItem {
    const labels: Record<string, string> = { wrong_info: 'معلومات خاطئة', prohibited_item: 'محتوى ممنوع', offensive: 'محتوى مسيء', fake_account: 'حساب وهمي', sold_already: 'تم البيع مسبقًا', other: 'سبب آخر' };
    const reason = String(row.reason || 'other') as ReportItem['reason'];
    return { id: String(row.id), listingId: String(row.listing_id), listingTitle: String(listing.title || ''), sellerName: String(listing.seller_name || ''), reporterName: String(reporter.name || 'مستخدم كتابي'), reason, reasonLabel: labels[reason] || labels.other, details: String(row.details || ''), status: String(row.status || 'pending') as ReportItem['status'], createdAt: String(row.created_at || ''), reporterId: row.reporter_id ? String(row.reporter_id) : undefined };
  }

  static async getReports(): Promise<ReportItem[]> {
    if (!isSupabaseConfigured || !this.currentUid) return [];
    const { data: rows, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    const reports = rows || [];
    if (!reports.length) return [];
    const listingIds = [...new Set(reports.map((row) => String(row.listing_id)))];
    const reporterIds = [...new Set(reports.map((row) => String(row.reporter_id)))];
    const [{ data: listings, error: listingsError }, { data: reporters, error: reportersError }] = await Promise.all([
      supabase.from('listings').select('id,title,seller_id').in('id', listingIds),
      supabase.from('profiles').select('id,name').in('id', reporterIds),
    ]);
    if (listingsError) throw listingsError;
    if (reportersError) throw reportersError;
    const listingById = new Map((listings || []).map((row) => [String(row.id), row as Record<string, unknown>]));
    const reporterById = new Map((reporters || []).map((row) => [String(row.id), row as Record<string, unknown>]));
    return reports.map((row) => this.mapReport(row as Record<string, unknown>, listingById.get(String(row.listing_id)) || {}, reporterById.get(String(row.reporter_id)) || {}));
  }

  static async submitReport(report: Omit<ReportItem, 'id' | 'status' | 'createdAt'>): Promise<ReportItem> {
    if (!isSupabaseConfigured || !this.currentUid) throw new Error('يجب تسجيل الدخول لإرسال بلاغ.');
    const validReasons = new Set<ReportItem['reason']>(['wrong_info', 'prohibited_item', 'offensive', 'fake_account', 'sold_already', 'other']);
    if (!validReasons.has(report.reason)) throw new Error('سبب البلاغ غير صالح.');
    const { data: listing, error: listingError } = await supabase.from('listings').select('id,title,seller_id').eq('id', report.listingId).maybeSingle();
    if (listingError) throw listingError;
    if (!listing) throw new Error('الإعلان غير موجود.');
    const { data: inserted, error } = await supabase.from('reports').insert({ listing_id: String(listing.id), reporter_id: this.currentUid, reason: report.reason, details: String(report.details || '').trim().slice(0, 2000), status: 'pending' }).select('*').single();
    if (error || !inserted) throw error || new Error('تعذر إرسال البلاغ.');
    return this.mapReport(inserted as Record<string, unknown>, listing as Record<string, unknown>, this.currentUser ? asProfileRecord(this.currentUser) : {});
  }

  static async resolveReport(id: string, action: 'resolved' | 'dismissed'): Promise<boolean> {
    if (!isSupabaseConfigured || !this.currentUid) return false;
    const { error } = await supabase.from('reports').update({ status: action }).eq('id', id);
    if (error) throw error;
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
    const estimatedSavingsDZD = listings.reduce((total, listing) => listing.dealType === 'free' ? total + (listing.originalPrice || 600) : listing.dealType === 'exchange' ? total + 800 : total + Math.max(0, (listing.originalPrice || 0) - (listing.price || 0)), 0);
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
