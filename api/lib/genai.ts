import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Create and configure the GenAI client
export function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VERTEX_API_KEY;

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }

  console.log('Initializing GoogleGenerativeAI Client with API Key');

  // 使用 Google AI Studio 的 SDK（支持 API Key）
  return new GoogleGenerativeAI(apiKey);
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
  try {
    return response.response?.text() || 
           response.response?.candidates?.[0]?.content?.parts?.[0]?.text || 
           '';
  } catch (e) {
    return '';
  }
}

// Helper to extract image from response
export function extractImage(response: any): string | null {
  try {
    const parts = response.response?.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          return part.inlineData.data;
        }
      }
    }
  } catch (e) {
    console.error('Error extracting image:', e);
  }
  return null;
}

export { HarmCategory, HarmBlockThreshold, GoogleGenerativeAI };
