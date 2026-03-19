import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface GamingRigState {
  powered: boolean
  lightMode: 'rainbow' | 'purple' | 'cyan' | 'pink' | 'green' | 'fire'
  skin: 'midnight' | 'cosmic' | 'neon' | 'sakura'
  danceMode: 'idle' | 'dancing' | 'pulse'
}

export const GamingRigAvatar: React.FC<{ className?: string }> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const rigRef = useRef<THREE.Group | null>(null)
  const lightRefs = useRef<THREE.Light[]>([])
  const danceCharRef = useRef<THREE.Mesh | null>(null)

  const [state, setState] = useState<GamingRigState>({
    powered: false,
    lightMode: 'rainbow',
    skin: 'midnight',
    danceMode: 'idle',
  })

  const lightModeColors: Record<string, THREE.Color[]> = {
    rainbow: [
      new THREE.Color(0xff0000),
      new THREE.Color(0xff7f00),
      new THREE.Color(0x00ff00),
      new THREE.Color(0x0000ff),
      new THREE.Color(0x4b0082),
      new THREE.Color(0x9400d3),
    ],
    purple: [
      new THREE.Color(0x9d00ff),
      new THREE.Color(0xff00ff),
      new THREE.Color(0x6600ff),
    ],
    cyan: [
      new THREE.Color(0x00ffff),
      new THREE.Color(0x0088ff),
      new THREE.Color(0x00ffaa),
    ],
    pink: [
      new THREE.Color(0xff0080),
      new THREE.Color(0xff1493),
      new THREE.Color(0xff69b4),
    ],
    green: [
      new THREE.Color(0x00ff00),
      new THREE.Color(0x00ff88),
      new THREE.Color(0x00aa00),
    ],
    fire: [
      new THREE.Color(0xff0000),
      new THREE.Color(0xff6600),
      new THREE.Color(0xffaa00),
    ],
  }

  const skinConfigs: Record<string, { caseColor: THREE.Color; accentColor: THREE.Color; glassColor: string }> = {
    midnight: {
      caseColor: new THREE.Color(0x1a1a2e),
      accentColor: new THREE.Color(0x2a2a4e),
      glassColor: 'rgba(10, 10, 20, 0.4)',
    },
    cosmic: {
      caseColor: new THREE.Color(0x2a1a4a),
      accentColor: new THREE.Color(0x4a3a7a),
      glassColor: 'rgba(26, 0, 51, 0.35)',
    },
    neon: {
      caseColor: new THREE.Color(0x2a2a2a),
      accentColor: new THREE.Color(0x00dd00),
      glassColor: 'rgba(0, 170, 0, 0.2)',
    },
    sakura: {
      caseColor: new THREE.Color(0x3a1a2a),
      accentColor: new THREE.Color(0xff2299),
      glassColor: 'rgba(255, 20, 147, 0.25)',
    },
  }

  // Create animated canvas texture for LCD display
  const createLCDTexture = (): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    const animate = () => {
      // Windows 11 style dark desktop background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, '#0a0e27')
      gradient.addColorStop(1, '#1a1f3a')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const time = Date.now() * 0.001
      
      // Taskbar at bottom
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, canvas.height - 50, canvas.width, 50)

      // Mining status bar/window
      ctx.fillStyle = '#0f1419'
      ctx.strokeStyle = '#00ffaa'
      ctx.lineWidth = 2
      ctx.fillRect(20, 40, canvas.width - 40, 180)
      ctx.strokeRect(20, 40, canvas.width - 40, 180)

      // Title bar
      ctx.fillStyle = '#1e3a1e'
      ctx.fillRect(20, 40, canvas.width - 40, 25)
      ctx.fillStyle = '#00ff00'
      ctx.font = 'bold 12px monospace'
      ctx.fillText('XMR_MONERO_MINER.exe', 30, 57)

      // Mining stats
      ctx.fillStyle = '#00ffaa'
      ctx.font = '11px monospace'
      let yPos = 75
      const stats = [
        `Hash Rate: ${(Math.random() * 500 + 200).toFixed(1)} H/s`,
        `Shares: ${Math.floor(Date.now() / 5000) % 1000}`,
        `Difficulty: ${(Math.random() * 0.5 + 0.1).toFixed(3)}`,
        `Uptime: ${Math.floor(time / 60)}m ${Math.floor(time) % 60}s`,
      ]
      stats.forEach(stat => {
        ctx.fillText(stat, 35, yPos)
        yPos += 25
      })

      // Progress bar for current block
      ctx.fillStyle = '#00ff0044'
      ctx.fillRect(35, 235, (Math.sin(time * 2) + 1) * 80, 8)
      ctx.strokeStyle = '#00ffaa'
      ctx.lineWidth = 1
      ctx.strokeRect(35, 235, 160, 8)

      // Temperature gauge
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(20, 270, canvas.width - 40, 100)
      ctx.strokeStyle = '#ff6600'
      ctx.lineWidth = 2
      ctx.strokeRect(20, 270, canvas.width - 40, 100)

      ctx.fillStyle = '#ff6600'
      ctx.font = '11px monospace'
      ctx.fillText('SYSTEM TEMP', 30, 290)

      // GPU temp bar
      const gpuTemp = 45 + Math.sin(time * 0.5) * 15
      ctx.fillStyle = '#ff6600'
      ctx.fillRect(35, 310, (gpuTemp / 100) * 140, 12)
      ctx.fillStyle = '#ffaa00'
      ctx.fillText(`GPU: ${gpuTemp.toFixed(1)}°C`, 190, 320)

      // CPU temp bar
      const cpuTemp = 55 + Math.sin(time * 0.7) * 10
      ctx.fillStyle = '#ff3300'
      ctx.fillRect(35, 340, (cpuTemp / 100) * 140, 12)
      ctx.fillStyle = '#ffaa00'
      ctx.fillText(`CPU: ${cpuTemp.toFixed(1)}°C`, 190, 350)

      // Power usage
      ctx.fillStyle = '#ffaa00'
      ctx.font = '10px monospace'
      ctx.fillText(`PWR: ${(250 + Math.sin(time) * 30).toFixed(0)}W`, 35, 385)

      // Scrolling log effect
      const logLines = [
        `[${Math.floor(time) % 60}:00] Stratum connected`,
        `[${Math.floor(time) % 60}:15] New block received`,
        `[${Math.floor(time) % 60}:30] Share accepted`,
      ]
      ctx.fillStyle = '#00ff00'
      ctx.font = '9px monospace'
      logLines.forEach((line, i) => {
        ctx.fillText(line, 35, 420 + i * 12)
      })

      requestAnimationFrame(animate)
    }

    animate()
    return new THREE.CanvasTexture(canvas)
  }

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    // Get container dimensions
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    // Scene setup
    const scene = new THREE.Scene()
    // scene.background = new THREE.Color(0x1a1a2e) // Removed for transparency
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height || 1, 0.1, 1000)
    camera.position.z = 3.5
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }) // alpha: true for transparency
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.setClearColor(0x000000, 0) // Ensure clear color is transparent
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Create gaming rig
    const rig = new THREE.Group()
    rigRef.current = rig
    scene.add(rig)

    // PC Case - Main body
    const caseGeometry = new THREE.BoxGeometry(2, 3, 1.5)
    const caseMaterial = new THREE.MeshStandardMaterial({
      color: skinConfigs[state.skin].caseColor,
      metalness: 0.6,
      roughness: 0.4,
      emissive: new THREE.Color(0x333344),
      emissiveIntensity: 0.2,
    })
    const pcCase = new THREE.Mesh(caseGeometry, caseMaterial)
    pcCase.castShadow = true
    pcCase.receiveShadow = true
    rig.add(pcCase)

    // Front glass panel with LCD display
    const glassGeometry = new THREE.PlaneGeometry(1.8, 2.8)
    const lcdTexture = createLCDTexture()
    const glassMaterial = new THREE.MeshStandardMaterial({
      map: lcdTexture,
      emissive: new THREE.Color(0x0099ff),
      emissiveIntensity: 0.8,
      emissiveMap: lcdTexture,
      metalness: 0.1,
      roughness: 0.3,
      transparent: false,
    })
    const glassPanel = new THREE.Mesh(glassGeometry, glassMaterial)
    glassPanel.position.z = 0.76
    glassPanel.castShadow = true
    glassPanel.receiveShadow = true
    rig.add(glassPanel)
    danceCharRef.current = glassPanel

    // Side accent panels with ARGB
    const accentGeometry = new THREE.BoxGeometry(0.1, 3, 1.5)
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: skinConfigs[state.skin].accentColor,
      metalness: 0.9,
      roughness: 0.1,
      emissive: new THREE.Color(0x00ffff),
      emissiveIntensity: 0,
    })

    const leftAccent = new THREE.Mesh(accentGeometry, accentMaterial.clone())
    leftAccent.position.x = -0.95
    leftAccent.castShadow = true
    leftAccent.receiveShadow = true
    rig.add(leftAccent)

    const rightAccent = new THREE.Mesh(accentGeometry, accentMaterial.clone())
    rightAccent.position.x = 0.95
    rightAccent.castShadow = true
    rightAccent.receiveShadow = true
    rig.add(rightAccent)

    // Front ports (details)
    const portGeometry = new THREE.CircleGeometry(0.08, 32)
    const portMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 1,
      roughness: 0,
    })

    for (let i = 0; i < 3; i++) {
      const port = new THREE.Mesh(portGeometry, portMaterial.clone())
      port.position.set(-0.4 + i * 0.4, -1.3, 0.76)
      port.castShadow = true
      rig.add(port)
    }

    // Power button
    const buttonGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 32)
    const buttonMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.6,
      roughness: 0.2,
      emissive: new THREE.Color(0xff0000),
      emissiveIntensity: 0,
    })
    const powerButton = new THREE.Mesh(buttonGeometry, buttonMaterial)
    powerButton.position.set(-0.8, -1.3, 0.76)
    powerButton.castShadow = true
    powerButton.receiveShadow = true
    rig.add(powerButton)

    // Top RGB header lights
    const rgbSides = [
      { x: -0.6, color: 0xff0000 },
      { x: 0, color: 0x00ff00 },
      { x: 0.6, color: 0x0000ff },
    ]

    const lightGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.1)
    const lights: THREE.Light[] = []

    rgbSides.forEach(({ x, color }) => {
      const light = new THREE.Mesh(
        lightGeometry,
        new THREE.MeshStandardMaterial({
          color,
          emissive: new THREE.Color(color),
          emissiveIntensity: 0,
          metalness: 0.7,
        })
      )
      light.position.set(x, 1.6, 0)
      light.castShadow = true
      rig.add(light)

      // Create point light for this RGB
      const pointLight = new THREE.PointLight(color, 1.5, 10)
      pointLight.position.set(x, 1.6, 1)
      pointLight.castShadow = true
      scene.add(pointLight)
      lights.push(pointLight)
    })

    lightRefs.current = lights

    // Fans visible through window
    for (let i = 0; i < 2; i++) {
      const fanGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32)
      const fanMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.3,
        roughness: 0.7,
      })
      const fan = new THREE.Mesh(fanGeometry, fanMaterial)
      fan.position.set(-0.4, 0.4 + i * 0.8, 0.4)
      fan.castShadow = true
      fan.receiveShadow = true
      rig.add(fan)
    }

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
    directionalLight.position.set(5, 5, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // Additional fill light
    const fillLight = new THREE.DirectionalLight(0x6699ff, 1)
    fillLight.position.set(-5, -5, -5)
    scene.add(fillLight)

    // Animation loop
    let lightColorIndex = 0
    let rotationAngle = 0

    const animate = () => {
      requestAnimationFrame(animate)

      // Rotate rig
      rig.rotation.y += 0.003

      // Update lights based on state
      if (state.powered) {
        const colors = lightModeColors[state.lightMode]
        lightRefs.current.forEach((light, idx) => {
          const color = colors[idx % colors.length]
          light.color.copy(color)

          if (state.lightMode === 'rainbow') {
            const hue = (lightColorIndex + idx * 60) % 360
            const rgb = hslToRgb(hue / 360, 1, 0.5)
            light.color.setRGB(rgb.r / 255, rgb.g / 255, rgb.b / 255)
          }

          // Pulsing effect
          if (state.danceMode === 'pulse') {
            light.intensity = 0.5 + Math.sin(Date.now() * 0.005 + idx) * 0.5
          } else {
            light.intensity = 1
          }
        })

        lightColorIndex++
      } else {
        // Powered off - dim lights
        lightRefs.current.forEach((light) => {
          light.intensity = 0.1
        })
      }

      renderer.render(scene, camera)
    }

    animate()

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return
      
      const newWidth = containerRef.current.clientWidth
      const newHeight = containerRef.current.clientHeight
      
      cameraRef.current.aspect = newWidth / newHeight || 1
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [state.skin])

  // HSL to RGB conversion
  const hslToRgb = (h: number, s: number, l: number) => {
    let r, g, b

    if (s === 0) {
      r = g = b = l
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    }
  }

  const togglePower = () => {
    setState((prev) => ({ ...prev, powered: !prev.powered }))
  }

  const setLightMode = (mode: GamingRigState['lightMode']) => {
    setState((prev) => ({ ...prev, lightMode: mode }))
  }

  const setSkin = (skin: GamingRigState['skin']) => {
    setState((prev) => ({ ...prev, skin }))
  }

  const setDanceMode = (mode: GamingRigState['danceMode']) => {
    setState((prev) => ({ ...prev, danceMode: mode }))
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
