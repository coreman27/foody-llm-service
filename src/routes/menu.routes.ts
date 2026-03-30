import { Router, Request, Response } from 'express';
import { validateImageRequest } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { claudeVisionService } from '../services/claude.service';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/v1/analyze-menu
 * Analyze a menu image and extract menu items using Claude Vision
 */
router.post(
  '/analyze-menu',
  validateImageRequest,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const { image, userId } = req.body;

    logger.info('Menu analysis request received', {
      userId,
      hasImage: !!image,
    });

    try {
      // Analyze the menu image
      const result = await claudeVisionService.analyzeMenuImage(image);

      const processingTime = Date.now() - startTime;

      logger.info('Menu analysis completed successfully', {
        userId,
        itemsExtracted: result.menuItems.length,
        confidence: result.confidence,
        totalTimeMs: processingTime,
      });

      res.status(200).json({
        menuItems: result.menuItems,
        confidence: result.confidence,
        rawText: result.rawText,
        processingTimeMs: processingTime,
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;

      logger.error('Menu analysis failed', {
        userId,
        error: error instanceof Error ? error.message : String(error),
        totalTimeMs: processingTime,
      });

      // Handle specific error types
      if (
        typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        'code' in error
      ) {
        const appError = error as any;
        res.status(appError.statusCode).json({
          code: appError.code,
          message: appError.message,
        });
      } else {
        res.status(500).json({
          code: 'ANALYSIS_FAILED',
          message: 'Failed to analyze menu image',
        });
      }
    }
  })
);

/**
 * GET /api/v1/analyze-menu/health
 * Health check for the menu analysis endpoint
 */
router.get('/analyze-menu/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'foody-llm-service',
    endpoint: '/api/v1/analyze-menu',
    timestamp: new Date().toISOString(),
  });
});

export default router;
