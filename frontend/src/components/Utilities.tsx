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
    className="absolute rounded-full opacity-30 pointer-events-none"
    style={{
      width: size,
      height: size,
      background: 'radial-gradient(circle, rgba(0, 217, 255, 0.35) 0%, rgba(0, 217, 255, 0.08) 40%, transparent 75%)',
      boxShadow: '0 0 80px rgba(0, 217, 255, 0.18), 0 0 160px rgba(0, 217, 255, 0.08)',
      animation: `float 6s ease-in-out infinite`,
      animationDelay: `${delay}s`,
    }}
  />
)
