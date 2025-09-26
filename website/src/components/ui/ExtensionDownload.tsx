'use client'

import { useState, useEffect } from 'react'
import { Chrome, Download, ExternalLink, CheckCircle } from 'lucide-react'
import { Button } from './Button'

interface ExtensionDownloadProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'default' | 'lg'
  showStats?: boolean
  className?: string
}

export function ExtensionDownload({ 
  variant = 'primary', 
  size = 'default',
  showStats = false,
  className 
}: ExtensionDownloadProps) {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    // Check if running in Chrome/Edge
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
    const isEdge = /Edg/.test(navigator.userAgent)
    setIsSupported(isChrome || isEdge)

    // Check if extension is already installed
    // This would need to be implemented with proper extension messaging
    const checkExtension = () => {
      // Mock check - in production, this would communicate with the extension
      const hasExtension = document.querySelector('meta[name="v-try-app-extension"]')
      setIsInstalled(!!hasExtension)
    }

    checkExtension()
  }, [])

  const handleInstall = () => {
    // In production, this would redirect to Chrome Web Store
    const storeUrl = 'https://chrome.google.com/webstore/detail/v-try-app/extension-id'
    window.open(storeUrl, '_blank', 'noopener,noreferrer')
    
    // Track analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'extension_install_click', {
        event_category: 'engagement',
        event_label: 'chrome_extension'
      })
    }
  }

  const handleAlreadyInstalled = () => {
    // Open extension or show usage instructions
    alert('Great! The extension is already installed. Look for the V-Try.app icon in your browser toolbar.')
  }

  if (!isSupported) {
    return (
      <div className={`text-center ${className}`}>
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg max-w-md mx-auto">
          <Chrome className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold text-black mb-2">Chrome Required</h3>
          <p className="text-gray-600 text-sm mb-4">
            V-Try.app extension is currently available for Chrome and Edge browsers.
          </p>
          <Button
            href="https://www.google.com/chrome/"
            external
            variant="outline"
            size={size}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Chrome
          </Button>
        </div>
      </div>
    )
  }

  if (isInstalled) {
    return (
      <div className={`text-center ${className}`}>
        <Button
          onClick={handleAlreadyInstalled}
          variant="secondary"
          size={size}
          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Extension Installed
        </Button>
        {showStats && (
          <p className="text-sm text-gray-500 mt-2">
            Ready to try on products from any website!
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={`text-center ${className}`}>
      <Button
        onClick={handleInstall}
        variant={variant}
        size={size}
        className="relative"
      >
        <Chrome className="w-4 h-4 mr-2" />
        Add to Chrome
        <ExternalLink className="w-3 h-3 ml-2 opacity-70" />
      </Button>
      
      {showStats && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-semibold text-black">50K+</div>
            <div className="text-gray-500">Users</div>
          </div>
          <div>
            <div className="font-semibold text-black">4.8★</div>
            <div className="text-gray-500">Rating</div>
          </div>
          <div>
            <div className="font-semibold text-black">Free</div>
            <div className="text-gray-500">Forever</div>
          </div>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        <p>✓ Free forever • ✓ No signup required • ✓ Privacy protected</p>
      </div>
    </div>
  )
}
