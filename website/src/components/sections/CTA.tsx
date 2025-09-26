import { ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ExtensionDownload } from '@/components/ui/ExtensionDownload'

const benefits = [
  'Free to install and use',
  'Works on 500+ stores',
  'Privacy protected',
  '98% accuracy rate',
  'Lightning fast results',
  'No signup required',
]

export function CTA() {
  return (
    <section className="section bg-gradient-to-br from-gray-50 to-white">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main CTA */}
          <h2 className="text-4xl md:text-6xl font-bold text-black mb-6">
            Ready to Shop Smarter?
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join millions of shoppers who never buy without trying first.
          </p>
          
          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 max-w-2xl mx-auto">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center text-left">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <ExtensionDownload size="lg" />
            
            <Button
              href="/signup"
              variant="secondary"
              size="lg"
              className="group"
            >
              Create Account
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="text-sm text-gray-500">
            <p>Trusted by 50,000+ users • 4.8★ rating • GDPR compliant</p>
          </div>
        </div>
      </div>
    </section>
  )
}
