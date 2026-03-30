// Shared types with foody app
export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  ingredients?: string[];
  nutritionalInfo?: NutritionalInfo;
  allergens?: string[];
  dietary?: string[];
}

export interface AnalyzeMenuRequest {
  image: string; // base64 encoded image
  userId?: string;
}

export interface AnalyzeMenuResponse {
  menuItems: MenuItem[];
  confidence: number; // 0-100
  rawText?: string;
  processingTimeMs: number;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: unknown;
}
