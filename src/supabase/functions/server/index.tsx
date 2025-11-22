import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { speechToText } from "./speech.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-f359b1dc/health", (c) => {
  return c.json({ status: "ok" });
});

// Analyze image with Gemini 2.5 Flash
app.post("/make-server-f359b1dc/analyze-image", async (c) => {
  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("GEMINI_API_KEY not found in environment variables");
      return c.json({ error: "API key not configured" }, 500);
    }

    const { image, location, character } = await c.req.json();
    
    if (!image) {
      return c.json({ error: "Image is required" }, 400);
    }

    console.log("Starting image analysis with Gemini...");
    console.log("Location data:", location ? `${location.latitude}, ${location.longitude}` : 'none');
    console.log("Character data:", character ? `${character.name}` : 'none');

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Remove data URL prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, "");

    // Build prompt with location and character info
    let prompt = "请用中文详细描述这张照片。";
    
    if (location) {
      prompt += `\n\n照片拍摄于坐标: 纬度 ${location.latitude}, 经度 ${location.longitude}。请在描述中自然地融入地理位置信息。`;
    }

    // Prepare content array
    const contents: any[] = [prompt];
    
    // Add the main scene image
    contents.push({
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg",
      },
    });

    // If character is provided, add character reference image
    if (character && character.referenceImage) {
      const characterBase64 = character.referenceImage.replace(/^data:image\/\w+;base64,/, "");
      prompt += `\n\n注意：用户希望将名为"${character.name}"的角色融入到场景中。这是该角色的参考照片。在描述中自然地提及这个角色出现在场景中。`;
      
      contents.push({
        inlineData: {
          data: characterBase64,
          mimeType: "image/jpeg",
        },
      });
      
      console.log("Including character reference image:", character.name);
    }

    // Update the first element with the complete prompt
    contents[0] = prompt;

    // Call Gemini Vision API
    const result = await model.generateContent(contents);

    const response = await result.response;
    const description = response.text();

    console.log("Image analysis completed successfully");
    console.log("Generated description length:", description.length);
    return c.json({ description });
    
  } catch (error: any) {
    console.error("Error analyzing image with Gemini:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    return c.json({ 
      error: "Failed to analyze image", 
      details: error.message 
    }, 500);
  }
});

// Generate creative element for creative mode
app.post("/make-server-f359b1dc/generate-creative-element", async (c) => {
  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("GEMINI_API_KEY not found in environment variables");
      return c.json({ error: "API key not configured" }, 500);
    }

    const { description } = await c.req.json();
    
    if (!description) {
      return c.json({ error: "Description is required" }, 400);
    }

    console.log("Generating creative element with Gemini...");
    console.log("Original description:", description.substring(0, 100) + "...");

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Build prompt for creative element
    const prompt = `基于以下场景描述，请添加一个脑洞大开、富有创意和想象力的元素。这个元素应该：
1. 出人意料但符合场景逻辑
2. 富有视觉冲击力
3. 充满趣味性和艺术感
4. 可以是魔幻、科幻、超现实或幽默的元素

原始场景描述：
${description}

请用中文简洁地描述这个脑洞大开的新增元素（50字以内），例如："天空中漂浮着一只巨大的发光水母" 或 "街道上出现了一扇通往异世界的发光传送门"。`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const creativeElement = response.text().trim();

    console.log("Creative element generated:", creativeElement);
    return c.json({ creativeElement });
    
  } catch (error: any) {
    console.error("Error generating creative element:", error);
    console.error("Error details:", error.message);
    return c.json({ 
      error: "Failed to generate creative element", 
      details: error.message 
    }, 500);
  }
});

