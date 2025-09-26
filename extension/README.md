# V-Try.app Chrome Extension

Enterprise-grade AI virtual try-on extension with full backend integration, user authentication, and advanced features.

## 🚀 Quick Installation

1. Clone the main repository:
```bash
git clone https://github.com/Davide9292/v-try.app.git
cd v-try.app/extension/
```

2. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked extension"
   - Select the `extension/` folder

3. The extension will automatically connect to the V-Try.app backend:
   - Create your account directly in the extension
   - Upload your face and body images
   - Start trying on products instantly

## 📁 File Structure

```
extension/
├── manifest.json           # Extension configuration (Manifest V3)
├── popup-minimal.html      # Main popup interface
├── popup-minimal.js        # Popup logic with full API integration
├── content-minimal.js      # Content script with AI generation
├── content.css            # Badge and modal styles
├── background.js          # Service worker
├── icons/                 # Extension icons (16px, 48px, 128px)
├── services/              # Backend integration services
│   ├── auth.js           # Authentication service
│   ├── ai.js             # AI generation service
│   └── feed.js           # Feed management service
├── shared/                # Shared utilities
│   ├── constants.js      # API endpoints and constants
│   └── types.js          # Type definitions and validators
└── scripts/              # Development scripts
    └── setup-production.sh
```

## 🎯 How It Works

1. **Smart Detection**: Automatically detects product images on any website
2. **AI Badge**: Shows the V-Try badge when hovering over compatible images
3. **Instant Try-On**: Click the badge to start AI-powered virtual try-on
4. **Real-Time Processing**: Watch your try-on generate with live progress updates
5. **Feed Management**: All results are saved to your personal feed with search and collections

## ✨ Key Features

### 🔐 **Enterprise Authentication**
- Secure JWT-based authentication
- Persistent login sessions (30 days)
- No email verification required for quick setup

### 🤖 **Advanced AI Integration**
- KIE AI platform integration (Nano Banana + Veo3)
- Real-time generation progress tracking
- Smart product category detection
- Multiple generation styles (realistic, fashion, artistic)

### 📱 **Comprehensive Feed System**
- Personal try-on history with search
- Collection management for organization
- Download and share capabilities
- Usage tracking and limits

### 🎨 **Smart Product Detection**
- Automatic product title extraction
- Category detection (clothing, shoes, accessories, etc.)
- Website context awareness
- Enhanced metadata collection

### 💎 **Professional UI/UX**
- Brutalist minimalism design system
- Responsive modal interfaces
- Real-time progress indicators
- Error handling with user-friendly messages

## 🔧 Developer Configuration

### Prerequisites
- Chrome 88+ (Manifest V3 support)
- V-Try.app backend API access

### Debug & Development
```bash
# Extension console
chrome://extensions/ > V-Try.app > Details > Inspect views

# Content script console
F12 > Console (on any webpage)

# View network requests
F12 > Network tab > Filter by "v-tryapp"
```

### Environment Configuration
The extension automatically connects to:
- **Production**: `https://v-tryapp-production.up.railway.app`
- **Development**: `http://localhost:3001`

## 🌐 Backend Integration

### API Endpoints Used
- `POST /api/auth/login` - User authentication
- `POST /api/auth/signup` - User registration  
- `POST /api/user/upload-images` - Profile setup
- `GET /api/user/usage` - Usage statistics
- `POST /api/ai/generate` - AI generation
- `GET /api/ai/status/:jobId` - Generation status
- `GET /api/feed` - Try-on history
- `POST /api/collections` - Collection management

### Real-Time Features
- WebSocket connections for live generation updates
- Automatic token refresh
- Offline capability with graceful degradation

## 🔒 Privacy & Security

- **End-to-end encryption** for all API communications
- **Local storage** for non-sensitive data only
- **JWT tokens** with automatic refresh
- **No tracking** - your data stays private
- **GDPR compliant** data handling

## 📊 Performance Metrics

- **Generation time**: ~15-30 seconds for images
- **API response time**: <200ms for most endpoints  
- **Memory usage**: <50MB typical
- **Network efficiency**: Optimized image compression

## 🆘 Support & Documentation

- **Full API Documentation**: [Railway Deployment](https://v-tryapp-production.up.railway.app)
- **Testing Guide**: [EXTENSION_TESTING_GUIDE.md](../EXTENSION_TESTING_GUIDE.md)
- **Backend Setup**: [DEPLOYMENT_GUIDE.md](../docs/DEPLOYMENT_GUIDE.md)
- **Issues**: [GitHub Issues](https://github.com/Davide9292/v-try.app/issues)
