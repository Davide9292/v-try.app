# 🧪 V-Try.app Testing Guide

## 🚀 Quick Start - Test Extension in 5 Minutes

### Prerequisites
- Chrome browser
- Railway account (free tier available)
- 5 minutes of your time

### Step 1: Deploy Backend to Railway (2 minutes)

1. **Fork/Clone Repository**
   ```bash
   git clone https://github.com/Davide9292/v-try.app.git
   cd v-try.app
   ```

2. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub
   - Connect your repository

3. **One-Click Deploy**
   - Click "Deploy from GitHub repo"
   - Select this repository
   - Railway will auto-detect and deploy

4. **Add Environment Variables** (in Railway dashboard)
   ```
   NODE_ENV=production
   JWT_SECRET=vtry-super-secure-jwt-secret-2024
   KIE_AI_API_KEY=mock_key_for_testing
   AWS_ACCESS_KEY_ID=mock_aws_key
   AWS_SECRET_ACCESS_KEY=mock_aws_secret  
   AWS_S3_BUCKET=mock-bucket
   AWS_REGION=us-east-1
   ```

5. **Get Your API URL**
   - Copy the generated URL (e.g., `https://vtry-app-production-xxxx.up.railway.app`)

### Step 2: Configure Extension (1 minute)

1. **Update API URL**
   Edit `extension/shared/constants.js`:
   ```javascript
   API_BASE_URL: 'https://your-railway-url-here.up.railway.app',
   ```

2. **Update Manifest**
   Edit `extension/manifest.json` - add your Railway URL to `host_permissions`:
   ```json
   "host_permissions": [
     "https://your-railway-url-here.up.railway.app/*",
     // ... other permissions
   ]
   ```

### Step 3: Load Extension (1 minute)

1. **Open Chrome Extensions**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)

2. **Load Extension**
   - Click "Load unpacked"
   - Select the `extension/` folder
   - Extension should load without errors

### Step 4: Test Authentication (1 minute)

1. **Click Extension Icon**
   - Should show V-Try.app popup
   - Click "Create Account"

2. **Sign Up**
   - Enter email: `test@example.com`
   - Password: `TestPassword123`
   - Username: `testuser`

3. **Upload Images**
   - Upload a clear face photo
   - Upload a full body photo
   - Click "Complete Setup"

### Step 5: Test Try-On (30 seconds)

1. **Go to E-commerce Site**
   - Visit any online store (e.g., Amazon, Zara, H&M)
   - Find a product with clothing images

2. **Hover Over Product Image**
   - Should see "Try On" badge appear
   - Click the badge

3. **Watch Generation**
   - Modal should open showing progress
   - Mock AI will generate a test result
   - Result should appear in your feed

## 🔧 Development Testing

### Local Backend Testing

```bash
# 1. Install dependencies
npm install
cd api && npm install

# 2. Setup environment
cp api/env.example api/.env
# Edit api/.env with your values

# 3. Setup database (use Supabase free tier)
export DATABASE_URL="your-supabase-connection-string"
cd api
npx prisma migrate deploy
npx prisma db seed

# 4. Start backend
npm run dev
```

### Extension Development

```bash
# Update constants for local testing
# In extension/shared/constants.js:
IS_DEVELOPMENT: true,
API_BASE_URL_LOCAL: 'http://localhost:3001',
```

## 🧪 Test Scenarios

### Authentication Flow
- [ ] Sign up with new account
- [ ] Login with existing account
- [ ] Upload face and body images
- [ ] Profile completion check
- [ ] Logout and re-login

### Try-On Generation
- [ ] Hover detection on images
- [ ] Badge appearance and positioning
- [ ] Click to start generation
- [ ] Progress modal display
- [ ] Result display and actions
- [ ] Feed updates with new results

### Feed Management
- [ ] View try-on history
- [ ] Search results
- [ ] Filter by type (image/video)
- [ ] Like/unlike results
- [ ] Share results
- [ ] Download results

### Collections
- [ ] Create new collection
- [ ] Add results to collections
- [ ] View collection contents
- [ ] Remove from collections

### Error Handling
- [ ] Network errors
- [ ] Authentication failures
- [ ] File upload errors
- [ ] Generation failures
- [ ] Rate limiting

## 🐛 Common Issues & Solutions

### Extension Won't Load
```
Solution: Check manifest.json syntax
Tool: chrome://extensions/ > Check for errors
```

### CORS Errors
```
Solution: Add extension origin to backend CORS
Backend: Update CORS_ORIGINS environment variable
```

### Authentication Fails
```
Solution: Check API URL and JWT secret
Debug: Open browser console for error details
```

### Images Won't Upload
```
Solution: Check file size (<4MB) and format (PNG/JPEG)
Debug: Check network tab for upload requests
```

### Generation Doesn't Start
```
Solution: Check user profile completion
Debug: Verify face and body images are uploaded
```

## 📊 Test Data

### Sample User Accounts
```json
{
  "email": "test@example.com",
  "password": "TestPassword123",
  "username": "testuser"
}
```

### Test Images
Use these types of images for best results:
- **Face**: Clear headshot, good lighting, neutral expression
- **Body**: Full body photo, standing straight, minimal background
- **Products**: High-quality product images from e-commerce sites

### Test Websites
Good sites for testing try-on functionality:
- Amazon Fashion
- Zara
- H&M
- ASOS
- Nike
- Adidas

## 🔍 Debug Tools

### Browser Console
```javascript
// Check extension status
window.vtryApp

// Check authentication
window.vtryAuth.isAuthenticated()

// Check current user
window.vtryAuth.getCurrentUser()

// Check AI service
window.vtryAI.getActiveJobs()

// Check feed
window.vtryFeed.getFeedStats()
```

### Network Tab
- Monitor API requests
- Check response codes
- Verify request payloads

### Extension DevTools
```
chrome://extensions/ > V-Try.app > Details > Inspect views
```

## 🎯 Success Criteria

Extension is working correctly if:
- [ ] Loads without console errors
- [ ] Authentication flow completes
- [ ] Images upload successfully
- [ ] Try-on badge appears on hover
- [ ] Generation modal shows progress
- [ ] Results appear in feed
- [ ] All UI interactions work smoothly

## 🚀 Production Deployment

Once testing is complete:

1. **Update Extension for Production**
   ```javascript
   IS_DEVELOPMENT: false,
   API_BASE_URL: 'https://your-production-domain.com',
   ```

2. **Package Extension**
   ```bash
   # Create extension package
   cd extension
   zip -r v-try-app-extension.zip . -x "*.DS_Store" "node_modules/*"
   ```

3. **Submit to Chrome Web Store**
   - Go to Chrome Developer Dashboard
   - Upload extension package
   - Fill in store listing details
   - Submit for review

## 📈 Monitoring

### Health Checks
```bash
# API health
curl https://your-api-url.com/health

# Database connection
curl https://your-api-url.com/health | jq '.database'
```

### Usage Analytics
- Monitor user signups
- Track generation requests
- Monitor error rates
- Check performance metrics

## 🔒 Security Checklist

- [ ] JWT secrets are secure
- [ ] API endpoints require authentication
- [ ] File uploads are validated
- [ ] CORS is properly configured
- [ ] Rate limiting is active
- [ ] Input sanitization is working
- [ ] HTTPS is enforced

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Verify API URL is correct
3. Ensure backend is running
4. Check network connectivity
5. Review deployment logs

For additional help:
- GitHub Issues: https://github.com/Davide9292/v-try.app/issues
- Documentation: See `/docs` folder
