import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'crypto';
import { config } from '../config';
import logger from '../utils/logger';
import { MenuItem } from '../types';

interface ContentBlock {
  type: string;
  text?: string;
}

const client = new Anthropic({
  apiKey: config.anthropic.apiKey,
}) as any; // Type assertion for SDK compatibility

interface VisionAnalysisResult {
  menuItems: MenuItem[];
  confidence: number;
  rawText: string;
}

const MENU_ANALYSIS_PROMPT = `You are an expert menu analyzer. Analyze the provided menu image and extract all menu items.

For each item, extract and provide in JSON format:
- id: Generate a unique UUID
- name: The name of the dish
- description: Brief description if available
- price: The price if visible (as a number)
- category: The category/section of the menu (e.g., "Appetizers", "Main Course", "Desserts")
- ingredients: List of main ingredients if discernible
- allergens: List of common allergens (e.g., "peanuts", "dairy", "gluten", "shellfish")
- dietary: Dietary tags (e.g., "vegetarian", "vegan", "gluten-free", "spicy")
- nutritionalInfo: Estimate nutritional values if possible:
  - calories: Estimated calories
  - protein: Grams of protein
  - carbs: Grams of carbs
  - fats: Grams of fat
  - fiber: Grams of fiber
  - sugar: Grams of sugar
  - sodium: Milligrams of sodium

Return ONLY valid JSON in this exact format:
{
  "menuItems": [
    {
      "id": "unique-uuid",
      "name": "Item Name",
      "description": "Description",
      "price": 12.99,
      "category": "Main Course",
      "ingredients": ["ingredient1", "ingredient2"],
      "allergens": ["dairy", "gluten"],
      "dietary": ["vegetarian"],
      "nutritionalInfo": {
        "calories": 450,
        "protein": 25,
        "carbs": 45,
        "fats": 12,
        "fiber": 3,
        "sugar": 5,
        "sodium": 800
      }
    }
  ],
  "confidence": 0.95,
  "rawText": "Full OCR text extracted from the menu"
}

Confidence should be a number between 0 and 1 representing how confident you are in the extraction quality.

Rules:
- Include ALL items visible on the menu
- For missing information, omit the field (don't use null)
- Be conservative with nutritional estimates
- For prices, extract the numeric value only
- For allergens and dietary, only include if clearly indicated or reasonably inferred
- rawText should contain the full OCR/transcription of what you see`;

export const claudeVisionService = {
  async analyzeMenuImage(base64Image: string): Promise<VisionAnalysisResult> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting menu image analysis with Claude Vision...');

      // Extract base64 data and media type
      const matches = base64Image.match(/data:(image\/\w+);base64,(.+)/);
      if (!matches || !matches[2]) {
        throw new Error('Invalid base64 image format');
      }

      const mediaType = matches[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
      const imageData = matches[2];

      // Call Claude Vision API
      const response = await client.messages.create({
        model: config.anthropic.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: imageData,
                },
              },
              {
                type: 'text',
                text: MENU_ANALYSIS_PROMPT,
              },
            ],
          },
        ],
      });

      logger.info('Claude API response received', {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        stopReason: response.stop_reason,
      });

      // Parse the response
      const textContent = response.content.find((block: ContentBlock) => block.type === 'text') as ContentBlock | undefined;
      if (!textContent || textContent.type !== 'text' || !textContent.text) {
        throw new Error('No text content in Claude response');
      }

      // Extract JSON from the response
      const jsonMatch = textContent.text!.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from Claude response');
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);

      // Validate and normalize response
      const menuItems: MenuItem[] = (parsedResponse.menuItems || []).map(
        (item: any) => ({
          id: item.id || randomUUID(),
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          ingredients: item.ingredients,
          allergens: item.allergens,
          dietary: item.dietary,
          nutritionalInfo: item.nutritionalInfo,
        })
      );

      const processingTime = Date.now() - startTime;

      logger.info('Menu analysis completed', {
        itemsExtracted: menuItems.length,
        confidence: parsedResponse.confidence,
        processingTimeMs: processingTime,
      });

      return {
        menuItems,
        confidence: Math.round((parsedResponse.confidence || 0.8) * 100),
        rawText: parsedResponse.rawText || '',
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      if (error instanceof Anthropic.APIError) {
        logger.error('Claude API error', {
          status: error.status,
          message: error.message,
          processingTimeMs: processingTime,
        });

        if (error.status === 401 || error.status === 403) {
          throw {
            statusCode: 502,
            code: 'UPSTREAM_AUTH_FAILED',
            message: 'Claude API authentication failed. Verify ANTHROPIC_API_KEY secret value.',
          };
        }

        if (error.status === 429) {
          throw {
            statusCode: 429,
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Claude API rate limit exceeded. Please try again later.',
          };
        }

        if (error.status === 400) {
          throw {
            statusCode: 400,
            code: 'INVALID_REQUEST',
            message: 'Invalid request to Claude API',
          };
        }

        if (error.status === 404) {
          throw {
            statusCode: 502,
            code: 'MODEL_NOT_FOUND',
            message: `Claude model not found: ${config.anthropic.model}`,
          };
        }

        if (error.status && error.status >= 500) {
          throw {
            statusCode: 503,
            code: 'SERVICE_UNAVAILABLE',
            message: 'Claude API is temporarily unavailable',
          };
        }
      }

      if (error instanceof SyntaxError) {
        logger.error('JSON parsing error', {
          message: error.message,
          processingTimeMs: processingTime,
        });

        throw {
          statusCode: 500,
          code: 'PARSE_ERROR',
          message: 'Failed to parse Claude response',
        };
      }

      logger.error('Unexpected error in menu analysis', {
        error: error instanceof Error ? error.message : String(error),
        processingTimeMs: processingTime,
      });

      throw {
        statusCode: 500,
        code: 'ANALYSIS_FAILED',
        message: 'Failed to analyze menu image',
      };
    }
  },
};
