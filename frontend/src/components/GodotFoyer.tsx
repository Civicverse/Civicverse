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
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { 
  Shield, 
  ChevronDown, 
  X, 
  MapPin, 
  Zap, 
  MessageSquare,
  Camera,
  Crosshair,
  Volume2,
  Send,
  Coins,
  Users
} from 'lucide-react';
import { useMultiplayerStore } from '../services/multiplayer';
import { createCharacterMesh, createPlayerNametag } from '../lib/characterFactory';

interface GodotFoyerProps {
  onExit?: () => void;
}

interface BillboardStory {
  id: string;
  title: string;
  author: string;
  category: string;
  imageUrl?: string;
  sourceUrl: string;
  profileUrl?: string;
  authorId?: string;
}

interface ChatBubble {
  sprite: THREE.Sprite;
  messageId: string;
}

const GodotFoyerImpl: React.FC<GodotFoyerProps> = ({ onExit }) => {
  const { user } = useGameStore();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<any>(null);
  const smaaRef = useRef<any>(null);
  
  // React HUD states
  const [cameraMode, setCameraMode] = useState<'3RD' | '1ST'>('3RD');
  const [activeSlot, setActiveSlot] = useState(4);
  const [ammo, setAmmo] = useState({ current: 30, max: 120 });
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [aaMode, setAaMode] = useState<'off' | 'smaa'>('smaa');
  const [pixelCap, setPixelCap] = useState<number>(3);

  // Multiplayer state (20 per Lobby Instance)
  const chatHistory = useMultiplayerStore(state => state.chatHistory);
  const players = useMultiplayerStore(state => state.players);
  const peerCount = useMultiplayerStore(state => state.peerCount);
  const connectionMode = useMultiplayerStore(state => state.connectionMode);
  const currentLobbyId = useMultiplayerStore(state => state.currentLobbyId);
  const currentLobbyName = useMultiplayerStore(state => state.currentLobbyName);
  const availableLobbies = useMultiplayerStore(state => state.availableLobbies);
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
    useMultiplayerStore.getState().sendMessage(hudChatInput.trim(), 'text-cyan-400', nearbyChat);
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

  const toggleCameraMode = () => {
    const nextMode = cameraModeRef.current === '3RD' ? '1ST' : '3RD';
    cameraModeRef.current = nextMode;
    console.debug('[GodotFoyer] toggleCameraMode ->', nextMode)
    setCameraMode(nextMode);
  };

  const applyAAMode = (mode: 'off' | 'smaa') => {
    setAaMode(mode);
    try {
      if (smaaRef.current) smaaRef.current.enabled = mode === 'smaa';
    } catch (e) {}
  };

  const applyPixelCap = (cap: number) => {
    setPixelCap(cap);
    try {
      const pr = Math.min(window.devicePixelRatio, cap);
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
      if (!containerRef.current) return
      while (containerRef.current.firstChild) containerRef.current.removeChild(containerRef.current.firstChild)
      const fallback = document.createElement('div')
      fallback.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#0b0220,#000);color:#fff;'
      fallback.innerText = msg
      containerRef.current.appendChild(fallback)
    }

    try {

    // ========================================================
    // AAA THREE.JS GAME ENGINE & SYNTHWAVE ISLAND CITY
    // ========================================================

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x11182f);
    scene.fog = new THREE.FogExp2(0x3b3250, 0.0009);

    // -----------------------------
    // Procedural PBR Texture Helpers
    // -----------------------------
    const makeCanvas = (w: number, h: number) => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      return c;
    };

    const canvasToTexture = (c: HTMLCanvasElement) => {
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(4, 4);
      t.needsUpdate = true;
      return t;
    };

    const noise = (w: number, h: number, intensity = 0.12) => {
      const c = makeCanvas(w, h);
      const ctx = c.getContext('2d')!;
      const img = ctx.createImageData(w, h);
      for (let i = 0; i < w * h; i++) {
        const v = Math.floor((Math.random() - 0.5) * 255 * intensity + 128);
        img.data[i * 4 + 0] = v;
        img.data[i * 4 + 1] = v;
        img.data[i * 4 + 2] = v;
        img.data[i * 4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      return c;
    };

    // Create a simple embossed normal map from a grayscale heightmap canvas
    const normalFromHeight = (heightCanvas: HTMLCanvasElement) => {
      const w = heightCanvas.width, h = heightCanvas.height;
      const c = makeCanvas(w, h);
      const ctxH = heightCanvas.getContext('2d')!;
      const src = ctxH.getImageData(0, 0, w, h).data;
      const ctx = c.getContext('2d')!;
      const img = ctx.createImageData(w, h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const l = src[i];
          const lR = src[i + 4] || l;
          const lD = src[i + w * 4] || l;
          const dx = (lR - l) / 255;
          const dy = (lD - l) / 255;
          const nx = Math.floor((dx * 0.5 + 0.5) * 255);
          const ny = Math.floor((dy * 0.5 + 0.5) * 255);
          const nz = Math.floor(255 * 0.9);
          img.data[i + 0] = nx;
          img.data[i + 1] = ny;
          img.data[i + 2] = nz;
          img.data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      return c;
    };

    const generatePBR = (name: string, baseColor = '#181c2e') => {
      const size = 512;
      // Albedo: base color with subtle noise and vignette
      const alc = makeCanvas(size, size);
      const actx = alc.getContext('2d')!;
      actx.fillStyle = baseColor;
      actx.fillRect(0, 0, size, size);
      const n = noise(size, size, 0.08);
      actx.globalAlpha = 0.35;
      actx.drawImage(n, 0, 0, size, size);

      // Roughness: inverted noise map (lighter = rougher)
      const rough = noise(size, size, 0.6);

      // Height -> normal
      const norm = normalFromHeight(n);

      return {
        albedo: canvasToTexture(alc),
        normal: canvasToTexture(norm),
        roughness: canvasToTexture(rough),
        metalness: 0.2
      };
    };

    const generateStainlessSteelPBR = () => {
      const size = 512;
      const alc = makeCanvas(size, size);
      const actx = alc.getContext('2d')!;
      actx.fillStyle = '#2b3342';
      actx.fillRect(0, 0, size, size);
      for (let y = 0; y < size; y++) {
        const shade = Math.floor(190 + Math.random() * 65);
        const a = 0.04 + Math.random() * 0.12;
        actx.fillStyle = `rgba(${shade}, ${shade}, ${shade + 12}, ${a})`;
        actx.fillRect(0, y, size, 1);
      }
      const norm = normalFromHeight(alc);
      const rough = noise(size, size, 0.35);
      return {
        albedo: canvasToTexture(alc),
        normal: canvasToTexture(norm),
        roughness: canvasToTexture(rough),
        metalness: 0.92
      };
    };

    const camera = new THREE.PerspectiveCamera(
      70, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.2, 
      60000
    );

    // Renderer setup with high tone mapping exposure for bright visuals
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    // Set pixel ratio high enough for crisp visuals but capped for performance
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // Reduce exposure to avoid HDR clipping and shimmering
    renderer.toneMappingExposure = 0.9;
    // Use physically correct light intensity scaling to avoid extreme per-light values
    renderer.physicallyCorrectLights = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    rendererRef.current = renderer;
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

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
      renderer.setPixelRatio(pr);
      composer.setPixelRatio(pr);
      smaaPass.setSize(containerRef.current.clientWidth * pr, containerRef.current.clientHeight * pr);
      smaaPass.enabled = aaMode === 'smaa';
    } catch (e) {}

    // Atmospheric scattering is evaluated from view direction; no panorama is wrapped around the world.
    // Stars and nebulae are world-space particles, not a panorama or enclosing dome.
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1800;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const azimuth = Math.random() * Math.PI * 2;
      const elevation = 0.08 + Math.random() * 1.48;
      const radius = 42000 + Math.random() * 5000;
      starPositions[i] = Math.sin(azimuth) * Math.cos(elevation) * radius;
      starPositions[i + 1] = Math.sin(elevation) * radius;
      starPositions[i + 2] = Math.cos(azimuth) * Math.cos(elevation) * radius;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        uniform float time;
        varying float vTwinkle;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = clamp(360.0 * (300.0 / max(1.0, -mvPosition.z)), 1.0, 3.2);
          vTwinkle = 0.68 + 0.32 * sin(time * 1.5 + position.x * 0.007 + position.z * 0.004);
        }
      `,
      fragmentShader: `
        varying float vTwinkle;
        void main() {
          vec2 centered = gl_PointCoord - vec2(0.5);
          float radius = dot(centered, centered);
          if (radius > 0.25) discard;
          float glow = smoothstep(0.25, 0.0, radius);
          gl_FragColor = vec4(vec3(0.72, 0.82, 1.0), glow * vTwinkle);
        }
      `,
      transparent: true,
      depthWrite: false,
      fog: false
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    const nebulaCount = 240;
    const nebulaPositions = new Float32Array(nebulaCount * 3);
    const nebulaSizes = new Float32Array(nebulaCount);
    const nebulaColors = new Float32Array(nebulaCount * 3);
    const nebulaPalette = [0x7250e8, 0x3e9ee8, 0xc34da8, 0x8262d8].map(color => new THREE.Color(color));
    for (let index = 0; index < nebulaCount; index += 1) {
      const offset = index * 3;
      const azimuth = Math.floor(index / (nebulaCount / 4)) * Math.PI / 2 + (Math.random() - 0.5) * 0.65;
      const distance = 26000 + Math.random() * 9000;
      const elevation = 0.18 + Math.random() * 0.42;
      const spread = 1800 + Math.random() * 5000;
      nebulaPositions[offset] = Math.sin(azimuth) * Math.cos(elevation) * distance + (Math.random() - 0.5) * spread;
      nebulaPositions[offset + 1] = Math.sin(elevation) * distance + (Math.random() - 0.5) * spread;
      nebulaPositions[offset + 2] = Math.cos(azimuth) * Math.cos(elevation) * distance + (Math.random() - 0.5) * spread;
      nebulaSizes[index] = 5500 + Math.random() * 9000;
      const color = nebulaPalette[index % nebulaPalette.length];
      nebulaColors[offset] = color.r;
      nebulaColors[offset + 1] = color.g;
      nebulaColors[offset + 2] = color.b;
    }
    const nebulaGeometry = new THREE.BufferGeometry();
    nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(nebulaPositions, 3));
    nebulaGeometry.setAttribute('size', new THREE.BufferAttribute(nebulaSizes, 1));
    nebulaGeometry.setAttribute('nebulaColor', new THREE.BufferAttribute(nebulaColors, 3));
    const nebulaMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute vec3 nebulaColor;
        uniform float time;
        varying vec3 vNebulaColor;
        void main() {
          vec3 drift = position;
          drift.x += sin(time * 0.012 + position.z * 0.0002) * 180.0;
          drift.z += cos(time * 0.01 + position.x * 0.0002) * 140.0;
          vec4 mvPosition = modelViewMatrix * vec4(drift, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = clamp(size * (300.0 / max(1.0, -mvPosition.z)), 1.0, 220.0);
          vNebulaColor = nebulaColor;
        }
      `,
      fragmentShader: `
        varying vec3 vNebulaColor;
        void main() {
          vec2 centered = gl_PointCoord - vec2(0.5);
          float radius = dot(centered, centered) * 4.0;
          float haze = exp(-radius * 3.2);
          gl_FragColor = vec4(vNebulaColor * 2.2, haze * 0.16);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });
    const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
    nebula.frustumCulled = false;
    scene.add(nebula);

    const rainCount = 1800;
    const rainPositions = new Float32Array(rainCount * 6);
    for (let index = 0; index < rainCount; index += 1) {
      const offset = index * 6;
      const x = (Math.random() - 0.5) * 120;
      const y = Math.random() * 55 + 5;
      const z = (Math.random() - 0.5) * 120;
      rainPositions.set([x, y, z, x + 0.2, y - 1.8, z + 0.08], offset);
    }
    const rainGeometry = new THREE.BufferGeometry();
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    rainGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 30, 0), 100);
    const rain = new THREE.LineSegments(
      rainGeometry,
      new THREE.LineBasicMaterial({
        color: 0xa8c6f4,
        transparent: true,
        opacity: 0.2,
        depthWrite: false
      })
    );
    scene.add(rain);

    // Soft moonlight and a camera-facing fill keep the nighttime architecture readable.
    const moonLight = new THREE.DirectionalLight(0xdce6f4, 1.3);
    moonLight.position.set(-120, 240, 180);
    moonLight.castShadow = true;
    // Reduce shadow map size to reduce aliasing artifacts and improve stability
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    // Small bias to reduce shadow acne and shimmering when moving
    moonLight.shadow.bias = -0.0005;
    scene.add(moonLight);
    const lightning = new THREE.DirectionalLight(0xa9c8ff, 0);
    lightning.position.set(-180, 260, 100);
    scene.add(lightning);

    // Helper to try loading PBR textures from /textures/{name}_*.jpg in public
    const cyanAmbient = new THREE.DirectionalLight(0xffdfb8, 0.78);
    cyanAmbient.position.set(400, 300, 400);
    scene.add(cyanAmbient);
    scene.add(new THREE.HemisphereLight(0xc9d2fa, 0x39324a, 1.35));

    // ========================================================
    // ROARING ANIMATED OCEAN (ISLAND CITY ENVIRONMENT)
    // ========================================================

    // Ocean (static to avoid expensive vertex shader deformation causing shimmering)
    const oceanGeo = new THREE.PlaneGeometry(3000, 3000, 32, 32);
    const oceanTex = generatePBR('ocean', '#0ea5a6');
    const oceanMat = new THREE.MeshStandardMaterial({ map: oceanTex.albedo, normalMap: oceanTex.normal, roughnessMap: oceanTex.roughness, metalness: 0.12, transparent: true, opacity: 0.92 });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -6;
    ocean.receiveShadow = true;
    oceanMat.normalScale = new THREE.Vector2(0.35, 0.35);
    ocean.renderOrder = 0;
    ocean.visible = false;
    scene.add(ocean);

    // Ocean vertex deformation disabled (was causing shimmering/z-fighting).
    // ========================================================
    // CITY ISLAND & HIGH-SPECULAR WET PLAZA GROUND
    // ========================================================

    const islandGeo = new THREE.CylinderGeometry(180, 220, 4, 32);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x263e2d, roughness: 1 });
    const islandBase = new THREE.Mesh(islandGeo, islandMat);
    islandBase.position.y = -2;
    islandMat.normalScale = new THREE.Vector2(0.6, 0.6);
    scene.add(islandBase);

    // ========================================================
    // Wet urban pavement foundation
    // ========================================================
    const voidGroundGeo = new THREE.PlaneGeometry(4200, 4200);
    const voidGroundMat = new THREE.MeshStandardMaterial({ color: 0x27452d, roughness: 1 });
    const voidGroundMesh = new THREE.Mesh(voidGroundGeo, voidGroundMat);
    voidGroundMesh.rotation.x = -Math.PI / 2;
    voidGroundMesh.position.y = -6.8;
    voidGroundMesh.receiveShadow = true;
    scene.add(voidGroundMesh);

    const districtGround = new THREE.Mesh(
      new THREE.PlaneGeometry(280, 280),
      new THREE.MeshStandardMaterial({ color: 0x477d4c, emissive: 0x153718, emissiveIntensity: 0.5, roughness: 1 })
    );
    districtGround.rotation.x = -Math.PI / 2;
    districtGround.position.y = -0.02;
    districtGround.receiveShadow = true;
    scene.add(districtGround);

    const asphaltPbr = generatePBR('night city asphalt', '#282c32');
    asphaltPbr.albedo.repeat.set(2, 8);
    asphaltPbr.normal.repeat.set(2, 8);
    asphaltPbr.roughness.repeat.set(2, 8);
    const roadMaterial = new THREE.MeshStandardMaterial({
      map: asphaltPbr.albedo,
      normalMap: asphaltPbr.normal,
      roughnessMap: asphaltPbr.roughness,
      color: 0x666d75,
      roughness: 0.88,
      metalness: 0.02
    });
    const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0x666d72, roughness: 0.92 });
    const curbMaterial = new THREE.MeshStandardMaterial({ color: 0xadb2ad, roughness: 0.8 });
    const roadPaintMaterial = new THREE.MeshStandardMaterial({
      color: 0xe7d59a,
      emissive: 0x4a3210,
      emissiveIntensity: 0.14,
      roughness: 0.72
    });
    const streetSegments: Array<[number, number]> = [[-113, 54], [90, 100]];
    for (const [centerZ, length] of streetSegments) {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(27, length), roadMaterial);
      road.rotation.x = -Math.PI / 2;
      road.position.set(0, 0.01, centerZ);
      road.receiveShadow = true;
      scene.add(road);

      for (const side of [-1, 1]) {
        const sidewalk = new THREE.Mesh(new THREE.PlaneGeometry(4.5, length), sidewalkMaterial);
        sidewalk.rotation.x = -Math.PI / 2;
        sidewalk.position.set(side * 16, 0.025, centerZ);
        sidewalk.receiveShadow = true;
        scene.add(sidewalk);
        const curb = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, length), curbMaterial);
        curb.position.set(side * 13.72, 0.14, centerZ);
        curb.receiveShadow = true;
        scene.add(curb);
        const laneEdge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, length - 2), roadPaintMaterial);
        laneEdge.position.set(side * 11.1, 0.035, centerZ);
        scene.add(laneEdge);
      }

      for (let z = centerZ - length / 2 + 5; z < centerZ + length / 2 - 3; z += 7) {
        const dash = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.025, 3.2), roadPaintMaterial);
        dash.position.set(0, 0.035, z);
        scene.add(dash);
      }
      if (centerZ > 0) {
        const crosswalkZ = centerZ - length / 2 + 4;
        for (let x = -10; x <= 10; x += 2) {
          const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.025, 0.7), curbMaterial);
          stripe.position.set(x, 0.04, crosswalkZ);
          scene.add(stripe);
        }
      }
    }

    const park = new THREE.Mesh(
      new THREE.PlaneGeometry(74, 90),
      new THREE.MeshStandardMaterial({ color: 0x4c9850, emissive: 0x183f1b, emissiveIntensity: 0.42, roughness: 1 })
    );
    park.rotation.x = -Math.PI / 2;
    park.position.set(0, 0.045, -5);
    park.receiveShadow = true;
    scene.add(park);

    const parkPathMaterial = new THREE.MeshStandardMaterial({ color: 0x85877d, roughness: 0.92 });
    const parkPath = new THREE.Mesh(new THREE.PlaneGeometry(7, 90), parkPathMaterial);
    parkPath.rotation.x = -Math.PI / 2;
    parkPath.position.set(0, 0.07, -5);
    parkPath.receiveShadow = true;
    scene.add(parkPath);
    for (const z of [-32, -12]) {
      for (const side of [-1, 1]) {
        const bollard = new THREE.Mesh(
          new THREE.CylinderGeometry(0.16, 0.22, 1.5, 10),
          new THREE.MeshStandardMaterial({ color: 0x273440, metalness: 0.65, roughness: 0.36 })
        );
        bollard.position.set(side * 5, 0.8, z);
        scene.add(bollard);
        const bollardGlow = new THREE.Mesh(
          new THREE.SphereGeometry(0.19, 12, 8),
          new THREE.MeshBasicMaterial({ color: 0x79eaff })
        );
        bollardGlow.position.set(side * 5, 1.55, z);
        scene.add(bollardGlow);
        const pathLight = new THREE.PointLight(0x43cfff, 2.8, 14);
        pathLight.position.set(side * 5, 1.8, z);
        scene.add(pathLight);
      }
    }

    // ========================================================
    // PALM BOULEVARD AND PARK FOLIAGE
    // ========================================================

    const palmFrondShape = new THREE.Shape();
    palmFrondShape.moveTo(-0.02, 0);
    palmFrondShape.quadraticCurveTo(-0.09, 0.35, -0.07, 0.72);
    palmFrondShape.quadraticCurveTo(-0.025, 0.63, 0, 0.58);
    palmFrondShape.quadraticCurveTo(0.025, 0.78, 0.07, 0.72);
    palmFrondShape.quadraticCurveTo(0.09, 0.35, 0.02, 0);
    palmFrondShape.closePath();
    const palmLeafGeometry = new THREE.ShapeGeometry(palmFrondShape, 5);
    const palmLeafMaterial = new THREE.MeshStandardMaterial({
      color: 0x51b56c,
      emissive: 0x123b20,
      emissiveIntensity: 0.35,
      roughness: 0.88,
      side: THREE.DoubleSide
    });
    const palmTrunkMaterial = new THREE.MeshStandardMaterial({ color: 0x76513d, roughness: 0.94 });
    const palmStemMaterial = new THREE.MeshStandardMaterial({ color: 0x4e8d5b, roughness: 0.9 });
    const createPalmTree = (x: number, z: number, scale: number) => {
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);
      tree.scale.setScalar(scale);
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.52, 9.5, 12, 8),
        palmTrunkMaterial
      );
      trunk.position.y = 4.75;
      trunk.rotation.z = x < 0 ? -0.035 : 0.035;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      tree.add(trunk);

      const frondCount = 11;
      const leafletsPerSide = 15;
      const leaflets = new THREE.InstancedMesh(
        palmLeafGeometry,
        palmLeafMaterial,
        frondCount * leafletsPerSide * 2
      );
      const leafTransform = new THREE.Object3D();
      let leafIndex = 0;
      for (let frond = 0; frond < frondCount; frond += 1) {
        const angle = frond * Math.PI * 2 / frondCount;
        const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
        const tip = new THREE.Vector3(radial.x * 5.2, 7.25, radial.z * 5.2);
        const stemCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 9.25, 0),
          new THREE.Vector3(radial.x * 1.5, 9.7, radial.z * 1.5),
          new THREE.Vector3(radial.x * 3.4, 9.3, radial.z * 3.4),
          tip
        ]);
        const stem = new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 16, 0.055, 5, false), palmStemMaterial);
        stem.castShadow = true;
        tree.add(stem);
        for (let leaflet = 0; leaflet < leafletsPerSide; leaflet += 1) {
          const progress = 0.12 + leaflet * 0.052;
          const stemPoint = stemCurve.getPoint(progress);
          const tangent = stemCurve.getTangent(progress).normalize();
          for (const side of [-1, 1]) {
            const lateral = new THREE.Vector3(-radial.z, 0, radial.x).multiplyScalar(side);
            const direction = tangent.clone().multiplyScalar(0.32).addScaledVector(lateral, 0.92).normalize();
            leafTransform.position.copy(stemPoint).addScaledVector(lateral, 0.06);
            leafTransform.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
            const size = 0.8 + Math.sin(progress * Math.PI) * 0.42;
            leafTransform.scale.set(size, size, size);
            leafTransform.updateMatrix();
            leaflets.setMatrixAt(leafIndex, leafTransform.matrix);
            leaflets.setColorAt(
              leafIndex,
              new THREE.Color([0x277b50, 0x328c58, 0x3c985f][(leaflet + frond) % 3])
            );
            leafIndex += 1;
          }
        }
      }
      leaflets.instanceMatrix.needsUpdate = true;
      leaflets.computeBoundingSphere();
      leaflets.castShadow = true;
      leaflets.receiveShadow = true;
      tree.add(leaflets);
      return tree;
    };

    for (let index = 0; index < 9; index += 1) {
      const z = -138 + index * 31;
      scene.add(createPalmTree(-24 + Math.sin(index * 1.6) * 1.5, z, 1.12 + (index % 3) * 0.08));
      scene.add(createPalmTree(24 + Math.cos(index * 1.7) * 1.5, z - 5, 1.14 + (index % 2) * 0.1));
    }

    const parkTreeTrunk = new THREE.MeshStandardMaterial({ color: 0x684a35, roughness: 0.95 });
    const parkTreeLeaves = [
      new THREE.MeshStandardMaterial({ color: 0x438e4e, emissive: 0x193b1b, emissiveIntensity: 0.42, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0x63a657, emissive: 0x1d421c, emissiveIntensity: 0.4, roughness: 0.9 })
    ];
    for (const [x, z] of [[-33, -42], [33, -42], [-33, 32], [33, 32]] as const) {
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.62, 7, 10), parkTreeTrunk);
      trunk.position.y = 3.5;
      trunk.castShadow = true;
      tree.add(trunk);
      for (const [offsetX, offsetY, offsetZ, scale] of [
        [0, 7.2, 0, 2.9], [-1.35, 6.7, 0.5, 2.15], [1.4, 6.6, -0.35, 2.25], [0.2, 8.35, -0.6, 2.05]
      ] as const) {
        const crown = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), parkTreeLeaves[(Math.abs(x + z) + Math.round(scale)) % 2]);
        crown.position.set(offsetX, offsetY, offsetZ);
        crown.scale.set(scale, scale * 0.72, scale * 0.88);
        crown.castShadow = true;
        tree.add(crown);
      }
      scene.add(tree);
    }

    const parkShrubMaterial = new THREE.MeshStandardMaterial({
      color: 0x5ca85b,
      emissive: 0x153b17,
      emissiveIntensity: 0.34,
      roughness: 0.94
    });
    for (const [x, z] of [[-25, 7], [-25, -23], [25, 7], [25, -23]] as const) {
      for (let index = 0; index < 5; index += 1) {
        const shrub = new THREE.Mesh(
          new THREE.SphereGeometry(0.8 + (index % 2) * 0.22, 12, 9),
          parkShrubMaterial
        );
        shrub.position.set(x + (index - 2) * 0.75, 0.58, z + Math.sin(index * 2) * 0.5);
        shrub.scale.y = 0.78;
        shrub.castShadow = true;
        scene.add(shrub);
      }
    }

    const fountain = new THREE.Group();
    fountain.position.set(-7, 0.09, 8);
    const fountainStone = new THREE.MeshStandardMaterial({ color: 0x9ca7a9, metalness: 0.28, roughness: 0.42 });
    const fountainWater = new THREE.MeshPhysicalMaterial({
      color: 0x33c6e8,
      emissive: 0x07516a,
      emissiveIntensity: 0.58,
      metalness: 0.25,
      roughness: 0.12,
      transparent: true,
      opacity: 0.88
    });
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.7, 0.75, 48), fountainStone);
    basin.position.y = 0.38;
    basin.receiveShadow = true;
    fountain.add(basin);
    const waterSurface = new THREE.Mesh(new THREE.CircleGeometry(5.1, 48), fountainWater);
    waterSurface.rotation.x = -Math.PI / 2;
    waterSurface.position.y = 0.79;
    fountain.add(waterSurface);
    const basinLip = new THREE.Mesh(new THREE.TorusGeometry(5.35, 0.24, 10, 48), fountainStone);
    basinLip.rotation.x = Math.PI / 2;
    basinLip.position.y = 0.78;
    fountain.add(basinLip);
    const fountainColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.05, 2.5, 20), fountainStone);
    fountainColumn.position.y = 1.85;
    fountain.add(fountainColumn);
    const upperBowl = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 0.85, 0.42, 32), fountainStone);
    upperBowl.position.y = 3.18;
    fountain.add(upperBowl);
    const upperWater = new THREE.Mesh(new THREE.CircleGeometry(1.9, 32), fountainWater);
    upperWater.rotation.x = -Math.PI / 2;
    upperWater.position.y = 3.42;
    fountain.add(upperWater);
    const waterJet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.12, 2.3, 10),
      new THREE.MeshBasicMaterial({ color: 0x84edff, transparent: true, opacity: 0.74 })
    );
    waterJet.position.y = 4.55;
    fountain.add(waterJet);
    const fountainLight = new THREE.PointLight(0x2edbff, 2.1, 18);
    fountainLight.position.y = 2.8;
    fountain.add(fountainLight);
    scene.add(fountain);

    // ========================================================
    // WINGED CIVIC MONUMENT
    // ========================================================

    const statueGroup = new THREE.Group();
    statueGroup.position.set(0, 0, -40);

    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(12, 4.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.1 })
    );
    pedestal.position.y = 2.25;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    statueGroup.add(pedestal);

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 4, 8.5, 16),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.48, roughness: 0.38 })
    );
    pillar.position.y = 8.75;
    statueGroup.add(pillar);

    const statueMat = new THREE.MeshStandardMaterial({ color: 0x987044, metalness: 0.84, roughness: 0.3 });
    const statueHighlightMat = new THREE.MeshStandardMaterial({ color: 0xc3a16b, metalness: 0.88, roughness: 0.24 });
    const maskMat = new THREE.MeshStandardMaterial({ color: 0x6625a8, metalness: 0.58, roughness: 0.24 });
    const maskTrimMat = new THREE.MeshStandardMaterial({ color: 0xdbc080, metalness: 0.88, roughness: 0.2 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x342e2b, metalness: 0.76, roughness: 0.34 });

    const addStatuePart = (geometry: THREE.BufferGeometry, material: THREE.Material, position: THREE.Vector3, scale: THREE.Vector3) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.scale.copy(scale);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      statueGroup.add(mesh);
      return mesh;
    };

    addStatuePart(new THREE.SphereGeometry(1, 24, 18), statueMat, new THREE.Vector3(0, 19.8, 0), new THREE.Vector3(1.7, 2.6, 0.9));
    addStatuePart(new THREE.SphereGeometry(1, 20, 16), statueHighlightMat, new THREE.Vector3(0, 17.3, 0), new THREE.Vector3(1.25, 1.15, 0.78));
    addStatuePart(new THREE.CylinderGeometry(1.05, 0.62, 3.8, 12), statueMat, new THREE.Vector3(0, 14.85, 0), new THREE.Vector3(1, 1, 0.9));
    addStatuePart(new THREE.SphereGeometry(0.8, 20, 16), statueMat, new THREE.Vector3(0, 22.25, 0), new THREE.Vector3(0.95, 0.52, 0.78));
    addStatuePart(new THREE.SphereGeometry(0.76, 24, 20), statueMat, new THREE.Vector3(0, 23.45, 0.04), new THREE.Vector3(0.88, 1.08, 0.76));

    const addStatueLimb = (start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material) => {
      const direction = new THREE.Vector3().subVectors(end, start);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.78, radius, direction.length(), 12), material);
      mesh.position.copy(start).add(end).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      statueGroup.add(mesh);
      return mesh;
    };

    for (const side of [-1, 1]) {
      addStatueLimb(new THREE.Vector3(side * 1.35, 21.3, 0), new THREE.Vector3(side * 2.6, 20.25, 0.05), 0.62, statueMat);
      addStatuePart(new THREE.SphereGeometry(0.58, 16, 12), statueHighlightMat, new THREE.Vector3(side * 2.6, 20.25, 0.05), new THREE.Vector3(1, 1, 0.9));
      addStatueLimb(new THREE.Vector3(side * 2.6, 20.25, 0.05), new THREE.Vector3(side * 3.85, 20.85, 0.08), 0.42, statueMat);
      addStatuePart(new THREE.SphereGeometry(0.48, 16, 12), statueHighlightMat, new THREE.Vector3(side * 4.04, 20.94, 0.08), new THREE.Vector3(0.7, 0.4, 0.36));
      addStatueLimb(new THREE.Vector3(side * 0.62, 16.9, 0), new THREE.Vector3(side * 0.72, 13.8, 0.02), 0.58, statueMat);
      addStatuePart(new THREE.SphereGeometry(0.55, 16, 12), statueHighlightMat, new THREE.Vector3(side * 0.72, 13.8, 0.02), new THREE.Vector3(0.9, 0.9, 0.82));
      addStatuePart(new THREE.SphereGeometry(0.52, 16, 12), darkMetalMat, new THREE.Vector3(side * 0.72, 13.2, 0.42), new THREE.Vector3(0.72, 0.25, 1.2));
    }

    const featherShape = new THREE.Shape();
    featherShape.moveTo(-0.2, 0);
    featherShape.quadraticCurveTo(-0.45, 1.1, -0.28, 2.35);
    featherShape.quadraticCurveTo(-0.12, 3.55, 0.02, 4.15);
    featherShape.quadraticCurveTo(0.34, 3.2, 0.42, 2.1);
    featherShape.quadraticCurveTo(0.46, 0.75, 0.2, 0);
    featherShape.closePath();
    const featherGeometry = new THREE.ExtrudeGeometry(featherShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.06
    });
    const featherMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x6e5136, metalness: 0.82, roughness: 0.3, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ color: 0xc1a16d, metalness: 0.85, roughness: 0.25, side: THREE.DoubleSide })
    ];

    for (const side of [-1, 1]) {
      const wingBones = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 1.1, 21.6, -0.72),
        new THREE.Vector3(side * 4.2, 22.2, -0.78),
        new THREE.Vector3(side * 8.5, 22.8, -0.78),
        new THREE.Vector3(side * 12.6, 23.2, -0.72)
      ]);
      const wingFrame = new THREE.Mesh(new THREE.TubeGeometry(wingBones, 24, 0.2, 10, false), statueHighlightMat);
      wingFrame.castShadow = true;
      statueGroup.add(wingFrame);

      for (let feather = 0; feather < 9; feather += 1) {
        const x = side * (0.9 + feather * 1.42);
        const angle = -side * (0.34 + feather * 0.065);
        const lengthScale = 0.82 + feather * 0.055;
        const primary = new THREE.Mesh(featherGeometry, featherMaterials[feather % 2]);
        primary.position.set(x, 21.95 + feather * 0.1, -0.65);
        primary.rotation.z = angle;
        primary.scale.set(1, lengthScale, 1);
        primary.castShadow = true;
        primary.receiveShadow = true;
        statueGroup.add(primary);

        const covert = new THREE.Mesh(featherGeometry, featherMaterials[(feather + 1) % 2]);
        covert.position.set(side * (0.65 + feather * 1.26), 20.85, -0.32);
        covert.rotation.z = angle * 0.72;
        covert.scale.set(0.72, 0.63 + feather * 0.025, 0.8);
        covert.castShadow = true;
        covert.receiveShadow = true;
        statueGroup.add(covert);
      }
    }

    const mask = addStatuePart(
      new THREE.SphereGeometry(0.76, 32, 24),
      maskMat,
      new THREE.Vector3(0, 23.55, 0.66),
      new THREE.Vector3(1.12, 0.66, 0.34)
    );
    mask.rotation.x = -0.08;
    for (const side of [-1, 1]) {
      addStatuePart(new THREE.SphereGeometry(0.16, 16, 10), darkMetalMat, new THREE.Vector3(side * 0.31, 23.59, 0.955), new THREE.Vector3(1.15, 0.42, 0.3));
    }

    const maskCrest = new THREE.Group();
    maskCrest.position.set(0, 23.93, 1.0);
    for (const side of [-1, 1]) {
      const chevron = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.08), maskTrimMat);
      chevron.rotation.z = side * -0.58;
      chevron.position.x = side * 0.1;
      maskCrest.add(chevron);
    }
    const crestDot = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 8), maskTrimMat);
    crestDot.position.y = 0.2;
    maskCrest.add(crestDot);
    statueGroup.add(maskCrest);

    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 1.35, 0.34),
      new THREE.MeshStandardMaterial({ color: 0x352c25, metalness: 0.74, roughness: 0.32 })
    );
    plaque.position.set(0, 3.15, 6.19);
    plaque.castShadow = true;
    statueGroup.add(plaque);

    const plaqueCanvas = document.createElement('canvas');
    plaqueCanvas.width = 1024;
    plaqueCanvas.height = 256;
    const plaqueContext = plaqueCanvas.getContext('2d');
    if (!plaqueContext) throw new Error('Could not create the monument plaque.');
    plaqueContext.fillStyle = '#352c25';
    plaqueContext.fillRect(0, 0, plaqueCanvas.width, plaqueCanvas.height);
    plaqueContext.strokeStyle = '#c9a96f';
    plaqueContext.lineWidth = 12;
    plaqueContext.strokeRect(18, 18, plaqueCanvas.width - 36, plaqueCanvas.height - 36);
    plaqueContext.textAlign = 'center';
    plaqueContext.textBaseline = 'middle';
    plaqueContext.font = 'bold 116px Georgia, serif';
    plaqueContext.fillStyle = '#f0d7a3';
    plaqueContext.shadowColor = '#100d0a';
    plaqueContext.shadowBlur = 8;
    plaqueContext.fillText('THE GAT', plaqueCanvas.width / 2, plaqueCanvas.height / 2 + 4);
    const plaqueTexture = new THREE.CanvasTexture(plaqueCanvas);
    plaqueTexture.colorSpace = THREE.SRGBColorSpace;
    const plaqueFace = new THREE.Mesh(
      new THREE.PlaneGeometry(6.7, 1.1),
      new THREE.MeshStandardMaterial({ map: plaqueTexture, metalness: 0.5, roughness: 0.38 })
    );
    plaqueFace.position.set(0, 3.15, 6.37);
    statueGroup.add(plaqueFace);

    scene.add(statueGroup);

    // Load locally bundled CC0 assets; retain the scene-built fallback if a file cannot load.
    (async () => {
      try {
        const gltfLoader = new GLTFLoader();
        const lampAsset = await gltfLoader.loadAsync('/assets/foyer/models/street_lamp_01/street_lamp_01_1k.gltf');
        if (!sceneDisposed) {
          fallbackStreetLights.forEach(fallback => scene.remove(fallback));
          for (const fallback of fallbackStreetLights) {
            const side = Math.sign(fallback.position.x);
            const index = Math.round((fallback.position.z + 104) / 29);
            const lamp = lampAsset.scene.clone(true);
            const originalBounds = new THREE.Box3().setFromObject(lamp);
            const dimensions = originalBounds.getSize(new THREE.Vector3());
            lamp.scale.setScalar(8 / dimensions.y);
            const bounds = new THREE.Box3().setFromObject(lamp);
            lamp.position.set(
              fallback.position.x - (bounds.min.x + bounds.max.x) / 2,
              -bounds.min.y,
              fallback.position.z - (bounds.min.z + bounds.max.z) / 2
            );
            lamp.traverse(object => {
              if (object instanceof THREE.Mesh) {
                object.castShadow = true;
                object.receiveShadow = true;
              }
            });
            scene.add(lamp);
            const lampLight = new THREE.PointLight(index % 2 === 0 ? 0x3acbff : 0xd85bff, 3.2, 38, 1.8);
            lampLight.position.set(side * 28, 7.3, -104 + index * 29);
            scene.add(lampLight);
          }
        }
      } catch (error) {
        console.error('[GodotFoyer] Failed to load the local street-lamp model; using procedural lamps.', error);
      }

      try {
        const gltfLoader = new GLTFLoader();
        const benchAsset = await gltfLoader.loadAsync('/assets/foyer/models/modular_street_seating/modular_street_seating_1k.gltf');
        if (!sceneDisposed) {
          const benchBounds = new THREE.Box3().setFromObject(benchAsset.scene);
          const benchSize = benchBounds.getSize(new THREE.Vector3());
          const scale = 5.2 / Math.max(benchSize.x, benchSize.z);
          for (const [x, z, rotation] of [
            [-19, -36, 0], [19, -48, Math.PI], [-20, -81, 0], [20, -95, Math.PI]
          ] as const) {
            const bench = benchAsset.scene.clone(true);
            bench.scale.setScalar(scale);
            const bounds = new THREE.Box3().setFromObject(bench);
            bench.position.set(
              x - (bounds.min.x + bounds.max.x) / 2,
              -bounds.min.y,
              z - (bounds.min.z + bounds.max.z) / 2
            );
            bench.rotation.y = rotation;
            bench.traverse(object => {
              if (object instanceof THREE.Mesh) {
                object.castShadow = true;
                object.receiveShadow = true;
              }
            });
            scene.add(bench);
          }
        }
      } catch (error) {
        console.error('[GodotFoyer] Failed to load the local seating models.', error);
      }

    })();

    // ========================================================
    // VIBRANT HIGH-RISE SKYSCRAPERS & NEON BILLBOARDS
    // ========================================================

    type CivicWatchBillboard = {
      canvas: HTMLCanvasElement;
      context: CanvasRenderingContext2D;
      texture: THREE.CanvasTexture;
      version: number;
      story?: BillboardStory;
      mesh?: THREE.Mesh;
      building?: THREE.Group;
    };
    const mediaBillboards: CivicWatchBillboard[] = [];
    let billboardStories: BillboardStory[] = [];
    let billboardStoryIndex = 0;
    const drawCivicWatchBillboard = (screen: CivicWatchBillboard, story?: BillboardStory) => {
      const { canvas, context, texture } = screen;
      const version = ++screen.version;
      screen.story = story;
      if (screen.mesh) screen.mesh.userData.billboardStory = story;
      if (screen.building) screen.building.userData.billboardStory = story;
      context.fillStyle = '#07111d';
      context.fillRect(0, 0, canvas.width, canvas.height);
      if (!story) {
        context.fillStyle = '#102339';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = '#16cce8';
        context.lineWidth = 6;
        context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
        context.fillStyle = '#22d8f6';
        context.font = 'bold 43px sans-serif';
        context.fillText('CIVICVERSE COMMUNITY + OPEN NEWS', 42, 105);
        context.fillStyle = '#e6f4ff';
        context.font = '30px sans-serif';
        context.fillText('No community stories are available right now', 42, 180);
        context.fillStyle = '#9db2c5';
        context.font = '24px sans-serif';
        context.fillText('Interact with a screen to open its source.', 42, 235);
        texture.needsUpdate = true;
        return;
      }

      const paintStory = (image?: HTMLImageElement) => {
        if (sceneDisposed || screen.version !== version) return;
        if (image) {
          const scale = Math.max(canvas.width / image.width, 430 / image.height);
          const width = image.width * scale;
          const height = image.height * scale;
          context.drawImage(image, (canvas.width - width) / 2, (430 - height) / 2, width, height);
        } else {
          const gradient = context.createLinearGradient(0, 0, canvas.width, 430);
          gradient.addColorStop(0, story.category === 'OPEN SOURCE' ? '#123f37' : '#12334f');
          gradient.addColorStop(1, '#101327');
          context.fillStyle = gradient;
          context.fillRect(0, 0, canvas.width, 430);
          context.fillStyle = '#e3f7ff';
          context.font = 'bold 42px sans-serif';
          const words = story.title.split(/\s+/);
          let line = '';
          let y = 150;
          for (const word of words) {
            const candidate = `${line}${word} `;
            if (context.measureText(candidate).width > canvas.width - 100 && line) {
              context.fillText(line.trim(), 48, y);
              line = `${word} `;
              y += 58;
            } else line = candidate;
          }
          if (line && y < 410) context.fillText(line.trim(), 48, y);
        }

        const footer = context.createLinearGradient(0, 380, 0, 512);
        footer.addColorStop(0, 'rgba(2, 9, 20, 0.15)');
        footer.addColorStop(1, 'rgba(2, 9, 20, 0.97)');
        context.fillStyle = footer;
        context.fillRect(0, 360, canvas.width, 152);
        context.fillStyle = '#27e6ff';
        context.font = 'bold 22px sans-serif';
        context.fillText(`${story.category}  ·  INTERACT TO OPEN SOURCE`, 34, 400);
        context.fillStyle = '#ffffff';
        context.font = 'bold 27px sans-serif';
        context.fillText(story.title.slice(0, 55), 34, 445);
        context.fillStyle = '#aebed0';
        context.font = '19px sans-serif';
        context.fillText(`by ${story.author}`.slice(0, 72), 34, 480);
        texture.needsUpdate = true;
      };

      if (story.imageUrl) {
        const image = new Image();
        image.onload = () => paintStory(image);
        image.onerror = () => paintStory();
        image.src = story.imageUrl;
      } else paintStory();
    };

    const addBillboard = (
      building: THREE.Group,
      width: number,
      height: number,
      y: number,
      faceOffset: number,
      kind: 'logo' | 'community',
      face: 'front' | 'rear' | 'left' | 'right' = 'front'
    ) => {
      const isSide = face === 'left' || face === 'right';
      const faceSign = face === 'rear' || face === 'left' ? -1 : 1;
      const screenWidth = width;
      const screenHeight = height;
      const x = isSide ? faceSign * (faceOffset + 0.14) : 0;
      const screenZ = isSide ? 0 : faceSign * (faceOffset + 0.14);
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(screenWidth + 0.7, screenHeight + 0.7, 0.48),
        new THREE.MeshStandardMaterial({ color: 0x111a26, metalness: 0.72, roughness: 0.28 })
      );
      frame.position.set(isSide ? faceSign * (faceOffset - 0.12) : 0, y, screenZ - faceSign * 0.26);
      if (isSide) frame.rotation.y = face === 'right' ? Math.PI / 2 : -Math.PI / 2;
      building.add(frame);

      const canvas = makeCanvas(1024, 512);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not create a CivicWatch billboard canvas.');
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(screenWidth, screenHeight),
        new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, side: THREE.DoubleSide })
      );
      screen.position.set(x, y, screenZ);
      if (face === 'rear') screen.rotation.y = Math.PI;
      if (face === 'right') screen.rotation.y = Math.PI / 2;
      if (face === 'left') screen.rotation.y = -Math.PI / 2;
      building.add(screen);

      if (kind === 'logo') {
        context.fillStyle = '#06111d';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = '#24d8f3';
        context.lineWidth = 8;
        context.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
        const logo = new Image();
        logo.onload = () => {
          if (sceneDisposed) return;
          const scale = Math.min(380 / logo.width, 350 / logo.height);
          context.drawImage(logo, (canvas.width - logo.width * scale) / 2, 28, logo.width * scale, logo.height * scale);
          context.fillStyle = '#e8faff';
          context.font = 'bold 36px sans-serif';
          context.textAlign = 'center';
          context.fillText('CIVICVERSE  /  NEW DISTRICT', canvas.width / 2, 470);
          texture.needsUpdate = true;
        };
        logo.onerror = () => console.error('[GodotFoyer] Could not load the Civicverse logo for the tower billboard.');
        logo.src = '/Civicverselogo.png';
        texture.needsUpdate = true;
        return;
      }

      const board: CivicWatchBillboard = { canvas, context, texture, version: 0, mesh: screen, building };
      mediaBillboards.push(board);
      drawCivicWatchBillboard(board);
    };

    const createCyberBuilding = (x: number, z: number, w: number, h: number, d: number, title: string, neonColor: number) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(x, 0, z);

      const bMesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({
          color: 0x18243a,
          metalness: 0.72,
          roughness: 0.3,
          envMapIntensity: 0.8
        })
      );
      bMesh.position.y = h / 2;
      bMesh.castShadow = true;
      bGroup.add(bMesh);

      if (title === 'CIVIC CENTRE') {
        for (const face of ['front', 'rear', 'left', 'right'] as const) {
          const faceOffset = (face === 'left' || face === 'right' ? w : d) / 2 + 0.5;
          addBillboard(bGroup, 18, 9, h - 5, faceOffset, 'logo', face);
        }
      }
      if (title === 'CIVICVERSE') {
        addBillboard(bGroup, 20, 9, h - 5, d / 2 + 0.5, 'logo', 'front');
      }
      if (title === 'NEW DISTRICT' || title === 'CITY SERVICES') {
        for (const face of ['front', 'rear', 'left', 'right'] as const) {
          const faceOffset = (face === 'left' || face === 'right' ? w : d) / 2 + 0.5;
          addBillboard(bGroup, 18, 9, h - 5, faceOffset, 'community', face);
        }
      }

      const windowWidth = Math.max(1.5, Math.min(2.2, w / 14));
      const windowHeight = 2.7;
      const columns = Math.max(3, Math.floor((w - 5) / 3.2));
      const sideColumns = Math.max(3, Math.floor((d - 5) / 3.2));
      const rows = Math.max(5, Math.floor((h - 18) / 5));
      const windowGeo = new THREE.BoxGeometry(windowWidth, windowHeight, 0.04);
      const windowMat = new THREE.MeshStandardMaterial({
        color: 0xd8f3ff,
        emissive: neonColor,
        emissiveIntensity: 0.58,
        roughness: 0.35,
        metalness: 0.1
      });
      const warmWindow = new THREE.Color(0xffd69a);
      const coolWindow = new THREE.Color(0x9bc7ec);
      const windowFallback = new THREE.Group();
      const addWindowFace = (horizontalCount: number, alongDepth: boolean, sign: number) => {
        const windows = new THREE.InstancedMesh(windowGeo, windowMat, horizontalCount * rows);
        const instance = new THREE.Object3D();
        let index = 0;
        for (let row = 0; row < rows; row += 1) {
          for (let column = 0; column < horizontalCount; column += 1) {
            const offset = (column - (horizontalCount - 1) / 2) *
              ((alongDepth ? d : w) - 5) / horizontalCount;
            instance.position.set(
              alongDepth ? sign * (w / 2 + 0.08) : offset,
              7 + row * 4.2,
              alongDepth ? offset : sign * (d / 2 + 0.08)
            );
            instance.rotation.y = alongDepth ? Math.PI / 2 : 0;
            instance.updateMatrix();
            windows.setMatrixAt(index, instance.matrix);
            windows.setColorAt(index, Math.random() > 0.55 ? warmWindow : coolWindow);
            index += 1;
          }
        }
        windows.instanceMatrix.needsUpdate = true;
        windowFallback.add(windows);
      };
      addWindowFace(columns, false, 1);
      addWindowFace(columns, false, -1);
      addWindowFace(sideColumns, true, 1);
      addWindowFace(sideColumns, true, -1);
      bGroup.add(windowFallback);
      const facadeTrim = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.5, 0.55, d + 0.5),
        new THREE.MeshStandardMaterial({
          color: 0x1d263b,
          emissive: neonColor,
          emissiveIntensity: 0.38,
          metalness: 0.52,
          roughness: 0.38
        })
      );
      facadeTrim.position.y = h - 1;
      bGroup.add(facadeTrim);
      const verticalNeon = new THREE.MeshStandardMaterial({
        color: neonColor,
        emissive: neonColor,
        emissiveIntensity: 0.72,
        metalness: 0.28,
        roughness: 0.35
      });
      for (const sign of [-1, 1]) {
        const towerEdge = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, h - 2, 0.12),
          verticalNeon
        );
        towerEdge.position.set(sign * (w / 2 - 0.4), h / 2, d / 2 + 0.12);
        bGroup.add(towerEdge);
      }

      bGroup.name = title;

      return bGroup;
    };

    scene.add(createCyberBuilding(-65, -80, 31, 92, 30, 'CIVIC CENTRE', 0x5ca7ed));
    scene.add(createCyberBuilding(65, -85, 32, 108, 30, 'NEW DISTRICT', 0xd989bd));
    scene.add(createCyberBuilding(-72, 4, 30, 78, 28, 'CVC EXCHANGE', 0xe9a957));
    scene.add(createCyberBuilding(72, 5, 32, 88, 30, 'CITY SERVICES', 0x71b9dd));
    scene.add(createCyberBuilding(0, -158, 46, 118, 34, 'CIVICVERSE', 0x5ebcff));

    const skyline = [
      [-128, -172, 28, 102, 27], [-96, -205, 24, 136, 24], [-53, -205, 30, 114, 28],
      [52, -208, 26, 132, 25], [96, -196, 34, 96, 29], [132, -175, 30, 122, 28],
      [-138, -80, 28, 108, 26], [136, -78, 26, 116, 24], [-114, 35, 29, 86, 28],
      [112, 38, 34, 92, 30], [-104, 162, 34, 98, 30], [-66, 194, 28, 124, 26],
      [-24, 174, 36, 112, 32], [26, 208, 34, 138, 30], [72, 177, 32, 96, 28],
      [112, 150, 30, 118, 26]
    ] as const;
    skyline.forEach(([x, z, width, height, depth], index) => {
      scene.add(createCyberBuilding(x, z, width, height, depth, index % 2 ? 'CIVIC' : 'DISTRICT', index % 2 ? 0x77a9df : 0xe9b86c));
    });

    if (mediaBillboards.length) {
      const fetchJson = async (url: string) => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 8000);
        try {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) throw new Error(`Feed request returned HTTP ${response.status}.`);
          return await response.json();
        } finally {
          window.clearTimeout(timeout);
        }
      };
      const isHttpUrl = (value: unknown): value is string => {
        if (typeof value !== 'string') return false;
        try {
          return ['http:', 'https:'].includes(new URL(value).protocol);
        } catch {
          return false;
        }
      };
      const paintAllBillboards = () => {
        mediaBillboards.forEach((board, index) => {
          const buildingOffset = Math.floor(index / 4);
          const story = billboardStories.length
            ? billboardStories[(buildingOffset + billboardStoryIndex) % billboardStories.length]
            : undefined;
          drawCivicWatchBillboard(board, story);
        });
      };
      const refreshBillboardStories = async () => {
        const [socialResult, civicWatchResult, newsResult] = await Promise.allSettled([
          fetchJson('/api/social/explore?limit=30'),
          fetchJson('/api/civicwatch/media?limit=2'),
          fetchJson('/api/billboard/news')
        ]);
        if (sceneDisposed) return;

        const stories: BillboardStory[] = [];
        if (socialResult.status === 'fulfilled' && Array.isArray(socialResult.value.posts)) {
          for (const post of socialResult.value.posts) {
            if (typeof post?.id !== 'string' || typeof post.authorId !== 'string') continue;
            const profileUrl = `/profile/${encodeURIComponent(post.authorId)}`;
            const postText = typeof post.content === 'string' ? post.content.trim() : '';
            const linkedSource = postText.match(/https?:\/\/[^\s<>"']+/)?.[0];
            const mediaUrl = typeof post.media?.url === 'string' &&
              typeof post.media.mimeType === 'string' &&
              post.media.mimeType.startsWith('image/') &&
              /^\/api\/social\/media\/[0-9a-f-]{36}$/i.test(post.media.url)
              ? post.media.url
              : undefined;
            if (!postText && !mediaUrl) continue;
            stories.push({
              id: `post-${post.id}`,
              title: postText || post.media?.name || 'Community media',
              author: typeof post.authorName === 'string' ? post.authorName : 'Civicverse member',
              category: 'COMMUNITY',
              imageUrl: mediaUrl,
              sourceUrl: linkedSource && isHttpUrl(linkedSource) ? linkedSource : profileUrl,
              profileUrl,
              authorId: post.authorId
            });
          }
        } else if (socialResult.status === 'rejected') {
          console.info('[GodotFoyer] Community explore feed is unavailable.', socialResult.reason);
        }

        if (civicWatchResult.status === 'fulfilled' && Array.isArray(civicWatchResult.value.items)) {
          for (const item of civicWatchResult.value.items) {
            if (typeof item?.id !== 'string' || typeof item.title !== 'string') continue;
            const profileUrl = typeof item.authorId === 'string'
              ? `/profile/${encodeURIComponent(item.authorId)}`
              : undefined;
            const imageUrl = typeof item.image === 'string' &&
              /^data:image\/(?:jpeg|png|webp);base64,/.test(item.image)
              ? item.image
              : undefined;
            stories.push({
              id: `civicwatch-${item.id}`,
              title: item.title,
              author: typeof item.authorName === 'string' ? item.authorName : 'CivicWatch contributor',
              category: 'CIVICWATCH',
              imageUrl,
              sourceUrl: '/civicwatch',
              profileUrl,
              ...(typeof item.authorId === 'string' ? { authorId: item.authorId } : {})
            });
          }
        } else if (civicWatchResult.status === 'rejected') {
          console.info('[GodotFoyer] CivicWatch billboard feed is unavailable.', civicWatchResult.reason);
        }

        if (newsResult.status === 'fulfilled' && Array.isArray(newsResult.value.items)) {
          for (const item of newsResult.value.items) {
            if (typeof item?.id !== 'string' || typeof item.title !== 'string' || !isHttpUrl(item.sourceUrl)) continue;
            stories.push({
              id: item.id,
              title: item.title,
              author: typeof item.author === 'string' ? item.author : 'Open news',
              category: typeof item.category === 'string' ? item.category : 'LIVE NEWS',
              sourceUrl: item.sourceUrl
            });
          }
        } else if (newsResult.status === 'rejected') {
          console.info('[GodotFoyer] Open news feed is unavailable.', newsResult.reason);
        }

        for (let index = stories.length - 1; index > 0; index -= 1) {
          const swapIndex = Math.floor(Math.random() * (index + 1));
          [stories[index], stories[swapIndex]] = [stories[swapIndex], stories[index]];
        }
        billboardStories = stories;
        billboardStoryIndex = 0;
        paintAllBillboards();
      };
      void refreshBillboardStories();
      civicWatchMediaTimer = window.setInterval(() => void refreshBillboardStories(), 60000);
      billboardRotationTimer = window.setInterval(() => {
        if (!billboardStories.length || sceneDisposed) return;
        billboardStoryIndex = (billboardStoryIndex + 1) % billboardStories.length;
        paintAllBillboards();
      }, 12000);
    }

    const fallbackStreetLights: THREE.Group[] = [];
    const boulevardLampMaterial = new THREE.MeshStandardMaterial({ color: 0x252a34, metalness: 0.72, roughness: 0.35 });
    const lampGlowMaterial = new THREE.MeshStandardMaterial({ color: 0xffd69a, emissive: 0xffbc69, emissiveIntensity: 1.4 });
    for (const side of [-1, 1]) {
      for (let index = 0; index < 4; index += 1) {
        const lamp = new THREE.Group();
        lamp.position.set(side * 28, 0, -104 + index * 29);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.19, 8, 10), boulevardLampMaterial);
        post.position.y = 4;
        lamp.add(post);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.18), boulevardLampMaterial);
        arm.position.set(-side * 0.72, 7.7, 0);
        lamp.add(arm);
        const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.42), lampGlowMaterial);
        lampHead.position.set(-side * 1.35, 7.55, 0);
        lamp.add(lampHead);
        fallbackStreetLights.push(lamp);
        scene.add(lamp);
      }
    }

    // ========================================================
    // HIGH-FIDELITY DETAILED HUMAN CHARACTER & 3D WEAPON
    // ========================================================

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
      nametag: THREE.Sprite;
      bubble?: THREE.Sprite;
      bubbleMessageId?: string;
      characterJson: string;
      username: string;
      targetPos: THREE.Vector3;
      targetRotY: number;
      isMoving: boolean;
      animTime: number;
    }>();
    const localChatBubble: ChatBubble = { sprite: new THREE.Sprite(), messageId: '' };
    const remoteChatBubbles = new Map<string, ChatBubble>();

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
    let yaw = 0;
    let isJumping = false;
    let jumpVelocity = 0;
    // Movement velocity vector (units per second)
    const velocity = new THREE.Vector3(0, 0, 0);
    const accel = 80; // acceleration units/sec^2
    const damping = 10; // damping factor

    const onMouseMove = (e: MouseEvent) => {
      if (isChatFocusedRef.current) return;
      if (document.pointerLockElement === canvasElement) {
        // Horizontal look: use natural movement (positive movementX -> look right)
        yaw -= e.movementX * 0.0022;
        // Vertical look: use natural movement (positive movementY -> look down)
        pitch += e.movementY * 0.0022;
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

      if (e.code === 'KeyE') {
        e.preventDefault();
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
      if (e.code === 'Space' && !isJumping) {
        isJumping = true;
        jumpVelocity = 8.5;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    // ========================================================
    // GAME CONTROLS: FREE AIM, RIGHT-CLICK WALK, WEAPON SWAP
    // ========================================================

    let isRightMouseDown = false;

    const playLaserSound = () => {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.15);
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

    const updateWeaponSlot = (newSlot: number) => {
      activeSlotRef.current = newSlot;
      setActiveSlot(newSlot);
      playWeaponSwapSound();

      const col = slotPlasmaColors[newSlot] || 0x00f3ff;
      try {
        if (magCore && magCore.material) {
          (magCore.material as THREE.MeshStandardMaterial).color.setHex(col);
          (magCore.material as THREE.MeshStandardMaterial).emissive.setHex(col);
        }
        if (muzzleLight) {
          muzzleLight.color.setHex(col);
        }
      } catch (e) {}
    };

    // ========================================================
    // STRICT CANVAS-ONLY INTERACTION & POINTER LOCK ISOLATION
    // ========================================================
    const canvasElement = renderer.domElement;
    canvasElement.id = 'cv-3d-engine-canvas';

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
        if (player?.civicId) {
          if (document.pointerLockElement) document.exitPointerLock();
          navigate(`/profile/${encodeURIComponent(player.civicId)}`);
          return;
        }
      }

      // Only engage pointer lock if clicking directly on the 3D WebGL Canvas
      if (document.pointerLockElement !== canvasElement) {
        try {
          canvasElement.requestPointerLock?.();
        } catch (err) {}
        return; // Do not fire weapon or initiate walking on the lock acquisition click
      }

      // Pointer lock IS active strictly on canvas:
      // Left Click: Shoot weapon
      if (e.button === 0) {
        muzzleLight.intensity = 80;
        weaponGroup.position.z = -0.22; // Recoil kick back (small)
        weaponGroup.rotation.x = -0.12;

        playLaserSound();

        setAmmo(prev => ({ ...prev, current: Math.max(0, prev.current - 1) }));

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

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      try {
        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();
        nebulaMaterial.uniforms.time.value = elapsed;
        rain.position.set(playerGroup.position.x, playerGroup.position.y, playerGroup.position.z);
        const rainAttribute = rainGeometry.getAttribute('position') as THREE.BufferAttribute;
        const rainData = rainAttribute.array as Float32Array;
        const rainStep = Math.min(delta, 0.05) * 62;
        for (let index = 0; index < rainCount; index += 1) {
          const offset = index * 6;
          rainData[offset + 1] -= rainStep;
          rainData[offset] += rainStep * 0.12;
          rainData[offset + 2] += rainStep * 0.04;
          if (rainData[offset + 1] < 0) {
            rainData[offset] = (Math.random() - 0.5) * 120;
            rainData[offset + 1] = 45 + Math.random() * 20;
            rainData[offset + 2] = (Math.random() - 0.5) * 120;
          }
          rainData[offset + 3] = rainData[offset] + 0.2;
          rainData[offset + 4] = rainData[offset + 1] - 1.8;
          rainData[offset + 5] = rainData[offset + 2] + 0.08;
        }
        rainAttribute.needsUpdate = true;
        if (elapsed >= nextLightningAt) {
          lightning.intensity = 2.8;
          lightningOffAt = elapsed + 0.12;
          nextLightningAt = elapsed + 12 + Math.random() * 18;
        }
        if (lightning.intensity > 0 && elapsed >= lightningOffAt) lightning.intensity = 0;
        // 2. Player Movement: WASD / Arrow Keys + Right Click Walk
        const moveDir = new THREE.Vector3();
        if (keys['KeyW'] || keys['ArrowUp'] || isRightMouseDown) moveDir.z -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) moveDir.z += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) moveDir.x -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) moveDir.x += 1;

        const isRunning = keys['ShiftLeft'] || keys['ShiftRight'];
        const targetSpeed = isRunning ? 14 : 8; // units/sec smooth walking/sprinting speed
        let desired = new THREE.Vector3(0, 0, 0);
        if (moveDir.length() > 0) {
          moveDir.normalize();
          const rotQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
          moveDir.applyQuaternion(rotQuaternion);
          desired.copy(moveDir).multiplyScalar(targetSpeed);
        }

        // Accelerate towards desired velocity (smoothed)
        const vLerpFactor = Math.min(1, 10 * delta);
        velocity.lerp(desired, vLerpFactor);

        // Apply gravity/jump
        if (isJumping) {
          playerGroup.position.y += jumpVelocity * delta;
          jumpVelocity -= 22 * delta; // Gravity
          if (playerGroup.position.y <= 0) {
            playerGroup.position.y = 0;
            isJumping = false;
            jumpVelocity = 0;
          }
        }

        // Move player by velocity (frame-rate independent)
        playerGroup.position.addScaledVector(velocity, delta);

        // Local player gait animation on custom decentralized avatar
        const isMoving = moveDir.length() > 0;
        const targetMeshY = isMoving ? Math.sin(elapsed * 8) * 0.04 : Math.sin(elapsed * 2) * 0.01;
        localCharacterMesh.position.y = THREE.MathUtils.lerp(localCharacterMesh.position.y, targetMeshY, 0.1);

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
        const chatMessages = useMultiplayerStore.getState().chatHistory;
        const latestNearbyMessages = new Map<string, typeof chatMessages[number]>();
        const now = Date.now();
        chatMessages.forEach(message => {
          if (!message.proximity || !message.sentAt || now - message.sentAt > 4500 || now < message.sentAt) return;
          const previous = latestNearbyMessages.get(message.playerId);
          if (!previous || (previous.sentAt || 0) < message.sentAt) {
            latestNearbyMessages.set(message.playerId, message);
          }
        });
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
          const cJson = JSON.stringify(p.character || {});

          if (!remoteObj) {
            const grp = new THREE.Group();
            grp.userData.playerId = pId;
            const m = createCharacterMesh(p.character || defaultCharacter);
            m.rotation.y = Math.PI;
            grp.add(m);

            const tag = createPlayerNametag(p.username || `Citizen_${pId.slice(0, 6)}`, '#a855f7');
            grp.add(tag);

            grp.position.set(p.position.x, p.position.y, p.position.z);
            grp.rotation.y = p.rotation.y;
            scene.add(grp);

            remoteObj = {
              group: grp,
              mesh: m,
              nametag: tag,
              characterJson: cJson,
              username: p.username,
              targetPos: new THREE.Vector3(p.position.x, p.position.y, p.position.z),
              targetRotY: p.rotation.y,
              isMoving: !!p.isMoving,
              animTime: 0
            };
            remoteMeshes.set(pId, remoteObj);
          } else {
            if (remoteObj.characterJson !== cJson) {
              remoteObj.group.remove(remoteObj.mesh);
              const newM = createCharacterMesh(p.character || defaultCharacter);
              newM.rotation.y = Math.PI;
              remoteObj.group.add(newM);
              remoteObj.mesh = newM;
              remoteObj.characterJson = cJson;
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

            remoteObj.group.position.lerp(remoteObj.targetPos, Math.min(1, 14 * delta));
            remoteObj.group.rotation.y = THREE.MathUtils.lerp(remoteObj.group.rotation.y, remoteObj.targetRotY, Math.min(1, 14 * delta));

            if (remoteObj.isMoving) {
              remoteObj.animTime += delta * 8;
              remoteObj.group.position.y = remoteObj.targetPos.y + Math.abs(Math.sin(remoteObj.animTime)) * 0.05;
            } else {
              remoteObj.group.position.y = THREE.MathUtils.lerp(remoteObj.group.position.y, remoteObj.targetPos.y, 0.1);
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
          // First Person Mode: Camera placed at player eye level with pitch/yaw
          camera.position.set(
            playerGroup.position.x,
            playerGroup.position.y + 2.45,
            playerGroup.position.z
          );
          // Use quaternion from Euler to avoid gimbal issues
          camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));

          // Position weapon in front of 1ST person view (follow camera)
          weaponGroup.position.set(0.25, 2.1, -0.5);
          weaponGroup.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
        } else {
          // Third Person Mode: 360° Orbit Camera around player at distance r=7.0
          const camDistance = 4.8;
          const camX = playerGroup.position.x + Math.sin(yaw) * Math.cos(pitch) * camDistance;
          const camY = playerGroup.position.y + 2.15 + Math.sin(pitch) * camDistance;
          const camZ = playerGroup.position.z + Math.cos(yaw) * Math.cos(pitch) * camDistance;

          camera.position.set(camX, Math.max(0.5, camY), camZ);
          camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.35, playerGroup.position.z);

          // Position weapon in player hands in 3RD person view
          weaponGroup.position.set(0.4, 1.3, -0.4);
        }

        starMat.uniforms.time.value = elapsed;
        nebulaMaterial.uniforms.time.value = elapsed;

        // Use composer if available for postprocessing
        try {
          (composer as any).render();
        } catch (e) {
          renderer.render(scene, camera);
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
      <canvas id="canvas" className="absolute inset-0 w-full h-full block" />

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

      {/* ======================================================== */}
      {/* CAMERA MODE TOGGLE BUTTON (SAFE CLICK / PRESS 'V')       */}
      {/* ======================================================== */}
      <button 
        type="button"
        onClick={toggleCameraMode}
        className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#090d16]/90 border border-cyan-500/50 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer hover:border-cyan-400 transition-all pointer-events-auto outline-none"
      >
        <Camera className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="text-xs font-black text-white uppercase tracking-wider">VIEW: {cameraMode} PERSON</span>
        <span className="bg-cyan-500/20 text-cyan-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">PRESS 'V'</span>
      </button>

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
            {selectedBillboardStory.imageUrl && (
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
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 max-w-[min(760px,85vw)] rounded-xl border border-cyan-500/40 bg-[#090d16]/90 px-4 py-2 text-center font-mono text-[10px] leading-relaxed text-gray-200 shadow-[0_0_15px_rgba(0,0,0,0.6)] pointer-events-none">
        <div><span className="font-bold text-cyan-300">HOW TO USE</span><span className="text-white"> · Right-click walks · Click a billboard/building or aim + E for links · V camera · Scroll hotbar · Left-click elsewhere shoots</span></div>
        <div className="text-gray-300">Chat below: type or tap an emoji to send · Nearby chat reaches citizens within 30 m; switch to Lobby for everyone</div>
      </div>

      {/* Quality Controls */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-[#090d16]/80 border border-cyan-500/40 backdrop-blur-md px-3 py-2 rounded-xl text-xs text-white">
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
            <button onClick={() => applyPixelCap(2)} className={`px-2 py-0.5 rounded ${pixelCap===2 ? 'bg-cyan-600' : 'bg-transparent'}`}>2x</button>
            <button onClick={() => applyPixelCap(3)} className={`px-2 py-0.5 rounded ${pixelCap===3 ? 'bg-transparent border border-cyan-500' : 'bg-transparent'}`}>3x</button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* IN-GAME HUD OVERLAYS (MATCHING FOYER_FORMAT.JPG EXACTLY)  */}
      {/* ======================================================== */}

      {/* 0. TOP-LEFT OVERLAY: MULTIPLAYER LIVE STATUS & 20-CITIZEN LOBBY */}
      <div className="absolute top-4 left-4 z-30 flex flex-wrap items-center gap-2 pointer-events-auto">
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
      <div className="absolute top-16 left-4 z-20 w-64 bg-[#0d131f]/85 backdrop-blur-md border border-[#1e293b] rounded-xl p-3.5 shadow-2xl text-white pointer-events-auto">
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
      <div className="absolute top-4 right-4 z-20 flex flex-col items-center pointer-events-auto">
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
      <div className="absolute bottom-20 left-4 z-20 w-80 max-w-sm bg-[#090d16]/90 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3 shadow-2xl pointer-events-auto">
        <div className="flex items-center justify-between gap-1.5 mb-2 text-[10px] font-bold text-gray-300 border-b border-gray-800/60 pb-1.5">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="font-extrabold uppercase tracking-wider"># {nearbyChat ? 'Nearby Chat' : 'Lobby Chat'}</span>
          </div>
          <button type="button" onClick={() => setNearbyChat(value => !value)} className="rounded border border-cyan-400/30 px-2 py-1 text-[9px] font-bold text-cyan-200 hover:bg-cyan-400/10">
            {nearbyChat ? 'NEARBY · 30M' : 'LOBBY-WIDE'}
          </button>
        </div>

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
              onClick={() => useMultiplayerStore.getState().sendMessage(emoji, 'text-cyan-400', nearbyChat)}
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

      {/* 4. BOTTOM-CENTER OVERLAY: ACTION BAR & STATUS HUD */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-end gap-4 pointer-events-auto">
        {/* Hotbar Slots */}
        <div className="flex items-center gap-1.5 bg-[#080c14]/90 backdrop-blur-md p-1.5 rounded-xl border border-gray-800 shadow-2xl">
          {[
            { id: 1, icon: '🛡️', count: null },
            { id: 2, icon: '🪙', count: 2 },
            { id: 3, icon: '⚔️', count: 2 },
            { id: 4, icon: '✳️', count: null },
          ].map((slot) => (
            <button
              key={slot.id}
              onClick={() => setActiveSlot(slot.id)}
              className={`relative w-10 h-10 rounded-lg flex items-center justify-center text-base transition-all ${
                activeSlot === slot.id 
                  ? 'bg-cyan-500/20 border-2 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)] scale-105' 
                  : 'bg-gray-900/80 border border-gray-800 hover:border-gray-700'
              }`}
            >
              <span>{slot.icon}</span>
              <span className="absolute top-0.5 left-1 text-[9px] text-gray-400 font-mono">{slot.id}</span>
              {slot.count && (
                <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-cyan-400 font-mono">{slot.count}</span>
              )}
            </button>
          ))}

          {/* Center Official Civicverse Logo Emblem */}
          <div className="relative mx-2 flex flex-col items-center">
            <div className="w-11 h-11 rounded-full overflow-hidden shadow-[0_0_15px_rgba(255,107,0,0.6)] border border-orange-500/50 hover:scale-105 transition-transform">
              <img src="/Civicverselogo.png" alt="CV" className="w-full h-full object-cover" />
            </div>
            <div className="mt-1 text-[10px] font-extrabold text-orange-400 font-mono tracking-tighter">LVL 42</div>
          </div>

          {[
            { id: 5, icon: '🔮', count: null },
            { id: 6, icon: '🌀', count: 5 },
            { id: 7, icon: '💫', count: null },
            { id: 8, icon: '⚡', count: null },
          ].map((slot) => (
            <button
              key={slot.id}
              onClick={() => setActiveSlot(slot.id)}
              className={`relative w-10 h-10 rounded-lg flex items-center justify-center text-base transition-all ${
                activeSlot === slot.id 
                  ? 'bg-cyan-500/20 border-2 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)] scale-105' 
                  : 'bg-gray-900/80 border border-gray-800 hover:border-gray-700'
              }`}
            >
              <span>{slot.icon}</span>
              <span className="absolute top-0.5 left-1 text-[9px] text-gray-400 font-mono">{slot.id}</span>
              {slot.count && (
                <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-cyan-400 font-mono">{slot.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* HP & SP Bars Stack + Ammo Counter */}
        <div className="flex flex-col justify-end gap-1.5 w-48 mb-1">
          {/* Health Bar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-400 font-mono w-6">HP</span>
            <div className="flex-1 bg-gray-900 h-2 rounded-full overflow-hidden border border-emerald-950 p-0.5">
              <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full w-full shadow-[0_0_8px_#10b981]" />
            </div>
            <span className="text-[10px] font-mono text-gray-300 font-bold">100/100</span>
          </div>

          {/* SP Bar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-cyan-400 font-mono w-6">SP</span>
            <div className="flex-1 bg-gray-900 h-2 rounded-full overflow-hidden border border-cyan-950 p-0.5">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-400 h-full rounded-full w-[86%] shadow-[0_0_8px_#06b6d4]" />
            </div>
            <span className="text-[10px] font-mono text-gray-300 font-bold">86/100</span>
          </div>

          {/* Ammo & XP Bar */}
          <div className="flex items-center justify-between text-[9px] text-gray-400 font-mono">
            <span className="text-cyan-400 font-bold">AMMO: {ammo.current}/{ammo.max}</span>
            <span>8,450 / 15,000 XP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Temporary placeholder to avoid invalid hook calls while debugging duplicate-React issues.
// Re-enable the real implementation now that duplicate-React issues are addressed.
export const GodotFoyer: React.FC<GodotFoyerProps> = GodotFoyerImpl
