import * as THREE from 'three';
import { CharacterConfig } from '../store/gameStore';

export const createCharacterMesh = (config: CharacterConfig & { weapon?: string }): THREE.Group => {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: config.skinColor, roughness: 0.5 });
  const hairMat = new THREE.MeshStandardMaterial({ color: config.hairColor, roughness: 0.8 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: config.shirtColor, roughness: 0.7, metalness: 0.1 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: config.pantsColor, roughness: 0.8 });
  const shoesMat = new THREE.MeshStandardMaterial({ color: config.shoesColor, roughness: 0.4 });
  const neonMat = new THREE.MeshBasicMaterial({ color: 0x00d9ff }); // Glowing accent

  // Helper for primitives
  const createMesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0, sX = 1, sY = 1, sZ = 1) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(sX, sY, sZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

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
    const eyePupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const leftEye = createMesh(eyeGeo, eyeWhite, -0.04, 1.76, 0.105);
    const rightEye = createMesh(eyeGeo, eyeWhite, 0.04, 1.76, 0.105);
    group.add(leftEye);
    group.add(rightEye);

    // Pupils
    const pupilGeo = new THREE.SphereGeometry(0.008, 8, 8);
    group.add(createMesh(pupilGeo, eyePupilMat, -0.04, 1.76, 0.115));
    group.add(createMesh(pupilGeo, eyePupilMat, 0.04, 1.76, 0.115));
  }

  // Hair
  if (config.hairStyle !== 'bald') {
    let hairGeo;
    if (config.hairStyle === 'mohawk') {
      hairGeo = new THREE.BoxGeometry(0.04, 0.15, 0.2);
      group.add(createMesh(hairGeo, hairMat, 0, 1.88, 0));
    } else if (config.hairStyle === 'long') {
      hairGeo = new THREE.SphereGeometry(0.13, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const hair = createMesh(hairGeo, hairMat, 0, 1.78, 0);
      hair.scale.set(1, 1.2, 1.1);
      group.add(hair);
      // Long back
      const backHair = createMesh(new THREE.BoxGeometry(0.24, 0.4, 0.05), hairMat, 0, 1.6, -0.12);
      group.add(backHair);
    } else {
      // Short
      hairGeo = new THREE.SphereGeometry(0.125, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
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

  const lUpperArm = createMesh(new THREE.CylinderGeometry(armRadius, armRadius * 0.9, armLen), shirtMat, -0.22, 1.35, 0);
  group.add(lUpperArm);

  const lForearm = createMesh(new THREE.CylinderGeometry(armRadius * 0.9, armRadius * 0.7, armLen), skinMat, -0.22, 1.1, 0.05);
  lForearm.rotation.x = -0.1; // Slight bend
  group.add(lForearm);

  const lHand = createMesh(new THREE.BoxGeometry(0.04, 0.08, 0.08), skinMat, -0.22, 0.92, 0.08);
  group.add(lHand);

  // Right Arm
  const rShoulder = createMesh(new THREE.SphereGeometry(0.06), shirtMat, 0.2, 1.5, 0);
  group.add(rShoulder);

  const rUpperArm = createMesh(new THREE.CylinderGeometry(armRadius, armRadius * 0.9, armLen), shirtMat, 0.22, 1.35, 0);
  group.add(rUpperArm);

  const rForearm = createMesh(new THREE.CylinderGeometry(armRadius * 0.9, armRadius * 0.7, armLen), skinMat, 0.22, 1.1, 0.05);
  rForearm.rotation.x = -0.1;
  group.add(rForearm);

  const rHand = createMesh(new THREE.BoxGeometry(0.04, 0.08, 0.08), skinMat, 0.22, 0.92, 0.08);
  group.add(rHand);

  // --- LEGS (Jointed) ---
  const legRadius = 0.065;
  const legLen = 0.4;

  // Left Leg
  const lThigh = createMesh(new THREE.CylinderGeometry(legRadius, legRadius * 0.8, legLen), pantsMat, -0.1, 0.75, 0);
  group.add(lThigh);

  const lKnee = createMesh(new THREE.SphereGeometry(legRadius * 0.85), pantsMat, -0.1, 0.55, 0.02);
  group.add(lKnee);

  const lShin = createMesh(new THREE.CylinderGeometry(legRadius * 0.8, legRadius * 0.6, legLen), pantsMat, -0.1, 0.35, 0);
  group.add(lShin);

  const lFoot = createMesh(new THREE.BoxGeometry(0.12, 0.08, 0.22), shoesMat, -0.1, 0.04, 0.05);
  group.add(lFoot);

  // Right Leg
  const rThigh = createMesh(new THREE.CylinderGeometry(legRadius, legRadius * 0.8, legLen), pantsMat, 0.1, 0.75, 0);
  group.add(rThigh);

  const rKnee = createMesh(new THREE.SphereGeometry(legRadius * 0.85), pantsMat, 0.1, 0.55, 0.02);
  group.add(rKnee);

  const rShin = createMesh(new THREE.CylinderGeometry(legRadius * 0.8, legRadius * 0.6, legLen), pantsMat, 0.1, 0.35, 0);
  group.add(rShin);

  const rFoot = createMesh(new THREE.BoxGeometry(0.12, 0.08, 0.22), shoesMat, 0.1, 0.04, 0.05);
  group.add(rFoot);

  // --- WEAPON (Conditional) ---
  if (config.weapon && config.weapon !== 'None') {
    const weaponGroup = new THREE.Group();
    
    if (config.weapon.includes('Sword') || config.weapon.includes('Blade') || config.weapon.includes('Axe')) {
        const bladeGeo = new THREE.BoxGeometry(0.05, 1.0, 0.02);
        const bladeMat = new THREE.MeshStandardMaterial({ 
          color: config.weapon.includes('Crystal') ? 0x00d4ff : 0xcccccc, 
          metalness: 0.9, 
          roughness: 0.1,
          emissive: config.weapon.includes('Crystal') ? 0x00d4ff : 0x000000,
          emissiveIntensity: 0.5
        });
        const blade = createMesh(bladeGeo, bladeMat, 0, 0.5, 0);
        weaponGroup.add(blade);

        const hiltGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2);
        const hiltMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.5 });
        const hilt = createMesh(hiltGeo, hiltMat, 0, -0.1, 0);
        weaponGroup.add(hilt);
        
        const guardGeo = new THREE.BoxGeometry(0.15, 0.02, 0.04);
        const guard = createMesh(guardGeo, hiltMat, 0, 0.02, 0);
        weaponGroup.add(guard);
    } else if (config.weapon.includes('Staff') || config.weapon.includes('Wand')) {
        const staffGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.2);
        const staffMat = new THREE.MeshStandardMaterial({ color: 0x4a3b2a });
        const staff = createMesh(staffGeo, staffMat, 0, 0, 0);
        weaponGroup.add(staff);
        
        const crystalGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const crystalMat = new THREE.MeshStandardMaterial({ color: 0x00d9ff, emissive: 0x00d9ff, emissiveIntensity: 1 });
        const crystal = createMesh(crystalGeo, crystalMat, 0, 0.65, 0);
        weaponGroup.add(crystal);
    }

    // Attach to right hand
    weaponGroup.position.set(0.22, 0.92, 0.08);
    weaponGroup.rotation.x = Math.PI / 2;
    weaponGroup.rotation.z = -Math.PI / 4;
    group.add(weaponGroup);
  }

  return group;
};
