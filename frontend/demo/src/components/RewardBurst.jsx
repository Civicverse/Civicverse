import React from 'react'

export default function RewardBurst({ size = 64 }){
  const s = size
  return (
    <div style={{width:s, height:s, display:'inline-block'}} aria-hidden>
      <svg viewBox="0 0 64 64" width={s} height={s}>
        <defs>
          <radialGradient id="rg" cx="50%" cy="30%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#4EE1FF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF4ECF" stopOpacity="0.3" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="10" fill="url(#rg)" />
        <g>
          <circle cx="16" cy="12" r="2.5" fill="#FF4ECF" style={{animation:'p 900ms ease-out infinite'}} />
          <circle cx="48" cy="10" r="2.5" fill="#4EE1FF" style={{animation:'p 1100ms ease-out infinite'}} />
          <circle cx="8" cy="40" r="2" fill="#00FFAA" style={{animation:'p 700ms ease-out infinite'}} />
          <circle cx="56" cy="44" r="2" fill="#FFD76B" style={{animation:'p 1200ms ease-out infinite'}} />
        </g>
        <style>{`
          @keyframes p{0%{transform:translateY(0) scale(0.9);opacity:0.9}50%{transform:translateY(-6px) scale(1.05);opacity:1}100%{transform:translateY(0) scale(0.95);opacity:0.85}}
        `}</style>
      </svg>
    </div>
  )
}
