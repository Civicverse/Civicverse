import React from 'react'

interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  delay = 0,
}) => (
  <div
    className={`neon-card animate-slide-up ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
)
