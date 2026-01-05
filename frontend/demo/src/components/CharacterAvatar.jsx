import React from 'react'
import * as THREE from 'three'

export default function CharacterAvatar({ position = [0,0,0], rotation = [0,0,0], colors = {}, outfit = 0, hair = 0, name = '', health = 100 }){
  // Simple placeholder character: body, head, outfit, hair
  const bodyColor = colors.body || '#ff6b9d'
  const headColor = colors.head || '#ffd56b'
  const outfitColor = colors.outfit || '#00f0ff'
  const hairColor = colors.hair || '#1f1f1f'
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0,1,0]} castShadow>
        <boxGeometry args={[0.5, 0.9, 0.35]} />
        <meshStandardMaterial color={bodyColor} emissive={bodyColor} emissiveIntensity={0.6} metalness={0.1} roughness={0.6} />
      </mesh>
      <mesh position={[0,1.9,0]} castShadow>
        <sphereGeometry args={[0.33, 16, 16]} />
        <meshStandardMaterial color={headColor} emissive={headColor} emissiveIntensity={0.6} metalness={0.05} roughness={0.7} />
      </mesh>

      {/* outfit layer - vary by outfit index */}
      {outfit === 0 && (
        <mesh position={[0,1.05,0.02]} castShadow>
          <boxGeometry args={[0.52, 0.5, 0.36]} />
          <meshStandardMaterial color={outfitColor} metalness={0.2} roughness={0.5} transparent opacity={0.95} />
        </mesh>
      )}
      {outfit === 1 && (
        <mesh position={[0,1.05,0.02]} castShadow>
          <cylinderGeometry args={[0.28, 0.38, 0.6, 12]} />
          <meshStandardMaterial color={outfitColor} metalness={0.25} roughness={0.45} />
        </mesh>
      )}
      {outfit === 2 && (
        <mesh position={[0,1.05,0.02]} castShadow>
          <sphereGeometry args={[0.4, 12, 12]} />
          <meshStandardMaterial color={outfitColor} metalness={0.15} roughness={0.6} />
        </mesh>
      )}

      {/* hair variations */}
      {hair === 0 && (
        <mesh position={[0,2.08,0.05]} castShadow>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial color={hairColor} metalness={0.05} roughness={0.6} />
        </mesh>
      )}
      {hair === 1 && (
        <mesh position={[0,2.1,0.04]} castShadow>
          <boxGeometry args={[0.42, 0.18, 0.28]} />
          <meshStandardMaterial color={hairColor} metalness={0.05} roughness={0.6} />
        </mesh>
      )}
      {hair === 2 && (
        <mesh position={[0,2.05,-0.12]} castShadow rotation={[0,0,0.1]}>
          <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} />
          <meshStandardMaterial color={hairColor} metalness={0.02} roughness={0.7} />
        </mesh>
      )}

      {/* simple sword as accessory */}
      <mesh position={[0.6,1.5,-0.18]} rotation={[0,0,-Math.PI/4]}>
        <boxGeometry args={[0.12,1.2,0.06]} />
        <meshStandardMaterial color={colors.sword || '#ffd700'} emissive={colors.sword || '#ffd700'} metalness={0.9} />
      </mesh>

      {/* nameplate */}
      {name ? (
        <mesh position={[0,2.6,0.05]}>
          <planeGeometry args={[Math.max(1, name.length * 0.12), 0.18]} />
          <meshBasicMaterial color={'#111111'} transparent opacity={0.7} />
        </mesh>
      ) : null}
    </group>
  )
}
