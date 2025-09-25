# 🚀 MirrorMe - Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Files Created
- [x] `manifest.json` - Extension configuration
- [x] `popup.html/css/js` - Extension popup interface  
- [x] `content.js/css` - Content script for web pages
- [x] `background.js` - Service worker
- [x] `create_icons.html` - Icon generator tool
- [x] `test_page.html` - Testing page
- [x] `README.md` - Documentation
- [x] `package.json` - Project metadata

### 🔧 Setup Required

#### 1. Generate Icons
1. Open `create_icons.html` in your browser
2. Download all three icon files (16x16, 48x48, 128x128)
3. Save them in the `icons/` folder with names:
   - `icon16.png`
   - `icon48.png` 
   - `icon128.png`

#### 2. Get Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new project or use existing
3. Generate API key for Gemini
4. Keep it secure for user configuration

## 📦 Installation Steps

### For End Users

#### Chrome Extension Installation
1. Download/clone the MirrorMe folder
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle top-right)
4. Click "Load unpacked extension"
5. Select the MirrorMe folder
6. Extension should appear in toolbar

#### Initial Configuration
1. Click the MirrorMe icon in Chrome toolbar
2. Enter your Gemini API key
3. Upload your personal photo
4. Choose output mode (Image/Animated)
5. Ready to use!

### For Developers

#### Development Setup
```bash
cd /path/to/MirrorMe
# No build process needed - pure vanilla JS
# Just load as unpacked extension in Chrome
```

#### Testing
1. Load extension in Chrome
2. Open `test_page.html` in browser
3. Hover over test images
4. Verify badge appears and functionality works

## 🔧 Configuration

### API Key Setup
- **Required**: Gemini API key from Google AI Studio
- **Storage**: Saved locally in Chrome storage
- **Validation**: Automatic verification on save

### User Image
- **Format**: PNG, JPG, JPEG
- **Size Limit**: 4MB maximum
- **Storage**: Base64 encoded in Chrome storage

### Output Modes
- **Image**: Static generated image
- **Animated**: Image with CSS animations
- **Video**: Placeholder for future Veo integration

## 🌐 Browser Compatibility

### Supported Browsers
- ✅ **Chrome**: 88+ (Primary target)
- ✅ **Edge**: 88+ (Chromium-based)
- ⚠️ **Firefox**: Requires Manifest V2 conversion
- ❌ **Safari**: Not supported (different extension system)

### Required Permissions
- `activeTab` - Access current page content
- `storage` - Save user preferences and images
- `scripting` - Inject content scripts
- Host permission for Gemini API

## 🔒 Security & Privacy

### Data Handling
- **API Keys**: Stored locally, never transmitted except to Google
- **User Images**: Processed locally and via secure Google APIs
- **Generated Images**: Not stored permanently
- **Web Images**: Processed on-demand only

### CORS Handling
- Content script handles cross-origin image access
- Fallback to original image URLs when canvas fails
- Graceful degradation for restricted images

## 📊 Performance

### Expected Performance
- **Badge Display**: < 100ms
- **Image Generation**: 3-10 seconds (depends on API)
- **Memory Usage**: ~5-15MB
- **Network**: Only API calls to Google

### Optimization Features
- Lazy loading of content scripts
- Efficient image processing
- Minimal DOM manipulation
- Responsive UI design

## 🐛 Troubleshooting

### Common Issues

#### Badge Not Appearing
- **Cause**: Extension not loaded or page needs refresh
- **Solution**: Reload page, check extension is enabled

#### API Key Invalid
- **Cause**: Wrong key or quota exceeded
- **Solution**: Verify key in Google AI Studio, check quota

#### Image Generation Fails
- **Cause**: CORS issues, large images, API errors
- **Solution**: Try different images, check console for errors

#### Performance Issues
- **Cause**: Large images, slow network
- **Solution**: Use smaller images, check internet connection

### Debug Information
- Open Chrome DevTools (F12)
- Check Console tab for error messages
- Check Network tab for API call status
- Use `test_page.html` for systematic testing

## 📈 Future Enhancements

### Planned Features
- [ ] **Veo Integration**: Real video generation when API available
- [ ] **Batch Processing**: Multiple images at once
- [ ] **Style Presets**: Predefined artistic styles
- [ ] **Social Sharing**: Direct share to social media
- [ ] **History**: Save generated images locally

### API Roadmap
- **Phase 1**: Gemini 2.5 Flash Image (✅ Current)
- **Phase 2**: Stable Video Diffusion integration
- **Phase 3**: Veo integration when available
- **Phase 4**: Advanced AI features

## 📞 Support

### Getting Help
- Check this documentation first
- Review `README.md` for usage instructions
- Open browser console for technical errors
- Test with `test_page.html` for systematic debugging

### Reporting Issues
When reporting issues, include:
- Browser version and OS
- Extension version
- Steps to reproduce
- Console error messages
- Screenshots if relevant

## 📄 License & Credits

- **License**: MIT
- **AI Provider**: Google Gemini
- **Icons**: Custom generated
- **Fonts**: System fonts
- **Dependencies**: None (vanilla JavaScript)

---

**Ready to Deploy!** 🎉

The MirrorMe extension is now complete and ready for installation. Follow the setup steps above to get started with AI-powered image fusion directly in your browser.
