import React, { useState } from 'react'

export default function CharacterCustomization() {
  const [skin, setSkin] = useState('red')
  const [armor, setArmor] = useState('basic')

  return (
    <div className="panel">
      <h3>CHARACTER</h3>
      <div className="stat-row">
        Skin:
        <select value={skin} onChange={(e) => setSkin(e.target.value)} className="select-field">
          <option>red</option>
          <option>blue</option>
          <option>green</option>
        </select>
      </div>
      <div className="stat-row">
        Armor:
        <select value={armor} onChange={(e) => setArmor(e.target.value)} className="select-field">
          <option>basic</option>
          <option>reinforced</option>
          <option>elite</option>
        </select>
      </div>
      <button className="action-btn">Apply changes</button>
    </div>
  )
}
