const stats = [
  {
    number: '1M+',
    label: 'Try-Ons Generated',
    description: 'Millions of virtual try-ons created by happy customers',
  },
  {
    number: '50K+',
    label: 'Active Users',
    description: 'Growing community of smart shoppers worldwide',
  },
  {
    number: '500+',
    label: 'Supported Stores',
    description: 'Works with major e-commerce platforms globally',
  },
  {
    number: '98%',
    label: 'Accuracy Rate',
    description: 'Industry-leading AI precision for realistic results',
  },
  {
    number: '5s',
    label: 'Average Processing',
    description: 'Lightning-fast results for instant gratification',
  },
  {
    number: '4.8★',
    label: 'User Rating',
    description: 'Exceptional satisfaction from real users',
  },
]

export function Stats() {
  return (
    <section className="section bg-black text-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Trusted by Millions
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Join the revolution in online shopping with proven results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-6">
              <div className="text-5xl md:text-6xl font-bold mb-2">
                {stat.number}
              </div>
              <div className="text-lg font-semibold mb-3">
                {stat.label}
              </div>
              <p className="text-gray-400 text-sm">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
