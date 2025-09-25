# V-Try.app - AI Virtual Try-On Platform

A complete platform for virtually trying on products using advanced Google Gemini artificial intelligence.

## 🌟 Project Overview

V-Try.app combines an innovative Chrome extension with a modern website to offer a complete AI-powered virtual try-on experience.

### 🎯 Main Components

- **Chrome Extension**: Virtually try on products directly on websites
- **Website**: Web platform to manage accounts, history, and advanced features
- **AI Engine**: Powered by Google Gemini 2.5 Flash Image

## 📁 Repository Structure

```
v-try.app/
├── extension/           # Chrome Extension (MirrorMe)
│   ├── manifest.json
│   ├── popup.html/css/js
│   ├── content.js/css
│   ├── background.js
│   └── icons/
├── website/            # Website v-try.app
│   └── (Next.js/React app)
├── docs/               # Documentation
│   ├── DEPLOYMENT.md
│   ├── install_guide.md
│   └── video_alternatives.md
├── assets/             # Shared assets
└── README.md          # This file
```

## 🚀 Quick Start

### Chrome Extension
```bash
cd extension/
# Load extension in Chrome Developer Mode
# See docs/install_guide.md for detailed instructions
```

### Website Development
```bash
cd website/
npm install
npm run dev
# Website will be available at http://localhost:3000
```

## ✨ Features

### Chrome Extension
- **Hover Badge**: Intuitive interface on any web image
- **AI Image Generation**: Gemini 2.5 Flash Image for realistic results
- **Context-Aware**: Smart prompts based on context
- **Privacy First**: Local processing and secure APIs

### Website (Planned)
- **Account Management**: User and preferences management
- **History**: Try-on history tracking
- **Advanced Features**: Batch processing, style presets
- **Social Sharing**: Social media sharing
- **Analytics**: Developer dashboard

## 🛠️ Technology Stack

### Extension
- **Manifest V3**: Chrome Extensions API
- **Vanilla JavaScript**: Optimized performance
- **Google Gemini**: AI image generation
- **Chrome Storage API**: Data persistence

### Website (Recommended)
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **Prisma**: Database ORM
- **NextAuth.js**: Authentication
- **Vercel**: Deployment and hosting

## 🔄 Roadmap

### Phase 1: Foundation (Completed)
- ✅ Base Chrome Extension
- ✅ AI image generation with Gemini
- ✅ Repository setup

### Phase 2: Website Launch
- [ ] Base website with landing page
- [ ] User authentication
- [ ] Extension download and setup guide
- [ ] Basic analytics

### Phase 3: Advanced Features
- [ ] User dashboard
- [ ] History and favorites
- [ ] Advanced AI features
- [ ] Social sharing

### Phase 4: Scale
- [ ] Video generation (Veo integration)
- [ ] Mobile app
- [ ] Developer APIs
- [ ] Enterprise features

## 🌐 Deployment

### Website (v-try.app)
- **Domain**: https://v-try.app
- **Hosting**: Vercel (recommended for Next.js)
- **Database**: PostgreSQL (Supabase/PlanetScale)
- **CDN**: Vercel Edge Network

### Extension
- **Chrome Web Store**: Official publication
- **Auto-updates**: Managed by Chrome
- **Analytics**: Chrome Extension Analytics

## 📊 Success Metrics

### Extension
- Active installations
- Completed try-ons
- User retention
- Chrome Web Store rating

### Website
- Organic traffic
- Download conversions
- User engagement
- API usage

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- **Issues**: GitHub Issues for bugs and feature requests
- **Discussions**: GitHub Discussions for general questions
- **Email**: support@v-try.app (when active)

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

**🚀 V-Try.app - The future of virtual try-on is here!**
