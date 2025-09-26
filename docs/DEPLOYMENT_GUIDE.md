# V-Try.app Deployment Guide

## 🚀 Quick Production Deployment

### Prerequisites
- GitHub account
- Railway account (https://railway.app)
- KIE AI API key
- AWS S3 bucket (optional, can use Railway storage)

### 1. Database Setup (PostgreSQL)

#### Option A: Railway PostgreSQL
1. Go to Railway dashboard
2. Create new project
3. Add PostgreSQL service
4. Copy the connection string

#### Option B: Supabase (Free tier available)
1. Go to https://supabase.com
2. Create new project
3. Go to Settings > Database
4. Copy the connection string

#### Option C: Neon (Free tier available)
1. Go to https://neon.tech
2. Create new project
3. Copy the connection string

### 2. Redis Setup

#### Option A: Railway Redis
1. In your Railway project
2. Add Redis service
3. Copy the connection string

#### Option B: Upstash (Free tier available)
1. Go to https://upstash.com
2. Create Redis database
3. Copy the connection string

### 3. Backend Deployment on Railway

1. **Connect Repository**
   ```bash
   # Push your code to GitHub first
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create Railway Project**
   - Go to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Environment Variables**
   In Railway dashboard, add these variables:
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=your-postgresql-connection-string
   REDIS_URL=your-redis-connection-string
   JWT_SECRET=your-super-secure-jwt-secret-here
   KIE_AI_API_KEY=your-kie-ai-key
   AWS_ACCESS_KEY_ID=your-aws-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret
   AWS_S3_BUCKET=your-bucket-name
   AWS_REGION=us-east-1
   CORS_ORIGINS=https://v-try.app,chrome-extension://
   ```

4. **Deploy**
   - Railway will automatically build and deploy
   - Wait for deployment to complete
   - Copy the generated URL (e.g., `https://your-project.up.railway.app`)

### 4. Update Extension Configuration

1. **Update API URL**
   Edit `extension/shared/constants.js`:
   ```javascript
   API_BASE_URL: 'https://your-project.up.railway.app',
   IS_DEVELOPMENT: false,
   ```

2. **Update Manifest Permissions**
   Edit `extension/manifest.json`:
   ```json
   "host_permissions": [
     "https://your-project.up.railway.app/*",
     // ... other permissions
   ]
   ```

### 5. Database Migration

After deployment, run database migrations:

```bash
# Using Railway CLI
railway login
railway link your-project-id
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

Or use Railway's web terminal in the dashboard.

### 6. Test the Extension

1. **Load Extension in Chrome**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the `extension/` folder

2. **Test Authentication**
   - Click extension icon
   - Try to sign up/login
   - Upload face and body images

3. **Test Try-On**
   - Go to any e-commerce site
   - Hover over product images
   - Click the V-Try badge
   - Verify generation works

### 7. Production Checklist

- [ ] Database is accessible and migrated
- [ ] Redis is connected and working
- [ ] API health check returns 200
- [ ] CORS is properly configured
- [ ] Rate limiting is active
- [ ] JWT tokens are secure
- [ ] File upload works
- [ ] WebSocket connections work
- [ ] Extension loads without errors
- [ ] Authentication flow works
- [ ] Image generation works
- [ ] Feed displays results

### 8. Monitoring & Maintenance

#### Health Checks
Your API exposes `/health` endpoint:
```bash
curl https://your-project.up.railway.app/health
```

#### Logs
View logs in Railway dashboard or use CLI:
```bash
railway logs
```

#### Database Management
Use Prisma Studio:
```bash
railway run npx prisma studio
```

### 9. Environment-Specific URLs

Update these URLs based on your deployment:

```javascript
// Development
API_BASE_URL: 'http://localhost:3001'

// Staging
API_BASE_URL: 'https://vtry-staging.up.railway.app'

// Production
API_BASE_URL: 'https://vtry-production.up.railway.app'
```

### 10. Troubleshooting

#### Common Issues

1. **CORS Errors**
   - Check CORS_ORIGINS environment variable
   - Ensure extension domain is whitelisted

2. **Database Connection**
   - Verify DATABASE_URL format
   - Check database service is running
   - Run migrations: `npx prisma migrate deploy`

3. **Redis Connection**
   - Verify REDIS_URL format
   - Check Redis service is running

4. **File Upload Issues**
   - Verify AWS credentials
   - Check S3 bucket permissions
   - Ensure bucket exists

5. **Authentication Issues**
   - Check JWT_SECRET is set
   - Verify token expiration settings
   - Check session storage

#### Debug Commands

```bash
# Check database connection
railway run npx prisma db ping

# View database schema
railway run npx prisma db pull

# Reset database (careful!)
railway run npx prisma migrate reset

# Check Redis connection
railway run node -e "const Redis = require('ioredis'); const redis = new Redis(process.env.REDIS_URL); redis.ping().then(console.log).catch(console.error).finally(() => process.exit())"
```

### 11. Performance Optimization

#### Database
- Enable connection pooling
- Add database indexes
- Monitor query performance

#### Redis
- Set appropriate TTL values
- Monitor memory usage
- Use Redis clustering if needed

#### API
- Enable gzip compression
- Implement proper caching
- Monitor response times

### 12. Security Best Practices

- [ ] Use strong JWT secrets
- [ ] Enable HTTPS only
- [ ] Implement rate limiting
- [ ] Validate all inputs
- [ ] Sanitize file uploads
- [ ] Monitor for suspicious activity
- [ ] Regular security updates

## 🎯 Quick Test Script

Save this as `test-deployment.js` and run with Node.js:

```javascript
const fetch = require('node-fetch');

const API_URL = 'https://your-project.up.railway.app';

async function testDeployment() {
  try {
    // Test health check
    console.log('Testing health check...');
    const health = await fetch(`${API_URL}/health`);
    const healthData = await health.json();
    console.log('Health:', healthData);
    
    // Test CORS
    console.log('Testing CORS...');
    const corsTest = await fetch(`${API_URL}/health`, {
      headers: { 'Origin': 'chrome-extension://test' }
    });
    console.log('CORS Status:', corsTest.status);
    
    console.log('✅ Deployment test completed');
  } catch (error) {
    console.error('❌ Deployment test failed:', error);
  }
}

testDeployment();
```

Run with: `node test-deployment.js`
