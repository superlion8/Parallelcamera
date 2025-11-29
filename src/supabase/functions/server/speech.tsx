import * as genaiModule from "npm:@google/genai";

// Robustly extract Client and types
const Client = genaiModule.Client || 
               genaiModule.GoogleGenAI || 
               (genaiModule.default as any)?.Client || 
               (genaiModule.default as any)?.GoogleGenAI;

export async function speechToText(audioBase64: string): Promise<string> {
  console.log('🎤 Starting speech recognition...');
  
  try {
    // 1. Retrieve Secrets
    const apiKey = Deno.env.get("vertex_api_key") || Deno.env.get("VERTEX_API_KEY");
    const projectId = Deno.env.get("vertex_project_id") || Deno.env.get("VERTEX_PROJECT_ID");
    const location = Deno.env.get("GOOGLE_CLOUD_LOCATION") || "global";

    if (!apiKey) {
      throw new Error("Missing 'VERTEX_API_KEY' environment variable.");
    }

    if (!Client) {
        console.error("Available exports in @google/genai module:", Object.keys(genaiModule));
        throw new Error("Google GenAI Client class not found in package exports.");
    }

    console.log(`Initializing STT Client: vertexai=true, project=${projectId || 'unknown'}, location=${location}`);

    // 2. Initialize Client with explicit parameters (per official docs)
    const client = new Client({
        vertexai: true,
        project: projectId,
        location: location,
        apiKey: apiKey,
    });

    // Call Gemini
    let response;
    try {
        response = await client.models.generateContent({
          model: "gemini-3-pro-preview",
          contents: [{
            role: "user",
            parts: [
              { text: '请将这段音频转换为文字。只输出识别出的文字内容，不要添加任何其他说明。如果是中文，请输出中文。' },
              { inlineData: { mimeType: 'audio/webm', data: audioBase64 } }
            ]
          }]
        });
    } catch (e: any) {
        console.warn("STT Primary model failed, falling back to gemini-2.0-flash-exp");
        response = await client.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: [{
            role: "user",
            parts: [
              { text: '请将这段音频转换为文字。只输出识别出的文字内容，不要添加任何其他说明。如果是中文，请输出中文。' },
              { inlineData: { mimeType: 'audio/webm', data: audioBase64 } }
            ]
          }]
        });
    }

    // Extract text
    const text = response.text || 
                 (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) || 
                 "";
                 
    console.log('📝 STT Result:', text.substring(0, 50));
    return text.trim();

  } catch (error) {
    console.error('❌ STT Error:', error);
    throw error;
  }
}
