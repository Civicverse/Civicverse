import React from 'react'

interface AnimatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-neon-cyan mb-2">
        {label}
      </label>
    )}
    <input className={`neon-input ${className}`} {...props} />
    {error && (
      <p className="text-neon-pink text-xs mt-1 animate-pulse">{error}</p>
    )}
  </div>
)
