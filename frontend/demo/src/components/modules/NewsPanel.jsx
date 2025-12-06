import React, { useState } from 'react'

export default function NewsPanel() {
  const [news] = useState([
    'New player joined arena',
    'DEX trading volume up 120%',
    'Governance vote passed',
    'Treasury increased to 2M CVT'
  ])

  return (
    <div className="panel">
      <h3>NEWS</h3>
      {news.map((item, i) => (
        <div key={i} className="news-item">
          • {item}
        </div>
      ))}
    </div>
  )
}
