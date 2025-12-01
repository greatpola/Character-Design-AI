
import { GoogleGenAI } from "@google/genai";
import { GeneratedImage, GenerationMode } from "../types";
import { CONFIG } from "../config";

// Using the latest Nano Banana 2 (Gemini 3 Pro Image) for high quality character sheets
const MODEL_NAME = 'gemini-3-pro-image-preview';

/**
 * Generates content based on the selected mode.
 */
export const generateContent = async (
  userPrompt: string, 
  mode: GenerationMode,
  referenceImage?: GeneratedImage // Optional Reference Image for consistency
): Promise<GeneratedImage> => {
  const apiKey = CONFIG.API_KEY;
  if (!apiKey) {
    throw new Error("API Key가 설정되지 않았습니다. 관리자에게 문의하거나 환경 변수를 확인해주세요.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Detect Korean
    const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(userPrompt);
    const textInstruction = isKorean 
      ? "TEXT RENDERING: Vital. Render any text in clear, legible KOREAN (Hangul)." 
      : "TEXT RENDERING: Render text in English.";

    let systemPrompt = "";
    
    // Consistency instruction if reference exists
    const consistencyInstruction = referenceImage 
      ? `
        [IMPORTANT: CONSISTENCY CHECK]
        - A reference image of the character is provided.
        - You MUST use this EXACT character design.
        - Match colors, proportions, accessories, and style exactly.
        - Do not redesign the character, just apply it to the new format below.
        `
      : "";

    switch (mode) {
      case 'ad_storyboard':
        systemPrompt = `
          You are an Expert Advertising Director. Generate a "Commercial Ad Storyboard".
          ${consistencyInstruction}
          
          Context/Scenario: ${userPrompt}
          
          [STYLE]
          - Professional 4-panel vertical comic strip layout.
          - Style: High-quality 3D Render or 2.5D Illustration (Webtoon style).
          - Vibrant colors, dynamic lighting, persuasive visual flow.
          
          [LAYOUT - 4 PANELS]
          1. [Hook]: The character encountering a problem or a desire.
          2. [Product Intro]: The character introducing the solution (product/service).
          3. [Benefit]: The character enjoying the result (happy, satisfied).
          4. [Call to Action]: The character pointing to the viewer with a slogan.
          
          ${textInstruction}
        `;
        break;

      case 'ani_storyboard':
        systemPrompt = `
          You are a Lead Animation Director. Generate an "Animation Storyboard".
          ${consistencyInstruction}
          
          Action Sequence: ${userPrompt}
          
          [STYLE]
          - Cinematic Aspect Ratio panels (16:9 frames stacked vertically).
          - Style: Disney/Pixar concept art style.
          - Focus on: Camera angles (Low angle, High angle), Action lines, facial expressions.
          
          [LAYOUT]
          - A sequence of 4-5 keyframes showing a specific action sequence.
          - Include small directional arrows or motion blur to indicate movement.
          - Lighting should set a dramatic mood.
          
          ${textInstruction}
        `;
        break;

      case 'goods':
        systemPrompt = `
          You are a Product Designer. Generate a "Merchandise (Goods) Collection".
          ${consistencyInstruction}
          
          Theme/Items: ${userPrompt}
          
          [STYLE]
          - Photorealistic Studio Photography.
          - Clean, pastel background.
          - High-end commercial product shot.
          
          [ITEMS TO SHOW]
          Create a composition showing the character applied to:
          1. Eco-bag (Tote bag)
          2. Ceramic Mug
          3. Smartphone Case
          4. Enamel Pin / Keyring
          
          Ensure the character is adapted to fit these items naturally (e.g., as a pattern or a central print).
        `;
        break;

      case 'emoticon':
        systemPrompt = `
          You are an Emoticon/Sticker Artist. Generate a "Digital Sticker Set".
          ${consistencyInstruction}
          
          Theme/Emotion: ${userPrompt}
          
          [STYLE]
          - KakaoTalk / Line Sticker style.
          - Thick outlines (white border) for easy cutting.
          - 2D or 3D Vector style (Clean, no noise).
          
          [LAYOUT]
          - Grid layout (3x3).
          - 9 distinct emotions: Joy, Sadness, Anger, Love, Confusion, Sleepy, Celebrating, Saying Hello, Saying No.
          - Each sticker must be isolated with clear spacing.
          
          ${textInstruction}
        `;
        break;

      case 'moving_emoticon':
        systemPrompt = `
          You are a Game Asset Designer. Generate a "Sprite Sheet" for a Moving Emoticon.
          ${consistencyInstruction}
          
          Action Loop: ${userPrompt}
          
          [STYLE]
          - Pixel Art or Clean Vector style.
          - Uniform grid layout (4x4).
          - Transparent or solid color background.
          
          [CONTENT]
          - Show ONE character performing a loopable animation (e.g., Running, Jumping, or Waving).
          - The 16 frames should represent a smooth sequence of motion from start to finish.
          - Maintain strict consistency in character size and position across frames.
        `;
        break;

      case 'brand_sheet':
      default:
        systemPrompt = `
          You are an expert Character Designer. Generate a masterpiece quality "Character Brand Sheet" for: ${userPrompt}.

          [ART DIRECTION & STYLE - UNIFORM QUALITY]
          - Style: Premium 3D Art Toy, Vinyl Figure, Blind Box aesthetic (like Pop Mart).
          - Rendering: Octane Render / Redshift style, Soft Studio Lighting, Global Illumination.
          - Material: Matte finish with subtle subsurface scattering.
          - Quality: 8k resolution details, sharp focus, no artifacts.
          - CONSISTENCY: ALL sections must be fully rendered in 3D.

          [COMPOSITION - 5 SECTION VERTICAL LAYOUT]
          Strictly follow this layout from top to bottom:
          1. [CHARACTER STORY]: Large Name & Backstory text (${textInstruction}).
          2. [BASIC TYPE]: Hero Shot (Front 3/4 view).
          3. [TURNAROUND]: Front, Side, Back views (3D Rendered).
          4. [MOTION]: 4-5 spot illustrations of actions (3D Rendered).
          5. [APPLICATION]: Laptop Stickers, Standee, Notebook mockups.
        `;
        break;
    }

    // Construct parts array
    const parts: any[] = [{ text: systemPrompt }];
    
    // Add reference image if available
    if (referenceImage) {
      parts.unshift({
        inlineData: {
          mimeType: referenceImage.mimeType,
          data: referenceImage.data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          imageSize: '2K',
          aspectRatio: mode === 'ani_storyboard' || mode === 'goods' ? '4:3' : '3:4' 
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
  editPrompt: string,
  mode: GenerationMode
): Promise<GeneratedImage> => {
  const apiKey = CONFIG.API_KEY;
  if (!apiKey) {
    throw new Error("API Key가 설정되지 않았습니다.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Detect Korean
    const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(editPrompt);
    const textInstruction = isKorean 
      ? "Ensure any new text or labels are rendered in clear KOREAN (Hangul)." 
      : "";

    // Brief context based on mode to keep the edit relevant
    let contextHint = "";
    if (mode === 'ad_storyboard') contextHint = "Maintain the 4-panel comic layout.";
    else if (mode === 'emoticon') contextHint = "Maintain the grid layout of stickers.";
    else if (mode === 'moving_emoticon') contextHint = "Maintain the sprite sheet grid.";
    else contextHint = "Maintain the 5-section brand sheet layout.";

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
            text: `Edit this image. 
            
            STRICT CONSTRAINTS:
            - ${contextHint}
            - Keep the character consistent.
            - Style: High-quality render.
            - ${textInstruction}
            
            Edit instruction: ${editPrompt}`
          }
        ]
      },
      config: {
        imageConfig: {
          imageSize: '2K',
          aspectRatio: mode === 'ani_storyboard' || mode === 'goods' ? '4:3' : '3:4'
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
