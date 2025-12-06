import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'

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

export default function CityScene({ kills = 0, onMultiplayerUpdate }) {
  const [playerState, setPlayerState] = useState({ playerPos: [0, 0, 0], playerRot: 0, isMoving: false, health: 100, playerId: 'local' })
  const [otherPlayers, setOtherPlayers] = useState({})
  const [attacks, setAttacks] = useState([])
  const billboardRef = useRef()
  const time = useRef(0)

  const handleAttack = (attackData) => {
    setAttacks(prev => [...prev.slice(-20), { ...attackData, id: Math.random() }])
    setTimeout(() => setAttacks(prev => prev.filter(a => a.id !== attackData.id)), 300)
  }

  useFrame((state, delta) => {
    time.current += delta
    if (billboardRef.current) billboardRef.current.rotation.y += delta * 0.15
    setAttacks(prev => prev.filter(a => Date.now() - a.timestamp < 300))
    if (onMultiplayerUpdate) onMultiplayerUpdate(playerState)
  })

  return (
    <group>
      <PlayerController onStateChange={setPlayerState} onAttack={handleAttack} playerId={playerState.playerId} />

      {/* Sky */}
      <mesh position={[0, 30, 0]} scale={200}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#0a0e1f" side={1} />
      </mesh>

      {/* Ground */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#0a0f1a" metalness={0.15} roughness={0.85} />
      </mesh>

      {/* Street grid - optimized */}
      {Array.from({ length: 16 }).map((_, i) => {
        const pos = (i - 7.5) * 20
        return (
          <group key={`grid-${i}`}>
            <mesh position={[0, 0.01, pos]}>
              <planeGeometry args={[300, 0.4]} />
              <meshBasicMaterial color="#1a2a4a" />
            </mesh>
            <mesh position={[pos, 0.01, 0]}>
              <planeGeometry args={[0.4, 300]} />
              <meshBasicMaterial color="#1a2a4a" />
            </mesh>
          </group>
        )
      })}

      {/* Street lights - optimized count */}
      {Array.from({ length: 9 }).map((_, i) => {
        const x = (i % 3 - 1) * 60
        const z = (Math.floor(i / 3) - 1) * 60
        return (
          <group key={`light-${i}`} position={[x, 0, z]}>
            <mesh position={[0, 6, 0]}>
              <boxGeometry args={[0.3, 12, 0.3]} />
              <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 12, 0]}>
              <boxGeometry args={[1.5, 0.8, 1.5]} />
              <meshStandardMaterial color="#1a1a1a" emissive="#ffaa00" emissiveIntensity={0.7} />
            </mesh>
            <pointLight position={[0, 12, 0]} intensity={1.2} color="#ffaa00" distance={40} />
          </group>
        )
      })}

      {/* Buildings - simplified */}
      {[
        { x: -50, z: -60, w: 30, d: 25, h: 45, c1: '#1a3a6a', c2: '#00ffff' },
        { x: 50, z: -60, w: 35, d: 28, h: 55, c1: '#2a1a3a', c2: '#ff00ff' },
        { x: -60, z: 30, w: 28, d: 32, h: 50, c1: '#1a3a2a', c2: '#00ff88' },
        { x: 60, z: 30, w: 32, d: 26, h: 48, c1: '#3a1a1a', c2: '#ff6600' },
        { x: -30, z: -40, w: 25, d: 30, h: 40, c1: '#1a2a4a', c2: '#0088ff' },
        { x: 30, z: -40, w: 26, d: 28, h: 42, c1: '#2a1a4a', c2: '#ff0088' },
        { x: 0, z: 50, w: 40, d: 35, h: 60, c1: '#1a3a4a', c2: '#00ffff' },
      ].map((bld, i) => (
        <group key={`bld-${i}`} position={[bld.x, 0, bld.z]}>
          <mesh position={[0, bld.h / 2, 0]}>
            <boxGeometry args={[bld.w, bld.h, bld.d]} />
            <meshStandardMaterial color={bld.c1} metalness={0.2} roughness={0.7} />
          </mesh>

          {/* Windows */}
          {Array.from({ length: Math.floor(bld.h / 4) }).map((_, fy) => (
            Array.from({ length: Math.floor(bld.w / 4) }).map((_, fx) => {
              const seed = fx + fy * 100 + i * 1000
              const lightOn = Math.sin(time.current * 0.3 + seed) > 0.2
              return (
                <mesh key={`win-${i}-${fx}-${fy}`} position={[(fx - Math.floor(bld.w / 8)) * 4 + 2, bld.h / 2 - fy * 4 - 2, bld.d / 2 + 0.1]}>
                  <planeGeometry args={[2.5, 2.5]} />
                  <meshStandardMaterial emissive={lightOn ? bld.c2 : '#001133'} emissiveIntensity={lightOn ? 0.6 : 0.05} />
                </mesh>
              )
            })
          ))}

          <mesh position={[0, bld.h + 1, 0]}>
            <boxGeometry args={[bld.w + 2, 0.5, bld.d + 2]} />
            <meshStandardMaterial emissive={bld.c2} emissiveIntensity={0.3} color="#0a0a0a" />
          </mesh>
        </group>
      ))}

      {/* Billboard */}
      <group ref={billboardRef} position={[0, 22, -85]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[36, 22, 2]} />
          <meshStandardMaterial emissive="#00ffff" emissiveIntensity={0.8} color="#000011" />
        </mesh>
        <Text position={[0, 6, 1]} fontSize={4} color="#00ffff" fontWeight="bold">
          CVT ${Math.floor(Math.random() * 1000)}
        </Text>
        <Text position={[0, -2, 1]} fontSize={3.5} color="#ff0088">
          PXL ${Math.floor(Math.random() * 500)}
        </Text>
      </group>

      {/* Player */}
      <group position={playerState.playerPos}>
        <group rotation={[0, playerState.playerRot, 0]}>
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[0.5, 0.8, 0.3]} />
            <meshStandardMaterial color="#ff0066" metalness={0.1} roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.8, 0]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial color="#f4a460" metalness={0.1} />
          </mesh>
          <mesh position={[-0.4, 1.4, 0]} rotation={[playerState.isMoving ? Math.sin(time.current * 8) * 0.3 : 0, 0, -0.2]}>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial color="#ff0066" />
          </mesh>
          <mesh position={[0.4, 1.4, 0]} rotation={[playerState.isMoving ? -Math.sin(time.current * 8) * 0.3 : 0, 0, 0.2]}>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial color="#ff0066" />
          </mesh>
          <mesh position={[-0.2, 0.5, 0]} rotation={[playerState.isMoving ? Math.sin(time.current * 8) * 0.2 : 0, 0, 0]}>
            <boxGeometry args={[0.2, 0.7, 0.2]} />
            <meshStandardMaterial color="#1a1a3a" />
          </mesh>
          <mesh position={[0.2, 0.5, 0]} rotation={[playerState.isMoving ? -Math.sin(time.current * 8) * 0.2 : 0, 0, 0]}>
            <boxGeometry args={[0.2, 0.7, 0.2]} />
            <meshStandardMaterial color="#1a1a3a" />
          </mesh>
          {/* Sword */}
          <mesh position={[0.6, 1.5, -0.2]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.15, 1.5, 0.08]} />
            <meshStandardMaterial color="#ffcc00" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>

        {/* Health bar background */}
        <mesh position={[0, 2.8, 0]}>
          <planeGeometry args={[1, 0.15]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
        {/* Health bar fill */}
        <mesh position={[-0.5 + (playerState.health / 100), 2.8, 0.01]}>
          <planeGeometry args={[(playerState.health / 100), 0.15]} />
          <meshBasicMaterial color={playerState.health > 50 ? '#00ff00' : playerState.health > 25 ? '#ffaa00' : '#ff0000'} />
        </mesh>

        <Text position={[0, 2.95, 0]} fontSize={0.3} color="#00ffff">
          YOU | HP: {playerState.health}
        </Text>
      </group>

      {/* Other players */}
      {Object.entries(otherPlayers).map(([playerId, player]) => (
        <group key={playerId} position={player.position || [0, 0, 0]}>
          <group rotation={[0, player.rotation || 0, 0]}>
            <mesh position={[0, 1, 0]}>
              <boxGeometry args={[0.5, 0.8, 0.3]} />
              <meshStandardMaterial color="#00ff66" metalness={0.1} />
            </mesh>
            <mesh position={[0, 1.8, 0]}>
              <sphereGeometry args={[0.35, 16, 16]} />
              <meshStandardMaterial color="#ffaa44" metalness={0.1} />
            </mesh>
            <mesh position={[0.6, 1.5, -0.2]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.15, 1.5, 0.08]} />
              <meshStandardMaterial color="#ffcc00" metalness={0.8} />
            </mesh>
          </group>
          <mesh position={[0, 2.8, 0]}>
            <planeGeometry args={[1, 0.15]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <mesh position={[player.health ? -0.5 + (player.health / 100) : 0, 2.8, 0.01]}>
            <planeGeometry args={[(player.health || 100) / 100, 0.15]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
          <Text position={[0, 2.95, 0]} fontSize={0.3} color="#00ff88">
            {playerId.substring(0, 6)} | HP: {player.health || 100}
          </Text>
        </group>
      ))}

      {/* Attack effects */}
      {attacks.map(attack => (
        <mesh key={attack.id} position={[attack.position[0], attack.position[1] + 1.5, attack.position[2] - 0.5]}>
          <boxGeometry args={[1.5, 0.1, 2]} />
          <meshBasicMaterial color="#ffff00" transparent opacity={1 - (Date.now() - attack.timestamp) / 300} />
        </mesh>
      ))}

      {/* Fountain - simplified */}
      <group position={[0, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[8, 8, 0.5, 16]} />
          <meshStandardMaterial emissive="#0066ff" emissiveIntensity={0.5} color="#001a4a" />
        </mesh>
        {Array.from({ length: 4 }).map((_, i) => {
          const angle = (i / 4) * Math.PI * 2
          const height = 1 + Math.sin(time.current * 2 + i) * 0.5
          return (
            <mesh key={`water-${i}`} position={[Math.cos(angle) * 6, height, Math.sin(angle) * 6]}>
              <sphereGeometry args={[0.3, 8, 8]} />
              <meshStandardMaterial color="#00ffff" emissive="#0088ff" emissiveIntensity={0.6} />
            </mesh>
          )
        })}
      </group>

      {/* Score */}
      <Text position={[-80, 18, -70]} fontSize={2.5} color="#00ff88">
        KILLS: {kills}
      </Text>

      {/* Ambient glow */}
      <mesh position={[0, 25, 0]}>
        <boxGeometry args={[400, 150, 400]} />
        <meshBasicMaterial wireframe color="#0066ff" transparent opacity={0.02} />
      </mesh>
    </group>
  )
}
