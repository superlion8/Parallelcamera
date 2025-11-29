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
    const { image, location, character } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    console.log('Starting image analysis...');
    const client = getGenAIClient();

    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    let promptText = '请用中文详细描述这张照片。';
    if (location) {
      promptText += `\n\n照片拍摄于坐标: 纬度 ${location.latitude}, 经度 ${location.longitude}。请在描述中自然地融入地理位置信息。`;
    }
    if (character && character.referenceImage) {
      promptText += `\n\n注意：用户希望将名为"${character.name}"的角色融入到场景中。这是该角色的参考照片。在描述中自然地提及这个角色出现在场景中。`;
    }

    const parts: any[] = [
      { text: promptText },
      { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
    ];

    if (character && character.referenceImage) {
      const charBase64 = character.referenceImage.replace(/^data:image\/\w+;base64,/, '');
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: charBase64 } });
    }

    // 使用 client.models.generateContent() 调用方式
    let response;
    try {
      console.log('Attempting to use model: gemini-2.5-flash');
      response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts }],
      });
    } catch (e: any) {
      console.warn(`Primary model failed: ${e.message}`);
      console.log('Falling back to gemini-2.0-flash');
      response = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts }],
      });
    }

    const description = extractText(response);
    console.log('Analysis complete. Length:', description.length);

    return res.status(200).json({ description });
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    return res.status(500).json({ error: 'Failed to analyze image', details: error.message });
  }
}
