import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

export interface BillboardStory {
  id: string;
  title: string;
  author: string;
  category: string;
  tag: string;
  color: string;
  sourceUrl: string;
  profileUrl?: string;
  authorId?: string;
  imageUrl?: string;
  videoUrl?: string;
  mimeType?: string;
  reward?: string;
  timestamp?: string;
}

export interface BillboardHandle {
  mesh: THREE.Mesh;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  stories: BillboardStory[];
  currentStoryIdx: number;
  lastSwitchTime: number;
  scanlineY: number;
  width: number;
  height: number;
  isJumbotron?: boolean;
  lastRenderTime?: number;
  update: (elapsed: number, delta: number) => void;
}

export interface ShootingStar {
  line: THREE.Line;
  startPos: THREE.Vector3;
  dir: THREE.Vector3;
  speed: number;
  progress: number;
  length: number;
  active: boolean;
  nextTriggerTime: number;
}

export interface TrafficSignalMaterials {
  uAxis: [THREE.MeshStandardMaterial, THREE.MeshStandardMaterial, THREE.MeshStandardMaterial];
  vAxis: [THREE.MeshStandardMaterial, THREE.MeshStandardMaterial, THREE.MeshStandardMaterial];
}

export interface CityAnimationHandles {
  gatGroup?: THREE.Group;
  billboards: BillboardHandle[];
  shootingStars: ShootingStar[];
  fogBankGroup: THREE.Group;
  fogBanks: FogBankHandle[];
  cloudGroup: THREE.Group;
  clouds: FogBankHandle[];
  starPoints?: THREE.Points;
  nebulaGroup?: THREE.Group;
  moonGroup?: THREE.Group;
  beaconLights: THREE.Mesh[];
  streetSpotLights?: THREE.SpotLight[];
  trafficSignals: TrafficSignalMaterials;
  rain: THREE.LineSegments;
  rainGeometry: THREE.BufferGeometry;
  vehicles: DriveableVehicleHandle[];
  collisionObstacles: CollisionObstacle[];
  bridge: SkyBridgeHandle;
}

export interface FogBankHandle {
  sprite: THREE.Sprite;
  originX: number;
  originY: number;
  originZ: number;
  driftX: number;
  driftZ: number;
  phase: number;
  baseOpacity: number;
}

export interface CollisionObstacle {
  x: number;
  z: number;
  halfWidth: number;
  halfDepth: number;
  rotationY: number;
}

export interface DriveableVehicleHandle {
  group: THREE.Group;
  label: string;
  profile: VehicleProfile;
  length: number;
  width: number;
  wheelRadius: number;
  cockpitHeight: number;
  cockpitOffsetZ: number;
  collisionRadius: number;
  maxSpeed: number;
  maxReverseSpeed: number;
  acceleration: number;
  brakeForce: number;
  coastDrag: number;
  steeringRate: number;
  wheels: THREE.Group[];
  readonly damage: number;
  applyDamage: (amount: number) => number;
}

export type VehicleProfile = 'sedan' | 'sports' | 'motorcycle' | 'semi' | 'canAm';

export interface SkyBridgeHandle {
  axisX: number;
  axisZ: number;
  sideX: number;
  sideZ: number;
  startDistance: number;
  endDistance: number;
  halfWidth: number;
  heightAt: (distance: number) => number;
}

// =========================================================================
// PHOTOREALISTIC PROCEDURAL PBR TEXTURES & SYNTHWAVE GENERATORS
// =========================================================================

function createAsphaltPBR(): { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const size = 1024;
  const cDiff = document.createElement('canvas');
  cDiff.width = size;
  cDiff.height = size;
  const ctxD = cDiff.getContext('2d')!;

  ctxD.fillStyle = '#4b4f56';
  ctxD.fillRect(0, 0, size, size);

  const dData = ctxD.getImageData(0, 0, size, size);
  const pixels = dData.data;
  const heightBuffer = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const n1 = Math.sin(x * 0.45) * Math.cos(y * 0.45);
      const n2 = Math.sin(x * 0.12 + y * 0.15);
      const rand = (Math.random() - 0.5) * 32;

      const v = Math.min(255, Math.max(0, 76 + n1 * 7 + n2 * 9 + rand));
      heightBuffer[y * size + x] = v / 255;

      pixels[idx + 0] = Math.min(255, Math.max(0, v + (Math.random() - 0.5) * 6));
      pixels[idx + 1] = Math.min(255, Math.max(0, v + 2 + (Math.random() - 0.5) * 6));
      pixels[idx + 2] = Math.min(255, Math.max(0, v + 5 + (Math.random() - 0.5) * 6));
      pixels[idx + 3] = 255;
    }
  }
  ctxD.putImageData(dData, 0, 0);

  const map = new THREE.CanvasTexture(cDiff);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1, 1);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 16;

  const cNorm = document.createElement('canvas');
  cNorm.width = size;
  cNorm.height = size;
  const ctxN = cNorm.getContext('2d')!;
  const nData = ctxN.createImageData(size, size);
  const nPix = nData.data;

  for (let y = 0; y < size; y++) {
    const yPrev = (y - 1 + size) % size;
    const yNext = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xPrev = (x - 1 + size) % size;
      const xNext = (x + 1) % size;

      const dx = (heightBuffer[y * size + xNext] - heightBuffer[y * size + xPrev]) * 1.6;
      const dy = (heightBuffer[yNext * size + x] - heightBuffer[yPrev * size + x]) * 1.6;
      const dz = 1.0;

      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const nx = ((-dx / len) * 0.5 + 0.5) * 255;
      const ny = ((-dy / len) * 0.5 + 0.5) * 255;
      const nz = (dz / len) * 255;

      const idx = (y * size + x) * 4;
      nPix[idx + 0] = nx;
      nPix[idx + 1] = ny;
      nPix[idx + 2] = nz;
      nPix[idx + 3] = 255;
    }
  }
  ctxN.putImageData(nData, 0, 0);

  const normalMap = new THREE.CanvasTexture(cNorm);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(1, 1);
  normalMap.anisotropy = 16;

  const cRough = document.createElement('canvas');
  cRough.width = size;
  cRough.height = size;
  const ctxR = cRough.getContext('2d')!;
  const rData = ctxR.createImageData(size, size);
  const rPix = rData.data;

  for (let i = 0; i < size * size; i++) {
    const h = heightBuffer[i];
    const rVal = Math.floor(130 + h * 55 + (Math.random() - 0.5) * 12);
    const idx = i * 4;
    rPix[idx + 0] = rVal;
    rPix[idx + 1] = rVal;
    rPix[idx + 2] = rVal;
    rPix[idx + 3] = 255;
  }
  ctxR.putImageData(rData, 0, 0);

  const roughnessMap = new THREE.CanvasTexture(cRough);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(1, 1);
  roughnessMap.anisotropy = 16;

  return { map, normalMap, roughnessMap };
}

function createConcretePBR(repeats = 8): { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const size = 1024;
  const cDiff = document.createElement('canvas');
  cDiff.width = size;
  cDiff.height = size;
  const ctxD = cDiff.getContext('2d')!;

  ctxD.fillStyle = '#82888f';
  ctxD.fillRect(0, 0, size, size);

  const dData = ctxD.getImageData(0, 0, size, size);
  const pix = dData.data;
  for (let i = 0; i < size * size * 4; i += 4) {
    const r = (Math.random() - 0.5) * 16;
    pix[i + 0] = Math.min(255, Math.max(0, pix[i + 0] + r));
    pix[i + 1] = Math.min(255, Math.max(0, pix[i + 1] + r));
    pix[i + 2] = Math.min(255, Math.max(0, pix[i + 2] + r - 2));
  }
  ctxD.putImageData(dData, 0, 0);

  ctxD.strokeStyle = 'rgba(45, 50, 56, 0.45)';
  ctxD.lineWidth = 4;
  ctxD.beginPath();
  ctxD.moveTo(0, size / 2);
  ctxD.lineTo(size, size / 2);
  ctxD.moveTo(size / 2, 0);
  ctxD.lineTo(size / 2, size);
  ctxD.stroke();
  ctxD.strokeRect(0, 0, size, size);

  const map = new THREE.CanvasTexture(cDiff);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeats, repeats);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 16;

  const cNorm = document.createElement('canvas');
  cNorm.width = size;
  cNorm.height = size;
  const ctxN = cNorm.getContext('2d')!;
  ctxN.fillStyle = '#8080ff';
  ctxN.fillRect(0, 0, size, size);
  ctxN.strokeStyle = '#6060e0';
  ctxN.lineWidth = 4;
  ctxN.strokeRect(0, 0, size, size);
  ctxN.beginPath();
  ctxN.moveTo(0, size / 2);
  ctxN.lineTo(size, size / 2);
  ctxN.moveTo(size / 2, 0);
  ctxN.lineTo(size / 2, size);
  ctxN.stroke();

  const normalMap = new THREE.CanvasTexture(cNorm);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(repeats, repeats);
  normalMap.anisotropy = 16;

  const cRough = document.createElement('canvas');
  cRough.width = size;
  cRough.height = size;
  const ctxR = cRough.getContext('2d')!;
  ctxR.fillStyle = '#a8b0b8';
  ctxR.fillRect(0, 0, size, size);

  const roughnessMap = new THREE.CanvasTexture(cRough);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(repeats, repeats);
  roughnessMap.anisotropy = 16;

  return { map, normalMap, roughnessMap };
}

function createStainlessSteelPBR(): { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b8c4d0';
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y++) {
    const bright = Math.floor(180 + Math.random() * 75);
    const a = 0.08 + Math.random() * 0.16;
    ctx.fillStyle = `rgba(${bright}, ${bright + 2}, ${bright + 8}, ${a})`;
    ctx.fillRect(0, y, size, 1);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(4, 4);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 16;

  const cNorm = document.createElement('canvas');
  cNorm.width = size;
  cNorm.height = size;
  const ctxN = cNorm.getContext('2d')!;
  ctxN.fillStyle = '#8080ff';
  ctxN.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 2) {
    const ny = Math.floor(126 + (Math.random() - 0.5) * 8);
    ctxN.fillStyle = `rgb(128, ${ny}, 255)`;
    ctxN.fillRect(0, y, size, 1);
  }
  const normalMap = new THREE.CanvasTexture(cNorm);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(4, 4);

  const cRough = document.createElement('canvas');
  cRough.width = size;
  cRough.height = size;
  const ctxR = cRough.getContext('2d')!;
  ctxR.fillStyle = '#3a424a';
  ctxR.fillRect(0, 0, size, size);
  const roughnessMap = new THREE.CanvasTexture(cRough);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(4, 4);

  return { map, normalMap, roughnessMap };
}

function createTactilePaverTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, size, size);

  const numDomes = 8;
  const spacing = size / numDomes;
  for (let r = 0; r < numDomes; r++) {
    for (let c = 0; c < numDomes; c++) {
      const cx = c * spacing + spacing / 2;
      const cy = r * spacing + spacing / 2;
      const rad = spacing * 0.28;

      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fillStyle = '#eab308';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx - rad * 0.25, cy - rad * 0.25, rad * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createManholeTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c1f24';
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2, cy = size / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.48, 0, Math.PI * 2);
  ctx.fillStyle = '#181a1f';
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#383e47';
  ctx.stroke();

  for (const r of [size * 0.40, size * 0.32, size * 0.24, size * 0.16]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#2d333b';
    ctx.stroke();
  }

  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * (size * 0.16), cy + Math.sin(angle) * (size * 0.16));
    ctx.lineTo(cx + Math.cos(angle) * (size * 0.46), cy + Math.sin(angle) * (size * 0.46));
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#383e47';
    ctx.stroke();
  }

  ctx.fillStyle = '#0a0c0e';
  ctx.fillRect(cx - 24, cy - 8, 48, 16);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createParcelGroundTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#585e64';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const p = imgData.data;
  for (let i = 0; i < size * size * 4; i += 4) {
    const n = (Math.random() - 0.5) * 18;
    p[i + 0] = Math.min(255, Math.max(0, p[i + 0] + n));
    p[i + 1] = Math.min(255, Math.max(0, p[i + 1] + n + 1));
    p[i + 2] = Math.min(255, Math.max(0, p[i + 2] + n + 2));
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSkyscraperFacadeTexture(): {
  map: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
} {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = size;
  emissiveCanvas.height = size;
  const emissiveCtx = emissiveCanvas.getContext('2d')!;

  ctx.fillStyle = '#141720';
  ctx.fillRect(0, 0, size, size);
  emissiveCtx.fillStyle = '#000000';
  emissiveCtx.fillRect(0, 0, size, size);

  const rows = 16;
  const cols = 8;
  const cellW = size / cols;
  const cellH = size / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = (r * 11 + c * 17) % 29;
      const windowX = c * cellW + 5;
      const windowY = r * cellH + 4;
      const windowW = cellW - 10;
      const windowH = cellH - 8;
      const isLit = [0, 2, 4, 7, 10, 13, 16, 19, 23, 26].includes(seed);
      const lightColor = ['#ffc65e', '#ffd477', '#ffe29a'][seed % 3];

      ctx.fillStyle = '#0c121c';
      ctx.fillRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4);
      ctx.fillStyle = isLit ? '#9a7445' : '#101a28';
      ctx.fillRect(windowX, windowY, windowW, windowH);

      if (isLit) {
        const roomGradient = ctx.createLinearGradient(0, windowY, 0, windowY + windowH);
        roomGradient.addColorStop(0, '#d6a75f');
        roomGradient.addColorStop(0.58, '#987044');
        roomGradient.addColorStop(1, '#3c2b1d');
        ctx.fillStyle = roomGradient;
        ctx.fillRect(windowX + 2, windowY + 2, windowW - 4, windowH - 4);

        const furnitureColor = 'rgba(34, 27, 20, 0.94)';
        const furnitureY = windowY + windowH * 0.62;
        ctx.fillStyle = furnitureColor;
        if (seed % 3 === 0) {
          ctx.fillRect(windowX + 8, furnitureY, windowW * 0.56, windowH * 0.2);
          ctx.fillRect(windowX + 11, furnitureY + windowH * 0.2, 3, windowH * 0.13);
          ctx.fillRect(windowX + windowW * 0.56, furnitureY + windowH * 0.2, 3, windowH * 0.13);
          ctx.fillRect(windowX + 12, windowY + windowH * 0.42, windowW * 0.23, windowH * 0.08);
          ctx.fillRect(windowX + windowW * 0.34, windowY + windowH * 0.48, 3, windowH * 0.14);
        } else if (seed % 3 === 1) {
          ctx.fillRect(windowX + 8, furnitureY, windowW * 0.68, 4);
          ctx.fillRect(windowX + 12, furnitureY + 4, 3, windowH * 0.26);
          ctx.fillRect(windowX + windowW * 0.62, furnitureY + 4, 3, windowH * 0.26);
          ctx.fillRect(windowX + windowW * 0.42, windowY + windowH * 0.34, 12, 10);
          ctx.fillRect(windowX + windowW * 0.50, windowY + windowH * 0.34 + 10, 3, 5);
        } else {
          ctx.fillRect(windowX + windowW * 0.25, furnitureY + windowH * 0.08, windowW * 0.36, 3);
          ctx.fillRect(windowX + windowW * 0.29, furnitureY + windowH * 0.11, 3, windowH * 0.2);
          ctx.fillRect(windowX + windowW * 0.56, furnitureY + windowH * 0.11, 3, windowH * 0.2);
          ctx.fillStyle = 'rgba(35, 48, 29, 0.95)';
          ctx.fillRect(windowX + windowW * 0.72, windowY + windowH * 0.42, 4, windowH * 0.4);
          ctx.beginPath();
          ctx.arc(windowX + windowW * 0.74, windowY + windowH * 0.38, 9, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = 'rgba(255, 232, 178, 0.66)';
        ctx.fillRect(windowX + 4, windowY + 4, windowW - 8, 3);
        ctx.fillStyle = 'rgba(255, 224, 152, 0.45)';
        ctx.fillRect(windowX + windowW * 0.48, windowY + 5, 2, windowH - 10);
        ctx.fillStyle = 'rgba(60, 42, 24, 0.62)';
        ctx.fillRect(windowX + 2, windowY + windowH * 0.86, windowW - 4, windowH * 0.1);
        emissiveCtx.fillStyle = lightColor;
        emissiveCtx.fillRect(windowX, windowY, windowW, windowH);
      } else {
        ctx.fillStyle = 'rgba(91, 145, 180, 0.18)';
        ctx.fillRect(windowX + 2, windowY + 2, windowW - 4, 3);
        ctx.fillStyle = 'rgba(2, 7, 13, 0.48)';
        ctx.fillRect(windowX + 2, windowY + windowH * 0.72, windowW - 4, windowH * 0.22);
      }

      ctx.strokeStyle = 'rgba(149, 174, 202, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(c * cellW + 2.5, r * cellH + 2.5, cellW - 5, cellH - 5);
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
  [map, emissiveMap].forEach(texture => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 6);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
  });
  return { map, emissiveMap };
}

// -------------------------------------------------------------------------
// SYNTHWAVE MOON & CELESTIAL TEXTURES
// -------------------------------------------------------------------------

function createMoonTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#eef5ff';
  ctx.fillRect(0, 0, size, size);

  const mariaCenters = [
    { x: 380, y: 320, r: 180 },
    { x: 620, y: 410, r: 210 },
    { x: 340, y: 640, r: 190 },
    { x: 550, y: 690, r: 160 },
    { x: 740, y: 310, r: 140 }
  ];
  mariaCenters.forEach(m => {
    const grad = ctx.createRadialGradient(m.x, m.y, 10, m.x, m.y, m.r);
    grad.addColorStop(0, 'rgba(100, 115, 140, 0.85)');
    grad.addColorStop(0.65, 'rgba(135, 150, 175, 0.50)');
    grad.addColorStop(1, 'rgba(238, 245, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
  });

  for (let i = 0; i < 70; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = 8 + Math.random() * 32;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(90, 105, 128, 0.65)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx - r * 0.2, cy - r * 0.2, r, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(2, r * 0.22);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.stroke();
  }

  // Retro Synthwave Horizon Venetian Scanlines
  const numBands = 14;
  for (let i = 0; i < numBands; i++) {
    const y0 = size * 0.62 + i * (size * 0.35 / numBands);
    const bandH = Math.max(3, i * 2.0);
    const alpha = 0.45 + (i / numBands) * 0.45;
    ctx.fillStyle = `rgba(255, 107, 0, ${alpha})`;
    ctx.fillRect(0, y0, size, bandH);
    ctx.fillStyle = `rgba(217, 70, 239, ${alpha * 0.6})`;
    ctx.fillRect(0, y0 + bandH * 0.5, size, bandH * 0.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStarTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2, cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, size * 0.45);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.2, 'rgba(180, 230, 255, 0.85)');
  grad.addColorStop(0.5, 'rgba(90, 180, 255, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, 8);
  ctx.lineTo(cx, size - 8);
  ctx.moveTo(8, cy);
  ctx.lineTo(size - 8, cy);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createNebulaCloudTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2, cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.48);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(0.35, 'rgba(217, 70, 239, 0.55)');
  grad.addColorStop(0.7, 'rgba(6, 182, 212, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.48, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createRoundedRectShape(w: number, h: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  const r = Math.min(radius, hw, hh);

  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw + r, -hh);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  return shape;
}

// =========================================================================
// CIVICWATCH JUMBOTRONS DATA & ENGINE (ON BUILDINGS ONLY)
// =========================================================================

const DEFAULT_BILLBOARD_STORY: BillboardStory = {
  id: 'civicwatch-empty',
  title: 'UPLOAD A STORY FROM CIVICWATCH',
  author: 'CIVICVERSE COMMUNITY',
  category: 'COMMUNITY FEED',
  tag: 'OPEN',
  color: '#00f3ff',
  sourceUrl: '/civicwatch'
};

const billboardMediaCache = new Map<string, HTMLImageElement | HTMLVideoElement>();

function getBillboardMedia(story: BillboardStory): HTMLImageElement | HTMLVideoElement | undefined {
  const url = story.videoUrl || story.imageUrl;
  if (!url) return undefined;
  const cached = billboardMediaCache.get(url);
  if (cached) return cached;

  if (story.videoUrl) {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.src = story.videoUrl;
    video.addEventListener('error', () => {
      console.warn('[CivicWatch] Could not load uploaded billboard video:', story.videoUrl);
    }, { once: true });
    void video.play().catch(error => {
      console.info('[CivicWatch] Uploaded billboard video will play when available.', error);
    });
    billboardMediaCache.set(url, video);
    return video;
  }

  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = story.imageUrl || '';
  image.addEventListener('error', () => {
    console.warn('[CivicWatch] Could not load uploaded billboard image:', story.imageUrl);
  }, { once: true });
  billboardMediaCache.set(url, image);
  return image;
}

