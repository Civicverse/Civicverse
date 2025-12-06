import React, { useState, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'

const PlayerController = ({ onStateChange }) => {
  const [playerPos, setPlayerPos] = useState([0, 0, 0])
  const [playerRot, setPlayerRot] = useState(0)
  const [isMoving, setIsMoving] = useState(false)
  const keysPressed = useRef({})
  const { camera } = useThree()

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key.toLowerCase()] = true
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
  }, [])

  useFrame(() => {
    const speed = 0.15
    let dx = 0, dz = 0
    if (keysPressed.current['w'] || keysPressed.current['arrowup']) dz -= speed
    if (keysPressed.current['s'] || keysPressed.current['arrowdown']) dz += speed
    if (keysPressed.current['a'] || keysPressed.current['arrowleft']) dx -= speed
    if (keysPressed.current['d'] || keysPressed.current['arrowright']) dx += speed

    const moving = dx !== 0 || dz !== 0
    setIsMoving(moving)

    if (moving) {
      const angle = Math.atan2(dx, dz)
      setPlayerRot(angle)
      setPlayerPos(p => [p[0] + dx, p[1], p[2] + dz])
    }

    camera.position.x = playerPos[0]
    camera.position.y = playerPos[1] + 2.5
    camera.position.z = playerPos[2] + 6
    camera.lookAt(playerPos[0], playerPos[1] + 0.8, playerPos[2])

    onStateChange({ playerPos, playerRot, isMoving })
  })

  return null
}

