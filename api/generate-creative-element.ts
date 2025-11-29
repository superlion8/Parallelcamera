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
    const { description } = req.body;
    const client = getGenAIClient();

    const prompt = `基于以下场景描述，请添加一个脑洞大开、富有创意和想象力的元素。这个元素应该：
1. 与原场景形成有趣的对比或融合
2. 具有超现实或奇幻的特点
3. 能够激发观者的想象力

请直接描述这个创意元素，不要解释为什么选择它。用2-3句话描述即可。

原始描述: ${description}`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const creativeElement = extractText(response).trim();
    return res.status(200).json({ creativeElement });
  } catch (error: any) {
    console.error('Error generating creative element:', error);
    return res.status(500).json({ error: 'Failed', details: error.message });
  }
}
