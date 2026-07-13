import logoUrl from '@/assets/vj-logo.svg'
import whiteLogoUrl from '@/assets/vj-white-logo.png'

interface VietJetLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** White wordmark for dark / red backgrounds */
  variant?: 'default' | 'white'
}

const sizeClass = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-14',
  xl: 'h-20',
}

/** Official Vietjet Air wordmark — red SVG or white PNG */
export function VietJetLogo({
  className = '',
  size = 'md',
  variant = 'default',
}: VietJetLogoProps) {
  const src = variant === 'white' ? whiteLogoUrl : logoUrl

  return (
    <img
      src={src}
      alt="Vietjet Air"
      className={`${sizeClass[size]} w-auto flex-none object-contain ${className}`}
    />
  )
}
