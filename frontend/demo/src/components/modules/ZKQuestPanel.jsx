import React, { useState } from 'react'

export default function ZKQuestPanel() {
  const [quests] = useState([
    { name: 'Vote on proposal', reward: 10 },
    { name: 'Trade on DEX', reward: 15 },
    { name: 'Social post', reward: 5 }
  ])

  return (
    <div className="panel">
      <h3>ZK QUESTS</h3>
      {quests.map(quest => (
        <div key={quest.name} className="item-row">
          {quest.name}: +{quest.reward} XP <button className="small-btn">Attest</button>
        </div>
      ))}
    </div>
  )
}
