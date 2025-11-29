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
    const { result } = req.body;

    if (!result) {
      return res.status(400).json({ error: 'Result is required' });
    }

    const history = (await kvGet('camera_history')) || [];
    history.unshift({ ...result, timestamp: Date.now() });
    const trimmedHistory = history.slice(0, 50);
    await kvSet('camera_history', trimmedHistory);

    return res.status(200).json({ success: true, count: trimmedHistory.length });
  } catch (error: any) {
    console.error('Error saving history:', error);
    return res.status(500).json({ error: 'Failed to save history' });
  }
}