export default function CityScene({ kills = 0 }) {
  const [playerState, setPlayerState] = useState({ playerPos: [0, 0, 0], playerRot: 0, isMoving: false })
  const billboardRef = useRef()

  useFrame((state, delta) => {
    if (billboardRef.current) {
      billboardRef.current.rotation.y += delta * 0.25
    }
  })

  return (
    <group>
      <PlayerController onStateChange={setPlayerState} />

      {/* Sky gradient */}
      <mesh position={[0, 30, 0]} scale={200}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#0a0e1f" side={1} />
      </mesh>

      {/* Ground - city street */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color="#0a0f1a"
          metalness={0.2}
          roughness={0.8}
        />
      </mesh>

      {/* Street grid lines */}
      {Array.from({ length: 21 }).map((_, i) => {
        const pos = (i - 10) * 20
        return (
          <group key={`grid-${i}`}>
            <mesh position={[0, 0.01, pos]}>
              <planeGeometry args={[200, 0.5]} />
              <meshBasicMaterial color="#1a2a4a" />
            </mesh>
            <mesh position={[pos, 0.01, 0]}>
              <planeGeometry args={[0.5, 200]} />
              <meshBasicMaterial color="#1a2a4a" />
            </mesh>
          </group>
        )
      })}

      {/* Street lights */}
      {Array.from({ length: 12 }).map((_, i) => {
        const x = (i % 3 - 1) * 40
        const z = (Math.floor(i / 3) - 2) * 40
        return (
          <group key={`light-${i}`} position={[x, 0, z]}>
            <mesh position={[0, 6, 0]}>
              <boxGeometry args={[0.3, 12, 0.3]} />
              <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 12, 0]}>
              <boxGeometry args={[1.5, 0.8, 1.5]} />
              <meshStandardMaterial
                color="#222"
                emissive="#ffaa00"
                emissiveIntensity={0.8}
              />
            </mesh>
            <pointLight position={[0, 12, 0]} intensity={1.5} color="#ffaa00" distance={40} />
          </group>
        )
      })}

      {/* High-quality buildings */}
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
            <meshStandardMaterial
              color={bld.c1}
              metalness={0.3}
              roughness={0.6}
            />
          </mesh>

          {/* Windows */}
          {Array.from({ length: Math.floor(bld.h / 4) }).map((_, fy) => (
            Array.from({ length: Math.floor(bld.w / 4) }).map((_, fx) => (
              <mesh
                key={`win-${i}-${fx}-${fy}`}
                position={[
                  (fx - Math.floor(bld.w / 8)) * 4 + 2,
                  bld.h / 2 - fy * 4 - 2,
                  bld.d / 2 + 0.1
                ]}
              >
                <planeGeometry args={[2.5, 2.5]} />
                <meshStandardMaterial
                  emissive={Math.random() > 0.5 ? bld.c2 : '#002244'}
                  emissiveIntensity={Math.random() > 0.7 ? 0.8 : 0.2}
                />
              </mesh>
            ))
          ))}

          {/* Roof accent */}
          <mesh position={[0, bld.h + 1, 0]}>
            <boxGeometry args={[bld.w + 2, 0.5, bld.d + 2]} />
            <meshStandardMaterial
              emissive={bld.c2}
              emissiveIntensity={0.5}
              color="#0a0a0a"
            />
          </mesh>
        </group>
      ))}

      {/* Main billboard */}
      <group ref={billboardRef} position={[0, 20, -80]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[35, 20, 2]} />
          <meshStandardMaterial
            emissive="#00ffff"
            emissiveIntensity={0.9}
            color="#000011"
            metalness={0.4}
          />
        </mesh>
        <Text position={[0, 5, 1]} fontSize={3} color="#00ffff">
          KAS ${Math.floor(Math.random() * 1000)}
        </Text>
        <Text position={[0, -5, 1]} fontSize={3} color="#ff0088">
          XMR ${Math.floor(Math.random() * 500)}
        </Text>
      </group>

      {/* Player character with animations */}
      <group position={playerState.playerPos}>
        <group rotation={[0, playerState.playerRot, 0]}>
          {/* Torso */}
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[0.5, 0.8, 0.3]} />
            <meshStandardMaterial
              color="#ff0066"
              metalness={0.1}
              roughness={0.7}
            />
          </mesh>

          {/* Head */}
          <mesh position={[0, 1.8, 0]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial
              color="#f4a460"
              metalness={0}
              roughness={0.8}
            />
          </mesh>

          {/* Left arm with animation */}
          <mesh position={[-0.4, 1.4, 0]} rotation={[playerState.isMoving ? Math.sin(Date.now() * 0.01) * 0.4 : 0, 0, 0]}>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial color="#ff0066" metalness={0.1} />
          </mesh>

          {/* Right arm with animation */}
          <mesh position={[0.4, 1.4, 0]} rotation={[playerState.isMoving ? -Math.sin(Date.now() * 0.01) * 0.4 : 0, 0, 0]}>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial color="#ff0066" metalness={0.1} />
          </mesh>

          {/* Left leg with animation */}
          <mesh position={[-0.2, 0.5, 0]} rotation={[playerState.isMoving ? Math.sin(Date.now() * 0.01) * 0.5 : 0, 0, 0]}>
            <boxGeometry args={[0.2, 0.7, 0.2]} />
            <meshStandardMaterial color="#1a1a3a" metalness={0.2} />
          </mesh>

          {/* Right leg with animation */}
          <mesh position={[0.2, 0.5, 0]} rotation={[playerState.isMoving ? -Math.sin(Date.now() * 0.01) * 0.5 : 0, 0, 0]}>
            <boxGeometry args={[0.2, 0.7, 0.2]} />
            <meshStandardMaterial color="#1a1a3a" metalness={0.2} />
          </mesh>

          {/* Glow aura when moving */}
          {playerState.isMoving && (
            <mesh position={[0, 1, 0]}>
              <sphereGeometry args={[0.8, 8, 8]} />
              <meshBasicMaterial
                color="#ff0066"
                transparent
                opacity={0.2}
              />
            </mesh>
          )}
        </group>

        {/* Name tag */}
        <Text position={[0, 2.5, 0]} fontSize={0.5} color="#00ffff">
          YOU
        </Text>
      </group>

      {/* Kill counter */}
      <Text position={[50, 15, -80]} fontSize={2} color="#00ff88">
        KILLS: {kills}
      </Text>

      {/* Central plaza fountain */}
      <group position={[0, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[8, 8, 0.5, 32]} />
          <meshStandardMaterial
            emissive="#0066ff"
            emissiveIntensity={0.6}
            color="#001a4a"
          />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          return (
            <mesh
              key={`water-${i}`}
              position={[Math.cos(angle) * 6, 1 + Math.sin(Date.now() * 0.005) * 0.5, Math.sin(angle) * 6]}
            >
              <sphereGeometry args={[0.3, 8, 8]} />
              <meshStandardMaterial
                color="#00ffff"
                emissive="#0088ff"
                emissiveIntensity={0.7}
              />
            </mesh>
          )
        })}
      </group>

      {/* Environment ambient glow */}
      <mesh position={[0, 25, 0]}>
        <boxGeometry args={[300, 100, 300]} />
        <meshBasicMaterial
          wireframe
          color="#0066ff"
          transparent
          opacity={0.03}
        />
      </mesh>
    </group>
  )
}
