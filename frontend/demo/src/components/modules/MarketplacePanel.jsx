import React, { useState } from 'react'

export default function MarketplacePanel() {
  const [items] = useState([
    { name: 'Sword', price: 50 },
    { name: 'Shield', price: 75 },
    { name: 'Helmet', price: 100 }
  ])

  return (
    <div className="panel">
      <h3>MARKETPLACE</h3>
      {items.map(item => (
        <div key={item.name} className="item-row">
          {item.name}: {item.price} CVT <button className="small-btn">Buy</button>
        </div>
      ))}
    </div>
  )
}
