import React, { useState, useEffect, useRef } from 'react';
import { X, Send, BookOpen, CheckCheck, MapPin, Phone, MessageSquare } from 'lucide-react';
import { User, BookListing, ChatConversation } from '../types';
import { StorageService } from '../services/storageService';

interface ChatMessengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  targetUser: User | null;
  targetBook?: BookListing | null;
  lang: 'ar' | 'fr';
}

export const ChatMessengerModal: React.FC<ChatMessengerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetUser,
  targetBook,
  lang
}) => {
  const [inputText, setInputText] = useState('');
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const convId = targetUser ? `chat-${[currentUser.id, targetUser.id].sort().join('-')}` : '';

  useEffect(() => {
    if (isOpen && targetUser) {
      const chats = StorageService.getChats();
      let conv = chats.find(c => c.id === convId);
      if (!conv) {
        // Create initial
        conv = {
          id: convId,
          listingId: targetBook?.id,
          listingTitle: targetBook?.title,
          listingPhoto: targetBook?.photos[0],
          listingPrice: targetBook?.price,
          dealType: targetBook?.dealType,
          participant: targetUser,
          lastMessage: 'مرحباً، بدأت المحادثة',
          lastMessageTime: 'الآن',
          unreadCount: 0,
          messages: [
            {
              id: `init-${Date.now()}`,
              senderId: targetUser.id,
              receiverId: currentUser.id,
              text: `مرحباً أخي، شكراً لاهتمامك. الكتاب ${targetBook ? `"${targetBook.title}"` : ''} متوفر للتسليم.`,
              timestamp: '10:00',
              isRead: true
            }
          ]
        };
      }
      setConversation(conv);
    }
  }, [isOpen, targetUser, convId, targetBook]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  if (!isOpen || !targetUser) return null;

  const handleSend = (textToSend?: string) => {
    const txt = textToSend || inputText;
    if (!txt.trim()) return;

    const updated = StorageService.sendMessage(
      convId,
      txt.trim(),
      currentUser,
      targetUser,
      targetBook || undefined
    );
    setConversation({ ...updated });
    setInputText('');

    // Simulate quick realistic seller auto-reply after 1.2s if this is a first prompt
    setTimeout(() => {
      const replyOptions = [
        "وعليكم السلام، نعم الكتاب ما زال متوفراً وبحالة جيدة جداً.",
        "أهلاً وسهلاً، يمكننا اللقاء غداً بعد الظهر إن شاء الله للتسليم يداً بيد.",
        "موافق أخي الكريم، اتصل بي على رقمي للتنسيق الدقيق للمكان."
      ];
      const randomReply = replyOptions[Math.floor(Math.random() * replyOptions.length)];
      const botUpdated = StorageService.sendMessage(
        convId,
        randomReply,
        targetUser,
        currentUser,
        targetBook || undefined
      );
      setConversation({ ...botUpdated });
    }, 1400);
  };

  const quickReplies = [
    "السلام عليكم، هل الكتاب ما زال متوفر؟",
    "هل يمكن التسليم في وسط المدينة؟",
    "أنا موافق على السعر، متى نلتقي؟",
    "هل الحلول كاملة ومكتوبة بوضوح؟"
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      
      <div 
        id="chat-messenger-modal"
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[85vh] max-h-[650px]"
      >
        
        {/* Chat Header */}
        <div className="bg-[#0B192C] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={targetUser.avatar}
                alt={targetUser.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0B192C]"></span>
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>{targetUser.name}</span>
                {targetUser.isVerified && <span className="text-[10px] text-emerald-400">✓ موثوق</span>}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>{targetUser.municipality}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Listing preview banner if chat is about a book */}
        {targetBook && (
          <div className="bg-emerald-50/70 px-4 py-2 border-b border-emerald-100 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 truncate">
              <img src={targetBook.photos[0]} alt="" className="w-7 h-9 rounded object-cover shrink-0" />
              <div className="truncate">
                <span className="font-bold text-slate-900 block truncate">{targetBook.title}</span>
                <span className="text-[10px] text-emerald-800 font-semibold">
                  {targetBook.price ? `${targetBook.price} د.ج` : (targetBook.dealType === 'exchange' ? 'للتبادل 🔄' : 'مجاني 🎁')}
                </span>
              </div>
            </div>
            <a
              href={`tel:${targetUser.phone}`}
              className="px-2 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 shrink-0 ml-2"
            >
              <Phone className="w-3 h-3" />
              <span>اتصال</span>
            </a>
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
          {conversation?.messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-sm ${
                    isMe
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                    <span>{msg.timestamp}</span>
                    {isMe && <CheckCheck className="w-3 h-3" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Algerian reply chips */}
        <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {quickReplies.map((qr, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(qr)}
              className="text-[11px] font-semibold bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs whitespace-nowrap transition-colors"
            >
              {qr}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={lang === 'ar' ? 'اكتب رسالتك للبائع...' : 'Votre message...'}
            className="flex-1 bg-slate-100 text-slate-900 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white p-2.5 rounded-xl shadow transition-all active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4 rtl:rotate-180" />
          </button>
        </form>

      </div>
    </div>
  );
};
