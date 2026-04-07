import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import * as THREE from 'three';

interface GodotFoyerProps {
  onExit: () => void;
}

declare global {
  interface Window {
    setGodotCallback: (callback: (args: any[]) => void) => void;
    getCivicID: () => any;
    exitFoyer: () => void;
    Engine: any;
  }
}

export const GodotFoyer: React.FC<GodotFoyerProps> = ({ onExit }) => {
  const { user } = useGameStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    // Setup JavaScriptBridge for Godot
    window.getCivicID = () => {
      if (!user) return null;
      return {
        username: user.username,
        trustScore: user.trustScore,
        level: user.level,
        verified: user.verificationLevel >= 2,
        customization: user.character || {}
      };
    };

    window.exitFoyer = () => {
      onExit();
    };

    // Load Godot Engine (Attempt)
    const loadGodot = async () => {
      try {
        const script = document.createElement('script');
        script.src = '/foyer-dist/index.js';
        script.async = true;
        
        script.onload = () => {
          // If the script loads, we try to init Godot
          if (typeof window.Engine !== 'undefined') {
             const GODOT_CONFIG = { executable: '/foyer-dist/index', args: [], canvasResizePolicy: 2 };
             const engine = new window.Engine(GODOT_CONFIG);
             engine.instantiate().then(() => {
                setIsLoading(false);
             }).catch(() => {
                setIsLoading(false);
                setUseFallback(true);
             });
          } else {
            setIsLoading(false);
            setUseFallback(true);
          }
        };

        script.onerror = () => {
          setIsLoading(false);
          setUseFallback(true);
        };

        document.body.appendChild(script);
      } catch (err) {
        setIsLoading(false);
        setUseFallback(true);
      }
    };

    loadGodot();

    return () => {
      const scripts = document.querySelectorAll('script[src="/foyer-dist/index.js"]');
      scripts.forEach(s => s.remove());
      delete (window as any).getCivicID;
      delete (window as any).exitFoyer;
    };
  }, [user, onExit]);

  // Three.js High-Fidelity Foyer
  useEffect(() => {
    if (!useFallback || !containerRef.current) return;

    // ===== AAA ENVIRONMENT: THE FOYER - CIVICVERSE LOBBY CITY =====
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020205);
    scene.fog = new THREE.FogExp2(0x020205, 0.008); // Lighter fog for scale

    const camera = new THREE.PerspectiveCamera(70, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.8;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);

    // ===== GROUND: WET RETRO ASPHALT (CITY-SCENE.PNG VIBE) =====
    const groundGeo = new THREE.PlaneGeometry(3000, 3000);
    const groundMat = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a25, 
      metalness: 0.9, 
      roughness: 0.1,
      emissive: 0x100515 // Deep Purple Emissive
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Subtle Road Markings
    const roadGroup = new THREE.Group();
    for (let i = -100; i < 100; i++) {
        const stripe = new THREE.Mesh(
            new THREE.PlaneGeometry(0.5, 4),
            new THREE.MeshStandardMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.2 })
        );
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(0, 0.02, i * 15);
        roadGroup.add(stripe);
    }
    scene.add(roadGroup);

    // ===== VEGETATION: CYBER-TROPICAL PALMS =====
    const palmGroup = new THREE.Group();
    const createPalm = (x: number, z: number) => {
        const palm = new THREE.Group();
        palm.position.set(x, 0, z);
        
        // Trunk
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.5, 12, 8),
            new THREE.MeshStandardMaterial({ color: 0x2b1d0e, roughness: 0.9 })
        );
        trunk.position.y = 6;
        palm.add(trunk);

        // Neon Spiral on Trunk
        const spiralGeo = new THREE.TorusGeometry(0.55, 0.05, 8, 24, Math.PI * 4);
        const neonMat = new THREE.MeshStandardMaterial({ 
            color: Math.random() > 0.5 ? 0x00ffff : 0xff00ff,
            emissive: Math.random() > 0.5 ? 0x00ffff : 0xff00ff,
            emissiveIntensity: 15
        });
        const spiral = new THREE.Mesh(spiralGeo, neonMat);
        spiral.rotation.x = Math.PI / 2;
        spiral.position.y = 6;
        palm.add(spiral);

        // Fronds
        for (let i = 0; i < 12; i++) {
            const frond = new THREE.Mesh(
                new THREE.BoxGeometry(6, 0.1, 1.2),
                new THREE.MeshStandardMaterial({ color: 0x062206, roughness: 0.5 })
            );
            frond.position.y = 12;
            frond.rotation.y = (i / 12) * Math.PI * 2;
            frond.rotation.z = Math.PI / 6;
            palm.add(frond);
        }
        return palm;
    };

    for (let i = -20; i < 20; i++) {
        scene.add(createPalm(25, i * 40));
        scene.add(createPalm(-25, i * 40));
    }

    // ===== ARCHITECTURE: MEGA-CITY SKYSCRAPERS =====
    const buildings: THREE.Object3D[] = [];
    const buildingColors = [0x00ffff, 0xff00ff, 0x00ff88, 0x6600ff, 0xffd700];

    for (let i = 0; i < 300; i++) {
      const h = 80 + Math.random() * 300;
      const w = 25 + Math.random() * 30;
      const x = (Math.random() > 0.5 ? 1 : -1) * (60 + Math.random() * 600);
      const z = (Math.random() - 0.5) * 1500;

      const boxGeo = new THREE.BoxGeometry(w, h, w);
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0x0a0c10,
        metalness: 0.9,
        roughness: 0.05
      });
      const building = new THREE.Mesh(boxGeo, boxMat);
      building.position.set(x, h/2, z);
      building.castShadow = true;
      building.receiveShadow = true;
      scene.add(building);
      buildings.push(building);

      // AAA Details: Balconies & Roof Clusters
      for (let j = 0; j < 4; j++) {
          const balcony = new THREE.Mesh(
              new THREE.BoxGeometry(w + 2, 0.5, 4),
              new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 })
          );
          balcony.position.set(0, (Math.random() - 0.5) * h, w/2 + 1);
          building.add(balcony);

          const roofProp = new THREE.Mesh(
              new THREE.BoxGeometry(w * 0.4, 5, w * 0.4),
              new THREE.MeshStandardMaterial({ color: 0x222222 })
          );
          roofProp.position.set((Math.random() - 0.5) * w, h/2 + 2.5, (Math.random() - 0.5) * w);
          building.add(roofProp);
      }

      // Window Grid (Emissive)
      const windowGeo = new THREE.PlaneGeometry(w - 2, h - 10);
      const windowMat = new THREE.MeshStandardMaterial({
          color: 0x000000,
          emissive: 0x666699,
          emissiveIntensity: 3.5,
          transparent: true,
          opacity: 0.7
      });
      const windows = new THREE.Mesh(windowGeo, windowMat);
      windows.position.set(0, 0, w/2 + 0.1);
      building.add(windows);

      // Massive Neon Blade Signs
      if (Math.random() > 0.7) {
          const neonColor = buildingColors[Math.floor(Math.random() * buildingColors.length)];
          const blade = new THREE.Mesh(
              new THREE.BoxGeometry(0.5, h * 0.6, 6),
              new THREE.MeshStandardMaterial({ color: neonColor, emissive: neonColor, emissiveIntensity: 20 })
          );
          blade.position.set(w/2 + 0.3, 0, 0);
          building.add(blade);
          
          const pLight = new THREE.PointLight(neonColor, 500, 100);
          pLight.position.set(w/2 + 5, 0, 0);
          building.add(pLight);
      }
    }

    // ===== LIGHTING: RETRO ARCADE VIBE (CITY-SCENE.PNG) =====
    scene.add(new THREE.AmbientLight(0x402060, 1.8)); // Strong Purple Ambient
    
    const hemiLight = new THREE.HemisphereLight(0xff5500, 0x4422aa, 1.2); // Orange sky / Purple ground
    scene.add(hemiLight);

    const orangeGlow = new THREE.DirectionalLight(0xff7700, 4.0); // Strong Orange light source like the building entrance
    orangeGlow.position.set(-100, 200, 100);
    orangeGlow.castShadow = true;
    scene.add(orangeGlow);

    // ===== WRAPPED 3D BACKGROUND (CITYSCAPE) =====
    // Using the high-fidelity cyberpunk city gif from Behance as found in city-background.html
    const loader = new THREE.TextureLoader();
    const cityTexture = loader.load('https://mir-s3-cdn-cf.behance.net/project_modules/max_632/cf3a49135903777.61f0168cc7e02.gif');
    cityTexture.wrapS = THREE.RepeatWrapping;
    cityTexture.wrapT = THREE.RepeatWrapping;
    cityTexture.repeat.set(6, 1); // Wrap 6 times for infinite scale

    const bgGeo = new THREE.CylinderGeometry(1000, 1000, 800, 32, 1, true);
    const bgMat = new THREE.MeshBasicMaterial({
        map: cityTexture,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.6,
        fog: false
    });
    const backgroundCylinder = new THREE.Mesh(bgGeo, bgMat);
    backgroundCylinder.position.y = 150;
    scene.add(backgroundCylinder);

    // Street Lamps
    for (let i = -10; i < 10; i++) {
        const lamp = new THREE.Group();
        lamp.position.set(15, 0, i * 80);
        
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 10), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        pole.position.y = 5;
        lamp.add(pole);

        const light = new THREE.PointLight(0xffaa44, 150, 40);
        light.position.set(0, 10, 0);
        lamp.add(light);
        
        scene.add(lamp);
        scene.add(lamp.clone().translateX(-30));
    }

    // ===== PLAYER: SOVEREIGN CITIZEN (AAA MODEL) =====
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 0);

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.5, 1.4, 8, 24),
      new THREE.MeshStandardMaterial({ 
        color: 0x050505, 
        metalness: 1.0, 
        roughness: 0.1, 
        emissive: 0x00ffff, 
        emissiveIntensity: 0.2 
      })
    );
    body.position.y = 1.1;
    playerGroup.add(body);

    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 })
    );
    helmet.position.y = 2.0;
    playerGroup.add(helmet);

    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.2, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 15 })
    );
    visor.position.set(0, 2.0, 0.35);
    playerGroup.add(visor);

    // Pulse Rifle (Viewmodel)
    const gun = new THREE.Group();
    gun.position.set(0.4, -0.4, -0.7); // FPS Position
    const gunBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.25, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 1.0, roughness: 0.1 })
    );
    gun.add(gunBody);

    const pulseCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.05, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x39ff14, emissive: 0x39ff14, emissiveIntensity: 10 })
    );
    pulseCore.position.z = 0.1;
    gun.add(pulseCore);
    
    // FPS Pivot
    const cameraPivot = new THREE.Group();
    cameraPivot.position.y = 2.0; // Eye level
    playerGroup.add(cameraPivot);
    cameraPivot.add(camera);
    cameraPivot.add(gun);

    helmet.visible = false; // Hide own head
    visor.visible = false;
    
    scene.add(playerGroup);

    // ===== CONTROLS & ANIMATION: TRADITIONAL FPS =====
    const keys: any = {};
    let pitch = 0;
    let yaw = 0;
    
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === containerRef.current) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, pitch));
      }
    };

    containerRef.current.addEventListener('click', () => {
      containerRef.current?.requestPointerLock();
    });

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', (e) => { if (e.button === 0) keys['MouseDown0'] = true; });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) keys['MouseDown0'] = false; });
    window.addEventListener('keydown', (e) => keys[e.code] = true);
    window.addEventListener('keyup', (e) => keys[e.code] = false);

    const clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      frameId = requestAnimationFrame(animate);

      // Movement Logic
      const moveSpeed = (keys['ShiftLeft'] ? 30 : 12) * delta;
      const moveDir = new THREE.Vector3();
      
      if (keys['KeyW']) moveDir.z -= 1;
      if (keys['KeyS']) moveDir.z += 1;
      if (keys['KeyA']) moveDir.x -= 1;
      if (keys['KeyD']) moveDir.x += 1;
      
      if (moveDir.length() > 0) {
        moveDir.normalize();
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        moveDir.applyQuaternion(q);
        playerGroup.position.add(moveDir.multiplyScalar(moveSpeed));

        // COD head bob
        const bob = Math.sin(elapsed * 12) * 0.06;
        cameraPivot.position.y = 2.0 + bob;
        gun.position.y = -0.4 + bob * 0.5;
        gun.position.x = 0.4 + Math.cos(elapsed * 6) * 0.02;
      } else {
        cameraPivot.position.y = 2.0 + Math.sin(elapsed * 2) * 0.01;
      }

      // Firing Logic
      if (keys['MouseDown0']) {
         // Recoil
         gun.position.z = -0.6 + Math.sin(elapsed * 30) * 0.05;
         gun.rotation.x = -Math.PI / 12 * (0.5 + Math.random() * 0.5);
         
         // Muzzle flash
         pulseCore.material.emissiveIntensity = 50;
      } else {
         gun.position.z = THREE.MathUtils.lerp(gun.position.z, -0.7, 0.1);
         gun.rotation.x = THREE.MathUtils.lerp(gun.rotation.x, 0, 0.1);
         pulseCore.material.emissiveIntensity = 10;
      }
      
      playerGroup.rotation.y = yaw;
      cameraPivot.rotation.x = pitch;

      // Building Procedural Animation (Neon pulse)
      buildings.forEach((b, i) => {
          const emission = 1.0 + Math.sin(elapsed * 2 + i) * 0.5;
          b.children.forEach(child => {
              if ((child as any).material && (child as any).material.emissiveIntensity) {
                  (child as any).material.emissiveIntensity = emission * 5;
              }
          });
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      renderer.domElement.remove();
    };

  }, [useFallback, user]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden rounded-[2rem] border border-gray-800 shadow-2xl">
      {isLoading && !useFallback && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0d1117]">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6" />
          <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">Synchronizing Foyer...</h3>
        </div>
      )}

      {useFallback && (
         <>
          <div className="absolute top-6 left-10 z-40 flex flex-col pointer-events-none font-mono">
            <div className="flex items-center gap-4 mb-1">
              <span className="text-yellow-400 text-3xl font-black italic drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">1P</span>
              <div className="flex items-center gap-1">
                <span className="text-red-500 text-2xl font-black">×</span>
                <span className="text-white text-3xl font-black italic drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">2</span>
              </div>
              <div className="ml-10 flex flex-col">
                <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest leading-none">Score</span>
                <span className="text-white text-3xl font-black italic drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">909</span>
              </div>
            </div>
            
            <div className="w-96 h-8 bg-black/80 border-4 border-white/20 p-1 relative overflow-hidden">
               <div className="h-full bg-gradient-to-r from-red-600 via-yellow-400 to-yellow-500 w-[85%] shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)]" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-[10px] font-black uppercase italic drop-shadow-md">Condition_Stable</span>
               </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
               <span className="text-yellow-400 text-5xl font-black italic drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">4</span>
               <span className="text-yellow-400 text-2xl font-black uppercase tracking-tighter drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">Hits</span>
            </div>
          </div>

          <div className="absolute top-6 right-6 z-40 flex flex-col items-end gap-2 pointer-events-none">
            <div className="bg-blue-600/20 border border-blue-500/40 backdrop-blur-md px-4 py-2 rounded-xl pointer-events-auto">
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">⚡ FOYER_ACTIVE</p>
              <p className="text-[10px] text-white font-bold">WASD to Move • SHIFT to Sprint</p>
            </div>
            <button 
              onClick={() => onExit()}
              className="bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-bold text-gray-400 transition-all pointer-events-auto"
            >
              RETURN_TO_VAULT
            </button>
          </div>
         </>
      )}

      <canvas id="canvas" className={`absolute inset-0 w-full h-full ${useFallback ? 'hidden' : 'block'}`} />
    </div>
  );
};
