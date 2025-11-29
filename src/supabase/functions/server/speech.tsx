// Fix for import issues: Use default import and destructure
// We support both 'Client' (standard) and 'GoogleGenAI' (legacy/alias) class names
import genai from "npm:@google/genai";

// Set environment variable for Vertex AI mode as requested by user
try {
  Deno.env.set("GOOGLE_GENAI_USE_VERTEXAI", "true");
} catch (e) {
  // Ignore
}

// Destructure safely
const Client = genai.Client || genai.GoogleGenAI;

export async function speechToText(audioBase64: string): Promise<string> {
  console.log('🎤 Starting speech recognition (SDK Mode - @google/genai)...');

  try {
    const apiKey = Deno.env.get("vertex_api_key");
    if (!apiKey) {
      throw new Error("Missing 'vertex_api_key' environment variable.");
    }

    // Initialize Client
    if (!Client) {
        console.error("Available exports in @google/genai:", Object.keys(genai));
        throw new Error("Google GenAI Client class not found in package exports.");
    }

    // Use vertexai: true in constructor explicitly as well
    const client = new Client({
        vertexai: true,
        apiKey: apiKey,
        httpOptions: { apiVersion: "v1beta" }
    });

    // Call Gemini 3.0 Pro Preview
    const response = await client.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{
        role: "user",
        parts: [
          { text: '请将这段音频转换为文字。只输出识别出的文字内容，不要添加任何其他说明。如果是中文，请输出中文。' },
          { inlineData: { mimeType: 'audio/webm', data: audioBase64 } }
        ]
      }]
    });

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
