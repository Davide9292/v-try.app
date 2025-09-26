import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Components
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ToastProvider } from '@/components/providers/ToastProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'V-Try.app - AI Virtual Try-On Platform',
    template: '%s | V-Try.app'
  },
  description: 'Experience the future of online shopping with AI-powered virtual try-on. See how clothes, accessories, and products look on you before buying.',
  keywords: [
    'virtual try-on',
    'AI fashion',
    'online shopping',
    'augmented reality',
    'fashion technology',
    'KIE AI',
    'virtual fitting'
  ],
  authors: [{ name: 'V-Try.app Team' }],
  creator: 'V-Try.app',
  publisher: 'V-Try.app',
  metadataBase: new URL('https://v-try.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://v-try.app',
    title: 'V-Try.app - AI Virtual Try-On Platform',
    description: 'Experience the future of online shopping with AI-powered virtual try-on.',
    siteName: 'V-Try.app',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'V-Try.app - AI Virtual Try-On Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'V-Try.app - AI Virtual Try-On Platform',
    description: 'Experience the future of online shopping with AI-powered virtual try-on.',
    images: ['/og-image.png'],
    creator: '@vtryapp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification',
    yandex: 'your-yandex-verification',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        
        {/* Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        
        {/* Chrome extension connection */}
        <meta name="v-try-app-website" content="true" />
      </head>
      <body className="min-h-screen bg-white text-black antialiased">
        {/* Skip to main content link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                     bg-black text-white px-4 py-2 z-50 focus-ring"
        >
          Skip to main content
        </a>

        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            
            <main id="main-content" className="flex-1">
              {children}
            </main>
            
            <Footer />
          </div>
          
          <ToastProvider />
        </AuthProvider>

        {/* Analytics (placeholder) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Google Analytics placeholder
              // window.gtag = window.gtag || function(){dataLayer.push(arguments);};
              // gtag('js', new Date());
              // gtag('config', 'GA_MEASUREMENT_ID');
            `,
          }}
        />
      </body>
    </html>
  )
}
