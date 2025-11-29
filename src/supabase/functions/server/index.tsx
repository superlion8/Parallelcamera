import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { speechToText } from "./speech.tsx";
import * as genaiModule from "npm:@google/genai";

// Robustly extract Client and types
const Client = genaiModule.Client || 
               genaiModule.GoogleGenAI || 
               (genaiModule.default as any)?.Client || 
               (genaiModule.default as any)?.GoogleGenAI;

const HarmCategory = genaiModule.HarmCategory || 
                     (genaiModule.default as any)?.HarmCategory;

const HarmBlockThreshold = genaiModule.HarmBlockThreshold || 
                           (genaiModule.default as any)?.HarmBlockThreshold;

const app = new Hono();

app.use('*', logger(console.log));

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
  // 1. Retrieve Secrets
  const apiKey = Deno.env.get("vertex_api_key") || Deno.env.get("VERTEX_API_KEY");
  const projectId = Deno.env.get("vertex_project_id") || Deno.env.get("VERTEX_PROJECT_ID");
  const location = Deno.env.get("GOOGLE_CLOUD_LOCATION") || "global";
  
  if (!apiKey) {
    throw new Error("Missing 'VERTEX_API_KEY' environment variable.");
  }
  
  if (!Client) {
    throw new Error(`Google GenAI Client class not found. Available exports: ${Object.keys(genaiModule).join(", ")}`);
  }

  console.log(`Initializing Client: vertexai=true, project=${projectId || 'unknown'}, location=${location}`);

  // 2. Initialize Client with explicit parameters (per official docs)
  // https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstart
  return new Client({
    vertexai: true,
    project: projectId,
    location: location,
    apiKey: apiKey,
  });
}

app.get("/make-server-f359b1dc/health", (c) => {
  return c.json({ status: "ok" });
});

app.post("/make-server-f359b1dc/analyze-image", async (c) => {
  try {
    const { image, location, character } = await c.req.json();
    
    if (!image) {
      return c.json({ error: "Image is required" }, 400);
    }

    console.log("Starting image analysis...");
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

    // Fallback logic
    let response;
    try {
        console.log("Attempting to use model: gemini-3-pro-preview");
        response = await client.models.generateContent({
          model: "gemini-3-pro-preview",
          contents: [{ role: "user", parts: parts }]
        });
    } catch (e: any) {
        console.warn(`Primary model failed: ${e.message}.`);
        // Check for common Vertex errors to give better feedback
        if (e.message?.includes("API keys are not supported")) {
            console.error("CRITICAL: Vertex AI does not support API Keys for this endpoint. User needs to disable Vertex mode or use OAuth.");
        }

        // Try fallback
        console.log("Falling back to gemini-2.0-flash-exp");
        response = await client.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: [{ role: "user", parts: parts }]
        });
    }

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

app.post("/make-server-f359b1dc/generate-creative-element", async (c) => {
  try {
    const { description } = await c.req.json();
    const client = getClient();
    const prompt = `基于以下场景描述，请添加一个脑洞大开、富有创意和想象力的元素... (省略长提示) ... 原始描述: ${description}`;

    let response;
    try {
        response = await client.models.generateContent({
          model: "gemini-3-pro-preview",
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        });
    } catch (e: any) {
        response = await client.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        });
    }

    const creativeElement = (response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
    return c.json({ creativeElement });
  } catch (error: any) {
    console.error("Error generating creative element:", error);
    return c.json({ error: "Failed", details: error.message }, 500);
  }
});

app.post("/make-server-f359b1dc/generate-image", async (c) => {
  try {
    const { description, originalImage, mode, character, userPrompt } = await c.req.json();
    console.log("Generating image... Mode:", mode);
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

    const config: any = {
      responseModalities: ["IMAGE"], 
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ]
    };

    // Using requested model
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

// History endpoints
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