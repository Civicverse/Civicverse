import React, { useState } from 'react'

export default function MarketplacePanel() {
  const [items] = useState([
    { id: 'itm1', name: 'Sword', price: 50 },
    { id: 'itm2', name: 'Shield', price: 75 },
    { id: 'itm3', name: 'Helmet', price: 100 }
  ])
  const [status, setStatus] = useState(null)
  const apiBase = process.env.VITE_API_URL || ''

  async function buy(item) {
    setStatus('Creating checkout...')
    try {
      const body = { amount: item.price, currency: 'XMR', recipient: 'seller_demo', listingId: item.id }
      const resp = await fetch(`${apiBase}/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!resp.ok) throw new Error('Network response was not ok')
      const json = await resp.json()
      const entryId = json.entry?.id
      setStatus('Checkout created: entry=' + entryId)

      // Poll entry status until settled or timeout
      if (entryId) {
        setStatus(s => s + ' — awaiting settlement')
        const start = Date.now()
        const timeout = 1000 * 60 * 3 // 3 minutes
        while (Date.now() - start < timeout) {
          try {
            const st = await fetch(`${apiBase}/entry/${entryId}`)
            if (!st.ok) throw new Error('bad')
            const ej = await st.json()
            if (ej.status && ej.status !== 'pending') {
              setStatus('Entry settled: ' + JSON.stringify({ id: ej.id, status: ej.status, txid: ej.txid }))
              return
            }
          } catch (e) {}
          await new Promise(r => setTimeout(r, 2000))
        }
        setStatus('Timed out waiting for settlement')
      }
    } catch (e) {
      setStatus('Checkout failed: ' + (e.message || e))
    }
  }

  return (
    <div className="panel">
      <h3>MARKETPLACE</h3>
      {items.map(item => (
        <div key={item.id} className="item-row">
          {item.name}: {item.price} CVT <button className="small-btn" onClick={() => buy(item)}>Buy</button>
        </div>
      ))}
      {status && <div className="stat-row">{status}</div>}
    </div>
  )
}
