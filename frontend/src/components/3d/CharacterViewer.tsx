import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CharacterConfig } from '../../store/gameStore';
import { createCharacterMesh } from '../../lib/characterFactory';

interface CharacterViewerProps {
  config: CharacterConfig;
  className?: string;
  animate?: boolean;
  scale?: number;
}

export function CharacterViewer({ config, className = '', animate = true, scale = 1 }: CharacterViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    // Transparent background for overlay
    // scene.background = null; 

    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100);
    camera.position.set(0, 1.2, 3.5); // Focus on upper body for portrait feel
    camera.lookAt(0, 0.9, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Lighting (Cinematic) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(2, 5, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const rimLight = new THREE.SpotLight(0x00d9ff, 2);
    rimLight.position.set(-5, 5, -5);
    rimLight.lookAt(0, 0, 0);
    scene.add(rimLight);

    const fillLight = new THREE.SpotLight(0xff006e, 1.5);
    fillLight.position.set(5, 0, 2);
    fillLight.lookAt(0, 0, 0);
    scene.add(fillLight);

    // --- Character Group ---
    const characterGroup = new THREE.Group();
    characterGroup.scale.set(scale, scale, scale);
    scene.add(characterGroup);
    characterGroupRef.current = characterGroup;

    // --- Animation Loop ---
    let time = 0;
    const loop = () => {
      animationFrameRef.current = requestAnimationFrame(loop);
      time += 0.02;

      if (characterGroupRef.current && animate) {
        // Subtle breathing
        characterGroupRef.current.position.y = Math.sin(time * 0.5) * 0.02 - 0.9; // Lowered to center
        
        // Idle rotation
        characterGroupRef.current.rotation.y = Math.sin(time * 0.2) * 0.1;
      }

      renderer.render(scene, camera);
    };
    loop();

    // --- Resize ---
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        containerRef.current?.removeChild(rendererRef.current.domElement);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // --- Character Construction ---
  useEffect(() => {
    if (!characterGroupRef.current) return;
    
    // Clear previous
    while(characterGroupRef.current.children.length > 0){ 
      characterGroupRef.current.remove(characterGroupRef.current.children[0]); 
    }

    const meshGroup = createCharacterMesh(config);
    
    // Move children from generated group to this group to maintain reference
    while(meshGroup.children.length > 0){
        characterGroupRef.current.add(meshGroup.children[0]);
    }

  }, [config]);

  return <div ref={containerRef} className={`w-full h-full ${className}`} />;
}
