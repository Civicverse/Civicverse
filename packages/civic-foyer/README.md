# @civicverse/civic-foyer

The Foyer is the immersive 3D community hub for CivicVerse, built with Godot 4.3+ (NEON REIGN) and integrated with the React frontend.

## Structure

```
packages/civic-foyer/
├── godot-foyer/          # Godot 4.3+ project (NEON REIGN game)
├── src/                  # Backend service (Express.js)
├── Dockerfile            # Container configuration
└── package.json          # NPM scripts
```

## Building the Godot Game

Export the Godot foyer to Web:

```bash
npm run build:godot
```

This exports to `frontend/public/foyer-dist/index.html` for embedding in the React app.

## Running the Backend Service

```bash
npm run start:service
```

Starts the Express server on port 3007 for foyer-related APIs.

## Game Features

- **Avatar System**: Loads CivicID data from React frontend
- **Neon Visuals**: Hyper-realistic cell-shade shader with rim lighting
- **Portal System**: Navigate to different shards (mini-worlds)
- **Social Arena**: Chat, emotes, and community interactions
- **Multiplayer Ready**: WebSocket support for real-time player sync
- **Commerce & UBI**: P2P transactions and reputation system
