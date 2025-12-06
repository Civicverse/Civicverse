import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'

export default function CityScene({ kills = 0 }) {
  const billboardRef = useRef()

  useFrame((state, delta) => {
    if (billboardRef.current) {
      billboardRef.current.rotation.y += delta * 0.3
    }
  })

  const buildings = useMemo(() => {
    const arr = []
    for (let x = -10; x <= 10; x += 2) {
      for (let z = -15; z <= 5; z += 2) {
        const h = 1 + Math.random() * 4
        const color1 = Math.random() > 0.5 ? '#00f3ff' : '#ff006f'
        const color2 = Math.random() > 0.5 ? '#00ff88' : '#ffff00'
        arr.push({ x, z, h, c1: color1, c2: color2, id: `${x}-${z}` })
      }
    }
    return arr
  }, [])

  return (
    <group>
      {/* Ground */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.5, -5]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial
          color="#010407"
          metalness={0.3}
          roughness={0.8}
        />
      </mesh>

      {/* Buildings */}
      {buildings.map((bld) => (
        <group key={bld.id}>
          {/* Main tower */}
          <mesh position={[bld.x, bld.h / 2, bld.z]}>
            <boxGeometry args={[1.5, bld.h, 1.5]} />
            <meshStandardMaterial
              color="#0b1220"
              emissive={bld.c1}
              emissiveIntensity={0.6}
              metalness={0.2}
            />
          </mesh>
          {/* Accent stripe */}
          <mesh position={[bld.x, bld.h * 0.7, bld.z + 0.8]}>
            <boxGeometry args={[1.6, bld.h * 0.3, 0.3]} />
            <meshStandardMaterial
              emissive={bld.c2}
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      ))}

      {/* Rotating billboard screen */}
      <group ref={billboardRef} position={[0, 5, -20]}>
        <mesh>
          <boxGeometry args={[8, 5, 0.3]} />
          <meshStandardMaterial
            emissive="#00ffff"
            color="#001"
            emissiveIntensity={0.7}
            metalness={0.3}
          />
        </mesh>
        <Text position={[0, 0.5, 0.2]} fontSize={0.4} color="#00ffff">
          KAS ${Math.floor(Math.random() * 1000)}
        </Text>
        <Text position={[0, -0.5, 0.2]} fontSize={0.4} color="#ff006f">
          XMR ${Math.floor(Math.random() * 500)}
        </Text>
      </group>

      {/* Central plaza */}
      <mesh position={[0, -0.4, -8]}>
        <boxGeometry args={[15, 0.2, 10]} />
        <meshStandardMaterial
          emissive="#0066ff"
          emissiveIntensity={0.4}
          color="#002244"
        />
      </mesh>

      {/* Player avatar */}
      <group position={[0, 1, -8]}>
        <mesh>
          <boxGeometry args={[0.6, 1.6, 0.6]} />
          <meshStandardMaterial
            color="#ff006f"
            emissive="#ff006f"
            emissiveIntensity={0.5}
            metalness={0.1}
          />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.35, 8, 8]} />
          <meshStandardMaterial
            color="#ffdd00"
            emissive="#ffff00"
            emissiveIntensity={0.6}
          />
        </mesh>
      </group>

      {/* Kill counter */}
      <Text position={[12, 8, -8]} fontSize={0.6} color="#00ff00">
        KILLS: {kills}
      </Text>

      {/* Arena boundary */}
      <mesh position={[0, 3, -8]}>
        <boxGeometry args={[25, 8, 15]} />
        <meshBasicMaterial
          wireframe
          color="#00ffff"
          transparent
          opacity={0.1}
        />
      </mesh>
    </group>
  )
}
