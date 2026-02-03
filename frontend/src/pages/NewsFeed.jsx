import React from 'react'

const sample = [
  {id:1,who:'Reporter',text:'High-energy neon parade in Foyer.'},
  {id:2,who:'Citizen',text:'Selling vintage synthwave cassette.'}
]

export default function NewsFeed(){
  return (
    <div>
      <h3>Newsstand (Short Clips)</h3>
      {sample.map(s=> <div key={s.id} style={{padding:8,margin:6,background:'#070615',borderRadius:6}}><b>{s.who}</b><p>{s.text}</p></div>)}
    </div>
  )
}
