import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';
import { 
  Shield, 
  ChevronDown, 
  X, 
  MapPin, 
  Zap, 
  MessageSquare,
  Crosshair,
  Volume2,
  Send,
  Coins,
  Users
} from 'lucide-react';
import { useMultiplayerStore } from '../services/multiplayer';
import { createCharacterMesh, createPlayerNametag } from '../lib/characterFactory';
import { getUserBroadcastVideos } from '../services/mediaService';
import {
  buildDetailedCity,
  updateCityAnimation,
  updateCityBillboardStories,
  type BillboardStory
} from './CivicCityModel';

interface GodotFoyerProps {
  onExit?: () => void;
}

interface ChatBubble {
  sprite: THREE.Sprite;
  messageId: string;
}

const FOYER_WEAPON_NAMES: Record<number, string> = { 1: 'Pulse Rifle', 2: 'Scattergun', 3: 'Rocket Launcher', 4: 'Rail Sniper', 5: 'Plasma Cannon', 6: 'Arc Emitter', 7: 'Vector SMG', 8: 'Grenade Launcher' };

const GodotFoyerImpl: React.FC<GodotFoyerProps> = ({ onExit }) => {
  const { user } = useGameStore();
  const localHealth = useMultiplayerStore(state => state.localHealth);
  const combatEvent = useMultiplayerStore(state => state.combatEvent);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<any>(null);
  const smaaRef = useRef<any>(null);
  
  // React HUD states
  const [cameraMode, setCameraMode] = useState<'3RD' | '1ST'>('3RD');
  const [activeWeaponSlot, setActiveWeaponSlot] = useState(4);
  const [sceneErrorMessage, setSceneErrorMessage] = useState('');
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [aaMode, setAaMode] = useState<'off' | 'smaa'>('smaa');
  const [pixelCap, setPixelCap] = useState<number>(1.25);
  const pixelCapRef = useRef(pixelCap);
  const renderScaleRef = useRef(1);

  // Multiplayer state (20 per Lobby Instance)
  const chatHistory = useMultiplayerStore(state => state.chatHistory);
  const players = useMultiplayerStore(state => state.players);
  const peerCount = useMultiplayerStore(state => state.peerCount);
  const connectionMode = useMultiplayerStore(state => state.connectionMode);
  const currentLobbyId = useMultiplayerStore(state => state.currentLobbyId);
  const currentLobbyName = useMultiplayerStore(state => state.currentLobbyName);
  const availableLobbies = useMultiplayerStore(state => state.availableLobbies);
  const friendCivicIds = useMultiplayerStore(state => state.friendCivicIds);
  const onlineFriends = useMultiplayerStore(state => state.onlineFriends);
  const incomingLobbyInvites = useMultiplayerStore(state => state.incomingLobbyInvites);
  const switchLobby = useMultiplayerStore(state => state.switchLobby);
  const ubiStatus = useMultiplayerStore(state => state.ubiStatus);
  const [hudChatInput, setHudChatInput] = useState('');
  const [nearbyChat, setNearbyChat] = useState(true);
  const [playerSearch, setPlayerSearch] = useState('');
  const [showLobbyModal, setShowLobbyModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('5.0');
  const [tipSuccess, setTipSuccess] = useState('');
  const [selectedBillboardStory, setSelectedBillboardStory] = useState<BillboardStory | null>(null);
  const isChatFocusedRef = useRef(false);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const activeSlotRef = useRef<number>(4);

  useEffect(() => {
    if (!combatEvent || combatEvent.kind !== 'death') return;
    const current = useGameStore.getState().user;
    if (!current) return;
    useGameStore.getState().updateUser({ stats: { deaths: (current.stats?.deaths || 0) + 1 } });
  }, [combatEvent?.id]);

  useEffect(() => {
    if (combatEvent?.kind !== 'death') return;
    const timer = window.setTimeout(() => useMultiplayerStore.getState().respawn(), 2800);
    return () => window.clearTimeout(timer);
  }, [combatEvent?.id]);

  // Store camera mode ref so event listeners don't re-mount the Three.js scene
  const cameraModeRef = useRef<'3RD' | '1ST'>('3RD');

  // Audio context ref (must be a hook at component top-level)
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize and synchronize multiplayer connection
  useEffect(() => {
    const uninit = useMultiplayerStore.getState().initialize(user?.username || 'Citizen', user?.character, user?.civicId);
    return () => {
      if (typeof uninit === 'function') uninit();
    };
  }, [user?.username, user?.character]);

  useEffect(() => {
    useMultiplayerStore.getState().setIdentity(user?.username || 'Citizen', user?.character, user?.civicId);
  }, [user?.username, user?.character, user?.civicId]);

  const handleSendHudChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hudChatInput.trim()) return;
    useMultiplayerStore.getState().sendMessage(hudChatInput.trim(), 'text-cyan-400', nearbyChat, undefined, nearbyChat ? 'nearby' : 'lobby');
    setHudChatInput('');
  };

  const openBillboardSource = () => {
    if (!selectedBillboardStory) return;
    try {
      const source = new URL(selectedBillboardStory.sourceUrl, window.location.origin);
      if (!['http:', 'https:'].includes(source.protocol)) return;
      if (source.origin === window.location.origin) {
        navigate(`${source.pathname}${source.search}${source.hash}`);
      } else {
        window.open(source.href, '_blank', 'noopener,noreferrer');
      }
      setSelectedBillboardStory(null);
    } catch (error) {
      console.error('[GodotFoyer] Billboard source URL is invalid.', error);
    }
  };

  const visiblePlayers = Array.from(players.values()).filter(player =>
    `${player.username} ${player.civicId || ''}`.toLowerCase().includes(playerSearch.trim().toLowerCase())
  );

  const applyAAMode = (mode: 'off' | 'smaa') => {
    setAaMode(mode);
    try {
      if (smaaRef.current) smaaRef.current.enabled = mode === 'smaa';
    } catch (e) {}
  };

  const applyPixelCap = (cap: number) => {
    pixelCapRef.current = cap;
    setPixelCap(cap);
    try {
      const pr = Math.min(window.devicePixelRatio, cap);
      renderScaleRef.current = pr;
      if (rendererRef.current) {
        rendererRef.current.setPixelRatio(pr);
        rendererRef.current.setSize(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
      }
      if (composerRef.current) {
        composerRef.current.setPixelRatio(pr);
        composerRef.current.setSize(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
      }
      if (smaaRef.current) {
        smaaRef.current.setSize(containerRef.current!.clientWidth * pr, containerRef.current!.clientHeight * pr);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!containerRef.current) return;

    let setupError = false
    let sceneDisposed = false
    let civicWatchMediaTimer: number | undefined
    let billboardRotationTimer: number | undefined

    const showFallback = (msg: string) => {
      setSceneErrorMessage(msg);
    }

    try {

    // ========================================================
    // AAA THREE.JS GAME ENGINE & SYNTHWAVE ISLAND CITY
    // ========================================================

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1024);
    scene.fog = new THREE.FogExp2(0x252c43, 0.00065);

    const camera = new THREE.PerspectiveCamera(
      70, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.2, 
      60000
    );

    // Renderer setup with high tone mapping exposure for bright visuals
    const canvasElement = canvasRef.current;
    if (!canvasElement) throw new Error('Foyer canvas was not mounted.');
    canvasElement.id = 'cv-3d-engine-canvas';
    const renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    // Set pixel ratio high enough for crisp visuals but capped for performance
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelCap));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // Reduce exposure to avoid HDR clipping and shimmering
    renderer.toneMappingExposure = 1.35;
    // Use physically correct light intensity scaling to avoid extreme per-light values
    renderer.physicallyCorrectLights = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    rendererRef.current = renderer;
    setSceneErrorMessage('');

    // Post-processing: composer + bloom + FXAA
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(containerRef.current.clientWidth, containerRef.current.clientHeight), 0.9, 0.4, 0.1);
    bloomPass.threshold = 0.7;
    bloomPass.strength = 0.18;
    bloomPass.radius = 0.36;
    composer.addPass(bloomPass);
    // Use SMAA for superior AA with less blurring than FXAA
    const smaaPass = new SMAAPass(containerRef.current.clientWidth * renderer.getPixelRatio(), containerRef.current.clientHeight * renderer.getPixelRatio());
    composer.addPass(smaaPass);
    composer.setPixelRatio(renderer.getPixelRatio());
    composerRef.current = composer;
    smaaRef.current = smaaPass;

    // Improve texture filtering and encoding for all generated textures
    const applyTextureHints = () => {
      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      scene.traverse((o: any) => {
        if (o.isMesh) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m: any) => {
            ['map','emissiveMap'].forEach((k) => {
              if (m && m[k]) {
                m[k].colorSpace = THREE.SRGBColorSpace;
                m[k].anisotropy = maxAniso;
                m[k].minFilter = THREE.LinearMipmapLinearFilter;
                m[k].magFilter = THREE.LinearFilter;
                m[k].generateMipmaps = true;
                m[k].needsUpdate = true;
              }
            });
            ['normalMap','roughnessMap','metalnessMap','aoMap'].forEach((k) => {
              if (m && m[k]) {
                m[k].colorSpace = THREE.NoColorSpace;
                m[k].anisotropy = maxAniso;
                m[k].minFilter = THREE.LinearMipmapLinearFilter;
                m[k].magFilter = THREE.LinearFilter;
                m[k].generateMipmaps = true;
                m[k].needsUpdate = true;
              }
            });
          });
        }
      });
    };
    // run once now (procedural textures exist) and after PBR swap
    applyTextureHints();

    // initialize AA and pixel ratio according to state
    try {
      const pr = Math.min(window.devicePixelRatio, pixelCap);
      renderScaleRef.current = pr;
      renderer.setPixelRatio(pr);
      composer.setPixelRatio(pr);
      smaaPass.setSize(containerRef.current.clientWidth * pr, containerRef.current.clientHeight * pr);
      smaaPass.enabled = aaMode === 'smaa';
    } catch (e) {}

    const moonLight = new THREE.DirectionalLight(0xdce6f4, 3.0);
    moonLight.position.set(-120, 240, 180);
    moonLight.castShadow = true;
    // Reduce shadow map size to reduce aliasing artifacts and improve stability
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    // Small bias to reduce shadow acne and shimmering when moving
    moonLight.shadow.bias = -0.00015;
    moonLight.shadow.normalBias = 0.04;
    moonLight.shadow.camera.left = -230;
    moonLight.shadow.camera.right = 230;
    moonLight.shadow.camera.top = 230;
    moonLight.shadow.camera.bottom = -230;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 900;
    moonLight.shadow.camera.updateProjectionMatrix();
    scene.add(moonLight);
    const lightning = new THREE.DirectionalLight(0xa9c8ff, 0);
    lightning.position.set(-180, 260, 100);
    scene.add(lightning);

    const cyanAmbient = new THREE.DirectionalLight(0x8dbaff, 1.15);
    cyanAmbient.position.set(180, 110, -120);
    scene.add(cyanAmbient);
    scene.add(new THREE.HemisphereLight(0x8796d8, 0x28213c, 2.4));
    scene.add(new THREE.AmbientLight(0x53648f, 1.2));

    // ========================================================
    // HIGH-FIDELITY DETAILED HUMAN CHARACTER & 3D WEAPON
    // ========================================================

    const cityAnimationHandles = buildDetailedCity(scene);
    const refreshCivicWatchMedia = async () => {
      const endpoints = ['/api/social/explore?limit=50', '/api/civicwatch/media?limit=20'];
      const responses = await Promise.allSettled(endpoints.map(endpoint => fetch(endpoint)));
      const stories: BillboardStory[] = [];
      const colors = ['#00f3ff', '#ff4fd8', '#8bff6b', '#ffd166'];

      for (let endpointIndex = 0; endpointIndex < responses.length; endpointIndex += 1) {
        const result = responses[endpointIndex];
        if (result.status === 'rejected') {
          console.warn(`[CivicWatch] Could not load ${endpoints[endpointIndex]}.`, result.reason);
          continue;
        }
        if (!result.value.ok) {
          console.warn(`[CivicWatch] ${endpoints[endpointIndex]} returned HTTP ${result.value.status}.`);
          continue;
        }

        try {
          const payload: unknown = await result.value.json();
          if (!payload || typeof payload !== 'object') continue;
          const data = payload as Record<string, unknown>;
          const entries = endpointIndex === 0 ? data.posts : data.items;
          if (!Array.isArray(entries)) continue;

          entries.forEach((entry: unknown, entryIndex: number) => {
            if (!entry || typeof entry !== 'object') return;
            const item = entry as Record<string, unknown>;
            const id = typeof item.id === 'string' || typeof item.id === 'number' ? String(item.id) : `${endpointIndex}-${entryIndex}`;
            const title = typeof item.content === 'string'
              ? item.content
              : typeof item.title === 'string'
                ? item.title
                : typeof item.description === 'string'
                  ? item.description
                  : 'CivicWatch community report';
            const author = typeof item.authorName === 'string' ? item.authorName : 'Civicverse contributor';
            const authorId = typeof item.authorId === 'string' ? item.authorId : undefined;
            const profileUrl = authorId ? `/profile/${encodeURIComponent(authorId)}` : undefined;
            const color = colors[(stories.length + entryIndex) % colors.length];

            if (endpointIndex === 0) {
              const media = item.media && typeof item.media === 'object'
                ? item.media as Record<string, unknown>
                : undefined;
              const mimeType = typeof media?.mimeType === 'string' ? media.mimeType : '';
              const url = typeof media?.url === 'string'
                ? media.url
                : typeof media?.dataUrl === 'string'
                  ? media.dataUrl
                  : undefined;
              if (!url || !/^(video|image)\//.test(mimeType)) return;
              const isVideo = mimeType.startsWith('video/');
              stories.push({
                id: `post-${id}`,
                title,
                author,
                authorId,
                category: isVideo ? 'VIDEO REPORT' : 'PHOTO REPORT',
                tag: 'COMMUNITY',
                color,
                sourceUrl: profileUrl || '/civicwatch',
                profileUrl,
                imageUrl: !isVideo ? url : undefined,
                videoUrl: isVideo ? url : undefined,
                mimeType
              });
              return;
            }

            if (typeof item.image === 'string') {
              stories.push({
                id: `watch-${id}`,
                title,
                author,
                authorId,
                category: 'FIELD REPORT',
                tag: 'CIVICWATCH',
                color,
                sourceUrl: profileUrl || '/civicwatch',
                profileUrl,
                imageUrl: item.image,
                mimeType: 'image/jpeg'
              });
            }
          });
        } catch (error) {
          console.warn(`[CivicWatch] Could not parse ${endpoints[endpointIndex]}.`, error);
        }
      }

      // Inject Citizen Billboard Broadcasts from the Vault
      try {
        const citizenVideos = getUserBroadcastVideos().filter(v => v.shareToBillboards && v.url);
        const citizenStories: BillboardStory[] = citizenVideos.map(v => ({
          id: `citizen-billboard-${v.id}`,
          title: v.title || 'Citizen Broadcast',
          author: v.creatorUsername || 'Citizen Creator',
          authorId: v.creatorCivicId,
          category: 'VIDEO REPORT',
          tag: 'CITIZEN BROADCAST',
          color: '#00f3ff',
          sourceUrl: v.creatorCivicId ? `/profile/${encodeURIComponent(v.creatorCivicId)}` : '/vault',
          profileUrl: v.creatorCivicId ? `/profile/${encodeURIComponent(v.creatorCivicId)}` : undefined,
          videoUrl: v.url,
          mimeType: 'video/mp4'
        }));
        stories.unshift(...citizenStories);
      } catch (err) {
        console.warn('[GodotFoyer] Could not load citizen billboard videos:', err);
      }

      if (!sceneDisposed) updateCityBillboardStories(cityAnimationHandles, stories);
    };
    void refreshCivicWatchMedia();

    const handleBillboardBroadcast = () => {
      if (!sceneDisposed) void refreshCivicWatchMedia();
    };
    window.addEventListener('billboard_broadcast_changed', handleBillboardBroadcast);
    window.addEventListener('civicverse_videos_changed', handleBillboardBroadcast);
    window.addEventListener('civicverse_sharing_changed', handleBillboardBroadcast);

    civicWatchMediaTimer = window.setInterval(() => void refreshCivicWatchMedia(), 30000);

    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 20);

    const defaultCharacter = {
      skinColor: '#e0ac69',
      hairColor: '#4a3b2a',
      shirtColor: '#00d9ff',
      pantsColor: '#1a1a2e',
      shoesColor: '#333333',
      hairStyle: 'short' as const,
      accessory: 'none' as const,
      bodyType: 'athletic' as const
    };

    // Construct local player with their custom non-custodial decentralized avatar!
    const localCharacterMesh = createCharacterMesh(user?.character || defaultCharacter);
    localCharacterMesh.rotation.y = Math.PI;
    playerGroup.add(localCharacterMesh);

    // Floating nametag above local player
    const localNametag = createPlayerNametag(user?.username ? `${user.username} (You)` : 'Citizen (You)', '#00f3ff');
    playerGroup.add(localNametag);

    scene.add(playerGroup);

    // Remote multiplayer player mesh tracking map
    const remoteMeshes = new Map<string, {
      group: THREE.Group;
      mesh: THREE.Group;
      weapon: THREE.Group;
      muzzle: THREE.PointLight;
      lastShotAt: number;
      nametag: THREE.Sprite;
      bubble?: THREE.Sprite;
      bubbleMessageId?: string;
      characterRef: unknown;
      username: string;
      targetPos: THREE.Vector3;
      targetRotY: number;
      isMoving: boolean;
      animTime: number;
    }>();
    const localChatBubble: ChatBubble = { sprite: new THREE.Sprite(), messageId: '' };
    const remoteChatBubbles = new Map<string, ChatBubble>();
    const latestNearbyMessages = new Map<string, ReturnType<typeof useMultiplayerStore.getState>['chatHistory'][number]>();
    let lastNearbyMessageRefresh = 0;

    const makeRemoteWeapon = () => {
      const weapon = new THREE.Group();
      const dark = new THREE.MeshStandardMaterial({ color: 0x1a2430, metalness: 0.72, roughness: 0.3 });
      const trim = new THREE.MeshStandardMaterial({ color: 0x00d9ff, emissive: 0x00d9ff, emissiveIntensity: 0.8, metalness: 0.45, roughness: 0.28 });
      const part = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) => { const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); weapon.add(mesh); return mesh; };
      part(new THREE.BoxGeometry(0.12, 0.13, 0.48), dark, 0, 0, 0);
      part(new THREE.CylinderGeometry(0.025, 0.03, 0.52, 10), dark, 0, 0.015, -0.43).rotation.x = Math.PI / 2;
      part(new THREE.BoxGeometry(0.08, 0.2, 0.1), dark, 0, -0.13, 0.08);
      part(new THREE.BoxGeometry(0.1, 0.18, 0.12), trim, 0, -0.12, 0.22);
      const muzzle = new THREE.PointLight(0x00d9ff, 0, 4, 2);
      muzzle.position.set(0, 0, -0.72); weapon.add(muzzle);
      weapon.position.set(0.24, 1.2, 0.12);
      return { weapon, muzzle };
    };

    const createChatBubble = (text: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 192;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = 'rgba(9, 13, 22, 0.94)';
        context.strokeStyle = '#22d3ee';
        context.lineWidth = 6;
        context.fillRect(10, 10, 492, 150);
        context.strokeRect(10, 10, 492, 150);
        context.fillStyle = '#ffffff';
        context.font = 'bold 34px sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        const content = text.length > 72 ? `${text.slice(0, 69)}…` : text;
        const words = content.split(/\s+/);
        const lines: string[] = [];
        let line = '';
        for (const word of words) {
          const nextLine = line ? `${line} ${word}` : word;
          if (context.measureText(nextLine).width > 452 && line) {
            lines.push(line);
            line = word;
          } else {
            line = nextLine;
          }
        }
        if (line) lines.push(line);
        lines.slice(0, 3).forEach((value, index) => {
          context.fillText(value, 256, 48 + index * 42, 452);
        });
        context.fillStyle = 'rgba(9, 13, 22, 0.94)';
        context.beginPath();
        context.moveTo(224, 158);
        context.lineTo(256, 188);
        context.lineTo(288, 158);
        context.closePath();
        context.fill();
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false
      }));
      sprite.scale.set(3.2, 1.2, 1);
      sprite.position.set(0, 3.35, 0);
      return sprite;
    };

    const disposeChatBubble = (bubble: ChatBubble | undefined) => {
      if (!bubble) return;
      bubble.sprite.parent?.remove(bubble.sprite);
      bubble.sprite.material.map?.dispose();
      bubble.sprite.material.dispose();
    };

    // 3. DETAILED 3D WEAPON RIFLE MODEL
    const weaponGroup = new THREE.Group();
    
    // Rifle Stock & Body
    const rifleBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.28, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x252a30, metalness: 0.42, roughness: 0.62 })
    );
    weaponGroup.add(rifleBody);

    // Glowing Plasma Magazine Core
    const magCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.35, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x343b40, roughness: 0.72, metalness: 0.18 })
    );
    magCore.position.set(0, -0.2, 0.1);
    weaponGroup.add(magCore);

    // Scope Sight
    const scopeLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x202a33, metalness: 0.32, roughness: 0.28 })
    );
    scopeLens.rotation.x = Math.PI / 2;
    scopeLens.position.set(0, 0.2, -0.1);
    weaponGroup.add(scopeLens);

    // Muzzle Flash Light
    const muzzleLight = new THREE.PointLight(0x00f3ff, 0, 15);
    muzzleLight.position.set(0, 0, -0.9);
    weaponGroup.add(muzzleLight);
    const slotWeaponParts = new THREE.Group();
    weaponGroup.add(slotWeaponParts);

    // Attach weapon to player hands
    weaponGroup.position.set(0.4, 1.3, -0.4);
    playerGroup.add(weaponGroup);
    // Ensure weapon faces forward (fix mirrored/backwards appearance)
    weaponGroup.rotation.y = Math.PI;

    // ========================================================
    // FULL 360° PITCH & YAW MOUSE LOOK CONTROLS & CAMERA SYSTEM
    // ========================================================

    const keys: Record<string, boolean> = {};
    let pitch = 0;
    let yaw = -Math.PI / 4;
    let isJumping = false;
    let jumpVelocity = 0;
    // Movement velocity vector (units per second)
    const velocity = new THREE.Vector3(0, 0, 0);
    const accel = 80; // acceleration units/sec^2
    const damping = 10; // damping factor
    let activeVehicle: (typeof cityAnimationHandles.vehicles)[number] | undefined;
    let vehicleSpeed = 0;
    let lastVehicleImpactAt = -Infinity;
    const roadSurfaceHeight = 0.08;
    const getGroundHeight = (x: number, z: number) => {
      const { bridge } = cityAnimationHandles;
      const distance = x * bridge.axisX + z * bridge.axisZ;
      const lateral = x * bridge.sideX + z * bridge.sideZ;
      return distance >= bridge.startDistance && distance <= bridge.endDistance &&
        Math.abs(lateral) <= bridge.halfWidth - 1
        ? bridge.heightAt(distance)
        : roadSurfaceHeight;
    };
    const intersectsRotatedRect = (
      x: number,
      z: number,
      radius: number,
      centerX: number,
      centerZ: number,
      halfWidth: number,
      halfDepth: number,
      rotationY: number
    ) => {
      const dx = x - centerX;
      const dz = z - centerZ;
      const cosine = Math.cos(rotationY);
      const sine = Math.sin(rotationY);
      const localX = cosine * dx - sine * dz;
      const localZ = sine * dx + cosine * dz;
      const outsideX = Math.max(Math.abs(localX) - halfWidth, 0);
      const outsideZ = Math.max(Math.abs(localZ) - halfDepth, 0);
      return Math.hypot(outsideX, outsideZ) < radius;
    };
    const canOccupy = (x: number, z: number, radius: number, ignoredVehicle?: typeof activeVehicle) => {
      const { bridge, collisionObstacles } = cityAnimationHandles;
      const distance = x * bridge.axisX + z * bridge.axisZ;
      const lateral = x * bridge.sideX + z * bridge.sideZ;
      if (
        distance >= bridge.startDistance && distance <= bridge.endDistance &&
        Math.abs(lateral) > bridge.halfWidth - radius
      ) return false;
      if (collisionObstacles.some(obstacle =>
        intersectsRotatedRect(
          x,
          z,
          radius,
          obstacle.x,
          obstacle.z,
          obstacle.halfWidth,
          obstacle.halfDepth,
          obstacle.rotationY
        )
      )) return false;
      return cityAnimationHandles.vehicles.every(vehicle =>
        vehicle === ignoredVehicle ||
        !intersectsRotatedRect(
          x,
          z,
          radius,
          vehicle.group.position.x,
          vehicle.group.position.z,
          vehicle.width / 2,
          vehicle.length / 2,
          vehicle.group.rotation.y
        )
      );
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isChatFocusedRef.current) return;
      if (document.pointerLockElement === canvasElement) {
        // Horizontal look: use natural movement (positive movementX -> look right)
        yaw -= e.movementX * 0.0022;
        const pitchDirection = cameraModeRef.current === '3RD' ? 1 : -1;
        pitch += e.movementY * 0.0022 * pitchDirection;
        // Clamp pitch to avoid flipping
        pitch = Math.max(-1.48, Math.min(1.48, pitch));
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // If typing in chat or any form input, do not trigger game controls
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        isChatFocusedRef.current || 
        activeEl?.tagName === 'INPUT' || 
        activeEl?.tagName === 'TEXTAREA' || 
        activeEl?.isContentEditable
      ) {
        if (e.code === 'Escape') {
          chatInputRef.current?.blur();
        }
        return;
      }

      // Quick chat key: T or Enter to focus in-game chat input
      if (e.code === 'KeyT' || e.code === 'Enter') {
        e.preventDefault();
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
        setTimeout(() => {
          chatInputRef.current?.focus();
        }, 50);
        return;
      }

      if (e.code === 'KeyE' || e.code === 'KeyZ') {
        e.preventDefault();
        if (e.repeat) return;
        if (activeVehicle) {
          const vehicleToExit = activeVehicle;
          const exitOffset = new THREE.Vector3(vehicleToExit.width / 2 + 1.2, 0, 0)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), vehicleToExit.group.rotation.y);
          const nearbyExit = {
            x: vehicleToExit.group.position.x + exitOffset.x,
            z: vehicleToExit.group.position.z + exitOffset.z
          };
          const exitPosition = canOccupy(nearbyExit.x, nearbyExit.z, 0.8, vehicleToExit)
            ? nearbyExit
            : { x: 0, z: 20 };
          playerGroup.position.set(
            exitPosition.x,
            getGroundHeight(exitPosition.x, exitPosition.z),
            exitPosition.z
          );
          playerGroup.rotation.y = vehicleToExit.group.rotation.y;
          yaw = vehicleToExit.group.rotation.y;
          playerGroup.visible = true;
          activeVehicle = undefined;
          vehicleSpeed = 0;
          velocity.set(0, 0, 0);
          return;
        }

        const nearbyVehicle = cityAnimationHandles.vehicles.find(vehicle =>
          Math.hypot(
            playerGroup.position.x - vehicle.group.position.x,
            playerGroup.position.z - vehicle.group.position.z
          ) < 6
        );
        if (nearbyVehicle) {
          activeVehicle = nearbyVehicle;
          vehicleSpeed = 0;
          playerGroup.position.copy(nearbyVehicle.group.position);
          playerGroup.rotation.y = nearbyVehicle.group.rotation.y;
          yaw = nearbyVehicle.group.rotation.y;
          velocity.set(0, 0, 0);
          playerGroup.visible = false;
          cameraModeRef.current = '3RD';
          setCameraMode('3RD');
          if (document.pointerLockElement) document.exitPointerLock();
          return;
        }

        const billboardStory = findBillboardStory(new THREE.Vector2(0, 0));
        if (billboardStory) {
          if (document.pointerLockElement) document.exitPointerLock();
          setSelectedBillboardStory(billboardStory);
        }
        return;
      }

      keys[e.code] = true;

      // Toggle 1ST / 3RD Person with V
      if (e.code === 'KeyV') {
        try {
          const next = cameraModeRef.current === '3RD' ? '1ST' : '3RD';
          cameraModeRef.current = next;
          setCameraMode(next);
        } catch (err) {
          console.error('[GodotFoyer] camera toggle failed', err);
        }
      }

      // Jump with Space
      if (e.code === 'Space') {
        e.preventDefault();
        if (!activeVehicle && !isJumping) {
          isJumping = true;
          jumpVelocity = 8.5;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    // ========================================================
    // GAME CONTROLS: FREE AIM, RIGHT-CLICK WALK, WEAPON SWAP
    // ========================================================

    let isRightMouseDown = false;

    const playLaserSound = (slot = activeSlotRef.current) => {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const sounds: Record<number, [OscillatorType, number, number, number]> = {
          1: ['sawtooth', 720, 110, 0.13], 2: ['square', 150, 55, 0.24], 3: ['sawtooth', 95, 38, 0.38], 4: ['triangle', 1250, 180, 0.2],
          5: ['sine', 260, 70, 0.28], 6: ['square', 980, 330, 0.1], 7: ['sawtooth', 540, 220, 0.075], 8: ['triangle', 180, 45, 0.3]
        };
        const [wave, startHz, endHz, duration] = sounds[slot] || sounds[1];
        osc.type = wave;
        osc.frequency.setValueAtTime(startHz, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endHz, ctx.currentTime + duration);

        gain.gain.setValueAtTime(slot === 2 || slot === 3 ? 0.36 : 0.24, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (err) {
        // Audio fallback
      }
    };

    const playWeaponSwapSound = () => {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(960, ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } catch (err) {}
    };

    const slotPlasmaColors: Record<number, number> = {
      1: 0x00f3ff, // Aegis Shield
      2: 0xfacc15, // Golden Node
      3: 0xef4444, // Crimson Blade
      4: 0x06b6d4, // Cyan Rifle Core
      5: 0xa855f7, // Void Orb
      6: 0x10b981, // Emerald Arc
      7: 0xec4899, // Pink Starlight
      8: 0xf97316, // Solar Flare
    };
    const fireIntervals: Record<number, number> = { 1: 280, 2: 820, 3: 1100, 4: 1050, 5: 480, 6: 150, 7: 90, 8: 900 };
    let lastShotAt = 0;

    const updateWeaponSlot = (newSlot: number) => {
      activeSlotRef.current = newSlot;
      setActiveWeaponSlot(newSlot);
      playWeaponSwapSound();

      const col = slotPlasmaColors[newSlot] || 0x00f3ff;
      try {
        slotWeaponParts.clear();
        const accent = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.15, metalness: 0.5, roughness: 0.25 });
        const dark = new THREE.MeshStandardMaterial({ color: 0x111923, metalness: 0.75, roughness: 0.32 });
        const addPart = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, rotX = 0) => {
          const part = new THREE.Mesh(geometry, material); part.position.set(x, y, z); part.rotation.x = rotX; slotWeaponParts.add(part); return part;
        };
        if (newSlot === 2) { [-0.045, 0.045].forEach(x => addPart(new THREE.CylinderGeometry(0.024, 0.032, 0.7, 10), dark, x, 0.02, -0.72, Math.PI / 2)); addPart(new THREE.BoxGeometry(0.24, 0.22, 0.25), accent, 0, -0.18, 0.26); }
        if (newSlot === 3) { addPart(new THREE.CylinderGeometry(0.11, 0.11, 0.72, 12), dark, 0, 0.11, -0.58, Math.PI / 2); addPart(new THREE.TorusGeometry(0.11, 0.025, 8, 20), accent, 0, 0.11, -0.95, Math.PI / 2); }
        if (newSlot === 4) { addPart(new THREE.CylinderGeometry(0.018, 0.025, 0.9, 8), dark, 0, 0.01, -0.75, Math.PI / 2); addPart(new THREE.CylinderGeometry(0.035, 0.035, 0.34, 10), accent, 0, 0.21, -0.08, Math.PI / 2); }
        if (newSlot === 5) { const orb = addPart(new THREE.SphereGeometry(0.16, 16, 12), accent, 0, -0.1, -0.42); orb.scale.set(0.78, 0.78, 1.25); }
        if (newSlot === 6) { [-1, 1].forEach(side => { const coil = addPart(new THREE.TorusGeometry(0.07, 0.018, 6, 16), accent, side * 0.1, 0, -0.66, Math.PI / 2); coil.scale.set(1, 1, 1.5); }); }
        if (newSlot === 7) { addPart(new THREE.BoxGeometry(0.09, 0.08, 0.36), accent, 0, 0.11, -0.32); }
        if (newSlot === 8) { addPart(new THREE.CylinderGeometry(0.15, 0.15, 0.24, 12), dark, 0, -0.17, 0.12, Math.PI / 2); addPart(new THREE.SphereGeometry(0.085, 12, 8), accent, 0, -0.17, 0.12); }
        if (magCore && magCore.material) {
          (magCore.material as THREE.MeshStandardMaterial).color.setHex(col);
          (magCore.material as THREE.MeshStandardMaterial).emissive.setHex(col);
        }
        if (muzzleLight) {
          muzzleLight.color.setHex(col);
        }
        rifleBody.scale.set(newSlot === 2 ? 1.45 : newSlot === 4 ? 0.86 : 1, 1, newSlot === 3 || newSlot === 8 ? 1.32 : 1);
        scopeLens.visible = newSlot === 1 || newSlot === 4 || newSlot === 5;
        magCore.scale.set(newSlot === 2 || newSlot === 8 ? 1.45 : 1, newSlot === 7 ? 0.72 : 1, newSlot === 3 ? 1.65 : 1);
        magCore.material && ((magCore.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.75);
      } catch (e) {}
    };

    // ========================================================
    // STRICT CANVAS-ONLY INTERACTION & POINTER LOCK ISOLATION
    // ========================================================
    const playerRaycaster = new THREE.Raycaster();
    const findBillboardStory = (pointer: THREE.Vector2) => {
      playerRaycaster.setFromCamera(pointer, camera);
      const interactableHits = playerRaycaster.intersectObjects(
        scene.children.filter(object => object !== playerGroup),
        true
      );
      for (const hit of interactableHits) {
        let target: THREE.Object3D | null = hit.object;
        while (target) {
          const story = target.userData.billboardStory as BillboardStory | undefined;
          if (story) return story;
          target = target.parent;
        }
      }
      return undefined;
    };
    const onCanvasMouseDown = (e: MouseEvent) => {
      if (isChatFocusedRef.current) return;

      if (e.button === 0) {
        const bounds = canvasElement.getBoundingClientRect();
        const pointer = document.pointerLockElement === canvasElement
          ? new THREE.Vector2(0, 0)
          : new THREE.Vector2(
            ((e.clientX - bounds.left) / bounds.width) * 2 - 1,
            -((e.clientY - bounds.top) / bounds.height) * 2 + 1
          );
        const billboardStory = findBillboardStory(pointer);
        if (billboardStory) {
          if (document.pointerLockElement) document.exitPointerLock();
          setSelectedBillboardStory(billboardStory);
          return;
        }
        const hit = playerRaycaster.intersectObjects(
          Array.from(remoteMeshes.values(), remote => remote.group),
          true
        )[0];
        let target: THREE.Object3D | null = hit?.object || null;
        while (target && !target.userData.playerId) target = target.parent;
        const player = target?.userData.playerId
          ? useMultiplayerStore.getState().players.get(String(target.userData.playerId))
          : undefined;
        if (player?.civicId && document.pointerLockElement !== canvasElement) {
          if (document.pointerLockElement) document.exitPointerLock();
          navigate(`/profile/${encodeURIComponent(player.civicId)}`);
          return;
        }
      }

      // Only engage pointer lock if clicking directly on the 3D WebGL Canvas
      if (document.pointerLockElement !== canvasElement) {
        try {
          const pointerLockRequest = canvasElement.requestPointerLock?.();
          if (pointerLockRequest instanceof Promise) {
            void pointerLockRequest.catch(error => {
              console.warn('[GodotFoyer] pointer lock request failed', error);
            });
          }
        } catch (error) {
          console.warn('[GodotFoyer] pointer lock request failed', error);
        }
        return; // Do not fire weapon or initiate walking on the lock acquisition click
      }

      // Pointer lock IS active strictly on canvas:
      // Left Click: Shoot weapon
      if (e.button === 0) {
        const now = performance.now();
        const slot = activeSlotRef.current;
        if (now - lastShotAt < (fireIntervals[slot] || 250)) return;
        lastShotAt = now;
        muzzleLight.intensity = 80;
        weaponGroup.position.z = slot === 2 || slot === 3 ? -0.1 : -0.22;
        weaponGroup.rotation.x = slot === 2 || slot === 3 ? -0.2 : -0.12;
        playLaserSound(slot);

        playerRaycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const shotHits = playerRaycaster.intersectObjects(Array.from(remoteMeshes.values(), remote => remote.group), true);
        let hitObject: THREE.Object3D | null = shotHits[0]?.object || null;
        while (hitObject && !hitObject.userData.playerId) hitObject = hitObject.parent;
        const targetId = hitObject?.userData.playerId ? String(hitObject.userData.playerId) : undefined;
        if (targetId) {
          const target = useMultiplayerStore.getState().players.get(targetId);
          if (target?.isAlive && target.health <= ({ 1: 24, 2: 48, 3: 62, 4: 78, 5: 34, 6: 16, 7: 12, 8: 52 }[slot] || 20)) {
            const current = useGameStore.getState().user;
            if (current) useGameStore.getState().updateUser({ stats: { kills: (current.stats?.kills || 0) + 1 } });
          }
        }
        useMultiplayerStore.getState().fireWeapon(slot, targetId);
        const beamEnd = shotHits[0]?.point || camera.position.clone().add(playerRaycaster.ray.direction.clone().multiplyScalar(slot === 4 ? 130 : slot === 2 ? 24 : 70));
        const beamGeometry = new THREE.BufferGeometry().setFromPoints([camera.position.clone(), beamEnd]);
        const beam = new THREE.Line(beamGeometry, new THREE.LineBasicMaterial({ color: slotPlasmaColors[slot], transparent: true, opacity: 0.92 }));
        scene.add(beam);
        window.setTimeout(() => { scene.remove(beam); beam.geometry.dispose(); (beam.material as THREE.Material).dispose(); }, slot === 3 || slot === 8 ? 240 : 95);

        setTimeout(() => {
          muzzleLight.intensity = 0;
        }, 70);
      }

      // Right Click: Hold to Walk Forward
      if (e.button === 2) {
        e.preventDefault();
        isRightMouseDown = true;
      }
    };

    const onWindowMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        isRightMouseDown = false;
      }
    };

    const onCanvasContextMenu = (e: MouseEvent) => {
      // Prevent browser context menu only on 3D canvas so right click walks smoothly
      e.preventDefault();
    };

    const onWindowBlur = () => {
      isRightMouseDown = false;
      Object.keys(keys).forEach(k => { keys[k] = false; });
    };

    // Scroll Wheel: Swap Weapons inside 3D viewport canvas or when locked
    const onCanvasWheel = (e: WheelEvent) => {
      if (isChatFocusedRef.current) return;
      e.preventDefault();
      const dir = e.deltaY > 0 ? 1 : -1;
      const current = activeSlotRef.current;
      let next = current + dir;
      if (next > 8) next = 1;
      if (next < 1) next = 8;
      updateWeaponSlot(next);
    };

    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === canvasElement;
      setIsPointerLocked(locked);
      if (!locked) {
        isRightMouseDown = false;
      }
    };

    canvasElement.addEventListener('mousedown', onCanvasMouseDown);
    canvasElement.addEventListener('contextmenu', onCanvasContextMenu);
    canvasElement.addEventListener('wheel', onCanvasWheel, { passive: false });

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mouseup', onWindowMouseUp);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    // ========================================================
    // ANIMATION & RENDERING LOOP
    // ========================================================

    const clock = new THREE.Clock();
    let frameId: number;
    let lastMoveBroadcast = 0;
    let nextLightningAt = 7 + Math.random() * 12;
    let lightningOffAt = 0;
    let fpsSampleStart = 0;
    let fpsSampleFrames = 0;
    let lastResolutionChange = 0;
    renderScaleRef.current = renderer.getPixelRatio();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      try {
        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();
        fpsSampleFrames += 1;
        if (elapsed - fpsSampleStart >= 2) {
          const sampleDuration = elapsed - fpsSampleStart;
          const measuredFps = fpsSampleFrames / sampleDuration;
          const maximumScale = Math.min(window.devicePixelRatio, pixelCapRef.current);
          const currentScale = renderScaleRef.current;
          let nextScale = currentScale;
          if (measuredFps < 56 && currentScale > 1) {
            nextScale = Math.max(1, currentScale - 0.25);
          } else if (measuredFps >= 59 && elapsed - lastResolutionChange >= 8) {
            nextScale = Math.min(maximumScale, currentScale + 0.125);
          }

          if (nextScale !== currentScale) {
            renderScaleRef.current = nextScale;
            lastResolutionChange = elapsed;
            const width = containerRef.current!.clientWidth;
            const height = containerRef.current!.clientHeight;
            renderer.setPixelRatio(nextScale);
            renderer.setSize(width, height);
            composer.setPixelRatio(nextScale);
            composer.setSize(width, height);
            smaaPass.setSize(width * nextScale, height * nextScale);
          }

          fpsSampleStart = elapsed;
          fpsSampleFrames = 0;
        }
        updateCityAnimation(cityAnimationHandles, elapsed, playerGroup.position, delta);
        if (elapsed >= nextLightningAt) {
          lightning.intensity = 2.8;
          lightningOffAt = elapsed + 0.12;
          nextLightningAt = elapsed + 12 + Math.random() * 18;
        }
        if (lightning.intensity > 0 && elapsed >= lightningOffAt) lightning.intensity = 0;
        // 2. Pedestrian movement and vehicle controls
        const moveDir = new THREE.Vector3();
        const forwardPressed = keys['KeyW'] || keys['ArrowUp'];
        const reversePressed = keys['KeyS'] || keys['ArrowDown'];
        if (forwardPressed || isRightMouseDown) moveDir.z -= 1;
        if (reversePressed) moveDir.z += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) moveDir.x -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) moveDir.x += 1;
        let isMoving = moveDir.length() > 0;

        if (activeVehicle) {
          const steering = Number(keys['KeyA'] || keys['ArrowLeft']) -
            Number(keys['KeyD'] || keys['ArrowRight']);
          const handbrake = keys['Space'];
          const boosting = keys['ShiftLeft'] || keys['ShiftRight'];
          const damagedSpeedFactor = 1 - activeVehicle.damage * 0.0035;
          const maxSpeed = activeVehicle.maxSpeed * damagedSpeedFactor * (boosting ? 1.18 : 1);
          if (steering !== 0 && Math.abs(vehicleSpeed) > 0.05) {
            const speedFactor = THREE.MathUtils.clamp(
              Math.abs(vehicleSpeed) / Math.max(activeVehicle.maxSpeed, 1),
              0.18,
              1
            );
            activeVehicle.group.rotation.y += steering * activeVehicle.steeringRate *
              speedFactor * delta * Math.sign(vehicleSpeed);
          }
          if (forwardPressed) {
            if (vehicleSpeed < 0) {
              vehicleSpeed = Math.min(0, vehicleSpeed + activeVehicle.brakeForce * delta);
            } else {
              vehicleSpeed = Math.min(maxSpeed, vehicleSpeed + activeVehicle.acceleration * (boosting ? 1.35 : 1) * delta);
            }
          } else if (reversePressed) {
            if (vehicleSpeed > 0) {
              vehicleSpeed = Math.max(0, vehicleSpeed - activeVehicle.brakeForce * delta);
            } else {
              vehicleSpeed = Math.max(-activeVehicle.maxReverseSpeed, vehicleSpeed - activeVehicle.acceleration * 0.65 * delta);
            }
          } else {
            vehicleSpeed *= Math.exp(-activeVehicle.coastDrag * delta);
          }
          if (handbrake) vehicleSpeed *= Math.exp(-8 * delta);

          const forward = new THREE.Vector3(0, 0, -1)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), activeVehicle.group.rotation.y);
          const nextX = activeVehicle.group.position.x + forward.x * vehicleSpeed * delta;
          const nextZ = activeVehicle.group.position.z + forward.z * vehicleSpeed * delta;
          if (canOccupy(nextX, nextZ, activeVehicle.collisionRadius, activeVehicle)) {
            const wheelRadius = activeVehicle.wheelRadius;
            activeVehicle.group.position.set(
              nextX,
              Math.max(roadSurfaceHeight, getGroundHeight(nextX, nextZ)),
              nextZ
            );
            activeVehicle.wheels.forEach(wheel => {
              wheel.rotation.x += vehicleSpeed * delta / wheelRadius;
            });
          } else {
            const impactSpeed = Math.abs(vehicleSpeed);
            if (impactSpeed > 3 && elapsed - lastVehicleImpactAt > 0.35) {
              activeVehicle.applyDamage(Math.min(25, (impactSpeed - 2) * 0.8));
              lastVehicleImpactAt = elapsed;
            }
            vehicleSpeed = impactSpeed > 6 ? -Math.sign(vehicleSpeed) * impactSpeed * 0.12 : 0;
          }
          playerGroup.position.copy(activeVehicle.group.position);
          playerGroup.rotation.y = activeVehicle.group.rotation.y;
          yaw = activeVehicle.group.rotation.y;
          velocity.set(0, 0, 0);
          isMoving = Math.abs(vehicleSpeed) > 0.2;
        } else {
          const isRunning = keys['ShiftLeft'] || keys['ShiftRight'];
          const targetSpeed = isRunning ? 14 : 8;
          const desired = new THREE.Vector3(0, 0, 0);
          if (moveDir.length() > 0) {
            moveDir.normalize();
            const rotQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
            moveDir.applyQuaternion(rotQuaternion);
            desired.copy(moveDir).multiplyScalar(targetSpeed);
          }
          velocity.lerp(desired, Math.min(1, 10 * delta));

          if (isJumping) {
            playerGroup.position.y += jumpVelocity * delta;
            jumpVelocity -= 22 * delta;
          }

          const nextX = playerGroup.position.x + velocity.x * delta;
          const nextZ = playerGroup.position.z + velocity.z * delta;
          if (canOccupy(nextX, nextZ, 0.8)) {
            playerGroup.position.x = nextX;
            playerGroup.position.z = nextZ;
          } else {
            velocity.set(0, 0, 0);
          }

          const groundHeight = getGroundHeight(playerGroup.position.x, playerGroup.position.z);
          if (playerGroup.position.y <= groundHeight) {
            playerGroup.position.y = groundHeight;
            isJumping = false;
            jumpVelocity = 0;
          }
        }

        // Local player gait animation on custom decentralized avatar
        const targetMeshY = isMoving ? Math.sin(elapsed * 8) * 0.04 : Math.sin(elapsed * 2) * 0.01;
        localCharacterMesh.position.y = THREE.MathUtils.lerp(localCharacterMesh.position.y, targetMeshY, 0.1);
        const localLimbs = localCharacterMesh.userData.gaitLimbs;
        if (localLimbs) {
          const runSwing = isMoving ? Math.sin(elapsed * 9) * 0.5 : 0;
          localLimbs.leftLeg.rotation.z = THREE.MathUtils.lerp(localLimbs.leftLeg.rotation.z, runSwing, 0.25);
          localLimbs.rightLeg.rotation.z = THREE.MathUtils.lerp(localLimbs.rightLeg.rotation.z, -runSwing, 0.25);
          localLimbs.leftArm.rotation.z = THREE.MathUtils.lerp(localLimbs.leftArm.rotation.z, -runSwing * 0.62, 0.25);
          localLimbs.rightArm.rotation.z = THREE.MathUtils.lerp(localLimbs.rightArm.rotation.z, runSwing * 0.62 - 0.12, 0.25);
        }

        // Hide local character mesh & nametag in 1st person mode so it doesn't block camera
        const isFirstPerson = cameraModeRef.current === '1ST';
        localCharacterMesh.visible = !isFirstPerson;
        localNametag.visible = !isFirstPerson;

        // Broadcast local position to peers (~25Hz)
        const nowMs = performance.now();
        if (nowMs - lastMoveBroadcast > 40) {
          useMultiplayerStore.getState().updatePosition(
            { x: playerGroup.position.x, y: playerGroup.position.y, z: playerGroup.position.z },
            { x: 0, y: playerGroup.rotation.y, z: 0 },
            isMoving
          );
          lastMoveBroadcast = nowMs;
        }

        // Synchronize remote multiplayer players in 3D scene
        const remotePlayers = useMultiplayerStore.getState().players;
        const now = Date.now();
        if (now - lastNearbyMessageRefresh >= 250) {
          latestNearbyMessages.clear();
          useMultiplayerStore.getState().chatHistory.forEach(message => {
            if (!message.proximity || !message.sentAt || now - message.sentAt > 4500 || now < message.sentAt) return;
            const previous = latestNearbyMessages.get(message.playerId);
            if (!previous || (previous.sentAt || 0) < message.sentAt) {
              latestNearbyMessages.set(message.playerId, message);
            }
          });
          lastNearbyMessageRefresh = now;
        }
        const localPlayerId = useMultiplayerStore.getState().localPlayerId;
        const localMessage = latestNearbyMessages.get(localPlayerId);
        if (localMessage) {
          if (localChatBubble.messageId !== localMessage.id) {
            disposeChatBubble(localChatBubble);
            localChatBubble.sprite = createChatBubble(localMessage.text);
            localChatBubble.messageId = localMessage.id;
            playerGroup.add(localChatBubble.sprite);
          }
          localChatBubble.sprite.visible = cameraModeRef.current !== '1ST';
        } else if (localChatBubble.messageId) {
          disposeChatBubble(localChatBubble);
          localChatBubble.messageId = '';
        }
        const activeRemoteIds = new Set<string>();

        remotePlayers.forEach((p, pId) => {
          activeRemoteIds.add(pId);
          let remoteObj = remoteMeshes.get(pId);

          if (!remoteObj) {
            const grp = new THREE.Group();
            grp.userData.playerId = pId;
            const m = createCharacterMesh(p.character || defaultCharacter);
            m.rotation.y = Math.PI;
            grp.add(m);
            const remoteWeaponParts = makeRemoteWeapon();
            m.add(remoteWeaponParts.weapon);

            const tag = createPlayerNametag(p.username || `Citizen_${pId.slice(0, 6)}`, '#a855f7');
            grp.add(tag);

            grp.position.set(p.position.x, p.position.y, p.position.z);
            grp.rotation.y = p.rotation.y;
            scene.add(grp);

            remoteObj = {
              group: grp,
              mesh: m,
              weapon: remoteWeaponParts.weapon,
              muzzle: remoteWeaponParts.muzzle,
              lastShotAt: 0,
              nametag: tag,
              characterRef: p.character,
              username: p.username,
              targetPos: new THREE.Vector3(p.position.x, p.position.y, p.position.z),
              targetRotY: p.rotation.y,
              isMoving: !!p.isMoving,
              animTime: 0
            };
            remoteMeshes.set(pId, remoteObj);
          } else {
            if (remoteObj.characterRef !== p.character) {
              remoteObj.group.remove(remoteObj.mesh);
              const newM = createCharacterMesh(p.character || defaultCharacter);
              newM.rotation.y = Math.PI;
              newM.add(remoteObj.weapon);
              remoteObj.group.add(newM);
              remoteObj.mesh = newM;
              remoteObj.characterRef = p.character;
            }

            if (remoteObj.username !== p.username) {
              remoteObj.group.remove(remoteObj.nametag);
              const newTag = createPlayerNametag(p.username || `Citizen_${pId.slice(0, 6)}`, '#a855f7');
              remoteObj.group.add(newTag);
              remoteObj.nametag = newTag;
              remoteObj.username = p.username;
            }

            remoteObj.targetPos.set(p.position.x, p.position.y, p.position.z);
            remoteObj.targetRotY = p.rotation.y;
            remoteObj.isMoving = !!p.isMoving;

            const slotColor = slotPlasmaColors[p.weaponSlot || 1] || slotPlasmaColors[1];
            remoteObj.muzzle.color.setHex(slotColor);
            remoteObj.weapon.traverse(object => {
              if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshStandardMaterial && object.material.emissive.getHex() !== 0) {
                object.material.emissive.setHex(slotColor);
              }
            });
            remoteObj.weapon.scale.set(p.weaponSlot === 2 ? 1.28 : p.weaponSlot === 4 ? 0.88 : 1, 1, p.weaponSlot === 3 || p.weaponSlot === 8 ? 1.28 : 1);
            if (p.weaponFiredAt && p.weaponFiredAt !== remoteObj.lastShotAt && Date.now() - p.weaponFiredAt < 500) {
              remoteObj.lastShotAt = p.weaponFiredAt;
              remoteObj.muzzle.intensity = 5;
              window.setTimeout(() => { remoteObj.muzzle.intensity = 0; }, 75);
            }

            remoteObj.group.position.lerp(remoteObj.targetPos, Math.min(1, 14 * delta));
            remoteObj.group.rotation.y = THREE.MathUtils.lerp(remoteObj.group.rotation.y, remoteObj.targetRotY, Math.min(1, 14 * delta));

            if (remoteObj.isMoving) {
              remoteObj.animTime += delta * 8;
              remoteObj.group.position.y = remoteObj.targetPos.y + Math.abs(Math.sin(remoteObj.animTime)) * 0.05;
              const limbs = remoteObj.mesh.userData.gaitLimbs;
              if (limbs) {
                limbs.leftLeg.rotation.z = Math.sin(remoteObj.animTime) * 0.48;
                limbs.rightLeg.rotation.z = -Math.sin(remoteObj.animTime) * 0.48;
                limbs.leftArm.rotation.z = -Math.sin(remoteObj.animTime) * 0.3;
                limbs.rightArm.rotation.z = Math.sin(remoteObj.animTime) * 0.3 - 0.12;
              }
            } else {
              remoteObj.group.position.y = THREE.MathUtils.lerp(remoteObj.group.position.y, remoteObj.targetPos.y, 0.1);
              const limbs = remoteObj.mesh.userData.gaitLimbs;
              if (limbs) { limbs.leftLeg.rotation.z = THREE.MathUtils.lerp(limbs.leftLeg.rotation.z, 0, 0.15); limbs.rightLeg.rotation.z = THREE.MathUtils.lerp(limbs.rightLeg.rotation.z, 0, 0.15); limbs.leftArm.rotation.z = THREE.MathUtils.lerp(limbs.leftArm.rotation.z, 0, 0.15); limbs.rightArm.rotation.z = THREE.MathUtils.lerp(limbs.rightArm.rotation.z, -0.12, 0.15); }
            }
          }
        });

        latestNearbyMessages.forEach((message, playerId) => {
          if (playerId === localPlayerId) return;
          const remoteObj = remoteMeshes.get(playerId);
          if (!remoteObj) return;
          if (remoteObj.bubbleMessageId !== message.id) {
            disposeChatBubble(remoteObj.bubble ? { sprite: remoteObj.bubble, messageId: remoteObj.bubbleMessageId || '' } : undefined);
            remoteObj.bubble = createChatBubble(message.text);
            remoteObj.bubbleMessageId = message.id;
            remoteObj.group.add(remoteObj.bubble);
            remoteChatBubbles.set(playerId, { sprite: remoteObj.bubble, messageId: message.id });
          }
        });

        // Clean up disconnected players
        remoteMeshes.forEach((remoteObj, pId) => {
          if (!activeRemoteIds.has(pId)) {
            disposeChatBubble(remoteChatBubbles.get(pId));
            remoteChatBubbles.delete(pId);
            scene.remove(remoteObj.group);
            remoteMeshes.delete(pId);
          }
        });
        remoteChatBubbles.forEach((bubble, playerId) => {
          if (!latestNearbyMessages.has(playerId)) {
            disposeChatBubble(bubble);
            remoteChatBubbles.delete(playerId);
            const remoteObj = remoteMeshes.get(playerId);
            if (remoteObj) {
              remoteObj.bubble = undefined;
              remoteObj.bubbleMessageId = undefined;
            }
          }
        });

        // Weapon recoil smoothing
        weaponGroup.position.z = THREE.MathUtils.lerp(weaponGroup.position.z, -0.4, 0.08);
        weaponGroup.rotation.x = THREE.MathUtils.lerp(weaponGroup.rotation.x, 0, 0.08);

        // The character model faces local -Z; keep it aligned with camera-forward movement.
        const desiredYaw = yaw;
        playerGroup.rotation.y = THREE.MathUtils.lerp(playerGroup.rotation.y, desiredYaw, 0.14);

        // 3. CAMERA MODES & 360° PITCH/YAW POSITIONING
        if (cameraModeRef.current === '1ST') {
          const cockpitOffset = activeVehicle
            ? new THREE.Vector3(0, 0, activeVehicle.cockpitOffsetZ)
              .applyAxisAngle(new THREE.Vector3(0, 1, 0), activeVehicle.group.rotation.y)
            : new THREE.Vector3();
          camera.position.set(
            playerGroup.position.x + cockpitOffset.x,
            playerGroup.position.y + (activeVehicle ? activeVehicle.cockpitHeight : 2.45),
            playerGroup.position.z + cockpitOffset.z
          );
          // Use quaternion from Euler to avoid gimbal issues
          camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));

          // Position weapon in front of 1ST person view (follow camera)
          weaponGroup.visible = !activeVehicle;
          if (!activeVehicle) {
            weaponGroup.position.set(0.25, 2.1, -0.5);
            weaponGroup.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
          }
        } else {
          weaponGroup.visible = true;
          const camDistance = activeVehicle ? 9 : 4.8;
          const camX = playerGroup.position.x + Math.sin(yaw) * Math.cos(pitch) * camDistance;
          const camY = playerGroup.position.y + (activeVehicle ? 3.4 : 2.15) + Math.sin(pitch) * camDistance;
          const camZ = playerGroup.position.z + Math.cos(yaw) * Math.cos(pitch) * camDistance;

          camera.position.set(camX, Math.max(0.5, camY), camZ);
          camera.lookAt(
            playerGroup.position.x,
            playerGroup.position.y + (activeVehicle ? 1.2 : 1.35),
            playerGroup.position.z
          );

          // Position weapon in player hands in 3RD person view
          weaponGroup.position.set(0.4, 1.3, -0.4);
        }

        // Use composer if available for postprocessing
        try {
          (composer as any).render();
        } catch (e) {
          composer.render();
        }
      } catch (err) {
        console.error('[GodotFoyer] render loop error', err)
        showFallback('Renderer failed — see console for details')
        setupError = true
        cancelAnimationFrame(frameId)
      }
    };

    animate();

    // WebGL context lost handling
    const onContextLost = (e: Event) => {
      e.preventDefault()
      console.error('[GodotFoyer] WebGL context lost')
      showFallback('WebGL context lost — reload the page')
      setupError = true
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost as EventListener)

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      try { composer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight); } catch {}
      try { composer.setPixelRatio(renderer.getPixelRatio()); } catch {}
      try {
        const pr2 = renderer.getPixelRatio();
        (smaaPass as any).setSize(containerRef.current.clientWidth * pr2, containerRef.current.clientHeight * pr2);
      } catch {}
    };
    window.addEventListener('resize', handleResize);

    return () => {
      sceneDisposed = true;
      window.removeEventListener('billboard_broadcast_changed', handleBillboardBroadcast);
      window.removeEventListener('civicverse_videos_changed', handleBillboardBroadcast);
      if (civicWatchMediaTimer !== undefined) window.clearInterval(civicWatchMediaTimer);
      if (billboardRotationTimer !== undefined) window.clearInterval(billboardRotationTimer);
      cancelAnimationFrame(frameId);
      canvasElement.removeEventListener('mousedown', onCanvasMouseDown);
      canvasElement.removeEventListener('contextmenu', onCanvasContextMenu);
      canvasElement.removeEventListener('wheel', onCanvasWheel);

      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mouseup', onWindowMouseUp);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      if (document.pointerLockElement === canvasElement) {
        try { document.exitPointerLock(); } catch {}
      }
      try {
        renderer.domElement.removeEventListener('webglcontextlost', onContextLost as EventListener)
      } catch {}
      disposeChatBubble(localChatBubble);
      remoteChatBubbles.forEach(disposeChatBubble);
      remoteChatBubbles.clear();
      try { renderer.dispose(); } catch (e) {}
    };

    } catch (err) {
      console.error('[GodotFoyer] setup error', err)
      showFallback('Failed to initialize 3D scene — see console')
      setupError = true
    }

  }, []); // Scene built once, camera mode toggles via cameraModeRef without crash!

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-[#1a0628] overflow-hidden select-none cursor-crosshair"
    >
      {/* 3D Canvas target */}
      <canvas ref={canvasRef} id="canvas" className="absolute inset-0 w-full h-full block" />
      {sceneErrorMessage && (
        <div role="alert" className="absolute inset-0 z-50 flex items-center justify-center bg-[#080b14]/95 p-6 text-center font-mono text-sm text-rose-200">
          {sceneErrorMessage}
        </div>
      )}

      {/* ======================================================== */}
      {/* FPS CROSSHAIR (WHEN IN 1ST PERSON MODE)                  */}
      {/* ======================================================== */}
      {cameraMode === '1ST' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-cyan-400/90 flex items-center justify-center shadow-[0_0_8px_#00f3ff]">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
            </div>
            <div className="absolute -top-3 w-0.5 h-2 bg-cyan-400" />
            <div className="absolute -bottom-3 w-0.5 h-2 bg-cyan-400" />
            <div className="absolute -left-3 h-0.5 w-2 bg-cyan-400" />
            <div className="absolute -right-3 h-0.5 w-2 bg-cyan-400" />
          </div>
        </div>
      )}

      <div className="absolute left-4 top-4 z-30 w-56 rounded-xl border border-cyan-400/35 bg-[#07101c]/85 p-3 font-mono text-[10px] text-slate-100 shadow-[0_0_22px_rgba(0,0,0,.45)] pointer-events-none">
        <div className="flex items-center justify-between gap-2"><span className="font-black uppercase tracking-widest text-cyan-200">{FOYER_WEAPON_NAMES[activeWeaponSlot] || 'Pulse Rifle'}</span><span className="text-emerald-200">{Math.max(0, localHealth)} HP</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full transition-all ${localHealth < 35 ? 'bg-rose-500' : 'bg-emerald-400'}`} style={{ width: `${Math.max(0, Math.min(100, localHealth))}%` }} /></div>
        <div className="mt-2 flex items-center justify-between text-slate-300"><span>1–8 / mouse wheel</span><span>K {user?.stats?.kills || 0} · D {user?.stats?.deaths || 0}</span></div>
        <div className="mt-1 text-[9px] text-slate-400">Aim + click to fire · approach another citizen to duel</div>
      </div>

      {selectedBillboardStory && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/65 p-4 pointer-events-auto"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setSelectedBillboardStory(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="billboard-story-title"
            className="w-full max-w-lg rounded-2xl border border-cyan-400/40 bg-[#08111e] p-5 text-white shadow-[0_0_40px_rgba(6,182,212,0.2)]"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">{selectedBillboardStory.category}</p>
                <h2 id="billboard-story-title" className="mt-1 text-lg font-bold leading-snug">{selectedBillboardStory.title}</h2>
                <p className="mt-1 text-xs text-gray-400">Shared by {selectedBillboardStory.author}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBillboardStory(null)}
                className="rounded-lg p-2 text-gray-300 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                aria-label="Close billboard story"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {selectedBillboardStory.videoUrl && (
              <video
                src={selectedBillboardStory.videoUrl}
                className="mb-4 max-h-56 w-full rounded-lg bg-black/30 object-contain"
                controls
                muted
                playsInline
              />
            )}
            {!selectedBillboardStory.videoUrl && selectedBillboardStory.imageUrl && (
              <img src={selectedBillboardStory.imageUrl} alt="" className="mb-4 max-h-56 w-full rounded-lg bg-black/30 object-contain" />
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openBillboardSource}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-white"
              >
                {selectedBillboardStory.sourceUrl === selectedBillboardStory.profileUrl
                  ? 'Open contributor profile'
                  : 'Open source'}
              </button>
              {selectedBillboardStory.profileUrl && selectedBillboardStory.sourceUrl !== selectedBillboardStory.profileUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const profileUrl = selectedBillboardStory.profileUrl;
                    if (!profileUrl) return;
                    navigate(profileUrl);
                    setSelectedBillboardStory(null);
                  }}
                  className="rounded-lg border border-cyan-400/40 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-400/10 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  View contributor profile
                </button>
              )}
              {selectedBillboardStory.authorId && selectedBillboardStory.authorId === user?.civicId && (
                <button
                  type="button"
                  onClick={() => {
                    navigate('/vault');
                    setSelectedBillboardStory(null);
                  }}
                  className="rounded-lg border border-fuchsia-400/40 px-4 py-2 text-sm font-bold text-fuchsia-100 hover:bg-fuchsia-400/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                >
                  Open my Vault
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Controls HUD Badge */}
      <div className="hidden absolute top-12 left-1/2 -translate-x-1/2 z-30 max-w-[min(760px,85vw)] rounded-xl border border-cyan-500/40 bg-[#090d16]/90 px-4 py-2 text-center font-mono text-[10px] leading-relaxed text-gray-200 shadow-[0_0_15px_rgba(0,0,0,0.6)] pointer-events-none">
        <div><span className="font-bold text-cyan-300">HOW TO USE</span><span className="text-white"> · Right-click walks · E near a car to drive or exit · Click a billboard/building or aim + E for links · V camera · Scroll hotbar</span></div>
        <div className="text-gray-300">Chat below: type or tap an emoji to send · Nearby chat reaches citizens within 30 m; switch to Lobby for everyone</div>
      </div>

      {/* Quality Controls */}
      <div className="hidden absolute top-4 right-4 z-30 flex items-center gap-2 bg-[#090d16]/80 border border-cyan-500/40 backdrop-blur-md px-3 py-2 rounded-xl text-xs text-white">
        <div className="flex flex-col mr-2">
          <div className="font-bold text-[11px] mb-1">AA</div>
          <div className="flex gap-1">
            <button onClick={() => applyAAMode('off')} className={`px-2 py-0.5 rounded ${aaMode==='off' ? 'bg-gray-600' : 'bg-transparent'}`}>Off</button>
            <button onClick={() => applyAAMode('smaa')} className={`px-2 py-0.5 rounded ${aaMode==='smaa' ? 'bg-cyan-600' : 'bg-transparent'}`}>SMAA</button>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="font-bold text-[11px] mb-1">Quality</div>
          <div className="flex gap-1">
            <button onClick={() => applyPixelCap(1)} className={`px-2 py-0.5 rounded ${pixelCap===1 ? 'bg-gray-600' : 'bg-transparent'}`}>1x</button>
            <button onClick={() => applyPixelCap(1.25)} className={`px-2 py-0.5 rounded ${pixelCap===1.25 ? 'bg-cyan-600' : 'bg-transparent'}`}>1.25x</button>
            <button onClick={() => applyPixelCap(2)} className={`px-2 py-0.5 rounded ${pixelCap===2 ? 'bg-transparent border border-cyan-500' : 'bg-transparent'}`}>2x</button>
            <button onClick={() => applyPixelCap(3)} className={`px-2 py-0.5 rounded ${pixelCap===3 ? 'bg-transparent border border-cyan-500' : 'bg-transparent'}`}>3x</button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* IN-GAME HUD OVERLAYS (MATCHING FOYER_FORMAT.JPG EXACTLY)  */}
      {/* ======================================================== */}

      {/* 0. TOP-LEFT OVERLAY: MULTIPLAYER LIVE STATUS & 20-CITIZEN LOBBY */}
      <div className="hidden absolute top-4 left-4 z-30 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 bg-[#090d16]/90 border border-emerald-500/50 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
          <span className="text-xs font-black text-white tracking-wider uppercase">
            {currentLobbyName} • {1 + peerCount}/20 CITIZENS
          </span>
          <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
            {connectionMode === 'mesh' ? 'P2P MESH' : connectionMode === 'websocket' ? 'WS SERVER' : 'P2P'}
          </span>
        </div>

        <button 
          onClick={() => setShowLobbyModal(true)}
          className="flex items-center gap-1.5 bg-[#0e1626]/90 border border-cyan-500/50 hover:border-cyan-400 text-cyan-400 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(0,217,255,0.25)] transition-all"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Switch Lobby</span>
        </button>

        <button 
          onClick={() => setShowTipModal(true)}
          className="flex items-center gap-1.5 bg-neon-pink/20 border border-neon-pink/50 hover:bg-neon-pink/30 text-neon-pink text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(255,0,128,0.25)] transition-all"
        >
          <Coins className="w-3.5 h-3.5" />
          <span>1% UBI Tip</span>
        </button>
      </div>

      {/* LOBBY INSTANCE SELECTOR MODAL (20 PLAYERS / ROOM) */}
      {showLobbyModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md pointer-events-auto">
          <div className="bg-[#0b121f] border border-cyan-500/60 rounded-2xl p-6 max-w-md w-full shadow-[0_0_40px_rgba(0,217,255,0.3)]">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white uppercase tracking-wider">Lobby Instances (20 Max)</h3>
              </div>
              <button onClick={() => setShowLobbyModal(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              To guarantee optimal 60+ FPS physics and networking, each Gathering Grounds district instance is capped at 20 citizens.
            </p>
            <div className="space-y-2.5 mb-6">
              {availableLobbies.map((lobby) => (
                <div 
                  key={lobby.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    lobby.id === currentLobbyId 
                      ? 'bg-cyan-500/20 border-cyan-400 text-white' 
                      : 'bg-[#121927] border-gray-800 hover:border-gray-700 text-gray-300'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-xs">{lobby.name}</h4>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {lobby.id === currentLobbyId ? 1 + peerCount : lobby.playerCount}/20 Citizens
                    </span>
                  </div>
                  {lobby.id === currentLobbyId ? (
                    <span className="text-[10px] font-black uppercase text-cyan-400 bg-cyan-400/20 px-2 py-1 rounded-full">Current</span>
                  ) : (
                    <button
                      onClick={() => {
                        switchLobby(lobby.id);
                        setShowLobbyModal(false);
                      }}
                      className="text-[10px] font-black uppercase text-black bg-cyan-400 hover:bg-cyan-300 px-3 py-1 rounded-full transition-all"
                    >
                      Join
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowLobbyModal(false)} 
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-wider text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 1% UBI PASSIVE CONTRIBUTION MODAL */}
      {showTipModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md pointer-events-auto">
          <div className="bg-[#0b121f] border border-neon-pink/60 rounded-2xl p-6 max-w-md w-full shadow-[0_0_40px_rgba(255,0,128,0.3)]">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-neon-pink" />
                <h3 className="text-base font-black text-white uppercase tracking-wider">Passive UBI Microtransaction</h3>
              </div>
              <button onClick={() => { setShowTipModal(false); setTipSuccess(''); }} className="text-gray-400 hover:text-white text-lg">✕</button>
            </div>
            <p className="text-xs text-gray-300 mb-4 leading-relaxed">
              Every micro-payment in the Civicverse automatically deposits a 1% dividend into the Sovereign Community UBI Pool. Capitalism reimagined: citizen-owned micro-dividends.
            </p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block mb-1">Contribution Amount (CIVIC)</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['1.0', '5.0', '10.0', '25.0'].map(val => (
                    <button
                      key={val}
                      onClick={() => setTipAmount(val)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        tipAmount === val ? 'bg-neon-pink text-black border-neon-pink' : 'bg-[#121927] border-gray-800 text-gray-400'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <input 
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  className="w-full bg-[#121927] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-neon-pink"
                />
              </div>

              <div className="bg-black/50 p-3 rounded-xl border border-white/5 space-y-1 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Gross Micro-Payment:</span>
                  <span className="font-mono text-white">{parseFloat(tipAmount) || 0} CIVIC</span>
                </div>
                <div className="flex justify-between text-neon-pink font-bold">
                  <span>1% Sovereign UBI Cut:</span>
                  <span className="font-mono">+{(Number(tipAmount || 0) * 0.01).toFixed(4)} CIVIC</span>
                </div>
              </div>

              {tipSuccess && (
                <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 font-mono text-xs font-bold text-center animate-bounce">
                  {tipSuccess}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  try {
                    const amt = parseFloat(tipAmount) || 5.0;
                    await useGameStore.getState().processMicrotransaction?.(amt, 'Gathering Grounds', 'In-Game Foyer Contribution');
                    setTipSuccess(`✓ Microtransaction of ${amt} CIVIC sent! ${(amt * 0.01).toFixed(3)} CIVIC routed to UBI Pool.`);
                    setTimeout(() => {
                      setShowTipModal(false);
                      setTipSuccess('');
                    }, 2500);
                  } catch (e: any) {
                    alert(e.message || 'Transaction failed');
                  }
                }}
                className="flex-1 py-3 bg-neon-pink hover:bg-white text-black font-black uppercase text-xs rounded-xl shadow-lg shadow-neon-pink/30 transition-all"
              >
                Broadcast Micro-Payment
              </button>
              <button 
                onClick={() => { setShowTipModal(false); setTipSuccess(''); }} 
                className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-wider text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP-LEFT OVERLAY: ACTIVE QUEST */}
      <div className="hidden absolute top-16 left-4 z-20 w-64 bg-[#0d131f]/85 backdrop-blur-md border border-[#1e293b] rounded-xl p-3.5 shadow-2xl text-white pointer-events-auto">
        <div className="flex items-center justify-between border-b border-gray-800/60 pb-2 mb-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            <span className="text-cyan-400 font-extrabold">ACTIVE QUEST</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="text-gray-400 hover:text-white p-0.5"><ChevronDown className="w-3.5 h-3.5" /></button>
            <button className="text-gray-400 hover:text-white p-0.5"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        <h4 className="text-sm font-bold text-white mb-1">Voices of the People</h4>
        <p className="text-[11px] text-gray-300 mb-2">Speak to citizens in New District</p>

        <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden mb-3 border border-gray-800">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-[66%]" />
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-400 font-semibold uppercase text-[10px]">REWARD</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-cyan-400 font-bold"><Zap className="w-3 h-3 fill-current" /> 250 CVC</span>
            <span className="flex items-center gap-1 text-purple-400 font-bold"><Shield className="w-3 h-3" /> 100 XP</span>
          </div>
        </div>
      </div>

      {/* Lobby players are linked to public profiles by Civic ID. */}
      <div className="absolute top-4 left-4 z-20 w-64 max-w-[48vw] rounded-xl border border-fuchsia-500/30 bg-[#090d16]/90 p-3 shadow-2xl backdrop-blur-md pointer-events-auto">
        <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-fuchsia-200">
          <span>Lobby citizens</span><span>{visiblePlayers.length}</span>
        </div>
        <input value={playerSearch} onChange={event => setPlayerSearch(event.target.value)} placeholder="Search username or Civic ID"
          className="mb-2 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-[10px] text-white placeholder:text-gray-500" />
        <div className="max-h-36 space-y-1 overflow-y-auto">
          {visiblePlayers.map(player => (
            <button key={player.id} disabled={!player.civicId} onClick={() => player.civicId && navigate(`/profile/${encodeURIComponent(player.civicId)}`)}
              className="flex w-full items-center justify-between gap-2 rounded-lg bg-white/5 px-2 py-1.5 text-left text-[10px] hover:bg-fuchsia-500/15 disabled:cursor-default disabled:opacity-70">
              <span className="truncate font-bold text-white">{player.username}</span>
              <span className="shrink-0 text-cyan-300">{player.civicId ? 'PROFILE' : 'GUEST'}</span>
            </button>
          ))}
          {!visiblePlayers.length && <p className="py-2 text-center text-[10px] text-gray-500">No other citizens in this lobby</p>}
        </div>
      </div>

      {/* 2. TOP-RIGHT OVERLAY: CIRCULAR MINIMAP */}
      <div className="hidden absolute top-4 right-4 z-20 flex flex-col items-center pointer-events-auto">
        <div className="relative w-36 h-36 rounded-full bg-[#080d16]/90 border-2 border-cyan-500/40 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.3)] overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 border border-cyan-500/10 rounded-full m-3" />
          <div className="absolute inset-0 border border-cyan-500/10 rounded-full m-6" />
          <div className="absolute top-1 text-[10px] font-black text-cyan-400">N</div>
          
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full animate-spin duration-3000" />
          <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-white shadow-[0_0_8px_#00f3ff] z-10" />
          <div className="absolute top-6 left-8 w-2 h-2 bg-pink-500 rounded-full shadow-[0_0_6px_#ff00aa]" />
        </div>

        <div className="mt-1.5 text-center">
          <p className="text-white text-xs font-bold tracking-wide drop-shadow">New District</p>
          <p className="text-[10px] text-gray-400 font-mono">12:45 PM • 21°C</p>
        </div>
      </div>

      {/* 3. BOTTOM-LEFT OVERLAY: REAL-TIME DISTRICT CHAT & MULTIPLAYER LOBBY */}
      <div className="absolute bottom-20 left-4 z-20 w-80 max-w-sm bg-[#090d16]/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3 shadow-2xl pointer-events-auto">
        <div className="flex items-center justify-between gap-1.5 mb-2 text-[10px] font-bold text-gray-300 border-b border-gray-800/60 pb-1.5">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="font-extrabold uppercase tracking-wider"># {nearbyChat ? 'Nearby Chat' : 'Lobby Chat'}</span>
          </div>
          <button type="button" onClick={() => setNearbyChat(value => !value)} className="rounded border border-cyan-400/30 px-2 py-1 text-[9px] font-bold text-cyan-200 hover:bg-cyan-400/10">
            {nearbyChat ? 'NEARBY · 30M' : 'LOBBY-WIDE'}
          </button>
        </div>

        {incomingLobbyInvites.length > 0 && <div className="my-2 space-y-1 rounded-lg border border-fuchsia-400/30 bg-fuchsia-950/30 p-2">
          {incomingLobbyInvites.map(invite => <div key={invite.id} className="flex items-center justify-between gap-2 text-[10px]">
            <span className="min-w-0 truncate text-fuchsia-100">{invite.senderUsername} invited you · {invite.lobbyName}</span>
            <button type="button" onClick={() => useMultiplayerStore.getState().acceptLobbyInvite(invite.id)} className="shrink-0 rounded bg-fuchsia-300 px-2 py-1 font-black text-slate-950">JOIN</button>
            <button type="button" onClick={() => useMultiplayerStore.getState().dismissLobbyInvite(invite.id)} className="shrink-0 px-1 text-slate-400" aria-label="Dismiss lobby invitation">×</button>
          </div>)}
        </div>}

        {onlineFriends.some(friend => friendCivicIds.includes(friend.civicId)) && <div className="my-2 max-h-20 space-y-1 overflow-y-auto border-b border-white/10 pb-2">
          {onlineFriends.filter(friend => friendCivicIds.includes(friend.civicId)).map(friend => <div key={friend.civicId} className="flex items-center justify-between gap-2 text-[10px]">
            <span className="min-w-0 truncate text-emerald-100">{friend.username} · {friend.lobbyName}</span>
            <button type="button" onClick={() => useMultiplayerStore.getState().inviteFriendToLobby(friend.civicId)} className="shrink-0 rounded border border-cyan-300/30 px-2 py-1 font-bold text-cyan-200 hover:bg-cyan-300/10">INVITE</button>
          </div>)}
        </div>}

        {/* Live chat message feed */}
        <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 mb-2.5 text-[11px] scrollbar-thin">
          {chatHistory.filter(msg => !msg.isSystem && !msg.channelId).slice(-6).map((msg) => (
            <div key={msg.id} className="leading-tight break-words">
              <span className={`font-bold mr-1.5 ${msg.color || 'text-cyan-400'}`}>{msg.username}:</span>
              <span className="text-gray-200">{msg.text}</span>
              {msg.proximity && <span className="ml-1 text-[8px] uppercase text-fuchsia-300">Nearby</span>}
            </div>
          ))}
        </div>

        {/* In-game HUD interactive chat input */}
        <form onSubmit={handleSendHudChat} className="relative flex items-center">
          <input
            ref={chatInputRef}
            type="text"
            value={hudChatInput}
            onChange={(e) => setHudChatInput(e.target.value)}
            onFocus={() => {
              isChatFocusedRef.current = true;
              if (document.pointerLockElement) document.exitPointerLock();
            }}
            onBlur={() => {
              isChatFocusedRef.current = false;
            }}
            placeholder="Type message & Enter to send..."
            className="w-full bg-[#121824] border border-[#232f45] rounded-lg py-1.5 pl-2.5 pr-8 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
          <button type="submit" className="absolute right-1.5 text-cyan-400 hover:text-cyan-300 p-1">
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="mt-1.5 flex items-center gap-1" aria-label="Quick-send emojis">
          {['👋', '😀', '❤️', '👍', '🎉', '😂'].map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => useMultiplayerStore.getState().sendMessage(emoji, 'text-cyan-400', nearbyChat, undefined, nearbyChat ? 'nearby' : 'lobby')}
              className="rounded px-1.5 py-0.5 text-sm hover:bg-cyan-400/15 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              aria-label={`Send ${emoji} to ${nearbyChat ? 'nearby chat' : 'lobby chat'}`}
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          <span className="ml-auto text-[9px] text-gray-500">{nearbyChat ? '30 m range' : 'lobby-wide'}</span>
        </div>
      </div>

    </div>
  );
};

// Temporary placeholder to avoid invalid hook calls while debugging duplicate-React issues.
// Re-enable the real implementation now that duplicate-React issues are addressed.
export const GodotFoyer: React.FC<GodotFoyerProps> = GodotFoyerImpl
