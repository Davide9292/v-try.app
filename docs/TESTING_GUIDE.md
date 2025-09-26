# V-Try.app Testing Guide

This guide covers how to test the V-Try.app platform components in development and production environments.

## 🎯 Current Implementation Status

### ✅ Completed Components

1. **Backend API Architecture**
   - ✅ Fastify server with enterprise-grade structure
   - ✅ Authentication system (JWT + sessions)
   - ✅ User management routes
   - ✅ AI generation routes (KIE AI integration)
   - ✅ Feed management system
   - ✅ Collections system
   - ✅ WebSocket real-time updates
   - ✅ Bull Queue for background processing
   - ✅ Prisma database schema
   - ✅ Error handling middleware
   - ✅ Request validation with Zod
   - ✅ Rate limiting and security

2. **Database Schema**
   - ✅ Complete Prisma schema with all models
   - ✅ User authentication and sessions
   - ✅ Try-on results with metadata
   - ✅ Collections and likes system
   - ✅ API usage tracking
   - ✅ Email verification tokens

3. **Services**
   - ✅ KIE AI service integration
   - ✅ AWS S3 file management
   - ✅ Redis caching and sessions
   - ✅ WebSocket real-time communication
   - ✅ Background job processing

4. **Extension Foundation**
   - ✅ Manifest V3 structure
   - ✅ Content script architecture
   - ✅ Basic UI components

### 🔧 Setup Requirements

Before testing, you need to configure:

1. **Database** (see `docs/DATABASE_SETUP.md`)
   - PostgreSQL (Supabase/Neon/Railway)
   - Redis (Upstash/Railway)

2. **External Services**
   - KIE AI API key
   - AWS S3 bucket and credentials

3. **Environment Variables**
   - Copy `api/env.example` to `api/.env`
   - Fill in all required values

## 🧪 Testing Procedures

### 1. Backend API Testing

#### Prerequisites
```bash
# Install dependencies
cd api && npm install --ignore-scripts

# Generate Prisma client
npx prisma generate

# Run database migrations (requires valid DATABASE_URL)
npx prisma migrate dev --name init
```

#### Start Development Server
```bash
# Terminal 1: API Server
cd api && npm run dev

# Terminal 2: Background Worker
cd api && npm run worker

# Terminal 3: Test endpoints
curl http://localhost:3001/health
```

#### Test Authentication Flow
```bash
# 1. Sign up new user
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "username": "testuser",
    "firstName": "Test",
    "lastName": "User"
  }'

# Expected: 201 with user data and tokens

# 2. Login existing user
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'

# Expected: 200 with user data and tokens
# Save the accessToken for next requests

# 3. Get user profile
curl -X GET http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 with user profile data
```

#### Test Image Upload
```bash
# Upload user images (requires base64 encoded images)
curl -X POST http://localhost:3001/api/user/upload-images \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "faceImage": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "bodyImage": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  }'

# Expected: 200 with updated user profile including image URLs
```

#### Test AI Generation
```bash
# Start AI generation job
curl -X POST http://localhost:3001/api/ai/generate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "image",
    "targetImage": "https://example.com/product-image.jpg",
    "style": "realistic",
    "productUrl": "https://example.com/product",
    "websiteInfo": {
      "domain": "example.com",
      "title": "Product Title",
      "description": "Product description"
    }
  }'

# Expected: 200 with jobId and status "queued"
# Save the jobId for status checking

# Check generation status
curl -X GET http://localhost:3001/api/ai/status/YOUR_JOB_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 with current status (queued/processing/completed/failed)
```

#### Test Feed System
```bash
# Get user's feed
curl -X GET http://localhost:3001/api/feed \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 with paginated results

# Search feed
curl -X GET "http://localhost:3001/api/feed/search?query=shirt" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 with search results
```

#### Test Collections
```bash
# Create collection
curl -X POST http://localhost:3001/api/collections \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Favorites",
    "description": "My favorite try-on results",
    "isPublic": false
  }'

# Expected: 201 with collection data
# Save the collection ID

# Add result to collection
curl -X POST http://localhost:3001/api/collections/COLLECTION_ID/items \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resultId": "YOUR_RESULT_ID"
  }'

# Expected: 201 with success message
```

