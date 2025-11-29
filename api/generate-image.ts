import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateContent, extractImage, extractText, safetySettings } from './lib/genai';

export const config = {
  maxDuration: 120,
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
    const { description, originalImage, mode, character, userPrompt } = req.body;
    console.log('Generating image... Mode:', mode);

    let promptText =
      mode === 'creative'
        ? `基于以下描述，生成一张充满创意和想象力的照片：${description}`
        : `基于以下描述，生成一张写实的照片：${description}`;

    if (character) {
      promptText += ' CRITICAL: Include the person from the reference photo.';
    }

    if (userPrompt) {
      promptText += `\n\n用户额外要求: ${userPrompt}`;
    }

    const parts: any[] = [];

    // Add character reference image first if provided
    if (character && character.referenceImage) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: character.referenceImage.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
    }

    parts.push({ text: promptText });

    // Add original image for creative/meta modes
    if ((mode === 'creative' || mode === 'meta') && originalImage) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: originalImage.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
    }

    // 调用 Gemini API 生成增强描述
    // 注意：Gemini API 通过 REST 不支持图像生成，只支持图像理解
    const response = await generateContent(
      'gemini-1.5-flash',
      [{ role: 'user', parts }],
      { safetySettings }
    );

    const enhancedDescription = extractText(response);
    console.log('Enhanced description generated');

    // 返回原图 + 增强描述
    // 如果需要真正的图像生成，需要集成其他服务（如 Imagen、DALL-E 等）
    let imageToReturn = originalImage;
    
    if (!imageToReturn && character?.referenceImage) {
      imageToReturn = character.referenceImage;
    }

    return res.status(200).json({
      success: true,
      image: imageToReturn || null,
      description: enhancedDescription || description,
    });

  } catch (error: any) {
    console.error('Error generating image:', error);
    return res.status(500).json({ error: 'Failed to generate image', details: error.message });
  }
}
