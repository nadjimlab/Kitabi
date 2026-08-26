import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { getNotifications, getUnreadNotificationsCount, markAllNotificationsRead, markNotificationRead, NotificationItem, subscribeToNotifications, unsubscribeFromNotifications } from '../services/notificationsService';

interface NotificationBellProps { userId?: string; }
const relativeTime = (date: string) => { const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000); if (minutes < 1) return 'الآن'; if (minutes < 60) return `منذ ${minutes} د`; const hours = Math.floor(minutes / 60); if (hours < 24) return `منذ ${hours} س`; return `منذ ${Math.floor(hours / 24)} ي`; };

export const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!userId) { setItems([]); setUnread(0); return; }
    let active = true;
    const load = async () => { try { const [nextItems, count] = await Promise.all([getNotifications(userId), getUnreadNotificationsCount(userId)]); if (active) { setItems(nextItems); setUnread(count); } } catch (error) { console.error('Notifications load failed', error); } };
    void load();
    const channel = subscribeToNotifications(userId, (item) => { setItems((current) => [item, ...current].slice(0, 30)); setUnread((count) => count + 1); });
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => { active = false; document.removeEventListener('mousedown', close); void unsubscribeFromNotifications(channel); };
  }, [userId]);
  const markRead = async (id: string) => { await markNotificationRead(id); setItems((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item)); setUnread((count) => Math.max(0, count - 1)); };
  const markAll = async () => { if (!userId || unread === 0) return; setLoading(true); try { await markAllNotificationsRead(userId); setItems((current) => current.map((item) => ({ ...item, is_read: true }))); setUnread(0); } finally { setLoading(false); } };
  if (!userId) return null;
  return <div ref={ref} className="relative">
    <button aria-label="الإشعارات" onClick={() => setOpen((value) => !value)} className="relative w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition-colors"><Bell className="w-5 h-5" />{unread > 0 && <span className="absolute -top-1 -left-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-[#0B192C]">{unread > 99 ? '99+' : unread}</span>}</button>
    {open && <div className="absolute left-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between"><div><h3 className="font-black text-sm">الإشعارات</h3><p className="text-[11px] text-slate-400 mt-1">{unread ? `${unread} غير مقروءة` : 'كل شيء محدث'}</p></div><button onClick={markAll} disabled={!unread || loading} className="text-[11px] text-brand-700 font-bold flex items-center gap-1 disabled:opacity-40">{loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}تحديد الكل كمقروء</button></div>
      <div className="max-h-80 overflow-y-auto">{items.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">لا توجد إشعارات بعد</div> : items.map((item) => <button key={item.id} onClick={() => !item.is_read && void markRead(item.id)} className={`w-full text-right p-3.5 border-b border-slate-50 hover:bg-slate-50 flex gap-3 ${!item.is_read ? 'bg-brand-50/50' : ''}`}><span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.is_read ? 'bg-slate-200' : 'bg-brand-500'}`} /><span className="min-w-0"><strong className="block text-xs font-black">{item.title}</strong><span className="block text-xs text-slate-600 mt-1 leading-5">{item.message}</span><small className="block text-[10px] text-slate-400 mt-1">{relativeTime(item.created_at)}</small></span></button>)}</div>
    </div>}
  </div>;
};
