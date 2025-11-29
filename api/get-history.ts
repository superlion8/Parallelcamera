import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kvGet } from './lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const historyData = await kvGet('camera_history');
    return res.status(200).json({ history: historyData || [] });
  } catch (error: any) {
    console.error('Error fetching history:', error);
    return res.status(500).json({ error: 'Failed to fetch history', history: [] });
  }
}

