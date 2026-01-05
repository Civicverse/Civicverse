import React from 'react'

export default function MiniMap(){
  return (
    <div className="minimap">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="mg" x1="0" x2="1">
            <stop offset="0" stopColor="#00ffd0" stopOpacity="0.15" />
            <stop offset="1" stopColor="#0077ff" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="url(#mg)" stroke="#003344" />
        <circle cx="50" cy="50" r="4" fill="#ff6b9d" />
        <rect x="12" y="20" width="8" height="6" fill="#ffd700" />
        <rect x="72" y="60" width="10" height="8" fill="#00f0ff" />
      </svg>
    </div>
  )
}
