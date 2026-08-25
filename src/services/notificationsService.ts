import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export interface NotificationItem {
  id: string;
  recipient_id: string;
  actor_id?: string | null;
  listing_id?: string | null;
  type: 'favorite' | 'message' | 'exchange' | 'report' | 'listing_status' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export async function getNotifications(userId: string, limit = 30) {
  const { data, error } = await supabase.from('notifications').select('*').eq('recipient_id', userId).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data || []) as NotificationItem[];
}

export async function getUnreadNotificationsCount(userId: string) {
  const { count, error } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('recipient_id', userId).eq('is_read', false);
  if (error) throw error;
  return count || 0;
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', userId).eq('is_read', false);
  if (error) throw error;
}

export async function createNotification(input: Omit<NotificationItem, 'id' | 'created_at' | 'is_read'>) {
  if (input.recipient_id === input.actor_id) return;
  const { error } = await supabase.from('notifications').insert({ ...input, is_read: false });
  if (error) throw error;
}

export function subscribeToNotifications(userId: string, onNotification: (item: NotificationItem) => void): RealtimeChannel {
  return supabase.channel(`notifications:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` }, (payload) => onNotification(payload.new as NotificationItem))
    .subscribe();
}

export async function unsubscribeFromNotifications(channel: RealtimeChannel) {
  await supabase.removeChannel(channel);
}