export function updateCityBillboardStories(
  handles: Pick<CityAnimationHandles, 'billboards'>,
  stories: BillboardStory[]
): void {
  const activeStories = stories.length > 0 ? stories : [DEFAULT_BILLBOARD_STORY];
  handles.billboards.forEach((billboard, index) => {
    billboard.stories = activeStories;
    billboard.currentStoryIdx = index % activeStories.length;
    billboard.lastSwitchTime = 0;
    billboard.mesh.userData.billboardStory = activeStories[billboard.currentStoryIdx];
  });
}

function renderBillboardCanvas(handle: BillboardHandle, elapsed: number): void {
  const { canvas, context: ctx, stories, currentStoryIdx, scanlineY, isJumbotron } = handle;
  const layoutScale = isJumbotron ? canvas.width / 1024 : 1;
  ctx.setTransform(layoutScale, 0, 0, layoutScale, 0, 0);
  const w = canvas.width / layoutScale;
  const h = canvas.height / layoutScale;
  const story = stories[currentStoryIdx % stories.length];
  const headerHeight = isJumbotron ? 72 : 54;
  const mediaBottom = h - (isJumbotron ? 118 : 76);
  const media = getBillboardMedia(story);

  ctx.fillStyle = '#060913';
  ctx.fillRect(0, 0, w, h);

  const mediaReady = media && (
    media instanceof HTMLImageElement
      ? media.complete && media.naturalWidth > 0
      : media.readyState >= 2 && media.videoWidth > 0
  );
  const mediaTop = headerHeight;
  if (mediaReady && media) {
    const mediaWidth = media instanceof HTMLImageElement ? media.naturalWidth : media.videoWidth;
    const mediaHeight = media instanceof HTMLImageElement ? media.naturalHeight : media.videoHeight;
    const mediaHeightPx = mediaBottom - mediaTop;
    const scale = Math.max(w / mediaWidth, mediaHeightPx / mediaHeight);
    const drawWidth = mediaWidth * scale;
    const drawHeight = mediaHeight * scale;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, mediaTop, w, mediaHeightPx);
    ctx.clip();
    ctx.drawImage(media, (w - drawWidth) / 2, mediaTop + (mediaHeightPx - drawHeight) / 2, drawWidth, drawHeight);
    ctx.fillStyle = 'rgba(3, 8, 20, 0.24)';
    ctx.fillRect(0, mediaTop, w, mediaHeightPx);
    ctx.restore();
  } else {
    const gradient = ctx.createLinearGradient(0, mediaTop, w, mediaBottom);
    gradient.addColorStop(0, '#0b1528');
    gradient.addColorStop(0.55, '#11253b');
    gradient.addColorStop(1, '#080d19');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, mediaTop, w, mediaBottom - mediaTop);
    ctx.fillStyle = story.color;
    ctx.font = `bold ${isJumbotron ? 28 : 18}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CIVICWATCH COMMUNITY FEED', w / 2, (mediaTop + mediaBottom) / 2);
  }

  const barH = headerHeight;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.fillRect(0, 0, w, barH);
  ctx.fillStyle = story.color;
  ctx.fillRect(0, barH - 4, w, 4);
  ctx.font = isJumbotron ? 'bold 28px monospace' : 'bold 20px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('CIVICWATCH • COMMUNITY UPLOAD', 24, barH / 2);

  ctx.fillStyle = 'rgba(3, 8, 20, 0.88)';
  ctx.fillRect(0, mediaBottom, w, h - mediaBottom);
  ctx.fillStyle = '#ffffff';
  ctx.font = isJumbotron ? 'bold 34px sans-serif' : 'bold 24px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(story.title.slice(0, 56), 28, mediaBottom + (isJumbotron ? 38 : 28), w - 56);
  ctx.fillStyle = story.color;
  ctx.font = isJumbotron ? 'bold 19px monospace' : 'bold 14px monospace';
  ctx.fillText(`${story.author} • ${story.category}`, 28, mediaBottom + (isJumbotron ? 82 : 58), w - 56);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.10)';
  for (let sl = 0; sl < h; sl += 8) ctx.fillRect(0, sl, w, 1);
  const scanGrad = ctx.createLinearGradient(0, scanlineY - 16, 0, scanlineY + 16);
  scanGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
  scanGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.22)');
  scanGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = scanGrad;
  ctx.fillRect(0, scanlineY - 16, w, 32);

  ctx.strokeStyle = story.color;
  ctx.lineWidth = isJumbotron ? 8 : 5;
  ctx.strokeRect(4, 4, w - 8, h - 8);
}

function createBuildingJumbotron(
  w: number,
  h: number,
  stories: BillboardStory[] = [DEFAULT_BILLBOARD_STORY],
  storyOffset = 0
): BillboardHandle {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create CivicWatch billboard canvas.');

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  const activeStories = stories.length > 0 ? stories : [DEFAULT_BILLBOARD_STORY];
  const initialStoryIdx = storyOffset % activeStories.length;
  mesh.userData.billboardStory = activeStories[initialStoryIdx];

  const handle: BillboardHandle = {
    mesh,
    canvas,
    context,
    texture,
    stories: activeStories,
    currentStoryIdx: initialStoryIdx,
    lastSwitchTime: 0,
    scanlineY: 0,
    width: w,
    height: h,
    isJumbotron: true,
    lastRenderTime: 0,
    update(elapsed: number, delta: number) {
      const logicalHeight = this.canvas.height / (this.canvas.width / 1024);
      this.scanlineY = (this.scanlineY + delta * 120) % logicalHeight;
      if (elapsed - this.lastSwitchTime > 8.0) {
        this.currentStoryIdx = (this.currentStoryIdx + 1) % this.stories.length;
        this.lastSwitchTime = elapsed;
        this.mesh.userData.billboardStory = this.stories[this.currentStoryIdx];
      }

      if (elapsed - (this.lastRenderTime || 0) >= 1 / 20) {
        renderBillboardCanvas(this, elapsed);
        this.texture.needsUpdate = true;
        this.lastRenderTime = elapsed;
      }
    }
  };

  renderBillboardCanvas(handle, 0);
  texture.needsUpdate = true;
  return handle;
}

function createDriveableVehicle(
  label: string,
  bodyColor: number,
  profile: VehicleProfile
): DriveableVehicleHandle {
  const group = new THREE.Group();
  const profileSpecs: Record<VehicleProfile, {
    length: number;
    width: number;
    height: number;
    wheelRadius: number;
    cockpitHeight: number;
    cockpitOffsetZ: number;
    maxSpeed: number;
    maxReverseSpeed: number;
    acceleration: number;
    brakeForce: number;
    coastDrag: number;
    steeringRate: number;
    collisionRadius: number;
  }> = {
    sedan: { length: 4.8, width: 2.0, height: 1.45, wheelRadius: 0.39, cockpitHeight: 1.25, cockpitOffsetZ: -1.05, maxSpeed: 30, maxReverseSpeed: 9, acceleration: 18, brakeForce: 34, coastDrag: 0.75, steeringRate: 1.5, collisionRadius: 2.5 },
    sports: { length: 4.6, width: 1.95, height: 1.15, wheelRadius: 0.38, cockpitHeight: 1.05, cockpitOffsetZ: -1.05, maxSpeed: 43, maxReverseSpeed: 11, acceleration: 27, brakeForce: 42, coastDrag: 0.55, steeringRate: 1.75, collisionRadius: 2.5 },
    motorcycle: { length: 2.35, width: 0.9, height: 1.55, wheelRadius: 0.38, cockpitHeight: 1.35, cockpitOffsetZ: -0.2, maxSpeed: 36, maxReverseSpeed: 5, acceleration: 24, brakeForce: 34, coastDrag: 0.5, steeringRate: 2.0, collisionRadius: 1.5 },
    semi: { length: 12.5, width: 2.7, height: 3.8, wheelRadius: 0.55, cockpitHeight: 2.5, cockpitOffsetZ: -4.35, maxSpeed: 21, maxReverseSpeed: 5, acceleration: 9, brakeForce: 24, coastDrag: 0.9, steeringRate: 0.78, collisionRadius: 5.0 },
    canAm: { length: 3.5, width: 1.7, height: 1.8, wheelRadius: 0.42, cockpitHeight: 1.5, cockpitOffsetZ: -0.25, maxSpeed: 31, maxReverseSpeed: 9, acceleration: 22, brakeForce: 32, coastDrag: 0.65, steeringRate: 1.9, collisionRadius: 2.0 }
  };
  const spec = profileSpecs[profile];
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: bodyColor,
    metalness: profile === 'motorcycle' ? 0.58 : 0.72,
    roughness: profile === 'semi' ? 0.46 : 0.28
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x14283a,
    metalness: 0.38,
    roughness: 0.16,
    transparent: true,
    opacity: 0.86
  });
  const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x15191f, roughness: 0.88 });
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x596873,
    metalness: 0.68,
    roughness: 0.36
  });
  const wheels: THREE.Group[] = [];
  const addWheel = (x: number, z: number, radius = spec.wheelRadius, width = 0.24) => {
    const axle = new THREE.Group();
    axle.position.set(x, radius, z);
    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, width, 18),
      tireMaterial
    );
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    axle.add(tire);
    group.add(axle);
    wheels.push(axle);
  };
  const addLight = (x: number, y: number, z: number, color: number) => {
    const light = new THREE.Mesh(
      new THREE.BoxGeometry(profile === 'motorcycle' ? 0.22 : 0.34, 0.16, 0.08),
      new THREE.MeshBasicMaterial({ color })
    );
    light.position.set(x, y, z);
    group.add(light);
  };

  if (profile === 'motorcycle') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 1.35), bodyMaterial);
    frame.position.set(0, 0.82, 0.05);
    group.add(frame);
    const tank = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), bodyMaterial);
    tank.scale.set(1, 0.75, 1.4);
    tank.position.set(0, 1.12, -0.12);
    group.add(tank);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.16, 0.55), tireMaterial);
    seat.position.set(0, 1.22, 0.42);
    group.add(seat);
    addWheel(0, -0.82, spec.wheelRadius, 0.16);
    addWheel(0, 0.82, spec.wheelRadius, 0.16);
    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), frameMaterial);
    fork.position.set(0, 0.98, -0.74);
    fork.rotation.x = -0.18;
    group.add(fork);
    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), frameMaterial);
    handlebar.rotation.z = Math.PI / 2;
    handlebar.position.set(0, 1.48, -0.67);
    group.add(handlebar);
    addLight(0, 1.05, -1.02, 0xfff0c4);
    addLight(0, 0.85, 1.02, 0xff243c);
  } else if (profile === 'semi') {
    const trailerMaterial = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.56,
      roughness: 0.42
    });
    const trailer = new THREE.Mesh(
      new THREE.BoxGeometry(spec.width * 0.94, 2.8, 7.8),
      trailerMaterial
    );
    trailer.position.set(0, 2.08, 1.1);
    trailer.castShadow = true;
    trailer.receiveShadow = true;
    group.add(trailer);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(spec.width, 1.75, 3.4), bodyMaterial);
    cab.position.set(0, 1.05, -4.2);
    cab.castShadow = true;
    group.add(cab);
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(spec.width * 0.82, 1.05, 0.12), glassMaterial);
    windshield.position.set(0, 2.45, -5.02);
    group.add(windshield);
    const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(spec.width * 0.94, 0.18, 2.0), bodyMaterial);
    cabRoof.position.set(0, 3.05, -4.25);
    group.add(cabRoof);
    [-1, 1].forEach(side => {
      addWheel(side * 1.13, -5.0, spec.wheelRadius, 0.36);
      addWheel(side * 1.13, -2.45, spec.wheelRadius, 0.36);
      addWheel(side * 1.13, 3.75, spec.wheelRadius, 0.36);
      addWheel(side * 1.13, 4.75, spec.wheelRadius, 0.36);
      addLight(side * 0.85, 0.72, -5.92, 0xfff0c4);
      addLight(side * 0.85, 0.72, 5.92, 0xff243c);
    });
  } else {
    const bodyHeight = profile === 'canAm' ? 0.9 : spec.height * 0.46;
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(spec.width, bodyHeight, spec.length * 0.9),
      bodyMaterial
    );
    body.position.y = profile === 'canAm' ? 0.76 : spec.height * 0.43;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    if (profile === 'canAm') {
      const roof = new THREE.Mesh(new THREE.BoxGeometry(spec.width * 0.78, 0.12, spec.length * 0.58), bodyMaterial);
      roof.position.set(0, 1.82, 0.02);
      group.add(roof);
      [-1, 1].forEach(side => {
        [-1, 1].forEach(front => {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 1.25, 8), frameMaterial);
          post.position.set(side * spec.width * 0.34, 1.22, front * spec.length * 0.25);
          post.castShadow = true;
          group.add(post);
        });
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, spec.length * 0.62), frameMaterial);
        rail.position.set(side * spec.width * 0.34, 1.52, 0.02);
        group.add(rail);
      });
    } else {
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(spec.width * 0.76, spec.height * 0.42, spec.length * 0.44),
        glassMaterial
      );
      cabin.position.set(0, spec.height * 0.86, spec.length * 0.04);
      cabin.castShadow = true;
      group.add(cabin);
      if (profile === 'sports') {
        const spoiler = new THREE.Mesh(new THREE.BoxGeometry(spec.width * 0.82, 0.12, 0.28), bodyMaterial);
        spoiler.position.set(0, 0.95, spec.length * 0.42);
        group.add(spoiler);
      }
    }

    const wheelX = spec.width * (profile === 'canAm' ? 0.43 : 0.46);
    const wheelZ = spec.length * (profile === 'canAm' ? 0.34 : 0.33);
    [-1, 1].forEach(side => {
      [-1, 1].forEach(front => addWheel(side * wheelX, front * wheelZ));
      addLight(side * spec.width * 0.31, 0.68, -spec.length / 2, 0xfff0c4);
      addLight(side * spec.width * 0.31, 0.68, spec.length / 2, 0xff243c);
    });
  }

  const cleanPaint = new THREE.Color(bodyColor);
  const damagedPaint = new THREE.Color(0x34383d);
  let damage = 0;

  return {
    group,
    label,
    profile,
    length: spec.length,
    width: spec.width,
    wheelRadius: spec.wheelRadius,
    cockpitHeight: spec.cockpitHeight,
    cockpitOffsetZ: spec.cockpitOffsetZ,
    collisionRadius: spec.collisionRadius,
    maxSpeed: spec.maxSpeed,
    maxReverseSpeed: spec.maxReverseSpeed,
    acceleration: spec.acceleration,
    brakeForce: spec.brakeForce,
    coastDrag: spec.coastDrag,
    steeringRate: spec.steeringRate,
    wheels,
    get damage() {
      return damage;
    },
    applyDamage(amount: number) {
      damage = THREE.MathUtils.clamp(damage + amount, 0, 100);
      bodyMaterial.color.copy(cleanPaint).lerp(damagedPaint, damage / 150);
      return damage;
    }
  };
}

// =========================================================================
// CELESTIAL SYSTEM: SYNTHWAVE MOON, GALAXY NEBULA, TWINKLE STARS, METEORS
// =========================================================================

function buildCelestialSystem(scene: THREE.Scene): {
  moonGroup: THREE.Group;
  nebulaGroup: THREE.Group;
  starPoints: THREE.Points;
  shootingStars: ShootingStar[];
} {
  const celestialGroup = new THREE.Group();
  celestialGroup.name = 'Synthwave_Celestial_System';
  scene.add(celestialGroup);

  // 1. BRIGHT SYNTHWAVE MOON (Directly in view above "The GAT" monument)
  const moonGroup = new THREE.Group();
  moonGroup.name = 'Synthwave_Moon';
  moonGroup.renderOrder = -40;

  // Located straight ahead in the view gap behind The GAT: x = +420, y = +320, z = -420
  const moonX = 420;
  const moonY = 320;
  const moonZ = -420;
  moonGroup.position.set(moonX, moonY, moonZ);

  const moonRadius = 65;
  const moonGeo = new THREE.SphereGeometry(moonRadius, 48, 32);
  const moonMat = new THREE.MeshBasicMaterial({
    map: createMoonTexture(),
    color: 0xffffff,
    fog: false,
    depthWrite: false
  });
  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonMesh.lookAt(-24, 0, 24); // Look towards player spawn
  moonGroup.add(moonMesh);

  // Glowing Outer Corona Halo Ring
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = 512;
  haloCanvas.height = 512;
  const hctx = haloCanvas.getContext('2d')!;
  const hgrad = hctx.createRadialGradient(256, 256, 90, 256, 256, 256);
  hgrad.addColorStop(0, 'rgba(255, 183, 120, 0.22)');
  hgrad.addColorStop(0.35, 'rgba(217, 100, 210, 0.12)');
  hgrad.addColorStop(0.70, 'rgba(6, 182, 212, 0.05)');
  hgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  hctx.fillStyle = hgrad;
  hctx.fillRect(0, 0, 512, 512);

  const haloTex = new THREE.CanvasTexture(haloCanvas);
  const haloMat = new THREE.SpriteMaterial({
    map: haloTex,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    fog: false
  });
  const haloSprite = new THREE.Sprite(haloMat);
  haloSprite.scale.set(moonRadius * 2.2, moonRadius * 2.2, 1);
  moonGroup.add(haloSprite);

  celestialGroup.add(moonGroup);

  // 2. HEAVY GALAXY NEBULA CLOUD BELT
  const nebulaGroup = new THREE.Group();
  nebulaGroup.name = 'Cosmic_Galaxy_Nebula';
  nebulaGroup.renderOrder = -60;

  const nebulaTex = createNebulaCloudTexture();
  const nebulaCount = 26;
  const nebulaRadius = 2200;

  for (let i = 0; i < nebulaCount; i++) {
    const t = (i / (nebulaCount - 1)) * Math.PI - (Math.PI / 2);
    const theta = t + (Math.random() - 0.5) * 0.35;
    const phi = 0.35 + Math.sin((i / nebulaCount) * Math.PI) * 0.50 + (Math.random() - 0.5) * 0.12;

    const nx = Math.cos(theta) * Math.sin(phi) * nebulaRadius;
    const ny = Math.cos(phi) * nebulaRadius + 450;
    const nz = Math.sin(theta) * Math.sin(phi) * nebulaRadius;

    const nebMat = new THREE.SpriteMaterial({
      map: nebulaTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.18 + Math.random() * 0.16,
      depthWrite: false,
      fog: false
    });

    if (i % 3 === 0) nebMat.color.setHex(0xd946ef); // Magenta
    else if (i % 3 === 1) nebMat.color.setHex(0x00f3ff); // Cyan
    else nebMat.color.setHex(0x8b5cf6); // Violet

    const nebSprite = new THREE.Sprite(nebMat);
    nebSprite.position.set(nx, ny, nz);
    const scale = 520 + Math.random() * 380;
    nebSprite.scale.set(scale, scale, 1);
    nebulaGroup.add(nebSprite);
  }
  celestialGroup.add(nebulaGroup);

  // 3. TWINKLING 4,500+ STARFIELD
  const starCount = 4500;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  const starColorPalette = [
    new THREE.Color(0xffffff),
    new THREE.Color(0x38bdf8),
    new THREE.Color(0xf472b6),
    new THREE.Color(0xfef08a),
    new THREE.Color(0xc084fc),
  ];

  for (let i = 0; i < starCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 2400 + Math.random() * 1100;

    const sy = Math.abs(Math.sin(phi) * r) + 120;
    const sx = Math.cos(theta) * Math.cos(phi) * r;
    const sz = Math.sin(theta) * Math.cos(phi) * r;

    starPositions[i * 3 + 0] = sx;
    starPositions[i * 3 + 1] = sy;
    starPositions[i * 3 + 2] = sz;

    const col = starColorPalette[Math.floor(Math.random() * starColorPalette.length)];
    starColors[i * 3 + 0] = col.r;
    starColors[i * 3 + 1] = col.g;
    starColors[i * 3 + 2] = col.b;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 26,
    map: createStarTexture(),
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false
  });

  const starPoints = new THREE.Points(starGeo, starMat);
  starPoints.renderOrder = -50;
  celestialGroup.add(starPoints);

  // 4. DYNAMIC SHOOTING STARS (METEORS)
  const shootingStars: ShootingStar[] = [];
  const numShooters = 8;

  for (let s = 0; s < numShooters; s++) {
    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const lineMat = new THREE.LineBasicMaterial({
      color: s % 2 === 0 ? 0x00f3ff : 0xff007f,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      linewidth: 3,
      fog: false,
      depthWrite: false
    });

    const line = new THREE.Line(lineGeo, lineMat);
    line.renderOrder = -30;
    celestialGroup.add(line);

    shootingStars.push({
      line,
      startPos: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      speed: 1500 + Math.random() * 800,
      progress: 0,
      length: 220 + Math.random() * 150,
      active: false,
      nextTriggerTime: 0.5 + Math.random() * 3.5
    });
  }

  return { moonGroup, nebulaGroup, starPoints, shootingStars };
}

function createVolumetricFogTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create volumetric fog texture.');

  for (let i = 0; i < 28; i += 1) {
    const radiusX = 0.12 + Math.random() * 0.20;
    const radiusY = 0.18 + Math.random() * 0.30;
    context.save();
    context.translate(Math.random() * canvas.width, Math.random() * canvas.height);
    context.scale(radiusX * canvas.width, radiusY * canvas.height);
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, `rgba(205, 217, 238, ${0.035 + Math.random() * 0.035})`);
    gradient.addColorStop(0.52, 'rgba(190, 204, 229, 0.02)');
    gradient.addColorStop(1, 'rgba(180, 196, 224, 0)');
    context.fillStyle = gradient;
    context.fillRect(-1, -1, 2, 2);
    context.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

function createSkyCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create sky cloud texture.');

  const drawCloudMass = (
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    alpha: number,
    shade: boolean
  ) => {
    context.save();
    context.translate(centerX, centerY);
    context.scale(width / 2, height);
    context.beginPath();
    context.moveTo(-1, 0.18);
    context.bezierCurveTo(-1.08, -0.03, -0.88, -0.2, -0.62, -0.16);
    context.bezierCurveTo(-0.55, -0.52, -0.14, -0.56, 0.02, -0.23);
    context.bezierCurveTo(0.18, -0.62, 0.61, -0.56, 0.68, -0.17);
    context.bezierCurveTo(0.94, -0.18, 1.08, -0.01, 0.92, 0.18);
    context.lineTo(0.82, 0.27);
    context.lineTo(-0.88, 0.27);
    context.closePath();

    const gradient = context.createLinearGradient(0, -0.58, 0, 0.28);
    if (shade) {
      gradient.addColorStop(0, `rgba(189, 205, 231, ${alpha})`);
      gradient.addColorStop(0.56, `rgba(106, 127, 163, ${alpha * 0.82})`);
      gradient.addColorStop(1, `rgba(49, 62, 91, ${alpha * 0.38})`);
    } else {
      gradient.addColorStop(0, `rgba(225, 233, 248, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(168, 185, 215, ${alpha * 0.82})`);
      gradient.addColorStop(1, `rgba(93, 112, 149, ${alpha * 0.3})`);
    }
    context.fillStyle = gradient;
    context.fill();
    context.restore();
  };

  drawCloudMass(215, 330, 330, 150, 0.62, true);
  drawCloudMass(225, 310, 315, 132, 0.72, false);
  drawCloudMass(520, 285, 390, 175, 0.56, true);
  drawCloudMass(520, 265, 370, 152, 0.7, false);
  drawCloudMass(825, 335, 330, 148, 0.6, true);
  drawCloudMass(820, 315, 310, 132, 0.68, false);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

// =========================================================================
// MAIN BUILDER: PRECISION PHOTOREALISTIC NEW CITY STREET GRID & ASSETS
// =========================================================================

export function buildDetailedCity(scene: THREE.Scene): CityAnimationHandles {
  console.log('[NewCity] Building connected photorealistic synthwave street grid & assets...');

  const cityGroup = new THREE.Group();
  cityGroup.name = 'NewCity_ConnectedStreets';
  scene.add(cityGroup);

  const SQRT2 = Math.SQRT2;
  const uToWorld = (u: number, v: number) => ({
    x: (u + v) / SQRT2,
    z: (-u + v) / SQRT2
  });
  const scaleTextureUvs = (geometry: THREE.BufferGeometry, uScale: number, vScale: number) => {
    const uv = geometry.getAttribute('uv');
    for (let i = 0; i < uv.count; i += 1) {
      uv.setXY(i, uv.getX(i) * uScale, uv.getY(i) * vScale);
    }
    uv.needsUpdate = true;
  };

  // -----------------------------------------------------------------------
  // PBR Materials
  // -----------------------------------------------------------------------
  const asphaltPBR = createAsphaltPBR();
  const asphaltMaterial = new THREE.MeshStandardMaterial({
    map: asphaltPBR.map,
    normalMap: asphaltPBR.normalMap,
    roughnessMap: asphaltPBR.roughnessMap,
    roughness: 0.78,
    metalness: 0.03
  });

  const concretePBR = createConcretePBR();
  const sidewalkPBR = createConcretePBR(1);
  const concreteMaterial = new THREE.MeshStandardMaterial({
    map: sidewalkPBR.map,
    normalMap: sidewalkPBR.normalMap,
    roughnessMap: sidewalkPBR.roughnessMap,
    roughness: 0.92,
    metalness: 0.02
  });

  const stainlessSteelPBR = createStainlessSteelPBR();
  const stainlessSteelMaterial = new THREE.MeshStandardMaterial({
    map: stainlessSteelPBR.map,
    normalMap: stainlessSteelPBR.normalMap,
    roughnessMap: stainlessSteelPBR.roughnessMap,
    roughness: 0.34,
    metalness: 0.62
  });

  // Realistic Dark Metal Streetlight Material
  const poleMaterial = new THREE.MeshStandardMaterial({
    color: 0x596873,
    roughness: 0.36,
    metalness: 0.68
  });

  const curbMaterial = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    roughness: 0.65,
    metalness: 0.12
  });

  const tactilePaverMaterial = new THREE.MeshStandardMaterial({
    map: createTactilePaverTexture(),
    roughness: 0.55,
    metalness: 0.15
  });

  const manholeMaterial = new THREE.MeshStandardMaterial({
    map: createManholeTexture(),
    roughness: 0.45,
    metalness: 0.5
  });

  const parcelMaterial = new THREE.MeshStandardMaterial({
    map: createParcelGroundTexture(),
    roughness: 0.90,
    metalness: 0.10
  });

  const whitePaintMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.40,
    metalness: 0.10
  });

  const yellowPaintMaterial = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.40,
    metalness: 0.10
  });

  const emissiveLightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe5b3
  });
  const streetlightBeamMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe7c8,
    transparent: true,
    opacity: 0.008,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });

  // Building Materials
  const facadeTextures = createSkyscraperFacadeTexture();
  const bldgGlassMaterial = new THREE.MeshStandardMaterial({
    map: facadeTextures.map,
    emissiveMap: facadeTextures.emissiveMap,
    roughness: 0.34,
    metalness: 0.3,
    emissive: 0xffffff,
    emissiveIntensity: 0.72
  });

  const bldgDarkFacadeMaterial = new THREE.MeshStandardMaterial({
    color: 0x181c24,
    roughness: 0.85,
    metalness: 0.35
  });

  const bldgConcreteMaterial = new THREE.MeshStandardMaterial({
    map: concretePBR.map,
    normalMap: concretePBR.normalMap,
    roughness: 0.80,
    metalness: 0.15
  });

  const bldgBalconyGlassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xa8d8e5,
    transparent: true,
    opacity: 0.38,
    roughness: 0.18,
    metalness: 0.28,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const bldgBalconyPlantMaterial = new THREE.MeshStandardMaterial({
    color: 0x315541,
    roughness: 0.88
  });

  const bldgStorefrontGlassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe7edf0,
    transparent: true,
    opacity: 0.14,
    roughness: 0.08,
    metalness: 0.04,
    depthWrite: false,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide
  });

  const bldgStoreFloorMaterial = new THREE.MeshStandardMaterial({
    color: 0x51483d,
    roughness: 0.84
  });

  const bldgStoreFixtureMaterial = new THREE.MeshStandardMaterial({
    color: 0x63472f,
    roughness: 0.72,
    emissive: 0x8a4d20,
    emissiveIntensity: 1.05
  });

  const bldgStoreDisplayMaterial = new THREE.MeshStandardMaterial({
    color: 0x75634d,
    roughness: 0.48,
    metalness: 0.12,
    emissive: 0x563116,
    emissiveIntensity: 0.8
  });

  const bldgStoreWarmLightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd69a
  });

  const bldgNeonMaterials = [
    0x00f3ff,
    0xff4fc8,
    0xffb347,
    0x9b7bff,
    0x64edb5
  ].map(color => new THREE.MeshBasicMaterial({ color }));

  // Geometry collections for merging
  const asphaltGeometries: THREE.BufferGeometry[] = [];
  const concreteGeometries: THREE.BufferGeometry[] = [];
  const curbGeometries: THREE.BufferGeometry[] = [];
  const tactileGeometries: THREE.BufferGeometry[] = [];
  const manholeGeometries: THREE.BufferGeometry[] = [];
  const stainlessGeometries: THREE.BufferGeometry[] = [];
  const poleGeometries: THREE.BufferGeometry[] = [];
  const parcelGeometries: THREE.BufferGeometry[] = [];
  const whitePaintGeometries: THREE.BufferGeometry[] = [];
  const yellowPaintGeometries: THREE.BufferGeometry[] = [];
  const lightGeometries: THREE.BufferGeometry[] = [];
  const bldgGlassGeometries: THREE.BufferGeometry[] = [];
  const bldgDarkGeometries: THREE.BufferGeometry[] = [];
  const bldgConcreteGeometries: THREE.BufferGeometry[] = [];
  const bldgBalconyGlassGeometries: THREE.BufferGeometry[] = [];
  const bldgBalconyPlantGeometries: THREE.BufferGeometry[] = [];
  const bldgStorefrontGlassGeometries: THREE.BufferGeometry[] = [];
  const bldgStoreFloorGeometries: THREE.BufferGeometry[] = [];
  const bldgStoreFixtureGeometries: THREE.BufferGeometry[] = [];
  const bldgStoreDisplayGeometries: THREE.BufferGeometry[] = [];
  const bldgStoreWarmLightGeometries: THREE.BufferGeometry[] = [];
  const bldgNeonGeometries: THREE.BufferGeometry[][] = bldgNeonMaterials.map(() => []);

  const billboards: BillboardHandle[] = [];
  const beaconLights: THREE.Mesh[] = [];
  const vehicles: DriveableVehicleHandle[] = [];
  const collisionObstacles: CollisionObstacle[] = [];

  // CONSTANTS & DIMENSIONS
  const ROUNDABOUT_INNER_R = 14.0;
  const ROUNDABOUT_OUTER_R = 26.0;
  const GRID_U_ROAD_Y = 0.02;
  const GRID_V_ROAD_Y = 0.04;
  const ROUNDABOUT_ROAD_Y = 0.06;
  const AVENUE_ROAD_Y = 0.08;
  const ROAD_MARKING_Y = 0.10;
  const AVENUE_WIDTH = 20.0;
  const AVENUE_HALF = AVENUE_WIDTH / 2;
  const AVENUE_EDGE_OFFSET = AVENUE_HALF - 0.55;
  const AVENUE_SPAN = 400.0;
  const AVENUE_DASH_SPACING = 9.2;
  const GRID_STREET_WIDTH = 10.0;
  const AVENUE_SIDEWALK_OFFSET = AVENUE_HALF + 5.5;
  const AVENUE_LIGHT_POLE_OFFSET = AVENUE_HALF + 9.5;
  const GRID_SIDEWALK_OFFSET = GRID_STREET_WIDTH / 2 + 3;
  const GRID_SIGNAL_POLE_OFFSET = GRID_SIDEWALK_OFFSET + 2.5;

  const avenueAngles = [
    Math.PI / 4,
    (3 * Math.PI) / 4,
    (5 * Math.PI) / 4,
    (7 * Math.PI) / 4
  ];

  // -----------------------------------------------------------------------
  // 1. UNIFIED CONTINUOUS ASPHALT ROADWAY NETWORK (Completely Clear of Obstacles)
  // -----------------------------------------------------------------------
  const roundaboutGeo = new THREE.RingGeometry(ROUNDABOUT_INNER_R, ROUNDABOUT_OUTER_R, 64);
  scaleTextureUvs(roundaboutGeo, 12, 12);
  roundaboutGeo.rotateX(-Math.PI / 2);
  roundaboutGeo.translate(0, ROUNDABOUT_ROAD_Y, 0);
  asphaltGeometries.push(roundaboutGeo);

  avenueAngles.forEach(angle => {
    const startR = ROUNDABOUT_OUTER_R - 1.0;
    const avenueLen = AVENUE_SPAN - startR;
    const centerDist = startR + avenueLen / 2;

    const avenueGeo = new THREE.PlaneGeometry(AVENUE_WIDTH, avenueLen);
    scaleTextureUvs(avenueGeo, AVENUE_WIDTH / 4, avenueLen / 4);
    avenueGeo.rotateX(-Math.PI / 2);
    avenueGeo.rotateY(angle);
    avenueGeo.translate(
      Math.sin(angle) * centerDist,
      AVENUE_ROAD_Y,
      Math.cos(angle) * centerDist
    );
    asphaltGeometries.push(avenueGeo);

    const throatShape = new THREE.Shape();
    throatShape.moveTo(-AVENUE_HALF, startR);
    throatShape.lineTo(AVENUE_HALF, startR);
    throatShape.lineTo(AVENUE_HALF + 3.5, ROUNDABOUT_OUTER_R - 3.5);
    throatShape.lineTo(-AVENUE_HALF - 3.5, ROUNDABOUT_OUTER_R - 3.5);
    throatShape.closePath();
    const throatGeo = new THREE.ShapeGeometry(throatShape);
    throatGeo.rotateX(-Math.PI / 2);
    throatGeo.rotateY(angle);
    throatGeo.translate(0, AVENUE_ROAD_Y, 0);
    asphaltGeometries.push(throatGeo);
  });

  const gridStreets = [-192, -128, -64, 64, 128, 192];
  const intersectionOffsets = [...gridStreets, 0].sort((a, b) => a - b);
  const gridLength = 520.0;

  gridStreets.forEach(u => {
    const street = new THREE.PlaneGeometry(GRID_STREET_WIDTH, gridLength);
    scaleTextureUvs(street, GRID_STREET_WIDTH / 4, gridLength / 4);
    street.rotateX(-Math.PI / 2);
    street.rotateY(Math.PI / 4);
    street.translate(u / SQRT2, GRID_U_ROAD_Y, -u / SQRT2);
    asphaltGeometries.push(street);
  });

  gridStreets.forEach(v => {
    const street = new THREE.PlaneGeometry(GRID_STREET_WIDTH, gridLength);
    scaleTextureUvs(street, GRID_STREET_WIDTH / 4, gridLength / 4);
    street.rotateX(-Math.PI / 2);
    street.rotateY(-Math.PI / 4);
    street.translate(v / SQRT2, GRID_V_ROAD_Y, v / SQRT2);
    asphaltGeometries.push(street);
  });

  const bypassR = 45.0;
  const eastBypass = new THREE.RingGeometry(bypassR - 5.0, bypassR + 5.0, 32, 1, -Math.PI / 4, Math.PI / 2);
  scaleTextureUvs(eastBypass, 10, 10);
  eastBypass.rotateX(-Math.PI / 2);
  eastBypass.translate(0, ROUNDABOUT_ROAD_Y, 0);
  asphaltGeometries.push(eastBypass);

  const westBypass = new THREE.RingGeometry(bypassR - 5.0, bypassR + 5.0, 32, 1, (3 * Math.PI) / 4, Math.PI / 2);
  scaleTextureUvs(westBypass, 10, 10);
  westBypass.rotateX(-Math.PI / 2);
  westBypass.translate(0, ROUNDABOUT_ROAD_Y, 0);
  asphaltGeometries.push(westBypass);

  // -----------------------------------------------------------------------
  // 2. CENTRAL ROUNDABOUT ISLAND & "THE GAT" CIVIC MONUMENT
  // -----------------------------------------------------------------------
  const centralPlazaGeo = new THREE.CircleGeometry(ROUNDABOUT_INNER_R, 64);
  centralPlazaGeo.rotateX(-Math.PI / 2);
  centralPlazaGeo.translate(0, 0.150, 0);
  concreteGeometries.push(centralPlazaGeo);

  const centralCurbGeo = new THREE.RingGeometry(ROUNDABOUT_INNER_R - 0.45, ROUNDABOUT_INNER_R, 64);
  centralCurbGeo.rotateX(-Math.PI / 2);
  centralCurbGeo.translate(0, 0.170, 0);
  curbGeometries.push(centralCurbGeo);

  const innerBand = new THREE.RingGeometry(8.0, 8.4, 64);
  innerBand.rotateX(-Math.PI / 2);
  innerBand.translate(0, 0.152, 0);
  curbGeometries.push(innerBand);

  const gatGroup = new THREE.Group();
  gatGroup.name = 'TheGAT_Monument';
  gatGroup.rotation.y = (3 * Math.PI) / 4;

  const basinRing = new THREE.RingGeometry(5.2, 6.2, 48);
  basinRing.rotateX(-Math.PI / 2);
  basinRing.translate(0, 0.40, 0);
  curbGeometries.push(basinRing);

  const waterGeo = new THREE.CircleGeometry(5.2, 48);
  waterGeo.rotateX(-Math.PI / 2);
  waterGeo.translate(0, 0.35, 0);
  const waterMesh = new THREE.Mesh(
    waterGeo,
    new THREE.MeshStandardMaterial({
      color: 0x00f3ff,
      roughness: 0.05,
      metalness: 0.90,
      transparent: true,
      opacity: 0.85
    })
  );
  gatGroup.add(waterMesh);

  const pedestalGeo = new THREE.BoxGeometry(7.5, 2.2, 7.5);
  pedestalGeo.translate(0, 1.25, 0);
  const pedestalMesh = new THREE.Mesh(pedestalGeo, stainlessSteelMaterial);
  pedestalMesh.castShadow = true;
  pedestalMesh.receiveShadow = true;
  gatGroup.add(pedestalMesh);

  const pillarGeo = new THREE.CylinderGeometry(1.6, 1.9, 8.5, 24);
  pillarGeo.translate(0, 6.6, 0);
  const pillarMesh = new THREE.Mesh(pillarGeo, bldgDarkFacadeMaterial);
  pillarMesh.castShadow = true;
  gatGroup.add(pillarMesh);

  const statueTorso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.6, 3.2, 16),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.85 })
  );
  statueTorso.position.set(0, 12.5, 0);
  gatGroup.add(statueTorso);

  const statueHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.85 })
  );
  statueHead.position.set(0, 14.5, 0);
  gatGroup.add(statueHead);

  for (const dir of [-1, 1]) {
    for (let f = 0; f < 8; f++) {
      const wingFeather = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.3, 3.5 - f * 0.25),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 })
      );
      wingFeather.position.set(dir * (1.2 + f * 0.45), 13.5 + f * 0.45, -0.2 - f * 0.15);
      wingFeather.rotation.z = dir * (-0.35 - f * 0.08);
      wingFeather.rotation.y = dir * 0.25;
      gatGroup.add(wingFeather);
    }
  }

  const crestGeo = new THREE.OctahedronGeometry(0.7, 0);
  crestGeo.scale(1.2, 1.6, 0.8);
  const crestMesh = new THREE.Mesh(
    crestGeo,
    new THREE.MeshBasicMaterial({ color: 0xa855f7 })
  );
  crestMesh.position.set(0, 14.6, 0.55);
  gatGroup.add(crestMesh);

  const gatCyanLight = new THREE.SpotLight(0x00f3ff, 50, 40, Math.PI / 4, 0.4);
  gatCyanLight.position.set(-6, 0.5, 6);
  gatCyanLight.target = statueTorso;
  gatGroup.add(gatCyanLight);

  const gatMagentaLight = new THREE.SpotLight(0xff007f, 50, 40, Math.PI / 4, 0.4);
  gatMagentaLight.position.set(6, 0.5, -6);
  gatMagentaLight.target = statueTorso;
  gatGroup.add(gatMagentaLight);

  cityGroup.add(gatGroup);

  // -----------------------------------------------------------------------
  // 3. ROADWAY MARKINGS & PEDESTRIAN CROSSWALKS
  // -----------------------------------------------------------------------
  avenueAngles.forEach(angle => {
    const startR = ROUNDABOUT_OUTER_R - 1.0;
    const avenueLen = AVENUE_SPAN - startR;

    const avenueIntersections = [64, 128, 192];
    const laneSegments: Array<[number, number]> = [];
    let segmentStart = startR;
    for (const crossing of avenueIntersections) {
      laneSegments.push([segmentStart, crossing - 9]);
      segmentStart = crossing + 9;
    }
    laneSegments.push([segmentStart, AVENUE_SPAN]);

    [-0.15, 0.15].forEach(offset => {
      for (const [segmentStart, segmentEnd] of laneSegments) {
        const yellowLine = new THREE.PlaneGeometry(0.18, segmentEnd - segmentStart);
        yellowLine.rotateX(-Math.PI / 2);
        yellowLine.rotateY(angle);
        const perpX = Math.cos(angle) * offset;
        const perpZ = -Math.sin(angle) * offset;
        const centerDist = (segmentStart + segmentEnd) / 2;
        yellowLine.translate(
          Math.sin(angle) * centerDist + perpX,
          ROAD_MARKING_Y,
          Math.cos(angle) * centerDist + perpZ
        );
        yellowPaintGeometries.push(yellowLine);
      }
    });

    [-5.0, 5.0].forEach(laneOffset => {
      const numDashes = Math.floor(avenueLen / AVENUE_DASH_SPACING);
      for (let d = 0; d < numDashes; d++) {
        const dDist = startR + 3.0 + d * AVENUE_DASH_SPACING;
        if (avenueIntersections.some(crossing => Math.abs(dDist - crossing) < 11)) continue;
        const dash = new THREE.PlaneGeometry(0.18, 3.2);
        dash.rotateX(-Math.PI / 2);
        dash.rotateY(angle);
        const perpX = Math.cos(angle) * laneOffset;
        const perpZ = -Math.sin(angle) * laneOffset;
        dash.translate(
          Math.sin(angle) * dDist + perpX,
          ROAD_MARKING_Y,
          Math.cos(angle) * dDist + perpZ
        );
        whitePaintGeometries.push(dash);
      }
    });

    [-AVENUE_EDGE_OFFSET, AVENUE_EDGE_OFFSET].forEach(edgeOffset => {
      for (const [segmentStart, segmentEnd] of laneSegments) {
        const edgeLine = new THREE.PlaneGeometry(0.18, segmentEnd - segmentStart);
        edgeLine.rotateX(-Math.PI / 2);
        edgeLine.rotateY(angle);
        const perpX = Math.cos(angle) * edgeOffset;
        const perpZ = -Math.sin(angle) * edgeOffset;
        const centerDist = (segmentStart + segmentEnd) / 2;
        edgeLine.translate(
          Math.sin(angle) * centerDist + perpX,
          ROAD_MARKING_Y,
          Math.cos(angle) * centerDist + perpZ
        );
        whitePaintGeometries.push(edgeLine);
      }
    });

    const crosswalkDist = startR + 4.5;
    const numBars = 14;
    for (let b = 0; b < numBars; b++) {
      const barOffset = -AVENUE_HALF + 1.2 + b * (AVENUE_WIDTH - 2.4) / (numBars - 1);
      const bar = new THREE.PlaneGeometry(0.65, 3.2);
      bar.rotateX(-Math.PI / 2);
      bar.rotateY(angle);
      const perpX = Math.cos(angle) * barOffset;
      const perpZ = -Math.sin(angle) * barOffset;
      bar.translate(
        Math.sin(angle) * crosswalkDist + perpX,
        ROAD_MARKING_Y,
        Math.cos(angle) * crosswalkDist + perpZ
      );
      whitePaintGeometries.push(bar);
    }

    const stopBarDist = crosswalkDist + 3.2;
    const stopBar = new THREE.PlaneGeometry(AVENUE_WIDTH - 2.0, 0.65);
    stopBar.rotateX(-Math.PI / 2);
    stopBar.rotateY(angle);
    stopBar.translate(
      Math.sin(angle) * stopBarDist,
      ROAD_MARKING_Y,
      Math.cos(angle) * stopBarDist
    );
    whitePaintGeometries.push(stopBar);

    [-AVENUE_HALF - 0.9, AVENUE_HALF + 0.9].forEach(sideOffset => {
      const tactile = new THREE.PlaneGeometry(1.4, 2.8);
      tactile.rotateX(-Math.PI / 2);
      tactile.rotateY(angle);
      const perpX = Math.cos(angle) * sideOffset;
      const perpZ = -Math.sin(angle) * sideOffset;
      tactile.translate(
        Math.sin(angle) * crosswalkDist + perpX,
        0.155,
        Math.cos(angle) * crosswalkDist + perpZ
      );
      tactileGeometries.push(tactile);
    });

    for (let m = 0; m < 3; m++) {
      const mDist = startR + 25.0 + m * 55.0;
      const manholeGeo = new THREE.CircleGeometry(0.55, 24);
      manholeGeo.rotateX(-Math.PI / 2);
      const mPerpX = Math.cos(angle) * 3.2;
      const mPerpZ = -Math.sin(angle) * 3.2;
      manholeGeo.translate(
        Math.sin(angle) * mDist + mPerpX,
        AVENUE_ROAD_Y + 0.006,
        Math.cos(angle) * mDist + mPerpZ
      );
      manholeGeometries.push(manholeGeo);

      const grateGeo = new THREE.PlaneGeometry(0.75, 1.2);
      grateGeo.rotateX(-Math.PI / 2);
      grateGeo.rotateY(angle);
      const gPerpX = Math.cos(angle) * (AVENUE_HALF - 0.6);
      const gPerpZ = -Math.sin(angle) * (AVENUE_HALF - 0.6);
      grateGeo.translate(
        Math.sin(angle) * (mDist + 8.0) + gPerpX,
        AVENUE_ROAD_Y + 0.006,
        Math.cos(angle) * (mDist + 8.0) + gPerpZ
      );
      manholeGeometries.push(grateGeo);
    }
  });

  const addGridRoadMarking = (
    axis: 'u' | 'v',
    fixedCoordinate: number,
    start: number,
    end: number,
    lateralOffset: number,
    target: THREE.BufferGeometry[],
    lineWidth: number,
    dashed: boolean
  ) => {
    const roadAngle = axis === 'u' ? Math.PI / 4 : (3 * Math.PI) / 4;
    const roadY = axis === 'u' ? GRID_U_ROAD_Y : GRID_V_ROAD_Y;
    const markingY = roadY + 0.025;
    const dashLength = 3.0;
    const dashStep = 7.6;
    const addMarking = (distance: number, length: number) => {
      const point = axis === 'u'
        ? uToWorld(fixedCoordinate, distance)
        : uToWorld(distance, fixedCoordinate);
      const marking = new THREE.PlaneGeometry(lineWidth, length);
      marking.rotateX(-Math.PI / 2);
      marking.rotateY(roadAngle);
      marking.translate(
        point.x + Math.cos(roadAngle) * lateralOffset,
        markingY,
        point.z - Math.sin(roadAngle) * lateralOffset
      );
      target.push(marking);
    };

    if (dashed) {
      for (let distance = start + 1.5; distance + dashLength <= end; distance += dashStep) {
        addMarking(distance + dashLength / 2, dashLength);
      }
    } else {
      addMarking((start + end) / 2, end - start);
    }
  };

  const gridRoadHalfLength = gridLength / 2;
  for (const axis of ['u', 'v'] as const) {
    for (const fixedCoordinate of gridStreets) {
      let segmentStart = -gridRoadHalfLength;
      for (const crossing of intersectionOffsets) {
        addGridRoadMarking(axis, fixedCoordinate, segmentStart, crossing - 9, 0, yellowPaintGeometries, 0.18, true);
        for (const edgeOffset of [-GRID_STREET_WIDTH / 2 + 0.55, GRID_STREET_WIDTH / 2 - 0.55]) {
          addGridRoadMarking(axis, fixedCoordinate, segmentStart, crossing - 9, edgeOffset, whitePaintGeometries, 0.14, false);
        }
        segmentStart = crossing + 9;
      }
      addGridRoadMarking(axis, fixedCoordinate, segmentStart, gridRoadHalfLength, 0, yellowPaintGeometries, 0.18, true);
      for (const edgeOffset of [-GRID_STREET_WIDTH / 2 + 0.55, GRID_STREET_WIDTH / 2 - 0.55]) {
        addGridRoadMarking(axis, fixedCoordinate, segmentStart, gridRoadHalfLength, edgeOffset, whitePaintGeometries, 0.14, false);
      }
    }
  }

  // -----------------------------------------------------------------------
  // 4. SIDEWALKS, CURBS & URBAN PARCEL LOTS
  // -----------------------------------------------------------------------
  const centralBlocks = [
    { uMin: 14, uMax: 60, vMin: 14, vMax: 60 },
    { uMin: -60, uMax: -14, vMin: -60, vMax: -14 },
    { uMin: 14, uMax: 60, vMin: -60, vMax: -14 },
    { uMin: -60, uMax: -14, vMin: 14, vMax: 60 }
  ];

  centralBlocks.forEach(blk => {
    const w = blk.uMax - blk.uMin;
    const h = blk.vMax - blk.vMin;
    const cu = (blk.uMin + blk.uMax) / 2;
    const cv = (blk.vMin + blk.vMax) / 2;
    const pos = uToWorld(cu, cv);

    const swShape = createRoundedRectShape(w, h, 4.0);
    const swGeo = new THREE.ShapeGeometry(swShape);
    swGeo.rotateX(-Math.PI / 2);
    swGeo.rotateY(Math.PI / 4);
    swGeo.translate(pos.x, 0.150, pos.z);
    concreteGeometries.push(swGeo);

    const lotShape = createRoundedRectShape(w - 5.0, h - 5.0, 3.0);
    const lotGeo = new THREE.ShapeGeometry(lotShape);
    lotGeo.rotateX(-Math.PI / 2);
    lotGeo.rotateY(Math.PI / 4);
    lotGeo.translate(pos.x, 0.152, pos.z);
    parcelGeometries.push(lotGeo);
  });

  const blockRanges = [-188, -124, -60, 4, 68, 132];
  const getBlockBounds = (start: number) => ({
    min: start === 4 ? AVENUE_HALF : start,
    max: start === -60 ? -AVENUE_HALF : start + 54
  });
  blockRanges.forEach(u => {
    blockRanges.forEach(v => {
      if (Math.abs(u) < 65 && Math.abs(v) < 65) return;

      const uBounds = getBlockBounds(u);
      const vBounds = getBlockBounds(v);
      const bw = uBounds.max - uBounds.min;
      const bh = vBounds.max - vBounds.min;
      const cu = (uBounds.min + uBounds.max) / 2;
      const cv = (vBounds.min + vBounds.max) / 2;
      const pos = uToWorld(cu, cv);

      const swShape = createRoundedRectShape(bw, bh, 3.5);
      const swGeo = new THREE.ShapeGeometry(swShape);
      swGeo.rotateX(-Math.PI / 2);
      swGeo.rotateY(Math.PI / 4);
      swGeo.translate(pos.x, 0.150, pos.z);
      concreteGeometries.push(swGeo);

      const lotShape = createRoundedRectShape(bw - 4.5, bh - 4.5, 2.5);
      const lotGeo = new THREE.ShapeGeometry(lotShape);
      lotGeo.rotateX(-Math.PI / 2);
      lotGeo.rotateY(Math.PI / 4);
      lotGeo.translate(pos.x, 0.152, pos.z);
      parcelGeometries.push(lotGeo);
    });
  });

  // -----------------------------------------------------------------------
  // 5. BUILDINGS ARCHITECTURE & JUMBOTRONS (MOUNTED ON BUILDINGS ONLY)
  // -----------------------------------------------------------------------
  const addBuildingComponent = (geo: THREE.BufferGeometry, targetArray: THREE.BufferGeometry[]) => {
    targetArray.push(geo);
  };

  const getTowerFootprint = (u: number, v: number) => {
    const style = Math.abs(Math.round(u * 3 + v * 5)) % 3;
    return {
      style,
      baseW: style === 1 ? 28.0 : style === 2 ? 36.0 : 32.0,
      baseD: style === 1 ? 36.0 : style === 2 ? 28.0 : 32.0,
      baseH: (style === 1 ? 12.0 : style === 2 ? 16.0 : 14.0) + 6.0
    };
  };
  let facadeDesignIndex = 0;
  const nonBillboardProfiles = [
    { setback: 0.38, middleScale: 0.96, topScale: 0.82, offsetX: 0, offsetZ: 0, terraceSide: 0, terraceLevels: [0.43, 0.72], terraceWidth: 0.54, roofScale: 0.72 },
    { setback: 0.45, middleScale: 0.91, topScale: 0.76, offsetX: 1.1, offsetZ: 0, terraceSide: 1, terraceLevels: [0.58], terraceWidth: 0.48, roofScale: 0.64 },
    { setback: 0.52, middleScale: 0.94, topScale: 0.88, offsetX: 0, offsetZ: -1.2, terraceSide: 2, terraceLevels: [0.38, 0.78], terraceWidth: 0.62, roofScale: 0.80 },
    { setback: 0.61, middleScale: 0.88, topScale: 0.73, offsetX: -1.0, offsetZ: 0.6, terraceSide: 3, terraceLevels: [0.64], terraceWidth: 0.70, roofScale: 0.58 },
    { setback: 0.35, middleScale: 0.98, topScale: 0.86, offsetX: 0.5, offsetZ: 1.0, terraceSide: 0, terraceLevels: [0.54], terraceWidth: 0.44, roofScale: 0.76 },
    { setback: 0.48, middleScale: 0.89, topScale: 0.80, offsetX: -0.8, offsetZ: -0.5, terraceSide: 1, terraceLevels: [0.36, 0.68], terraceWidth: 0.58, roofScale: 0.68 },
    { setback: 0.57, middleScale: 0.93, topScale: 0.70, offsetX: 0.8, offsetZ: -0.8, terraceSide: 2, terraceLevels: [0.61], terraceWidth: 0.66, roofScale: 0.56 },
    { setback: 0.42, middleScale: 0.86, topScale: 0.84, offsetX: -1.2, offsetZ: 0, terraceSide: 3, terraceLevels: [0.46, 0.76], terraceWidth: 0.50, roofScale: 0.82 },
    { setback: 0.66, middleScale: 0.95, topScale: 0.78, offsetX: 0, offsetZ: 1.2, terraceSide: 0, terraceLevels: [0.57], terraceWidth: 0.72, roofScale: 0.62 },
    { setback: 0.40, middleScale: 0.90, topScale: 0.68, offsetX: 1.0, offsetZ: 0.7, terraceSide: 1, terraceLevels: [0.41, 0.70], terraceWidth: 0.60, roofScale: 0.54 },
    { setback: 0.55, middleScale: 0.97, topScale: 0.80, offsetX: -0.6, offsetZ: 1.0, terraceSide: 2, terraceLevels: [0.63], terraceWidth: 0.46, roofScale: 0.74 },
    { setback: 0.46, middleScale: 0.87, topScale: 0.90, offsetX: 0.6, offsetZ: -1.1, terraceSide: 3, terraceLevels: [0.35, 0.66], terraceWidth: 0.64, roofScale: 0.86 },
    { setback: 0.63, middleScale: 0.92, topScale: 0.74, offsetX: -1.1, offsetZ: -0.7, terraceSide: 0, terraceLevels: [0.52], terraceWidth: 0.52, roofScale: 0.60 },
    { setback: 0.37, middleScale: 0.85, topScale: 0.88, offsetX: 1.2, offsetZ: -0.4, terraceSide: 1, terraceLevels: [0.45, 0.74], terraceWidth: 0.68, roofScale: 0.78 },
    { setback: 0.59, middleScale: 0.99, topScale: 0.72, offsetX: -0.4, offsetZ: 1.1, terraceSide: 2, terraceLevels: [0.60], terraceWidth: 0.56, roofScale: 0.52 },
    { setback: 0.44, middleScale: 0.89, topScale: 0.86, offsetX: 0.9, offsetZ: 0.8, terraceSide: 3, terraceLevels: [0.39, 0.69], terraceWidth: 0.74, roofScale: 0.84 },
    { setback: 0.68, middleScale: 0.96, topScale: 0.76, offsetX: -0.9, offsetZ: -1.0, terraceSide: 0, terraceLevels: [0.56], terraceWidth: 0.58, roofScale: 0.66 },
    { setback: 0.50, middleScale: 0.84, topScale: 0.82, offsetX: 0.4, offsetZ: -1.2, terraceSide: 1, terraceLevels: [0.42, 0.73], terraceWidth: 0.42, roofScale: 0.70 }
  ];
  let nonBillboardProfileIndex = 0;

  const buildSkyscraperTower = (
    u: number,
    v: number,
    maxH = 95.0,
    jumbotronConfig?: {
      w: number;
      h: number;
      facingAngle: number;
      storyOffset: number;
      allSides?: boolean;
    }
  ) => {
    const pos = uToWorld(u, v);
    const x = pos.x;
    const z = pos.z;

    const designIndex = facadeDesignIndex++;
    const nonBillboardIndex = jumbotronConfig ? -1 : nonBillboardProfileIndex++;
    const nonBillboardProfile = nonBillboardIndex < 0
      ? undefined
      : nonBillboardProfiles[nonBillboardIndex % nonBillboardProfiles.length];
    const { style, baseW, baseD, baseH } = getTowerFootprint(u, v);
    const neonIndex = Math.abs(Math.round(u * 17 + v * 13 + (u * v) / 5)) % bldgNeonGeometries.length;
    const neonGeometries = bldgNeonGeometries[neonIndex];
    const collisionScale = nonBillboardProfile
      ? 1.03 + (nonBillboardProfile.topScale - 0.68) * 0.2
      : 1;
    collisionObstacles.push({
      x,
      z,
      halfWidth: (baseW * collisionScale) / 2 + 0.35,
      halfDepth: (baseD * collisionScale) / 2 + 0.35,
      rotationY: Math.PI / 4
    });

    const addTowerComponent = (
      width: number,
      height: number,
      depth: number,
      localX: number,
      localY: number,
      localZ: number,
      targetArray: THREE.BufferGeometry[]
    ) => {
      const geometry = new THREE.BoxGeometry(width, height, depth);
      geometry.translate(localX, localY, localZ);
      geometry.rotateY(Math.PI / 4);
      geometry.translate(x, 0, z);
      addBuildingComponent(geometry, targetArray);
    };

    const addStorefrontPanel = (
      width: number,
      height: number,
      localX: number,
      localY: number,
      localZ: number,
      faceRotation = 0
    ) => {
      const geometry = new THREE.PlaneGeometry(width, height);
      geometry.rotateY(faceRotation);
      geometry.translate(localX, localY, localZ);
      geometry.rotateY(Math.PI / 4);
      geometry.translate(x, 0, z);
      addBuildingComponent(geometry, bldgStorefrontGlassGeometries);
    };

    const podiumBottom = 4.2;
    const podiumTop = baseH + 0.15;
    const podiumHeight = podiumTop - podiumBottom;
    const podiumCenterY = (podiumTop + podiumBottom) / 2;
    if (!nonBillboardProfile) {
      const podiumGeo = new THREE.BoxGeometry(baseW, podiumHeight, baseD);
      podiumGeo.rotateY(Math.PI / 4);
      podiumGeo.translate(x, podiumCenterY, z);
      addBuildingComponent(podiumGeo, bldgDarkGeometries);
    } else {
      const lowerTop = podiumBottom + podiumHeight * nonBillboardProfile.setback;
      const lowerScale = 1.03 + (nonBillboardProfile.topScale - 0.68) * 0.2;
      const upperScale = 0.84 + (nonBillboardProfile.middleScale - 0.84) * 0.5;
      const lowerMaterial = nonBillboardIndex % 3 === 0
        ? bldgConcreteGeometries
        : bldgDarkGeometries;
      const upperMaterial = nonBillboardIndex % 3 === 1
        ? bldgConcreteGeometries
        : bldgDarkGeometries;
      addTowerComponent(
        baseW * lowerScale,
        lowerTop - podiumBottom,
        baseD * lowerScale,
        0,
        (podiumBottom + lowerTop) / 2,
        0,
        lowerMaterial
      );
      addTowerComponent(
        baseW * upperScale,
        podiumTop - lowerTop,
        baseD * upperScale,
        nonBillboardProfile.offsetX,
        lowerTop + (podiumTop - lowerTop) / 2,
        nonBillboardProfile.offsetZ,
        upperMaterial
      );
    }

    addTowerComponent(
      baseW + 4.0,
      0.32,
      baseD + 4.0,
      0,
      0.31,
      0,
      bldgConcreteGeometries
    );

    const interiorIndex = nonBillboardIndex >= 0 ? nonBillboardIndex : designIndex + 18;
    const storefrontHeight = 3.4;
    const storefrontCenterY = 2.32;
    const entryWidth = 2.5 + (interiorIndex % 4) * 0.25;
    const frontWindowWidth = (baseW - entryWidth) / 2;

    addTowerComponent(
      baseW - 4.0,
      0.16,
      baseD - 4.0,
      0,
      0.53,
      0,
      bldgStoreFloorGeometries
    );
    addTowerComponent(
      baseW - 5.0,
      0.16,
      baseD - 5.0,
      0,
      3.98,
      0,
      bldgStoreDisplayGeometries
    );

    addStorefrontPanel(
      frontWindowWidth,
      storefrontHeight,
      -entryWidth / 2 - frontWindowWidth / 2,
      storefrontCenterY,
      baseD / 2
    );
    addStorefrontPanel(
      frontWindowWidth,
      storefrontHeight,
      entryWidth / 2 + frontWindowWidth / 2,
      storefrontCenterY,
      baseD / 2
    );
    addStorefrontPanel(
      entryWidth,
      storefrontHeight,
      0,
      storefrontCenterY,
      baseD / 2
    );
    for (const side of [-1, 1]) {
      addStorefrontPanel(
        baseD,
        storefrontHeight,
        side * baseW / 2,
        storefrontCenterY,
        0,
        Math.PI / 2
      );
    }
    addStorefrontPanel(
      baseW,
      storefrontHeight,
      0,
      storefrontCenterY,
      -baseD / 2
    );

    const counterWidth = 4.4 + (interiorIndex % 5) * 0.55;
    const counterDepth = 1.0 + (interiorIndex % 3) * 0.16;
    const counterZ = -baseD / 2 + 5.2;
    addTowerComponent(
      counterWidth,
      1.05,
      counterDepth,
      0,
      1.18,
      counterZ,
      bldgStoreFixtureGeometries
    );
    addTowerComponent(
      counterWidth + 0.18,
      0.12,
      counterDepth + 0.18,
      0,
      1.76,
      counterZ,
      bldgStoreDisplayGeometries
    );

    const storeLayout = interiorIndex % 4;
    if (storeLayout === 0) {
      const tableCount = 1 + interiorIndex % 2;
      for (let table = 0; table < tableCount; table++) {
        const localX = (table - (tableCount - 1) / 2) * 5.2;
        const localZ = -1.0 + (interiorIndex % 3) * 0.7;
        addTowerComponent(2.0, 0.16, 1.6, localX, 1.0, localZ, bldgStoreDisplayGeometries);
        addTowerComponent(0.18, 0.72, 0.18, localX, 0.58, localZ, bldgStoreFixtureGeometries);
        for (const seatSide of [-1, 1]) {
          addTowerComponent(
            0.72,
            0.66,
            0.72,
            localX + seatSide * 1.45,
            0.88,
            localZ,
            bldgStoreFixtureGeometries
          );
        }
      }
    } else if (storeLayout === 1) {
      const shelfWidth = baseW * 0.38;
      const shelfZ = -baseD / 2 + 1.45;
      addTowerComponent(
        shelfWidth,
        2.15,
        0.58,
        0,
        1.68,
        shelfZ,
        bldgStoreFixtureGeometries
      );
      for (let shelf = 0; shelf < 3; shelf++) {
        addTowerComponent(
          shelfWidth - 0.24,
          0.14,
          0.66,
          0,
          0.92 + shelf * 0.62,
          shelfZ + 0.04,
          bldgStoreDisplayGeometries
        );
      }
    } else if (storeLayout === 2) {
      const pedestalCount = 2 + interiorIndex % 2;
      for (let pedestal = 0; pedestal < pedestalCount; pedestal++) {
        const localX = (pedestal - (pedestalCount - 1) / 2) * 4.0;
        const pedestalHeight = 0.92 + ((interiorIndex + pedestal) % 3) * 0.28;
        addTowerComponent(
          1.55,
          pedestalHeight,
          1.55,
          localX,
          0.61 + pedestalHeight / 2,
          0,
          bldgStoreFixtureGeometries
        );
        addTowerComponent(
          1.72,
          0.12,
          1.72,
          localX,
          0.61 + pedestalHeight,
          0,
          bldgStoreDisplayGeometries
        );
      }
    } else {
      addTowerComponent(5.2, 0.92, 1.35, 0, 1.07, 0.4, bldgStoreFixtureGeometries);
      addTowerComponent(2.8, 0.72, 1.1, -4.0, 0.97, -1.6, bldgStoreFixtureGeometries);
      addTowerComponent(2.8, 0.72, 1.1, 4.0, 0.97, -1.6, bldgStoreFixtureGeometries);
      addTowerComponent(3.2, 0.16, 1.6, 0, 1.05, 2.8, bldgStoreDisplayGeometries);
    }

    if (interiorIndex % 3 !== 1) {
      for (const localX of [-baseW * 0.32, baseW * 0.32]) {
        addTowerComponent(0.85, 0.48, 0.85, localX, 0.85, baseD / 2 - 3.2, bldgStoreFixtureGeometries);
        const storePlant = new THREE.DodecahedronGeometry(0.62, 0);
        storePlant.translate(localX, 1.55, baseD / 2 - 3.2);
        storePlant.rotateY(Math.PI / 4);
        storePlant.translate(x, 0, z);
        addBuildingComponent(storePlant, bldgBalconyPlantGeometries);
      }
    }

    for (const localX of [-baseW * 0.24, 0, baseW * 0.24]) {
      addTowerComponent(
        2.7,
        0.14,
        1.35,
        localX,
        3.82,
        0,
        bldgStoreWarmLightGeometries
      );
    }
    if (nonBillboardProfile) {
      const storeLight = new THREE.PointLight(0xffc887, 4.5, 18, 2);
      storeLight.position.set(x, 2.9, z);
      cityGroup.add(storeLight);
    }

    if (jumbotronConfig) {
      for (const localX of [-baseW / 2 + 1.4, baseW / 2 - 1.4]) {
        for (const localZ of [-baseD / 2 + 1.4, baseD / 2 - 1.4]) {
          addTowerComponent(
            0.72,
            baseH - 2.6,
            0.72,
            localX,
            baseH / 2 + 0.15,
            localZ,
            stainlessGeometries
          );
        }
      }

      addTowerComponent(
        baseW + 1.4,
        0.38,
        baseD + 1.4,
        0,
        baseH - 0.65,
        0,
        neonGeometries
      );
      addTowerComponent(
        baseW + 0.2,
        0.25,
        baseD + 0.2,
        0,
        4.3,
        0,
        neonGeometries
      );
    }

    const midH = maxH * 0.65;
    const midW = baseW - 6.0;
    const midD = baseD - 6.0;
    const midGeo = new THREE.BoxGeometry(midW, midH, midD);
    midGeo.rotateY(Math.PI / 4);
    midGeo.translate(x, baseH + midH / 2, z);
    addBuildingComponent(midGeo, bldgGlassGeometries);

    const balconyLevels = nonBillboardProfile ? [] : (neonIndex === 2 ? [0.42, 0.76] : [0.3, 0.53, 0.76]);
    const balconyWidth = midW + 3.4;
    const balconyDepth = midD + 3.4;
    const halfBalconyWidth = balconyWidth / 2;
    const halfBalconyDepth = balconyDepth / 2;
    const railThickness = 0.12;
    const balconyPosts: Array<[number, number]> = [
      [-halfBalconyWidth, -halfBalconyDepth],
      [-halfBalconyWidth, halfBalconyDepth],
      [halfBalconyWidth, -halfBalconyDepth],
      [halfBalconyWidth, halfBalconyDepth],
      [0, -halfBalconyDepth],
      [0, halfBalconyDepth],
      [-halfBalconyWidth, 0],
      [halfBalconyWidth, 0]
    ];

    balconyLevels.forEach((heightRatio, levelIndex) => {
      const balconyY = baseH + midH * heightRatio;
      addTowerComponent(
        balconyWidth,
        0.24,
        balconyDepth,
        0,
        balconyY,
        0,
        bldgConcreteGeometries
      );

      const panelHeight = 0.68;
      const panelY = balconyY + 0.56;
      const railY = balconyY + 1.0;
      addTowerComponent(
        balconyWidth - 0.24,
        panelHeight,
        0.08,
        0,
        panelY,
        halfBalconyDepth,
        bldgBalconyGlassGeometries
      );
      addTowerComponent(
        balconyWidth - 0.24,
        panelHeight,
        0.08,
        0,
        panelY,
        -halfBalconyDepth,
        bldgBalconyGlassGeometries
      );
      addTowerComponent(
        0.08,
        panelHeight,
        balconyDepth - 0.24,
        halfBalconyWidth,
        panelY,
        0,
        bldgBalconyGlassGeometries
      );
      addTowerComponent(
        0.08,
        panelHeight,
        balconyDepth - 0.24,
        -halfBalconyWidth,
        panelY,
        0,
        bldgBalconyGlassGeometries
      );

      addTowerComponent(
        balconyWidth,
        railThickness,
        railThickness,
        0,
        railY,
        halfBalconyDepth,
        stainlessGeometries
      );
      addTowerComponent(
        balconyWidth,
        railThickness,
        railThickness,
        0,
        railY,
        -halfBalconyDepth,
        stainlessGeometries
      );
      addTowerComponent(
        railThickness,
        railThickness,
        balconyDepth,
        halfBalconyWidth,
        railY,
        0,
        stainlessGeometries
      );
      addTowerComponent(
        railThickness,
        railThickness,
        balconyDepth,
        -halfBalconyWidth,
        railY,
        0,
        stainlessGeometries
      );

      balconyPosts.forEach(([localX, localZ]) => {
        addTowerComponent(
          railThickness,
          0.94,
          railThickness,
          localX,
          balconyY + 0.58,
          localZ,
          stainlessGeometries
        );
      });

      if (levelIndex % 2 === 0) {
        for (const side of [-1, 1]) {
          const planterZ = side * (halfBalconyDepth - 1.25);
          addTowerComponent(
            3.6,
            0.52,
            0.82,
            0,
            balconyY + 0.38,
            planterZ,
            bldgDarkGeometries
          );
          for (const localX of [-1.15, 0, 1.15]) {
            const foliage = new THREE.DodecahedronGeometry(0.42, 0);
            foliage.translate(localX, balconyY + 0.78, planterZ);
            foliage.rotateY(Math.PI / 4);
            foliage.translate(x, 0, z);
            addBuildingComponent(foliage, bldgBalconyPlantGeometries);
          }
        }
      }
    });

    if (!nonBillboardProfile) {
      for (const cx of [-midW / 2, midW / 2]) {
        for (const cz of [-midD / 2, midD / 2]) {
          const col = new THREE.BoxGeometry(1.2, midH, 1.2);
          col.translate(cx, baseH + midH / 2, cz);
          col.rotateY(Math.PI / 4);
          col.translate(x, 0, z);
          addBuildingComponent(col, stainlessGeometries);
        }
      }
    }

    if (nonBillboardProfile) {
      nonBillboardProfile.terraceLevels.forEach(level => {
        const scale = level < nonBillboardProfile.setback
          ? 1
          : level < 0.80
            ? nonBillboardProfile.middleScale
            : nonBillboardProfile.topScale;
        const halfWidth = midW * scale / 2;
        const halfDepth = midD * scale / 2;
        const terraceWidth = midW * nonBillboardProfile.terraceWidth;
        const terraceDepth = 2.8;
        const side = nonBillboardProfile.terraceSide;
        const direction = side === 0 || side === 1 ? 1 : -1;
        const onX = side === 1 || side === 3;
        const bodyOffsetX = level >= 0.80 ? nonBillboardProfile.offsetX : 0;
        const bodyOffsetZ = level >= 0.80 ? nonBillboardProfile.offsetZ : 0;
        const centerX = bodyOffsetX + (onX ? direction * (halfWidth + terraceDepth / 2 - 0.15) : 0);
        const centerZ = bodyOffsetZ + (!onX ? direction * (halfDepth + terraceDepth / 2 - 0.15) : 0);
        const slabWidth = onX ? terraceDepth : terraceWidth;
        const slabDepth = onX ? terraceWidth : terraceDepth;
        const terraceY = baseH + midH * level;
        addTowerComponent(
          slabWidth,
          0.32,
          slabDepth,
          centerX,
          terraceY,
          centerZ,
          bldgConcreteGeometries
        );
        const parapetY = terraceY + 0.55;
        const parapetCenterX = centerX + (onX ? direction * (terraceDepth / 2 - 0.12) : 0);
        const parapetCenterZ = centerZ + (!onX ? direction * (terraceDepth / 2 - 0.12) : 0);
        addTowerComponent(
          onX ? 0.24 : terraceWidth,
          0.8,
          onX ? terraceWidth : 0.24,
          parapetCenterX,
          parapetY,
          parapetCenterZ,
          bldgConcreteGeometries
        );
      });
    }

    const crownH = maxH * (nonBillboardProfile ? 0.14 : 0.20);
    const crownW = nonBillboardProfile ? midW * nonBillboardProfile.roofScale : midW - 6.0;
    const crownD = nonBillboardProfile ? midD * nonBillboardProfile.roofScale : midD - 6.0;
    const crownGeo = style === 1
      ? new THREE.CylinderGeometry(crownW * 0.30, crownW * 0.58, crownH, 8)
      : new THREE.BoxGeometry(crownW, crownH, crownD);
    if (style !== 1) crownGeo.rotateY(Math.PI / 4);
    crownGeo.translate(x, baseH + midH + crownH / 2, z);
    addBuildingComponent(crownGeo, bldgDarkGeometries);

    if (jumbotronConfig) {
      const neonRing = style === 1
        ? new THREE.CylinderGeometry(crownW * 0.58, crownW * 0.58, 0.4, 8)
        : new THREE.BoxGeometry(crownW + 0.3, 0.4, crownD + 0.3);
      if (style !== 1) neonRing.rotateY(Math.PI / 4);
      neonRing.translate(x, baseH + midH + crownH + 0.2, z);
      addBuildingComponent(neonRing, neonGeometries);

      const spireH = 18.0;
      const spireGeo = new THREE.CylinderGeometry(0.18, 0.6, spireH, 8);
      spireGeo.translate(x, baseH + midH + crownH + spireH / 2, z);
      addBuildingComponent(spireGeo, stainlessGeometries);

      const beaconGeo = new THREE.SphereGeometry(0.55, 8, 8);
      const beaconMesh = new THREE.Mesh(
        beaconGeo,
        new THREE.MeshBasicMaterial({ color: 0xff0044 })
      );
      beaconMesh.position.set(x, baseH + midH + crownH + spireH, z);
      cityGroup.add(beaconMesh);
      beaconLights.push(beaconMesh);
    }

    // JUMBOTRON MOUNTED ON BUILDING FACADE
    if (jumbotronConfig) {
      const { w: jbW, h: jbH, facingAngle, storyOffset, allSides = false } = jumbotronConfig;
      const lowerNeonY = 4.3;
      const upperNeonY = baseH - 0.65;
      const screenHeight = Math.min(jbH, upperNeonY - lowerNeonY - 1.6);
      const screenWidth = Math.min(jbW, Math.min(baseW, baseD) - 2, screenHeight * 2);
      const jbY = (lowerNeonY + upperNeonY) / 2;
      const facadeAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
      const screenAngles = allSides ? facadeAngles : [facingAngle];

      screenAngles.forEach((angle, sideIndex) => {
        const faceIndex = ((Math.round((angle - Math.PI / 4) / (Math.PI / 2)) % 4) + 4) % 4;
        const faceDepth = faceIndex % 2 === 0 ? baseD : baseW;
        const forwardDist = faceDepth / 2 + 0.22;
        const jbX = x + Math.sin(angle) * forwardDist;
        const jbZ = z + Math.cos(angle) * forwardDist;
        const jbHandle = createBuildingJumbotron(
          screenWidth,
          screenHeight,
          [DEFAULT_BILLBOARD_STORY],
          storyOffset + sideIndex
        );

        jbHandle.mesh.position.set(jbX, jbY, jbZ);
        jbHandle.mesh.rotation.y = angle;
        cityGroup.add(jbHandle.mesh);
        billboards.push(jbHandle);

        const frameGeo = new THREE.BoxGeometry(screenWidth + 0.8, screenHeight + 0.8, 0.5);
        frameGeo.rotateY(angle);
        frameGeo.translate(
          jbX - Math.sin(angle) * 0.28,
          jbY,
          jbZ - Math.cos(angle) * 0.28
        );
        addBuildingComponent(frameGeo, stainlessGeometries);
      });

      const lobbyLight = new THREE.PointLight(0xffcf88, 5, 42, 2);
      const lobbyAngle = screenAngles[0];
      const lobbyFaceIndex = ((Math.round((lobbyAngle - Math.PI / 4) / (Math.PI / 2)) % 4) + 4) % 4;
      const lobbyDepth = (lobbyFaceIndex % 2 === 0 ? baseD : baseW) / 2 + 0.5;
      lobbyLight.position.set(
        x + Math.sin(lobbyAngle) * lobbyDepth,
        4.5,
        z + Math.cos(lobbyAngle) * lobbyDepth
      );
      cityGroup.add(lobbyLight);
    }
  };

  // Build the 4 Core Skyscrapers around Roundabout with JUMBOTRONS MOUNTED ON BUILDINGS FACING THE PLAYER
  // Left Skyscraper (u = -42, v = 42 -> x = 0, z = 59.4): Jumbotron faces toward SW avenue and roundabout
  buildSkyscraperTower(-42, 42, 110.0, {
    w: 24.0,
    h: 13.0,
    facingAngle: (5 * Math.PI) / 4,
    storyOffset: 0,
    allSides: true
  });

  // Right Skyscraper (u = 42, v = 42 -> x = 59.4, z = 0): Jumbotron faces toward SW avenue and roundabout
  buildSkyscraperTower(42, 42, 115.0, {
    w: 24.0,
    h: 13.0,
    facingAngle: (7 * Math.PI) / 4,
    storyOffset: 1,
    allSides: true
  });

  // South-West Skyscraper (u = -42, v = -42): Jumbotron facing NE
  buildSkyscraperTower(-42, -42, 100.0, {
    w: 22.0,
    h: 12.0,
    facingAngle: Math.PI / 4,
    storyOffset: 2,
    allSides: true
  });

  // South-East Skyscraper (u = 42, v = -42): Jumbotron facing NW
  buildSkyscraperTower(42, -42, 105.0, {
    w: 22.0,
    h: 12.0,
    facingAngle: (3 * Math.PI) / 4,
    storyOffset: 3,
    allSides: true
  });

  const roadsideBillboards = [
    { distance: 152, side: -1 },
    { distance: 276, side: 1 }
  ];
  roadsideBillboards.forEach(({ distance, side }, index) => {
    const lateral = side * 19;
    const x = Math.sin(Math.PI / 4) * distance + Math.cos(Math.PI / 4) * lateral;
    const z = Math.cos(Math.PI / 4) * distance - Math.sin(Math.PI / 4) * lateral;
    const facingAngle = Math.PI / 4 - side * Math.PI / 2;
    const billboard = createBuildingJumbotron(16, 8, [DEFAULT_BILLBOARD_STORY], index);
    billboard.mesh.position.set(x, 10.5, z);
    billboard.mesh.rotation.y = facingAngle;
    cityGroup.add(billboard.mesh);
    billboards.push(billboard);

    const support = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 9.5, 0.65),
      stainlessSteelMaterial
    );
    support.position.set(x, 4.7, z);
    support.castShadow = true;
    cityGroup.add(support);
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.45, 1.7),
      stainlessSteelMaterial
    );
    base.position.set(x, 0.25, z);
    base.castShadow = true;
    cityGroup.add(base);
  });

  // Outer District Skyscrapers & Mid-rises inside blocks
  const outerBuildingCoords = [
    { u: 95, v: 35, h: 85 },
    { u: 35, v: 95, h: 78 },
    { u: -95, v: 35, h: 90 },
    { u: 35, v: -95, h: 82 },
    { u: -95, v: -95, h: 72 },
    { u: 95, v: -95, h: 96 },
    { u: 95, v: 95, h: 108 },
    { u: -95, v: 95, h: 88 },
    { u: 160, v: 35, h: 65 },
    { u: 35, v: 160, h: 62 },
    { u: -160, v: 35, h: 70 },
    { u: 35, v: -160, h: 68 },
    { u: 160, v: 160, h: 80 },
    { u: -160, v: -160, h: 75 }
  ];

  outerBuildingCoords.forEach((bld, index) => {
    const isCornerTower = Math.abs(bld.u) === 95 && Math.abs(bld.v) === 95;
    const billboardPosition = uToWorld(bld.u, bld.v);
    const inward = new THREE.Vector3(-billboardPosition.x, 0, -billboardPosition.z).normalize();
    const facadeAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
    const facingAngle = facadeAngles.reduce((bestAngle, angle) => {
      const score = Math.sin(angle) * inward.x + Math.cos(angle) * inward.z;
      const bestScore = Math.sin(bestAngle) * inward.x + Math.cos(bestAngle) * inward.z;
      return score > bestScore ? angle : bestAngle;
    }, facadeAngles[0]);
    const billboardConfig = isCornerTower
      ? {
          w: 18.0,
          h: 9.0,
          facingAngle,
          storyOffset: index + 4
        }
      : undefined;
    buildSkyscraperTower(bld.u, bld.v, bld.h, billboardConfig);
  });

  const infillBuildingCoords = [
    { u: 95, v: 160, h: 54 },
    { u: -95, v: 160, h: 58 },
    { u: 95, v: -160, h: 52 },
    { u: -95, v: -160, h: 56 },
    { u: 160, v: 95, h: 60 },
    { u: -160, v: 95, h: 54 },
    { u: 160, v: -95, h: 58 },
    { u: -160, v: -95, h: 52 }
  ];
  infillBuildingCoords.forEach(({ u, v, h }) => buildSkyscraperTower(u, v, h));

  const skywalkConnections = [
    { from: { u: 160, v: 35, h: 65 }, to: { u: 160, v: 95, h: 60 } },
    { from: { u: 35, v: 160, h: 62 }, to: { u: 95, v: 160, h: 54 } },
    { from: { u: -160, v: 35, h: 70 }, to: { u: -160, v: 95, h: 54 } },
    { from: { u: -160, v: -160, h: 75 }, to: { u: -160, v: -95, h: 52 } }
  ];
  skywalkConnections.forEach(({ from, to }, linkIndex) => {
    const fromWorld = uToWorld(from.u, from.v);
    const toWorld = uToWorld(to.u, to.v);
    const directionX = toWorld.x - fromWorld.x;
    const directionZ = toWorld.z - fromWorld.z;
    const horizontalLength = Math.hypot(directionX, directionZ);
    const dirX = directionX / horizontalLength;
    const dirZ = directionZ / horizontalLength;
    const alongU = from.u !== to.u;
    const fromFootprint = getTowerFootprint(from.u, from.v);
    const toFootprint = getTowerFootprint(to.u, to.v);
    const fromOffset = (alongU ? fromFootprint.baseW : fromFootprint.baseD) / 2 - 3;
    const toOffset = (alongU ? toFootprint.baseW : toFootprint.baseD) / 2 - 3;
    const fromY = fromFootprint.baseH + from.h * 0.65 * 0.58;
    const toY = toFootprint.baseH + to.h * 0.65 * 0.58;
    const start = new THREE.Vector3(
      fromWorld.x + dirX * fromOffset,
      fromY,
      fromWorld.z + dirZ * fromOffset
    );
    const end = new THREE.Vector3(
      toWorld.x - dirX * toOffset,
      toY,
      toWorld.z - dirZ * toOffset
    );
    const spanLength = start.distanceTo(end);
    const transform = new THREE.Object3D();
    transform.position.copy(start).add(end).multiplyScalar(0.5);
    transform.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      end.clone().sub(start).normalize()
    );
    transform.updateMatrix();
    const addSkywalkBox = (
      width: number,
      height: number,
      localX: number,
      localY: number,
      target: THREE.BufferGeometry[]
    ) => {
      const geometry = new THREE.BoxGeometry(width, height, spanLength);
      geometry.translate(localX, localY, 0);
      geometry.applyMatrix4(transform.matrix);
      target.push(geometry);
    };
    addSkywalkBox(4.8, 0.5, 0, -0.25, bldgConcreteGeometries);
    for (const side of [-1, 1]) {
      addSkywalkBox(0.12, 1.15, side * 2.3, 0.58, bldgBalconyGlassGeometries);
      addSkywalkBox(0.16, 0.14, side * 2.3, 1.22, stainlessGeometries);
      addSkywalkBox(
        0.14,
        0.14,
        side * 2.3,
        -0.52,
        bldgNeonGeometries[(linkIndex + (side > 0 ? 1 : 0)) % bldgNeonGeometries.length]
      );
    }
  });

  const treeSites: Array<{ x: number; z: number }> = [];
  blockRanges.forEach(u => {
    blockRanges.forEach(v => {
      if (Math.abs(u) < 65 && Math.abs(v) < 65) return;
      const uBounds = getBlockBounds(u);
      const vBounds = getBlockBounds(v);
      const centerU = (uBounds.min + uBounds.max) / 2;
      const centerV = (vBounds.min + vBounds.max) / 2;
      const treeOffsetU = (uBounds.max - uBounds.min) / 2 - 5;
      const treeOffsetV = (vBounds.max - vBounds.min) / 2 - 5;
      for (const signU of [-1, 1]) {
        for (const signV of [-1, 1]) {
          treeSites.push(uToWorld(
            centerU + signU * treeOffsetU,
            centerV + signV * treeOffsetV
          ));
        }
      }
    });
  });

  const planterInstances = new THREE.InstancedMesh(
    new THREE.BoxGeometry(3.6, 0.48, 3.6),
    stainlessSteelMaterial,
    treeSites.length
  );
  const soilInstances = new THREE.InstancedMesh(
    new THREE.BoxGeometry(3.2, 0.10, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x171b18, roughness: 1 }),
    treeSites.length
  );
  const palmTrunkHeight = 7.6;
  const trunkInstances = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.19, 0.40, palmTrunkHeight, 12, 20),
    new THREE.MeshStandardMaterial({ color: 0x806044, roughness: 0.94 }),
    treeSites.length
  );
  const palmRingInstances = new THREE.InstancedMesh(
    new THREE.TorusGeometry(1, 0.07, 4, 12),
    new THREE.MeshStandardMaterial({ color: 0x59422f, roughness: 0.96 }),
    treeSites.length * 14
  );
  const palmFrondCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1.1, 0.34, 0),
    new THREE.Vector3(2.25, 0.30, 0),
    new THREE.Vector3(3.35, -0.28, 0),
    new THREE.Vector3(4.1, -1.16, 0)
  ]);
  const frondVertices: number[] = [];
  for (const side of [-1, 1]) {
    for (let segment = 1; segment <= 18; segment += 1) {
      const t = segment / 20;
      const spine = palmFrondCurve.getPoint(t);
      const span = 0.28 + 1.15 * (1 - t);
      const tip = new THREE.Vector3(
        spine.x - 0.28 - 0.38 * (1 - t),
        spine.y - 0.12 - 0.24 * (1 - t),
        side * span
      );
      const bladeWidth = 0.035 + 0.045 * (1 - t);
      frondVertices.push(
        spine.x, spine.y, spine.z,
        tip.x - bladeWidth, tip.y + 0.025, tip.z,
        tip.x + bladeWidth, tip.y - 0.025, tip.z
      );
    }
  }
  const palmFrondGeometry = new THREE.BufferGeometry();
  palmFrondGeometry.setAttribute('position', new THREE.Float32BufferAttribute(frondVertices, 3));
  palmFrondGeometry.computeVertexNormals();
  const palmFrondMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x10200a,
    emissiveIntensity: 0.14,
    roughness: 0.88,
    side: THREE.DoubleSide
  });
  const palmFrondCount = treeSites.length * 8;
  const palmFrondInstances = new THREE.InstancedMesh(
    palmFrondGeometry,
    palmFrondMaterial,
    palmFrondCount
  );
  const palmRachisInstances = new THREE.InstancedMesh(
    new THREE.TubeGeometry(palmFrondCurve, 18, 0.045, 5, false),
    new THREE.MeshStandardMaterial({ color: 0x66794a, roughness: 0.9 }),
    palmFrondCount
  );
  const shrubInstances = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 1),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x0a1706,
      emissiveIntensity: 0.12,
      roughness: 0.94
    }),
    treeSites.length * 4
  );
  const grassVertices: number[] = [];
  for (let blade = 0; blade < 8; blade += 1) {
    const angle = (blade / 8) * Math.PI * 2;
    const directionX = Math.cos(angle);
    const directionZ = Math.sin(angle);
    const length = 0.48 + (blade % 3) * 0.12;
    const width = 0.045;
    const base = new THREE.Vector3(0, 0, 0);
    const middle = new THREE.Vector3(directionX * 0.22, length * 0.52, directionZ * 0.22);
    const tip = new THREE.Vector3(directionX * length * 0.55, length, directionZ * length * 0.55);
    const perpendicularX = -directionZ * width;
    const perpendicularZ = directionX * width;
    grassVertices.push(
      base.x, base.y, base.z,
      middle.x + perpendicularX, middle.y, middle.z + perpendicularZ,
      middle.x - perpendicularX, middle.y, middle.z - perpendicularZ,
      middle.x + perpendicularX, middle.y, middle.z + perpendicularZ,
      tip.x, tip.y, tip.z,
      middle.x - perpendicularX, middle.y, middle.z - perpendicularZ
    );
  }
  const grassGeometry = new THREE.BufferGeometry();
  grassGeometry.setAttribute('position', new THREE.Float32BufferAttribute(grassVertices, 3));
  grassGeometry.computeVertexNormals();
  const grassInstances = new THREE.InstancedMesh(
    grassGeometry,
    new THREE.MeshStandardMaterial({
      color: 0x6b9852,
      emissive: 0x101b08,
      emissiveIntensity: 0.12,
      roughness: 0.92,
      side: THREE.DoubleSide
    }),
    treeSites.length * 3
  );
  const flowerCountPerSite = 5;
  const flowerCount = treeSites.length * flowerCountPerSite;
  const flowerStemInstances = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.018, 0.03, 0.38, 5),
    new THREE.MeshStandardMaterial({ color: 0x527342, roughness: 0.96 }),
    flowerCount
  );
  const flowerPetalInstances = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 8, 6),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x160b05,
      emissiveIntensity: 0.1,
      roughness: 0.68
    }),
    flowerCount * 5
  );
  const flowerCenterInstances = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xe9bd58, roughness: 0.72 }),
    flowerCount
  );
  const flowerColors = [0xf08b9e, 0xffc15e, 0xf3e7cf, 0xb4a1dd].map(color => new THREE.Color(color));
  const palmLeafColors = [0x568b50, 0x6c9b57, 0x477b49].map(color => new THREE.Color(color));
  const shrubColors = [0x3e7543, 0x56864b, 0x6b9650].map(color => new THREE.Color(color));
  const palmCrownY = 0.59 + palmTrunkHeight - 0.08;
  const treeTransform = new THREE.Object3D();

  treeSites.forEach((site, index) => {
    treeTransform.position.set(site.x, 0.24, site.z);
    treeTransform.rotation.y = Math.PI / 4;
    treeTransform.updateMatrix();
    planterInstances.setMatrixAt(index, treeTransform.matrix);

    treeTransform.position.y = 0.54;
    treeTransform.scale.set(0.9, 1, 0.9);
    treeTransform.updateMatrix();
    soilInstances.setMatrixAt(index, treeTransform.matrix);

    treeTransform.position.set(site.x, 0.59 + palmTrunkHeight / 2, site.z);
    treeTransform.scale.set(1, 1, 1);
    treeTransform.updateMatrix();
    trunkInstances.setMatrixAt(index, treeTransform.matrix);

    for (let ring = 0; ring < 14; ring += 1) {
      const height = 0.25 + (ring / 13) * (palmTrunkHeight - 0.45);
      const taper = 0.40 + (0.19 - 0.40) * (height / palmTrunkHeight);
      treeTransform.position.set(site.x, 0.59 + height, site.z);
      treeTransform.rotation.set(Math.PI / 2, 0, 0);
      treeTransform.scale.set(taper, taper, taper);
      treeTransform.updateMatrix();
      palmRingInstances.setMatrixAt(index * 14 + ring, treeTransform.matrix);
    }

    for (let frond = 0; frond < 8; frond += 1) {
      const instanceIndex = index * 8 + frond;
      const rotation = (frond / 8) * Math.PI * 2 + (index % 7) * 0.13;
      const frondScale = 0.9 + ((index * 5 + frond * 3) % 7) * 0.025;
      treeTransform.position.set(site.x, palmCrownY, site.z);
      treeTransform.rotation.set(0, rotation, 0);
      treeTransform.scale.set(frondScale, frondScale, frondScale);
      treeTransform.updateMatrix();
      palmFrondInstances.setMatrixAt(instanceIndex, treeTransform.matrix);
      palmRachisInstances.setMatrixAt(instanceIndex, treeTransform.matrix);
      palmFrondInstances.setColorAt(instanceIndex, palmLeafColors[(index + frond) % palmLeafColors.length]);
    }

    for (let plant = 0; plant < 4; plant += 1) {
      const angle = (plant / 4) * Math.PI * 2 + (index % 5) * 0.2;
      const plantIndex = index * 4 + plant;
      treeTransform.position.set(
        site.x + Math.cos(angle) * 1.0,
        0.83,
        site.z + Math.sin(angle) * 1.0
      );
      treeTransform.rotation.set(0, angle, 0);
      treeTransform.scale.set(0.48, 0.32 + (plant % 2) * 0.06, 0.43);
      treeTransform.updateMatrix();
      shrubInstances.setMatrixAt(plantIndex, treeTransform.matrix);
      shrubInstances.setColorAt(plantIndex, shrubColors[(index + plant) % shrubColors.length]);
    }

    for (let tuft = 0; tuft < 3; tuft += 1) {
      const angle = (tuft / 3) * Math.PI * 2 + (index % 4) * 0.17;
      const tuftIndex = index * 3 + tuft;
      treeTransform.position.set(
        site.x + Math.cos(angle) * 0.72,
        0.59,
        site.z + Math.sin(angle) * 0.72
      );
      treeTransform.rotation.set(0, angle, 0);
      treeTransform.scale.set(0.82, 0.86 + (tuft % 2) * 0.12, 0.82);
      treeTransform.updateMatrix();
      grassInstances.setMatrixAt(tuftIndex, treeTransform.matrix);
    }

    for (let flower = 0; flower < flowerCountPerSite; flower += 1) {
      const flowerIndex = index * flowerCountPerSite + flower;
      const angle = (flower / flowerCountPerSite) * Math.PI * 2 + (index % 3) * 0.22;
      const flowerX = site.x + Math.cos(angle) * 1.38;
      const flowerZ = site.z + Math.sin(angle) * 1.38;
      treeTransform.position.set(flowerX, 0.78, flowerZ);
      treeTransform.rotation.set(0, 0, (index + flower) % 2 === 0 ? 0.08 : -0.08);
      treeTransform.scale.set(1, 1, 1);
      treeTransform.updateMatrix();
      flowerStemInstances.setMatrixAt(flowerIndex, treeTransform.matrix);

      for (let petal = 0; petal < 5; petal += 1) {
        const petalIndex = flowerIndex * 5 + petal;
        const petalAngle = (petal / 5) * Math.PI * 2;
        treeTransform.position.set(
          flowerX + Math.cos(petalAngle) * 0.095,
          0.99,
          flowerZ + Math.sin(petalAngle) * 0.095
        );
        treeTransform.rotation.set(0, petalAngle, 0);
        treeTransform.scale.set(0.105, 0.045, 0.075);
        treeTransform.updateMatrix();
        flowerPetalInstances.setMatrixAt(petalIndex, treeTransform.matrix);
        flowerPetalInstances.setColorAt(
          petalIndex,
          flowerColors[(index + flower) % flowerColors.length]
        );
      }

      treeTransform.position.set(flowerX, 1.0, flowerZ);
      treeTransform.rotation.set(0, 0, 0);
      treeTransform.scale.set(0.055, 0.045, 0.055);
      treeTransform.updateMatrix();
      flowerCenterInstances.setMatrixAt(flowerIndex, treeTransform.matrix);
    }
  });

  planterInstances.castShadow = true;
  planterInstances.receiveShadow = true;
  soilInstances.receiveShadow = true;
  trunkInstances.castShadow = true;
  palmRingInstances.castShadow = true;
  palmFrondInstances.receiveShadow = true;
  palmRachisInstances.receiveShadow = true;
  palmFrondInstances.instanceMatrix.needsUpdate = true;
  palmRachisInstances.instanceMatrix.needsUpdate = true;
  if (palmFrondInstances.instanceColor) palmFrondInstances.instanceColor.needsUpdate = true;
  shrubInstances.instanceMatrix.needsUpdate = true;
  if (shrubInstances.instanceColor) shrubInstances.instanceColor.needsUpdate = true;
  grassInstances.instanceMatrix.needsUpdate = true;
  flowerStemInstances.instanceMatrix.needsUpdate = true;
  flowerPetalInstances.instanceMatrix.needsUpdate = true;
  if (flowerPetalInstances.instanceColor) flowerPetalInstances.instanceColor.needsUpdate = true;
  flowerCenterInstances.instanceMatrix.needsUpdate = true;
  cityGroup.add(
    planterInstances,
    soilInstances,
    trunkInstances,
    palmRingInstances,
    palmFrondInstances,
    palmRachisInstances,
    shrubInstances,
    grassInstances,
    flowerStemInstances,
    flowerPetalInstances,
    flowerCenterInstances
  );

  const createSignalMaterial = (emission: number) => new THREE.MeshStandardMaterial({
    color: 0x17202a,
    emissive: emission,
    emissiveIntensity: 0.03,
    roughness: 0.24
  });
  const trafficSignals: TrafficSignalMaterials = {
    uAxis: [
      createSignalMaterial(0xff243c),
      createSignalMaterial(0xffad27),
      createSignalMaterial(0x35ff9a)
    ],
    vAxis: [
      createSignalMaterial(0xff243c),
      createSignalMaterial(0xffad27),
      createSignalMaterial(0x35ff9a)
    ]
  };
  const intersectionCount = intersectionOffsets.length * intersectionOffsets.length - 1;
  const approachCount = intersectionCount * 4;
  const axisApproachCount = intersectionCount * 2;
  const signalPoleInstances = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.10, 0.16, 5.8, 10),
    poleMaterial,
    approachCount
  );
  const signalHeadInstances = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.72, 1.85, 0.46),
    bldgDarkFacadeMaterial,
    approachCount
  );
  const signalLensGeometry = new THREE.SphereGeometry(0.17, 12, 8);
  const signalLensInstances: Record<
    'uAxis' | 'vAxis',
    [THREE.InstancedMesh, THREE.InstancedMesh, THREE.InstancedMesh]
  > = {
    uAxis: [
      new THREE.InstancedMesh(signalLensGeometry, trafficSignals.uAxis[0], axisApproachCount),
      new THREE.InstancedMesh(signalLensGeometry, trafficSignals.uAxis[1], axisApproachCount),
      new THREE.InstancedMesh(signalLensGeometry, trafficSignals.uAxis[2], axisApproachCount)
    ],
    vAxis: [
      new THREE.InstancedMesh(signalLensGeometry, trafficSignals.vAxis[0], axisApproachCount),
      new THREE.InstancedMesh(signalLensGeometry, trafficSignals.vAxis[1], axisApproachCount),
      new THREE.InstancedMesh(signalLensGeometry, trafficSignals.vAxis[2], axisApproachCount)
    ]
  };
  const axisApproachIndices = { uAxis: 0, vAxis: 0 };
  const signalTransform = new THREE.Object3D();
  const lensForward = new THREE.Vector3();
  const lensMatrix = new THREE.Matrix4();
  let signalIndex = 0;

  const addTrafficSignal = (
    intersectionU: number,
    intersectionV: number,
    axis: 'uAxis' | 'vAxis',
    offsetU: number,
    offsetV: number,
    yaw: number
  ) => {
    const position = uToWorld(intersectionU + offsetU, intersectionV + offsetV);
    signalTransform.position.set(position.x, 2.9, position.z);
    signalTransform.rotation.set(0, 0, 0);
    signalTransform.scale.set(1, 1, 1);
    signalTransform.updateMatrix();
    signalPoleInstances.setMatrixAt(signalIndex, signalTransform.matrix);

    signalTransform.position.y = 6.15;
    signalTransform.rotation.y = yaw;
    signalTransform.updateMatrix();
    signalHeadInstances.setMatrixAt(signalIndex, signalTransform.matrix);

    const axisIndex = axisApproachIndices[axis]++;
    lensForward.set(0, 0, 0.25).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    [0.52, 0, -0.52].forEach((verticalOffset, lampIndex) => {
      signalTransform.position.set(
        position.x + lensForward.x,
        6.15 + verticalOffset,
        position.z + lensForward.z
      );
      signalTransform.rotation.y = yaw;
      signalTransform.scale.set(1, 1, 1);
      signalTransform.updateMatrix();
      lensMatrix.copy(signalTransform.matrix);
      signalLensInstances[axis][lampIndex].setMatrixAt(axisIndex, lensMatrix);
    });

    signalIndex += 1;
  };

  for (const u of intersectionOffsets) {
    for (const v of intersectionOffsets) {
      if (u === 0 && v === 0) continue;
      const offsetU = u === 0 ? AVENUE_LIGHT_POLE_OFFSET : GRID_SIGNAL_POLE_OFFSET;
      const offsetV = v === 0 ? AVENUE_LIGHT_POLE_OFFSET : GRID_SIGNAL_POLE_OFFSET;
      addTrafficSignal(u, v, 'uAxis', offsetU, offsetV, -Math.PI / 4);
      addTrafficSignal(u, v, 'uAxis', -offsetU, -offsetV, (3 * Math.PI) / 4);
      addTrafficSignal(u, v, 'vAxis', -offsetU, offsetV, -(3 * Math.PI) / 4);
      addTrafficSignal(u, v, 'vAxis', offsetU, -offsetV, Math.PI / 4);
    }
  }

  [
    signalPoleInstances,
    signalHeadInstances,
    ...signalLensInstances.uAxis,
    ...signalLensInstances.vAxis
  ].forEach(instances => {
    instances.instanceMatrix.needsUpdate = true;
    instances.castShadow = true;
    instances.receiveShadow = true;
    cityGroup.add(instances);
  });

  const yieldCanvas = document.createElement('canvas');
  yieldCanvas.width = 512;
  yieldCanvas.height = 512;
  const yieldContext = yieldCanvas.getContext('2d');
  if (!yieldContext) throw new Error('Could not create a roundabout yield sign.');
  yieldContext.beginPath();
  yieldContext.moveTo(256, 28);
  yieldContext.lineTo(484, 452);
  yieldContext.lineTo(28, 452);
  yieldContext.closePath();
  yieldContext.fillStyle = '#f5f7fa';
  yieldContext.fill();
  yieldContext.lineWidth = 30;
  yieldContext.strokeStyle = '#db2438';
  yieldContext.stroke();
  yieldContext.fillStyle = '#161a20';
  yieldContext.font = '900 62px Arial';
  yieldContext.textAlign = 'center';
  yieldContext.textBaseline = 'middle';
  yieldContext.fillText('YIELD', 256, 360);
  const yieldTexture = new THREE.CanvasTexture(yieldCanvas);
  yieldTexture.colorSpace = THREE.SRGBColorSpace;

  for (const angle of avenueAngles) {
    const rightX = -Math.cos(angle);
    const rightZ = Math.sin(angle);
    const yieldSignDistance = ROUNDABOUT_OUTER_R + 2.5;
    const sign = new THREE.Group();
    sign.position.set(
      Math.sin(angle) * yieldSignDistance - rightX * AVENUE_SIDEWALK_OFFSET,
      0,
      Math.cos(angle) * yieldSignDistance - rightZ * AVENUE_SIDEWALK_OFFSET
    );
    sign.rotation.y = angle;
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.10, 2.25, 10),
      poleMaterial
    );
    post.position.y = 1.13;
    post.castShadow = true;
    sign.add(post);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 1.7),
      new THREE.MeshBasicMaterial({ map: yieldTexture, transparent: true, side: THREE.DoubleSide })
    );
    face.position.set(0, 2.2, 0.08);
    sign.add(face);
    cityGroup.add(sign);
  }

  const streetNameSign = (name: string, x: number, z: number, yaw: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not create a street-name sign.');
    context.fillStyle = '#123a4a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#d9f9ff';
    context.lineWidth = 8;
    context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    context.fillStyle = '#ffffff';
    context.font = 'bold 42px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name, canvas.width / 2, canvas.height / 2, canvas.width - 28);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 0.9),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
    );
    sign.position.set(x, 3.8, z);
    sign.rotation.y = yaw;
    sign.castShadow = true;
    cityGroup.add(sign);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.3, 8), poleMaterial);
    post.position.set(x, 1.65, z);
    post.castShadow = true;
    cityGroup.add(post);
  };

  const uStreetNames = ['Foundry Street', 'Chrome Street', 'Signal Street', 'Union Street', 'Beacon Street', 'Mercury Street'];
  const vStreetNames = ['Civic Street', 'Lantern Street', 'Copper Street', 'Orbit Street', 'Harbor Street', 'Neon Street'];
  gridStreets.forEach((offset, index) => {
    const alongU = uToWorld(offset + GRID_SIDEWALK_OFFSET, 92);
    streetNameSign(uStreetNames[index], alongU.x, alongU.z, Math.PI / 4);
    const alongV = uToWorld(92, offset + GRID_SIDEWALK_OFFSET);
    streetNameSign(vStreetNames[index], alongV.x, alongV.z, -Math.PI / 4);
  });
  const avenueNameA = uToWorld(AVENUE_SIDEWALK_OFFSET, 72);
  streetNameSign('NEON BOULEVARD', avenueNameA.x, avenueNameA.z, Math.PI / 4);
  const avenueNameB = uToWorld(72, AVENUE_SIDEWALK_OFFSET);
  streetNameSign('CIVIC WAY', avenueNameB.x, avenueNameB.z, -Math.PI / 4);

  // -----------------------------------------------------------------------
  // 6. STREET LIGHTS ON SIDEWALKS WITH LUMINAIRES OVER THE ROAD
  // -----------------------------------------------------------------------
  const avenueSidewalkLimit = gridStreets[gridStreets.length - 1] - GRID_STREET_WIDTH / 2;
  avenueAngles.forEach(angle => {
    for (let p = 0; ROUNDABOUT_OUTER_R + 12 + p * 32 < avenueSidewalkLimit; p++) {
      const pDist = ROUNDABOUT_OUTER_R + 12 + p * 32;
      [-AVENUE_LIGHT_POLE_OFFSET, AVENUE_LIGHT_POLE_OFFSET].forEach(sideOffset => {
        const perpX = Math.cos(angle) * sideOffset;
        const perpZ = -Math.sin(angle) * sideOffset;
        const lx = Math.sin(angle) * pDist + perpX;
        const lz = Math.cos(angle) * pDist + perpZ;

        // Slender Tapered Vertical Mast
        const mast = new THREE.CylinderGeometry(0.12, 0.20, 7.4, 12);
        mast.translate(lx, 3.7, lz);
        poleGeometries.push(mast);

        // Flanged Circular Base Plate
        const base = new THREE.CylinderGeometry(0.28, 0.32, 0.45, 12);
        base.translate(lx, 0.25, lz);
        poleGeometries.push(base);

        const armDirection = new THREE.Vector3(
          -Math.sign(sideOffset) * Math.cos(angle),
          0,
          Math.sign(sideOffset) * Math.sin(angle)
        );
        const armLength = 10.2;
        const headReach = 10.0;
        const arm = new THREE.CylinderGeometry(0.08, 0.10, armLength, 8);
        const armTransform = new THREE.Object3D();
        armTransform.position.set(
          lx + armDirection.x * armLength / 2,
          7.45,
          lz + armDirection.z * armLength / 2
        );
        armTransform.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          armDirection
        );
        armTransform.updateMatrix();
        arm.applyMatrix4(armTransform.matrix);
        poleGeometries.push(arm);

        const hood = new THREE.BoxGeometry(0.48, 0.20, 0.95);
        hood.rotateY(angle);
        const headX = lx + armDirection.x * headReach;
        const headZ = lz + armDirection.z * headReach;
        hood.translate(headX, 7.6, headZ);
        poleGeometries.push(hood);

        const lens = new THREE.PlaneGeometry(0.40, 0.85);
        lens.rotateX(Math.PI / 2);
        lens.rotateY(angle);
        lens.translate(headX, 7.49, headZ);
        lightGeometries.push(lens);

        // Warm Downward Illuminating Light Pool
        if (p % 4 === 0) {
          const streetLight = new THREE.SpotLight(0xffe2b5, 75, 38, Math.PI / 4, 0.45, 1.8);
          streetLight.position.set(headX, 7.4, headZ);
          streetLight.target.position.set(
            headX + armDirection.x * 2,
            0.08,
            headZ + armDirection.z * 2
          );
          cityGroup.add(streetLight, streetLight.target);

          if (p % 8 === 0) {
            const beamDirection = streetLight.position.clone()
              .sub(streetLight.target.position)
              .normalize();
            const beamLength = streetLight.position.distanceTo(streetLight.target.position);
            const beam = new THREE.Mesh(
              new THREE.CylinderGeometry(0.08, 2.2, beamLength, 8, 1, true),
              streetlightBeamMaterial
            );
            beam.position.copy(streetLight.position)
              .add(streetLight.target.position)
              .multiplyScalar(0.5);
            beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), beamDirection);
            beam.renderOrder = 1;
            cityGroup.add(beam);
          }
        }
      });

      const addZebraCrossing = (
        centerU: number,
        centerV: number,
        axis: 'u' | 'v',
        side: -1 | 1
      ) => {
        const isUAxis = axis === 'u';
        const centerline = isUAxis ? centerV : centerU;
        const roadWidth = centerline === 0 ? AVENUE_WIDTH : GRID_STREET_WIDTH;
        const roadHeight = isUAxis
          ? (centerV === 0 ? AVENUE_ROAD_Y : GRID_V_ROAD_Y)
          : (centerU === 0 ? AVENUE_ROAD_Y : GRID_U_ROAD_Y);
        const markingHeight = roadHeight + 0.025;
        const stripeCount = roadWidth > GRID_STREET_WIDTH ? 14 : 8;
        const roadAngle = isUAxis ? (3 * Math.PI) / 4 : Math.PI / 4;
        for (let stripe = 0; stripe < stripeCount; stripe += 1) {
          const offset = (stripe / (stripeCount - 1) - 0.5) * (roadWidth - 2);
          const point = isUAxis
            ? uToWorld(centerU + side * 7.5, centerV + offset)
            : uToWorld(centerU + offset, centerV + side * 7.5);
          const bar = new THREE.PlaneGeometry(0.55, 2.2);
          bar.rotateX(-Math.PI / 2);
          bar.rotateY(roadAngle);
          bar.translate(point.x, markingHeight, point.z);
          whitePaintGeometries.push(bar);
        }

        const stopPoint = isUAxis
          ? uToWorld(centerU + side * 4.6, centerV)
          : uToWorld(centerU, centerV + side * 4.6);
        const stopBar = new THREE.PlaneGeometry(roadWidth - 1, 0.3);
        stopBar.rotateX(-Math.PI / 2);
        stopBar.rotateY(roadAngle);
        stopBar.translate(stopPoint.x, markingHeight, stopPoint.z);
        whitePaintGeometries.push(stopBar);
      };

      for (const u of intersectionOffsets) {
        for (const v of intersectionOffsets) {
          if (u === 0 && v === 0) continue;
          addZebraCrossing(u, v, 'u', -1);
          addZebraCrossing(u, v, 'u', 1);
          addZebraCrossing(u, v, 'v', -1);
          addZebraCrossing(u, v, 'v', 1);
        }
      }
    }
  });

  // Perimeter poles stay on the sidewalk and extend inward over the roundabout.
  for (let i = 0; i < 8; i++) {
    const theta = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const radialX = Math.cos(theta);
    const radialZ = Math.sin(theta);
    const avenueAngle = avenueAngles.reduce((nearest, candidate) => {
      const candidateAlong = Math.abs(radialX * Math.sin(candidate) + radialZ * Math.cos(candidate));
      const nearestAlong = Math.abs(radialX * Math.sin(nearest) + radialZ * Math.cos(nearest));
      return candidateAlong > nearestAlong ? candidate : nearest;
    }, avenueAngles[0]);
    const avenueX = Math.sin(avenueAngle);
    const avenueZ = Math.cos(avenueAngle);
    const sidewalkX = Math.cos(avenueAngle);
    const sidewalkZ = -Math.sin(avenueAngle);
    const sideSign = Math.sign(radialX * sidewalkX + radialZ * sidewalkZ);
    const sideOffset = sideSign * AVENUE_LIGHT_POLE_OFFSET;
    const alongDistance = ROUNDABOUT_OUTER_R - 2;
    const lx = avenueX * alongDistance + sidewalkX * sideOffset;
    const lz = avenueZ * alongDistance + sidewalkZ * sideOffset;

    const mast = new THREE.CylinderGeometry(0.12, 0.20, 7.2, 12);
    mast.translate(lx, 3.6, lz);
    poleGeometries.push(mast);

    const base = new THREE.CylinderGeometry(0.28, 0.32, 0.45, 12);
    base.translate(lx, 0.25, lz);
    poleGeometries.push(base);

    const armDirection = new THREE.Vector3(
      -sideSign * sidewalkX,
      0,
      -sideSign * sidewalkZ
    );
    const armLength = 10.2;
    const headReach = 10.0;
    const arm = new THREE.CylinderGeometry(0.08, 0.10, armLength, 8);
    const armTransform = new THREE.Object3D();
    armTransform.position.set(
      lx + armDirection.x * armLength / 2,
      7.3,
      lz + armDirection.z * armLength / 2
    );
    armTransform.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      armDirection
    );
    armTransform.updateMatrix();
    arm.applyMatrix4(armTransform.matrix);
    poleGeometries.push(arm);

    const headX = lx + armDirection.x * headReach;
    const headZ = lz + armDirection.z * headReach;

    const hood = new THREE.BoxGeometry(0.46, 0.18, 0.90);
    hood.rotateY(avenueAngle);
    hood.translate(headX, 7.3, headZ);
    poleGeometries.push(hood);

    const lens = new THREE.PlaneGeometry(0.38, 0.78);
    lens.rotateX(Math.PI / 2);
    lens.rotateY(avenueAngle);
    lens.translate(headX, 7.2, headZ);
    lightGeometries.push(lens);

    const rLight = new THREE.SpotLight(0xffe2b5, 75, 36, Math.PI / 4, 0.45, 1.8);
    rLight.position.set(headX, 7.2, headZ);
    rLight.target.position.set(
      headX + armDirection.x * 4,
      0.08,
      headZ + armDirection.z * 4
    );
    cityGroup.add(rLight, rLight.target);
  }

  // -----------------------------------------------------------------------
  // 7. BATCH & MERGE ALL GEOMETRIES FOR MAXIMUM 60+ FPS PERFORMANCE
  // -----------------------------------------------------------------------
  console.log('[NewCity] Merging geometry buffers for silky-smooth 60+ FPS performance...');

  const addMergedMesh = (
    geometries: THREE.BufferGeometry[],
    mat: THREE.Material,
    castShadow: boolean,
    receiveShadow: boolean
  ) => {
    if (geometries.length > 0) {
      const merged = mergeGeometries(geometries, false);
      if (merged) {
        const mesh = new THREE.Mesh(merged, mat);
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
        cityGroup.add(mesh);
      }
    }
  };

  addMergedMesh(asphaltGeometries, asphaltMaterial, false, true);
  addMergedMesh(concreteGeometries, concreteMaterial, false, true);
  addMergedMesh(curbGeometries, curbMaterial, true, true);
  addMergedMesh(tactileGeometries, tactilePaverMaterial, false, true);
  addMergedMesh(manholeGeometries, manholeMaterial, false, true);
  addMergedMesh(parcelGeometries, parcelMaterial, false, true);
  addMergedMesh(whitePaintGeometries, whitePaintMaterial, false, true);
  addMergedMesh(yellowPaintGeometries, yellowPaintMaterial, false, true);
  addMergedMesh(poleGeometries, poleMaterial, true, true);
  addMergedMesh(stainlessGeometries, stainlessSteelMaterial, true, true);
  addMergedMesh(lightGeometries, emissiveLightMaterial, false, false);
  addMergedMesh(bldgGlassGeometries, bldgGlassMaterial, true, true);
  addMergedMesh(bldgDarkGeometries, bldgDarkFacadeMaterial, true, true);
  addMergedMesh(bldgConcreteGeometries, bldgConcreteMaterial, true, true);
  addMergedMesh(bldgBalconyPlantGeometries, bldgBalconyPlantMaterial, false, false);
  addMergedMesh(bldgStoreFloorGeometries, bldgStoreFloorMaterial, true, true);
  addMergedMesh(bldgStoreFixtureGeometries, bldgStoreFixtureMaterial, true, true);
  addMergedMesh(bldgStoreDisplayGeometries, bldgStoreDisplayMaterial, true, true);
  addMergedMesh(bldgStoreWarmLightGeometries, bldgStoreWarmLightMaterial, false, false);
  bldgNeonGeometries.forEach((geometries, index) => {
    if (geometries.length > 0) {
      addMergedMesh(geometries, bldgNeonMaterials[index], false, false);
    }
  });
  addMergedMesh(bldgBalconyGlassGeometries, bldgBalconyGlassMaterial, false, false);
  addMergedMesh(bldgStorefrontGlassGeometries, bldgStorefrontGlassMaterial, false, false);

  const bridgeAngle = Math.PI / 4;
  const bridge: SkyBridgeHandle = {
    axisX: Math.sin(bridgeAngle),
    axisZ: Math.cos(bridgeAngle),
    sideX: Math.cos(bridgeAngle),
    sideZ: -Math.sin(bridgeAngle),
    startDistance: AVENUE_SPAN,
    endDistance: 808,
    halfWidth: 18,
    heightAt(distance: number) {
      const rampLength = 68;
      const topHeight = 16;
      const rise = THREE.MathUtils.smoothstep(distance, this.startDistance, this.startDistance + rampLength);
      const fall = 1 - THREE.MathUtils.smoothstep(distance, this.endDistance - rampLength, this.endDistance);
      return 0.08 + topHeight * Math.min(rise, fall);
    }
  };
  const bridgeGeometry = new THREE.BufferGeometry();
  const bridgeSteps = 52;
  const bridgePositions = new Float32Array((bridgeSteps + 1) * 2 * 3);
  const bridgeUvs = new Float32Array((bridgeSteps + 1) * 2 * 2);
  const bridgeIndices: number[] = [];
  for (let step = 0; step <= bridgeSteps; step += 1) {
    const distance = THREE.MathUtils.lerp(bridge.startDistance, bridge.endDistance, step / bridgeSteps);
    const centerX = bridge.axisX * distance;
    const centerZ = bridge.axisZ * distance;
    const height = bridge.heightAt(distance);
    const offset = step * 6;
    bridgePositions.set([
      centerX + bridge.sideX * bridge.halfWidth, height, centerZ + bridge.sideZ * bridge.halfWidth,
      centerX - bridge.sideX * bridge.halfWidth, height, centerZ - bridge.sideZ * bridge.halfWidth
    ], offset);
    const uvOffset = step * 4;
    bridgeUvs.set([0, distance / 6, 1, distance / 6], uvOffset);
    if (step < bridgeSteps) {
      const current = step * 2;
      const next = current + 2;
      bridgeIndices.push(current, current + 1, next, current + 1, next + 1, next);
    }
  }
  bridgeGeometry.setAttribute('position', new THREE.BufferAttribute(bridgePositions, 3));
  bridgeGeometry.setAttribute('uv', new THREE.BufferAttribute(bridgeUvs, 2));
  bridgeGeometry.setIndex(bridgeIndices);
  bridgeGeometry.computeVertexNormals();
  const bridgeDeck = new THREE.Mesh(bridgeGeometry, asphaltMaterial);
  bridgeDeck.receiveShadow = true;
  scene.add(bridgeDeck);

  const addBridgeMarkings = (
    strips: Array<{ start: number; end: number; offset: number; width: number }>,
    material: THREE.Material
  ) => {
    const positions: number[] = [];
    const indices: number[] = [];
    for (const strip of strips) {
      const segments = Math.max(1, Math.ceil((strip.end - strip.start) / 8));
      const firstVertex = positions.length / 3;
      for (let segment = 0; segment <= segments; segment += 1) {
        const distance = THREE.MathUtils.lerp(strip.start, strip.end, segment / segments);
        const centerX = bridge.axisX * distance;
        const centerZ = bridge.axisZ * distance;
        const lateralOffset = strip.offset + strip.width / 2;
        const oppositeOffset = strip.offset - strip.width / 2;
        const y = bridge.heightAt(distance) + 0.035;
        positions.push(
          centerX + bridge.sideX * lateralOffset, y, centerZ + bridge.sideZ * lateralOffset,
          centerX + bridge.sideX * oppositeOffset, y, centerZ + bridge.sideZ * oppositeOffset
        );
      }
      for (let segment = 0; segment < segments; segment += 1) {
        const first = firstVertex + segment * 2;
        indices.push(first, first + 1, first + 2, first + 2, first + 1, first + 3);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const markings = new THREE.Mesh(geometry, material);
    markings.renderOrder = 1;
    scene.add(markings);
  };

  addBridgeMarkings(
    [-0.15, 0.15].map(offset => ({
      start: bridge.startDistance,
      end: bridge.endDistance,
      offset,
      width: 0.18
    })),
    yellowPaintMaterial
  );

  const bridgeWhiteMarkings: Array<{ start: number; end: number; offset: number; width: number }> = [
    -AVENUE_EDGE_OFFSET,
    AVENUE_EDGE_OFFSET
  ].map(offset => ({
    start: bridge.startDistance,
    end: bridge.endDistance,
    offset,
    width: 0.18
  }));
  let dashCenter = ROUNDABOUT_OUTER_R + 2.0;
  while (dashCenter <= bridge.startDistance) dashCenter += AVENUE_DASH_SPACING;
  for (; dashCenter + 1.6 <= bridge.endDistance; dashCenter += AVENUE_DASH_SPACING) {
    [-5.0, 5.0].forEach(offset => {
      bridgeWhiteMarkings.push({ start: dashCenter - 1.6, end: dashCenter + 1.6, offset, width: 0.18 });
    });
  }
  addBridgeMarkings(bridgeWhiteMarkings, whitePaintMaterial);

  const bridgeCyanTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0x7ef9ff,
    emissive: 0x05b9e8,
    emissiveIntensity: 1.8,
    metalness: 0.68,
    roughness: 0.24
  });
  const bridgeMagentaTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0xff81df,
    emissive: 0xd719a9,
    emissiveIntensity: 1.45,
    metalness: 0.62,
    roughness: 0.28
  });
  const bridgeRailMaterial = stainlessSteelMaterial;
  const bridgeGroup = new THREE.Group();
  const bridgeSegmentLength = (bridge.endDistance - bridge.startDistance) / bridgeSteps;
  const bridgeSteelGeometries: THREE.BufferGeometry[] = [];
  const bridgeCableGeometries: THREE.BufferGeometry[] = [];
  const bridgeCyanGeometries: THREE.BufferGeometry[] = [];
  const bridgeMagentaGeometries: THREE.BufferGeometry[] = [];
  const bridgePoint = (distance: number, lateral: number, height: number) => new THREE.Vector3(
    bridge.axisX * distance + bridge.sideX * lateral,
    height,
    bridge.axisZ * distance + bridge.sideZ * lateral
  );
  const addBridgeBox = (
    width: number,
    height: number,
    depth: number,
    distance: number,
    lateral: number,
    y: number,
    target: THREE.BufferGeometry[]
  ) => {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    geometry.rotateY(bridgeAngle);
    geometry.translate(
      bridge.axisX * distance + bridge.sideX * lateral,
      y,
      bridge.axisZ * distance + bridge.sideZ * lateral
    );
    target.push(geometry);
  };
  const alignBridgeGeometry = (
    geometry: THREE.BufferGeometry,
    start: THREE.Vector3,
    end: THREE.Vector3
  ) => {
    const direction = end.clone().sub(start);
    const transform = new THREE.Object3D();
    transform.position.copy(start).add(end).multiplyScalar(0.5);
    transform.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );
    transform.updateMatrix();
    geometry.applyMatrix4(transform.matrix);
  };
  const addBridgeBeam = (
    start: THREE.Vector3,
    end: THREE.Vector3,
    width: number,
    depth: number,
    target: THREE.BufferGeometry[]
  ) => {
    const length = start.distanceTo(end);
    const geometry = new THREE.BoxGeometry(width, length, depth);
    alignBridgeGeometry(geometry, start, end);
    target.push(geometry);
  };
  const addBridgeCable = (
    start: THREE.Vector3,
    end: THREE.Vector3,
    radius: number,
    target: THREE.BufferGeometry[]
  ) => {
    const geometry = new THREE.CylinderGeometry(radius * 0.82, radius, start.distanceTo(end), 6);
    alignBridgeGeometry(geometry, start, end);
    target.push(geometry);
  };

  for (let step = 0; step < bridgeSteps; step += 1) {
    const distance = bridge.startDistance + (step + 0.5) * bridgeSegmentLength;
    const height = bridge.heightAt(distance);
    for (const side of [-1, 1]) {
      addBridgeBox(
        0.32,
        0.9,
        bridgeSegmentLength + 0.12,
        distance,
        side * (bridge.halfWidth - 0.25),
        height + 0.8,
        bridgeSteelGeometries
      );
      addBridgeBox(
        0.12,
        0.12,
        bridgeSegmentLength + 0.12,
        distance,
        side * (bridge.halfWidth - 0.25),
        height + 1.34,
        side < 0 ? bridgeCyanGeometries : bridgeMagentaGeometries
      );
    }
    if (step > 6 && step < bridgeSteps - 6 && step % 7 === 0) {
      const supportHeight = height - 1;
      addBridgeBox(2.2, supportHeight, 2.2, distance, 0, supportHeight / 2, bridgeSteelGeometries);
    }
  }

  const pylonStations = [535, 675];
  const pylonOffset = bridge.halfWidth + 1.6;
  const pylonHeight = 48;
  pylonStations.forEach((distance, stationIndex) => {
    const deckHeight = bridge.heightAt(distance);
    for (const side of [-1, 1]) {
      addBridgeBox(
        2.8,
        pylonHeight,
        3.2,
        distance,
        side * pylonOffset,
        deckHeight + pylonHeight / 2,
        bridgeSteelGeometries
      );
      addBridgeBox(
        3.6,
        1.4,
        4.2,
        distance,
        side * (bridge.halfWidth - 0.7),
        deckHeight + 0.7,
        bridgeSteelGeometries
      );
      addBridgeBox(
        0.16,
        pylonHeight - 3,
        0.18,
        distance,
        side * (pylonOffset + 1.48),
        deckHeight + pylonHeight / 2,
        side < 0 ? bridgeCyanGeometries : bridgeMagentaGeometries
      );
    }

    addBridgeBox(
      pylonOffset * 2 + 3,
      2.8,
      3.4,
      distance,
      0,
      deckHeight + pylonHeight,
      bridgeSteelGeometries
    );
    addBridgeBox(
      pylonOffset * 2 + 2,
      1.8,
      2.8,
      distance,
      0,
      deckHeight + pylonHeight * 0.48,
      bridgeSteelGeometries
    );
    addBridgeBox(
      pylonOffset * 2 - 2,
      0.16,
      0.18,
      distance,
      0,
      deckHeight + pylonHeight - 0.12,
      stationIndex === 0 ? bridgeCyanGeometries : bridgeMagentaGeometries
    );

    const lowerLeft = bridgePoint(distance, -pylonOffset, deckHeight + 4);
    const lowerRight = bridgePoint(distance, pylonOffset, deckHeight + 4);
    const upperLeft = bridgePoint(distance, -pylonOffset, deckHeight + pylonHeight - 4);
    const upperRight = bridgePoint(distance, pylonOffset, deckHeight + pylonHeight - 4);
    addBridgeBeam(lowerLeft, upperRight, 1.3, 1.8, bridgeSteelGeometries);
    addBridgeBeam(lowerRight, upperLeft, 1.3, 1.8, bridgeSteelGeometries);

    for (const side of [-1, 1]) {
      const top = bridgePoint(distance, side * pylonOffset, deckHeight + pylonHeight - 5);
      [-72, -54, -36, -18, 18, 36, 54, 72].forEach((offset, cableIndex) => {
        const anchorDistance = distance + offset;
        const anchorHeight = bridge.heightAt(anchorDistance) + 1.2;
        const anchorLateral = side * (bridge.halfWidth - 0.8);
        const anchor = bridgePoint(anchorDistance, anchorLateral, anchorHeight);
        addBridgeCable(top, anchor, 0.11, bridgeCableGeometries);

        const neonTop = bridgePoint(
          distance,
          side * (pylonOffset + 0.2),
          deckHeight + pylonHeight - 5
        );
        const neonAnchor = bridgePoint(anchorDistance, anchorLateral + side * 0.16, anchorHeight);
        addBridgeCable(
          neonTop,
          neonAnchor,
          0.045,
          (cableIndex + stationIndex + (side > 0 ? 1 : 0)) % 2 === 0
            ? bridgeCyanGeometries
            : bridgeMagentaGeometries
        );
      });
    }
  });

  for (const side of [-1, 1]) {
    const firstTop = bridgePoint(pylonStations[0], side * pylonOffset, bridge.heightAt(pylonStations[0]) + pylonHeight - 1);
    const secondTop = bridgePoint(pylonStations[1], side * pylonOffset, bridge.heightAt(pylonStations[1]) + pylonHeight - 1);
    addBridgeBeam(firstTop, secondTop, 2.0, 2.4, bridgeSteelGeometries);
    const firstLight = bridgePoint(pylonStations[0], side * (pylonOffset + 0.25), bridge.heightAt(pylonStations[0]) + pylonHeight - 1.2);
    const secondLight = bridgePoint(pylonStations[1], side * (pylonOffset + 0.25), bridge.heightAt(pylonStations[1]) + pylonHeight - 1.2);
    addBridgeBeam(
      firstLight,
      secondLight,
      0.14,
      0.16,
      side < 0 ? bridgeCyanGeometries : bridgeMagentaGeometries
    );
  }

  const addMergedBridgeMesh = (
    geometries: THREE.BufferGeometry[],
    material: THREE.Material,
    castShadow: boolean
  ) => {
    if (geometries.length === 0) return;
    const merged = mergeGeometries(geometries, false);
    if (!merged) return;
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    bridgeGroup.add(mesh);
  };
  addMergedBridgeMesh(bridgeSteelGeometries, bridgeRailMaterial, true);
  addMergedBridgeMesh(bridgeCableGeometries, bridgeRailMaterial, false);
  addMergedBridgeMesh(bridgeCyanGeometries, bridgeCyanTrimMaterial, false);
  addMergedBridgeMesh(bridgeMagentaGeometries, bridgeMagentaTrimMaterial, false);
  scene.add(bridgeGroup);

  const mirrorDistance = 1200;
  const mirroredCity = cityGroup.clone(true);
  mirroredCity.name = 'NewCity_MirroredDistrict';
  mirroredCity.position.set(bridge.axisX * mirrorDistance, 0, bridge.axisZ * mirrorDistance);
  mirroredCity.rotation.y = Math.PI;
  scene.add(mirroredCity);
  collisionObstacles.push(...collisionObstacles.map(obstacle => ({
    x: bridge.axisX * mirrorDistance - obstacle.x,
    z: bridge.axisZ * mirrorDistance - obstacle.z,
    halfWidth: obstacle.halfWidth,
    halfDepth: obstacle.halfDepth,
    rotationY: obstacle.rotationY
  })));

  const parkingLaneOffset = AVENUE_HALF + 2.2;
  const vehicleSpecs: Array<{
    label: string;
    color: number;
    profile: VehicleProfile;
    distance: number;
    side: number;
    angle: number;
  }> = [
    { label: 'Civic Sedan', color: 0x14b8a6, profile: 'sedan', distance: 29, side: -parkingLaneOffset, angle: Math.PI / 4 },
    { label: 'Neon GT Sports Car', color: 0xd946ef, profile: 'sports', distance: 86, side: parkingLaneOffset, angle: (3 * Math.PI) / 4 },
    { label: 'Foundry Semi', color: 0x64748b, profile: 'semi', distance: 150, side: parkingLaneOffset, angle: (3 * Math.PI) / 4 },
    { label: 'Pulse Motorcycle', color: 0xf97316, profile: 'motorcycle', distance: 150, side: parkingLaneOffset, angle: (5 * Math.PI) / 4 },
    { label: 'Can-Am Trail Runner', color: 0x84cc16, profile: 'canAm', distance: 150, side: parkingLaneOffset, angle: (7 * Math.PI) / 4 }
  ];
  vehicleSpecs.forEach(spec => {
    const vehicle = createDriveableVehicle(spec.label, spec.color, spec.profile);
    const position = {
      x: Math.sin(spec.angle) * spec.distance + Math.cos(spec.angle) * spec.side,
      z: Math.cos(spec.angle) * spec.distance - Math.sin(spec.angle) * spec.side
    };
    const heading = spec.angle + Math.sign(spec.side) * 0.12;
    vehicle.group.position.set(position.x, AVENUE_ROAD_Y, position.z);
    vehicle.group.rotation.y = heading;

    const parkingLength = vehicle.length + 1.4;
    const parkingSurface = new THREE.PlaneGeometry(3.6, parkingLength);
    parkingSurface.rotateX(-Math.PI / 2);
    parkingSurface.rotateY(heading);
    parkingSurface.translate(position.x, AVENUE_ROAD_Y + 0.004, position.z);
    const parkingPad = new THREE.Mesh(parkingSurface, asphaltMaterial);
    parkingPad.receiveShadow = true;
    cityGroup.add(parkingPad);

    const acrossX = Math.cos(heading);
    const acrossZ = -Math.sin(heading);
    [-1, 1].forEach(side => {
      const bayLine = new THREE.Mesh(
        new THREE.BoxGeometry(0.10, 0.018, parkingLength),
        whitePaintMaterial
      );
      bayLine.position.set(
        position.x + acrossX * side * 1.72,
        AVENUE_ROAD_Y + 0.025,
        position.z + acrossZ * side * 1.72
      );
      bayLine.rotation.y = heading;
      cityGroup.add(bayLine);
    });
    vehicle.group.userData.driveableVehicle = vehicle;
    vehicle.group.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        object.userData.driveableVehicle = vehicle;
      }
    });
    scene.add(vehicle.group);
    vehicles.push(vehicle);
  });

  // -----------------------------------------------------------------------
  // 8. CELESTIAL SKY SYSTEM
  // -----------------------------------------------------------------------
  const celestial = buildCelestialSystem(scene);
  const rainCount = 1100;
  const rainPositions = new Float32Array(rainCount * 6);
  for (let i = 0; i < rainCount; i += 1) {
    const offset = i * 6;
    const x = (Math.random() - 0.5) * 120;
    const y = Math.random() * 48 + 8;
    const z = (Math.random() - 0.5) * 120;
    rainPositions.set([x, y, z, x + 0.16, y - 2.4, z + 0.08], offset);
  }
  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  rainGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 30, 0), 100);
  const rain = new THREE.LineSegments(
    rainGeometry,
    new THREE.LineBasicMaterial({
      color: 0xa8c6f4,
      transparent: true,
      opacity: 0.16,
      depthWrite: false
    })
  );
  rain.frustumCulled = false;
  scene.add(rain);

  const fogBankGroup = new THREE.Group();
  fogBankGroup.name = 'Volumetric_Fog_Banks';
  const fogTexture = createVolumetricFogTexture();
  const fogBanks: FogBankHandle[] = [];
  const fogColors = [0xc2cede, 0x9fafc9, 0xd1d4df];
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const distance = 220 + Math.random() * 160;
    const originX = Math.cos(angle) * distance;
    const originY = 1.5 + Math.random() * 5;
    const originZ = Math.sin(angle) * distance;
    const baseOpacity = 0.04 + Math.random() * 0.025;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: fogTexture,
      color: fogColors[i % fogColors.length],
      transparent: true,
      opacity: baseOpacity,
      depthWrite: false,
      fog: true
    }));
    sprite.position.set(originX, originY, originZ);
    sprite.scale.set(65 + Math.random() * 55, 14 + Math.random() * 16, 1);
    sprite.renderOrder = 1;
    fogBankGroup.add(sprite);
    fogBanks.push({
      sprite,
      originX,
      originY,
      originZ,
      driftX: 2 + Math.random() * 5,
      driftZ: 2 + Math.random() * 5,
      phase: Math.random() * Math.PI * 2,
      baseOpacity
    });
  }
  scene.add(fogBankGroup);

  const cloudGroup = new THREE.Group();
  cloudGroup.name = 'Dynamic_Sky_Clouds';
  const cloudTexture = createSkyCloudTexture();
  const clouds: FogBankHandle[] = [];
  const cloudColors = [0xaebed8, 0xc3cde0, 0x93a8c8];
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const distance = 240 + Math.random() * 180;
    const originX = Math.cos(angle) * distance;
    const originY = 70 + Math.random() * 55;
    const originZ = Math.sin(angle) * distance;
    const baseOpacity = 0.48 + Math.random() * 0.18;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: cloudTexture,
      color: cloudColors[i % cloudColors.length],
      transparent: true,
      opacity: baseOpacity,
      depthWrite: false,
      fog: false
    }));
    sprite.position.set(originX, originY, originZ);
    sprite.scale.set(210 + Math.random() * 150, 52 + Math.random() * 30, 1);
    cloudGroup.add(sprite);
    clouds.push({
      sprite,
      originX,
      originY,
      originZ,
      driftX: 4 + Math.random() * 8,
      driftZ: 4 + Math.random() * 8,
      phase: Math.random() * Math.PI * 2,
      baseOpacity
    });
  }
  scene.add(cloudGroup);

  console.log('[NewCity] Synthwave city skyline, building jumbotrons, celestial moon & stars active!');

  return {
    gatGroup,
    billboards,
    shootingStars: celestial.shootingStars,
    fogBankGroup,
    fogBanks,
    cloudGroup,
    clouds,
    starPoints: celestial.starPoints,
    nebulaGroup: celestial.nebulaGroup,
    moonGroup: celestial.moonGroup,
    beaconLights,
    trafficSignals,
    rain,
    rainGeometry,
    vehicles,
    collisionObstacles,
    bridge
  };
}

// =========================================================================
// REAL-TIME ANIMATION LOOP (Shooting Stars, Jumbotrons, Celestial Sky)
// =========================================================================

export function updateCityAnimation(
  handles: CityAnimationHandles,
  elapsed: number,
  playerPos?: THREE.Vector3,
  frameDelta = 0.016
): void {
  const delta = Math.min(frameDelta, 0.05);

  if (playerPos) {
    handles.fogBankGroup.position.copy(playerPos);
    handles.cloudGroup.position.copy(playerPos);
  }
  handles.fogBanks.forEach(bank => {
    const drift = elapsed * 0.025 + bank.phase;
    bank.sprite.position.set(
      bank.originX + Math.sin(drift) * bank.driftX,
      bank.originY,
      bank.originZ + Math.cos(drift * 0.8) * bank.driftZ
    );
    (bank.sprite.material as THREE.SpriteMaterial).opacity =
      bank.baseOpacity * (0.90 + Math.sin(elapsed * 0.12 + bank.phase) * 0.10);
  });
  handles.clouds.forEach(cloud => {
    const drift = elapsed * 0.008 + cloud.phase;
    cloud.sprite.position.set(
      cloud.originX + Math.sin(drift) * cloud.driftX,
      cloud.originY + Math.sin(drift * 0.45) * 2.5,
      cloud.originZ + Math.cos(drift * 0.8) * cloud.driftZ
    );
    (cloud.sprite.material as THREE.SpriteMaterial).opacity =
      cloud.baseOpacity * (0.92 + Math.sin(elapsed * 0.08 + cloud.phase) * 0.08);
  });

  const setSignalPhase = (
    materials: [THREE.MeshStandardMaterial, THREE.MeshStandardMaterial, THREE.MeshStandardMaterial],
    activeIndex: number
  ) => {
    materials.forEach((material, index) => {
      material.emissiveIntensity = index === activeIndex ? 3.2 : 0.025;
    });
  };
  const signalPhase = elapsed % 40;
  setSignalPhase(handles.trafficSignals.uAxis, signalPhase < 16 ? 2 : signalPhase < 19 ? 1 : 0);
  setSignalPhase(
    handles.trafficSignals.vAxis,
    signalPhase >= 20 && signalPhase < 36 ? 2 : signalPhase >= 36 && signalPhase < 39 ? 1 : 0
  );

  if (playerPos) {
    handles.rain.position.set(playerPos.x, playerPos.y, playerPos.z);
    const rainAttribute = handles.rainGeometry.getAttribute('position') as THREE.BufferAttribute;
    const rainData = rainAttribute.array as Float32Array;
    const rainStep = delta * 38;
    for (let index = 0; index < rainData.length / 6; index += 1) {
      const offset = index * 6;
      rainData[offset + 1] -= rainStep;
      rainData[offset] += rainStep * 0.12;
      rainData[offset + 2] += rainStep * 0.04;
      if (rainData[offset + 1] < 0) {
        rainData[offset] = (Math.random() - 0.5) * 120;
        rainData[offset + 1] = 45 + Math.random() * 18;
        rainData[offset + 2] = (Math.random() - 0.5) * 120;
      }
      rainData[offset + 3] = rainData[offset] + 0.16;
      rainData[offset + 4] = rainData[offset + 1] - 2.4;
      rainData[offset + 5] = rainData[offset + 2] + 0.08;
    }
    rainAttribute.needsUpdate = true;
  }

  // 1. Update Building Jumbotrons
  if (handles.billboards && handles.billboards.length > 0) {
    for (let i = 0; i < handles.billboards.length; i++) {
      handles.billboards[i].update(elapsed, delta);
    }
  }

  // 2. Update Dynamic Shooting Stars (Meteors)
  if (handles.shootingStars) {
    for (let i = 0; i < handles.shootingStars.length; i++) {
      const star = handles.shootingStars[i];
      if (!star.active) {
        if (elapsed > star.nextTriggerTime) {
          star.active = true;
          star.progress = 0;
          const sAngle = Math.random() * Math.PI * 2;
          const sRadius = 1400 + Math.random() * 800;
          const startX = Math.cos(sAngle) * sRadius;
          const startY = 800 + Math.random() * 600;
          const startZ = Math.sin(sAngle) * sRadius;
          star.startPos.set(startX, startY, startZ);

          star.dir.set(
            -0.6 + (Math.random() - 0.5) * 0.4,
            -0.45 - Math.random() * 0.35,
            -0.6 + (Math.random() - 0.5) * 0.4
          ).normalize();
          star.speed = 1400 + Math.random() * 800;
        }
      } else {
        star.progress += delta * star.speed;
        const head = star.startPos.clone().addScaledVector(star.dir, star.progress);
        const tail = star.startPos.clone().addScaledVector(star.dir, Math.max(0, star.progress - star.length));

        const posAttr = star.line.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        arr[0] = head.x; arr[1] = head.y; arr[2] = head.z;
        arr[3] = tail.x; arr[4] = tail.y; arr[5] = tail.z;
        posAttr.needsUpdate = true;

        const mat = star.line.material as THREE.LineBasicMaterial;
        mat.opacity = Math.sin((star.progress / (star.length * 3.5)) * Math.PI);

        if (star.progress > star.length * 3.5 || head.y < 100) {
          star.active = false;
          mat.opacity = 0;
          star.nextTriggerTime = elapsed + 1.2 + Math.random() * 4.0;
        }
      }
    }
  }

  // 3. Update Cosmic Galaxy Nebula & Celestial Twinkle
  if (handles.nebulaGroup) {
    handles.nebulaGroup.rotation.y = elapsed * 0.004;
  }

  if (handles.starPoints) {
    const starMat = handles.starPoints.material as THREE.PointsMaterial;
    starMat.size = 24 + Math.sin(elapsed * 2.2) * 5;
  }

  // 4. Flashing Aviation Beacon Lights on Skyscraper Spires
  if (handles.beaconLights && handles.beaconLights.length > 0) {
    const flash = (Math.sin(elapsed * 3.5) > 0.3) ? 1 : 0;
    for (let b = 0; b < handles.beaconLights.length; b++) {
      const bmat = handles.beaconLights[b].material as THREE.MeshBasicMaterial;
      bmat.color.setHex(flash ? 0xff0044 : 0x220008);
    }
  }

  // 5. Pulse "The GAT" Monument Energy Aura
  if (handles.gatGroup) {
    const crest = handles.gatGroup.getObjectByName('TheGAT_Crest');
    if (crest) {
      crest.rotation.y = elapsed * 0.8;
    }
  }
}
