# NEON REIGN: The Foyer - Complete Project Architecture & Implementation Guide

## 🎯 PROJECT OVERVIEW

**NEON REIGN: The Foyer** is a premium, high-fidelity realistic multiplayer battle royale game built in Godot 4.3+ with AAA-quality visuals, realistic PBR character rendering, and a strict **off-platform on-chain transaction architecture**.

### Core Design Principle: NO FUNDS THROUGH PLATFORM
- **All transactions are strictly P2P/P2B/B2B on-chain OFF-PLATFORM**
- Game displays only wallet addresses, QR codes, and transaction status
- Smart contracts settle winnings, purchases, and reputation without touching game servers
- Player completes all payments in their own wallet app outside the game

---

## 📁 PROJECT STRUCTURE

```
/packages/civic-foyer/godot-foyer/
├── project.godot                          # Godot project configuration
├── scenes/
│   ├── main.tscn                          # Entry point scene
│   ├── foyer/TheFoyer.tscn                # Main lobby with portals
│   ├── player/Player.tscn                 # Player character + controller
│   ├── shards/
│   │   ├── StoreShard.tscn                # Shopping / cosmetics
│   │   ├── SchoolhouseShard.tscn         # Training / tutorials
│   │   ├── SocialArenaShard.tscn          # Social hangout
│   │   └── BR_ArenaShard.tscn             # Battle royale arena
│   └── ui/
│       ├── WalletUI.tscn                  # Wallet display + balance
│       ├── BettingUI.tscn                 # Off-platform betting UI
│       └── CivicFeedPanel.tscn            # Social feed + video player
├── scripts/
│   ├── TheFoyerBootstrapper.gd            # Main initialization
│   ├── core/
│   │   └── AdvancedPlayerController.gd    # Player controller (FPS/TPS hybrid)
│   ├── ui/
│   │   ├── StoreUI.gd                     # Store checkout (off-platform)
│   │   ├── BettingUI.gd                   # P2P wager display
│   │   └── FeedUI.gd                      # Social media + video
│   └── autoloads/
│       ├── CivicAvatarManager.gd          # PBR avatar import + retargeting
│       ├── WalletDisplayManager.gd        # Off-platform wallet display only
│       ├── ShardPortalManager.gd          # Seamless shard loading
│       ├── GameStateManager.gd            # Match state + BR mechanics
│       ├── CivicFeedManager.gd            # Social feed + kill feed + video
│       ├── VehicleManager.gd              # Vehicle spawning + physics
│       ├── AudioManager.gd                # Music + ambient + SFX
│       ├── ReputationSystem.gd            # Rank progression + badges
│       └── LiveStreamManager.gd           # CivicWatch streaming
├── assets/
│   ├── shaders/
│   │   ├── neon_pbr_high_fidelity.gdshader  # Main PBR shader
│   │   └── neon_cell_shade.gdshader         # Legacy toon shader
│   ├── models/                            # Placeholder for 3D assets
│   ├── textures/
│   │   ├── pbr_packs/                     # PBR material packages
│   │   └── neon_overlays/                 # Neon glow maps
│   └── audio/
│       ├── music/foyer_theme.ogg
│       ├── ambient/
│       └── sfx/
└── README.md
```

---

## ⚙️ CORE AUTOLOADS (Singletons)

### 1. **WalletDisplayManager.gd** - OFF-PLATFORM TRANSACTION HUB
**CRITICAL: This manager NEVER touches game funds. It only displays wallet addresses and QR codes.**

```gdscript
# Key functions:
display_p2p_bet_request(opponent_name, amount, match_id) → Dictionary
  # Returns: { "seller_wallet": addr, "instructions": "...", "status": "awaiting_off_platform_payment" }

display_store_payment(item_name, price, seller_wallet) → Dictionary
  # Returns: QR code data + seller wallet for player to copy

generate_qr_data(recipient_wallet, amount) → String
  # Returns: EIP-681 URI format or chain-specific QR code string

confirm_transaction_initiated(tx_hash, amount) → void
  # Logs player's confirmation they sent funds on-chain (game doesn't verify)

refresh_balance_from_chain() → void
  # Polls blockchain for real wallet balance (reads only, never writes)
```

