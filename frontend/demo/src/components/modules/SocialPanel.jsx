import React, { useState } from 'react'

export default function SocialPanel() {
  const [feed] = useState([
    { user: 'Player1', msg: 'Just got 3 kills!' },
    { user: 'Player2', msg: 'Voting for governance proposal #5' },
    { user: 'Player3', msg: 'Trading on DEX' }
  ])

  return (
    <div className="panel">
      <h3>SOCIAL</h3>
      {feed.map((post, i) => (
        <div key={i} className="feed-item">
          <strong>{post.user}:</strong> {post.msg}
        </div>
      ))}
      <input type="text" placeholder="Message..." className="input-field" />
      <button className="action-btn">Post</button>
    </div>
  )
}
