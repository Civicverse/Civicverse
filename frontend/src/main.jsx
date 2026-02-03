import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './ui-fixes.css'

createRoot(document.getElementById('root')).render(
  React.createElement(App)
)

// expose SFX player globally so pages can trigger without prop drilling
setTimeout(()=>{
  try{
    const root = document.getElementById('root')
    const audio = document.querySelector('audio[src="/assets/sfx_purchase.wav"]')
    if(audio){ window.playSfx = ()=>{ audio.currentTime = 0; audio.play().catch(()=>{}) } }
  }catch(e){}
},1000)
