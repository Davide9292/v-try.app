import Link from 'next/link'
import { Github, Twitter, Mail, Chrome } from 'lucide-react'

const footerLinks = {
  product: [
    { name: 'How it Works', href: '/how-it-works' },
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Chrome Extension', href: '/extension' },
    { name: 'API', href: '/api' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
    { name: 'Partners', href: '/partners' },
  ],
  support: [
    { name: 'Help Center', href: '/support' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact', href: '/contact' },
    { name: 'Status', href: '/status' },
    { name: 'Community', href: '/community' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Data Processing', href: '/data-processing' },
  ],
}

const socialLinks = [
  {
    name: 'Twitter',
    href: 'https://twitter.com/vtryapp',
    icon: Twitter,
  },
  {
    name: 'GitHub',
    href: 'https://github.com/Davide9292/v-try.app',
    icon: Github,
  },
  {
    name: 'Email',
    href: 'mailto:hello@v-try.app',
    icon: Mail,
  },
]

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="container-custom">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-bold text-sm">
                  V
                </div>
                <span className="font-bold text-xl">V-Try.app</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-sm">
                The future of online shopping. Try on products virtually 
                with AI-powered technology before you buy.
              </p>
              
              {/* Chrome Extension CTA */}
              <div className="mb-6">
                <Link
                  href="/extension"
                  className="inline-flex items-center bg-white text-black px-4 py-2 
                           text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  <Chrome className="w-4 h-4 mr-2" />
                  Add to Chrome
                </Link>
              </div>

              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={social.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="py-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="font-semibold text-white mb-1">Stay Updated</h3>
              <p className="text-gray-400 text-sm">
                Get the latest updates on new features and supported stores.
              </p>
            </div>
            <div className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-2 bg-gray-800 text-white 
                         border border-gray-700 focus:border-white focus:outline-none
                         placeholder-gray-400 text-sm"
              />
              <button className="px-6 py-2 bg-white text-black font-medium text-sm
                               hover:bg-gray-100 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
            <div className="mb-4 md:mb-0">
              <p>&copy; 2024 V-Try.app. All rights reserved.</p>
            </div>
            <div className="flex items-center space-x-6">
              <span>Made with ❤️ for better shopping</span>
              <div className="flex items-center space-x-1">
                <span>Powered by</span>
                <span className="text-white font-medium">KIE AI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="py-6 border-t border-gray-800">
          <div className="flex flex-wrap items-center justify-center space-x-8 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Privacy Protected</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Enterprise Grade</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
