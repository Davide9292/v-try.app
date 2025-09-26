import Link from 'next/link'
import { ArrowRight, Play, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ExtensionDownload } from '@/components/ui/ExtensionDownload'

export function Hero() {
  return (
    <section className="section-lg bg-gradient-to-b from-gray-50 to-white">
      <div className="container-custom">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center bg-black text-white px-4 py-2 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4 mr-2" />
            Powered by KIE AI • Nano Banana & Veo3
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-black mb-6 text-balance">
            Try Before
            <br />
            You Buy
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto text-balance">
            See how clothes, accessories, and products look on you instantly 
            with AI-powered virtual try-on technology.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <ExtensionDownload size="lg" showStats={false} />
            
            <Button
              href="/demo"
              variant="ghost"
              size="lg"
              className="group"
            >
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Watch Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 mb-16">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Free to use
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Privacy protected
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Works on 500+ stores
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              98% accuracy
            </div>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="relative max-w-5xl mx-auto">
          {/* Main Demo Image/Video Placeholder */}
          <div className="relative bg-black aspect-video rounded-lg overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 ml-1" />
                </div>
                <p className="text-lg font-medium">Interactive Demo</p>
                <p className="text-sm text-gray-300 mt-1">See V-Try.app in action</p>
              </div>
            </div>

            {/* Play button overlay */}
            <button className="absolute inset-0 w-full h-full group cursor-pointer">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-black ml-1" />
                </div>
              </div>
            </button>
          </div>

          {/* Floating UI Elements */}
          <div className="absolute -top-8 -left-8 bg-white border border-gray-200 shadow-lg p-4 rounded-lg hidden md:block">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div>
                <div className="w-20 h-3 bg-gray-200 rounded mb-1"></div>
                <div className="w-16 h-2 bg-gray-100 rounded"></div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-8 -right-8 bg-white border border-gray-200 shadow-lg p-4 rounded-lg hidden md:block">
            <div className="text-center">
              <div className="text-2xl font-bold text-black">98%</div>
              <div className="text-xs text-gray-500">Accuracy</div>
            </div>
          </div>

          <div className="absolute top-1/2 -left-12 transform -translate-y-1/2 bg-white border border-gray-200 shadow-lg p-3 rounded-full hidden lg:block">
            <Sparkles className="w-6 h-6 text-black" />
          </div>
        </div>

        {/* Secondary CTA */}
        <div className="text-center mt-20">
          <p className="text-gray-600 mb-4">
            Ready to revolutionize your online shopping experience?
          </p>
          <Link 
            href="/how-it-works" 
            className="inline-flex items-center text-black hover:text-gray-700 font-medium group"
          >
            Learn how it works
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}
