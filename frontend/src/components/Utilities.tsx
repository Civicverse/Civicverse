import React from 'react'

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-3 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin`}
      />
    </div>
  )
}

export const GradientOrb: React.FC<{ delay?: number; size?: number }> = ({
  delay = 0,
  size = 100,
}) => (
  <div
    className="absolute rounded-full blur-3xl opacity-20 pointer-events-none"
    style={{
      width: size,
      height: size,
      background: 'radial-gradient(circle, #00D9FF 0%, #B837F7 100%)',
      animation: `float 6s ease-in-out infinite`,
      animationDelay: `${delay}s`,
    }}
  />
)
