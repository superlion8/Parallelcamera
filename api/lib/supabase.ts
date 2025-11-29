import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side operations
export function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// KV Store operations using Supabase
const KV_TABLE = 'kv_store';

export async function kvGet(key: string): Promise<any> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(KV_TABLE)
      .select('value')
      .eq('key', key)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('KV Get Error:', error);
      return null;
    }

    return data?.value || null;
  } catch (error) {
    console.error('KV Get Error:', error);
    return null;
  }
}

export async function kvSet(key: string, value: any): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(KV_TABLE)
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      console.error('KV Set Error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('KV Set Error:', error);
    return false;
  }
}

