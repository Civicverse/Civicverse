import React from 'react'

export default function TopNav(){
  const items = ['Home','Quests','Inventory','Friends','Marketplace','Guilds','Settings']
  return (
    <header className="topnav">
      <div className="brand">
        <img src="/assets/ui/mascot.svg" alt="mascot" style={{width:40,height:40}} />
        <div>CIVICVERSE</div>
      </div>
      <div className="nav-items" role="navigation" aria-label="main">
        {items.map(i=> (
          <div key={i} className="nav-item" role="button" tabIndex={0} aria-label={i}>{i}</div>
        ))}
      </div>
      <div className="search">
        <input aria-label="Search" role="searchbox" placeholder="Search quests, players, listings..." style={{background:'transparent',border:'none',color:'var(--panel-text)',outline:'none',width:'100%'}} />
      </div>
    </header>
  )
}