### 2. Chrome Extension Testing

#### Installation
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` directory

#### Manual Testing
1. **Navigate to supported websites** (e.g., fashion e-commerce sites)
2. **Click extension icon** - should show popup
3. **Test authentication** - login/signup flow
4. **Upload images** - face and body photos
5. **Try virtual try-on** - select product and generate

#### Expected Behaviors
- ✅ Extension icon appears in toolbar
- ✅ Popup opens with authentication UI
- ✅ Login/signup works with backend API
- ✅ Image upload interface appears
- ✅ Try-on generation starts (may be mock data)
- ✅ Results appear in user feed

### 3. WebSocket Testing

#### Real-time Updates
```bash
# Use a WebSocket client (like wscat) to test
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:3001/ws

# Send authentication
{"type": "authenticate", "data": {"token": "YOUR_ACCESS_TOKEN"}}

# Expected: {"type": "authenticated", ...}

# Subscribe to generation updates
{"type": "subscribe", "data": {"channels": ["generation:YOUR_USER_ID"]}}

# Expected: {"type": "subscribed", ...}

# Start a generation job via API and watch for real-time updates
```

### 4. Performance Testing

#### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Create artillery config (artillery.yml)
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Health Check"
    requests:
      - get:
          url: "/health"

# Run load test
artillery run artillery.yml
```

#### Memory and CPU Monitoring
```bash
# Monitor API server resources
ps aux | grep node
top -p $(pgrep -f "npm run dev")

# Monitor Redis/Database connections
redis-cli info clients
# or check database connection pool
```

## 🚨 Troubleshooting

### Common Issues

1. **"DATABASE_URL not found"**
   - Check `api/.env` file exists and has valid DATABASE_URL
   - Test connection: `cd api && npx prisma db pull`

2. **"Redis connection failed"**
   - Check REDIS_URL in environment
   - Verify Redis service is running

3. **"KIE AI API error"**
   - Verify KIE_AI_API_KEY is valid
   - Check API rate limits

4. **"AWS S3 upload failed"**
   - Verify AWS credentials and bucket name
   - Check bucket permissions

5. **Extension not loading**
   - Check manifest.json syntax
   - Verify all files are present
   - Check Chrome extension console for errors

### Debug Commands

```bash
# Check API logs
cd api && npm run dev 2>&1 | tee api.log

# Check database schema
cd api && npx prisma studio

# Test Redis connection
redis-cli ping

# Check WebSocket connections
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: $(echo -n test | base64)" http://localhost:3001/ws
```

## 📊 Success Metrics

### Backend API
- ✅ Health endpoint responds with 200
- ✅ Authentication flow completes successfully
- ✅ Database operations work without errors
- ✅ File uploads complete successfully
- ✅ WebSocket connections establish properly

### Chrome Extension
- ✅ Extension loads without console errors
- ✅ Popup UI renders correctly
- ✅ API calls succeed from extension
- ✅ Image upload works from extension
- ✅ Try-on generation initiates successfully

### Integration
- ✅ End-to-end flow: signup → upload images → generate try-on → view results
- ✅ Real-time updates work via WebSocket
- ✅ Collections and feed management work
- ✅ Error handling graceful throughout

## 🚀 Production Testing

For production testing, see:
- `docs/DEPLOYMENT_GUIDE.md` - Railway deployment
- Railway logs and monitoring
- Production health checks
- Load testing with real traffic

## 📝 Test Results Template

```markdown
## Test Results - [Date]

### Environment
- Node.js version: 
- Database: 
- Redis: 
- KIE AI: 

### Backend API
- [ ] Health check
- [ ] Authentication
- [ ] User management
- [ ] AI generation
- [ ] Feed system
- [ ] Collections
- [ ] WebSocket

### Chrome Extension
- [ ] Installation
- [ ] Popup UI
- [ ] Authentication
- [ ] Image upload
- [ ] Try-on generation

### Issues Found
1. 
2. 
3. 

### Performance
- Response times: 
- Memory usage: 
- Error rates: 
```

This comprehensive testing approach ensures all components work together seamlessly before production deployment.
