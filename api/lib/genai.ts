// 使用 @google/genai 包调用 Vertex AI（通过环境变量配置）
// 参考 Python 示例：
// export GEMINI_API_KEY=xxx
// export GOOGLE_GENAI_USE_VERTEXAI=True
// client = genai.Client(http_options=HttpOptions(api_version="v1"))

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

// Create and configure the GenAI client
export function getGenAIClient() {
  // 确保环境变量已设置（在 Vercel Dashboard 中配置）
  // - GEMINI_API_KEY: API 密钥
  // - GOOGLE_GENAI_USE_VERTEXAI: True
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }
  
  // 确保 GOOGLE_GENAI_USE_VERTEXAI 设置为 True
  if (!process.env.GOOGLE_GENAI_USE_VERTEXAI) {
    process.env.GOOGLE_GENAI_USE_VERTEXAI = 'True';
  }
  
  console.log('Initializing GoogleGenAI Client');
  console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set' : 'Not set');
  console.log('GOOGLE_GENAI_USE_VERTEXAI:', process.env.GOOGLE_GENAI_USE_VERTEXAI);

  // 与 Python 一致：只传 http_options，SDK 从环境变量读取配置
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
