// 使用 @google/genai 包调用 Vertex AI
// 参考文档: https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstart?usertype=apikey

// 注意：需要设置以下环境变量：
// - GEMINI_API_KEY: API 密钥
// - GOOGLE_GENAI_USE_VERTEXAI: true (启用 Vertex AI 模式)

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

// 在模块加载时设置环境变量（Vercel Serverless 需要这样做）
function setupEnvironment() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VERTEX_API_KEY;
  
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }
  
  // 设置 SDK 需要的环境变量
  process.env.GEMINI_API_KEY = apiKey;
  process.env.GOOGLE_GENAI_USE_VERTEXAI = 'true';
  
  console.log('Environment configured for Vertex AI with API Key');
}

// Create and configure the GenAI client
export function getGenAIClient() {
  setupEnvironment();
  
  console.log('Initializing GoogleGenAI Client (Vertex AI mode via env vars)');

  // 根据官方文档：使用无参构造函数，SDK 会从环境变量读取配置
  // HTTPOptions 设置 API 版本
  return new GoogleGenAI({
    httpOptions: { apiVersion: 'v1' }
  });
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
