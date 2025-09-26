# 🧪 V-Try.app Extension Testing Guide

## 🎯 **STEP-BY-STEP TESTING PROCESS**

### **STEP 1: Get Your Railway Deployment URL**

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Click on your V-Try project**
3. **Click on your API service**
4. **Copy your deployment URL** (looks like: `https://your-app-name-production-xxxx.up.railway.app`)

### **STEP 2: Update Extension Configuration**

1. **Open**: `extension/shared/constants.js`
2. **Replace line 4** with your actual Railway URL:
   ```javascript
   API_BASE_URL: 'https://your-actual-railway-url.up.railway.app',
   ```
3. **Set production mode** on line 10:
   ```javascript
   IS_DEVELOPMENT: false,
   ```

### **STEP 3: Update Manifest Permissions**

1. **Open**: `extension/manifest.json`
2. **Add your Railway URL** to `host_permissions` (around line 19):
   ```json
   "host_permissions": [
     "https://api.kie.ai/*",
     "https://api.v-try.app/*", 
     "https://v-try.app/*",
     "https://your-actual-railway-url.up.railway.app/*",
     "http://localhost:3001/*",
     "http://localhost:3000/*"
   ],
   ```

### **STEP 4: Test API Connection**

Run the API test script:

```bash
# Edit the script first
nano test-api.sh

# Replace RAILWAY_URL with your actual URL, then run:
./test-api.sh
```

**Expected Output:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-26T...",
  "version": "2.0.0",
  "environment": "production",
  "database": "connected",
  "redis": "not_available"
}
```

### **STEP 5: Load Extension in Chrome**

1. **Open Chrome** and go to `chrome://extensions/`
2. **Enable "Developer mode"** (toggle in top-right)
3. **Click "Load unpacked"**
4. **Select the `extension/` folder**
5. **Pin the extension** to your toolbar

### **STEP 6: Test Extension Functionality**

#### **6.1 Test Extension Popup**
1. **Click the V-Try extension icon**
2. **Verify popup opens** with login/signup options
3. **Check console** for any errors (F12 → Console)

#### **6.2 Test Authentication Flow**
1. **Click "Sign Up"** in popup
2. **Fill in test credentials**:
   ```
   Username: testuser123
   Email: test@example.com
   Password: TestPass123!
   ```
3. **Submit and verify**:
   - ✅ Account created successfully
   - ✅ JWT tokens stored
   - ✅ User redirected to feed/profile

#### **6.3 Test Content Script Integration**
1. **Visit any e-commerce site** (e.g., Amazon, Zara, H&M)
2. **Look for product images**
3. **Hover over clothing items**
4. **Verify V-Try badges appear** on suitable images
5. **Click a badge** to test try-on initiation

#### **6.4 Test API Communication**
1. **Open Chrome DevTools** (F12)
2. **Go to Network tab**
3. **Interact with extension**
4. **Verify API calls** to your Railway URL:
   ```
   POST https://your-railway-url.up.railway.app/api/auth/signup ✅
   GET  https://your-railway-url.up.railway.app/api/user/profile ✅
   POST https://your-railway-url.up.railway.app/api/ai/generate ✅
   ```

### **STEP 7: Test Core Features**

#### **7.1 User Profile & Image Upload**
1. **Go to profile section** in extension
2. **Upload face/body images**
3. **Verify images are stored** and displayed

#### **7.2 AI Generation Flow**
1. **Find a product image** on any website
2. **Click V-Try badge**
3. **Select generation options**:
   - Generation type: Image/Video
   - AI style: Realistic/Fashion/etc.
4. **Initiate generation**
5. **Monitor progress** (should show queued → processing → completed)

#### **7.3 Feed & History**
1. **Check feed section** for completed generations
2. **Verify images/videos display correctly**
3. **Test like/unlike functionality**
4. **Test sharing features**

### **STEP 8: Error Testing**

#### **8.1 Network Errors**
1. **Disconnect internet** temporarily
2. **Try using extension**
3. **Verify graceful error handling**

#### **8.2 Authentication Errors**
1. **Clear extension storage** (chrome://extensions/ → Extension details → Storage)
2. **Try accessing protected features**
3. **Verify login prompt appears**

#### **8.3 Rate Limiting**
1. **Make multiple rapid API calls**
2. **Verify rate limiting works**
3. **Check error messages are user-friendly**

### **STEP 9: Performance Testing**

#### **9.1 Memory Usage**
1. **Open Chrome Task Manager** (Shift+Esc)
2. **Use extension extensively**
3. **Monitor memory consumption**
4. **Verify no memory leaks**

#### **9.2 Page Load Impact**
1. **Test extension on various websites**
2. **Measure page load times** (DevTools → Performance)
3. **Verify minimal performance impact**

### **STEP 10: Cross-Browser Testing**

#### **10.1 Test in Edge**
1. **Go to** `edge://extensions/`
2. **Enable Developer mode**
3. **Load unpacked extension**
4. **Repeat core functionality tests**

#### **10.2 Test in Firefox** (if compatible)
1. **Go to** `about:debugging`
2. **Load temporary add-on**
3. **Test basic functionality**

## 🐛 **COMMON ISSUES & SOLUTIONS**

### **Issue: Extension won't load**
- **Check manifest.json syntax** (use JSON validator)
- **Verify all referenced files exist**
- **Check Chrome console for errors**

### **Issue: API calls failing**
- **Verify Railway URL is correct**
- **Check CORS settings** in API
- **Verify host_permissions in manifest**

### **Issue: Authentication not working**
- **Check JWT token storage**
- **Verify API endpoints are accessible**
- **Check network requests in DevTools**

### **Issue: Content script not injecting**
- **Check matches pattern** in manifest
- **Verify content script files exist**
- **Check for JavaScript errors**

## ✅ **SUCCESS CRITERIA**

Your extension is working correctly if:

- ✅ **Popup opens** without errors
- ✅ **Authentication flow** completes successfully
- ✅ **API communication** works with Railway backend
- ✅ **Content scripts** inject on all websites
- ✅ **V-Try badges** appear on product images
- ✅ **AI generation** initiates and completes
- ✅ **Feed displays** completed generations
- ✅ **Error handling** is graceful
- ✅ **Performance impact** is minimal

## 🚀 **NEXT STEPS**

After successful testing:

1. **Package extension** for distribution
2. **Submit to Chrome Web Store**
3. **Set up monitoring** and analytics
4. **Plan feature updates** and improvements

## 📞 **NEED HELP?**

If you encounter issues:
1. **Check browser console** for errors
2. **Review network requests** in DevTools
3. **Verify Railway API** is responding
4. **Test with simplified scenarios** first

---

**Happy Testing! 🎉**
