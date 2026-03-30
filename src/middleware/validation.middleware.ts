import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import logger from '../utils/logger';

export interface ImageValidationError {
  statusCode: number;
  code: string;
  message: string;
}

export const validateImageRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { image } = req.body;

    if (!image) {
      res.status(400).json({
        code: 'MISSING_IMAGE',
        message: 'Image field is required',
      });
      return;
    }

    if (typeof image !== 'string') {
      res.status(400).json({
        code: 'INVALID_IMAGE_TYPE',
        message: 'Image must be a base64 encoded string',
      });
      return;
    }

    // Validate base64 format
    if (!image.startsWith('data:image/')) {
      res.status(400).json({
        code: 'INVALID_BASE64_FORMAT',
        message: 'Image must start with "data:image/" prefix',
      });
      return;
    }

    // Validate image type
    const mimeType = image.match(/data:(image\/\w+);/)?.[1];
    if (!mimeType || !config.imageProcessing.acceptedTypes.includes(mimeType)) {
      res.status(400).json({
        code: 'UNSUPPORTED_IMAGE_TYPE',
        message: `Unsupported image type. Accepted types: ${config.imageProcessing.acceptedTypes.join(', ')}`,
      });
      return;
    }

    // Estimate size (rough calculation: base64 is ~33% larger than binary)
    const base64Data = image.split(',')[1];
    if (!base64Data) {
      res.status(400).json({
        code: 'INVALID_BASE64_FORMAT',
        message: 'Invalid base64 format',
      });
      return;
    }

    const estimatedSizeMB = (base64Data.length * 0.75) / (1024 * 1024);
    if (estimatedSizeMB > config.imageProcessing.maxSizeMB) {
      res.status(413).json({
        code: 'IMAGE_TOO_LARGE',
        message: `Image exceeds maximum size of ${config.imageProcessing.maxSizeMB}MB`,
      });
      return;
    }

    logger.info('Image validation passed', {
      mimeType,
      estimatedSizeMB: estimatedSizeMB.toFixed(2),
    });

    next();
  } catch (error) {
    logger.error('Image validation error:', error);
    res.status(500).json({
      code: 'VALIDATION_ERROR',
      message: 'Error validating image',
    });
  }
};
