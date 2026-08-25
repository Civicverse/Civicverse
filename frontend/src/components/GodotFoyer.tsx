import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
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
  Camera,
  Crosshair,
  Volume2
} from 'lucide-react';

interface GodotFoyerProps {
  onExit?: () => void;
}

const GodotFoyerImpl: React.FC<GodotFoyerProps> = ({ onExit }) => {
  const { user } = useGameStore();
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

  // Store camera mode ref so event listeners don't re-mount the Three.js scene
  const cameraModeRef = useRef<'3RD' | '1ST'>('3RD');

  // Audio context ref (must be a hook at component top-level)
  const audioCtxRef = useRef<AudioContext | null>(null);

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
    scene.background = new THREE.Color(0x1a0628); // Vibrant purple night sky
    scene.fog = new THREE.FogExp2(0x2a083b, 0.0018); // Bright neon atmosphere

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

    const camera = new THREE.PerspectiveCamera(
      70, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.2, 
      4000
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
    renderer.toneMappingExposure = 1.0;
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
    bloomPass.threshold = 0.18;
    bloomPass.strength = 0.5; // reduced to avoid softening details
    bloomPass.radius = 0.28;
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
                m[k].encoding = THREE.sRGBEncoding;
                m[k].anisotropy = maxAniso;
                m[k].minFilter = THREE.LinearMipmapLinearFilter;
                m[k].magFilter = THREE.LinearFilter;
                m[k].generateMipmaps = true;
                m[k].needsUpdate = true;
              }
            });
            ['normalMap','roughnessMap','metalnessMap','aoMap'].forEach((k) => {
              if (m && m[k]) {
                m[k].encoding = THREE.LinearEncoding;
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

    // ========================================================
    // SYNTH_SKY BACKDROP DOME & STARRY SKY
    // ========================================================

    const loader = new THREE.TextureLoader();
    const skyTexture = loader.load('/images/synth_sky.jpg');
    skyTexture.wrapS = THREE.ClampToEdgeWrapping;
    skyTexture.wrapT = THREE.ClampToEdgeWrapping;
    skyTexture.encoding = THREE.sRGBEncoding;

    const skyDomeGeo = new THREE.SphereGeometry(4000, 48, 48);
    const skyDomeMat = new THREE.MeshBasicMaterial({
      map: skyTexture,
      side: THREE.BackSide,
      fog: false
    });
    const skyDome = new THREE.Mesh(skyDomeGeo, skyDomeMat);
    skyDome.rotation.y = Math.PI / 4;
    scene.add(skyDome);

    // Prefilter the sky into a PMREM environment for realistic specular lighting
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    try {
      const envMap = pmremGenerator.fromEquirectangular(skyTexture).texture;
      scene.environment = envMap;
    } catch (e) {
      // fallback: ignore if prefilter fails in dev
    }
    pmremGenerator.dispose();

    // Starfield particles
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 2400;
      starPositions[i + 1] = 150 + Math.random() * 900;
      starPositions[i + 2] = (Math.random() - 0.5) * 2400;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0.9 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 80s SYNTHWAVE MAGENTA MOON LIGHTING
    const moonLight = new THREE.DirectionalLight(0xff00aa, 2.0);
    moonLight.position.set(0, 400, -800);
    moonLight.castShadow = true;
    // Reduce shadow map size to reduce aliasing artifacts and improve stability
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    // Small bias to reduce shadow acne and shimmering when moving
    moonLight.shadow.bias = -0.0005;
    scene.add(moonLight);

    // Helper to try loading PBR textures from /textures/{name}_*.jpg in public
    const tryLoadPBRFromPublic = async (name: string) => {
      const tLoader = new THREE.TextureLoader();
      const base = `/textures/${name}`;
      const load = (suffix: string) => new Promise<THREE.Texture | null>((resolve) => {
        tLoader.load(`${base}_${suffix}.jpg`, (tex) => {
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(4, 4);
          resolve(tex);
        }, undefined, () => resolve(null));
      });

      const albedo = await load('albedo');
      if (!albedo) return null;
      const normal = await load('normal');
      const rough = await load('roughness');
      const metal = await load('metalness');
      return { albedo, normal, rough, metal };
    };

    const cyanAmbient = new THREE.DirectionalLight(0x00f3ff, 1.5);
    cyanAmbient.position.set(400, 300, 400);
    scene.add(cyanAmbient);
    // Softer ambient to reduce extreme specular changes while moving
    scene.add(new THREE.AmbientLight(0x7e22ce, 1.0)); // Purple Ambient

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
    scene.add(ocean);

    // Ocean vertex deformation disabled (was causing shimmering/z-fighting).
    const oceanPosAttr = oceanGeo.attributes.position;

    // ========================================================
    // CITY ISLAND & HIGH-SPECULAR WET PLAZA GROUND
    // ========================================================

    const islandGeo = new THREE.CylinderGeometry(180, 220, 4, 32);
    const islandTex = generatePBR('island', '#1e1b2e');
    const islandMat = new THREE.MeshStandardMaterial({ map: islandTex.albedo, normalMap: islandTex.normal, roughnessMap: islandTex.roughness, metalness: 0.04 });
    const islandBase = new THREE.Mesh(islandGeo, islandMat);
    islandBase.position.y = -2;
    islandMat.normalScale = new THREE.Vector2(0.6, 0.6);
    scene.add(islandBase);

    // Main Plaza Surface
    const plazaGeo = new THREE.PlaneGeometry(280, 280);
    const plazaTex = generatePBR('plaza', '#181c2e');
    const plazaMat = new THREE.MeshStandardMaterial({ map: plazaTex.albedo, normalMap: plazaTex.normal, roughnessMap: plazaTex.roughness, metalness: 0.25, emissive: 0x120622 });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.002, 0);
    plaza.receiveShadow = true;
    plazaMat.normalScale = new THREE.Vector2(0.7, 0.7);
    // Apply polygon offset on plaza material to reduce z-fighting with grid and decals
    (plazaMat as any).polygonOffset = true;
    (plazaMat as any).polygonOffsetFactor = 1;
    (plazaMat as any).polygonOffsetUnits = 1;
    scene.add(plaza);

    // Emissive Cyan & Magenta Floor Grid Lines
    const gridLines = new THREE.GridHelper(280, 56, 0xff00aa, 0x00f3ff);
    gridLines.position.y = 0.02;
    (gridLines.material as THREE.Material).opacity = 0.35;
    (gridLines.material as THREE.Material).transparent = true;
    scene.add(gridLines);

    // Seawall Railing & Glowing Coastal Perimeter Lights
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
      const px = Math.cos(angle) * 135;
      const pz = Math.sin(angle) * 135;

      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 2.5),
        new THREE.MeshStandardMaterial({ color: 0x00f3ff, emissive: 0x00f3ff, emissiveIntensity: 2 })
      );
      post.position.set(px, 1.25, pz);
      scene.add(post);
    }

    // ========================================================
    // TROPICAL CYBER PALM TREES
    // ========================================================

    const createPalmTree = (x: number, z: number) => {
      const palmGroup = new THREE.Group();
      palmGroup.position.set(x, 0, z);

      // Neon Cyan Ring on Trunk
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.65, 0.1, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0x00f3ff, emissive: 0x00f3ff, emissiveIntensity: 2 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 4.5;
      palmGroup.add(ring);

      // Palm Fronds
      for (let i = 0; i < 8; i++) {
        const frond = new THREE.Mesh(
          new THREE.BoxGeometry(6.5, 0.12, 1.2),
          new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.3 })
        );
        frond.position.y = 9;
        frond.rotation.y = (i / 8) * Math.PI * 2;
        frond.rotation.z = Math.PI / 5;
        palmGroup.add(frond);
      }
      return palmGroup;
    };

    for (let z = -60; z <= 60; z += 25) {
      scene.add(createPalmTree(-35, z));
      scene.add(createPalmTree(35, z));
    }

    // ========================================================
    // MONUMENT & GEOMETRIC CV SCULPTURE
    // ========================================================

    const statueGroup = new THREE.Group();
    statueGroup.position.set(0, 0, -50);

    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(12, 4.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.1 })
    );
    pedestal.position.y = 2.25;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    statueGroup.add(pedestal);

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 4, 12, 16),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 })
    );
    pillar.position.y = 10.5;
    statueGroup.add(pillar);

    // Golden Guardian Statue Body
    const statueMat = new THREE.MeshStandardMaterial({ 
      color: 0xf59e0b, 
      metalness: 0.95, 
      roughness: 0.05, 
      emissive: 0xd97706, 
      emissiveIntensity: 0.35 
    });
    const statueBody = new THREE.Mesh(new THREE.CapsuleGeometry(1.8, 6, 8, 16), statueMat);
    statueBody.position.y = 19.5;
    statueBody.castShadow = true;
    statueGroup.add(statueBody);

    // Glowing Holographic Wings
    const wingMat = new THREE.MeshStandardMaterial({ 
      color: 0x00f3ff, 
      emissive: 0x00f3ff, 
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.9
    });
    const leftWing = new THREE.Mesh(new THREE.ConeGeometry(3.5, 11, 4), wingMat);
    leftWing.position.set(-3.2, 21, -0.5);
    leftWing.rotation.z = Math.PI / 4;
    statueGroup.add(leftWing);

    const rightWing = new THREE.Mesh(new THREE.ConeGeometry(3.5, 11, 4), wingMat);
    rightWing.position.set(3.2, 21, -0.5);
    rightWing.rotation.z = -Math.PI / 4;
    statueGroup.add(rightWing);

    // Silver Geometric CV Logo Sculpture
    const cvSculpture = new THREE.Group();
    cvSculpture.position.set(0, 4, 9);
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(3.5, 0.45, 16, 32),
        new THREE.MeshStandardMaterial({ color: 0xff00aa, emissive: 0xff00aa, emissiveIntensity: 1.5, metalness: 0.95 })
    );
    cvSculpture.add(torus);
    statueGroup.add(cvSculpture);

    scene.add(statueGroup);

    // Try to replace procedural textures with real PBR textures if present in public/textures
    (async () => {
      try {
        const plazaPBR = await tryLoadPBRFromPublic('plaza');
        if (plazaPBR) {
          plazaMat.map = plazaPBR.albedo;
          if (plazaPBR.normal) plazaMat.normalMap = plazaPBR.normal;
          if (plazaPBR.rough) plazaMat.roughnessMap = plazaPBR.rough;
          if (plazaPBR.metal) plazaMat.metalness = 1.0;
          plazaMat.needsUpdate = true;
        }

        const islandPBR = await tryLoadPBRFromPublic('island');
        if (islandPBR) {
          islandMat.map = islandPBR.albedo;
          if (islandPBR.normal) islandMat.normalMap = islandPBR.normal;
          if (islandPBR.rough) islandMat.roughnessMap = islandPBR.rough;
          islandMat.needsUpdate = true;
        }

        const oceanPBR = await tryLoadPBRFromPublic('ocean');
        if (oceanPBR) {
          oceanMat.map = oceanPBR.albedo;
          if (oceanPBR.normal) oceanMat.normalMap = oceanPBR.normal;
          if (oceanPBR.rough) oceanMat.roughnessMap = oceanPBR.rough;
          oceanMat.needsUpdate = true;
        }

        const suitPBR = await tryLoadPBRFromPublic('suit');
        if (suitPBR) {
          // apply to humanoid suit if present
          humanoid.traverse((c: any) => {
            if (c.isMesh && c.material && c.material.emissive !== undefined) {
              c.material.map = suitPBR.albedo;
              if (suitPBR.normal) c.material.normalMap = suitPBR.normal;
              if (suitPBR.rough) c.material.roughnessMap = suitPBR.rough;
              c.material.needsUpdate = true;
            }
          });
        }
      } catch (e) {
        // ignore; procedural textures still present
      }
    })();

    // ========================================================
    // VIBRANT HIGH-RISE SKYSCRAPERS & NEON BILLBOARDS
    // ========================================================

    const createCyberBuilding = (x: number, z: number, w: number, h: number, d: number, title: string, neonColor: number) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(x, 0, z);

      const buildingTex = generatePBR('building', '#0f1424');
      const bMesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ map: buildingTex.albedo, normalMap: buildingTex.normal, roughnessMap: buildingTex.roughness, metalness: 0.6 })
      );
      bMesh.position.y = h / 2;
      bMesh.castShadow = true;
      bGroup.add(bMesh);

      // Glowing Window Grid
      const winMat = new THREE.MeshStandardMaterial({ 
        color: 0x000000, 
        emissive: neonColor, 
        emissiveIntensity: 1.2, 
        transparent: true, 
        opacity: 0.85 
      });
      const windows = new THREE.Mesh(new THREE.PlaneGeometry(w - 3, h - 15), winMat);
      windows.position.set(0, h / 2, d / 2 + 0.1);
      bGroup.add(windows);

      // Billboard Canvas Screen
      const boardCanvas = document.createElement('canvas');
      boardCanvas.width = 512;
      boardCanvas.height = 256;
      const ctx = boardCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#090d18';
        ctx.fillRect(0, 0, 512, 256);
        ctx.strokeStyle = neonColor === 0x00f3ff ? '#00f3ff' : '#ff00aa';
        ctx.lineWidth = 14;
        ctx.strokeRect(10, 10, 492, 236);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 90px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CV', 256, 115);
        ctx.font = '900 38px Inter, sans-serif';
        ctx.fillText(title, 256, 180);
      }

      const boardTex = new THREE.CanvasTexture(boardCanvas);
      const billboard = new THREE.Mesh(
        new THREE.PlaneGeometry(w * 0.88, w * 0.44),
        new THREE.MeshBasicMaterial({ map: boardTex })
      );
      billboard.position.set(0, h * 0.72, d / 2 + 0.3);
      bGroup.add(billboard);

      // Point light from Billboard
      const pLight = new THREE.PointLight(neonColor, 6, 80);
      pLight.position.set(0, h * 0.72, d / 2 + 8);
      bGroup.add(pLight);

      return bGroup;
    };

    scene.add(createCyberBuilding(-55, -70, 36, 120, 36, 'CIVICVERSE', 0x00f3ff));
    scene.add(createCyberBuilding(55, -70, 36, 120, 36, 'NEW DISTRICT', 0xff00aa));
    scene.add(createCyberBuilding(-75, 15, 36, 130, 36, 'CVC EXCHANGE', 0x38bdf8));
    scene.add(createCyberBuilding(75, 15, 36, 130, 36, 'CIVIC CENTRE', 0xa855f7));

    // ========================================================
    // HIGH-FIDELITY DETAILED HUMAN CHARACTER & 3D WEAPON
    // ========================================================

    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 20);

    // Create a stylized synthwave humanoid using primitives (replaceable with glTF later)
    const createSynthHuman = () => {
      const g = new THREE.Group();

      // Materials
      const skin = new THREE.MeshStandardMaterial({ color: 0xffd1b3, roughness: 0.5, metalness: 0.05 });
      const suitTex = generatePBR('suit', '#0f172a');
      const suit = new THREE.MeshStandardMaterial({ map: suitTex.albedo, normalMap: suitTex.normal, roughnessMap: suitTex.roughness, metalness: 0.55, emissive: 0x220033, emissiveIntensity: 0.18 });
      const neon = new THREE.MeshStandardMaterial({ color: 0x00f3ff, emissive: 0x00f3ff, emissiveIntensity: 1.8 });

      // Torso
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.2, 6, 12), suit);
      torso.position.y = 1.2;
      torso.castShadow = true;
      g.add(torso);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), skin);
      head.position.y = 2.05;
      g.add(head);

      // Stylized visor
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.08), neon);
      visor.position.set(0, 2.05, 0.25);
      visor.rotation.x = 0.02;
      g.add(visor);

      // Arms
      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.6, 8), suit);
      const lowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8), suit);
      const leftArm = new THREE.Group();
      leftArm.position.set(-0.55, 1.5, 0);
      upperArm.position.y = -0.3;
      lowerArm.position.y = -0.9;
      leftArm.add(upperArm.clone());
      leftArm.add(lowerArm.clone());
      g.add(leftArm);

      const rightArm = new THREE.Group();
      rightArm.position.set(0.55, 1.5, 0);
      rightArm.add(upperArm.clone());
      rightArm.add(lowerArm.clone());
      g.add(rightArm);

      // Legs
      const upperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8), suit);
      const lowerLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.7, 8), suit);
      const leftLeg = new THREE.Group();
      leftLeg.position.set(-0.22, 0.35, 0);
      leftLeg.add(upperLeg.clone());
      leftLeg.add(lowerLeg.clone());
      g.add(leftLeg);

      const rightLeg = new THREE.Group();
      rightLeg.position.set(0.22, 0.35, 0);
      rightLeg.add(upperLeg.clone());
      rightLeg.add(lowerLeg.clone());
      g.add(rightLeg);

      // Neon chest stripe
      const stripeGeo = new THREE.PlaneGeometry(0.28, 0.9);
      const stripe = new THREE.Mesh(stripeGeo, neon);
      stripe.position.set(0, 1.35, 0.51);
      stripe.rotation.y = Math.PI;
      g.add(stripe);

      return g;
    };

    const humanoid = createSynthHuman();
    // Ensure the humanoid faces forward (positive Z as forward in world)
    humanoid.rotation.y = Math.PI; 
    playerGroup.add(humanoid);

    // Expose torsoMesh variable used by animation code by finding by type
    // (keep a reference to the capsule we created)
    const torsoMesh = humanoid.children.find(c => c.type === 'Mesh' && (c.geometry as any).type === 'CapsuleGeometry') as THREE.Mesh || new THREE.Mesh();

    scene.add(playerGroup);

    // 3. DETAILED 3D WEAPON RIFLE MODEL
    const weaponGroup = new THREE.Group();
    
    // Rifle Stock & Body
    const rifleBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.28, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95, roughness: 0.1 })
    );
    weaponGroup.add(rifleBody);

    // Glowing Plasma Magazine Core
    const magCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.35, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x00f3ff, emissive: 0x00f3ff, emissiveIntensity: 3 })
    );
    magCore.position.set(0, -0.2, 0.1);
    weaponGroup.add(magCore);

    // Scope Sight
    const scopeLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xff00aa, emissive: 0xff00aa, emissiveIntensity: 2 })
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
      if (document.pointerLockElement === containerRef.current) {
        // Horizontal look: use natural movement (positive movementX -> look right)
        // If left/right feels inverted, flip the sign here.
        yaw -= e.movementX * 0.0022;
        // Vertical look: use natural movement (positive movementY -> look down)
        // If the user reports inverted Y, flip the sign here.
        pitch += e.movementY * 0.0022;
        // Clamp pitch to avoid flipping
        pitch = Math.max(-1.48, Math.min(1.48, pitch));
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;

      // Toggle 1ST / 3RD Person with V
      if (e.code === 'KeyV') {
        console.debug('[GodotFoyer] KeyV pressed')
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

    // WEAPON FIRE & SOUND EFFECT

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

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left Click Shoot
        muzzleLight.intensity = 80;
        weaponGroup.position.z = -0.22; // Recoil kick back (small)
        weaponGroup.rotation.x = -0.12;

        playLaserSound();

        setAmmo(prev => ({ ...prev, current: Math.max(0, prev.current - 1) }));

        setTimeout(() => {
          muzzleLight.intensity = 0;
        }, 70);
      }
    };

    containerRef.current.addEventListener('click', () => {
      containerRef.current?.requestPointerLock();
    });

    const onPointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === containerRef.current);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    // ========================================================
    // ANIMATION & RENDERING LOOP
    // ========================================================

    const clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      try {
        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        // Ocean vertex deformation disabled to avoid shimmering and z-fighting.

        // 2. Player Movement Physics (smooth velocity)
        const moveDir = new THREE.Vector3();
        // Forward/back mapping: W should move forward in camera space.
        if (keys['KeyW']) moveDir.z += 1;
        if (keys['KeyS']) moveDir.z -= 1;
        // Invert strafing to match camera orientation (A = left, D = right)
        if (keys['KeyA']) moveDir.x += 1;
        if (keys['KeyD']) moveDir.x -= 1;

        const targetSpeed = keys['ShiftLeft'] ? 14 : 7; // units/sec
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

        // Torso gait animation (smoothed and reduced amplitude to avoid shimmering)
        const targetTorsoY = moveDir.length() > 0 ? 1.4 + Math.sin(elapsed * 6) * 0.02 : 1.4 + Math.sin(elapsed * 2) * 0.005;
        torsoMesh.position.y = THREE.MathUtils.lerp(torsoMesh.position.y, targetTorsoY, 0.08);

        // Weapon recoil smoothing
        weaponGroup.position.z = THREE.MathUtils.lerp(weaponGroup.position.z, -0.4, 0.08);
        weaponGroup.rotation.x = THREE.MathUtils.lerp(weaponGroup.rotation.x, 0, 0.08);

        // Rotate Player Yaw (character orientation) - add PI so model faces forward instead of toward camera
        const desiredYaw = yaw + Math.PI;
        playerGroup.rotation.y = THREE.MathUtils.lerp(playerGroup.rotation.y, desiredYaw, 0.14);

        // Rotate sky slowly for dynamic backdrop
        try { skyDome.rotation.y += 0.02 * delta; } catch (e) {}

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
          const camDistance = 7.0;
          const camX = playerGroup.position.x - Math.sin(yaw) * Math.cos(pitch) * camDistance;
          const camY = playerGroup.position.y + 2.5 + Math.sin(pitch) * camDistance;
          const camZ = playerGroup.position.z - Math.cos(yaw) * Math.cos(pitch) * camDistance;

          camera.position.set(camX, Math.max(0.5, camY), camZ);
          camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.8, playerGroup.position.z);

          // Position weapon in player hands in 3RD person view
          weaponGroup.position.set(0.4, 1.3, -0.4);
        }

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
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      try {
        renderer.domElement.removeEventListener('webglcontextlost', onContextLost as EventListener)
      } catch {}
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
      <div 
        onClick={toggleCameraMode}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#090d16]/90 border border-cyan-500/50 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer hover:border-cyan-400 transition-all pointer-events-auto"
      >
        <Camera className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="text-xs font-black text-white uppercase tracking-wider">VIEW: {cameraMode} PERSON</span>
        <span className="bg-cyan-500/20 text-cyan-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">PRESS 'V'</span>
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

      {/* 1. TOP-LEFT OVERLAY: ACTIVE QUEST */}
      <div className="absolute top-4 left-4 z-20 w-64 bg-[#0d131f]/85 backdrop-blur-md border border-[#1e293b] rounded-xl p-3.5 shadow-2xl text-white pointer-events-auto">
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
        <p className="text-[11px] text-gray-300 mb-2">Speak to 3 citizens in New District</p>

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

      {/* 3. BOTTOM-LEFT OVERLAY: DISTRICT CHAT LOG */}
      <div className="absolute bottom-20 left-4 z-20 max-w-sm bg-[#090d16]/85 backdrop-blur-md border border-gray-800/80 rounded-xl p-2.5 pointer-events-auto">
        <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-gray-400 border-b border-gray-800/50 pb-1">
          <MessageSquare className="w-3 h-3 text-cyan-400" />
          <span># New District</span>
        </div>
        <p className="text-[11px] text-gray-200 leading-snug">
          <span className="text-amber-400 font-bold">CivicBot:</span> The community rally has started at Unity Plaza!
        </p>
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

          {/* Center Level Diamond Emblem */}
          <div className="relative mx-2 flex flex-col items-center">
            <div className="w-11 h-11 bg-gradient-to-br from-cyan-500 via-purple-600 to-pink-600 rounded-lg rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.6)] border border-cyan-300">
              <span className="-rotate-45 text-white font-black text-xs">CV</span>
            </div>
            <div className="mt-2 text-[10px] font-extrabold text-cyan-400 font-mono tracking-tighter">LVL 42</div>
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
