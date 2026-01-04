import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

// Audio synthesis for atmospheric game music
class AudioSynthesizer {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    this.masterGain = this.audioContext.createGain()
    this.masterGain.gain.value = 0.3 // Start at 30% volume
    this.masterGain.connect(this.audioContext.destination)
    this.oscillators = []
    this.isPlaying = false
    this.startTime = 0
  }

  // Create atmospheric ambient pad
  createAmbientPad() {
    const now = this.audioContext.currentTime
    const notes = [220, 330, 440, 550] // A3, E4, A4, C#5
    
    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      
      osc.type = 'sine'
      osc.frequency.value = freq
      
      // Smooth envelope
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.08, now + 2)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 8)
      
      osc.connect(gain)
      gain.connect(this.masterGain)
      
      osc.start(now)
      osc.stop(now + 8)
      
      this.oscillators.push({ osc, gain })
    })
  }

  // Create bass line pattern
  createBassLine() {
    const now = this.audioContext.currentTime
    const bassPattern = [110, 110, 165, 147] // A2, A2, E2, D2
    
    bassPattern.forEach((freq, idx) => {
      const startTime = now + idx * 1
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      const filter = this.audioContext.createBiquadFilter()
      
      osc.type = 'square'
      osc.frequency.value = freq
      filter.type = 'lowpass'
      filter.frequency.value = 200
      
      gain.gain.setValueAtTime(0.05, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8)
      
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain)
      
      osc.start(startTime)
      osc.stop(startTime + 0.8)
      
      this.oscillators.push({ osc, gain })
    })
  }

  // Create melodic pattern
  createMelody() {
    const now = this.audioContext.currentTime
    const melody = [440, 550, 660, 550, 440, 330, 330, 392] // A4, C#5, E5, C#5, A4, E4, E4, G4
    
    melody.forEach((freq, idx) => {
      const startTime = now + idx * 0.5
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      
      osc.type = 'triangle'
      osc.frequency.value = freq
      
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.04, startTime + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4)
      
      osc.connect(gain)
      gain.connect(this.masterGain)
      
      osc.start(startTime)
      osc.stop(startTime + 0.5)
      
      this.oscillators.push({ osc, gain })
    })
  }

  play() {
    if (this.isPlaying) return
    this.isPlaying = true
    this.startTime = this.audioContext.currentTime
    
    // Create layered music
    this.createAmbientPad()
    this.createBassLine()
    this.createMelody()
    
    // Schedule next pattern in 8 seconds
    setTimeout(() => {
      this.oscillators = []
      this.play()
    }, 8000)
  }

  stop() {
    this.isPlaying = false
    this.oscillators.forEach(({ osc }) => {
      try {
        osc.stop()
      } catch (e) {
        // Already stopped
      }
    })
    this.oscillators = []
  }

  setVolume(value) {
    this.masterGain.gain.value = Math.max(0, Math.min(1, value))
  }
}

// Create procedural neon city skyline texture
const createNeonCitySkyline = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  
  // Dark background
  ctx.fillStyle = '#0a0a15'
  ctx.fillRect(0, 0, 1024, 512)
  
  // Generate random building silhouettes
  let x = 0
  while (x < 1024) {
    const buildingWidth = 40 + Math.random() * 100
    const buildingHeight = 150 + Math.random() * 300
    const buildingColor = ['#ff1493', '#00ffff', '#ffff00', '#00ff00', '#ff00ff', '#ff6b35'][Math.floor(Math.random() * 6)]
    
    // Building outline (neon glow effect)
    ctx.strokeStyle = buildingColor
    ctx.lineWidth = 2
    ctx.strokeRect(x, 512 - buildingHeight, buildingWidth, buildingHeight)
    
    // Building with slight transparency tint
    ctx.fillStyle = buildingColor
    ctx.globalAlpha = 0.2
    ctx.fillRect(x, 512 - buildingHeight, buildingWidth, buildingHeight)
    ctx.globalAlpha = 1
    
    // Windows (neon lights)
    for (let wy = 512 - buildingHeight + 20; wy < 512; wy += 25) {
      for (let wx = x + 8; wx < x + buildingWidth; wx += 18) {
        if (Math.random() > 0.3) {
          const windowColor = ['#ff1493', '#00ffff', '#ffff00', '#00ff00'][Math.floor(Math.random() * 4)]
          ctx.fillStyle = windowColor
          ctx.globalAlpha = 0.7 + Math.random() * 0.3
          ctx.fillRect(wx, wy, 8, 10)
          ctx.globalAlpha = 1
        }
      }
    }
    
    x += buildingWidth + 5
  }
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearFilter
  return texture
}

// Snow effect removed for neon city reskin (kept out for performance)

// Create CivicWatch LCD screen texture with animated display
const createCivicWatchScreen = (timeValue) => {
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 600
  const ctx = canvas.getContext('2d')
  
  // LCD background
  ctx.fillStyle = '#001a33'
  ctx.fillRect(0, 0, 800, 600)
  
  // Border glow
  ctx.strokeStyle = '#00ffff'
  ctx.lineWidth = 3
  ctx.strokeRect(5, 5, 790, 590)
  
  // Grid pattern
  for (let x = 0; x < 800; x += 20) {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 600)
    ctx.stroke()
  }
  for (let y = 0; y < 600; y += 20) {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(800, y)
    ctx.stroke()
  }
  
  // Title
  ctx.fillStyle = '#00ffff'
  ctx.font = 'bold 80px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('CIVICWATCH', 400, 100)
  
  // Subtitle
  ctx.fillStyle = '#ffff00'
  ctx.font = '32px Arial'
  ctx.fillText('Real-World Civic Engagement', 400, 150)
  
  // Live stats
  ctx.fillStyle = '#00ff00'
  ctx.font = 'bold 28px Courier'
  ctx.textAlign = 'left'
  ctx.fillText(`ACTIVE PLAYERS: ${Math.floor(Math.random() * 500)}`, 50, 250)
  ctx.fillText(`CIVIC ACTS: ${Math.floor(Math.random() * 10000)}`, 50, 300)
  ctx.fillText(`VOTES CAST: ${Math.floor(Math.random() * 50000)}`, 50, 350)
  
  // Animated scan lines
  ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)'
  ctx.lineWidth = 2
  const scanY = (Math.sin(timeValue * 3) + 1) * 300
  ctx.beginPath()
  ctx.moveTo(0, scanY)
  ctx.lineTo(800, scanY)
  ctx.stroke()
  
  // Bottom info
  ctx.fillStyle = '#ff6b9d'
  ctx.font = '20px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Access from The Foyer | Real-World Governance Platform', 400, 550)
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearFilter
  return texture
}

// Create character skin texture
const createCharacterSkin = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  
  // Base skin tone
  ctx.fillStyle = '#f4a460'
  ctx.fillRect(0, 0, 256, 256)
  
  // Subtle skin texture
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 256
    const y = Math.random() * 256
    const size = Math.random() * 2
    ctx.fillStyle = `rgba(139, 69, 19, ${Math.random() * 0.1})`
    ctx.fillRect(x, y, size, size)
  }
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearFilter
  return texture
}