**Off-Platform Transaction Flow:**
1. Game displays wallet address + QR + copy button
2. Player opens their wallet app (MetaMask, Trust Wallet, etc.)
3. Player sends funds to the displayed address
4. Player copies transaction hash back into game UI
5. Game logs the TX hash for reference
6. Smart contract watches match results and auto-settles

### 2. **CivicAvatarManager.gd** - HIGH-FIDELITY PBR AVATAR SYSTEM

```gdscript
# Key functions:
import_avatar_gltf(gltf_path) → Node3D
  # Imports Ready Player Me / VRM / glTF avatar
  # Applies high-fidelity PBR materials automatically

apply_high_fidelity_pbr(node) → void
  # Recursively applies premium PBR to all meshes
  # Auto-detects: skin (SSS), cloth (roughness), metal (neon), hair (translucency)

setup_animation_retargeting(avatar) → void
  # Creates AnimationTree with state machine for smooth blending

apply_cosmetic_wearable(cosmetic_type, model_path) → void
  # Attacheshats, armor, gear with proper bone orientation
```

**Avatar Rendering Pipeline:**
- Skin: Subsurface scattering enabled, detailed pore texture
- Clothing: Realistic fabric with wrinkles and micro-surface detail
- Hair: Physics-based card meshes with wind animation
- Armor: Metallic PBR with neon cyan glow accents
- Eyes: Realistic specular reflections

### 3. **AdvancedPlayerController.gd** - REALISTIC MOVEMENT + COMBAT

```gdscript
# Movement:
WALK_SPEED = 5.5, SPRINT_SPEED = 11.0, JUMP_VELOCITY = 6.5
# Smooth acceleration/deceleration with inertia

# Parkour:
- Double jump
- Slide (0.6 sec duration, full speed)
- Vault (detect ledges, auto-mantle)
- Wall-run (detect vertical surfaces)

# Combat:
current_weapon in ["pistol", "rifle", "shotgun", "sniper", "energy"]
is_aiming → FOV transitions (75→25°), camera smoothing
fire_weapon() → raycast hit detection, realistic recoil, shell ejection
reload_weapon() → animation state transition

# Animation States via AnimationTree:
Idle, Walk, Sprint, Slide, Jump, ADS, Fire, Reload, Melee
```

### 4. **ShardPortalManager.gd** - SEAMLESS SHARD TRAVEL

```gdscript
# Shard registry (auto-register new shards):
shard_registry = {
  "SocialArena": "res://scenes/shards/SocialArenaShard.tscn",
  "Schoolhouse": "res://scenes/shards/SchoolhouseShard.tscn",
  "Store": "res://scenes/shards/StoreShard.tscn",
  "BR_Arena": "res://scenes/shards/BR_ArenaShard.tscn"
}

# Full state carryover:
- Player position → saved
- Avatar + cosmetics → preserved
- Inventory + guns → maintained
- Reputation + karma → updated
- Wallet balance → refreshed from chain
- Return portal → exact spot + full state restored
```

### 5. **GameStateManager.gd** - BR MECHANICS + MATCH STATE

```gdscript
# signals:
player_joined, player_left, match_started, match_ended, storm_circle_updated

# functions:
start_match(player_count) → initialize new BR round
register_elimination(killer_id, victim_id, weapon) → log kill + add to feed
update_storm_circle(center, radius) → shrinking zone with damage
```

### 6. **CivicFeedManager.gd** - X-LIKE SOCIAL INTEGRATION

```gdscript
# Features:
- Scrolling feed with posts, likes, reposts, replies
- Kill feed integration (last 10 kills in real-time)
- Trending topics (reputation-gated content)
- Live chat per lobby / per shard
- CivicWatch shortform video streams

# signals:
feed_updated, kill_feed_event, new_chat_message, new_post_received
```

