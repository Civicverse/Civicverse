import * as THREE from 'three';
import { CharacterConfig } from '../store/gameStore';

export const createCharacterMesh = (config: CharacterConfig & { weapon?: string }): THREE.Group => {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: config.skinColor, roughness: 0.5 });
  const hairMat = new THREE.MeshStandardMaterial({ color: config.hairColor, roughness: 0.8 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: config.shirtColor, roughness: 0.7, metalness: 0.1 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: config.pantsColor, roughness: 0.8 });
  const shoesMat = new THREE.MeshStandardMaterial({ color: config.shoesColor, roughness: 0.4 });
  const badgeMat = new THREE.MeshStandardMaterial({ color: 0x9b896d, roughness: 0.72, metalness: 0.18 });
  const isFeminine = config.presentation === 'feminine';
  const bodyWidth = config.bodyType === 'slim' ? 0.88 : config.bodyType === 'heavy' ? 1.18 : 1;
  const armorMat = new THREE.MeshStandardMaterial({ color: 0x93a4bd, metalness: 0.8, roughness: 0.25 });
  const trimMat = new THREE.MeshStandardMaterial({ color: config.shirtColor, metalness: 0.35, roughness: 0.35 });
  const jacketColor = new THREE.Color(config.outfit === 'formal' ? config.shirtColor : 0x1b2029);
  if (config.outfit !== 'formal') jacketColor.multiplyScalar(0.82);
  const jacketMat = new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.68, metalness: 0.16 });
  const jacketTrimMat = new THREE.MeshStandardMaterial({ color: 0x766c60, roughness: 0.72, metalness: 0.12 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0x171b22, roughness: 0.72, metalness: 0.12 });

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
  [-1, 1].forEach(side => {
    const ear = createMesh(new THREE.SphereGeometry(0.04, 16, 12), skinMat, side * 0.115, 1.74, 0);
    ear.scale.set(0.55, 1, 0.7);
    group.add(ear);
  });
  const nose = createMesh(new THREE.ConeGeometry(0.026, 0.075, 12), skinMat, 0, 1.73, 0.12);
  nose.rotation.x = Math.PI / 2;
  group.add(nose);

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
    } else if (config.hairStyle === 'long' || config.hairStyle === 'ponytail' || config.hairStyle === 'braids') {
      hairGeo = new THREE.SphereGeometry(0.13, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const hair = createMesh(hairGeo, hairMat, 0, 1.78, 0);
      hair.scale.set(1, 1.2, 1.1);
      group.add(hair);
      if (config.hairStyle === 'ponytail') {
        const tail = createMesh(new THREE.CylinderGeometry(0.045, 0.025, 0.36, 12), hairMat, 0, 1.55, -0.16);
        tail.rotation.x = -0.25;
        group.add(tail);
        group.add(createMesh(new THREE.TorusGeometry(0.045, 0.012, 8, 16), trimMat, 0, 1.72, -0.12));
      } else if (config.hairStyle === 'braids') {
        [-1, 1].forEach(side => {
          for (let index = 0; index < 5; index += 1) {
            group.add(createMesh(new THREE.SphereGeometry(0.04, 12, 10), hairMat, side * 0.12, 1.68 - index * 0.07, 0.015));
          }
        });
      } else {
        const backHair = createMesh(new THREE.BoxGeometry(0.24, 0.4, 0.05), hairMat, 0, 1.6, -0.12);
        group.add(backHair);
      }
    } else if (config.hairStyle === 'curly') {
      group.add(createMesh(new THREE.SphereGeometry(0.125, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), hairMat, 0, 1.78, 0));
      for (let index = 0; index < 9; index += 1) {
        const angle = (index / 9) * Math.PI * 2;
        group.add(createMesh(new THREE.SphereGeometry(0.045, 12, 10), hairMat, Math.cos(angle) * 0.085, 1.81, Math.sin(angle) * 0.085));
      }
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
  const chestGeo = new THREE.CylinderGeometry((isFeminine ? 0.16 : 0.18) * bodyWidth, (isFeminine ? 0.13 : 0.16) * bodyWidth, 0.25, 24);
  group.add(createMesh(chestGeo, shirtMat, 0, 1.45, 0));

  // Abs/Stomach
  const stomachGeo = new THREE.CylinderGeometry(0.15 * bodyWidth, 0.14 * bodyWidth, 0.25, 20);
  group.add(createMesh(stomachGeo, shirtMat, 0, 1.2, 0));

  // Hips/Pelvis
  const hipsGeo = new THREE.CylinderGeometry((isFeminine ? 0.16 : 0.14) * bodyWidth, (isFeminine ? 0.18 : 0.15) * bodyWidth, 0.15, 24);
  group.add(createMesh(hipsGeo, pantsMat, 0, 1.0, 0));

  const jacketBody = createMesh(
    new THREE.CapsuleGeometry(0.19 * bodyWidth, 0.28, 6, 12),
    jacketMat,
    0,
    1.33,
    0
  );
  group.add(jacketBody);
  [-1, 1].forEach(side => {
    const shoulder = createMesh(new THREE.SphereGeometry(0.075, 16, 12), jacketMat, side * 0.19, 1.48, 0);
    shoulder.scale.set(1.1, 0.78, 1);
    group.add(shoulder);
    const sleeve = createMesh(new THREE.CapsuleGeometry(0.052, 0.19, 4, 8), jacketMat, side * 0.22, 1.32, 0);
    sleeve.rotation.z = side * -0.08;
    group.add(sleeve);
    group.add(createMesh(new THREE.TorusGeometry(0.052, 0.012, 8, 16), jacketTrimMat, side * 0.22, 1.19, 0));
    const pocket = createMesh(new THREE.BoxGeometry(0.08, 0.095, 0.018), jacketTrimMat, side * 0.115, 1.23, 0.195);
    group.add(pocket);
  });
  const collar = createMesh(new THREE.TorusGeometry(0.075, 0.026, 8, 20), jacketMat, 0, 1.57, 0);
  collar.rotation.x = Math.PI / 2;
  group.add(collar);
  group.add(createMesh(new THREE.BoxGeometry(0.018, 0.3, 0.016), jacketTrimMat, 0, 1.34, 0.195));
  [-1, 1].forEach(side => {
    const lapel = createMesh(new THREE.BoxGeometry(0.04, 0.2, 0.022), jacketTrimMat, side * 0.055, 1.43, 0.19);
    lapel.rotation.z = side * -0.24;
    group.add(lapel);
  });

  const emblemCanvas = document.createElement('canvas');
  emblemCanvas.width = 256;
  emblemCanvas.height = 144;
  const emblemContext = emblemCanvas.getContext('2d');
  if (emblemContext) {
    emblemContext.clearRect(0, 0, emblemCanvas.width, emblemCanvas.height);
    emblemContext.fillStyle = 'rgba(7, 13, 22, 0.78)';
    emblemContext.fillRect(12, 12, 232, 120);
    emblemContext.strokeStyle = '#a99572';
    emblemContext.lineWidth = 5;
    emblemContext.strokeRect(12, 12, 232, 120);
    emblemContext.fillStyle = '#d8c7a6';
    emblemContext.textAlign = 'center';
    emblemContext.font = '900 64px sans-serif';
    emblemContext.fillText('CV', 128, 77);
    emblemContext.font = '700 19px sans-serif';
    emblemContext.fillText('CIVICVERSE', 128, 111);
  }
  const emblemTexture = new THREE.CanvasTexture(emblemCanvas);
  emblemTexture.colorSpace = THREE.SRGBColorSpace;
  const backEmblem = createMesh(
    new THREE.PlaneGeometry(0.34, 0.19),
    new THREE.MeshBasicMaterial({ map: emblemTexture, transparent: true, side: THREE.DoubleSide }),
    0,
    1.37,
    -0.194
  );
  backEmblem.rotation.y = Math.PI;
  group.add(backEmblem);

  [-1, 1].forEach(side => {
    const boot = createMesh(new THREE.CapsuleGeometry(0.07, 0.12, 4, 10), shoesMat, side * 0.1, 0.08, 0.035);
    boot.rotation.x = Math.PI / 2;
    boot.scale.set(0.85, 1, 1.1);
    group.add(boot);
    const kneePad = createMesh(new THREE.BoxGeometry(0.09, 0.11, 0.035), jacketTrimMat, side * 0.1, 0.55, 0.07);
    group.add(kneePad);
  });

  if (config.outfit === 'armor') {
    const chestPlate = createMesh(new THREE.BoxGeometry(0.24, 0.19, 0.055), armorMat, 0, 1.43, 0.23);
    group.add(chestPlate);
    [-1, 1].forEach(side => {
      const shoulderPad = createMesh(new THREE.SphereGeometry(0.075, 16, 12), armorMat, side * 0.21, 1.5, 0);
      shoulderPad.scale.set(1.25, 0.75, 1);
      group.add(shoulderPad);
    });
  } else if (config.outfit === 'formal') {
    const tie = createMesh(new THREE.BoxGeometry(0.035, 0.19, 0.025), trimMat, 0, 1.38, 0.22);
    group.add(tie);
    [-1, 1].forEach(side => {
      const lapel = createMesh(new THREE.BoxGeometry(0.04, 0.16, 0.025), trimMat, side * 0.055, 1.42, 0.22);
      lapel.rotation.z = side * -0.22;
      group.add(lapel);
    });
  } else if (config.outfit === 'streetwear') {
    const hood = createMesh(new THREE.TorusGeometry(0.105, 0.035, 8, 20, Math.PI), shirtMat, 0, 1.59, -0.045);
    hood.rotation.z = Math.PI;
    group.add(hood);
    const pocket = createMesh(new THREE.BoxGeometry(0.12, 0.045, 0.018), trimMat, 0, 1.25, 0.15);
    group.add(pocket);
  } else if (config.outfit === 'cyberpunk') {
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x00d9ff, emissive: 0x00d9ff, emissiveIntensity: 0.8, metalness: 0.5 });
    [-1, 1].forEach(side => {
      const shoulder = createMesh(new THREE.SphereGeometry(0.075, 24, 16), armorMat, side * 0.2, 1.5, 0);
      shoulder.scale.set(1.25, 0.75, 1);
      group.add(shoulder);
      group.add(createMesh(new THREE.BoxGeometry(0.035, 0.22, 0.025), accentMat, side * 0.09, 1.42, 0.22));
    });
    group.add(createMesh(new THREE.BoxGeometry(0.2, 0.025, 0.025), accentMat, 0, 1.3, 0.22));
  } else if (config.outfit === 'explorer') {
    const scarf = createMesh(new THREE.TorusGeometry(0.07, 0.025, 10, 24), trimMat, 0, 1.58, 0);
    scarf.rotation.x = Math.PI / 2;
    group.add(scarf);
    group.add(createMesh(new THREE.BoxGeometry(0.27, 0.42, 0.035), pantsMat, 0, 1.34, -0.12));
    group.add(createMesh(new THREE.BoxGeometry(0.045, 0.24, 0.025), trimMat, 0.08, 1.38, 0.22));
  } else if (config.outfit === 'ceremonial') {
    [-1, 1].forEach(side => {
      const shoulder = createMesh(new THREE.SphereGeometry(0.07, 20, 12), trimMat, side * 0.19, 1.5, 0);
      shoulder.scale.set(1.2, 0.7, 1);
      group.add(shoulder);
      const coatPanel = createMesh(new THREE.BoxGeometry(0.055, 0.26, 0.025), trimMat, side * 0.08, 1.32, 0.22);
      coatPanel.rotation.z = side * 0.04;
      group.add(coatPanel);
    });
  }

  // Subtle jacket badge
  const logoGeo = new THREE.PlaneGeometry(0.08, 0.08);
  const logo = createMesh(logoGeo, badgeMat, 0, 1.45, 0.225);
  logo.rotation.x = -0.1;
  group.add(logo);

  // --- ARMS (Jointed) ---
  const armRadius = 0.045;
  const armLen = 0.28;

  // Left Arm
  const shoulderOffset = isFeminine ? 0.18 : 0.2;
  const lShoulder = createMesh(new THREE.SphereGeometry(0.06), jacketMat, -shoulderOffset, 1.5, 0);
  group.add(lShoulder);

  const lUpperArm = createMesh(new THREE.CylinderGeometry(armRadius, armRadius * 0.9, armLen), jacketMat, -0.22, 1.35, 0);
  group.add(lUpperArm);

  const lForearm = createMesh(new THREE.CylinderGeometry(armRadius * 0.9, armRadius * 0.7, armLen), jacketMat, -0.22, 1.1, 0.05);
  lForearm.rotation.x = -0.1; // Slight bend
  group.add(lForearm);

  const lHand = createMesh(new THREE.BoxGeometry(0.045, 0.08, 0.08), gloveMat, -0.22, 0.92, 0.08);
  group.add(lHand);

  // Right Arm
  const rShoulder = createMesh(new THREE.SphereGeometry(0.06), jacketMat, shoulderOffset, 1.5, 0);
  group.add(rShoulder);

  const rUpperArm = createMesh(new THREE.CylinderGeometry(armRadius, armRadius * 0.9, armLen), jacketMat, 0.22, 1.35, 0);
  group.add(rUpperArm);

  const rForearm = createMesh(new THREE.CylinderGeometry(armRadius * 0.9, armRadius * 0.7, armLen), jacketMat, 0.22, 1.1, 0.05);
  rForearm.rotation.x = -0.1;
  group.add(rForearm);

  const rHand = createMesh(new THREE.BoxGeometry(0.045, 0.08, 0.08), gloveMat, 0.22, 0.92, 0.08);
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

export const createPlayerNametag = (username: string, color = '#00f3ff'): THREE.Sprite => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 512, 128);

    // Rounded rectangle background
    ctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(16, 20, 480, 88, 44);
    } else {
      ctx.rect(16, 20, 480, 88);
    }
    ctx.fill();
    ctx.stroke();

    // Pulse dot (live status)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(56, 64, 12, 0, Math.PI * 2);
    ctx.fill();

    // Text (display name)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(username.length > 18 ? username.slice(0, 16) + '..' : username, 84, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(2.4, 0.6, 1);
  sprite.position.set(0, 2.35, 0);
  return sprite;
};