// Create armor/clothing texture
const createArmorTexture = (color = '#ff1493') => {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  
  // Base color
  const rgb = parseInt(color.slice(1), 16)
  const r = (rgb >> 16) & 255
  const g = (rgb >> 8) & 255
  const b = rgb & 255
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 256, 256)
  
  // Fabric weave pattern
  for (let y = 0; y < 256; y += 4) {
    for (let x = 0; x < 256; x += 4) {
      if ((x + y) % 8 === 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + Math.random() * 0.1})`
        ctx.fillRect(x, y, 2, 2)
      }
    }
  }
  
  // Shine/highlights
  ctx.fillStyle = `rgba(255, 255, 255, ${0.15})`
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 256
    const y = Math.random() * 256
    ctx.fillRect(x, y, 3, 1)
  }
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearFilter
  return texture
}

// Create a canvas for drawing sparklines/stats
const createStatsCanvas = (w = 256, h = 128) => {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  // initial background
  ctx.fillStyle = 'rgba(10,10,20,0.9)'
  ctx.fillRect(0, 0, w, h)
  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return { canvas, ctx, texture }
}

const PlayerController = ({ onStateChange, onAttack, playerId }) => {
  const [playerPos, setPlayerPos] = useState([0, 0, 0])
  const [playerRot, setPlayerRot] = useState(0)
  const [isMoving, setIsMoving] = useState(false)
  const [health, setHealth] = useState(100)
  const keysPressed = useRef({})
  const { camera } = useThree()
  const lastAttackTime = useRef(0)

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase()
      keysPressed.current[key] = true
      if (key === ' ') {
        const now = Date.now()
        if (now - lastAttackTime.current > 500) {
          onAttack({ playerId, position: playerPos, rotation: playerRot, timestamp: now })
          lastAttackTime.current = now
        }
      }
    }
    const handleKeyUp = (e) => {
      keysPressed.current[e.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [playerPos, playerRot, playerId, onAttack])

  useFrame(() => {
    const speed = 0.2
    let dx = 0, dz = 0
    if (keysPressed.current['w'] || keysPressed.current['arrowup']) dz -= speed
    if (keysPressed.current['s'] || keysPressed.current['arrowdown']) dz += speed
    if (keysPressed.current['a'] || keysPressed.current['arrowleft']) dx -= speed
    if (keysPressed.current['d'] || keysPressed.current['arrowright']) dx += speed

    if (dx !== 0 || dz !== 0) {
      const angle = Math.atan2(dx, dz)
      setPlayerRot(angle)
      setPlayerPos(p => {
        const np = [p[0] + dx, p[1], p[2] + dz]
        np[0] = Math.max(-150, Math.min(150, np[0]))
        np[2] = Math.max(-150, Math.min(150, np[2]))
        return np
      })
      setIsMoving(true)
    } else {
      setIsMoving(false)
    }

    camera.position.x = playerPos[0]
    camera.position.y = playerPos[1] + 2.5
    camera.position.z = playerPos[2] + 6
    camera.lookAt(playerPos[0], playerPos[1] + 0.8, playerPos[2])

    onStateChange({ playerPos, playerRot, isMoving, health, playerId })
  })

  return null
}

// Anime vibrant digital city colors
const ANIME = {
  sakuraPink: '#ff6b9d',
  skyBlue: '#87ceeb',
  deepBlue: '#0a3d62',
  vibrantPurple: '#d4a5ff',
  goldYellow: '#ffd700',
  limeGreen: '#39ff14',
  hotPink: '#ff10f0',
  brightCyan: '#00f0ff',
  sunsetOrange: '#ff6b35',
  lavender: '#e6ccff',
  brightRed: '#ff1744',
  aquaMarine: '#7fffd4',
}

// Generate canvas texture for Ghibli-style surfaces
const createCanvasTexture = (pattern, baseColor, accentColor) => {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  
  if (pattern === 'wood') {
    // Wooden planks with grain
    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = `rgba(0, 0, 0, ${0.05 + Math.random() * 0.05})`
      ctx.fillRect(0, i * 32, 256, 2)
      // Grain lines
      for (let j = 0; j < 256; j += 20) {
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.03 + Math.random() * 0.04})`
        ctx.beginPath()
        ctx.moveTo(j, i * 32)
        ctx.lineTo(j + 15 + Math.sin(i * 0.5) * 5, i * 32 + 32)
        ctx.stroke()
      }
    }
  } else if (pattern === 'brick') {
    // Brick wall texture
    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, 256, 256)
    ctx.strokeStyle = accentColor
    ctx.lineWidth = 1.5
    for (let y = 0; y < 256; y += 32) {
      for (let x = 0; x < 256; x += 40) {
        ctx.strokeRect(x + (y % 64) / 2, y, 40, 32)
        // Weathering
        if (Math.random() > 0.7) {
          ctx.fillStyle = `rgba(0, 0, 0, ${0.08})`
          ctx.fillRect(x + (y % 64) / 2, y, 40, 32)
        }
      }
    }
  } else if (pattern === 'stucco') {
    // Stucco/plaster with paint texture
    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 256
      const y = Math.random() * 256
      const radius = Math.random() * 3
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.2})`
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (pattern === 'cobblestone') {
    // Cobblestone street
    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, 256, 256)
    ctx.strokeStyle = accentColor
    ctx.lineWidth = 1
    for (let y = 0; y < 256; y += 24) {
      for (let x = 0; x < 256; x += 24) {
        ctx.strokeRect(x, y, 24, 24)
        ctx.fillStyle = `rgba(0, 0, 0, ${0.05 + Math.random() * 0.08})`
        ctx.fillRect(x + 2, y + 2, 20, 20)
      }
    }
    // Moss/weathering streaks
    for (let i = 0; i < 20; i++) {
      ctx.strokeStyle = `rgba(100, 150, 100, ${0.1})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(Math.random() * 256, 0)
      ctx.lineTo(Math.random() * 256, 256)
      ctx.stroke()
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  return texture
}

