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

  // Three.js Interactive Shard
  useEffect(() => {
    if (!useFallback || !containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070a);
    scene.fog = new THREE.FogExp2(0x05070a, 0.04);

    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // City Floor
    const grid = new THREE.GridHelper(200, 40, 0x0ea5e9, 0x1e293b);
    scene.add(grid);

    // Character Group
    const playerGroup = new THREE.Group();
    
    // Simple Humanoid Body
    const bodyGeo = new THREE.BoxGeometry(1, 1.5, 0.5);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0x1e293b });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.25;
    playerGroup.add(body);

    const headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const headMat = new THREE.MeshPhongMaterial({ color: user?.character?.skinColor || 0xe0ac69 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.3;
    playerGroup.add(head);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.3, 1, 0.3);
    const leftArm = new THREE.Mesh(armGeo, bodyMat);
    leftArm.position.set(-0.7, 1.5, 0);
    playerGroup.add(leftArm);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.7, 1.8, 0);
    const rightArm = new THREE.Mesh(armGeo, bodyMat);
    rightArm.position.y = -0.4;
    rightArmGroup.add(rightArm);
    playerGroup.add(rightArmGroup);

    // THE BIG STICK
    const stickGroup = new THREE.Group();
    const stickGeo = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
    const stickMat = new THREE.MeshPhongMaterial({ color: 0x4a3b2a });
    const stick = new THREE.Mesh(stickGeo, stickMat);
    stick.position.y = 1.5; // Stick extends upward from hand
    stickGroup.add(stick);
    
    // Attach stick to right arm
    stickGroup.position.set(0, -0.8, 0);
    stickGroup.rotation.x = Math.PI / 2;
    rightArmGroup.add(stickGroup);

    scene.add(playerGroup);

    // Basic Buildings
    const buildings: THREE.Mesh[] = [];
    for (let i = 0; i < 30; i++) {
       const h = Math.random() * 20 + 10;
       const geo = new THREE.BoxGeometry(5, h, 5);
       const mat = new THREE.MeshStandardMaterial({ color: 0x111827, emissive: 0x0ea5e9, emissiveIntensity: 0.1 });
       const b = new THREE.Mesh(geo, mat);
       b.position.set(Math.random() * 100 - 50, h/2, Math.random() * 100 - 50);
       // Avoid center
       if (b.position.length() < 10) b.position.x += 15;
       scene.add(b);
       buildings.push(b);
    }

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const sun = new THREE.DirectionalLight(0x0ea5e9, 1);
    sun.position.set(10, 20, 10);
    scene.add(sun);

    // Controls Logic
    const keys: any = {};
    window.addEventListener('keydown', (e) => keys[e.code] = true);
    window.addEventListener('keyup', (e) => keys[e.code] = false);

    let isSwinging = false;
    let swingTimer = 0;
    window.addEventListener('mousedown', () => {
      if (!isSwinging) {
        isSwinging = true;
        swingTimer = 0;
      }
    });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !isSwinging) {
        isSwinging = true;
        swingTimer = 0;
      }
    });

    const velocity = new THREE.Vector3();
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const frameId = requestAnimationFrame(animate);

      // Movement
      const moveSpeed = 10 * delta;
      const rotateSpeed = 3 * delta;

      if (keys['KeyW']) {
        velocity.z = -moveSpeed;
        playerGroup.translateZ(-moveSpeed);
      }
      if (keys['KeyS']) {
        velocity.z = moveSpeed;
        playerGroup.translateZ(moveSpeed);
      }
      if (keys['KeyA']) {
        playerGroup.rotation.y += rotateSpeed;
      }
      if (keys['KeyD']) {
        playerGroup.rotation.y -= rotateSpeed;
      }

      // Swinging Animation
      if (isSwinging) {
        swingTimer += delta * 15;
        // Swing arm and stick
        rightArmGroup.rotation.x = -Math.sin(swingTimer) * 2;
        if (swingTimer > Math.PI) {
          isSwinging = false;
          rightArmGroup.rotation.x = 0;
        }
      }

      // Camera Follow
      const relativeCameraOffset = new THREE.Vector3(0, 5, 12);
      const cameraOffset = relativeCameraOffset.applyMatrix4(playerGroup.matrixWorld);
      camera.position.lerp(cameraOffset, 0.1);
      camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1, playerGroup.position.z);

      renderer.render(scene, camera);
      return frameId;
    };
    const animId = animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [useFallback]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-gray-800 shadow-2xl">
      {isLoading && !useFallback && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0d1117]">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6" />
          <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">Synchronizing Shard...</h3>
        </div>
      )}

      {useFallback && (
         <>
          <div className="absolute top-6 right-6 z-40 flex flex-col items-end gap-2">
              <div className="bg-blue-600/20 border border-blue-500/40 backdrop-blur-md px-4 py-2 rounded-xl">
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">⚡ SHARD_ACTIVE</p>
                <p className="text-[10px] text-white font-bold">WASD to Move • SPACE to Swing Stick</p>
              </div>
              <button 
                onClick={() => onExit()}
                className="bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-bold text-gray-400 transition-all"
              >
                RETURN_TO_VAULT
              </button>
          </div>
         </>
      )}

      <canvas id="canvas" className={`w-full h-full ${useFallback ? 'hidden' : 'block'}`} />
    </div>
  );
};
