import { z } from 'zod';

// MenuItem validation schema
export const NutritionalInfoSchema = z.object({
  calories: z.number().int().positive().optional(),
  protein: z.number().positive().optional(),
  carbs: z.number().positive().optional(),
  fats: z.number().positive().optional(),
  fiber: z.number().positive().optional(),
  sugar: z.number().positive().optional(),
  sodium: z.number().positive().optional(),
}).strict();

export const MenuItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive().optional(),
  category: z.string().max(100).optional(),
  ingredients: z.array(z.string().max(100)).optional(),
  nutritionalInfo: NutritionalInfoSchema.optional(),
  allergens: z.array(z.string().max(100)).optional(),
  dietary: z.array(z.string().max(50)).optional(),
});

export const AnalyzeMenuRequestSchema = z.object({
  image: z.string().regex(/^data:image\/(jpeg|png|webp|gif);base64,/, 'Invalid base64 image format'),
  userId: z.string().optional(),
});

export const AnalyzeMenuResponseSchema = z.object({
  menuItems: z.array(MenuItemSchema),
  confidence: z.number().min(0).max(100),
  rawText: z.string().optional(),
  processingTimeMs: z.number().int().positive(),
});

// Type exports
export type NutritionalInfo = z.infer<typeof NutritionalInfoSchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type AnalyzeMenuRequest = z.infer<typeof AnalyzeMenuRequestSchema>;
export type AnalyzeMenuResponse = z.infer<typeof AnalyzeMenuResponseSchema>;
