import React, { useEffect, useRef } from 'react'

export default function PhaserGame({ avatarAppearance }){
  const mountRef = useRef(null)
  useEffect(()=>{
    let game = null
    let mounted = true
    function loadScript(src){
      return new Promise((resolve, reject) =>{
        if (window.Phaser) return resolve(window.Phaser)
        const s = document.createElement('script')
        s.src = src
        s.onload = () => resolve(window.Phaser)
        s.onerror = reject
        document.head.appendChild(s)
      })
    }

    async function init(){
      try{
        const Phaser = await loadScript('https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js')
        if (!mounted) return

        const config = {
          type: Phaser.AUTO,
          width: mountRef.current?.clientWidth || 800,
          height: mountRef.current?.clientHeight || 600,
          parent: mountRef.current,
          transparent: true,
          backgroundColor: 0x000000,
          physics: { default: 'arcade' },
          scale: { mode: Phaser.Scale.RESIZE }
        }

        class MainScene extends Phaser.Scene {
          constructor(){ super({ key: 'MainScene' }) }
          preload(){
            // load background GIF (will be used as texture for tileSprite)
            this.load.image('city', '/assets/bg/animated-city.gif')
          }
          create(){
            // slow-moving tile sprite for parallax (animated GIF will play if supported)
            const w = this.scale.width, h = this.scale.height
            this.bg = this.add.tileSprite(0, 0, w, h, 'city').setOrigin(0)
            this.bg.setScrollFactor(0)

            // placeholder player as simple graphics (replace with sprite sheets later)
            this.player = this.add.container(w/2, h*0.6)
            const g = this.add.graphics()
            g.fillStyle(0xffffff, 1)
            g.fillRoundedRect(-24, -48, 48, 64, 8)
            g.fillStyle(0x00ffcc, 1)
            g.fillRoundedRect(-22, -46, 44, 32, 6)
            this.player.add(g)

            // subtle breathing animation
            this.tweens.add({
              targets: this.player,
              scaleX: 1.02,
              scaleY: 1.02,
              yoyo: true,
              duration: 2000,
              repeat: -1,
              ease: 'Sine.easeInOut'
            })

            // ambient parallax offsets and a gentle bob for life
            this.time.addEvent({ delay: 16, loop: true, callback: () => {
              this.bg.tilePositionX += 0.12
            }})

            // keep canvas pointer-events none so React overlays handle interaction
            if (this.sys && this.sys.canvas) this.sys.canvas.style.pointerEvents = 'none'
          }
          update(t, dt){
            // optional update hooks
          }
        }

        game = new Phaser.Game({ ...config, scene: [MainScene] })

      }catch(e){
        console.warn('Phaser load failed', e)
      }
    }

    init()
    return ()=>{
      mounted = false
      try{ if (game) game.destroy(true) }catch(e){}
    }
  }, [])

  return (
    <div ref={mountRef} style={{ width:'100%', height:'100%', position:'absolute', inset:0 }} />
  )
}
