import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Zap, Shield, Sparkles } from 'lucide-react'

// Components
import { Hero } from '@/components/sections/Hero'
import { Features } from '@/components/sections/Features'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { Stats } from '@/components/sections/Stats'
import { Testimonials } from '@/components/sections/Testimonials'
import { CTA } from '@/components/sections/CTA'
import { ExtensionDownload } from '@/components/ui/ExtensionDownload'

export const metadata: Metadata = {
  title: 'AI Virtual Try-On Platform - See Before You Buy',
  description: 'Transform your online shopping experience with AI-powered virtual try-on. See how clothes, accessories, and products look on you instantly with our Chrome extension.',
  openGraph: {
    title: 'V-Try.app - AI Virtual Try-On Platform',
    description: 'Transform your online shopping experience with AI-powered virtual try-on.',
    images: ['/og-home.png'],
  },
}

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* Quick Stats */}
      <section className="section-sm bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-black">1M+</div>
              <div className="text-sm text-gray-600 mt-1">Try-Ons Generated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-black">50K+</div>
              <div className="text-sm text-gray-600 mt-1">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-black">500+</div>
              <div className="text-sm text-gray-600 mt-1">Supported Stores</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-black">98%</div>
              <div className="text-sm text-gray-600 mt-1">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="section">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">
              Why Choose V-Try.app?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The most advanced AI virtual try-on technology, 
              designed for modern shoppers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">
                Instant Results
              </h3>
              <p className="text-gray-600">
                See how products look on you in seconds, not minutes. 
                Our AI processes images at lightning speed.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">
                Privacy First
              </h3>
              <p className="text-gray-600">
                Your photos are processed securely and never stored permanently. 
                Complete privacy protection guaranteed.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">
                Photorealistic Quality
              </h3>
              <p className="text-gray-600">
                Powered by KIE AI with Nano Banana and Veo3 models 
                for unmatched realism and accuracy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Features Grid */}
      <Features />

      {/* Extension Download CTA */}
      <section className="section bg-black text-white">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Shopping?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Install our Chrome extension and start trying on products 
            from any website in seconds.
          </p>
          
          <ExtensionDownload />
          
          <div className="mt-8 text-sm text-gray-400">
            <p>✓ Free to install • ✓ Works on 500+ stores • ✓ No signup required to start</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="section-sm">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">
              Trusted by Shoppers Worldwide
            </h2>
            <p className="text-gray-600">
              Join thousands of smart shoppers who never buy without trying.
            </p>
          </div>

          {/* Logo Grid - Placeholder for partner stores */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center opacity-50">
            {['Zara', 'H&M', 'Nike', 'Adidas', 'ASOS', 'Amazon'].map((brand) => (
              <div key={brand} className="text-center">
                <div className="text-lg font-bold text-gray-400">{brand}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Stats */}
      <Stats />

      {/* Final CTA */}
      <CTA />

      {/* FAQ Preview */}
      <section className="section-sm bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600">
              Everything you need to know about V-Try.app
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <details className="bg-white border border-gray-200 p-6">
              <summary className="font-semibold text-black cursor-pointer">
                How accurate are the virtual try-ons?
              </summary>
              <p className="text-gray-600 mt-3">
                Our AI achieves 98% accuracy using advanced KIE AI technology with 
                Nano Banana and Veo3 models, providing photorealistic results that 
                closely match real-world fitting.
              </p>
            </details>

            <details className="bg-white border border-gray-200 p-6">
              <summary className="font-semibold text-black cursor-pointer">
                Which websites are supported?
              </summary>
              <p className="text-gray-600 mt-3">
                V-Try.app works on 500+ major e-commerce sites including Zara, H&M, 
                Nike, Amazon, ASOS, and many more. The extension automatically detects 
                product images on supported sites.
              </p>
            </details>

            <details className="bg-white border border-gray-200 p-6">
              <summary className="font-semibold text-black cursor-pointer">
                Is my personal data safe?
              </summary>
              <p className="text-gray-600 mt-3">
                Yes. Your photos are processed securely and never stored permanently. 
                All processing happens in real-time with enterprise-grade encryption 
                and privacy protection.
              </p>
            </details>

            <details className="bg-white border border-gray-200 p-6">
              <summary className="font-semibold text-black cursor-pointer">
                Do I need to create an account?
              </summary>
              <p className="text-gray-600 mt-3">
                You can start using V-Try.app immediately after installing the extension. 
                Creating an account unlocks additional features like saving your try-ons, 
                collections, and video generation.
              </p>
            </details>
          </div>

          <div className="text-center mt-8">
            <Link 
              href="/faq" 
              className="text-black hover:text-gray-700 font-medium inline-flex items-center"
            >
              View all FAQs
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
