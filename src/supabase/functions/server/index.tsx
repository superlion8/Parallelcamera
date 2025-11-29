import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { speechToText } from "./speech.tsx";
import genai from "npm:@google/genai";

// Ensure Vertex AI mode is enabled via environment variable as per user snippet
try {
  Deno.env.set("GOOGLE_GENAI_USE_VERTEXAI", "true");
} catch (e) {
  // Ignore if permission denied or already set
}

// Destructure/Fallback for Client class
// The package @google/genai (v0.x) usually exports 'Client'.
// The user's snippet uses 'GoogleGenAI', so we check for both.
const Client = genai.Client || genai.GoogleGenAI;
const { HarmCategory, HarmBlockThreshold } = genai;

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "x-goog-api-key"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper to get configured client
function getClient() {
  const apiKey = Deno.env.get("vertex_api_key");
  if (!apiKey) {
    throw new Error("Missing 'vertex_api_key' environment variable.");
  }

  if (!Client) {
    throw new Error("Google GenAI Client failed to import. Check package exports.");
  }
  
  // Initialize with explicit vertexai: true AND apiKey
  return new Client({
    vertexai: true,
    apiKey: apiKey,
    httpOptions: { apiVersion: 'v1beta' }
  });
}

// Health check
app.get("/make-server-f359b1dc/health", (c) => {
  return c.json({ status: "ok" });
});

// Analyze image
app.post("/make-server-f359b1dc/analyze-image", async (c) => {
  try {
    const { image, location, character } = await c.req.json();
    
    if (!image) {
      return c.json({ error: "Image is required" }, 400);
    }

    console.log("Starting image analysis with Gemini SDK...");
    const client = getClient();
    
    const base64Image = image.replace(/^data:image\/\w+;base64,/, "");

    let promptText = "请用中文详细描述这张照片。";
    if (location) {
      promptText += `\n\n照片拍摄于坐标: 纬度 ${location.latitude}, 经度 ${location.longitude}。请在描述中自然地融入地理位置信息。`;
    }
    if (character && character.referenceImage) {
       promptText += `\n\n注意：用户希望将名为"${character.name}"的角色融入到场景中。这是该角色的参考照片。在描述中自然地提及这个角色出现在场景中。`;
    }

    const parts: any[] = [
      { text: promptText },
      { inlineData: { mimeType: "image/jpeg", data: base64Image } }
    ];

    if (character && character.referenceImage) {
      const charBase64 = character.referenceImage.replace(/^data:image\/\w+;base64,/, "");
      parts.push({ inlineData: { mimeType: "image/jpeg", data: charBase64 } });
    }

    const response = await client.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ role: "user", parts: parts }]
    });

    const description = response.text || 
                        response.candidates?.[0]?.content?.parts?.[0]?.text || 
                        "";
    
    console.log("Analysis complete. Length:", description.length);
    return c.json({ description });
    
  } catch (error: any) {
    console.error("Error analyzing image:", error);
    return c.json({ error: "Failed to analyze image", details: error.message }, 500);
  }
});

// Generate creative element
app.post("/make-server-f359b1dc/generate-creative-element", async (c) => {
  try {
    const { description } = await c.req.json();
    
    const client = getClient();
    const prompt = `基于以下场景描述，请添加一个脑洞大开、富有创意和想象力的元素... (省略长提示) ... 原始描述: ${description}`;

    const response = await client.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const creativeElement = (response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
    return c.json({ creativeElement });
  } catch (error: any) {
    console.error("Error generating creative element:", error);
    return c.json({ error: "Failed", details: error.message }, 500);
  }
});

// Generate image
app.post("/make-server-f359b1dc/generate-image", async (c) => {
  try {
    const { description, originalImage, mode, character, userPrompt } = await c.req.json();
    console.log("Generating image with Gemini SDK... Mode:", mode);
    const client = getClient();

    let promptText = mode === 'creative' 
        ? `基于以下描述，生成一张充满创意和想象力的照片：${description}`
        : `基于以下描述，生成一张写实的照片：${description}`;
    
    if (character) {
       promptText += ` CRITICAL: Include the person from the reference photo.`;
    }

    const parts: any[] = [];
    if (character && character.referenceImage) {
      parts.push({ 
        inlineData: { 
          mimeType: "image/jpeg", 
          data: character.referenceImage.replace(/^data:image\/\w+;base64,/, "") 
        } 
      });
    }
    
    parts.push({ text: promptText });

    if ((mode === 'creative' || mode === 'meta') && originalImage) {
      parts.push({ 
        inlineData: { 
          mimeType: "image/jpeg", 
          data: originalImage.replace(/^data:image\/\w+;base64,/, "") 
        } 
      });
    }

    // Config following user snippet
    const config: any = {
      responseModalities: ["IMAGE"], 
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ]
    };

    const response = await client.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [{ role: "user", parts: parts }],
      config: config
    });

    let generatedImageBase64 = null;
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
                generatedImageBase64 = part.inlineData.data;
                break;
            }
        }
    }
    
    if (!generatedImageBase64) {
        throw new Error("No image generated");
    }

    return c.json({ 
      success: true,
      image: `data:image/png;base64,${generatedImageBase64}`,
      description: description
    });

  } catch (error: any) {
    console.error("Error generating image:", error);
    return c.json({ error: "Failed to generate image", details: error.message }, 500);
  }
});

// History endpoints omitted for brevity (same as before)
// ... (History endpoints: get, save, delete)

app.get("/make-server-f359b1dc/get-history", async (c) => {
  try {
    const historyData = await kv.get("camera_history");
    return c.json({ history: historyData || [] });
  } catch (error: any) {
    return c.json({ error: "Failed to fetch history", history: [] }, 500);
  }
});

app.post("/make-server-f359b1dc/save-history", async (c) => {
  try {
    const { result } = await c.req.json();
    if (!result) return c.json({ error: "Result is required" }, 400);
    const history = (await kv.get("camera_history")) || [];
    history.unshift({ ...result, timestamp: Date.now() });
    const trimmedHistory = history.slice(0, 50);
    await kv.set("camera_history", trimmedHistory);
    return c.json({ success: true, count: trimmedHistory.length });
  } catch (error: any) {
    return c.json({ error: "Failed to save history" }, 500);
  }
});

app.post("/make-server-f359b1dc/delete-history", async (c) => {
  try {
    const { index } = await c.req.json();
    const history = (await kv.get("camera_history")) || [];
    if (index >= 0 && index < history.length) {
      history.splice(index, 1);
      await kv.set("camera_history", history);
    }
    return c.json({ success: true, count: history.length });
  } catch (error: any) {
    return c.json({ error: "Failed to delete history" }, 500);
  }
});


// Speech to Text
app.post("/make-server-f359b1dc/speech-to-text", async (c) => {
  try {
    const { audio } = await c.req.json();
    if (!audio) return c.json({ error: "Audio is required" }, 400);
    const text = await speechToText(audio);
    return c.json({ text });
  } catch (error: any) {
    return c.json({ error: "STT failed", details: error.message }, 500);
  }
});

Deno.serve(app.fetch);