import React from 'react'
import { Html } from '@react-three/drei'

export default function WorldPanel({ position = [0, 2, 0], title = 'Panel', onOpen, onClose }){
  return (
    <Html position={position} transform occlude>
      <div className="world-panel">
        <div className="wp-title">{title}</div>
        <div className="wp-body">
          <div className="wp-row">Explore nearby</div>
          <div className="wp-row">Start Quest</div>
          <div className="wp-actions">
            <button className="wp-btn" onClick={()=>{ console.log('Open', title); onOpen && onOpen(title); }}>Open</button>
            <button className="wp-btn ghost" onClick={()=>{ console.log('Close', title); onClose && onClose(title); }}>Close</button>
          </div>
        </div>
      </div>
    </Html>
  )
}
