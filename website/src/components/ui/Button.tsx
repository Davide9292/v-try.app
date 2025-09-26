import { forwardRef, ButtonHTMLAttributes } from 'react'
import Link from 'next/link'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-black text-white hover:bg-gray-800',
        secondary: 'bg-white text-black border border-gray-200 hover:bg-gray-50',
        ghost: 'bg-transparent text-black hover:bg-gray-50',
        outline: 'border border-black bg-transparent text-black hover:bg-black hover:text-white',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        link: 'bg-transparent text-black underline-offset-4 hover:underline p-0',
      },
      size: {
        sm: 'px-4 py-2 text-sm',
        default: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
        xl: 'px-10 py-5 text-xl',
        icon: 'w-10 h-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  href?: string
  external?: boolean
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, href, external, loading, disabled, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }))

    // If loading, disable the button
    const isDisabled = disabled || loading

    // Loading spinner component
    const LoadingSpinner = () => (
      <svg
        className="animate-spin -ml-1 mr-2 h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    )

    // Render as Link if href is provided
    if (href) {
      if (external) {
        return (
          <a
            href={href}
            className={classes}
            target="_blank"
            rel="noopener noreferrer"
            {...(props as any)}
          >
            {loading && <LoadingSpinner />}
            {children}
          </a>
        )
      }

      return (
        <Link href={href} className={classes} {...(props as any)}>
          {loading && <LoadingSpinner />}
          {children}
        </Link>
      )
    }

    // Render as button
    return (
      <button
        className={classes}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
