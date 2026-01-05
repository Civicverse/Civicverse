# Character & NPC Specification

Overview
- Player avatar: single modular sprite/3D capsule with configurable skin, equipment slots (head, body, boots, accessory).
- Movement: top-down / isometric-style movement using WASD or arrow keys; physics are simple velocity-based with collision bounding sphere.

Player properties
- id: numeric
- displayName: string
- hp: integer (0-100)
- level: integer
- xp: integer
- inventory: array of item ids
- position: {x, y, z}

NPC roles
- Vendor: sells items, simple dialog tree, stationary.
- QuestGiver: provides quests, tracks completion per-player.
- PatrolGuard: moves along simple waypoint path, will warn or attack players with low reputation.
- Miner/ResourceNode: acts as a node which players interact with to gather resources (cooldown based).

Animation conventions
- Use additive micro-tweens for head/torso to provide life.
- NPCs should have idle, walk, interact, and receive-damage animations (looped when active).

Interaction model
- Click or press `E` near entity to interact.
- Interaction UI opens `WorldPanel` anchored to the entity with contextual actions.

Data flow
- Client: sends interaction intent to server, server authoritatively validates action, returns state update.

Notes
- Keep 3D geometry simple to avoid heavy GPU on clients.
- Use consistent coordinate system and units across systems.