### 7. **VehicleManager.gd** - REALISTIC VEHICLE PHYSICS

```gdscript
# Vehicles:
"sports_car": speed 60, acceleration 8.0, handling 7, seats 2
"hoverbike": speed 80, acceleration 10.0, handling 9, seats 1
"speedboat": speed 70, acceleration 9.0, handling 6, seats 4
"flying_car": speed 120, acceleration 12.0, handling 8, seats 2
"taxi": speed 50, acceleration 6.0, handling 5, seats 4

# Physics:
- Wheel friction + torque
- Suspension springs
- Drift mechanics
- Boost system
- Enter/exit animations
```

---

## 🎨 MATERIAL & SHADER SETUP

### High-Fidelity PBR Shader: `neon_pbr_high_fidelity.gdshader`

```glsl
uniform vec4 albedo_color : source_color = vec4(0.9, 0.9, 0.9, 1);
uniform sampler2D albedo_texture : source_color;
uniform sampler2D roughness_texture;
uniform sampler2D metallic_texture;
uniform sampler2D normal_texture;
uniform sampler2D emissive_texture;

// Neon accents
uniform vec3 neon_accent_color : source_color = vec3(0.0, 0.6, 1.0);
uniform float neon_accent_strength : hint_range(0.0, 5.0) = 2.0;
uniform float neon_rim_power : hint_range(1.0, 12.0) = 5.0;

// Realism
uniform float sss_strength : hint_range(0.0, 1.0) = 0.1;
uniform float detail_noise_scale : hint_range(1.0, 15.0) = 8.0;
```

### Material Presets:

**Skin (Human Avatar):**
```gdscript
pbr_mat.subsurface_scattering_enabled = true
pbr_mat.subsurface_scattering = 0.18
pbr_mat.roughness = clamp(roughness, 0.2, 0.4)
pbr_mat.emission_energy_multiplier = 0.3
```

**Armor/Neon Gear:**
```gdscript
pbr_mat.metallic = 0.85
pbr_mat.roughness = 0.08
pbr_mat.emission = Color(0.0, 0.7, 1.0)
pbr_mat.emission_energy_multiplier = 0.8
```

**Cloth/Fabric:**
```gdscript
pbr_mat.roughness = clamp(roughness, 0.5, 0.8)
pbr_mat.metallic = 0.0
```

---

## 🌃 WORLDENVIRONMENT + LIGHTING CONFIGURATION

### Procedural Sky
```gdscript
sky_top_color = Color(0.05, 0.06, 0.14, 1)
sky_horizon_color = Color(0.09, 0.08, 0.14, 1)
sky_curve = 1.05
```

### SDFGI (Global Illumination)
```gdscript
sdfgi_enabled = true
sdfgi_cascade_count = 4
sdfgi_trace_steps = 32
sdfgi_bounce_count = 2
sdfgi_full_spectrum = true
```

### Volumetric Fog + God Rays
```gdscript
volumetric_fog_density = 0.011
volumetric_fog_scatter = 0.38
volumetric_fog_anisotropy = 0.28
volumetric_fog_gi_inject = 1.0
volumetric_fog_albedo = Color(0.24, 0.17, 0.28, 1)
volumetric_fog_emission = Color(0.18, 0.08, 0.31, 1)
```

### Bloom & HDR
```gdscript
glow_enabled = true
glow_intensity = 1.48
glow_strength = 2.1
glow_bloom = 0.8
glow_hdr_threshold = 0.72
```

### Color Grading (Tropical Night)
```gdscript
adjustment_brightness = 1.05
adjustment_contrast = 1.25
adjustment_saturation = 1.45
adjustment_tone_mapper = Environment.TONE_MAPPER_ACES
adjustment_color_correction = Color(1.1, 1.03, 1.0, 1)
```

---

## 🛍️ OFF-PLATFORM STORE CHECKOUT (StoreShard)

