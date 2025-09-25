# MirrorMe Chrome Extension

Chrome extension for AI virtual try-on, part of the V-Try.app platform.

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

3. Configure the extension:
   - Click on the MirrorMe icon
   - Enter your [Gemini API Key](https://ai.google.dev/gemini-api/docs/api-key)
   - Upload your photo

## 📁 File Structure

```
extension/
├── manifest.json       # Extension configuration
├── popup.html         # Popup interface
├── popup.css          # Popup styles
├── popup.js           # Popup logic
├── content.js         # Web page scripts
├── content.css        # Badge and modal styles
├── background.js      # Service worker
├── icons/            # Extension icons
├── test_page.html    # Test page
└── create_icons.html # Icon generator
```

## 🎯 How It Works

1. **Hover Detection**: Detects when you hover over an image
2. **Badge Display**: Shows the MirrorMe badge
3. **AI Processing**: Sends images to Gemini AI
4. **Result Display**: Shows the result in an elegant modal

## 🔧 Developer Configuration

### Prerequisites
- Chrome 88+
- Gemini API Key

### Debug
```bash
# Extension console
chrome://extensions/ > MirrorMe > Details > Inspect views

# Content script console
F12 > Console (on any webpage)
```

### Testing
Open `test_page.html` to test all functionality.

## 🌐 Website Integration

This extension is part of the V-Try.app platform. The main website provides:
- Account management
- Try-on history
- Advanced features
- Extension download

## 📊 Metrics

The extension tracks (locally):
- Completed try-ons
- API errors
- Performance metrics

## 🔒 Privacy

- No external tracking
- Data saved only locally
- API calls only to Google Gemini
- No personal data collection

## 📝 Limitations

- Gemini API rate limits
- Images max 4MB
- CORS restrictions on some sites
- Static images only (video coming soon)

## 🆘 Support

- [Complete documentation](../docs/)
- [GitHub Issues](https://github.com/Davide9292/v-try.app/issues)
- [V-Try.app Website](https://v-try.app) (when available)
