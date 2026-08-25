import { supabase } from './supabaseClient';

export interface SellerRating { id: string; reviewer_id: string; seller_id: string; listing_id: string; rating: number; comment: string; created_at: string; }

export async function getSellerRatings(sellerId: string, limit = 10) {
  const { data, error } = await supabase.from('ratings').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data || []) as SellerRating[];
}

export async function submitSellerRating(input: Omit<SellerRating, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('ratings').upsert(input, { onConflict: 'reviewer_id,seller_id,listing_id' }).select().single();
  if (error) throw error;
  return data as SellerRating;
}
