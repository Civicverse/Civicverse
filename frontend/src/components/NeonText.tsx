import React from 'react'

interface NeonTextProps {
  children: React.ReactNode
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  glow?: boolean
  gradient?: boolean
  className?: string
}

export const NeonText: React.FC<NeonTextProps> = ({
  children,
  size = 'base',
  glow = false,
  gradient = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl',
  }

  return (
    <span
      className={`${sizeClasses[size]} ${gradient ? 'gradient-text' : ''} ${
        glow ? 'glow-text' : ''
      } ${className}`}
    >
      {children}
    </span>
  )
}
