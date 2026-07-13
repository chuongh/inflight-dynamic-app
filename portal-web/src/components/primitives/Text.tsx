import type { ReactNode } from 'react'

type TextVariant = 'body' | 'bodySm' | 'caption' | 'label' | 'h2' | 'h3'

const textColor = {
  primary: 'text-[var(--color-foreground)]',
  secondary: 'text-[var(--color-text-secondary)]',
  muted: 'text-[var(--color-text-muted)]',
  brand: 'text-vj-red',
} as const

interface TextProps {
  variant?: TextVariant
  tone?: keyof typeof textColor
  as?: 'p' | 'span' | 'div' | 'h2' | 'h3' | 'dt' | 'dd'
  className?: string
  children: ReactNode
}

const variantClass: Record<TextVariant, string> = {
  body: 'text-sm leading-relaxed',
  bodySm: 'text-[13px] leading-snug',
  caption: 'text-xs leading-snug',
  label: 'text-[11px] font-medium uppercase tracking-wide',
  h2: 'font-vja-subhead text-lg font-bold tracking-tight',
  h3: 'font-vja-subhead text-[15px] font-medium',
}

export function Text({
  variant = 'body',
  tone = 'primary',
  as: Tag = 'span',
  className = '',
  children,
}: TextProps) {
  return <Tag className={`${variantClass[variant]} ${textColor[tone]} ${className}`}>{children}</Tag>
}
