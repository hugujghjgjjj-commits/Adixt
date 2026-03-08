import { GoogleGenAI, ThinkingLevel, Modality } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please check your environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const aiService = {
  // 1. Thinking Mode (Complex)
  async askComplexQuestion(prompt: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } }
    });
    return response.text;
  },

  // 2. Fast AI Responses (Simple)
  async askSimpleQuestion(prompt: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
    });
    return response.text;
  },

  // 3. Prompt based video generation
  async generateVideo(prompt: string) {
    const ai = getAI();
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });
    return operation;
  },

  // 3.1 Poll for video completion
  async pollVideoOperation(operation: any) {
    const ai = getAI();
    let currentOp = operation;
    while (!currentOp.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
      currentOp = await ai.operations.getVideosOperation({ operation: currentOp });
    }
    return currentOp.response?.generatedVideos?.[0]?.video?.uri;
  },

  // 4. Google Maps Grounding
  async getMapsData(query: string, lat: number, lng: number) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{googleMaps: {}}],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });
    return {
      text: response.text,
      chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  },

  // 5. Google Search Grounding
  async getSearchData(query: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return {
      text: response.text,
      chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  },

  // 6. Intelligent Validation for Checkout
  async validateCheckoutInfo(address: string, phone: string) {
    // 1. Phone Validation (Basic Regex for Indian Mobile Numbers)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      return { isValid: false, reason: "Phone number seems invalid. Please enter a valid 10-digit mobile number." };
    }

    // 2. Address Validation using Google Maps Grounding
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Check if this address exists in reality: "${address}". If it exists, return "VALID". If it is fake or gibberish, return "INVALID".`,
        config: {
          tools: [{ googleMaps: {} }],
        },
      });

      const text = response.text || '';
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

      // If we have grounding chunks (map results) and the model says valid, it's good.
      if (chunks && chunks.length > 0) {
        return { isValid: true };
      } else {
        // Fallback: If no map results, ask the model to analyze the text structure
        if (text.includes("VALID")) return { isValid: true };
        
        // If the address is too short or gibberish
        if (address.length < 10 || /([a-z])\1{4,}/i.test(address)) {
           return { isValid: false, reason: "Address seems incomplete or invalid. Please provide a full address." };
        }
        
        return { isValid: true }; // Give benefit of doubt if maps fails but text looks ok
      }
    } catch (e) {
      console.error("Address validation error", e);
      return { isValid: true }; // Fallback to allow checkout if service fails
    }
  },

  // 7. Image Generation (Nano Banana 2)
  async generateImage(prompt: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }
    return null;
  }
};
