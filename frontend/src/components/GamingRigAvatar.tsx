import React, { useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'

interface GamingRigAvatarProps {
  className?: string
  isMining?: boolean
  load?: number // 0-100
  temperature?: number // Celsius
  workerName?: string
  hashRate?: number
  theme?: 'midnight' | 'cyber' | 'gold' | 'white'
}

export const GamingRigAvatar: React.FC<GamingRigAvatarProps> = ({
  className = '',
  isMining = false,
  load = 0,
  temperature = 40,
  workerName = 'Rig-01',
  hashRate = 0,
  theme = 'midnight'
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const rigRef = useRef<THREE.Group | null>(null)
  const fansRef = useRef<THREE.Group[]>([])
  const gpuFansRef = useRef<THREE.Group[]>([])
  const fireRef = useRef<THREE.Group | null>(null)
  
  // Theme Colors
  const themeColors = useMemo(() => {
      switch(theme) {
          case 'cyber': return { chassis: 0x001133, accent: 0x00ffff, metal: 0.9 };
          case 'gold': return { chassis: 0x221100, accent: 0xffaa00, metal: 1.0 };
          case 'white': return { chassis: 0xeeeeee, accent: 0x333333, metal: 0.3 };
          case 'midnight':
          default: return { chassis: 0x111111, accent: 0x333333, metal: 0.8 };
      }
  }, [theme])
  
  // Create LCD Texture (Dynamic)
  const lcdTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    return new THREE.CanvasTexture(canvas)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
    camera.position.set(3, 1.5, 4)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.setClearColor(0x000000, 0)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // --- Build The Rig ---
    const rig = new THREE.Group()
    rigRef.current = rig
    scene.add(rig)

    // 1. Case Chassis (Open Frame style)
    const chassisMat = new THREE.MeshStandardMaterial({ 
        color: themeColors.chassis, 
        metalness: themeColors.metal, 
        roughness: 0.2 
    })
    
    // Bottom Plate
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 4), chassisMat)
    bottom.position.y = -1
    bottom.receiveShadow = true
    rig.add(bottom)

    // Back Plate (Motherboard Tray)
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.5, 4), chassisMat)
    back.position.set(-1, 0.25, 0)
    back.receiveShadow = true
    rig.add(back)

    // 2. Motherboard
    const moboMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.5 })
    const mobo = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.2, 3.8), moboMat)
    mobo.position.set(-0.9, 0.25, 0)
    rig.add(mobo)

    // 3. Components
    
    // CPU Cooler (AIO Block)
    const cpuBlock = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.15, 32),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 })
    )
    cpuBlock.rotation.z = Math.PI / 2
    cpuBlock.position.set(-0.8, 0.5, 0.5)
    rig.add(cpuBlock)

    // RGB Ring on CPU
    const cpuRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.15, 0.02, 16, 32),
        new THREE.MeshBasicMaterial({ color: 0x00ffff })
    )
    cpuRing.rotation.y = Math.PI / 2
    cpuRing.position.set(-0.75, 0.5, 0.5)
    rig.add(cpuRing)

    // RAM Sticks
    const ramGeo = new THREE.BoxGeometry(0.05, 0.6, 0.02)
    const ramMat = new THREE.MeshStandardMaterial({ color: 0x333333 })
    for(let i=0; i<4; i++) {
        const stick = new THREE.Mesh(ramGeo, ramMat)
        stick.position.set(-0.8, 0.5, 0.8 + (i * 0.08))
        rig.add(stick)
        // RGB Top
        const rgb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: 0xff00ff }))
        rgb.position.y = 0.3
        stick.add(rgb)
    }

    // GPU (The Beast)
    const gpuGroup = new THREE.Group()
    gpuGroup.position.set(-0.5, -0.2, 0)
    rig.add(gpuGroup)

    const gpuBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.1, 2.8),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.3 })
    )
    gpuBody.castShadow = true
    gpuGroup.add(gpuBody)

    // GPU Fans
    for(let i=0; i<3; i++) {
        const fanGroup = new THREE.Group()
        fanGroup.position.set(0, 0.06, -0.8 + (i * 0.8))
        fanGroup.rotation.x = -Math.PI / 2 // Face up
        gpuGroup.add(fanGroup)
        
        const blades = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.05, 0.05, 8, 1, true),
            new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide })
        )
        // Create blades look
        const bladeGeo = new THREE.BoxGeometry(0.3, 0.05, 0.01)
        for(let j=0; j<7; j++) {
            const blade = new THREE.Mesh(bladeGeo, new THREE.MeshStandardMaterial({ color: 0x222222 }))
            blade.position.x = 0.15
            blade.rotation.z = 0.2
            const pivot = new THREE.Group()
            pivot.rotation.y = (j / 7) * Math.PI * 2
            pivot.add(blade)
            fanGroup.add(pivot)
        }
        gpuFansRef.current.push(fanGroup)
    }

    // RGB Strip on GPU
    const gpuStrip = new THREE.Mesh(
        new THREE.BoxGeometry(1.22, 0.02, 2.82),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    )
    gpuStrip.position.y = 0
    gpuGroup.add(gpuStrip)


    // 4. LCD Panel (Front/Side)
    const lcdGeo = new THREE.PlaneGeometry(1.5, 2.5)
    const lcdMat = new THREE.MeshBasicMaterial({ map: lcdTexture, side: THREE.DoubleSide })
    const lcd = new THREE.Mesh(lcdGeo, lcdMat)
    lcd.position.set(0.8, 0, 0)
    lcd.rotation.y = -Math.PI / 2
    rig.add(lcd)

    // 5. Fire Effect (Hidden by default)
    const fireGroup = new THREE.Group()
    fireGroup.visible = false
    rig.add(fireGroup)
    fireRef.current = fireGroup
    
    // Core fire light
    const fireLight = new THREE.PointLight(0xff5500, 0, 5)
    fireLight.position.set(0, 0, 0)
    fireGroup.add(fireLight)

    // Random floating embers
    const emberGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05)
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xff3300 })
    for(let i=0; i<20; i++) {
        const ember = new THREE.Mesh(emberGeo, emberMat)
        ember.position.set(
            (Math.random() - 0.5) * 1,
            (Math.random() - 0.5) * 1,
            (Math.random() - 0.5) * 1
        )
        fireGroup.add(ember)
    }

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambient)
    
    const blueLight = new THREE.PointLight(0x0088ff, 1, 10)
    blueLight.position.set(2, 2, 2)
    scene.add(blueLight)

    const pinkLight = new THREE.PointLight(0xff00ff, 1, 10)
    pinkLight.position.set(-2, -2, 2)
    scene.add(pinkLight)


    // Animation Loop
    let time = 0
    const animate = () => {
      requestAnimationFrame(animate)
      time += 0.01

      // Rotate Rig
      if (rigRef.current) {
        rigRef.current.rotation.y = Math.sin(time * 0.2) * 0.2 - 0.5
      }

      // Rotate Fans
      gpuFansRef.current.forEach(fan => {
          fan.rotation.y -= 0.2 // Spin fast
      })

      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
      gpuFansRef.current = []
    }
  }, [theme])

  // Update State & LCD
  useEffect(() => {
    // 1. Fire Effect
    if (fireRef.current) {
        if (temperature > 80 || load > 90) {
            fireRef.current.visible = true
            // Pulse light
            const light = fireRef.current.children[0] as THREE.PointLight
            light.intensity = 2 + Math.random() * 3
            
            // Jitter embers
            fireRef.current.children.slice(1).forEach((ember) => {
                ember.position.y += 0.02
                if(ember.position.y > 1) ember.position.y = -1
                ember.rotation.x += 0.1
            })
        } else {
            fireRef.current.visible = false
        }
    }

    // 2. Draw LCD
    const ctx = lcdTexture.image.getContext('2d')
    if (ctx) {
        const w = 512, h = 512
        
        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, h)
        if (temperature > 80) {
            grad.addColorStop(0, '#550000')
            grad.addColorStop(1, '#ff0000')
        } else {
            grad.addColorStop(0, '#001133')
            grad.addColorStop(1, '#004488')
        }
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)

        // Header
        ctx.fillStyle = '#00ffaa'
        ctx.font = 'bold 40px monospace'
        ctx.fillText(`WORKER: ${workerName}`, 20, 60)

        // Status
        ctx.fillStyle = isMining ? '#00ff00' : '#ffff00'
        ctx.fillText(`STATUS: ${isMining ? 'MINING' : 'IDLE'}`, 20, 120)

        // Stats
        ctx.fillStyle = '#ffffff'
        ctx.font = '30px monospace'
        ctx.fillText(`HASH: ${hashRate.toFixed(1)} H/s`, 20, 200)
        ctx.fillText(`TEMP: ${temperature.toFixed(1)}°C`, 20, 250)
        ctx.fillText(`LOAD: ${load.toFixed(0)}%`, 20, 300)

        // Graph
        ctx.strokeStyle = '#00ffaa'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(20, 400)
        for(let i=0; i<20; i++) {
            const val = isMining ? Math.random() * 100 : 10
            ctx.lineTo(20 + i * 24, 400 - val)
        }
        ctx.stroke()
        
        lcdTexture.needsUpdate = true
    }

  }, [isMining, load, temperature, workerName, hashRate, lcdTexture])

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