### Store UI Flow (NO FUNDS PROCESSED):

1. **Display Inventory**
   - Items with prices and descriptions
   - Player adds items to cart

2. **Checkout Screen**
   - Shows: Total amount + Seller wallet address
   - Displays: QR code + Copy button

3. **Payment Instructions**
   ```
   1. Copy seller's wallet address
   2. Open MetaMask / wallet app
   3. Send X.XX CIVIC to seller address
   4. Paste transaction hash in game
   5. Confirm purchase
   ```

4. **Post-Purchase**
   - Game logs transaction hash
   - Smart contract verifies payment on-chain
   - Items transferred via NFT contract (off-chain)

### Key Code:
```gdscript
# StoreUI.gd
func initiate_checkout():
    var payment_request = WalletDisplayManager.display_store_payment(
        "Store Bundle",
        cart_total,
        seller_wallet
    )
    # Display payment UI with wallet + QR
    
func confirm_payment_completed(tx_hash):
    # Log TX hash, await smart contract settlement
    WalletDisplayManager.confirm_transaction_initiated(tx_hash, cart_total)
    # Game never moves funds
```

---

## 🎰 OFF-PLATFORM BETTING UI (BettingUI)

### P2P Wager Flow (NO FUNDS PROCESSED):

1. **Wager Request**
   - Display opponent name + wager amount
   - Show opponent's wallet address

2. **Player Actions**
   - Copy opponent wallet
   - Open wallet app
   - Send CIVIC tokens in wallet

3. **Confirmation**
   - Paste transaction hash
   - Game logs for match settlement

4. **Auto-Settlement**
   - Smart contract watches match results
   - Sends winnings to winner's wallet on-chain
   - 1% UBI microtax deposited to community treasury

### Key Code:
```gdscript
# BettingUI.gd
func show_bet_request(opponent_name, opponent_wallet, wager_amount):
    var bet_display = WalletDisplayManager.display_p2p_bet_request(
        opponent_name,
        wager_amount,
        GameStateManager.current_match_id
    )
    # Show wallet address + QR for payment
    
func _on_confirm_payment():
    # Player enters TX hash from their wallet
    WalletDisplayManager.confirm_transaction_initiated(tx_hash, amount)
    # Smart contract will settle based on match winner
```

---

## 📱 CIVICFEED + VIDEO PLAYER

### Feed Structure:
```gdscript
posts = [
    {
        "user": "SovereignCitizen",
        "text": "Just got a 5-kill streak!",
        "likes": 543,
        "replies": 23,
        "timestamp": "5m ago",
        "has_media": true,
        "verified": false,
        "reputation_required": 10
    }
]

kill_feed = [
    {
        "killer": "EliteSniper",
        "victim": "NewPlayer",
        "weapon": "sniper",
        "timestamp": Time.get_ticks_msec()
    }
]

chat_messages = [
    {
        "username": "CommunityMod",
        "message": "Welcome to The Foyer!",
        "timestamp": Time.get_ticks_msec(),
        "verified": true
    }
]
```

### Video Streamer:
```gdscript
active_video_stream = {
    "name": "CivicWatch Alpha",
    "path": "res://assets/videos/civicwatch_alpha.ogv",
    "viewer_count": 4256
}

video_player.stream = active_video_stream.path
video_player.play()
```

---

## 🚀 ASSET IMPORT WORKFLOW

### 1. Character Import (MetaHuman / ReadyPlayerMe)
- Export as glTF 2.0 (`.glb`)
- Textures: Albedo (sRGB), Normal (linear), Metallic/Roughness, AO, Emission
- Import in Godot:
  ```
  Advanced > Meshes > Generate Normals: OFF (use model normals)
  Advanced > Meshes > Generate Tangents: ON
  Skins > Skin: ON
  Skins > BlendShape: ON
  Materials > Location: Mesh
  ```

