import React, { useState } from 'react'

export default function DexPanel() {
  const [cvt, setCvt] = useState(1000)
  const [pxl, setPxl] = useState(50)

  const swap = () => {
    setCvt(k => k - 100)
    setPxl(x => x + 5)
  }

  return (
    <div className="panel">
      <h3>DEX</h3>
      <div className="stat-row">CVT: {cvt}</div>
      <div className="stat-row">PXL: {pxl}</div>
      <button className="action-btn" onClick={swap}>Swap 100 CVT</button>
      <button className="action-btn">View pairs</button>
    </div>
  )
}
