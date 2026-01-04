import React, { useState, useEffect } from 'react'
import CraigEnforcer from '../../ai/CraigEnforcer'

const craig = new CraigEnforcer()

export default function CraigPanel(){
  const [logs, setLogs] = useState(craig.getLog())

  useEffect(() => {
    // demo: add a couple of fake enforcement entries
    craig.enforce('init', { msg: 'Craig started (demo)' })
    craig.enforce('policy_check', { rule: 'content_moderation', result: 'ok' })
    setLogs(craig.getLog())
  }, [])

  const runTest = () => {
    craig.enforce('ban', { user: 'PlayerX', reason: 'spam (demo)' })
    setLogs(craig.getLog())
  }

  return (
    <div style={{ padding: 12 }}>
      <h2>Craig Enforcer (Demo)</h2>
      <button onClick={runTest}>Run Test Enforcement</button>
      <div style={{ marginTop: 12, maxHeight: 300, overflow: 'auto', background: '#111', padding: 8 }}>
        {logs.map((l, i) => (
          <div key={i} style={{ fontSize: 12, color: '#0ff', borderBottom: '1px solid #222', padding: 6 }}>
            <div><strong>{l.action}</strong> - {new Date(l.ts).toLocaleString()}</div>
            <pre style={{ margin: 0, color: '#9ff' }}>{JSON.stringify(l.details)}</pre>
          </div>
        ))}
      </div>
    </div>
  )
}
