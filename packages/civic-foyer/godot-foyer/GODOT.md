# CivicVerse Foyer (Godot 4.3+)

This is the immersive 3D hub for CivicVerse. It is designed to be exported for web and embedded within the React frontend.

## 📁 Structure
- `/scenes`: TSCN files (Player, Main World, UI).
- `/scripts`: GDScript logic for character movement, JS bridge, and multiplayer.
- `/assets`: 3D models and textures (to be populated).

## 🚀 Character System
- **Avatar Customization**: Uses `JavaScriptBridge` to read CivicID data (username, trust score, customization JSON).
- **Controller**: Smooth third-person movement with WASD and mouse look.
- **Visuals**: Place 3D humanoid models in `res://assets/models/` and link them in `Player.tscn`.

## 🌍 Environment
- **Lobby City Plaza**: Urban square with:
  - **Social Arena**: Area for chat and emotes.
  - **Universe Portal**: Door to exit/switch shards.
  - **Newsstand/Commerce**: Interaction placeholders.

## 🛠 Web Export Instructions
1. Open the project in **Godot 4.3+**.
2. Go to **Project -> Export**.
3. Add a **Web** preset.
4. Set the **Export Path** to `../frontend/public/foyer-dist/index.html`.
5. Ensure **Runnable** is checked.
6. Click **Export Project**.

## 🔗 JavaScript Integration
- **React to Godot**: `getCivicID()` returns the local identity from `useGameStore`.
- **Godot to React**: `exitFoyer()` triggers a tab switch in the React frontend.
- **Real-time Sync**: `update_identity` event (sent from React) updates the local player visual.
