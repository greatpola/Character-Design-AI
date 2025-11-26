import { GoogleGenAI } from "@google/genai";
import { GeneratedImage } from "../types";

// Using the latest Nano Banana 2 (Gemini 3 Pro Image) for high quality character sheets
const MODEL_NAME = 'gemini-3-pro-image-preview';

/**
 * Generates a comprehensive character brand sheet.
 * Includes: Story, Basic Type, Turnaround, Motion, and Application Mockups.
 */
export const generateCharacterSheet = async (userPrompt: string): Promise<GeneratedImage> => {
  try {
    // Create instance per request to ensure we use the latest API key from selection
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Enhanced prompt to strictly enforce the "Brand Sheet" layout similar to the reference
    const enhancedPrompt = `
      Create a comprehensive, professional character brand design sheet (vertical infographic style) for: ${userPrompt}.
      
      The image MUST be a cohesive layout on a light/clean background, divided into these 5 specific sections:
      
      1. [Top Left] "Character Story": A section with simulated text paragraphs visually representing the character's background story and personality description.
      2. [Center/Left] "Basic Type": A large, high-quality main 3D render of the character (and sidekick if applicable). Style: 3D Blender/C4D, cute, vibrant lighting.
      3. [Middle Row] "Turnaround": A technical schematic showing the character from Front, Side, and Back views.
      4. [Right Side] "Motion": A set of 4-6 smaller variations showing the character in different active poses (running, jumping) and emotions (laughing, surprised).
      5. [Bottom Section] "Application": Realistic product mockups showing the character applied to merchandise. Must include:
         - A laptop covered with character stickers.
         - An acrylic standee.
         - A notebook or stationery set featuring the character.
      
      Style: High-end corporate brand guide, clean composition, soft shadows, 2K resolution.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [{ text: enhancedPrompt }]
      },
      config: {
        imageConfig: {
          imageSize: '2K', // High resolution for detail
          aspectRatio: '3:4' // Portrait aspect ratio suitable for vertical brand sheets
        }
      }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Generation error:", error);
    throw error;
  }
};

/**
 * Edits an existing sheet while trying to preserve the complex layout.
 */
export const editCharacterSheet = async (
  currentImage: GeneratedImage,
  editPrompt: string
): Promise<GeneratedImage> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: currentImage.mimeType,
              data: currentImage.data
            }
          },
          {
            text: `Edit this character design sheet. 
            CRITICAL: Maintain the existing 5-section layout (Story, Basic Type, Turnaround, Motion, Application Mockups).
            
            Edit instruction: ${editPrompt}`
          }
        ]
      },
      config: {
        imageConfig: {
          imageSize: '2K',
          aspectRatio: '3:4'
        }
      }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Editing error:", error);
    throw error;
  }
};

/**
 * Helper to extract the first image found in the response parts.
 */
const extractImageFromResponse = (response: any): GeneratedImage => {
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No candidates returned");
  }

  const parts = candidates[0].content.parts;
  for (const part of parts) {
    if (part.inlineData) {
      return {
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png'
      };
    }
  }

  throw new Error("No image data found in response");
};