import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

// Create and configure the GenAI client
export function getGenAIClient() {
  const apiKey = process.env.VERTEX_API_KEY || process.env.GEMINI_API_KEY;
  const projectId = process.env.VERTEX_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'global';

  if (!apiKey) {
    throw new Error('Missing VERTEX_API_KEY or GEMINI_API_KEY environment variable');
  }

  console.log(`Initializing GenAI Client: vertexai=true, project=${projectId || 'unknown'}, location=${location}`);

  return new GoogleGenAI({
    vertexai: true,
    project: projectId,
    location: location,
    apiKey: apiKey,
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

