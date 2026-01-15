
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { TechNewsTrend, ContentPost, PostStatus, SocialVariation, ContentType } from "./types";

const getAI = () => {
  // 1. Try to get key from LocalStorage (MEGS Settings)
  const savedCreds = localStorage.getItem('teknowguy_credentials');
  let apiKey = process.env.API_KEY;

  if (savedCreds) {
    try {
      const parsed = JSON.parse(savedCreds);
      if (parsed.geminiApiKey) {
        apiKey = parsed.geminiApiKey;
      }
    } catch (e) {
      console.error("Failed to read creds for key", e);
    }
  }

  // 2. Fallback to process.env if available (dev mode) or error
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Please set it in Settings.");
  }

  return new GoogleGenAI({ apiKey: apiKey });
};

const safeParseJson = (text: string) => {
  try {
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '');
    }

    const parsed = JSON.parse(cleanText);

    if (parsed && typeof parsed === 'object') {
      const bodySource = parsed.fullBody || parsed.content || parsed.body || parsed.article;
      if (bodySource && typeof bodySource === 'string') {
        let processedBody = bodySource.trim();
        processedBody = processedBody.replace(/```html/gi, '').replace(/```/gi, '');
        processedBody = processedBody.replace(/\\n/g, '\n').replace(/\\"/g, '"');
        parsed.fullBody = processedBody;
      }

      if (!parsed.seoKeywords) parsed.seoKeywords = [];
      if (!parsed.variations) parsed.variations = [];
    }

    return parsed;
  } catch (e) {
    console.error("JSON Parse Error. Raw text:", text);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (inner) { }
    }
    throw new Error("Intelligence formatting error. Re-syncing sequence...");
  }
};

export const searchTrendingTechNews = async (
  onStatus?: (s: string) => void,
  systemPrompt: string = "Identify the top 5 most critical technology news stories from the last 24 hours."
): Promise<TechNewsTrend[]> => {
  const ai = getAI();
  onStatus?.("Scanning global news vectors...");

  try {
    const searchResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `${systemPrompt} Return a JSON array of objects with title, snippet, source, and url.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });

    return safeParseJson(searchResponse.text || "[]");
  } catch (error: any) {
    console.error("Search Error", error);
    onStatus?.("Search offline. Accessing internal knowledge...");
    // Only attempt fallback if we have a key, otherwise throw to let UI know
    const fallbackResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Generate 5 trending topics based on this criteria: "${systemPrompt}". Be highly specific. Format as JSON array of objects with title, snippet, source, and url.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParseJson(fallbackResponse.text || "[]");
  }
};

export const generateFullBlogPost = async (
  topic: string,
  companyNews: string = "",
  type: ContentType = 'News',
  onStatus?: (s: string) => void,
  systemPrompt: string = "Write an EDITORIAL GRADE technical article."
): Promise<Partial<ContentPost>> => {
  const ai = getAI();
  onStatus?.(`Architecting ${type} editorial & social spinoffs...`);

  const prompt = `
    Task: ${systemPrompt}
    Topic: "${topic}"
    Type: ${type}
    
    Editorial Guidelines:
    1. Structure: Compelling hook, 2-3 detailed sections (using <h2>), HTML lists (<ul>/<li>), and a visionary conclusion.
    2. Visuals: NONE inside the text. Focus on pure narrative legibility.
    3. Content Integration: ${companyNews ? `Strategically integrate this Company News/Internal Insight: "${companyNews}"` : 'Authoritative and visionary tone.'}
    4. Quality Restriction: ELIMINATE all dashes (—, –, -) from the narrative prose. Do not use hyphens in compound words or em-dashes for punctuation. Use formal sentence structures and proper transitions instead to ensure a clean, high-quality published read.
    5. Formatting: PURE HTML ONLY for the body. DO NOT use markdown.
    
    CRITICAL INSTRUCTION:
    - The 'excerpt' MUST be PURE PLAIN TEXT. NO HTML tags (no <p>, no <h2>, etc.) are allowed in the excerpt.
    - The 'fullBody' contains the HTML article content.
    
    Social Variations: Generate 3 distinct spinoffs for LinkedIn, X (Twitter), and Facebook. Ensure these are also dash-free for consistency.
    
    Return JSON format:
    {
      "title": "Headline",
      "excerpt": "A concise plain text summary with NO HTML tags.",
      "fullBody": "<h2>...</h2><p>...</p>",
      "seoKeywords": ["Tag1", "Tag2"],
      "variations": [
        { "platform": "LinkedIn", "content": "Professional summary and call to action.", "hashtags": ["#Tag1"] },
        { "platform": "X", "content": "Punchy thread starter or news bite.", "hashtags": ["#Tag1"] },
        { "platform": "Facebook", "content": "Community focused summary.", "hashtags": ["#Tag1"] }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return safeParseJson(response.text || "{}");
  } catch (e) {
    const fallbackResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return safeParseJson(fallbackResponse.text || "{}");
  }
};

export const rewriteSelection = async (
  originalText: string,
  context: string,
  instruction: string = "Rewrite this to be more professional.",
  onStatus?: (s: string) => void
): Promise<string> => {
  const ai = getAI();
  onStatus?.("Recalibrating linguistic vectors...");

  const prompt = `
    Task: REWRITE the following segment for a high-quality editorial.
    ORIGINAL TEXT: "${originalText}"
    CONTEXT: "${context.substring(0, 500)}..."
    INSTRUCTION: "${instruction}"
    
    Constraint: REMOVE all dashes (—, –, -) and hyphens. Use formal punctuation and fluid transitions. Return ONLY the rewritten text.
    FORMATTING: Keep existing HTML tags.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt
    });
    return response.text || originalText;
  } catch (e) {
    return originalText;
  }
};

export const generateImageForPlaceholder = async (description: string, onStatus?: (s: string) => void, promptTemplate: string = "Professional blog editorial image."): Promise<string> => {
  const ai = getAI();
  onStatus?.(`Capturing visual: ${description}...`);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{
          text: `${promptTemplate} Topic: "${description}". Wide 16:9 aspect ratio. Photorealistic cinematic lighting.`
        }]
      },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (e) {
    console.error("Image generation failed:", e);
  }
  return `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=2070`;
};

export const generateBlogImage = async (title: string, onStatus?: (s: string) => void, promptTemplate?: string): Promise<string> => {
  return generateImageForPlaceholder(title, onStatus, promptTemplate);
};

export const editImageWithAi = async (imageBase64: string, prompt: string, onStatus?: (s: string) => void): Promise<string> => {
  const ai = getAI();
  onStatus?.(`AI Editing: ${prompt}...`);

  const base64Data = imageBase64.split(',')[1] || imageBase64;
  const mimeType = imageBase64.split(';')[0].split(':')[1] || 'image/png';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `Apply this edit to the image: "${prompt}". Maintain high quality.`
          },
        ],
      },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (e) {
    console.error("AI Edit Error:", e);
    throw e;
  }
  return imageBase64;
};
