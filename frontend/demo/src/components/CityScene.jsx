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
  const particlesRef = useRef([])
  const time = useRef(0)

  useFrame((state, delta) => {
    time.current += delta
    
    if (billboardRef.current) {
      billboardRef.current.rotation.y += delta * 0.25
    }
  })

  return (
    <group>
      <PlayerController onStateChange={setPlayerState} />

      {/* Animated sky with gradient */}
      <mesh position={[0, 30, 0]} scale={200}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color="#0a0e1f" side={1} />
      </mesh>

      {/* Sky stars/particles */}
      {Array.from({ length: 100 }).map((_, i) => (
        <mesh key={`star-${i}`} position={[
          (Math.random() - 0.5) * 300,
          (Math.random() - 0.5) * 200 + 40,
          (Math.random() - 0.5) * 300
        ]}>
          <sphereGeometry args={[0.1, 4, 4]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Ground - city street with texture effect */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial
          color="#0a0f1a"
          metalness={0.2}
          roughness={0.8}
        />
      </mesh>

      {/* Animated street grid lines */}
      {Array.from({ length: 31 }).map((_, i) => {
        const pos = (i - 15) * 20
        const pulse = Math.sin(time.current * 2 + i) * 0.3
        return (
          <group key={`grid-${i}`}>
            <mesh position={[0, 0.01, pos]}>
              <planeGeometry args={[300, 0.5]} />
              <meshBasicMaterial color={`rgb(${26 + pulse * 20}, ${42 + pulse * 20}, ${74 + pulse * 30})`} />
            </mesh>
            <mesh position={[pos, 0.01, 0]}>
              <planeGeometry args={[0.5, 300]} />
              <meshBasicMaterial color={`rgb(${26 + pulse * 20}, ${42 + pulse * 20}, ${74 + pulse * 30})`} />
            </mesh>
          </group>
        )
      })}

      {/* Grid intersections with glow */}
      {Array.from({ length: 31 }).map((_, i) =>
        Array.from({ length: 31 }).map((_, j) => {
          const x = (i - 15) * 20
          const z = (j - 15) * 20
          const pulse = Math.sin(time.current + i + j * 0.5) * 0.5
          return (
            <mesh key={`intersection-${i}-${j}`} position={[x, 0.02, z]}>
              <circleGeometry args={[0.3 + pulse * 0.1, 8]} />
              <meshBasicMaterial color="#00ffff" transparent opacity={0.4 + pulse * 0.2} />
            </mesh>
          )
        })
      )}

      {/* Street lights - enhanced */}
      {Array.from({ length: 16 }).map((_, i) => {
        const x = (i % 4 - 1.5) * 50
        const z = (Math.floor(i / 4) - 1.5) * 50
        const pulse = Math.sin(time.current * 3 + i) * 0.2
        return (
          <group key={`light-${i}`} position={[x, 0, z]}>
            {/* Pole */}
            <mesh position={[0, 6, 0]}>
              <boxGeometry args={[0.3, 12, 0.3]} />
              <meshStandardMaterial 
                color="#222" 
                metalness={0.8} 
                roughness={0.2}
                emissive="#333333"
              />
            </mesh>
            
            {/* Light fixture */}
            <mesh position={[0, 12, 0]}>
              <boxGeometry args={[1.5, 0.8, 1.5]} />
              <meshStandardMaterial
                color="#1a1a1a"
                emissive="#ffaa00"
                emissiveIntensity={0.8 + pulse}
              />
            </mesh>
            
            {/* Light emission */}
            <pointLight 
              position={[0, 12, 0]} 
              intensity={1.5 + pulse * 0.5} 
              color="#ffaa00" 
              distance={45}
            />

            {/* Glow effect */}
            <mesh position={[0, 12, 0]}>
              <sphereGeometry args={[2, 8, 8]} />
              <meshBasicMaterial 
                color="#ffaa00" 
                transparent 
                opacity={0.1 + pulse * 0.05}
              />
            </mesh>
          </group>
        )
      })}

      {/* Enhanced buildings with more detail */}
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
          {/* Main building structure */}
          <mesh position={[0, bld.h / 2, 0]}>
            <boxGeometry args={[bld.w, bld.h, bld.d]} />
            <meshStandardMaterial
              color={bld.c1}
              metalness={0.3}
              roughness={0.6}
            />
          </mesh>

          {/* Animated Windows - Front */}
          {Array.from({ length: Math.floor(bld.h / 4) }).map((_, fy) => (
            Array.from({ length: Math.floor(bld.w / 4) }).map((_, fx) => {
              const windowId = `${i}-f-${fx}-${fy}`
              const lightOn = Math.sin(time.current * 0.5 + fx + fy * 2) > 0.3
              return (
                <mesh
                  key={windowId}
                  position={[
                    (fx - Math.floor(bld.w / 8)) * 4 + 2,
                    bld.h / 2 - fy * 4 - 2,
                    bld.d / 2 + 0.1
                  ]}
                >
                  <planeGeometry args={[2.5, 2.5]} />
                  <meshStandardMaterial
                    emissive={lightOn ? bld.c2 : '#001133'}
                    emissiveIntensity={lightOn ? 0.8 : 0.1}
                    color="#000011"
                  />
                </mesh>
              )
            })
          ))}

          {/* Animated Windows - Back */}
          {Array.from({ length: Math.floor(bld.h / 4) }).map((_, fy) => (
            Array.from({ length: Math.floor(bld.d / 4) }).map((_, fd) => {
              const windowId = `${i}-b-${fd}-${fy}`
              const lightOn = Math.sin(time.current * 0.4 + fd + fy * 1.5) > 0.4
              return (
                <mesh
                  key={windowId}
                  position={[
                    0,
                    bld.h / 2 - fy * 4 - 2,
                    (fd - Math.floor(bld.d / 8)) * 4 - bld.d / 2 - 0.1
                  ]}
                  rotation={[0, Math.PI, 0]}
                >
                  <planeGeometry args={[2.5, 2.5]} />
                  <meshStandardMaterial
                    emissive={lightOn ? bld.c2 : '#001133'}
                    emissiveIntensity={lightOn ? 0.7 : 0.1}
                  />
                </mesh>
              )
            })
          ))}

          {/* Animated Roof accent with pulsing glow */}
          <mesh position={[0, bld.h + 1, 0]}>
            <boxGeometry args={[bld.w + 2, 0.5, bld.d + 2]} />
            <meshStandardMaterial
              emissive={bld.c2}
              emissiveIntensity={0.4 + Math.sin(time.current * 2 + i) * 0.3}
              color="#0a0a0a"
              metalness={0.5}
            />
          </mesh>

          {/* Antenna on top */}
          <mesh position={[bld.w / 2 - 2, bld.h + 3, bld.d / 2 - 2]}>
            <cylinderGeometry args={[0.1, 0.1, 4, 8]} />
            <meshStandardMaterial 
              color="#ff0066" 
              emissive="#ff0066"
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>
      ))}

      {/* Rotating billboard with prices */}
      <group ref={billboardRef} position={[0, 22, -85]}>
        {/* Screen frame */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[36, 22, 2]} />
          <meshStandardMaterial
            emissive="#00ffff"
            emissiveIntensity={0.9}
            color="#000011"
            metalness={0.4}
          />
        </mesh>

        {/* Screen border glow */}
        <mesh position={[0, 0, 0.1]}>
          <boxGeometry args={[38, 24, 0.5]} />
          <meshBasicMaterial 
            color="#00ffff" 
            transparent 
            opacity={0.3}
          />
        </mesh>

        {/* Price text */}
        <Text position={[0, 6, 1]} fontSize={4} color="#00ffff" fontWeight="bold">
          CVT ${Math.floor(Math.random() * 1000)}
        </Text>
        <Text position={[0, -2, 1]} fontSize={3.5} color="#ff0088">
          PXL ${Math.floor(Math.random() * 500)}
        </Text>
        <Text position={[0, -8, 1]} fontSize={2} color="#00ff88">
          LIVE RATES
        </Text>
      </group>

      {/* Animated Player Character */}
      <group position={playerState.playerPos}>
        <group rotation={[0, playerState.playerRot, 0]}>
          {/* Torso with gradient */}
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[0.5, 0.8, 0.3]} />
            <meshStandardMaterial
              color="#ff0066"
              emissive="#ff0066"
              emissiveIntensity={0.3}
              metalness={0.2}
              roughness={0.6}
            />
          </mesh>

          {/* Head with shine */}
          <mesh position={[0, 1.8, 0]}>
            <sphereGeometry args={[0.35, 20, 20]} />
            <meshStandardMaterial
              color="#f4a460"
              metalness={0.2}
              roughness={0.6}
            />
          </mesh>

          {/* Eyes - animated blink */}
          <mesh position={[-0.1, 1.85, 0.3]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color="#00ffff" />
          </mesh>
          <mesh position={[0.1, 1.85, 0.3]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color="#00ffff" />
          </mesh>

          {/* Left arm with dynamic animation */}
          <mesh 
            position={[-0.4, 1.4, 0]} 
            rotation={[playerState.isMoving ? Math.sin(time.current * 10) * 0.6 : 0.2, 0, -0.2]}
          >
            <boxGeometry args={[0.2, 0.7, 0.25]} />
            <meshStandardMaterial 
              color="#ff0066" 
              metalness={0.15}
              emissive="#ff0066"
              emissiveIntensity={0.2}
            />
          </mesh>

          {/* Right arm with dynamic animation */}
          <mesh 
            position={[0.4, 1.4, 0]} 
            rotation={[playerState.isMoving ? -Math.sin(time.current * 10) * 0.6 : -0.2, 0, 0.2]}
          >
            <boxGeometry args={[0.2, 0.7, 0.25]} />
            <meshStandardMaterial 
              color="#ff0066" 
              metalness={0.15}
              emissive="#ff0066"
              emissiveIntensity={0.2}
            />
          </mesh>

          {/* Left leg with dynamic animation */}
          <mesh 
            position={[-0.2, 0.5, 0]} 
            rotation={[playerState.isMoving ? Math.sin(time.current * 10) * 0.7 : 0, 0, 0]}
          >
            <boxGeometry args={[0.22, 0.8, 0.22]} />
            <meshStandardMaterial 
              color="#1a1a3a" 
              metalness={0.2}
              emissive="#1a1a5a"
              emissiveIntensity={0.3}
            />
          </mesh>

          {/* Right leg with dynamic animation */}
          <mesh 
            position={[0.2, 0.5, 0]} 
            rotation={[playerState.isMoving ? -Math.sin(time.current * 10) * 0.7 : 0, 0, 0]}
          >
            <boxGeometry args={[0.22, 0.8, 0.22]} />
            <meshStandardMaterial 
              color="#1a1a3a" 
              metalness={0.2}
              emissive="#1a1a5a"
              emissiveIntensity={0.3}
            />
          </mesh>

          {/* Animated glow aura when moving */}
          {playerState.isMoving && (
            <mesh position={[0, 1, 0]}>
              <sphereGeometry args={[0.9 + Math.sin(time.current * 5) * 0.2, 16, 16]} />
              <meshBasicMaterial
                color="#ff0066"
                transparent
                opacity={0.25 + Math.sin(time.current * 4) * 0.1}
              />
            </mesh>
          )}

          {/* Trail particles when moving */}
          {playerState.isMoving && Array.from({ length: 3 }).map((_, p) => (
            <mesh key={`trail-${p}`} position={[0, 0.8 - p * 0.3, -p * 0.3]}>
              <sphereGeometry args={[0.15, 6, 6]} />
              <meshBasicMaterial 
                color="#ff0066" 
                transparent 
                opacity={0.3 - p * 0.1}
              />
            </mesh>
          ))}
        </group>

        {/* Player name tag with glow */}
        <Text position={[0, 2.7, 0]} fontSize={0.5} color="#00ffff">
          ►YOU◄
        </Text>

        {/* Level/Status indicator */}
        <Text position={[0, -0.8, 0]} fontSize={0.4} color="#00ff88">
          LVL 1
        </Text>
      </group>

      {/* Floating score displays */}
      <Text position={[55, 18, -75]} fontSize={3} color="#00ff88" fontWeight="bold">
        KILLS: {kills}
      </Text>

      {/* Enhanced central plaza fountain */}
      <group position={[0, 0, 0]}>
        {/* Base */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[10, 10, 1, 32]} />
          <meshStandardMaterial
            emissive="#0066ff"
            emissiveIntensity={0.7}
            color="#001a4a"
            metalness={0.4}
          />
        </mesh>

        {/* Water pool */}
        <mesh position={[0, 0.51, 0]}>
          <cylinderGeometry args={[9, 9, 0.2, 32]} />
          <meshStandardMaterial
            emissive="#00aaff"
            emissiveIntensity={0.5}
            color="#001166"
            metalness={0.3}
          />
        </mesh>

        {/* Animated water drops */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2
          const radius = 5 + Math.sin(time.current * 2 + i) * 1
          const height = Math.max(0, 3 + Math.sin(time.current * 3 + i * 0.5) * 2)
          return (
            <mesh key={`water-${i}`} position={[
              Math.cos(angle) * radius,
              height,
              Math.sin(angle) * radius
            ]}>
              <sphereGeometry args={[0.35, 12, 12]} />
              <meshStandardMaterial
                color="#00ffff"
                emissive="#00ccff"
                emissiveIntensity={0.8}
                metalness={0.2}
              />
            </mesh>
          )
        })}
      </group>

      {/* Environment ambient glow - enhanced */}
      <mesh position={[0, 25, 0]}>
        <boxGeometry args={[400, 150, 400]} />
        <meshBasicMaterial
          wireframe
          color="#0066ff"
          transparent
          opacity={0.05}
        />
      </mesh>

      {/* Floating city lights in distance */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2
        const dist = 120 + Math.sin(time.current * 0.5 + i) * 20
        return (
          <mesh key={`distant-light-${i}`} position={[
            Math.cos(angle) * dist,
            20 + Math.sin(time.current + i) * 5,
            Math.sin(angle) * dist
          ]}>
            <sphereGeometry args={[0.5, 4, 4]} />
            <meshBasicMaterial 
              color={['#00ffff', '#ff00ff', '#ffaa00'][i % 3]}
              emissive={['#00ffff', '#ff00ff', '#ffaa00'][i % 3]}
            />
          </mesh>
        )
      })}
    </group>
  )
}

