export type EducationLevel = 'primary' | 'middle' | 'secondary' | 'university' | 'general';

export type BookCondition = 'new' | 'like_new' | 'good' | 'acceptable';

export type DealType = 'sale' | 'exchange' | 'free';

export interface Wilaya {
  code: number;
  nameAr: string;
  nameFr: string;
  municipalities: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  avatar: string;
  wilayaCode: number;
  municipality: string;
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  isBookstore: boolean;
  bookstoreName?: string;
  joinedDate: string;
  bio?: string;
}

export interface BookListing {
  id: string;
  title: string;
  author?: string;
  publisher?: string;
  year?: number;
  level: EducationLevel;
  grade: string; // e.g. "السنة الثالثة ثانوي"
  gradeCode: string; // e.g. "3as", "4am", "5ap"
  stream?: string; // e.g. "علوم تجريبية", "تقني رياضي"
  subject: string; // e.g. "الرياضيات", "العلوم الفيزيائية"
  condition: BookCondition;
  dealType: DealType;
  price: number; // In Algerian Dinars (DZD / د.ج) - 0 if free or exchange only
  originalPrice?: number;
  exchangeFor?: string; // What book or subject the seller wants in return
  description: string;
  hasPencilMarks?: boolean;
  hasAnswersIncluded?: boolean;
  includesCD?: boolean;
  photos: string[];
  wilayaCode: number;
  wilayaNameAr: string;
  wilayaNameFr: string;
  municipality: string;
  deliveryAvailable: boolean;
  handDeliveryOnly: boolean;
  sellerId: string;
  seller: User;
  createdAt: string;
  views: number;
  favoritesCount: number;
  isFeatured?: boolean;
  status: 'active' | 'reserved' | 'completed' | 'flagged';
}

export interface ExchangeRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar: string;
  requesterPhone: string;
  targetListingId: string;
  targetBookTitle: string;
  targetSellerId: string;
  offeredListingId?: string;
  offeredBookTitle: string;
  offeredBookPhoto?: string;
  message: string;
  wilayaNameAr: string;
  municipality: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  listingId?: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  listingId?: string;
  listingTitle?: string;
  listingPhoto?: string;
  listingPrice?: number;
  dealType?: DealType;
  participant: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export interface ReportItem {
  id: string;
  listingId: string;
  listingTitle: string;
  sellerName: string;
  reporterName: string;
  reason: 'wrong_info' | 'prohibited_item' | 'offensive' | 'fake_account' | 'sold_already' | 'other';
  reasonLabel: string;
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface FilterState {
  searchQuery: string;
  level: EducationLevel | 'all';
  gradeCode: string;
  stream: string;
  subject: string;
  wilayaCode: number | 0; // 0 means all wilayas
  municipality: string;
  dealType: DealType | 'all';
  condition: BookCondition | 'all';
  minPrice: number;
  maxPrice: number;
  onlyFree: boolean;
  onlyExchange: boolean;
  deliveryOnly: boolean;
  sortBy: 'latest' | 'price_asc' | 'price_desc' | 'popular';
}
