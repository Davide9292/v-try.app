# V-Try.app Website

The official website for V-Try.app - AI Virtual Try-On Platform built with Next.js 14, TypeScript, and Tailwind CSS.

## 🎨 Design Philosophy

**"Brutalist Minimalism meets Swiss Design"**

- **Monochromatic**: Pure whites, deep blacks, subtle grays only
- **Typography**: System fonts (SF Pro, Segoe UI, Roboto)  
- **Spacing**: 8px base grid system
- **No decorations**: Zero gradients, shadows, or visual effects
- **Functional**: Every element serves a purpose
- **Fast**: Sub-100ms interactions, instant feedback

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

Create a `.env.local` file:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# App Configuration
NEXT_PUBLIC_APP_NAME="V-Try.app"
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Chrome Extension
NEXT_PUBLIC_EXTENSION_ID=your-extension-id-here
```

## 📁 Project Structure

```
website/
├── src/
│   ├── app/                 # App Router (Next.js 14)
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Homepage
│   ├── components/         # React components
│   │   ├── layout/         # Layout components
│   │   ├── sections/       # Page sections
│   │   ├── ui/            # UI components
│   │   └── providers/     # Context providers
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utility functions
│   └── types/             # TypeScript types
├── public/                # Static assets
├── tailwind.config.ts     # Tailwind configuration
├── next.config.js         # Next.js configuration
└── package.json
```

## 🎯 Key Features

### Pages
- **Homepage** - Hero, features, testimonials, CTA
- **Authentication** - Login/signup with seamless UX
- **Dashboard** - User feed, collections, analytics
- **Profile** - User settings, image uploads
- **Extension** - Download and setup guide

### Components
- **Brutalist UI** - Button, Avatar, Input components
- **Responsive Layout** - Header, Footer, Navigation
- **Interactive Sections** - Hero, Features, Testimonials
- **Auth System** - JWT-based authentication
- **Toast Notifications** - User feedback system

### Integrations
- **API Communication** - RESTful API integration
- **Chrome Extension** - Cross-platform messaging
- **Real-time Updates** - WebSocket connections
- **Image Processing** - Optimized image handling

## 🛠 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # Run TypeScript checks
npm run test         # Run tests
npm run analyze      # Analyze bundle size
```

### Code Style

- **ESLint** - Code linting with Next.js config
- **Prettier** - Code formatting with Tailwind plugin
- **TypeScript** - Strict type checking
- **Tailwind CSS** - Utility-first styling

### Component Guidelines

1. **Use TypeScript** - All components must be typed
2. **Functional Components** - Use hooks over class components
3. **Composition** - Prefer composition over inheritance
4. **Accessibility** - Follow WCAG 2.1 guidelines
5. **Performance** - Optimize for Core Web Vitals

## 🎨 Design System

### Colors
```css
--white: #FFFFFF
--black: #000000
--gray-50: #F8F9FA
--gray-100: #E9ECEF
--gray-200: #DEE2E6
--gray-300: #CED4DA
--gray-400: #ADB5BD
--gray-500: #6C757D
--gray-600: #495057
--gray-700: #343A40
--gray-800: #212529
--gray-900: #000000
```

### Typography
```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto
--font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono"
```

### Spacing (8px Grid)
```css
--space-2: 8px
--space-4: 16px
--space-6: 24px
--space-8: 32px
--space-12: 48px
--space-16: 64px
```

## 🔧 Configuration

### Tailwind CSS
- Custom color palette
- 8px grid spacing system
- Brutalist component utilities
- Responsive design system

### Next.js
- App Router (Next.js 14)
- Image optimization
- Static generation
- API route proxying

### TypeScript
- Strict mode enabled
- Path aliases configured
- Component type definitions

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 0-767px
- **Tablet**: 768-1023px  
- **Desktop**: 1024px+

### Approach
- Mobile-first design
- Progressive enhancement
- Touch-friendly interactions
- Optimized performance

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Deploy to Vercel
vercel

# Production deployment
vercel --prod
```

### Docker
```bash
# Build Docker image
docker build -t vtry-website .

# Run container
docker run -p 3000:3000 vtry-website
```

### Environment Variables (Production)
```bash
NEXT_PUBLIC_API_URL=https://api.v-try.app
NEXT_PUBLIC_APP_URL=https://v-try.app
NEXT_PUBLIC_EXTENSION_ID=actual-extension-id
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
npm run test:watch
npm run test:coverage
```

### E2E Tests (Planned)
- User authentication flow
- Extension download process
- Dashboard interactions
- Responsive design validation

## 📈 Performance

### Optimization Strategies
- **Image Optimization** - Next.js Image component
- **Code Splitting** - Automatic route-based splitting
- **Bundle Analysis** - Webpack Bundle Analyzer
- **Caching** - Static generation and CDN
- **Lazy Loading** - Component-level lazy loading

### Metrics Targets
- **LCP** < 2.5s
- **FID** < 100ms
- **CLS** < 0.1
- **Bundle Size** < 200KB (gzipped)

## 🔒 Security

### Implemented Measures
- **CSP Headers** - Content Security Policy
- **XSS Protection** - Input sanitization
- **CSRF Protection** - Token validation
- **Secure Headers** - Security-focused HTTP headers

## 📊 Analytics

### Tracking (Optional)
- Google Analytics 4
- Hotjar (user behavior)
- Core Web Vitals
- Custom events

## 🤝 Contributing

1. Follow the design system guidelines
2. Write tests for new features
3. Ensure accessibility compliance
4. Optimize for performance
5. Document component APIs

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Documentation**: [docs.v-try.app](https://docs.v-try.app)
- **Issues**: [GitHub Issues](https://github.com/Davide9292/v-try.app/issues)
- **Email**: hello@v-try.app