### 2. Animation Retargeting
- Import from Mixamo as BVH
- Add AnimationTree to character
- Create BlendSpace2D for locomotion (0=Idle, 1=Walk, 2=Run, 3=Sprint)
- Add state machine overlays for Attack/Reload/Emotes

### 3. PBR Texture Setup
- Place textures in: `assets/textures/characters/[character_name]/`
- Required channels:
  - `_Albedo.png` (sRGB color)
  - `_Normal.png` (linear, DirectX format)
  - `_Metallic.png` (grayscale, linear)
  - `_Roughness.png` (grayscale, linear)
  - `_AO.png` (ambient occlusion)
  - `_Emission.png` (optional, for neon)

### 4. Weapon + Vehicle Import
- Same glTF 2.0 + PBR workflow
- Vehicles need `VehicleBody3D` setup with wheels
- Weapons need animated moving parts (slide, bolt)

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] All autoloads registered in `project.godot`
- [ ] WorldEnvironment values tuned in `TheFoyer.tscn`
- [ ] AnimationTree exported with state machine
- [ ] PBR materials applied to player prefab
- [ ] Portal destinations registered in ShardPortalManager
- [ ] Store inventory configured in StoreUI.gd
- [ ] Off-platform wallet addresses set (seller, community treasury)
- [ ] CivicFeed initialized with placeholder posts
- [ ] Audio buses created (Music, SFX, Ambient)
- [ ] ENet MultiplayerAPI configured
- [ ] Export to HTML5 → `/frontend/public/foyer-dist/`
- [ ] Frontend React component updated to load `/foyer-dist/index.html`

---

## 🔧 PERFORMANCE OPTIMIZATION TARGETS

- **Target FPS**: 60+ on mid-range hardware
- **Draw calls**: < 2000 per frame
- **Memory**: < 2GB RAM usage

### Key Optimizations:
```
1. LOD System:
   - 3 LOD levels for characters (15m, 40m, 80m)
   - Mid-poly avatars vs high-poly close-up

2. Instancing:
   - MultiMeshInstance3D for palm trees, crates, drones
   - Shared material for all UI elements

3. Physics:
   - Use CharacterBody3D + shape queries (avoid RigidBody per NPC)
   - Gravity + RayQuery for terrain/wall detection

4. SDFGI:
   - Reduce trace_steps to 20 on low-end hardware
   - Reduce cascade_count to 2

5. Particles:
   - GPUParticles3D with max_draw_passes=1
   - Cull by distance > 80m
```

---

## 🎯 NEXT STEPS FOR IMPLEMENTATION

1. **Asset Pack Acquisition**
   - Purchase/license MetaHuman characters
   - Get AAA weapon + vehicle models
   - Acquire skyscraper + street asset library

2. **Backend Integration**
   - Setup ENet multiplayer server (authoritative)
   - Connect to CivicVerse smart contracts
   - Setup blockchain wallet polling service

3. **Frontend Integration**
   - Update React component to load `/foyer-dist/`
   - Connect JavaScriptBridge for wallet integration
   - Setup event listener for CivicID updates

4. **Testing & Deployment**
   - Run dedicated client test (2+ connected players)
   - Test shard travel with state carryover
   - Verify off-platform wallet UI flow
   - Load test battle royale with 32 players

---

## 📞 CRITICAL REMINDERS

✅ **NO FUNDS THROUGH GAME** - All transactions strictly on-chain, off-platform
✅ **PBR ONLY** - No cell-shading, no blocky assets (AAA quality only)
✅ **SMOOTH ANIMATIONS** - AnimationTree blending for all movement states
✅ **REALISTIC PHYSICS** - Inertia, suspension, rotation, friction
✅ **SDFGI + VOLUMETRIC FOG** - Premium lighting for neon tropical night mood
✅ **SEAMLESS SHARD TRAVEL** - Full state carryover, instant loading
✅ **HIGH PERFORMANCE** - 60+ FPS even with volumetric fog enabled

---

**Version**: 1.0 | **Date**: April 3, 2026 | **Godot**: 4.3+
