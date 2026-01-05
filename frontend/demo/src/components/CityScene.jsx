import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import WorldPanel from './WorldPanel'
import CharacterAvatar from './CharacterAvatar'

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

// Sanitize NaNs in BufferGeometry before computeBoundingSphere to prevent warnings/crashes
try {
  const _origCompute = THREE.BufferGeometry.prototype.computeBoundingSphere
  THREE.BufferGeometry.prototype.computeBoundingSphere = function () {
    try {
      const pos = this.attributes && this.attributes.position
      if (pos && pos.array) {
        for (let i = 0; i < pos.array.length; i++) {
          const v = pos.array[i]
          if (!Number.isFinite(v)) pos.array[i] = 0
        }
      }
    } catch (e) {
      console.warn('sanitizing position attribute failed', e)
    }
    try {
      return _origCompute.apply(this, arguments)
    } catch (e) {
      console.warn('computeBoundingSphere failed after sanitize', e)
    }
  }
} catch (e) {
  console.warn('patching computeBoundingSphere failed', e)
}

// Also sanitize computeBoundingBox to catch other NaN sources
try {
  const _origComputeBox = THREE.BufferGeometry.prototype.computeBoundingBox
  THREE.BufferGeometry.prototype.computeBoundingBox = function () {
    try {
      const pos = this.attributes && this.attributes.position
      if (pos && pos.array) {
        for (let i = 0; i < pos.array.length; i++) {
          const v = pos.array[i]
          if (!Number.isFinite(v)) pos.array[i] = 0
        }
      }
    } catch (e) {
      console.warn('sanitizing position attribute for bbox failed', e)
    }
    try {
      return _origComputeBox.apply(this, arguments)
    } catch (e) {
      console.warn('computeBoundingBox failed after sanitize', e)
    }
  }
} catch (e) {
  console.warn('patching computeBoundingBox failed', e)
}

// Patch setAttribute to sanitize position arrays early
try {
  const _origSetAttr = THREE.BufferGeometry.prototype.setAttribute
  THREE.BufferGeometry.prototype.setAttribute = function (name, attribute) {
    try {
      if (name === 'position' && attribute && attribute.array) {
        const a = attribute.array
        for (let i = 0; i < a.length; i++) {
          if (!Number.isFinite(a[i])) a[i] = 0
        }
      }
    } catch (e) {
      // ignore
    }
    return _origSetAttr.apply(this, arguments)
  }
} catch (e) {
  console.warn('patching setAttribute failed', e)
}

