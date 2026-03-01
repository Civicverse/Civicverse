import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'

interface Player {
  id: string
  mesh: THREE.Group
  body: CANNON.Body
  health: number
  ammo: number
  isLocal: boolean
  isAlive: boolean
  name: string
}

interface GameState {
  players: Map<string, Player>
  localPlayer: Player | null
  kills: number
  gameOver: boolean
  winner: string | null
  gameTime: number
}

export const BattleRoyaleGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const gameStateRef = useRef<GameState>({
    players: new Map(),
    localPlayer: null,
    kills: 0,
    gameOver: false,
    winner: null,
    gameTime: 300,
  })

  const [gameUI, setGameUI] = useState({
    health: 100,
    ammo: 30,
    kills: 0,
    alive: 5,
    timer: '5:00',
    chatMessages: [] as Array<{ player: string; message: string }>,
  })

  const [chatInput, setChatInput] = useState('')
  const keysPressed = useRef<Record<string, boolean>>({})
  const mouseRef = useRef({ x: 0, y: 0, isAiming: false })
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize game
  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a1428)
    scene.fog = new THREE.Fog(0x0a1428, 500, 2000)

    // Add neon city environment
    createNeonCity(scene)

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      2000
    )
    camera.position.set(0, 1.6, 0)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowShadowMap
    containerRef.current.appendChild(renderer.domElement)

    // Physics world
    const world = new CANNON.World()
    world.gravity.set(0, -9.82, 0)
    world.defaultContactMaterial.friction = 0.4

    // Create local player
    const localPlayer = createPlayer(scene, world, 'YOU', true)
    gameStateRef.current.localPlayer = localPlayer
    gameStateRef.current.players.set('local', localPlayer)

    // Create AI players
    for (let i = 0; i < 4; i++) {
      const aiPlayer = createPlayer(
        scene,
        world,
        `Player_${i + 1}`,
        false,
        new THREE.Vector3((Math.random() - 0.5) * 100, 1, (Math.random() - 0.5) * 100)
      )
      gameStateRef.current.players.set(`ai_${i}`, aiPlayer)
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0x00d9ff, 0.8)
    directionalLight.position.set(100, 100, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.far = 200
    scene.add(directionalLight)

    // Neon point lights
    const lights = [
      { pos: [50, 20, 50], color: 0x00d9ff },
      { pos: [-50, 20, -50], color: 0xff006e },
      { pos: [50, 20, -50], color: 0xb837f7 },
      { pos: [-50, 20, 50], color: 0xff8c00 },
    ]
    lights.forEach(light => {
      const pointLight = new THREE.PointLight(light.color, 1, 200)
      pointLight.position.set(...(light.pos as [number, number, number]))
      scene.add(pointLight)
    })

    // Event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    const handleMouseDown = () => {
      mouseRef.current.isAiming = true
    }

    const handleMouseUp = () => {
      mouseRef.current.isAiming = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer

    // Start synthwave music
    playSynthwaveMusic()

    // Game loop
    const gameLoop = () => {
      requestAnimationFrame(gameLoop)

      // Update physics
      world.step(1 / 60)

      // Update local player
      if (localPlayer && gameStateRef.current.localPlayer) {
        updatePlayerMovement(localPlayer, world, camera)
        updatePlayerAiming(localPlayer, camera)
      }

      // Update AI players
      gameStateRef.current.players.forEach((player, id) => {
        if (!player.isLocal && player.isAlive) {
          updateAIPlayer(player, world, gameStateRef.current)
        }
      })

      // Check collisions and hits
      checkHits()

      // Update game time
      gameStateRef.current.gameTime -= 1 / 60
      if (gameStateRef.current.gameTime <= 0) {
        endGame()
      }

      // Update UI
      setGameUI(prev => ({
        ...prev,
        health: Math.max(0, localPlayer.health),
        ammo: localPlayer.ammo,
        kills: gameStateRef.current.kills,
        alive: Array.from(gameStateRef.current.players.values()).filter(p => p.isAlive).length,
        timer: formatTime(gameStateRef.current.gameTime),
      }))

      // Render
      renderer.render(scene, camera)
    }

    gameLoop()

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('resize', handleResize)
      containerRef.current?.removeChild(renderer.domElement)
    }
  }, [])

  const createNeonCity = (scene: THREE.Scene) => {
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(500, 500)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x1a1a2e),
      emissive: new THREE.Color(0x00d9ff),
      emissiveIntensity: 0.2,
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Buildings with neon
    const buildingColors = [0x00d9ff, 0xff006e, 0xb837f7, 0xff8c00]
    for (let i = 0; i < 12; i++) {
      const x = (Math.random() - 0.5) * 400
      const z = (Math.random() - 0.5) * 400
      const height = 30 + Math.random() * 60
      const width = 20 + Math.random() * 30
      const depth = 20 + Math.random() * 30

      const geometry = new THREE.BoxGeometry(width, height, depth)
      const material = new THREE.MeshStandardMaterial({
        color: buildingColors[i % buildingColors.length],
        metalness: 0.8,
        roughness: 0.2,
      })
      const building = new THREE.Mesh(geometry, material)
      building.position.set(x, height / 2, z)
      building.castShadow = true
      building.receiveShadow = true

      // Neon glow
      const edges = new THREE.EdgesGeometry(geometry)
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: buildingColors[i % buildingColors.length] })
      )
      building.add(line)

      scene.add(building)
    }

    // Neon grid lines
    const gridHelper = new THREE.GridHelper(500, 50, 0x00d9ff, 0x00d9ff)
    gridHelper.material.transparent = true
    gridHelper.material.opacity = 0.2
    scene.add(gridHelper)
  }

  const createPlayer = (
    scene: THREE.Scene,
    world: CANNON.World,
    name: string,
    isLocal: boolean,
    position?: THREE.Vector3
  ): Player => {
    const group = new THREE.Group()

    // Body (capsule-like)
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.6, 4, 8)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: isLocal ? 0x00d9ff : 0xff006e,
      metalness: 0.6,
      roughness: 0.4,
    })
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial)
    bodyMesh.castShadow = true
    bodyMesh.receiveShadow = true
    group.add(bodyMesh)

    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16)
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdbac,
      metalness: 0.3,
      roughness: 0.5,
    })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.y = 1
    head.castShadow = true
    head.receiveShadow = true
    group.add(head)

    // Gun model (simple)
    const gunGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.8)
    const gunMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 1,
      roughness: 0.2,
    })
    const gun = new THREE.Mesh(gunGeometry, gunMaterial)
    gun.position.set(0.3, 0.5, -0.5)
    gun.castShadow = true
    group.add(gun)

    const pos = position || new THREE.Vector3((Math.random() - 0.5) * 100, 5, (Math.random() - 0.5) * 100)
    group.position.copy(pos)
    scene.add(group)

    // Physics body
    const shape = new CANNON.Sphere(0.4)
    const body = new CANNON.Body({
      mass: isLocal ? 1 : 0.5,
      shape,
      linearDamping: 0.3,
      angularDamping: 0.3,
    })
    body.position.copy(new CANNON.Vec3(pos.x, pos.y, pos.z))
    world.addBody(body)

    return {
      id: name,
      mesh: group,
      body,
      health: 100,
      ammo: 30,
      isLocal,
      isAlive: true,
      name,
    }
  }

  const updatePlayerMovement = (player: Player, world: CANNON.World, camera: THREE.PerspectiveCamera) => {
    const speed = 20
    const jumpForce = 10
    const moveDirection = new CANNON.Vec3(0, 0, 0)

    if (keysPressed.current['w']) moveDirection.z -= speed
    if (keysPressed.current['s']) moveDirection.z += speed
    if (keysPressed.current['a']) moveDirection.x -= speed
    if (keysPressed.current['d']) moveDirection.x += speed

    // Rotate based on camera
    const angle = Math.atan2(moveDirection.x, moveDirection.z)
    if (moveDirection.x !== 0 || moveDirection.z !== 0) {
      const rotatedDirection = new CANNON.Vec3(
        Math.sin(angle) * speed * 0.1,
        0,
        -Math.cos(angle) * speed * 0.1
      )
      player.body.velocity.x = rotatedDirection.x
      player.body.velocity.z = rotatedDirection.z
    } else {
      player.body.velocity.x *= 0.9
      player.body.velocity.z *= 0.9
    }

    // Jump
    if (keysPressed.current[' ']) {
      player.body.velocity.y = jumpForce
      keysPressed.current[' '] = false
    }

    // Update mesh position
    player.mesh.position.copy(player.body.position as any)
    camera.position.copy(player.mesh.position)
    camera.position.y += 1.6
  }

  const updatePlayerAiming = (player: Player, camera: THREE.PerspectiveCamera) => {
    if (mouseRef.current.isAiming && player.ammo > 0) {
      // Raycast to shoot
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouseRef.current, camera)

      const otherPlayers = Array.from(gameStateRef.current.players.values()).filter(
        p => !p.isLocal && p.isAlive
      )

      const intersects = raycaster.intersectObjects(
        otherPlayers.map(p => p.mesh),
        true
      )

      if (intersects.length > 0) {
        const hit = intersects[0]
        const hitPlayer = otherPlayers.find(p =>
          p.mesh.children.some(child => child === hit.object || hit.object.parent === child)
        )

        if (hitPlayer) {
          hitPlayer.health -= 10
          player.ammo -= 1

          if (hitPlayer.health <= 0) {
            hitPlayer.isAlive = false
            gameStateRef.current.kills++
            addChatMessage(`KILL: ${hitPlayer.name}`)
          }
        }
      }

      mouseRef.current.isAiming = false
    }
  }

  const updateAIPlayer = (player: Player, world: CANNON.World, gameState: GameState) => {
    // Simple AI: random movement and occasional shooting
    if (Math.random() < 0.02) {
      player.body.velocity.x = (Math.random() - 0.5) * 20
      player.body.velocity.z = (Math.random() - 0.5) * 20
    }

    if (Math.random() < 0.005 && player.ammo > 0) {
      // Shoot at nearby players
      const nearbyPlayers = Array.from(gameState.players.values()).filter(
        p => p.isAlive && p.id !== player.id
      )
      if (nearbyPlayers.length > 0) {
        const target = nearbyPlayers[Math.floor(Math.random() * nearbyPlayers.length)]
        target.health -= 5
        player.ammo -= 1

        if (target.health <= 0) {
          target.isAlive = false
          addChatMessage(`${player.name} eliminated ${target.name}`)
        }
      }
    }

    player.mesh.position.copy(player.body.position as any)
  }

  const checkHits = () => {
    // Check if any player is out of bounds
    gameStateRef.current.players.forEach(player => {
      if (
        Math.abs(player.body.position.x) > 300 ||
        Math.abs(player.body.position.z) > 300
      ) {
        player.health = 0
        player.isAlive = false
        addChatMessage(`${player.name} fell out of the arena!`)
      }
    })
  }

  const endGame = () => {
    const alivePlayers = Array.from(gameStateRef.current.players.values()).filter(p => p.isAlive)

    if (alivePlayers.length === 1) {
      gameStateRef.current.gameOver = true
      gameStateRef.current.winner = alivePlayers[0].name
      addChatMessage(`🏆 ${alivePlayers[0].name} is KING OF THE LOBBY! 🏆`)
    }
  }

  const playSynthwaveMusic = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    audioContextRef.current = audioContext

    const now = audioContext.currentTime
    const duration = 8

    // Synthwave bass pattern
    const bassOscillator = audioContext.createOscillator()
    bassOscillator.type = 'square'
    bassOscillator.frequency.value = 55
    const bassGain = audioContext.createGain()
    bassGain.gain.setValueAtTime(0.3, now)
    bassGain.gain.linearRampToValueAtTime(0, now + duration)
    bassOscillator.connect(bassGain)
    bassGain.connect(audioContext.destination)
    bassOscillator.start(now)
    bassOscillator.stop(now + duration)

    // Synth melody
    const synth = audioContext.createOscillator()
    synth.type = 'triangle'
    const synthGain = audioContext.createGain()
    synthGain.gain.setValueAtTime(0.2, now)
    synthGain.gain.linearRampToValueAtTime(0, now + duration)
    synth.connect(synthGain)
    synthGain.connect(audioContext.destination)

    const notes = [440, 494, 523, 587, 523, 494, 440, 392]
    let time = now
    notes.forEach((freq, i) => {
      synth.frequency.setValueAtTime(freq, time)
      time += duration / notes.length
    })
    synth.start(now)
    synth.stop(now + duration)
  }

  const addChatMessage = (message: string) => {
    setGameUI(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages.slice(-9), { player: 'SYSTEM', message }],
    }))
  }

  const handleChatSend = () => {
    if (chatInput.trim()) {
      addChatMessage(chatInput)
      setChatInput('')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative w-full h-screen bg-dark-900 overflow-hidden">
      {/* Game Canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none text-white font-mono">
        {/* Top left: Health & Ammo */}
        <div className="absolute top-4 left-4 space-y-2">
          <div className="bg-dark-900/80 border-2 border-neon-cyan p-3 rounded">
            <div className="text-neon-cyan text-sm mb-1">HEALTH</div>
            <div className="w-48 h-6 bg-dark-800 border border-neon-cyan/50 relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-neon-green to-neon-cyan"
                style={{ width: `${gameUI.health}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {gameUI.health}%
              </div>
            </div>
          </div>

          <div className="bg-dark-900/80 border-2 border-neon-pink p-3 rounded">
            <div className="text-neon-pink text-sm mb-1">AMMO</div>
            <div className="text-2xl font-bold">{gameUI.ammo}</div>
          </div>
        </div>

        {/* Top right: Timer & Kills */}
        <div className="absolute top-4 right-4 space-y-2">
          <div className="bg-dark-900/80 border-2 border-neon-orange p-3 rounded text-center">
            <div className="text-neon-orange text-sm mb-1">TIME</div>
            <div className="text-3xl font-bold">{gameUI.timer}</div>
          </div>

          <div className="bg-dark-900/80 border-2 border-neon-purple p-3 rounded text-center">
            <div className="text-neon-purple text-sm mb-1">KILLS</div>
            <div className="text-3xl font-bold text-neon-pink">{gameUI.kills}</div>
          </div>

          <div className="bg-dark-900/80 border-2 border-neon-cyan p-3 rounded text-center">
            <div className="text-neon-cyan text-sm mb-1">PLAYERS</div>
            <div className="text-2xl font-bold">{gameUI.alive}/5</div>
          </div>
        </div>

        {/* Bottom left: Chat */}
        <div className="absolute bottom-4 left-4 w-64 bg-dark-900/80 border-2 border-neon-cyan rounded pointer-events-auto">
          <div className="h-40 overflow-y-auto space-y-1 p-2 text-xs">
            {gameUI.chatMessages.map((msg, i) => (
              <div key={i} className="text-gray-300">
                <span className="text-neon-cyan">{msg.player}:</span> {msg.message}
              </div>
            ))}
          </div>
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleChatSend()}
            placeholder="Say something..."
            className="w-full bg-dark-800 border-t border-neon-cyan p-1 text-xs text-white outline-none"
          />
        </div>

        {/* Game Over Screen */}
        {gameStateRef.current.gameOver && (
          <div className="absolute inset-0 bg-dark-900/90 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-neon-pink mb-4">GAME OVER</h1>
              <h2 className="text-4xl text-neon-cyan mb-6">
                🏆 {gameStateRef.current.winner} IS KING OF THE LOBBY 🏆
              </h2>
              <p className="text-xl text-neon-purple mb-4">Your Kills: {gameUI.kills}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="absolute bottom-4 right-4 bg-dark-900/80 border border-neon-cyan p-2 text-xs max-w-48">
          <div className="text-neon-cyan font-bold mb-2">CONTROLS</div>
          <div className="space-y-1 text-gray-300">
            <div>WASD - Move</div>
            <div>Space - Jump</div>
            <div>Click - Shoot</div>
            <div>Enter - Chat</div>
          </div>
        </div>
      </div>
    </div>
  )
}
