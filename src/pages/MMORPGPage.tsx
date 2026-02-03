import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Share2, MessageSquare } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import * as THREE from 'three';

interface Character {
  name: string;
  level: number;
  class: 'Warrior' | 'Mage' | 'Rogue' | 'Paladin';
  skinTone: string;
  outfit: string;
  weapon: string;
  position: [number, number, number];
}

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  liked: boolean;
}

export function MMORPGPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);

  const { user } = useGameStore();

  const [selectedTab, setSelectedTab] = useState<'world' | 'store' | 'social' | 'customize'>('world');
  const [currentShop, setCurrentShop] = useState<'armor' | 'weapons' | 'cosmetics' | 'marketplace'>('armor');
  const [cart, setCart] = useState<any[]>([]);
  const [character, setCharacter] = useState<Character>({
    name: user?.username || 'Player',
    level: user?.level || 1,
    class: 'Warrior',
    skinTone: '#D4A373',
    outfit: 'Legendary Armor',
    weapon: 'Crystal Sword',
    position: [0, 0, 0],
  });

  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      author: 'Alex Chen',
      avatar: '🧙',
      content: '🎉 Just defeated the Dragon Lord! Epic loot incoming!',
      timestamp: '2m ago',
      likes: 234,
      liked: false,
    },
    {
      id: '2',
      author: 'Maria Rodriguez',
      avatar: '⚔️',
      content: 'Trading rare artifacts at my storefront near the central plaza!',
      timestamp: '15m ago',
      likes: 89,
      liked: false,
    },
    {
      id: '3',
      author: 'James Park',
      avatar: '🗡️',
      content: 'Guild recruiting! Need skilled warriors for raid tonight.',
      timestamp: '1h ago',
      likes: 156,
      liked: false,
    },
  ]);

  const storeItems = [
    { id: '1', name: 'Legendary Armor', price: '500 CIVIC', icon: '⚔️', rarity: 'Legendary' },
    { id: '2', name: 'Crystal Weapon', price: '300 CIVIC', icon: '🗡️', rarity: 'Epic' },
    { id: '3', name: 'Shadow Cloak', price: '200 CIVIC', icon: '👕', rarity: 'Rare' },
    { id: '4', name: 'Dragon Helm', price: '400 CIVIC', icon: '👑', rarity: 'Legendary' },
    { id: '5', name: 'Enchanted Ring', price: '150 CIVIC', icon: '💍', rarity: 'Rare' },
    { id: '6', name: 'Void Wings', price: '1000 CIVIC', icon: '🪶', rarity: 'Mythic' },
  ];

  const shops = {
    armor: {
      name: '🛡️ Ironforge Armory',
      npc: 'Blacksmith Grendel',
      icon: '🔨',
      items: [
        { id: 'a1', name: 'Legendary Plate Armor', price: 500, icon: '⚔️', rarity: 'Legendary', description: 'Forged from dragon scales' },
        { id: 'a2', name: 'Crystal Mail', price: 350, icon: '✨', rarity: 'Epic', description: 'Shimmering protective armor' },
        { id: 'a3', name: 'Shadow Leather', price: 200, icon: '👕', rarity: 'Rare', description: 'Lightweight stealth gear' },
        { id: 'a4', name: 'Dragon Scale Mail', price: 750, icon: '🐉', rarity: 'Legendary', description: 'Ultimate protection' },
        { id: 'a5', name: 'Mithril Chest Plate', price: 400, icon: '🛡️', rarity: 'Epic', description: 'Ancient dwarven craft' },
        { id: 'a6', name: 'Void Plate', price: 600, icon: '🌑', rarity: 'Legendary', description: 'Absorbs magic damage' },
      ],
    },
    weapons: {
      name: '⚔️ Blade & Bow Emporium',
      npc: 'Merchant Valorian',
      icon: '🗡️',
      items: [
        { id: 'w1', name: 'Crystal Sword', price: 300, icon: '⚔️', rarity: 'Epic', description: '+15% Attack Speed' },
        { id: 'w2', name: 'Void Scythe', price: 400, icon: '☠️', rarity: 'Legendary', description: 'Life steal weapon' },
        { id: 'w3', name: 'Lightning Staff', price: 350, icon: '⚡', rarity: 'Epic', description: 'Elemental damage' },
        { id: 'w4', name: 'Axe of Titans', price: 500, icon: '🪓', rarity: 'Legendary', description: '+25% Damage' },
        { id: 'w5', name: 'Bow of Artemis', price: 280, icon: '🏹', rarity: 'Epic', description: 'Precision strikes' },
        { id: 'w6', name: 'Wand of Infinity', price: 450, icon: '✨', rarity: 'Legendary', description: 'Unlimited mana regen' },
      ],
    },
    cosmetics: {
      name: '✨ Celestial Boutique',
      npc: 'Fashion Designer Luna',
      icon: '💎',
      items: [
        { id: 'c1', name: 'Void Wings', price: 1000, icon: '🪶', rarity: 'Mythic', description: 'Show off in style' },
        { id: 'c2', name: 'Golden Halo', price: 500, icon: '✨', rarity: 'Legendary', description: 'Divine aura effect' },
        { id: 'c3', name: 'Shadow Aura', price: 400, icon: '🌑', rarity: 'Epic', description: 'Dark particle effect' },
        { id: 'c4', name: 'Celestial Trail', price: 350, icon: '⭐', rarity: 'Epic', description: 'Glowing footsteps' },
        { id: 'c5', name: 'Phoenix Wings', price: 800, icon: '🔥', rarity: 'Legendary', description: 'Fiery transformation' },
        { id: 'c6', name: 'Mystic Glow', price: 250, icon: '💫', rarity: 'Rare', description: 'Ethereal aura' },
      ],
    },
    marketplace: {
      name: '🏪 Central Marketplace',
      npc: 'Trade Master Aurelius',
      icon: '🛍️',
      items: [
        { id: 'm1', name: 'Rare Loot Box', price: 150, icon: '📦', rarity: 'Rare', description: 'Random rare items' },
        { id: 'm2', name: 'Epic Loot Box', price: 300, icon: '🎁', rarity: 'Epic', description: 'Random epic items' },
        { id: 'm3', name: 'Mythic Loot Box', price: 600, icon: '🏆', rarity: 'Mythic', description: 'Guaranteed legendary+' },
        { id: 'm4', name: 'Stat Card: +50 ATK', price: 200, icon: '📊', rarity: 'Rare', description: 'Permanent boost' },
        { id: 'm5', name: 'Potion of Vigor', price: 50, icon: '🧪', rarity: 'Common', description: '+20 Health' },
        { id: 'm6', name: 'Enchanted Scroll', price: 100, icon: '📜', rarity: 'Rare', description: 'Upgrade equipment' },
      ],
    },
  };

  // Initialize 3D scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1628);
    scene.fog = new THREE.Fog(0x0a1628, 100, 500);

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(3, 2.5, 5);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x00d4ff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xff006e, 0.4);
    pointLight.position.set(-5, 3, 5);
    scene.add(pointLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2847,
      metalness: 0.4,
      roughness: 0.6,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Character group
    const characterGroup = new THREE.Group();
    scene.add(characterGroup);

    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: character.skinTone,
      metalness: 0.1,
      roughness: 0.8,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = 1;
    characterGroup.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.35, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: character.skinTone,
      metalness: 0.05,
      roughness: 0.8,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.castShadow = true;
    head.receiveShadow = true;
    head.position.y = 2.2;
    characterGroup.add(head);

    // Armor
    const armorGeometry = new THREE.BoxGeometry(0.5, 1.4, 0.4);
    const armorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5a7b,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.3,
    });
    const armor = new THREE.Mesh(armorGeometry, armorMaterial);
    armor.castShadow = true;
    armor.receiveShadow = true;
    armor.position.y = 1.1;
    characterGroup.add(armor);

    // Weapon (sword)
    const weaponGroup = new THREE.Group();
    const bladeGeometry = new THREE.BoxGeometry(0.15, 1.5, 0.05);
    const bladeMaterial = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.5,
    });
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.castShadow = true;
    blade.position.set(0.6, 1, 0);
    weaponGroup.add(blade);

    const hiltGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const hiltMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      metalness: 0.6,
    });
    const hilt = new THREE.Mesh(hiltGeometry, hiltMaterial);
    hilt.castShadow = true;
    hilt.position.set(0.6, 0.5, 0);
    weaponGroup.add(hilt);

    weaponGroup.rotation.z = Math.PI / 6;
    characterGroup.add(weaponGroup);

    // Animate character
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Gentle rotation
      characterGroup.rotation.y += 0.005;

      // Floating animation
      characterGroup.position.y = Math.sin(Date.now() * 0.001) * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    characterGroupRef.current = characterGroup;

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [character.skinTone]);

  const handleLikePost = (postId: string) => {
    setPosts(
      posts.map((p) =>
        p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col">
      {/* Header */}
      <div className="bg-dark-800/80 border-b border-dark-700 backdrop-blur-xl z-50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/foyer')}
              className="flex items-center gap-2 text-white hover:text-civic-400 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Foyer
            </motion.button>
            <span className="text-civic-400 font-bold text-xl">🎮 The Foyer MMORPG</span>
          </div>
          <div className="text-right">
            <p className="text-white font-bold">{character.name}</p>
            <p className="text-civic-400 text-sm">Level {character.level} {character.class}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* 3D Character Viewer - Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-lg"
        >
          {selectedTab === 'world' && (
            <div ref={containerRef} className="w-full h-96 lg:h-full min-h-screen" />
          )}

          {selectedTab === 'customize' && (
            <div className="p-6 space-y-6 h-full overflow-y-auto">
              <h2 className="text-2xl font-bold text-white">⚔️ Character Customization</h2>

              {/* Character Presets */}
              <div>
                <label className="text-white font-semibold mb-3 block">🎭 Preset Templates</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Classic Warrior', class: 'Warrior', icon: '⚔️' },
                    { name: 'Mystic Mage', class: 'Mage', icon: '🧙' },
                    { name: 'Shadow Rogue', class: 'Rogue', icon: '🗡️' },
                    { name: 'Holy Paladin', class: 'Paladin', icon: '✨' },
                  ].map((preset) => (
                    <button
                      key={preset.class}
                      onClick={() => setCharacter({ ...character, class: preset.class as any })}
                      className={`p-3 rounded-lg border-2 transition text-center ${
                        character.class === preset.class
                          ? 'border-civic-500 bg-civic-500/20 text-civic-400'
                          : 'border-dark-600 text-dark-300 hover:border-dark-500'
                      }`}
                    >
                      <div className="text-2xl mb-1">{preset.icon}</div>
                      <p className="text-xs font-bold">{preset.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Appearance */}
              <div>
                <label className="text-white font-semibold mb-3 block">👤 Appearance</label>
                <div className="space-y-3">
                  <div>
                    <p className="text-dark-300 text-sm mb-2">Skin Tone</p>
                    <div className="grid grid-cols-6 gap-2">
                      {['#D4A373', '#C2926F', '#A67C52', '#8B6F47', '#E8B4A0', '#C96B5A', '#FFD4A3', '#704020'].map(
                        (color) => (
                          <button
                            key={color}
                            onClick={() => setCharacter({ ...character, skinTone: color })}
                            className={`w-10 h-10 rounded-lg border-2 transition ${
                              character.skinTone === color ? 'border-civic-400 ring-2 ring-civic-400 scale-110' : 'border-dark-600'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-dark-300 text-sm mb-2 block">Hair Style</label>
                    <select
                      className="w-full bg-dark-700 border border-dark-600 text-white rounded-lg p-2 text-sm"
                      defaultValue="Long Wave"
                    >
                      {['Short Buzz', 'Spiky', 'Long Wave', 'Curly Afro', 'Braids', 'Bald', 'Top Knot', 'Mohawk'].map(
                        (style) => (
                          <option key={style} value={style}>
                            {style}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-dark-300 text-sm mb-2 block">Hair Color</label>
                    <div className="grid grid-cols-6 gap-2">
                      {['#000000', '#4A3728', '#8B4513', '#DAA520', '#FF6347', '#DC143C', '#00008B', '#4B0082'].map(
                        (color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-lg border-2 transition ${
                              character.outfit === color ? 'border-civic-400 scale-110' : 'border-dark-600'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-dark-300 text-sm mb-2 block">Eye Color</label>
                    <div className="grid grid-cols-6 gap-2">
                      {['#8B4513', '#006400', '#00008B', '#DC143C', '#FFD700', '#A9A9A9'].map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 transition ${
                            character.outfit === color ? 'border-civic-400 scale-110' : 'border-dark-600'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Armor & Gear */}
              <div>
                <label className="text-white font-semibold mb-3 block">🛡️ Armor & Gear</label>
                <div className="space-y-3">
                  <div>
                    <label className="text-dark-300 text-sm mb-2 block">Armor Set</label>
                    <select
                      value={character.outfit}
                      onChange={(e) => setCharacter({ ...character, outfit: e.target.value })}
                      className="w-full bg-dark-700 border border-dark-600 text-white rounded-lg p-2 text-sm"
                    >
                      {[
                        'Legendary Armor',
                        'Elegant Robes',
                        'Sleek Outfit',
                        'Royal Attire',
                        'Dragon Scale Mail',
                        'Shadow Leather',
                        'Mystic Vestments',
                        'Noble Regalia',
                      ].map((outfit) => (
                        <option key={outfit} value={outfit}>
                          {outfit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-dark-300 text-sm mb-2 block">Weapon</label>
                    <select
                      value={character.weapon}
                      onChange={(e) => setCharacter({ ...character, weapon: e.target.value })}
                      className="w-full bg-dark-700 border border-dark-600 text-white rounded-lg p-2 text-sm"
                    >
                      {[
                        'Crystal Sword',
                        'Void Scythe',
                        'Lightning Staff',
                        'Shadow Dagger',
                        'Axe of Titans',
                        'Bow of Artemis',
                        'Wand of Infinity',
                        'Spear of Light',
                      ].map((weapon) => (
                        <option key={weapon} value={weapon}>
                          {weapon}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-dark-300 text-sm mb-2 block">Shield/Off-Hand</label>
                    <select className="w-full bg-dark-700 border border-dark-600 text-white rounded-lg p-2 text-sm">
                      {['None', 'Aegis Shield', 'Tome of Arcana', 'Dagger', 'Torch', 'Crystal Orb'].map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Accessories */}
              <div>
                <label className="text-white font-semibold mb-3 block">✨ Accessories & Cosmetics</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Void Wings', 'Halo', 'Shadow Aura', 'Golden Runes', 'Celestial Trail', 'Mystic Glow'].map(
                    (item) => (
                      <button
                        key={item}
                        className="p-2 bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-civic-500 rounded-lg text-white text-sm transition"
                      >
                        ✨ {item}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Badges & Titles */}
              <div>
                <label className="text-white font-semibold mb-3 block">🏆 Badges & Titles</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Legendary Slayer', 'Dragon Slayer', 'Treasure Hunter', 'Guild Master', 'Chosen One', 'Void Walker'].map(
                    (badge) => (
                      <button
                        key={badge}
                        className="p-2 bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-civic-500 rounded-lg text-white text-sm transition flex items-center gap-2"
                      >
                        🏅 <span>{badge}</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Save Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-civic-500 hover:bg-civic-600 text-white font-bold py-3 rounded-lg transition"
              >
                💾 Save Customization
              </motion.button>
            </div>
          )}

          {selectedTab === 'store' && (
            <div className="p-6 space-y-6 h-full overflow-y-auto">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">🏪 Digital Storefronts</h2>
                <div className="bg-civic-500/20 border border-civic-500 rounded-lg px-3 py-1 text-civic-400 text-sm font-bold">
                  Cart: {cart.length} items
                </div>
              </div>

              {/* Shop Selector */}
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(shops).map(([shopId, shop]: any) => (
                  <motion.button
                    key={shopId}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setCurrentShop(shopId as any)}
                    className={`p-3 rounded-lg border-2 transition text-center ${
                      currentShop === shopId
                        ? 'border-civic-500 bg-civic-500/20 text-civic-400'
                        : 'border-dark-600 text-dark-300 hover:border-dark-500'
                    }`}
                  >
                    <div className="text-3xl mb-1">{shop.icon}</div>
                    <p className="text-xs font-bold">{shop.name.split(' ')[0]}</p>
                  </motion.button>
                ))}
              </div>

              {/* Current Shop Display */}
              {shops[currentShop] && (
                <div className="bg-dark-700 border border-dark-600 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{shops[currentShop].name}</h3>
                      <p className="text-dark-300 text-sm">Merchant: {shops[currentShop].npc}</p>
                    </div>
                    <span className="text-4xl">{shops[currentShop].icon}</span>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {shops[currentShop].items.map((item: any) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.05 }}
                        className="bg-dark-800 border border-dark-600 hover:border-civic-500/70 rounded-lg p-3 transition cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-3xl">{item.icon}</span>
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded ${
                              item.rarity === 'Mythic'
                                ? 'bg-purple-500/30 text-purple-400'
                                : item.rarity === 'Legendary'
                                ? 'bg-yellow-500/30 text-yellow-400'
                                : item.rarity === 'Epic'
                                ? 'bg-blue-500/30 text-blue-400'
                                : 'bg-green-500/30 text-green-400'
                            }`}
                          >
                            {item.rarity}
                          </span>
                        </div>
                        <h4 className="text-white font-bold text-sm">{item.name}</h4>
                        <p className="text-dark-300 text-xs mb-2">{item.description}</p>
                        <div className="flex justify-between items-center">
                          <p className="text-civic-400 font-bold text-sm">{item.price} CIVIC</p>
                          <button
                            onClick={() => setCart([...cart, item])}
                            className="bg-civic-500/20 hover:bg-civic-500/40 text-civic-400 px-2 py-1 rounded text-xs font-bold transition group-hover:bg-civic-500/50"
                          >
                            Add
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cart Summary */}
              {cart.length > 0 && (
                <div className="bg-civic-500/10 border border-civic-500/30 rounded-lg p-4">
                  <h4 className="text-white font-bold mb-3">🛒 Shopping Cart ({cart.length})</h4>
                  <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-dark-200">{item.name}</span>
                        <button
                          onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-civic-500/30 pt-2 flex justify-between items-center mb-3">
                    <span className="text-white font-bold">Total:</span>
                    <span className="text-civic-400 font-bold">
                      {cart.reduce((sum, item) => sum + item.price, 0)} CIVIC
                    </span>
                  </div>
                  <button className="w-full bg-civic-500 hover:bg-civic-600 text-white font-bold py-2 rounded transition">
                    💳 Checkout
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Right Sidebar - Tabs and Social */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          {/* Tab Navigation */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'world', icon: '🌐', label: 'World' },
                { id: 'store', icon: '🛒', label: 'Store' },
                { id: 'social', icon: '💬', label: 'Social' },
                { id: 'customize', icon: '⚙️', label: 'Customize' },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`p-3 rounded-lg border-2 transition font-bold text-sm ${
                    selectedTab === tab.id
                      ? 'border-civic-500 bg-civic-500/20 text-civic-400'
                      : 'border-dark-600 text-dark-300 hover:border-dark-500'
                  }`}
                >
                  {tab.icon}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Social Feed */}
          {selectedTab === 'social' && (
            <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden flex-1">
              <div className="p-4 border-b border-dark-700">
                <h2 className="text-xl font-bold text-white">Community Feed</h2>
                <p className="text-dark-300 text-sm">What's happening in The Foyer</p>
              </div>

              <div className="divide-y divide-dark-700 overflow-y-auto max-h-96">
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 hover:bg-dark-700/50 transition"
                  >
                    <div className="flex gap-3">
                      <span className="text-3xl">{post.avatar}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-bold">{post.author}</h3>
                          <p className="text-dark-400 text-xs">{post.timestamp}</p>
                        </div>
                        <p className="text-dark-200 mt-1">{post.content}</p>
                        <div className="flex gap-4 mt-3 text-dark-400 text-sm">
                          <button
                            onClick={() => handleLikePost(post.id)}
                            className={`flex items-center gap-1 hover:text-red-400 transition ${
                              post.liked ? 'text-red-400' : ''
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`} />
                            {post.likes}
                          </button>
                          <button className="flex items-center gap-1 hover:text-civic-400 transition">
                            <MessageSquare className="w-4 h-4" />
                            Reply
                          </button>
                          <button className="flex items-center gap-1 hover:text-civic-400 transition">
                            <Share2 className="w-4 h-4" />
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* World Stats */}
          {selectedTab === 'world' && (
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 space-y-3">
              <h3 className="text-white font-bold">Character Stats</h3>
              <div className="space-y-2">
                {[
                  { label: 'Health', value: '100/100', color: 'bg-green-500' },
                  { label: 'Mana', value: '80/80', color: 'bg-blue-500' },
                  { label: 'Stamina', value: '90/100', color: 'bg-yellow-500' },
                  { label: 'Experience', value: '4,250/5,000', color: 'bg-purple-500' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-dark-300">{stat.label}</span>
                      <span className="text-civic-400">{stat.value}</span>
                    </div>
                    <div className="bg-dark-700 rounded-full h-2 overflow-hidden">
                      <div className={`${stat.color} h-full w-3/4`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
