import React, {useRef, useEffect} from 'react'
import Phaser from 'phaser'
import GameScene from './GameScene'

export default function GameCanvas(){
  const containerRef = useRef(null)

  useEffect(()=>{
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 360,
      parent: containerRef.current,
      backgroundColor: '#0a0a0f',
      scene: [GameScene]
    }
    const game = new Phaser.Game(config)
    return ()=>{
      try{game.destroy(true)}catch(e){}
    }
  },[])

  return <div ref={containerRef} style={{width:800,height:360}} />
}