// Generate image with Gemini 2.5 Flash Image
app.post("/make-server-f359b1dc/generate-image", async (c) => {
  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("GEMINI_API_KEY not found in environment variables");
      return c.json({ error: "API key not configured" }, 500);
    }

    const { description, originalImage, mode, character, userPrompt } = await c.req.json();
    
    if (!description) {
      return c.json({ error: "Description is required" }, 400);
    }

    console.log("Starting image generation with Gemini 2.5 Flash Image...");
    console.log("Mode:", mode);
    console.log("Description:", description.substring(0, 100) + "...");
    console.log("Has original image:", !!originalImage);
    console.log("Has character:", !!character);
    console.log("User prompt:", userPrompt);

    // Initialize Gemini with image generation model
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

    // Build the generation prompt based on mode
    let prompt;
    
    // Meta mode - special handling
    if (mode === 'meta' && character && character.name) {
      const userRequirement = userPrompt 
        ? `User's creative request: ${userPrompt}\n\n`
        : '';
      
      prompt = `Generate a photorealistic image based on the following:

Environment description: ${description}

${userRequirement}CRITICAL REQUIREMENTS:
1. The image MUST include the person from the reference photo (${character.name})
2. The person MUST have the EXACT SAME facial features, hairstyle, hair color, body type, and skin tone as shown in the reference photo
3. The person should appear naturally in the environment described above
4. The person should be clearly visible and in a prominent position
5. Use the environment reference image to understand the scene structure and lighting
${userPrompt ? `6. Fulfill the user's creative request: "${userPrompt}"` : ''}

Important: Place the person from the reference photo naturally into the real environment, making it look like they are actually there.`;
    } else if (character && character.name) {
      // Other modes with character
      const sceneDesc = mode === 'creative' 
        ? `Generate a creative and imaginative photo. ${description}`
        : `Generate a photorealistic image like from a Polaroid camera. ${description}`;
      
      prompt = `${sceneDesc}

CRITICAL REQUIREMENT - The image MUST include a person:
1. Look at the reference photo provided - this is "${character.name}"
2. The person in the generated image MUST have the EXACT SAME facial features, hairstyle, hair color, body type, and skin tone as the reference photo
3. This person should be clearly visible and in a prominent position in the scene
4. The person should naturally interact with the environment described above

Remember: The reference photo shows exactly how this person should look. Copy their appearance precisely.`;
    } else {
      // No character - original prompts
      if (mode === 'creative') {
        prompt = `基于以下描述，生成一张充满创意和想象力的照片。保持原始场景的基本结构，但要融入描述中的脑洞元素，让画面既真实又充满奇幻色彩：\n\n${description}`;
      } else {
        prompt = `基于以下描述，生成一张如同拍立得相机拍出来的，写实的照片：\n\n${description}`;
      }
    }
    
    // Prepare content array - ORDER MATTERS!
    const contents: any[] = [];
    
    // 1. Add character reference image FIRST (if provided) - so AI sees the person first
    if (character && character.referenceImage) {
      const characterBase64 = character.referenceImage.replace(/^data:image\/\w+;base64,/, "");
      console.log("Including character reference image FIRST:", character.name, "size:", characterBase64.length);
      contents.push({
        inlineData: {
          data: characterBase64,
          mimeType: "image/jpeg",
        },
      });
    }
    
    // 2. Add the prompt
    contents.push(prompt);
    
    // 3. For creative/meta mode, include original scene image as additional reference
    if ((mode === 'creative' || mode === 'meta') && originalImage) {
      const base64Image = originalImage.replace(/^data:image\/\w+;base64,/, "");
      console.log(`Including original scene image for ${mode} mode, size:`, base64Image.length);
      contents.push({
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      });
    }

    const contentParts = [
      character ? "[character image]" : "",
      "[prompt]",
      (mode === 'creative' || mode === 'meta') && originalImage ? "[scene image]" : ""
    ].filter(Boolean).join(" + ");
    console.log("Calling Gemini API with", contents.length, "content parts in order:", contentParts);

    // Call Gemini Image Generation API
    const result = await model.generateContent(contents);
    console.log("Received response from Gemini");
    
    const response = await result.response;
    console.log("Response candidates:", response.candidates?.length || 0);
    
    // Extract generated image from response
    let generatedImageBase64 = null;
    
    if (response.candidates && response.candidates[0]) {
      const parts = response.candidates[0].content.parts;
      console.log("Response parts:", parts.length);
      
      for (const part of parts) {
        console.log("Part type:", part.text ? "text" : part.inlineData ? "inlineData" : "unknown");
        
        if (part.inlineData) {
          // Found the generated image
          generatedImageBase64 = part.inlineData.data;
          console.log("Image generated successfully, size:", generatedImageBase64.length);
          break;
        }
      }
    }
    
    if (!generatedImageBase64) {
      console.error("No image data in response");
      console.error("Full response structure:", JSON.stringify(response, null, 2));
      return c.json({ 
        error: "No image generated",
        details: "The model did not return image data"
      }, 500);
    }

    // Return the base64 encoded image
    return c.json({ 
      success: true,
      image: `data:image/png;base64,${generatedImageBase64}`,
      description: description
    });
    
  } catch (error: any) {
    console.error("Error generating image with Gemini:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    return c.json({ 
      error: "Failed to generate image", 
      details: error.message 
    }, 500);
  }
});

// Get history
app.get("/make-server-f359b1dc/get-history", async (c) => {
  try {
    console.log("Fetching history...");
    
    const historyData = await kv.get("camera_history");
    const history = historyData || [];
    
    console.log("History fetched:", history.length, "items");
    return c.json({ history });
    
  } catch (error: any) {
    console.error("Error fetching history:", error);
    return c.json({ 
      error: "Failed to fetch history", 
      details: error.message,
      history: []
    }, 500);
  }
});

// Save to history
app.post("/make-server-f359b1dc/save-history", async (c) => {
  try {
    const { result } = await c.req.json();
    
    if (!result) {
      return c.json({ error: "Result is required" }, 400);
    }

    console.log("Saving new history item...");
    
    // Get existing history
    const historyData = await kv.get("camera_history");
    const history = historyData || [];
    
    // Add new result to the beginning of the array
    history.unshift({
      ...result,
      timestamp: Date.now(),
    });
    
    // Keep only last 50 items to avoid storage overflow
    const trimmedHistory = history.slice(0, 50);
    
    // Save back to KV
    await kv.set("camera_history", trimmedHistory);
    
    console.log("History saved successfully. Total items:", trimmedHistory.length);
    return c.json({ success: true, count: trimmedHistory.length });
    
  } catch (error: any) {
    console.error("Error saving history:", error);
    return c.json({ 
      error: "Failed to save history", 
      details: error.message 
    }, 500);
  }
});

// Delete from history
app.post("/make-server-f359b1dc/delete-history", async (c) => {
  try {
    const { index } = await c.req.json();
    
    if (typeof index !== 'number') {
      return c.json({ error: "Invalid index" }, 400);
    }

    console.log("Deleting history item at index:", index);
    
    // Get existing history
    const historyData = await kv.get("camera_history");
    const history = historyData || [];
    
    if (index < 0 || index >= history.length) {
      return c.json({ error: "Index out of bounds" }, 400);
    }
    
    // Remove item at index
    history.splice(index, 1);
    
    // Save back to KV
    await kv.set("camera_history", history);
    
    console.log("History item deleted. Remaining items:", history.length);
    return c.json({ success: true, count: history.length });
    
  } catch (error: any) {
    console.error("Error deleting history:", error);
    return c.json({ 
      error: "Failed to delete history", 
      details: error.message 
    }, 500);
  }
});

// Speech to text
app.post("/make-server-f359b1dc/speech-to-text", async (c) => {
  try {
    const { audio } = await c.req.json();
    
    if (!audio) {
      return c.json({ error: "Audio data is required" }, 400);
    }

    console.log("Converting speech to text...");
    
    // Convert audio to text
    const text = await speechToText(audio);
    
    console.log("Speech to text conversion completed successfully");
    console.log("Generated text length:", text.length);
    return c.json({ text });
    
  } catch (error: any) {
    console.error("Error converting speech to text:", error);
    console.error("Error details:", error.message);
    return c.json({ 
      error: "Failed to convert speech to text", 
      details: error.message 
    }, 500);
  }
});

Deno.serve(app.fetch);