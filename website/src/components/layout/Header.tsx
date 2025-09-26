'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, User, LogOut } from 'lucide-react'

// Hooks
import { useAuth } from '@/hooks/useAuth'

// Components
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'How it Works', href: '/how-it-works' },
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Support', href: '/support' },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const { user, logout, isLoading } = useAuth()

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-all duration-200 ${
        isScrolled ? 'border-b border-gray-200 shadow-sm' : 'border-b border-transparent'
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-bold text-sm">
                V
              </div>
              <span className="font-bold text-xl text-black">
                V-Try.app
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-link ${
                  pathname === item.href ? 'active' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full" />
            ) : user ? (
              <div className="flex items-center space-x-3">
                <Link href="/dashboard" className="nav-link">
                  Dashboard
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-50">
                    <Avatar
                      src={user.avatarUrl}
                      alt={user.username}
                      fallback={user.username?.[0] || user.email[0]}
                      size="sm"
                    />
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-3 border-b border-gray-100">
                      <p className="font-medium text-black text-sm">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                      <Link
                        href="/feed"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Feed
                      </Link>
                      <Link
                        href="/collections"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Collections
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" className="nav-link">
                  Sign In
                </Link>
                <Button href="/signup" variant="primary" size="sm">
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-black"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="container-custom py-4">
            <nav className="space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block py-2 text-gray-600 hover:text-black ${
                    pathname === item.href ? 'text-black font-medium' : ''
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Mobile Auth Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              {isLoading ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full" />
                  <div className="w-24 h-4 bg-gray-200 animate-pulse" />
                </div>
              ) : user ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={user.avatarUrl}
                      alt={user.username}
                      fallback={user.username?.[0] || user.email[0]}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium text-black text-sm">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Link
                      href="/dashboard"
                      className="block py-2 text-gray-600 hover:text-black"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="block py-2 text-gray-600 hover:text-black"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/feed"
                      className="block py-2 text-gray-600 hover:text-black"
                    >
                      Feed
                    </Link>
                    <Link
                      href="/collections"
                      className="block py-2 text-gray-600 hover:text-black"
                    >
                      Collections
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left py-2 text-gray-600 hover:text-black"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="block py-2 text-gray-600 hover:text-black"
                  >
                    Sign In
                  </Link>
                  <Button href="/signup" variant="primary" size="sm" className="w-full">
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
