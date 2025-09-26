# 🔐 V-Try.app Extension Sign-In Testing Guide

## 🚀 Quick Test Setup (2 minutes)

### Step 1: Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (top right toggle)
3. Click **"Load unpacked"**
4. Select the `extension/` folder from your project
5. ✅ You should see "V-Try.app - AI Virtual Try-On" extension loaded

### Step 2: Open Extension Popup
1. Click the **V-Try.app extension icon** in Chrome toolbar
2. ✅ You should see the loading screen briefly, then the auth screen

## 🔐 Testing Sign-In Flow

### Option A: Create New Account (Recommended)
1. In the extension popup, click **"Create Account"**
2. Fill in the inline form:
   - **Username**: `testuser123`
   - **Email**: `test@example.com`
   - **Password**: `password123`
3. Click **"Create Account"**
4. ✅ **Expected Result**: Should show "Success! Redirecting..." then go to setup page

### Option B: Use Existing Account
1. In the extension popup, click **"Sign In"**
2. Enter your existing credentials
3. Click **"Sign In"**
4. ✅ **Expected Result**: Should redirect to main page or setup page

## 📷 Profile Setup Flow

**If you see the setup page (expected for new accounts):**

1. **Face Image Upload**:
   - Click the **"Click to upload"** area or **"Choose Face Image"** button
   - Select a clear face photo
   - ✅ Should show preview immediately

2. **Body Image Upload**:
   - Click the **"Click to upload"** area or **"Choose Body Image"** button  
   - Select a full body photo
   - ✅ Should show preview immediately

3. **Complete Setup**:
   - Click **"Complete Setup"** (should be enabled after both uploads)
   - ✅ Should show "Setting up your profile..." then redirect to main page

## 🎉 Main Page Verification

**Once signed in, you should see:**

### Header Section
- ✅ Your **username** displayed
- ✅ **Subscription tier** (FREE/PRO)
- ✅ **Settings** (⚙) and **Logout** (↗) buttons

### Navigation Tabs
- ✅ **Try-On** tab (active by default)
- ✅ **Feed** tab
- ✅ **Collections** tab

### Try-On Tab Content
- ✅ **Generation Type**: Image/Video options
- ✅ **Style selector**: Realistic, Fashion, Artistic, Lifestyle
- ✅ **Usage Today stats**: Images used, Videos used, Credits remaining
- ✅ **Instructions**: How to use the extension

### Feed Tab
- ✅ **Search bar**: "Search your try-ons..."
- ✅ **Empty state**: "No try-ons yet" (if no previous try-ons)
- ✅ **Loading indicator** when switching to tab

### Collections Tab
- ✅ **"New" button**: Create collections
- ✅ **Empty state**: "No collections" (initially)

## 🔍 Debugging Sign-In Issues

### If Sign-In Fails:

1. **Open Chrome DevTools**:
   - Right-click extension popup → **"Inspect"**
   - Go to **Console** tab
   - Look for error messages

2. **Check Network Requests**:
   - Go to **Network** tab in DevTools
   - Try signing in again
   - Look for requests to `v-tryapp-production.up.railway.app`
   - Check if any requests are failing (red status)

3. **Common Issues & Solutions**:

   **❌ "Network error occurred"**
   - ✅ Check internet connection
   - ✅ Verify Railway backend is running: https://v-tryapp-production.up.railway.app/health

   **❌ "Authentication failed"**
   - ✅ Try creating a new account instead
   - ✅ Check if email/password are correct

   **❌ Extension doesn't load**
   - ✅ Reload extension: `chrome://extensions/` → Click reload button
   - ✅ Check console for JavaScript errors

   **❌ Stuck on loading screen**
   - ✅ Wait 10 seconds (auth service loading)
   - ✅ Reload extension and try again

## 🧪 Test the Complete Flow

### End-to-End Test:
1. **Create account** → ✅ Success message
2. **Upload images** → ✅ Previews show
3. **Complete setup** → ✅ Redirects to main page
4. **Check all tabs** → ✅ All content loads
5. **Close and reopen extension** → ✅ Still logged in, goes to main page

### Persistence Test:
1. Sign in successfully
2. **Close extension popup**
3. **Reopen extension** → ✅ Should go directly to main page (not auth page)
4. **Refresh Chrome tab** → ✅ Extension should still work
5. **Restart Chrome** → ✅ Should still be logged in

## 📱 Testing on Real Websites

**Once signed in, test the try-on feature:**

1. Go to any e-commerce site (e.g., amazon.com, zara.com)
2. **Hover over product images** → ✅ Should see "Try On" badge
3. **Click the badge** → ✅ Should show generation modal
4. **Check authentication** → ✅ Should work without asking to sign in again

## 🎯 Success Criteria

**✅ Sign-in is successful if:**
- Account creation works smoothly
- Login persists across browser sessions
- Main page shows all sections correctly
- Navigation between tabs works
- Extension remembers you're logged in
- Try-on badges appear on product images

## 🆘 Need Help?

**If anything doesn't work:**
1. Check the console logs in DevTools
2. Verify the backend is running: https://v-tryapp-production.up.railway.app/health
3. Try creating a fresh account with a different email
4. Reload the extension and try again

**Backend API Health Check:**
```bash
curl https://v-tryapp-production.up.railway.app/health
```
Should return: `{"status":"healthy","timestamp":"...","database":"connected"}`
