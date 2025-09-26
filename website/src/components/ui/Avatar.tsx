import { forwardRef, HTMLAttributes } from 'react'
import Image from 'next/image'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const avatarVariants = cva(
  'inline-flex items-center justify-center font-medium text-white bg-black overflow-hidden',
  {
    variants: {
      size: {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        default: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-16 h-16 text-xl',
        '2xl': 'w-20 h-20 text-2xl',
      },
      shape: {
        circle: 'rounded-full',
        square: 'rounded-none',
        rounded: 'rounded-md',
      },
    },
    defaultVariants: {
      size: 'default',
      shape: 'circle',
    },
  }
)

export interface AvatarProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null
  alt?: string
  fallback?: string
  loading?: 'eager' | 'lazy'
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, shape, src, alt, fallback, loading = 'lazy', ...props }, ref) => {
    const classes = cn(avatarVariants({ size, shape, className }))

    // Generate fallback from alt text or use provided fallback
    const getFallback = () => {
      if (fallback) return fallback.toUpperCase()
      if (alt) return alt.charAt(0).toUpperCase()
      return '?'
    }

    return (
      <div ref={ref} className={classes} {...props}>
        {src ? (
          <Image
            src={src}
            alt={alt || 'Avatar'}
            fill
            className="object-cover"
            loading={loading}
            sizes={
              size === 'xs' ? '24px' :
              size === 'sm' ? '32px' :
              size === 'default' ? '40px' :
              size === 'lg' ? '48px' :
              size === 'xl' ? '64px' :
              size === '2xl' ? '80px' :
              '40px'
            }
          />
        ) : (
          <span className="select-none">
            {getFallback()}
          </span>
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

export { Avatar, avatarVariants }
