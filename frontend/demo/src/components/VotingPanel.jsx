import React, { useState } from 'react'

export default function VotingPanel(){
  const [votes, setVotes] = useState(0)
  function cast(){
    setVotes(v=>v+1)
    localStorage.setItem('demo_votes', (Number(localStorage.getItem('demo_votes')||0)+1).toString())
  }
  return (
    <div className="panel">
      <h3>Quadratic Voting (demo)</h3>
      <div>Votes cast: {votes}</div>
      <button onClick={cast}>Cast vote</button>
    </div>
  )
}
