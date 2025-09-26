import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Color System - Monochromatic Brutalist Minimalism
      colors: {
        // Override default grays with our custom palette
        gray: {
          50: '#F8F9FA',
          100: '#E9ECEF',
          200: '#DEE2E6',
          300: '#CED4DA',
          400: '#ADB5BD',
          500: '#6C757D',
          600: '#495057',
          700: '#343A40',
          800: '#212529',
          900: '#000000',
        },
        // Pure colors for maximum contrast
        white: '#FFFFFF',
        black: '#000000',
        // Semantic colors using black for maximum minimalism
        success: '#000000',
        error: '#000000',
        warning: '#000000',
        info: '#000000',
      },
      
      // Typography - System fonts only
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'Monaco',
          '"Cascadia Code"',
          '"Roboto Mono"',
          'Consolas',
          '"Courier New"',
          'monospace',
        ],
      },
      
      // Spacing - 8px Grid System
      spacing: {
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '32': '128px',
      },
      
      // Typography Scale
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.2' }],
        '6xl': ['3.75rem', { lineHeight: '1.2' }],
        '7xl': ['4.5rem', { lineHeight: '1.1' }],
      },
      
      // Animation and Transitions
      transitionDuration: {
        'fast': '100ms',
        'normal': '150ms',
        'slow': '200ms',
      },
      
      // Border Radius - Minimal
      borderRadius: {
        'none': '0px',
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        'full': '9999px',
      },
      
      // Box Shadow - Minimal
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        'none': '0 0 #0000',
      },
      
      // Custom animations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      
      // Grid template columns
      gridTemplateColumns: {
        'auto-fit': 'repeat(auto-fit, minmax(280px, 1fr))',
        'auto-fill': 'repeat(auto-fill, minmax(280px, 1fr))',
      },
      
      // Aspect ratios
      aspectRatio: {
        'square': '1 / 1',
        'video': '16 / 9',
        'photo': '4 / 3',
        'portrait': '3 / 4',
      },
    },
  },
  plugins: [
    // Custom plugin for brutalist minimalism utilities
    function({ addUtilities }: { addUtilities: any }) {
      const newUtilities = {
        // Text utilities
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.text-pretty': {
          'text-wrap': 'pretty',
        },
        
        // Hover effects
        '.hover-lift': {
          'transition': 'transform 150ms ease',
        },
        '.hover-lift:hover': {
          'transform': 'translateY(-2px)',
        },
        
        // Focus states
        '.focus-ring': {
          '&:focus': {
            'outline': 'none',
            'ring': '2px solid #000000',
            'ring-offset': '2px',
          },
        },
        
        // Container utilities
        '.container-custom': {
          'width': '100%',
          'max-width': '1280px',
          'margin-left': 'auto',
          'margin-right': 'auto',
          'padding-left': '1rem',
          'padding-right': '1rem',
          '@screen sm': {
            'padding-left': '1.5rem',
            'padding-right': '1.5rem',
          },
          '@screen lg': {
            'padding-left': '2rem',
            'padding-right': '2rem',
          },
        },
        
        // Section utilities
        '.section': {
          'padding-top': '4rem',
          'padding-bottom': '4rem',
          '@screen md': {
            'padding-top': '6rem',
            'padding-bottom': '6rem',
          },
        },
        '.section-sm': {
          'padding-top': '2rem',
          'padding-bottom': '2rem',
          '@screen md': {
            'padding-top': '3rem',
            'padding-bottom': '3rem',
          },
        },
        '.section-lg': {
          'padding-top': '6rem',
          'padding-bottom': '6rem',
          '@screen md': {
            'padding-top': '8rem',
            'padding-bottom': '8rem',
          },
        },
        
        // Button utilities
        '.btn': {
          'display': 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'padding': '0.75rem 1.5rem',
          'font-weight': '500',
          'transition': 'all 150ms ease',
          'cursor': 'pointer',
          'border': '1px solid transparent',
          '&:focus': {
            'outline': 'none',
          },
          '&:disabled': {
            'opacity': '0.5',
            'cursor': 'not-allowed',
          },
        },
        '.btn-primary': {
          'background-color': '#000000',
          'color': '#FFFFFF',
          '&:hover': {
            'background-color': '#212529',
          },
        },
        '.btn-secondary': {
          'background-color': '#FFFFFF',
          'color': '#000000',\n          'border-color': '#DEE2E6',\n          '&:hover': {\n            'background-color': '#F8F9FA',\n          },\n        },\n        '.btn-ghost': {\n          'background-color': 'transparent',\n          'color': '#000000',\n          '&:hover': {\n            'background-color': '#F8F9FA',\n          },\n        },\n        '.btn-sm': {\n          'padding': '0.5rem 1rem',\n          'font-size': '0.875rem',\n        },\n        '.btn-lg': {\n          'padding': '1rem 2rem',\n          'font-size': '1.125rem',\n        },\n        \n        // Input utilities\n        '.input': {\n          'width': '100%',\n          'padding': '0.75rem 1rem',\n          'border': '1px solid #DEE2E6',\n          'background-color': '#FFFFFF',\n          'color': '#000000',\n          '&:focus': {\n            'border-color': '#000000',\n            'outline': 'none',\n          },\n          '&::placeholder': {\n            'color': '#ADB5BD',\n          },\n        },\n        '.input-sm': {\n          'padding': '0.5rem 0.75rem',\n          'font-size': '0.875rem',\n        },\n        \n        // Card utilities\n        '.card': {\n          'background-color': '#FFFFFF',\n          'border': '1px solid #DEE2E6',\n        },\n        '.card-body': {\n          'padding': '1.5rem',\n        },\n        \n        // Navigation utilities\n        '.nav-link': {\n          'color': '#6C757D',\n          'transition': 'color 150ms ease',\n          '&:hover': {\n            'color': '#000000',\n          },\n          '&.active': {\n            'color': '#000000',\n          },\n        },\n      }\n      \n      addUtilities(newUtilities)\n    },\n  ],\n}\n\nexport default config"}]
