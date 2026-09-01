import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Global error hooks to capture runtime errors (helps debug blank/black screens)
window.addEventListener('error', (ev) => {
  // Log to console with as much detail as possible
  // eslint-disable-next-line no-console
  console.error('[GlobalError]', ev.message, ev.filename, ev.lineno, ev.colno, ev.error)
})

window.addEventListener('unhandledrejection', (ev) => {
  // eslint-disable-next-line no-console
  console.error('[UnhandledRejection]', ev.reason)
})

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
