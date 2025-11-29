import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kvGet, kvSet } from './lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { index } = req.body;
    const history = (await kvGet('camera_history')) || [];

    if (index >= 0 && index < history.length) {
      history.splice(index, 1);
      await kvSet('camera_history', history);
    }

    return res.status(200).json({ success: true, count: history.length });
  } catch (error: any) {
    console.error('Error deleting history:', error);
    return res.status(500).json({ error: 'Failed to delete history' });
  }
}