// SafeBufferAttribute: sanitizes arrays to remove NaN/undefined before passing to three
function SafeBufferAttribute(props) {
  let arr = props.array
  try {
    if (arr && typeof arr.length === 'number') {
      const a = Array.from(arr).map(v => Number.isFinite(v) ? v : 0)
      arr = new Float32Array(a)
    }
  } catch (e) {
    // fallback: leave as-is
  }
  const newProps = { ...props, array: arr }
  return React.createElement('bufferAttribute', newProps)
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

export default function CityScene({ onMultiplayerUpdate, activeModule, avatarAppearance }) {
  const [playerState, setPlayerState] = useState({ playerPos: [0, 0, 0], playerRot: 0, isMoving: false, health: 100, playerId: 'local' })
  const [otherPlayers, setOtherPlayers] = useState({})
  const [attacks, setAttacks] = useState([])
  const [kills, setKills] = useState(0)
  const [deaths, setDeaths] = useState(0)
  const billboardRef = useRef()
  const time = useRef(0)
  const ws = useRef(null)
  const [suspendCamera, setSuspendCamera] = useState(false)
  const panRef = useRef({ panning: false, start: 0, duration: 1200, fromPos: null, toPos: null, fromLookAt: null, toLookAt: null })
  const wsRetryCount = useRef(0)
  const MAX_WS_RETRIES = 6
  const [wsOffline, setWsOffline] = useState(false)

  // Anchor mapping for menu -> world locations
  const anchors = useMemo(() => ({
    marketplace: { camPos: [12, 8, -8], lookAt: [12, 2, -20], highlight: [12, 0.5, -20] },
    voting: { camPos: [-60, 25, 0], lookAt: [-60, 2, 30], highlight: [-60, 0.5, 30] },
    dex: { camPos: [50, 30, -20], lookAt: [50, 2, -60], highlight: [50, 0.5, -60] },
    wallet: { camPos: [0, 18, 40], lookAt: [0, 2, 50], highlight: [0, 0.5, 50] },
    onboarding: { camPos: [0, 30, 0], lookAt: [0, 2, 0], highlight: [0, 0.5, 0] },
    governance: { camPos: [60, 35, -10], lookAt: [60, 2, -10], highlight: [60, 0.5, -10] },
    ubi: { camPos: [-30, 25, 40], lookAt: [-30, 2, 50], highlight: [-30, 0.5, 50] },
  }), [])

  const [panelOpen, setPanelOpen] = useState(false)
  const [panelTitle, setPanelTitle] = useState(null)

  const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  
  // Memoize textures
  const textures = useMemo(() => ({
    woodLight: createCanvasTexture('wood', '#d4a574', '#8b7355'),
    woodDark: createCanvasTexture('wood', '#a0663d', '#6b4423'),
    brick: createCanvasTexture('brick', '#c74a49', '#a0372f'),
    brickLight: createCanvasTexture('brick', '#d4a574', '#b89968'),
    stucco: createCanvasTexture('stucco', '#fef3d0', '#e6d9b0'),
    cobblestone: createCanvasTexture('cobblestone', '#8a8a8a', '#5a5a5a'),
  }), [])

  // Connect to multiplayer server
  useEffect(() => {
    const connectWebSocket = () => {
      if (wsRetryCount.current >= MAX_WS_RETRIES) {
        console.warn('Max websocket retries reached; not reconnecting')
        setWsOffline(true)
        return
      }
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'
      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        console.log('✓ Connected to multiplayer server')
        setWsOffline(false)
        ws.current._connectedAt = Date.now()
        // if connection stays open for 5s, consider it stable and reset retry counter
        setTimeout(() => {
          try {
            if (ws.current && ws.current.readyState === WebSocket.OPEN && (Date.now() - (ws.current._connectedAt || 0)) > 5000) {
              wsRetryCount.current = 0
            }
          } catch (e) {}
        }, 5000)
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
        console.log('Disconnected from multiplayer server')
        wsRetryCount.current += 1
        if (wsRetryCount.current < MAX_WS_RETRIES) {
          const delay = Math.round(3000 * Math.pow(1.5, wsRetryCount.current - 1))
          console.log(`Retrying websocket in ${delay}ms (attempt ${wsRetryCount.current}/${MAX_WS_RETRIES})`)
          setTimeout(connectWebSocket, delay)
        } else {
          console.warn('WebSocket reconnect attempts exhausted')
          setWsOffline(true)
        }
      }
    }

    connectWebSocket()
    return () => {
      if (ws.current) ws.current.close()
    }
  }, [])

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
    sendPlayerState()
    if (onMultiplayerUpdate) onMultiplayerUpdate(playerState)

    // Camera panning logic (with easing)
    if (panRef.current.panning) {
      const now = performance.now()
      let t = Math.min(1, (now - panRef.current.start) / panRef.current.duration)
      const e = easeInOutQuad(t)
      const from = panRef.current.fromPos
      const to = panRef.current.toPos
      const fromLook = panRef.current.fromLookAt
      const toLook = panRef.current.toLookAt
      state.camera.position.x = from[0] + (to[0] - from[0]) * e
      state.camera.position.y = from[1] + (to[1] - from[1]) * e
      state.camera.position.z = from[2] + (to[2] - from[2]) * e
      const lx = fromLook[0] + (toLook[0] - fromLook[0]) * e
      const ly = fromLook[1] + (toLook[1] - fromLook[1]) * e
      const lz = fromLook[2] + (toLook[2] - fromLook[2]) * e
      state.camera.lookAt(lx, ly, lz)
      if (t >= 1) {
        panRef.current.panning = false
        setSuspendCamera(false)
      }
    }
  })

  // Kick off pan when `activeModule` changes
  useEffect(() => {
    if (!activeModule) return
    const key = activeModule
    const anchor = anchors[key]
    if (!anchor) return
    // start pan to anchor
    panRef.current.panning = true
    panRef.current.start = performance.now()
    panRef.current.duration = 1200
    panRef.current.fromPos = [playerState.playerPos[0], playerState.playerPos[1] + 2.5, playerState.playerPos[2] + 6]
    panRef.current.toPos = anchor.camPos
    panRef.current.fromLookAt = [playerState.playerPos[0], playerState.playerPos[1] + 0.8, playerState.playerPos[2]]
    panRef.current.toLookAt = anchor.lookAt
    setSuspendCamera(true)
    // also open the panel after pan completes
    setTimeout(() => { setPanelOpen(true); setPanelTitle(key) }, panRef.current.duration + 50)
  }, [activeModule])

  const handlePanelOpen = (title) => {
    setPanelOpen(true)
    setPanelTitle(title)
    // ensure camera is focused (if not already panning)
  }

  const panBackToPlayer = () => {
    // start pan back to player camera
    const playerCam = [playerState.playerPos[0], playerState.playerPos[1] + 2.5, playerState.playerPos[2] + 6]
    const playerLook = [playerState.playerPos[0], playerState.playerPos[1] + 0.8, playerState.playerPos[2]]
    panRef.current.panning = true
    panRef.current.start = performance.now()
    panRef.current.duration = 1000
    // capture current camera position via useThree? fallback to last toPos
    const curr = panRef.current.toPos || playerCam
    panRef.current.fromPos = curr
    panRef.current.toPos = playerCam
    panRef.current.fromLookAt = panRef.current.toLookAt || playerLook
    panRef.current.toLookAt = playerLook
    setSuspendCamera(false)
    setPanelOpen(false)
    setPanelTitle(null)
  }

  return (
    <group>
      {wsOffline && (
        <group position={[0, 30, 0]}>
          <Text position={[-20, 0, 0]} fontSize={3} color={'#ffcc66'}>
            Multiplayer offline — limited demo mode
          </Text>
        </group>
      )}
      <PlayerController onStateChange={setPlayerState} onAttack={handleAttack} playerId={playerState.playerId} suspendCamera={suspendCamera} />

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
                <SafeBufferAttribute attach="attributes-position" count={2} array={new Float32Array([-150, 0, 0, 150, 0, 0])} itemSize={3} />
              </bufferGeometry>
              <lineBasicMaterial color={ANIME.brightCyan} linewidth={2} fog={false} />
            </line>,
            <line key={`z-${i}`} position={[0, 0.02, i]}>
              <bufferGeometry>
                <SafeBufferAttribute attach="attributes-position" count={2} array={new Float32Array([0, 0, -150, 0, 0, 150])} itemSize={3} />
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
              <SafeBufferAttribute attach="attributes-position" count={24} array={new Float32Array([
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

      {/* Player avatar (GLB if available, fallback placeholder) */}
      <group position={playerState.playerPos}>
        <CharacterAvatar position={[0,0,0]} rotation={[0, playerState.playerRot, 0]} colors={{ body: ANIME.hotPink, head: ANIME.goldYellow, outfit: ANIME.brightCyan, hair: '#222', sword: ANIME.limeGreen }} outfit={avatarAppearance?.outfit || 0} hair={avatarAppearance?.hair || 0} name={'YOU'} health={playerState.health} />

        {/* Health bar - anime style */}
        <mesh position={[0, 2.8, 0]}>
          <planeGeometry args={[1, 0.15]} />
          <meshBasicMaterial color="#333333" />
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
            <CharacterAvatar position={[0,0,0]} rotation={[0, player.rotation?.y || 0, 0]} colors={colors} name={`P${player.id}`} health={player.health} />

            <mesh position={[0, 2.8, 0]}>
              <planeGeometry args={[1, 0.15]} />
              <meshBasicMaterial color="#333333" />
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

      {/* Anime HUD */}
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

      {/* Ambient vibrant glow */}
      <mesh position={[0, 25, 0]}>
        <sphereGeometry args={[200, 16, 16]} />
        <meshBasicMaterial wireframe color={ANIME.vibrantPurple} transparent opacity={0.08} />
      </mesh>

      {/* Example world-anchored UI panel (Marketplace anchor) */}
      <WorldPanel position={[12, 4, -20]} title={"Marketplace"} onOpen={(t)=>{console.log('Open anchor', t)}} />

      {/* Anchor highlights for active modules */}
      {Object.entries(anchors).map(([k, v]) => (
        <group key={`anchor-${k}`} position={v.highlight}>
          <mesh>
            <torusGeometry args={[1.2, 0.08, 8, 32]} />
            <meshStandardMaterial color={activeModule === k ? '#00ffd0' : '#00444f'} emissive={activeModule === k ? '#00ffd0' : '#002022'} emissiveIntensity={activeModule === k ? 2 : 0.2} transparent opacity={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
