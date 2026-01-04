import React, { useState, useEffect } from 'react'
import demoConfig from '../../demo-config.json'

export default function MinerDashboard() {
  const defaultCfg = demoConfig.miner.default || { mode: 'low_power', kaspa: { enabled: true, threads: 1 }, monero: { enabled: true, threads: 1 } }
  const [mining, setMining] = useState(true)
  const [kaspaThreads, setKaspaThreads] = useState(defaultCfg.kaspa.threads)
  const [moneroThreads, setMoneroThreads] = useState(defaultCfg.monero.threads)
  const [mode, setMode] = useState(defaultCfg.mode)
  const [estimatedHash, setEstimatedHash] = useState(0)
  const [earned, setEarned] = useState(0)

  useEffect(() => {
    // simple combined hash estimate formula for demo purposes
    const estimate = kaspaThreads * 12 + moneroThreads * 4
    setEstimatedHash(estimate.toFixed(2))
  }, [kaspaThreads, moneroThreads])

  useEffect(() => {
    let id
    if (mining) {
      id = setInterval(() => {
        setEarned(e => (parseFloat(e) + (parseFloat(estimatedHash) * 0.0001)).toFixed(6))
      }, 3000)
    }
    return () => clearInterval(id)
  }, [mining, estimatedHash])

  const applyAutoConfig = () => {
    // auto-config to lowest settings
    setMode('low_power')
    setKaspaThreads(1)
    setMoneroThreads(1)
  }

  return (
    <div className="panel">
      <h3>MINER (Demo)</h3>
      <div className="stat-row">Status: {mining ? '🟢 Mining' : '⚫ Idle'}</div>
      <div className="stat-row">Mode: {mode}</div>
      <div className="stat-row">Kaspa Threads: {kaspaThreads}</div>
      <div className="stat-row">Monero Threads: {moneroThreads}</div>
      <div className="stat-row">Estimated Combined Hash: {estimatedHash} H/s (demo units)</div>
      <div className="stat-row">Earned (demo): {earned} CVT</div>

      <div style={{ marginTop: 8 }}>
        <label>Kaspa Threads: <input type="range" min="1" max="8" value={kaspaThreads} onChange={e=>setKaspaThreads(parseInt(e.target.value))} /></label>
        <br />
        <label>Monero Threads: <input type="range" min="1" max="8" value={moneroThreads} onChange={e=>setMoneroThreads(parseInt(e.target.value))} /></label>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={()=>setMining(m => !m)} className="action-btn">{mining ? 'Stop' : 'Start'}</button>
        <button onClick={applyAutoConfig} style={{ marginLeft: 8 }}>Auto-config (low)</button>
      </div>
    </div>
  )
}
