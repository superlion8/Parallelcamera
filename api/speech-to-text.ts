import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGenAIClient, extractText } from './lib/genai';

export const config = {
  maxDuration: 60,
};

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
    const { audio } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'Audio is required' });
    }

    console.log('🎤 Starting speech recognition...');
    const client = getGenAIClient();

    let response;
    try {
      response = await client.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: '请将这段音频转换为文字。只输出识别出的文字内容，不要添加任何其他说明。如果是中文，请输出中文。',
              },
              { inlineData: { mimeType: 'audio/webm', data: audio } },
            ],
          },
        ],
      });
    } catch (e: any) {
      console.warn('STT Primary model failed, falling back to gemini-2.0-flash-exp');
      response = await client.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: '请将这段音频转换为文字。只输出识别出的文字内容，不要添加任何其他说明。如果是中文，请输出中文。',
              },
              { inlineData: { mimeType: 'audio/webm', data: audio } },
            ],
          },
        ],
      });
    }

    const text = extractText(response).trim();
    console.log('📝 STT Result:', text.substring(0, 50));

    return res.status(200).json({ text });
  } catch (error: any) {
    console.error('❌ STT Error:', error);
    return res.status(500).json({ error: 'STT failed', details: error.message });
  }
}

