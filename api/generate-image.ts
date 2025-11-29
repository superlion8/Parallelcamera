import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGenAIClient, safetySettings, extractImage, HarmCategory, HarmBlockThreshold } from './lib/genai';

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

    const client = getGenAIClient();

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

    // 使用支持图像生成的模型
    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ role: 'user', parts }],
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      },
    });

    const generatedImageBase64 = extractImage(response);

    if (!generatedImageBase64) {
      // 如果没有生成图像，返回原图
      console.log('No image generated, returning original');
      return res.status(200).json({
        success: true,
        image: originalImage || (character?.referenceImage) || null,
        description: description,
      });
    }

    return res.status(200).json({
      success: true,
      image: `data:image/png;base64,${generatedImageBase64}`,
      description: description,
    });

  } catch (error: any) {
    console.error('Error generating image:', error);
    return res.status(500).json({ error: 'Failed to generate image', details: error.message });
  }
}
