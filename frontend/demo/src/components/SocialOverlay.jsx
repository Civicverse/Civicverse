import React, { useState, useEffect } from 'react'
import { notify } from './NotificationCenter'

export default function SocialOverlay(){
  const [feed, setFeed] = useState([])

  useEffect(()=>{
    // simple demo feed generator; in prod replace with API pulls
    const id = setInterval(()=>{
      const msg = {
        id: Date.now(),
        author: ['Nyx','Astra','CivicBot','Fry'][Math.floor(Math.random()*4)],
        text: ['Deployed new node','Voting live at plaza','Mining yield +3%','New badge: Community Helper'][Math.floor(Math.random()*4)],
        time: new Date().toISOString()
      }
      setFeed(f=>[msg,...f].slice(0,8))
      notify(`${msg.author}: ${msg.text}`)
    }, 5000)
    return ()=> clearInterval(id)
  },[])

  return (
    <div className="social-overlay">
      <div className="so-header">FEED</div>
      <div className="so-list">
        {feed.map(item=> (
          <div key={item.id} className="so-item">
            <div className="so-author">{item.author}</div>
            <div className="so-text">{item.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
