// 使用 @google/genai 包 - 纯 API Key 模式（不使用 Vertex AI）

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

// Create and configure the GenAI client
export function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VERTEX_API_KEY;
  
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }
  
  console.log('Initializing GoogleGenAI Client with API Key (non-Vertex mode)');

  // 直接传入 API Key，不使用 Vertex AI 模式
  return new GoogleGenAI({ apiKey });
}

// Export safety settings for image generation
export const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// Helper to extract text from response
export function extractText(response: any): string {
  return response.text || 
         response.candidates?.[0]?.content?.parts?.[0]?.text || 
         '';
}

// Helper to extract image from response
export function extractImage(response: any): string | null {
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        return part.inlineData.data;
      }
    }
  }
  return null;
}

export { HarmCategory, HarmBlockThreshold };
