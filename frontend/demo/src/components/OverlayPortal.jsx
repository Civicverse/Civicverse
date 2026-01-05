import { createPortal } from 'react-dom'
import React from 'react'

export default function OverlayPortal({ children }){
  const mount = typeof document !== 'undefined' ? document.getElementById('overlay-root') : null
  if (!mount) return null
  return createPortal(children, mount)
}
