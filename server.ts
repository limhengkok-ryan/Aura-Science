import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { PRODUCTS } from "./src/products-data.js";

// Load Environment variables
dotenv.config();

// Ensure standard configuration
const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with custom user agent and correct apiKey structure
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not defined.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Route: Fetch products catalog
app.get("/api/products", (req, res) => {
  res.json(PRODUCTS);
});

// API Route: Conversational Consultation Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Invalid messages payload" });
      return;
    }

    const ai = getGeminiClient();

    // Map the incoming message history to the correct content shape
    const formattedContents = messages.map((m: any) => ({
      role: m.sender === "ai" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    const systemInstruction = 
      "You are Aura AI, a refined, supportive world-class dermatologist and clinical luxury skincare consultant representing Aura Science .\n" +
      "Provide premium, helpful, diagnostic, and scientifically accurate answers. Your tone should be humble, professional, soothing, and high-end.\n" +
      "Guide the user gently to understand their biological profile (e.g., lipid barrier, T-zone oiliness, seasonality).\n" +
      "Keep answers elegant, structured, clear and under 3 short paragraphs.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error.message || "Failed to process chat response" });
  }
});

// API Route: Structured skin analysis mapping concerns to products
app.post("/api/analyze", async (req, res) => {
  try {
    const { skinDescription } = req.body;
    if (!skinDescription || typeof skinDescription !== "string") {
      res.status(400).json({ error: "skinDescription string is required" });
      return;
    }

    const ai = getGeminiClient();

    const systemInstruction = 
      "You are a clinical skincare algorithm. Read the user's skin concerns and describe their skin biology.\n" +
      "Analyze: skinType (Combination, Dry, Sensitive, Oily, Normal), and pinpoint exact target concerns (such as dryness, sensitivity, fine lines, etc.).\n" +
      "Estimate: hydrationLevel (percentage integer 0-100 based on their tightness/dryness description), elasticityIndex (Optimal, Moderately Compromised, Low), and recommended pH range.\n" +
      "Suggest standard active ingredients needed, and draft a final algorithm note.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Perform skin profile extraction on this description: "${skinDescription}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skinType: { type: Type.STRING, description: "e.g., Combination, Sensitive, Dry, Oily" },
            concerns: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Array of extracted concerns: fine lines, dryness, sensitivity, dehydration, transepidermal loss, dark circles." 
            },
            hydrationLevel: { type: Type.INTEGER, description: "Hydration level percentage from 10 to 95" },
            elasticityIndex: { type: Type.STRING, description: "Optimal, Low, or Moderate" },
            phRecommended: { type: Type.STRING, description: "e.g., 5.5 - 6.0" },
            keyIngredientNeeded: { type: Type.STRING, description: "Main recommended clinical ingredient, e.g., Ceramide NP, Squalane, Peptides" },
            notes: { type: Type.STRING, description: "A highly sophisticated clinical diagnostic summary string." }
          },
          required: ["skinType", "concerns", "hydrationLevel", "elasticityIndex", "phRecommended", "keyIngredientNeeded", "notes"]
        },
        temperature: 0.2
      }
    });

    let result = {};
    if (response.text) {
      result = JSON.parse(response.text.trim());
    }
    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/analyze:", error);
    res.status(500).json({ error: error.message || "Failed to process skin analysis" });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Aura Science Backend] Listening on port ${PORT}...`);
  });
}

startServer().catch((err) => {
  console.error("Error starting backend server:", err);
});
