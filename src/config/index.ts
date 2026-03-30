import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : ['http://localhost:5173'],
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  imageProcessing: {
    maxSizeMB: parseInt(process.env.MAX_IMAGE_SIZE_MB || '5', 10),
    acceptedTypes: (process.env.ACCEPTED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(','),
  },
};
