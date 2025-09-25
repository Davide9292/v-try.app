# V-Try.app - AI Virtual Try-On Platform

Una piattaforma completa per provare virtualmente prodotti utilizzando l'intelligenza artificiale avanzata di Google Gemini.

## 🌟 Panoramica del Progetto

V-Try.app combina un'estensione Chrome innovativa con un website moderno per offrire un'esperienza completa di virtual try-on alimentata dall'AI.

### 🎯 Componenti Principali

- **Chrome Extension**: Prova virtualmente prodotti direttamente sui siti web
- **Website**: Piattaforma web per gestire account, cronologia e funzionalità avanzate
- **AI Engine**: Powered by Google Gemini 2.5 Flash Image

## 📁 Struttura Repository

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
├── docs/               # Documentazione
│   ├── DEPLOYMENT.md
│   ├── install_guide.md
│   └── video_alternatives.md
├── assets/             # Asset condivisi
└── README.md          # Questo file
```

## 🚀 Quick Start

### Chrome Extension
```bash
cd extension/
# Carica l'estensione in Chrome Developer Mode
# Vedi docs/install_guide.md per istruzioni dettagliate
```

### Website Development
```bash
cd website/
npm install
npm run dev
# Il website sarà disponibile su http://localhost:3000
```

## ✨ Caratteristiche

### Chrome Extension
- **Hover Badge**: Interfaccia intuitiva su qualsiasi immagine web
- **AI Image Generation**: Gemini 2.5 Flash Image per risultati realistici
- **Context-Aware**: Prompt intelligenti basati sul contesto
- **Privacy First**: Elaborazione locale e API sicure

### Website (Pianificato)
- **Account Management**: Gestione utenti e preferenze
- **History**: Cronologia dei try-on effettuati
- **Advanced Features**: Batch processing, preset di stili
- **Social Sharing**: Condivisione sui social media
- **Analytics**: Dashboard per sviluppatori

## 🛠️ Stack Tecnologico

### Extension
- **Manifest V3**: Chrome Extensions API
- **Vanilla JavaScript**: Performance ottimizzate
- **Google Gemini**: AI image generation
- **Chrome Storage API**: Persistenza dati

### Website (Raccomandato)
- **Next.js 14**: Framework React con App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling utility-first
- **Prisma**: Database ORM
- **NextAuth.js**: Autenticazione
- **Vercel**: Deployment e hosting

## 🔄 Roadmap

### Fase 1: Foundation (Completata)
- ✅ Chrome Extension base
- ✅ AI image generation con Gemini
- ✅ Repository setup

### Fase 2: Website Launch
- [ ] Website base con landing page
- [ ] User authentication
- [ ] Extension download e setup guide
- [ ] Basic analytics

### Fase 3: Advanced Features
- [ ] User dashboard
- [ ] History e favorites
- [ ] Advanced AI features
- [ ] Social sharing

### Fase 4: Scale
- [ ] Video generation (Veo integration)
- [ ] Mobile app
- [ ] API per sviluppatori
- [ ] Enterprise features

## 🌐 Deployment

### Website (v-try.app)
- **Domain**: https://v-try.app
- **Hosting**: Vercel (raccomandato per Next.js)
- **Database**: PostgreSQL (Supabase/PlanetScale)
- **CDN**: Vercel Edge Network

### Extension
- **Chrome Web Store**: Pubblicazione ufficiale
- **Auto-updates**: Gestite da Chrome
- **Analytics**: Chrome Extension Analytics

## 📊 Metriche di Successo

### Extension
- Installazioni attive
- Try-on completati
- User retention
- Rating Chrome Web Store

### Website
- Traffico organico
- Conversioni download
- User engagement
- API usage

## 🤝 Contributi

1. Fork del repository
2. Crea feature branch (`git checkout -b feature/amazing-feature`)
3. Commit delle modifiche (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Apri una Pull Request

## 📞 Supporto

- **Issues**: GitHub Issues per bug e feature requests
- **Discussions**: GitHub Discussions per domande generali
- **Email**: support@v-try.app (quando attivo)

## 📄 Licenza

MIT License - Vedi [LICENSE](LICENSE) per dettagli.

---

**🚀 V-Try.app - Il futuro del virtual try-on è qui!**
