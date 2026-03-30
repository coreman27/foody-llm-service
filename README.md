# Foody LLM Service

LLM-powered menu analysis microservice for the Foody platform. Uses Claude Vision API to intelligently extract menu items from restaurant menu images.

## Features

- **Claude Vision Integration**: Analyzes menu images using Claude 3.5 Sonnet's vision capabilities
- **Structured Extraction**: Extracts menu items with name, price, category, ingredients, allergens, dietary info, and nutritional estimates
- **Enterprise-Ready**: Production-ready error handling, rate limiting, logging, and security measures
- **Type-Safe**: Full TypeScript support with validation

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Anthropic API Key (`ANTHROPIC_API_KEY`)

### Installation

```bash
# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Add your Anthropic API Key to .env
# ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

### Development

```bash
# Start development server (auto-reloads on changes)
npm run dev

# Build TypeScript
npm run build

# Run linter
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

### Production

```bash
# Build
npm run build

# Start
npm start

# Verify health
curl http://localhost:8080/health
```

## API Endpoints

### Health Check
```
GET /health
```
Returns service health status.

### Menu Analysis
```
POST /api/v1/analyze-menu
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "userId": "optional-user-id"
}
```

**Request:**
- `image` (required): Base64-encoded menu image with `data:image/` prefix
- `userId` (optional): User ID for logging/tracking

**Response:**
```json
{
  "menuItems": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Grilled Salmon",
      "description": "Atlantic salmon fillet with lemon butter sauce",
      "price": 24.99,
      "category": "Main Course",
      "ingredients": ["salmon", "lemon", "butter", "garlic"],
      "allergens": ["fish"],
      "dietary": ["gluten-free"],
      "nutritionalInfo": {
        "calories": 450,
        "protein": 35,
        "carbs": 5,
        "fats": 28,
        "fiber": 0,
        "sugar": 1,
        "sodium": 400
      }
    }
  ],
  "confidence": 95,
  "rawText": "Menu text as extracted from image",
  "processingTimeMs": 2345
}
```

## Configuration

Environment variables (see `.env.example` for defaults):

```bash
# Server
PORT=8080
NODE_ENV=development
LOG_LEVEL=info

# API Keys
ANTHROPIC_API_KEY=<your-anthropic-api-key>

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting (per 15 minutes)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Image Processing
MAX_IMAGE_SIZE_MB=5
ACCEPTED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
```

## Docker

```bash
# Build image
docker build -t foody-llm-service .

# Run container
docker run -p 8080:8080 \
  -e ANTHROPIC_API_KEY=<your-anthropic-api-key> \
  foody-llm-service

# Verify it's running
curl http://localhost:8080/health
```

## Deployment

### Google Cloud Run

```bash
# Build and push to Container Registry
gcloud builds submit --config cloudbuild.yaml

# Or manually:
gcloud builds submit \
  --tag gcr.io/PROJECT_ID/foody-llm-service:latest

# Deploy to Cloud Run
gcloud run deploy foody-llm-service \
  --image gcr.io/PROJECT_ID/foody-llm-service:latest \
  --platform managed \
  --region us-central1 \
  --set-env-vars ANTHROPIC_API_KEY=<your-anthropic-api-key> \
  --memory 512Mi \
  --timeout 60s \
  --max-instances 100
```

Store `ANTHROPIC_API_KEY` in Google Cloud Secret Manager and reference it during deployment.

## Error Handling

The service returns structured error responses:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

Common error codes:
- `MISSING_IMAGE`: Image field not provided
- `INVALID_BASE64_FORMAT`: Image format invalid
- `UNSUPPORTED_IMAGE_TYPE`: Image type not supported (only JPEG, PNG, WebP, GIF)
- `IMAGE_TOO_LARGE`: Image exceeds 5MB limit
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVICE_UNAVAILABLE`: Claude API temporarily unavailable
- `ANALYSIS_FAILED`: Menu analysis failed

## Logging

All requests and errors are logged to:
- `combined.log`: All logs
- `error.log`: Errors only
- Console output in development mode

## Testing

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- menu.routes.test.ts

# Watch mode
npm run test:watch

# With coverage
npm run test -- --coverage
```

## Integration with Foody Frontend

The frontend should:

1. Capture/upload a menu image
2. Convert to base64 with `data:image/` prefix
3. POST to `https://foody-llm-service.example.com/api/v1/analyze-menu`
4. Parse MenuItem objects from response
5. Store in IndexedDB or pass to recommendation engine

Example frontend code:
```typescript
const file = new File([...], 'menu.jpg', { type: 'image/jpeg' });
const reader = new FileReader();
reader.onload = async (e) => {
  const base64Image = e.target?.result as string;
  const response = await fetch('/api/v1/analyze-menu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image })
  });
  const { menuItems } = await response.json();
  // Use menuItems...
};
reader.readAsDataURL(file);
```

## Performance Considerations

- **Response Time**: ~2-5 seconds per menu image (depends on image complexity)
- **Token Usage**: ~500-1000 tokens per typical menu (~$0.02-0.04 per menu)
- **Cost**: ~$0.05-0.10 per menu analysis at scale
- **Rate Limiting**: 100 requests per 15 minutes by default

## Troubleshooting

### "ANTHROPIC_API_KEY is missing"
Set the environment variable or add to `.env` file.

### "Rate limit exceeded"
Reduce request frequency or increase `RATE_LIMIT_MAX_REQUESTS`.

### "Image too large"
Resize image before uploading or increase `MAX_IMAGE_SIZE_MB`.

### "Service unavailable"
Claude API is temporarily down. Retry after a few minutes.

## Architecture

```
MenuCapture.tsx (React component)
        ↓ uploads image
foody-llm-service (this service)
        ↓ analysis
Claude Vision API
        ↓ extracts items
MenuItem[] response
        ↓ stores
IndexedDB
        ↓ passes
RecommendationEngine
        ↓ scores
MenuItemRecommendation[]
```

## Development Guidelines

- Use TypeScript strict mode
- Write unit tests for new features
- Format code with Prettier before committing
- Follow Express middleware patterns
- Log important operations and errors
- Validate all inputs with middleware
- Handle all error cases gracefully

## Future Enhancements

- [ ] Caching layer for identical menus (7-day TTL)
- [ ] Multi-language support (detect & translate menus)
- [ ] Batch processing for multiple menus
- [ ] Nutritional database integration for more accurate data
- [ ] Confidence scoring per item
- [ ] Image preprocessing (rotate, crop, enhance contrast)
- [ ] WebSocket support for streaming responses

## License

MIT

## Support

For issues or questions, please create a GitHub issue or contact the Foody team.
