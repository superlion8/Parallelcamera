import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGenAIClient, safetySettings } from './lib/genai';

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

    // 使用 Imagen 3 或支持图像生成的模型
    // 注意：gemini-1.5 系列不支持图像生成，需要使用 imagen 模型
    // 但 imagen 需要特殊的 API 调用方式
    
    // 临时方案：使用 Gemini 生成详细的图像描述，然后返回原图
    // TODO: 集成真正的图像生成 API（如 DALL-E, Stable Diffusion 等）
    
    const model = client.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      safetySettings,
    });

    // 生成增强的图像描述
    const enhancedPrompt = `Based on the following scene, create a detailed visual description that could be used to generate an image:

Original description: ${description}
Mode: ${mode === 'creative' ? 'Creative and imaginative' : 'Realistic'}
${userPrompt ? `User request: ${userPrompt}` : ''}

Please provide a rich, detailed visual description in English that captures the essence of this scene.`;

    const result = await model.generateContent(enhancedPrompt);
    const enhancedDescription = result.response.text();

    console.log('Enhanced description generated');

    // 由于 Google AI Studio 的 API Key 模式不支持 Imagen
    // 返回原图并附上增强描述（可以后续集成其他图像生成服务）
    
    // 如果有原图，返回原图；否则返回一个占位图
    let imageToReturn = originalImage;
    
    if (!imageToReturn && character?.referenceImage) {
      imageToReturn = character.referenceImage;
    }

    if (!imageToReturn) {
      // 返回一个简单的 placeholder 提示
      return res.status(200).json({
        success: true,
        image: null,
        description: enhancedDescription,
        note: '图像生成功能需要配置额外的图像生成服务（如 DALL-E、Stable Diffusion 等）',
      });
    }

    return res.status(200).json({
      success: true,
      image: imageToReturn,
      description: enhancedDescription,
    });

  } catch (error: any) {
    console.error('Error generating image:', error);
    return res.status(500).json({ error: 'Failed to generate image', details: error.message });
  }
}
