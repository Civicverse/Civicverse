import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

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

// Neon colors palette (32-bit cyberpunk)
const NEON = {
  pink: '#ff00ff',
  cyan: '#00ffff',
  yellow: '#ffff00',
  green: '#00ff00',
  purple: '#8800ff',
  orange: '#ff8800',
  red: '#ff0044',
  blue: '#0088ff',
  darkCyan: '#002255',
  darkMagenta: '#220044',
}

export default function CityScene({ onMultiplayerUpdate }) {
  const [playerState, setPlayerState] = useState({ playerPos: [0, 0, 0], playerRot: 0, isMoving: false, health: 100, playerId: 'local' })
  const [otherPlayers, setOtherPlayers] = useState({})
  const [attacks, setAttacks] = useState([])
  const [kills, setKills] = useState(0)
  const [deaths, setDeaths] = useState(0)
  const billboardRef = useRef()
  const time = useRef(0)
  const ws = useRef(null)

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
  })

  return (
    <group>
      <PlayerController onStateChange={setPlayerState} onAttack={handleAttack} playerId={playerState.playerId} />

      {/* Neon sky gradient */}
      <mesh position={[0, 30, 0]} scale={200}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={NEON.darkMagenta} side={THREE.BackSide} />
      </mesh>

      {/* Scanline overlay */}
      <mesh position={[0, 0, -100]} scale={[300, 300, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={null} color="#000000" transparent opacity={0.1} />
      </mesh>

      {/* Ground - grid pattern */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#000011" />
      </mesh>

      {/* Neon grid lines - brighter and thicker */}
      {useMemo(() => {
        const lines = []
        for (let i = -150; i <= 150; i += 20) {
          lines.push(
            <line key={`x-${i}`} position={[i, 0.02, 0]}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={2} array={new Float32Array([-150, 0, 0, 150, 0, 0])} itemSize={3} />
              </bufferGeometry>
              <lineBasicMaterial color={NEON.cyan} linewidth={2} fog={false} />
            </line>,
            <line key={`z-${i}`} position={[0, 0.02, i]}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={2} array={new Float32Array([0, 0, -150, 0, 0, 150])} itemSize={3} />
              </bufferGeometry>
              <lineBasicMaterial color={NEON.cyan} linewidth={2} fog={false} />
            </line>
          )
        }
        return lines
      }, [])}

      {/* Neon street lights - huge glow */}
      {useMemo(() => {
        const lights = []
        const positions = [
          [-100, 0, -100], [-100, 0, 0], [-100, 0, 100],
          [0, 0, -100], [0, 0, 100],
          [100, 0, -100], [100, 0, 0], [100, 0, 100],
          [50, 0, 50],
        ]
        positions.forEach((pos, idx) => {
          const neonColor = [NEON.pink, NEON.cyan, NEON.yellow, NEON.purple][idx % 4]
          lights.push(
            <group key={`light-${idx}`} position={pos}>
              <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 1, 8]} />
                <meshStandardMaterial color="#333" />
              </mesh>
              <mesh position={[0, 1.3, 0]}>
                <sphereGeometry args={[0.3, 8, 8]} />
                <meshStandardMaterial color={neonColor} emissive={neonColor} emissiveIntensity={3} />
              </mesh>
              <pointLight position={[0, 1.3, 0]} intensity={3} distance={60} color={neonColor} />
            </group>
          )
        })
        return lights
      }, [])}

      {/* Holographic buildings with neon outlines */}
      {[
        { pos: [-50, 0, -60], scale: [30, 45, 25], color: NEON.pink, neon: NEON.cyan },
        { pos: [50, 0, -60], scale: [35, 55, 28], color: NEON.purple, neon: NEON.yellow },
        { pos: [-60, 0, 30], scale: [28, 42, 32], color: NEON.cyan, neon: NEON.pink },
        { pos: [60, 0, 30], scale: [32, 50, 26], color: NEON.yellow, neon: NEON.green },
        { pos: [-30, 0, -40], scale: [25, 35, 30], color: NEON.green, neon: NEON.orange },
        { pos: [30, 0, -40], scale: [26, 40, 28], color: NEON.orange, neon: NEON.pink },
        { pos: [0, 0, 50], scale: [45, 65, 35], color: NEON.blue, neon: NEON.cyan },
      ].map((bld, i) => (
        <group key={`bld-${i}`} position={[bld.pos[0], 0, bld.pos[2]]}>
          {/* Building body */}
          <mesh position={[0, bld.scale[1] / 2, 0]}>
            <boxGeometry args={bld.scale} />
            <meshStandardMaterial color={bld.color} emissive={bld.color} emissiveIntensity={0.3} metalness={0.7} roughness={0.2} />
          </mesh>

          {/* Animated neon windows */}
          {Array.from({ length: Math.floor(bld.scale[1] / 4) }).map((_, fy) => (
            Array.from({ length: Math.floor(bld.scale[0] / 4) }).map((_, fx) => {
              const seed = fx + fy * 100 + i * 1000
              const lightOn = Math.sin(time.current * 0.5 + seed) > 0.3
              return (
                <mesh key={`win-${i}-${fx}-${fy}`} position={[(fx - Math.floor(bld.scale[0] / 8)) * 4 + 2, bld.scale[1] / 2 - fy * 4 - 2, bld.scale[2] / 2 + 0.1]}>
                  <planeGeometry args={[2.5, 2.5]} />
                  <meshStandardMaterial emissive={lightOn ? bld.neon : '#001122'} emissiveIntensity={lightOn ? 1.5 : 0.1} />
                </mesh>
              )
            })
          ))}
        </group>
      ))}

      {/* Holographic billboard */}
      <group ref={billboardRef} position={[0, 22, -85]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[40, 24, 2]} />
          <meshStandardMaterial emissive={NEON.cyan} emissiveIntensity={2} color="#000011" metalness={0.8} />
        </mesh>
        <pointLight position={[0, 0, 2]} intensity={2} distance={60} color={NEON.cyan} />
        <Text position={[0, 6, 1]} fontSize={5} color={NEON.pink} fontWeight="bold">
          CVT ${Math.floor(Math.random() * 10000)}
        </Text>
        <Text position={[0, -2, 1]} fontSize={4} color={NEON.cyan}>
          PXL ${Math.floor(Math.random() * 5000)}
        </Text>
      </group>

      {/* Player - neon voxel style */}
      <group position={playerState.playerPos}>
        <group rotation={[0, playerState.playerRot, 0]}>
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[0.5, 0.8, 0.3]} />
            <meshStandardMaterial color={NEON.pink} emissive={NEON.pink} emissiveIntensity={1.5} />
          </mesh>
          <mesh position={[0, 1.8, 0]}>
            <sphereGeometry args={[0.35, 8, 8]} />
            <meshStandardMaterial color={NEON.yellow} emissive={NEON.yellow} emissiveIntensity={1.5} />
          </mesh>
          <mesh position={[-0.4, 1.4, 0]} rotation={[playerState.isMoving ? Math.sin(time.current * 8) * 0.3 : 0, 0, -0.2]}>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial color={NEON.cyan} emissive={NEON.cyan} emissiveIntensity={1} />
          </mesh>
          <mesh position={[0.4, 1.4, 0]} rotation={[playerState.isMoving ? -Math.sin(time.current * 8) * 0.3 : 0, 0, 0.2]}>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial color={NEON.cyan} emissive={NEON.cyan} emissiveIntensity={1} />
          </mesh>

          {/* Neon sword */}
          <mesh position={[0.6, 1.5, -0.2]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.15, 1.5, 0.08]} />
            <meshStandardMaterial color={NEON.green} emissive={NEON.green} emissiveIntensity={2.5} metalness={0.9} />
          </mesh>
        </group>

        {/* Health bar - neon style */}
        <mesh position={[0, 2.8, 0]}>
          <planeGeometry args={[1, 0.15]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
        <mesh position={[-0.5 + (playerState.health / 100), 2.8, 0.01]}>
          <planeGeometry args={[(playerState.health / 100), 0.15]} />
          <meshBasicMaterial color={playerState.health > 50 ? NEON.green : playerState.health > 25 ? NEON.yellow : NEON.red} />
        </mesh>

        <Text position={[0, 2.95, 0]} fontSize={0.3} color={NEON.cyan}>
          YOU | HP: {playerState.health}
        </Text>
      </group>

      {/* Other players - neon style */}
      {Object.entries(otherPlayers).map(([playerId, player]) => {
        if (!player.isAlive) return null
        const healthPercent = Math.max(0, Math.min(100, player.health)) / 100
        return (
          <group key={playerId} position={[player.position?.x || 0, player.position?.y || 0, player.position?.z || 0]}>
            <group rotation={[0, player.rotation?.y || 0, 0]}>
              <mesh position={[0, 1, 0]}>
                <boxGeometry args={[0.5, 0.8, 0.3]} />
                <meshStandardMaterial color={NEON.cyan} emissive={NEON.cyan} emissiveIntensity={1.5} />
              </mesh>
              <mesh position={[0, 1.8, 0]}>
                <sphereGeometry args={[0.35, 8, 8]} />
                <meshStandardMaterial color={NEON.green} emissive={NEON.green} emissiveIntensity={1.5} />
              </mesh>
              <mesh position={[0.6, 1.5, -0.2]} rotation={[0, 0, -Math.PI / 4]}>
                <boxGeometry args={[0.15, 1.5, 0.08]} />
                <meshStandardMaterial color={NEON.yellow} emissive={NEON.yellow} emissiveIntensity={2.5} metalness={0.9} />
              </mesh>
            </group>
            <mesh position={[0, 2.8, 0]}>
              <planeGeometry args={[1, 0.15]} />
              <meshBasicMaterial color="#333333" />
            </mesh>
            <mesh position={[-0.5 + healthPercent * 0.5, 2.8, 0.01]}>
              <planeGeometry args={[healthPercent, 0.15]} />
              <meshBasicMaterial color={healthPercent > 0.5 ? NEON.green : healthPercent > 0.25 ? NEON.yellow : NEON.red} />
            </mesh>
            <Text position={[0, 2.95, 0]} fontSize={0.3} color={NEON.pink}>
              P{player.id} | HP: {Math.ceil(player.health)}
            </Text>
          </group>
        )
      })}

      {/* Attack effects - neon glow */}
      {attacks.map(attack => (
        <mesh key={attack.id} position={[attack.position[0], attack.position[1] + 1, attack.position[2] - 0.5]}>
          <boxGeometry args={[2, 0.1, 2.5]} />
          <meshBasicMaterial color={NEON.pink} transparent opacity={1 - (Date.now() - attack.timestamp) / 300} />
        </mesh>
      ))}

      {/* Neon fountain */}
      <group position={[0, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[10, 10, 0.5, 16]} />
          <meshStandardMaterial emissive={NEON.blue} emissiveIntensity={1.5} color="#001144" />
        </mesh>
        <pointLight position={[0, 3, 0]} intensity={2} distance={40} color={NEON.blue} />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          const height = 2 + Math.sin(time.current * 3 + i) * 1
          return (
            <mesh key={`water-${i}`} position={[Math.cos(angle) * 7, height, Math.sin(angle) * 7]}>
              <sphereGeometry args={[0.4, 8, 8]} />
              <meshStandardMaterial color={NEON.cyan} emissive={NEON.cyan} emissiveIntensity={2} />
            </mesh>
          )
        })}
      </group>

      {/* Floating neon particles */}
      {useMemo(() => {
        const particles = []
        for (let i = 0; i < 30; i++) {
          const x = (Math.random() - 0.5) * 200
          const z = (Math.random() - 0.5) * 200
          const y = 5 + Math.random() * 40
          const colors = [NEON.pink, NEON.cyan, NEON.yellow, NEON.purple, NEON.green]
          const color = colors[Math.floor(Math.random() * colors.length)]
          particles.push(
            <mesh key={`particle-${i}`} position={[x, y + Math.sin(time.current * 0.5 + i) * 5, z]}>
              <sphereGeometry args={[0.2, 4, 4]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
            </mesh>
          )
        }
        return particles
      }, [])}

      {/* HUD - neon style */}
      <Text position={[-70, 20, -50]} fontSize={3} color={NEON.pink} fontWeight="bold">
        KILLS: {kills}
      </Text>
      <Text position={[-70, 17, -50]} fontSize={2.5} color={NEON.cyan}>
        DEATHS: {deaths}
      </Text>
      <Text position={[-70, 14, -50]} fontSize={2.5} color={NEON.yellow}>
        HP: {Math.ceil(playerState.health)}
      </Text>

      <Text position={[-70, 10, -50]} fontSize={1.8} color={NEON.green}>
        WASD:MOVE | SPACE:ATTACK
      </Text>

      {/* Ambient neon glow */}
      <mesh position={[0, 25, 0]}>
        <sphereGeometry args={[200, 16, 16]} />
        <meshBasicMaterial wireframe color={NEON.purple} transparent opacity={0.05} />
      </mesh>
    </group>
  )
}
