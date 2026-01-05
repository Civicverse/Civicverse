import React, { useState, useEffect } from 'react'

let id = 1
const subscribers = []
export function notify(message){
  subscribers.forEach(s => s(message))
}

export default function NotificationCenter(){
  const [toasts, setToasts] = useState([])

  useEffect(()=>{
    const handler = (msg) => {
      const t = { id: id++, msg }
      setToasts(s => [...s, t])
      setTimeout(()=> setToasts(s => s.filter(x=>x.id!==t.id)), 4200)
    }
    subscribers.push(handler)
    return () => { const i = subscribers.indexOf(handler); if (i>=0) subscribers.splice(i,1) }
  }, [])

  return (
    <div className="notifs">
      {toasts.map(t=> (
        <div key={t.id} className="notif">{t.msg}</div>
      ))}
    </div>
  )
}
