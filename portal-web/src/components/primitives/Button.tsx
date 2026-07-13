import { Button as AntButton, type ButtonProps as AntButtonProps } from 'antd'
import { vjBrand } from '../../design-system'

type VjButtonVariant = 'primary' | 'secondary' | 'warning'

interface VjButtonProps extends Omit<AntButtonProps, 'type' | 'danger' | 'variant'> {
  variant?: VjButtonVariant
}

const warningStyle = {
  background: vjBrand.colors.accent,
  borderColor: '#F0C800',
  color: vjBrand.colors.accentOn,
} as const

export function Button({ variant = 'primary', style, className = '', ...props }: VjButtonProps) {
  if (variant === 'warning') {
    return (
      <AntButton
        type="primary"
        className={`vj-btn-warning ${className}`}
        style={{ ...warningStyle, ...style }}
        {...props}
      />
    )
  }

  if (variant === 'secondary') {
    return (
      <AntButton
        className={`border-[var(--color-border)] text-[var(--color-foreground)] ${className}`}
        style={style}
        {...props}
      />
    )
  }

  return <AntButton type="primary" className={className} style={style} {...props} />
}
