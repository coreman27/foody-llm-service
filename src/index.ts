import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import menuRoutes from './routes/menu.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import logger from './utils/logger';

export const createApp = (): Application => {
  const app = express();

  // Trust proxy - required for Cloud Run and rate limiting
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Body parser - increase limit for base64 images
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      service: 'foody-llm-service',
      timestamp: new Date().toISOString(),
    });
  });

  // Root endpoint to provide discoverability for service routes
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      service: 'foody-llm-service',
      status: 'ok',
      version: '1.0.0',
      description: 'LLM-powered menu analysis microservice',
      docs: {
        health: '/health',
        menuAnalysisBase: '/api/v1',
        endpoints: [
          {
            method: 'POST',
            path: '/api/v1/analyze-menu',
            description: 'Analyze a menu image and extract menu items',
            body: {
              image: 'base64 encoded image (data:image/...)',
              userId: 'optional user ID for logging',
            },
          },
          {
            method: 'GET',
            path: '/api/v1/analyze-menu/health',
            description: 'Health check for menu analysis endpoint',
          },
        ],
      },
    });
  });

  // API routes
  app.use('/api/v1', menuRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

// Start server if this file is run directly
if (require.main === module) {
  const app = createApp();
  const PORT = typeof config.port === 'string' ? parseInt(config.port, 10) : config.port;

  app.listen(PORT, () => {
    logger.info(`🚀 foody-llm-service running on port ${PORT}`);
    logger.info(`📝 Environment: ${config.nodeEnv}`);
  });
}
