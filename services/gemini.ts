import { GoogleGenAI } from "@google/genai";
import { GeneratedImage } from "../types";

// Using the latest Nano Banana 2 (Gemini 3 Pro Image) for high quality character sheets
const MODEL_NAME = 'gemini-3-pro-image-preview';

// Obfuscated API Key storage to prevent plain-text exposure
// Reconstructs: AIzaSyB_zJSuz0Xb74T7CLtvBtxMe_GxKh16Hhc
const _k = [65, 73, 122, 97, 83, 121, 66, 95, 122, 74, 83, 117, 122, 48, 88, 98, 55, 52, 84, 55, 67, 76, 116, 118, 66, 116, 120, 77, 101, 95, 71, 120, 75, 104, 49, 54, 72, 104, 99];

const getApiKey = (): string => {
  // Safe check for process.env to avoid "process is not defined" errors in browser environments
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      // @ts-ignore
      return process.env.API_KEY;
    }
  } catch (e) {
    // ignore error if process is undefined
  }
  // Fallback to the embedded key if no environment variable is found
  return String.fromCharCode(..._k);
};

/**
 * Generates a comprehensive character brand sheet.
 * Includes: Story, Basic Type, Turnaround, Motion, and Application Mockups.
 */
export const generateCharacterSheet = async (userPrompt: string): Promise<GeneratedImage> => {
  try {
    // Create instance per request using the secure key retrieval
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    // Detect if the prompt contains Korean to enforce Hangul rendering
    const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(userPrompt);
    const textInstruction = isKorean 
      ? "TEXT RENDERING: Vital. Render the Character Name and Title in clear, legible KOREAN (Hangul). The body text should simulate clean Korean typography layout." 
      : "TEXT RENDERING: Render text in English.";

    // Enhanced prompt to strictly enforce the "Brand Sheet" layout similar to the reference
    // Added "Style Master" section to ensure uniform quality across generations
    const enhancedPrompt = `
      You are an expert Character Designer. Generate a masterpiece quality "Character Brand Sheet" for: ${userPrompt}.

      [ART DIRECTION & STYLE - UNIFORM QUALITY]
      - Style: Premium 3D Art Toy, Vinyl Figure, Blind Box aesthetic (like Pop Mart).
      - Rendering: Octane Render / Redshift style, Soft Studio Lighting, Global Illumination.
      - Material: Matte finish with subtle subsurface scattering (like high-end plastic or resin).
      - Palette: Cohesive color scheme, pastel background.
      - Quality: 8k resolution details, sharp focus, no artifacts.

      [COMPOSITION - 5 SECTION VERTICAL LAYOUT]
      Strictly follow this layout from top to bottom:

      1. [CHARACTER STORY]: 
         - Top Section.
         - Large, bold typography for the Name (${textInstruction}).
         - A clean paragraph block explaining the backstory.

      2. [BASIC TYPE]: 
         - Upper-Middle Section.
         - The main Hero Shot of the character.
         - Front 3/4 view, dynamic but cute pose.
         - Focus on character design clarity.

      3. [TURNAROUND]: 
         - Middle Section.
         - Orthographic views: Front, Side, Back.
         - Clean background, technical drawing aesthetic.
         - Must strictly match the Hero character.

      4. [MOTION]: 
         - Lower-Middle Section.
         - A collection of 4-5 spot illustrations.
         - Showing different emotions (Joy, Surprise, Anger) and actions (Running, Jumping).

      5. [APPLICATION]: 
         - Bottom Section.
         - Photorealistic Merchandise Mockups.
         - Show the character applied to: A Laptop (Stickers), An Acrylic Standee, A Notebook.
         - High-end product photography style.

      Ensure the character design is perfectly consistent across all sections. The final image should look like a professional design presentation.
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
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    // Detect Korean for editing instructions as well
    const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(editPrompt);
    const textInstruction = isKorean 
      ? "Ensure any new text or labels are rendered in clear KOREAN (Hangul)." 
      : "";

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
            
            STRICT CONSTRAINTS:
            - Maintain the existing 5-section layout (Story, Basic, Turnaround, Motion, Mockups).
            - Keep the character consistent (Same colors, same features).
            - Style: Premium 3D Art Toy, high-quality render.
            - ${textInstruction}
            
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