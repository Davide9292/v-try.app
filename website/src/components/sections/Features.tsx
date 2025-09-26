import { 
  Zap, 
  Shield, 
  Sparkles, 
  Image, 
  Video, 
  Users, 
  Heart, 
  TrendingUp,
  Smartphone,
  Globe,
  Clock,
  Star
} from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Get results in under 5 seconds with our optimized AI processing pipeline.',
    category: 'Performance',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your photos are processed securely and never stored permanently.',
    category: 'Security',
  },
  {
    icon: Sparkles,
    title: 'Photorealistic Quality',
    description: 'Powered by KIE AI with Nano Banana and Veo3 for unmatched realism.',
    category: 'Quality',
  },
  {
    icon: Image,
    title: 'Image Generation',
    description: 'Create high-quality try-on images with multiple style options.',
    category: 'Generation',
  },
  {
    icon: Video,
    title: 'Video Try-Ons',
    description: 'Generate dynamic video try-ons to see products in motion.',
    category: 'Generation',
  },
  {
    icon: Users,
    title: 'Personal Feed',
    description: 'Save and organize your try-ons in a personal collection.',
    category: 'Organization',
  },
  {
    icon: Heart,
    title: 'Smart Collections',
    description: 'Organize your favorite try-ons into custom collections.',
    category: 'Organization',
  },
  {
    icon: TrendingUp,
    title: 'Usage Analytics',
    description: 'Track your try-on history and discover shopping patterns.',
    category: 'Analytics',
  },
  {
    icon: Smartphone,
    title: 'Cross-Platform',
    description: 'Works seamlessly across desktop, tablet, and mobile devices.',
    category: 'Compatibility',
  },
  {
    icon: Globe,
    title: '500+ Stores',
    description: 'Compatible with major e-commerce sites worldwide.',
    category: 'Compatibility',
  },
  {
    icon: Clock,
    title: 'Real-Time Updates',
    description: 'Get instant notifications when your try-ons are ready.',
    category: 'Experience',
  },
  {
    icon: Star,
    title: 'Premium Features',
    description: 'Unlock advanced features with Pro and Enterprise plans.',
    category: 'Premium',
  },
]

const categories = [
  { name: 'All', value: 'all' },
  { name: 'Performance', value: 'Performance' },
  { name: 'Generation', value: 'Generation' },
  { name: 'Organization', value: 'Organization' },
  { name: 'Premium', value: 'Premium' },
]

export function Features() {
  return (
    <section className="section bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A complete virtual try-on solution with enterprise-grade features 
            and consumer-friendly simplicity.
          </p>
        </div>

        {/* Category Filter - Could be made interactive */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <button
              key={category.value}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                category.value === 'all'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 border border-gray-200 hover:border-black transition-all duration-200 hover-lift"
            >
              {/* Icon */}
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6" />
              </div>

              {/* Category Badge */}
              <div className="inline-block bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 mb-3">
                {feature.category}
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-black mb-3 group-hover:text-gray-800 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gray-50 border border-gray-200 p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-black mb-4">
              Ready to Experience the Future?
            </h3>
            <p className="text-gray-600 mb-6">
              Join thousands of smart shoppers who never buy without trying first.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="btn btn-primary">
                Install Extension
              </button>
              <button className="btn btn-secondary">
                View Pricing
              </button>
            </div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-black text-center mb-12">
            Feature Comparison
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-4 font-semibold text-black border-r border-gray-200">
                    Feature
                  </th>
                  <th className="text-center p-4 font-semibold text-black border-r border-gray-200">
                    Free
                  </th>
                  <th className="text-center p-4 font-semibold text-black border-r border-gray-200">
                    Pro
                  </th>
                  <th className="text-center p-4 font-semibold text-black">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-200">
                  <td className="p-4 border-r border-gray-200">Image Try-Ons</td>
                  <td className="p-4 text-center border-r border-gray-200">
                    <span className="text-green-600">10/day</span>
                  </td>
                  <td className="p-4 text-center border-r border-gray-200">
                    <span className="text-green-600">100/day</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-green-600">1000/day</span>
                  </td>
                </tr>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td className="p-4 border-r border-gray-200">Video Try-Ons</td>
                  <td className="p-4 text-center border-r border-gray-200">
                    <span className="text-red-600">✗</span>
                  </td>
                  <td className="p-4 text-center border-r border-gray-200">
                    <span className="text-green-600">20/day</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-green-600">200/day</span>
                  </td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="p-4 border-r border-gray-200">Personal Feed</td>
                  <td className="p-4 text-center border-r border-gray-200">
                    <span className="text-green-600">✓</span>
                  </td>
                  <td className="p-4 text-center border-r border-gray-200">
                    <span className="text-green-600">✓</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-green-600">✓</span>
                  </td>
                </tr>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td className="p-4 border-r border-gray-200">Collections</td>
                  <td className="p-4 text-center border-r border-gray-200">
                    <span className="text-green-600">5</span>
                  </td>
                  <td className="p-4 text-center border-r border-gray-200">
                    <span className="text-green-600">Unlimited</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-green-600">Unlimited</span>
                  </td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="p-4 border-r border-gray-200">Priority Processing</td>
                  <td className="p-4 text-center border-r border-gray-200">
                    <span className="text-red-600">✗</span>
                  </td>
                  <td className="p-4 text-center border-r border-gray-200">
                    <span className="text-green-600">✓</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-green-600">✓</span>
                  </td>
                </tr>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td className="p-4 border-r border-gray-200">API Access</td>
                  <td className="p-4 text-center border-r border-gray-200">
                    <span className="text-red-600">✗</span>
                  </td>
                  <td className="p-4 text-center border-r border-gray-200">
                    <span className="text-red-600">✗</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-green-600">✓</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
