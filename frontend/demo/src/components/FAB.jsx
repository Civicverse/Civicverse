import React from 'react'

export default function FAB(){
  return (
    <div className="fab" role="button" aria-label="Quick actions">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="white" fillOpacity="0.12" />
        <path d="M12 7v10M7 12h10" stroke="#07112B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}
