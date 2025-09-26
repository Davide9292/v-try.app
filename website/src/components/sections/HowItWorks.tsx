import { Download, Upload, Zap, Heart } from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: Download,
    title: 'Install Extension',
    description: 'Add V-Try.app to Chrome in one click. No signup required to start.',
  },
  {
    step: '02',
    icon: Upload,
    title: 'Upload Your Photos',
    description: 'Take or upload a face and full-body photo for personalized try-ons.',
  },
  {
    step: '03',
    icon: Zap,
    title: 'Try On Products',
    description: 'Click any product image on supported sites to see it on you instantly.',
  },
  {
    step: '04',
    icon: Heart,
    title: 'Save & Share',
    description: 'Save your favorite try-ons and share them with friends or on social media.',
  },
]

export function HowItWorks() {
  return (
    <section className="section bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get started in minutes and transform your shopping experience forever.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.step} className="text-center relative">
              {/* Step Number */}
              <div className="text-6xl font-bold text-gray-200 mb-4">
                {step.step}
              </div>
              
              {/* Icon */}
              <div className="w-16 h-16 bg-black text-white flex items-center justify-center mx-auto mb-6 -mt-12 relative z-10">
                <step.icon className="w-8 h-8" />
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-semibold text-black mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600">
                {step.description}
              </p>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-20 left-full w-full h-px bg-gray-300 transform -translate-y-1/2 z-0" />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <button className="btn btn-primary btn-lg">
            Get Started Now
          </button>
        </div>
      </div>
    </section>
  )
}