export default function CityScene({ onMultiplayerUpdate }) {
  const [playerState, setPlayerState] = useState({ playerPos: [0, 0, 0], playerRot: 0, isMoving: false, health: 100, playerId: 'local' })
  const [otherPlayers, setOtherPlayers] = useState({})
  const [attacks, setAttacks] = useState([])
  const [sysStats, setSysStats] = useState(null)
  const [kills, setKills] = useState(0)
  const [deaths, setDeaths] = useState(0)
  const billboardRef = useRef()
  const time = useRef(0)
  const ws = useRef(null)
  // Histories for sparklines
  const [cpuHistory, setCpuHistory] = useState(() => Array(60).fill(0))
  const [memHistory, setMemHistory] = useState(() => Array(60).fill(0))
  const [gpuHistory, setGpuHistory] = useState(() => Array(60).fill(0))
  // Canvas texture for stats sparklines
  const statsCanvasObj = useMemo(() => createStatsCanvas(256, 128), [])
  const statsTextureRef = useRef(statsCanvasObj.texture)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [historyData, setHistoryData] = useState(null)
  const historyCanvasObj = useMemo(() => createStatsCanvas(512, 256), [])
  const [musicOn, setMusicOn] = useState(false)
  const audioSynthRef = useRef(null)
  
  // Memoize textures and neon cityscape
  const textures = useMemo(() => ({
    woodLight: createCanvasTexture('wood', '#d4a574', '#8b7355'),
    woodDark: createCanvasTexture('wood', '#a0663d', '#6b4423'),
    brick: createCanvasTexture('brick', '#c74a49', '#a0372f'),
    brickLight: createCanvasTexture('brick', '#d4a574', '#b89968'),
    stucco: createCanvasTexture('stucco', '#fef3d0', '#e6d9b0'),
    cobblestone: createCanvasTexture('cobblestone', '#8a8a8a', '#5a5a5a'),
    neonSkyline: createNeonCitySkyline(),
    civicWatchScreen: createCivicWatchScreen(time.current),
    characterSkin: createCharacterSkin(),
    armorPink: createArmorTexture('#ff1493'),
    armorPurple: createArmorTexture('#d4a5ff'),
    armorCyan: createArmorTexture('#00f0ff'),
  }), [time])

  // Connect to multiplayer server
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'
      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        console.log('✓ Connected to multiplayer server')
      }

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          if (message.type === 'player_id') {
            setPlayerState(prev => ({ ...prev, playerId: message.playerId }))
            console.log('Assigned player ID:', message.playerId)
          }

          if (message.type === 'players_update') {
            const updated = {}
            message.players.forEach(p => {
              if (p.id !== playerState.playerId) {
                updated[p.id] = p
              } else {
                // Update own health from server
                setPlayerState(prev => ({
                  ...prev,
                  health: p.health,
                }))
                setKills(p.kills)
                setDeaths(p.deaths)
              }
            })
            setOtherPlayers(updated)
          }
        } catch (err) {
          console.error('WebSocket error:', err)
        }
      }

      ws.current.onerror = (err) => {
        console.error('WebSocket connection error')
      }

      ws.current.onclose = () => {
        console.log('Disconnected, retrying...')
        setTimeout(connectWebSocket, 3000)
      }
    }

    connectWebSocket()
    return () => {
      if (ws.current) ws.current.close()
    }
  }, [playerState.playerId])

  // Poll system stats (backend) every 2s. Fallback to browser info when backend unavailable.
  useEffect(() => {
    let alive = true
    const fetchStats = async () => {
      try {
        const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
        const resp = await fetch(`${base}/api/stats`, { cache: 'no-store' })
        if (!alive) return
        if (resp.ok) {
          const json = await resp.json()
          setSysStats(json)
          return
        }
      } catch (e) {
        // ignore
      }

      // Fallback: use browser-provided stats where possible
      try {
        const mem = navigator.deviceMemory || null
        const perf = performance && performance.memory ? performance.memory : null
        const fallback = {
          cpu: { model: navigator.hardwareConcurrency ? 'Local CPU' : 'Unknown', cores: navigator.hardwareConcurrency || 0, loadavg: [0,0,0] },
          memory: perf ? { total: perf.totalJSHeapSize, free: perf.jsHeapSizeLimit - perf.usedJSHeapSize, used: perf.usedJSHeapSize, usedPercent: Math.round((perf.usedJSHeapSize / perf.totalJSHeapSize) * 100) } : { total: mem ? mem * 1024 * 1024 * 1024 : 0, free: 0, used: 0, usedPercent: 0 },
          uptime: 0,
          platform: navigator.platform,
          arch: navigator.userAgent,
          gpu: { available: false, devices: [] }
        }
        setSysStats(fallback)
      } catch (e) {
        // final fallback
      }
    }

    fetchStats()
    const id = setInterval(fetchStats, 2000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  // Initialize audio synthesizer (lazy) and keyboard interaction for kiosk and music
  useEffect(() => {
    audioSynthRef.current = audioSynthRef.current || new AudioSynthesizer()

    const handleKey = (e) => {
      const key = e.key.toLowerCase()
      if (key === 'm') {
        // Toggle music
        if (!audioSynthRef.current) return
        if (!musicOn) {
          try { audioSynthRef.current.play() } catch (err) {}
          audioSynthRef.current.setVolume(0.3)
          setMusicOn(true)
        } else {
          try { audioSynthRef.current.stop() } catch (err) {}
          setMusicOn(false)
        }
      }

      if (key === 'e') {
        // Interact with kiosk if close enough to kiosk center (0,0,0)
        const pos = playerState.playerPos || [0,0,0]
        const dx = pos[0] - 0
        const dz = pos[2] - 0
        const dist = Math.sqrt(dx*dx + dz*dz)
        if (dist < 8) {
          setShowStatsModal(s => !s)
        }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [musicOn, playerState])

  // Fetch historical stats when kiosk modal opens
  useEffect(() => {
    if (!showStatsModal) return
    let alive = true
    const fetchHistory = async () => {
      try {
        const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
        const resp = await fetch(`${base}/api/stats/history?limit=600`, { cache: 'no-store' })
        if (!alive) return
        if (resp.ok) {
          const json = await resp.json()
          setHistoryData(json)

          // Draw a simple historical CPU chart onto the larger history canvas
          try {
            const { canvas, ctx, texture } = historyCanvasObj
            const w = canvas.width
            const h = canvas.height
            ctx.clearRect(0, 0, w, h)
            ctx.fillStyle = 'rgba(6,10,18,0.98)'
            ctx.fillRect(0, 0, w, h)
            ctx.fillStyle = '#88f0ff'
            ctx.font = '18px monospace'
            ctx.fillText('SYSTEM STATS HISTORY (CPU % over time)', 12, 26)

            const cpuPercents = json.map(e => {
              try {
                const s = e.stats
                const cpuPercent = s && s.cpu && s.cpu.loadavg && s.cpu.cores ? Math.min(100, (s.cpu.loadavg[0] / s.cpu.cores) * 100) : 0
                return cpuPercent
              } catch (e) { return 0 }
            })

            // draw axis & sparkline
            const margin = 40
            const plotW = w - margin * 2
            const plotH = h - margin * 2
            ctx.strokeStyle = 'rgba(255,255,255,0.08)'
            ctx.lineWidth = 1
            ctx.strokeRect(margin, margin, plotW, plotH)

            ctx.beginPath()
            for (let i = 0; i < cpuPercents.length; i++) {
              const vx = margin + (i / Math.max(1, cpuPercents.length - 1)) * plotW
              const vy = margin + plotH - (cpuPercents[i] / 100) * plotH
              if (i === 0) ctx.moveTo(vx, vy)
              else ctx.lineTo(vx, vy)
            }
            ctx.strokeStyle = '#ff6b9d'
            ctx.lineWidth = 2
            ctx.stroke()

            texture.needsUpdate = true
          } catch (e) {
            // ignore drawing errors
          }
        }
      } catch (e) {
        // ignore
      }
    }

    fetchHistory()
    return () => { alive = false }
  }, [showStatsModal, historyCanvasObj])

  // Update history arrays and draw sparklines when sysStats changes
  useEffect(() => {
    if (!sysStats) return
    const cpuPercent = sysStats.cpu && sysStats.cpu.loadavg && sysStats.cpu.cores ? Math.min(100, (sysStats.cpu.loadavg[0] / sysStats.cpu.cores) * 100) : 0
    const memPercent = sysStats.memory && sysStats.memory.usedPercent ? Math.min(100, sysStats.memory.usedPercent) : 0
    const gpuPercent = (sysStats.gpu && sysStats.gpu.available && sysStats.gpu.devices[0]) ? Math.min(100, sysStats.gpu.devices[0].utilization) : 0

    setCpuHistory(prev => { const next = prev.slice(); next.push(cpuPercent); if (next.length > 120) next.shift(); return next })
    setMemHistory(prev => { const next = prev.slice(); next.push(memPercent); if (next.length > 120) next.shift(); return next })
    setGpuHistory(prev => { const next = prev.slice(); next.push(gpuPercent); if (next.length > 120) next.shift(); return next })

    // Draw to canvas
    try {
      const { canvas, ctx, texture } = statsCanvasObj
      const w = canvas.width
      const h = canvas.height
      // background
      ctx.clearRect(0,0,w,h)
      ctx.fillStyle = 'rgba(6,10,18,0.95)'
      ctx.fillRect(0,0,w,h)

      // draw labels
      ctx.fillStyle = '#88f0ff'
      ctx.font = '14px monospace'
      ctx.fillText(`CPU ${cpuPercent.toFixed(0)}%`, 8, 18)
      ctx.fillText(`RAM ${memPercent.toFixed(0)}%`, 8, 36)
      ctx.fillText(`GPU ${gpuPercent.toFixed(0)}%`, 8, 54)

      // helper to draw sparkline
      const drawSpark = (data, x, y, warea, harea, color) => {
        const len = data.length
        ctx.beginPath()
        for (let i = 0; i < len; i++) {
          const vx = x + (i / Math.max(1, len-1)) * warea
          const vy = y + harea - (data[i] / 100) * harea
          if (i === 0) ctx.moveTo(vx, vy)
          else ctx.lineTo(vx, vy)
        }
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.stroke()
      }

      drawSpark(cpuHistory.slice(-60), 8, 60, w-16, 24, '#ff6b9d')
      drawSpark(memHistory.slice(-60), 8, 88, w-16, 24, '#ffd700')
      drawSpark(gpuHistory.slice(-60), 8, 116, w-16, 12, '#00ffff')

      texture.needsUpdate = true
    } catch (e) {
      // ignore
    }
  }, [sysStats])

  // Send player state to server
  const sendPlayerState = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'player_move',
        position: {
          x: playerState.playerPos[0],
          y: playerState.playerPos[1],
          z: playerState.playerPos[2],
        },
        rotation: {
          x: 0,
          y: playerState.playerRot,
          z: 0,
        },
      }))
    }
  }

  const handleAttack = (attackData) => {
    // Find nearest other player
    let nearestPlayer = null
    let nearestDistance = 5

    Object.values(otherPlayers).forEach(p => {
      if (!p.isAlive) return
      const dx = p.position.x - playerState.playerPos[0]
      const dy = p.position.y - playerState.playerPos[1]
      const dz = p.position.z - playerState.playerPos[2]
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestPlayer = p
      }
    })

    // Send attack to server
    if (nearestPlayer && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'player_attack',
        targetId: nearestPlayer.id,
      }))
    }

    // Local visual feedback
    setAttacks(prev => [...prev.slice(-20), { ...attackData, id: Math.random() }])
    setTimeout(() => setAttacks(prev => prev.filter(a => a.id !== attackData.id)), 300)
  }

  useFrame((state, delta) => {
    time.current += delta
    if (billboardRef.current) billboardRef.current.rotation.y += delta * 0.15
    setAttacks(prev => prev.filter(a => Date.now() - a.timestamp < 300))
    
    // Snow animation removed for neon city reskin (no-op)
    
    sendPlayerState()
    if (onMultiplayerUpdate) onMultiplayerUpdate(playerState)
  })

  return (
    <group>
      <PlayerController onStateChange={setPlayerState} onAttack={handleAttack} playerId={playerState.playerId} />

      {/* Neon city skyline live wallpaper background - far layer */}
      <mesh position={[0, 80, -400]} scale={[600, 300, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={textures.neonSkyline} />
      </mesh>

      {/* Animated neon city skyline - second layer (parallax) */}
      <mesh position={[0, 60, -350]} scale={[500, 200, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={textures.neonSkyline} transparent opacity={0.6} />
      </mesh>

      {/* Dark gradient overlay for depth */}
      <mesh position={[0, 60, -360]}>
        <boxGeometry args={[600, 300, 20]} />
        <meshBasicMaterial 
          color="#000000"
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Neon skyline background (replaces snow) */}
      <mesh position={[0, 60, -300]} rotation={[0, 0, 0]}> 
        <planeGeometry args={[1200, 400]} />
        <meshBasicMaterial map={textures.neonSkyline} toneMapped={false} />
      </mesh>

      {/* Anime vibrant gradient sky */}
      <mesh position={[0, 30, 0]} scale={200}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={ANIME.skyBlue} side={THREE.BackSide} />
      </mesh>

      {/* Dynamic sky gradient (sunrise/sunset feel) */}
      <mesh position={[0, 50, -100]} scale={[300, 200, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={ANIME.sunsetOrange} transparent opacity={0.3} />
      </mesh>

      {/* Ground - cobblestone street with Ghibli texture */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial 
          map={textures.cobblestone}
          color="#9a9a9a"
          metalness={0.1}
          roughness={0.9}
          fog={true}
        />
      </mesh>

      {/* Atmospheric fog (Ghibli style soft feeling) */}
      <fog attach="fog" args={['#87ceeb', 50, 300]} />

      {/* Glowing grid lines - anime style (vibrant) */}
      {useMemo(() => {
        const lines = []
        for (let i = -150; i <= 150; i += 20) {
          lines.push(
            <line key={`x-${i}`} position={[i, 0.02, 0]}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={2} array={new Float32Array([-150, 0, 0, 150, 0, 0])} itemSize={3} />
              </bufferGeometry>
              <lineBasicMaterial color={ANIME.brightCyan} linewidth={2} fog={false} />
            </line>,
            <line key={`z-${i}`} position={[0, 0.02, i]}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={2} array={new Float32Array([0, 0, -150, 0, 0, 150])} itemSize={3} />
              </bufferGeometry>
              <lineBasicMaterial color={ANIME.aquaMarine} linewidth={2} fog={false} />
            </line>
          )
        }
        return lines
      }, [])}

      {/* Anime lantern street lights */}
      {useMemo(() => {
        const lights = []
        const positions = [
          [-100, 0, -100], [-100, 0, 0], [-100, 0, 100],
          [0, 0, -100], [0, 0, 100],
          [100, 0, -100], [100, 0, 0], [100, 0, 100],
          [50, 0, 50],
        ]
        positions.forEach((pos, idx) => {
          const lightColor = [ANIME.sakuraPink, ANIME.goldYellow, ANIME.vibrantPurple, ANIME.limeGreen][idx % 4]
          lights.push(
            <group key={`light-${idx}`} position={pos}>
              {/* Lantern pole with weathered wood texture */}
              <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.25, 0.3, 1, 8]} />
                <meshStandardMaterial 
                  map={textures.woodDark}
                  color="#6b4423"
                  metalness={0.1}
                  roughness={0.8}
                />
              </mesh>
              {/* Lantern base metal ring */}
              <mesh position={[0, 1.3, 0]}>
                <cylinderGeometry args={[0.5, 0.45, 0.15, 8]} />
                <meshStandardMaterial color="#8b7355" metalness={0.6} roughness={0.3} />
              </mesh>
              {/* Lantern bulb with glow */}
              <mesh position={[0, 1.5, 0]} castShadow>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshStandardMaterial color={lightColor} emissive={lightColor} emissiveIntensity={3} metalness={0.2} roughness={0.4} />
              </mesh>
              {/* Lantern paper shade (paper texture effect) */}
              <mesh position={[0, 1.5, 0]}>
                <sphereGeometry args={[0.42, 16, 16]} />
                <meshStandardMaterial 
                  color="#fefaf0"
                  transparent={true}
                  opacity={0.3}
                  emissive={lightColor}
                  emissiveIntensity={2}
                  side={THREE.BackSide}
                />
              </mesh>
              <pointLight position={[0, 1.5, 0]} intensity={2.5} distance={70} color={lightColor} castShadow />
            </group>
          )
        })
        return lights
      }, [])}

      {/* Vibrant anime buildings with Ghibli textures */}
      {[
        { pos: [-50, 0, -60], scale: [30, 45, 25], color: ANIME.hotPink, outline: ANIME.brightRed, windows: ANIME.goldYellow, texture: textures.stucco, texColor: '#fef3d0' },
        { pos: [50, 0, -60], scale: [35, 55, 28], color: ANIME.vibrantPurple, outline: ANIME.lavender, windows: ANIME.brightCyan, texture: textures.brick, texColor: '#c74a49' },
        { pos: [-60, 0, 30], scale: [28, 42, 32], color: ANIME.aquaMarine, outline: ANIME.brightCyan, windows: ANIME.sakuraPink, texture: textures.woodDark, texColor: '#8a6b4a' },
        { pos: [60, 0, 30], scale: [32, 50, 26], color: ANIME.limeGreen, outline: ANIME.goldYellow, windows: ANIME.hotPink, texture: textures.brickLight, texColor: '#d4a574' },
        { pos: [-30, 0, -40], scale: [25, 35, 30], color: ANIME.skyBlue, outline: ANIME.deepBlue, windows: ANIME.sunsetOrange, texture: textures.woodLight, texColor: '#d4a574' },
        { pos: [30, 0, -40], scale: [26, 40, 28], color: ANIME.sunsetOrange, outline: ANIME.hotPink, windows: ANIME.sakuraPink, texture: textures.stucco, texColor: '#fef3d0' },
        { pos: [0, 0, 50], scale: [45, 65, 35], color: ANIME.vibrantPurple, outline: ANIME.lavender, windows: ANIME.brightCyan, texture: textures.brick, texColor: '#a0372f' },
      ].map((bld, i) => (
        <group key={`bld-${i}`} position={[bld.pos[0], 0, bld.pos[2]]}>
          {/* Building body with Ghibli texture */}
          <mesh position={[0, bld.scale[1] / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={bld.scale} />
            <meshStandardMaterial 
              map={bld.texture}
              color={bld.texColor}
              emissive={bld.color} 
              emissiveIntensity={0.25}
              metalness={0.2}
              roughness={0.7}
            />
          </mesh>

          {/* Building roof detail with weathered wood */}
          <mesh position={[0, bld.scale[1] + 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[bld.scale[0] + 2, 1, bld.scale[2] + 2]} />
            <meshStandardMaterial 
              map={textures.woodDark}
              color="#6b4423"
              metalness={0.15}
              roughness={0.8}
            />
          </mesh>

          {/* Side details (weathered corners) */}
          <mesh position={[bld.scale[0] / 2 + 0.3, bld.scale[1] / 2, 0]} castShadow>
            <boxGeometry args={[0.6, bld.scale[1], bld.scale[2]]} />
            <meshStandardMaterial 
              map={bld.texture}
              color={bld.texColor}
              metalness={0.1}
              roughness={0.8}
            />
          </mesh>

          {/* Bold outline edges (anime cel-shading effect) */}
          <lineSegments position={[0, bld.scale[1] / 2, 0]}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" count={24} array={new Float32Array([
                -bld.scale[0]/2, -bld.scale[1]/2, -bld.scale[2]/2, bld.scale[0]/2, -bld.scale[1]/2, -bld.scale[2]/2,
                bld.scale[0]/2, -bld.scale[1]/2, -bld.scale[2]/2, bld.scale[0]/2, bld.scale[1]/2, -bld.scale[2]/2,
                bld.scale[0]/2, bld.scale[1]/2, -bld.scale[2]/2, -bld.scale[0]/2, bld.scale[1]/2, -bld.scale[2]/2,
                -bld.scale[0]/2, bld.scale[1]/2, -bld.scale[2]/2, -bld.scale[0]/2, -bld.scale[1]/2, -bld.scale[2]/2,
              ])} itemSize={3} />
            </bufferGeometry>
            <lineBasicMaterial color={bld.outline} linewidth={3} fog={false} />
          </lineSegments>

          {/* Vibrant animated windows */}
          {Array.from({ length: Math.floor(bld.scale[1] / 4) }).map((_, fy) => (
            Array.from({ length: Math.floor(bld.scale[0] / 4) }).map((_, fx) => {
              const seed = fx + fy * 100 + i * 1000
              const lightOn = Math.sin(time.current * 0.6 + seed) > 0.1
              return (
                <mesh key={`win-${i}-${fx}-${fy}`} position={[(fx - Math.floor(bld.scale[0] / 8)) * 4 + 2, bld.scale[1] / 2 - fy * 4 - 2, bld.scale[2] / 2 + 0.15]} castShadow>
                  <planeGeometry args={[2.5, 2.5]} />
                  <meshStandardMaterial 
                    emissive={lightOn ? bld.windows : '#cccccc'} 
                    emissiveIntensity={lightOn ? 2.5 : 0.3}
                    color={lightOn ? bld.windows : '#e8e8e8'}
                    metalness={0.1}
                    roughness={0.3}
                  />
                </mesh>
              )
            })
          ))}

          {/* Window frames (shadow detail) */}
          {Array.from({ length: Math.floor(bld.scale[1] / 4) }).map((_, fy) => (
            Array.from({ length: Math.floor(bld.scale[0] / 4) }).map((_, fx) => (
              <mesh key={`frame-${i}-${fx}-${fy}`} position={[(fx - Math.floor(bld.scale[0] / 8)) * 4 + 2, bld.scale[1] / 2 - fy * 4 - 2, bld.scale[2] / 2 + 0.2]}>
                <planeGeometry args={[2.8, 2.8]} />
                <meshStandardMaterial 
                  color="#333333"
                  emissive="#000000"
                  emissiveIntensity={0.1}
                />
              </mesh>
            ))
          ))}
        </group>
      ))}

      {/* CivicWatch Giant LCD Screen on Central Building */}
      <group position={[0, 0, 80]}>
        {/* Screen mounting structure - steel frame */}
        <mesh position={[0, 45, 0]} castShadow receiveShadow>
          <boxGeometry args={[55, 45, 3]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* LCD Display - animated */}
        <mesh position={[0, 45, 2]} castShadow receiveShadow>
          <boxGeometry args={[52, 42, 1]} />
          <meshStandardMaterial 
            map={textures.civicWatchScreen}
            emissive="#00ffff"
            emissiveIntensity={1.2}
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>

        {/* Screen glow effect */}
        <pointLight position={[0, 45, 5]} intensity={2.5} distance={100} color="#00ffff" />
        <pointLight position={[0, 45, 3]} intensity={1.5} distance={80} color="#ffff00" />

        {/* Screen frame/bezel */}
        <mesh position={[0, 45, 2.5]}>
          <boxGeometry args={[54, 44, 0.5]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Interactive Kiosk Base - Central tower */}
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[12, 1, 12]} />
          <meshStandardMaterial 
            map={textures.cobblestone}
            color="#7a7a7a"
            metalness={0.2}
            roughness={0.8}
          />
        </mesh>

        {/* Kiosk central column */}
        <mesh position={[0, 4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[3, 3.5, 8, 8]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Kiosk display panel */}
        <mesh position={[0, 9, 0]} castShadow receiveShadow>
          <boxGeometry args={[8, 6, 0.5]} />
          <meshStandardMaterial 
            color="#001a33"
            metalness={0.4}
            roughness={0.5}
            emissive="#00ff00"
            emissiveIntensity={0.4}
          />
        </mesh>

        {/* Kiosk interactive screen glow */}
        <pointLight position={[0, 9, 1]} intensity={1.5} distance={40} color="#00ff00" />

        {/* Kiosk text/interface */}
        <Text position={[0, 10, 0.5]} fontSize={2} color="#00ff00" fontWeight="bold">
          CIVICWATCH
        </Text>
        <Text position={[0, 8.5, 0.5]} fontSize={1.2} color="#ffff00">
          TAP TO INTERACT
        </Text>

        {/* Kiosk buttons - glowing interactive points */}
        {Array.from({ length: 4 }).map((_, i) => {
          const angle = (i / 4) * Math.PI * 2
          const x = Math.cos(angle) * 4
          const z = Math.sin(angle) * 4
          return (
            <group key={`kiosk-btn-${i}`} position={[x, 5.5, z]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.8, 0.8, 0.3, 16]} />
                <meshStandardMaterial 
                  color={['#ff1493', '#00ffff', '#ffff00', '#00ff00'][i]}
                  emissive={['#ff1493', '#00ffff', '#ffff00', '#00ff00'][i]}
                  emissiveIntensity={2}
                  metalness={0.8}
                />
              </mesh>
              <pointLight position={[0, 0.5, 0]} intensity={2} distance={20} color={['#ff1493', '#00ffff', '#ffff00', '#00ff00'][i]} />
            </group>
          )
        })}

        {/* Information plaque */}
        <Text position={[0, 0.2, 6.5]} fontSize={1.5} color="#00ffff">
          CIVICWATCH KIOSK
        </Text>
        <Text position={[0, -0.3, 6.5]} fontSize={0.8} color="#ffff00">
          Real-World Governance Access Point
        </Text>
      </group>

      {/* Kiosk modal / history overlay (appears when player presses E near kiosk) */}
      {showStatsModal && (
        <group position={[0, 11, 6]}>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[10, 5]} />
            <meshStandardMaterial map={historyCanvasObj.texture} emissive="#002233" emissiveIntensity={0.6} side={THREE.DoubleSide} />
          </mesh>
          <Text position={[0, 2.6, 0.1]} fontSize={0.8} color="#00ffff">HISTORY (press E to close)</Text>
        </group>
      )}

      {/* Holographic anime billboard */}
      <group ref={billboardRef} position={[0, 22, -85]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[40, 24, 2]} />
          <meshStandardMaterial emissive={ANIME.brightCyan} emissiveIntensity={2.5} color={ANIME.aquaMarine} metalness={0.5} />
        </mesh>
        <pointLight position={[0, 0, 2]} intensity={3} distance={80} color={ANIME.brightCyan} />
        <Text position={[0, 6, 1]} fontSize={5} color={ANIME.hotPink} fontWeight="bold">
          CVT ¥{Math.floor(Math.random() * 10000)}
        </Text>
        <Text position={[0, -2, 1]} fontSize={4} color={ANIME.goldYellow}>
          PXL ¥{Math.floor(Math.random() * 5000)}
        </Text>
      </group>

      {/* Cherry blossom particles (anime effect) */}
      {useMemo(() => {
        const blossoms = []
        for (let i = 0; i < 50; i++) {
          const x = (Math.random() - 0.5) * 250
          const z = (Math.random() - 0.5) * 250
          const y = 10 + Math.random() * 50
          const scale = 0.15 + Math.random() * 0.3
          blossoms.push(
            <mesh key={`blossom-${i}`} position={[x, y + Math.sin(time.current * 0.3 + i) * 8, z]}>
              <sphereGeometry args={[scale, 8, 8]} />
              <meshStandardMaterial 
                color={ANIME.sakuraPink} 
                emissive={ANIME.sakuraPink} 
                emissiveIntensity={1.5}
              />
            </mesh>
          )
        }
        return blossoms
      }, [])}

      {/* Anime player - vibrant with cell shading feel and detailed textures */}
      <group position={playerState.playerPos}>
        <group rotation={[0, playerState.playerRot, 0]}>
          {/* Body with armor texture */}
          <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[0.5, 0.8, 0.3]} />
            <meshStandardMaterial 
              map={textures.armorPink}
              color={ANIME.hotPink} 
              emissive={ANIME.hotPink} 
              emissiveIntensity={0.8}
              metalness={0.3}
              roughness={0.6}
            />
          </mesh>
          {/* Head with skin texture */}
          <mesh position={[0, 1.8, 0]} castShadow>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial 
              map={textures.characterSkin}
              color={ANIME.goldYellow} 
              emissive={ANIME.goldYellow} 
              emissiveIntensity={0.8}
              metalness={0.1}
              roughness={0.5}
            />
          </mesh>
          {/* Eyes glow */}
          <mesh position={[-0.12, 1.95, 0.3]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#00ffff" emissiveIntensity={2} />
          </mesh>
          <mesh position={[0.12, 1.95, 0.3]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#00ffff" emissiveIntensity={2} />
          </mesh>
          {/* Left arm with texture */}
          <mesh position={[-0.4, 1.4, 0]} rotation={[playerState.isMoving ? Math.sin(time.current * 8) * 0.3 : 0, 0, -0.2]} castShadow>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial 
              map={textures.armorCyan}
              color={ANIME.brightCyan} 
              emissive={ANIME.brightCyan} 
              emissiveIntensity={0.7}
              metalness={0.4}
              roughness={0.5}
            />
          </mesh>
          {/* Right arm with texture */}
          <mesh position={[0.4, 1.4, 0]} rotation={[playerState.isMoving ? -Math.sin(time.current * 8) * 0.3 : 0, 0, 0.2]} castShadow>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial 
              map={textures.armorCyan}
              color={ANIME.brightCyan} 
              emissive={ANIME.brightCyan} 
              emissiveIntensity={0.7}
              metalness={0.4}
              roughness={0.5}
            />
          </mesh>

          {/* Vibrant anime katana with metallic texture */}
          <mesh position={[0.6, 1.5, -0.2]} rotation={[0, 0, -Math.PI / 4]} castShadow>
            <boxGeometry args={[0.15, 1.5, 0.08]} />
            <meshStandardMaterial 
              color={ANIME.limeGreen} 
              emissive={ANIME.limeGreen} 
              emissiveIntensity={2} 
              metalness={0.95}
              roughness={0.1}
            />
          </mesh>
        </group>

        {/* Health bar with texture - anime style */}
        <mesh position={[0, 2.8, 0]}>
          <planeGeometry args={[1, 0.15]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[-0.5 + (playerState.health / 100), 2.8, 0.01]}>
          <planeGeometry args={[(playerState.health / 100), 0.15]} />
          <meshBasicMaterial color={playerState.health > 50 ? ANIME.limeGreen : playerState.health > 25 ? ANIME.goldYellow : ANIME.brightRed} />
        </mesh>

        <Text position={[0, 2.95, 0]} fontSize={0.3} color={ANIME.vibrantPurple}>
          YOU | HP: {playerState.health}
        </Text>
      </group>

      {/* Other players - vibrant anime style */}
      {Object.entries(otherPlayers).map(([playerId, player]) => {
        if (!player.isAlive) return null
        const healthPercent = Math.max(0, Math.min(100, player.health)) / 100
        const playerColors = [
          { body: ANIME.aquaMarine, head: ANIME.vibrantPurple, sword: ANIME.goldYellow },
          { body: ANIME.sakuraPink, head: ANIME.limeGreen, sword: ANIME.brightCyan },
          { body: ANIME.skyBlue, head: ANIME.sunsetOrange, sword: ANIME.hotPink },
        ]
        const colors = playerColors[Math.abs(player.id) % playerColors.length]
        return (
          <group key={playerId} position={[player.position?.x || 0, player.position?.y || 0, player.position?.z || 0]}>
            <group rotation={[0, player.rotation?.y || 0, 0]}>
              <mesh position={[0, 1, 0]} castShadow>
                <boxGeometry args={[0.5, 0.8, 0.3]} />
                <meshStandardMaterial 
                  map={textures.armorPurple}
                  color={colors.body} 
                  emissive={colors.body} 
                  emissiveIntensity={0.8}
                  metalness={0.3}
                  roughness={0.6}
                />
              </mesh>
              <mesh position={[0, 1.8, 0]} castShadow>
                <sphereGeometry args={[0.35, 16, 16]} />
                <meshStandardMaterial 
                  map={textures.characterSkin}
                  color={colors.head} 
                  emissive={colors.head} 
                  emissiveIntensity={0.8}
                  metalness={0.1}
                  roughness={0.5}
                />
              </mesh>
              {/* Eyes glow for other players */}
              <mesh position={[-0.12, 1.95, 0.3]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshStandardMaterial color="#ffffff" emissive={colors.head} emissiveIntensity={1.5} />
              </mesh>
              <mesh position={[0.12, 1.95, 0.3]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshStandardMaterial color="#ffffff" emissive={colors.head} emissiveIntensity={1.5} />
              </mesh>
              <mesh position={[0.6, 1.5, -0.2]} rotation={[0, 0, -Math.PI / 4]} castShadow>
                <boxGeometry args={[0.15, 1.5, 0.08]} />
                <meshStandardMaterial 
                  color={colors.sword} 
                  emissive={colors.sword} 
                  emissiveIntensity={2} 
                  metalness={0.95}
                  roughness={0.1}
                />
              </mesh>
            </group>
            <mesh position={[0, 2.8, 0]}>
              <planeGeometry args={[1, 0.15]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[-0.5 + healthPercent * 0.5, 2.8, 0.01]}>
              <planeGeometry args={[healthPercent, 0.15]} />
              <meshBasicMaterial color={healthPercent > 0.5 ? ANIME.limeGreen : healthPercent > 0.25 ? ANIME.goldYellow : ANIME.brightRed} />
            </mesh>
            <Text position={[0, 2.95, 0]} fontSize={0.3} color={ANIME.hotPink}>
              P{player.id} | HP: {Math.ceil(player.health)}
            </Text>
          </group>
        )
      })}

      {/* Attack effects - vibrant anime */}
      {attacks.map(attack => (
        <mesh key={attack.id} position={[attack.position[0], attack.position[1] + 1, attack.position[2] - 0.5]}>
          <boxGeometry args={[2, 0.1, 2.5]} />
          <meshBasicMaterial color={ANIME.sakuraPink} transparent opacity={1 - (Date.now() - attack.timestamp) / 300} />
        </mesh>
      ))}

      {/* Vibrant anime fountain with Ghibli details */}
      <group position={[0, 0, 0]}>
        {/* Fountain base ring - stone texture */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[10, 10, 0.5, 16]} />
          <meshStandardMaterial 
            map={textures.cobblestone}
            color="#8a8a8a"
            metalness={0.05}
            roughness={0.95}
          />
        </mesh>
        {/* Fountain inner basin - weathered stone */}
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[9.5, 9.5, 1, 16]} />
          <meshStandardMaterial 
            map={textures.cobblestone}
            color="#7a7a7a"
            metalness={0.08}
            roughness={0.9}
          />
        </mesh>
        {/* Center fountain structure */}
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[2, 2.5, 0.8, 8]} />
          <meshStandardMaterial 
            color={ANIME.skyBlue}
            emissive={ANIME.vibrantPurple}
            emissiveIntensity={1.5}
            metalness={0.3}
            roughness={0.5}
          />
        </mesh>
        <pointLight position={[0, 3, 0]} intensity={2.5} distance={50} color={ANIME.vibrantPurple} castShadow />
        {/* Animated water - enhanced with glow */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2
          const height = 3 + Math.sin(time.current * 4 + i) * 2
          return (
            <mesh key={`water-${i}`} position={[Math.cos(angle) * 8, height, Math.sin(angle) * 8]}>
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshStandardMaterial color={ANIME.aquaMarine} emissive={ANIME.aquaMarine} emissiveIntensity={2.5} />
            </mesh>
          )
        })}
      </group>

      {/* Anime HUD with enhanced styling */}
      {/* HUD background panel */}
      <mesh position={[-75, 18, -45]}>
        <boxGeometry args={[20, 12, 0.5]} />
        <meshStandardMaterial 
          color="#0a0a15"
          emissive="#1a1a2e"
          emissiveIntensity={0.5}
          metalness={0.2}
          roughness={0.8}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* HUD border glow */}
      <lineSegments position={[-75, 18, -44.8]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={8} array={new Float32Array([
            -10, -6, 0, 10, -6, 0,
            10, -6, 0, 10, 6, 0,
          ])} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color={ANIME.hotPink} linewidth={2} />
      </lineSegments>

      <Text position={[-70, 20, -50]} fontSize={3} color={ANIME.hotPink} fontWeight="bold">
        KILLS: {kills}
      </Text>
      <Text position={[-70, 17, -50]} fontSize={2.5} color={ANIME.brightCyan}>
        DEATHS: {deaths}
      </Text>
      <Text position={[-70, 14, -50]} fontSize={2.5} color={ANIME.goldYellow}>
        HP: {Math.ceil(playerState.health)}
      </Text>

      <Text position={[-70, 10, -50]} fontSize={1.8} color={ANIME.limeGreen}>
        WASD:MOVE | SPACE:ATTACK
      </Text>

      {/* System Stats Panel (right HUD) */}
      <group position={[70, 18, -45]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[26, 14, 0.5]} />
          <meshStandardMaterial color="#071228" emissive="#001122" emissiveIntensity={0.6} transparent opacity={0.95} />
        </mesh>

        <Text position={[-10, 5.5, 0.6]} fontSize={1.2} color={ANIME.brightCyan}>SYSTEM</Text>

        {/* CPU */}
        <Text position={[-10, 3.5, 0.6]} fontSize={0.9} color={ANIME.goldYellow}>CPU</Text>
        <mesh position={[6, 3.4, 0.6]}>
          <planeGeometry args={[12, 0.6]} />
          <meshBasicMaterial color="#111827" />
        </mesh>
        {sysStats && (
          <mesh position={[-6 + (Math.min(100, (sysStats.cpu.loadavg ? sysStats.cpu.loadavg[0] : 0) / (sysStats.cpu.cores || 1) * 100) / 2) , 3.4, 0.61]}>
            <planeGeometry args={[Math.max(0.1, Math.min(12, (sysStats.cpu.loadavg ? (sysStats.cpu.loadavg[0] / (sysStats.cpu.cores || 1)) * 12 : 0))), 0.5]} />
            <meshBasicMaterial color={ANIME.hotPink} transparent opacity={0.95} />
          </mesh>
        )}

        {/* Sparkline canvas preview */}
        <mesh position={[0, -3.5, 0.61]}>
          <planeGeometry args={[22, 6]} />
          <meshBasicMaterial map={statsCanvasObj.texture} toneMapped={false} />
        </mesh>

        {/* Memory */}
        <Text position={[-10, 1.8, 0.6]} fontSize={0.9} color={ANIME.goldYellow}>RAM</Text>
        <mesh position={[6, 1.7, 0.6]}>
          <planeGeometry args={[12, 0.6]} />
          <meshBasicMaterial color="#111827" />
        </mesh>
        {sysStats && (
          <mesh position={[-6 + (Math.min(100, sysStats.memory.usedPercent) / 100) * 6, 1.7, 0.61]}>
            <planeGeometry args={[Math.max(0.1, (Math.min(100, sysStats.memory.usedPercent) / 100) * 12), 0.5]} />
            <meshBasicMaterial color={sysStats.memory.usedPercent > 80 ? ANIME.brightRed : sysStats.memory.usedPercent > 50 ? ANIME.goldYellow : ANIME.limeGreen} />
          </mesh>
        )}

        {/* GPU */}
        <Text position={[-10, 0.1, 0.6]} fontSize={0.9} color={ANIME.goldYellow}>GPU</Text>
        <Text position={[-10, -1.1, 0.6]} fontSize={0.7} color={ANIME.brightCyan}>
          {sysStats && sysStats.gpu && sysStats.gpu.available ? `${sysStats.gpu.devices.length} x ${sysStats.gpu.devices[0].name}` : 'No GPU data'}
        </Text>
        {sysStats && sysStats.gpu && sysStats.gpu.available && sysStats.gpu.devices[0] && (
          <mesh position={[6, -1.1, 0.61]}>
            <planeGeometry args={[(Math.min(100, sysStats.gpu.devices[0].utilization) / 100) * 12, 0.5]} />
            <meshBasicMaterial color={sysStats.gpu.devices[0].utilization > 80 ? ANIME.brightRed : ANIME.brightCyan} />
          </mesh>
        )}

        {/* FPS / Network placeholders */}
        <Text position={[-10, -3.0, 0.6]} fontSize={0.8} color={ANIME.hotPink}>FPS: {Math.round(1 / Math.max(0.0001, (time.current || 0.016)) )}</Text>
        <Text position={[-10, -4.2, 0.6]} fontSize={0.7} color={ANIME.brightCyan}>NET: {ws.current && ws.current.readyState === WebSocket.OPEN ? 'ONLINE' : 'OFFLINE'}</Text>
      </group>

      {/* CivicWatch prompt near kiosk */}
      <Text position={[0, 12, 85]} fontSize={1.5} color={ANIME.brightCyan}>
        ⚡ CIVICWATCH ACTIVE ⚡
      </Text>

      {/* Ambient vibrant glow */}
      <mesh position={[0, 25, 0]}>
        <sphereGeometry args={[200, 16, 16]} />
        <meshBasicMaterial wireframe color={ANIME.vibrantPurple} transparent opacity={0.08} />
      </mesh>
    </group>
  )
}
