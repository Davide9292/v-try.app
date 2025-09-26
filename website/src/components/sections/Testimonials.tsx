import { Star, Quote } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'

const testimonials = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Fashion Enthusiast',
    avatar: null,
    rating: 5,
    content: 'V-Try.app completely changed how I shop online. I can finally see how clothes will actually look on me before buying. No more returns!',
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    role: 'Online Shopper',
    avatar: null,
    rating: 5,
    content: 'The accuracy is incredible. I was skeptical at first, but the AI really shows how products look on your body type. Game changer.',
  },
  {
    id: 3,
    name: 'Elena Rodriguez',
    role: 'Style Blogger',
    avatar: null,
    rating: 5,
    content: 'As a blogger, I need to try many outfits. V-Try.app saves me hours and helps me create better content for my audience.',
  },
  {
    id: 4,
    name: 'David Kim',
    role: 'Busy Professional',
    avatar: null,
    rating: 5,
    content: 'Perfect for someone with limited shopping time. I can quickly see what works and what doesn\'t before making purchases.',
  },
  {
    id: 5,
    name: 'Lisa Thompson',
    role: 'Mother of Two',
    avatar: null,
    rating: 5,
    content: 'Shopping with kids is tough. V-Try.app lets me shop efficiently from home and avoid disappointing purchases.',
  },
  {
    id: 6,
    name: 'Alex Rivera',
    role: 'Tech Enthusiast',
    avatar: null,
    rating: 5,
    content: 'The technology behind this is amazing. Fast, accurate, and privacy-focused. Exactly what modern shopping needs.',
  },
]

export function Testimonials() {
  return (
    <section className="section">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            What Our Users Say
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real feedback from real people who've transformed their shopping experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white border border-gray-200 p-6 hover:border-black transition-colors hover-lift"
            >
              {/* Quote Icon */}
              <Quote className="w-8 h-8 text-gray-300 mb-4" />
              
              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              
              {/* Content */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              
              {/* Author */}
              <div className="flex items-center">
                <Avatar
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  fallback={testimonial.name[0]}
                  size="sm"
                />
                <div className="ml-3">
                  <div className="font-medium text-black text-sm">
                    {testimonial.name}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="ml-2">4.8/5 average rating</span>
            </div>
            <div>50,000+ happy users</div>
            <div>98% would recommend</div>
          </div>
        </div>
      </div>
    </section>
  )
}
