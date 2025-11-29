/**
 * Vertex AI Gemini API 工具函数
 * 使用 @google/genai SDK (API Key + Vertex AI 端点)
 * 
 * 参考: https://github.com/superlion8/sparkit/blob/main/lib/vertexai.ts
 *
 * 环境变量配置：
 * - GEMINI_API_KEY: Google Cloud API Key
 * - GOOGLE_GENAI_USE_VERTEXAI=true: 启用 Vertex AI 端点 (自动设置)
 */
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

// 关键：在模块加载时设置 Vertex AI 模式环境变量
if (!process.env.GOOGLE_GENAI_USE_VERTEXAI) {
  process.env.GOOGLE_GENAI_USE_VERTEXAI = "true";
}

// GenAI 客户端缓存（单例）
let genAIClient: GoogleGenAI | null = null;

// 获取 API Key
function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VERTEX_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return apiKey;
}

// 获取 GenAI 客户端（单例）- 使用 Vertex AI 端点
export function getGenAIClient(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = getApiKey();
    genAIClient = new GoogleGenAI({
      apiKey,
      // Vertex AI 模式通过环境变量 GOOGLE_GENAI_USE_VERTEXAI=true 自动启用
    });
  }
  return genAIClient;
}

// 安全设置配置
export const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

// Helper to extract text from response
export function extractText(response: any): string {
  const candidate = response.candidates?.[0];
  if (candidate?.finishReason === "SAFETY") {
    throw new Error("内容被安全过滤阻止");
  }
  return candidate?.content?.parts?.[0]?.text || response.text || '';
}

// Helper to extract image from response
export function extractImage(response: any): string | null {
  const candidate = response.candidates?.[0];
  if (candidate?.finishReason === "SAFETY") {
    throw new Error("内容被安全过滤阻止，请尝试调整提示词或图片");
  }
  
  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if ((part as any).inlineData?.data) {
        return (part as any).inlineData.data;
      }
    }
  }
  return null;
}

export { HarmCategory, HarmBlockThreshold };
