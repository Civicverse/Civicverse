import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CharacterConfig } from '../../store/gameStore';

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

    const skinMat = new THREE.MeshStandardMaterial({ color: config.skinColor, roughness: 0.5 });
    const hairMat = new THREE.MeshStandardMaterial({ color: config.hairColor, roughness: 0.8 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: config.shirtColor, roughness: 0.7, metalness: 0.1 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: config.pantsColor, roughness: 0.8 });
    const shoesMat = new THREE.MeshStandardMaterial({ color: config.shoesColor, roughness: 0.4 });
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x00d9ff }); // Glowing accent

    // Helper for primitives
    const createMesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x=0, y=0, z=0, sX=1, sY=1, sZ=1) => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(sX, sY, sZ);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    const group = characterGroupRef.current;

    // --- HEAD (Detailed) ---
    // Skull base
    const headGeo = new THREE.SphereGeometry(0.12, 32, 32);
    group.add(createMesh(headGeo, skinMat, 0, 1.75, 0));
    
    // Jaw/Chin
    const jawGeo = new THREE.CylinderGeometry(0.09, 0.06, 0.12, 16);
    group.add(createMesh(jawGeo, skinMat, 0, 1.68, 0.02));

    // Eyes (Sunglasses or Eyes)
    if (config.accessory === 'glasses') {
      const glassesGeo = new THREE.BoxGeometry(0.16, 0.04, 0.05);
      const glasses = createMesh(glassesGeo, new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 }), 0, 1.76, 0.1);
      group.add(glasses);
    } else {
      // Eyes
      const eyeGeo = new THREE.SphereGeometry(0.015, 8, 8);
      const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const eyePupil = new THREE.MeshStandardMaterial({ color: 0x000000 });
      
      const leftEye = createMesh(eyeGeo, eyeWhite, -0.04, 1.76, 0.105);
      const rightEye = createMesh(eyeGeo, eyeWhite, 0.04, 1.76, 0.105);
      group.add(leftEye);
      group.add(rightEye);
    }

    // Hair
    if (config.hairStyle !== 'bald') {
        let hairGeo;
        if (config.hairStyle === 'mohawk') {
            hairGeo = new THREE.BoxGeometry(0.04, 0.15, 0.2);
            group.add(createMesh(hairGeo, hairMat, 0, 1.88, 0));
        } else if (config.hairStyle === 'long') {
            hairGeo = new THREE.SphereGeometry(0.13, 32, 16, 0, Math.PI * 2, 0, Math.PI/2);
            const hair = createMesh(hairGeo, hairMat, 0, 1.78, 0);
            hair.scale.set(1, 1.2, 1.1);
            group.add(hair);
            // Long back
            const backHair = createMesh(new THREE.BoxGeometry(0.24, 0.4, 0.05), hairMat, 0, 1.6, -0.12);
            group.add(backHair);
        } else {
            // Short
            hairGeo = new THREE.SphereGeometry(0.125, 32, 16, 0, Math.PI * 2, 0, Math.PI/2);
            group.add(createMesh(hairGeo, hairMat, 0, 1.78, 0));
        }
    }

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.1, 16);
    group.add(createMesh(neckGeo, skinMat, 0, 1.6, 0));

    // --- TORSO (Detailed) ---
    // Upper Chest (Male/Female generic athletic)
    const chestGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.25, 16);
    group.add(createMesh(chestGeo, shirtMat, 0, 1.45, 0));

    // Abs/Stomach
    const stomachGeo = new THREE.CylinderGeometry(0.15, 0.14, 0.25, 16);
    group.add(createMesh(stomachGeo, shirtMat, 0, 1.2, 0));
    
    // Hips/Pelvis
    const hipsGeo = new THREE.CylinderGeometry(0.14, 0.15, 0.15, 16);
    group.add(createMesh(hipsGeo, pantsMat, 0, 1.0, 0));

    // Neon Accent on Chest
    const logoGeo = new THREE.PlaneGeometry(0.08, 0.08);
    const logo = createMesh(logoGeo, neonMat, 0, 1.45, 0.17);
    logo.rotation.x = -0.1;
    group.add(logo);

    // --- ARMS (Jointed) ---
    const armRadius = 0.045;
    const armLen = 0.28;
    
    // Left Arm
    const lShoulder = createMesh(new THREE.SphereGeometry(0.06), shirtMat, -0.2, 1.5, 0);
    group.add(lShoulder);
    
    const lUpperArm = createMesh(new THREE.CylinderGeometry(armRadius, armRadius*0.9, armLen), shirtMat, -0.22, 1.35, 0);
    group.add(lUpperArm);
    
    const lForearm = createMesh(new THREE.CylinderGeometry(armRadius*0.9, armRadius*0.7, armLen), skinMat, -0.22, 1.1, 0.05);
    lForearm.rotation.x = -0.1; // Slight bend
    group.add(lForearm);
    
    const lHand = createMesh(new THREE.BoxGeometry(0.04, 0.08, 0.08), skinMat, -0.22, 0.92, 0.08);
    group.add(lHand);

    // Right Arm
    const rShoulder = createMesh(new THREE.SphereGeometry(0.06), shirtMat, 0.2, 1.5, 0);
    group.add(rShoulder);
    
    const rUpperArm = createMesh(new THREE.CylinderGeometry(armRadius, armRadius*0.9, armLen), shirtMat, 0.22, 1.35, 0);
    group.add(rUpperArm);
    
    const rForearm = createMesh(new THREE.CylinderGeometry(armRadius*0.9, armRadius*0.7, armLen), skinMat, 0.22, 1.1, 0.05);
    rForearm.rotation.x = -0.1;
    group.add(rForearm);
    
    const rHand = createMesh(new THREE.BoxGeometry(0.04, 0.08, 0.08), skinMat, 0.22, 0.92, 0.08);
    group.add(rHand);

    // --- LEGS (Jointed) ---
    const legRadius = 0.065;
    const legLen = 0.4;
    
    // Left Leg
    const lThigh = createMesh(new THREE.CylinderGeometry(legRadius, legRadius*0.8, legLen), pantsMat, -0.1, 0.75, 0);
    group.add(lThigh);
    
    const lKnee = createMesh(new THREE.SphereGeometry(legRadius*0.85), pantsMat, -0.1, 0.55, 0.02);
    group.add(lKnee);

    const lShin = createMesh(new THREE.CylinderGeometry(legRadius*0.8, legRadius*0.6, legLen), pantsMat, -0.1, 0.35, 0);
    group.add(lShin);

    const lFoot = createMesh(new THREE.BoxGeometry(0.12, 0.08, 0.22), shoesMat, -0.1, 0.04, 0.05);
    group.add(lFoot);

    // Right Leg
    const rThigh = createMesh(new THREE.CylinderGeometry(legRadius, legRadius*0.8, legLen), pantsMat, 0.1, 0.75, 0);
    group.add(rThigh);
    
    const rKnee = createMesh(new THREE.SphereGeometry(legRadius*0.85), pantsMat, 0.1, 0.55, 0.02);
    group.add(rKnee);

    const rShin = createMesh(new THREE.CylinderGeometry(legRadius*0.8, legRadius*0.6, legLen), pantsMat, 0.1, 0.35, 0);
    group.add(rShin);

    const rFoot = createMesh(new THREE.BoxGeometry(0.12, 0.08, 0.22), shoesMat, 0.1, 0.04, 0.05);
    group.add(rFoot);

  }, [config]);

  return <div ref={containerRef} className={`w-full h-full ${className}`} />;
}
