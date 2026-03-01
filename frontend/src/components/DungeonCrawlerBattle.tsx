import React, { useRef, useEffect, useState } from 'react';

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: 'player' | 'enemy';
  damage: number;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  shootCooldown: number;
  patrolDirection: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'health' | 'ammo' | 'damage' | 'shield';
  width: number;
  height: number;
}

interface ChatMessage {
  id: number;
  text: string;
  timestamp: number;
}

interface Room {
  x: number;
  y: number;
  enemies: Enemy[];
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  ammo: number;
  kills: number;
  shield: number;
  damageMult: number;
}

export const DungeonCrawlerBattle: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [winner, setWinner] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messageIdRef = useRef(0);

  const gameRef = useRef({
    player: {
      x: 400,
      y: 300,
      width: 30,
      height: 30,
      health: 100,
      maxHealth: 100,
      ammo: 30,
      kills: 0,
      shield: 0,
      damageMult: 1,
    } as Player,
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    powerUps: [] as PowerUp[],
    rooms: [] as Room[],
    currentRoom: { x: 1, y: 1 },
    gameTime: 0,
    gameOver: false,
    keys: {} as Record<string, boolean>,
    mouseX: 0,
    mouseY: 0,
    audioContext: null as AudioContext | null,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const game = gameRef.current;
    game.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const initializeGame = () => {
      game.rooms = [];
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const room: Room = {
            x,
            y,
            enemies: [],
          };
          for (let i = 0; i < 3; i++) {
            room.enemies.push({
              x: x * 800 + 150 + Math.random() * 300,
              y: y * 600 + 150 + Math.random() * 300,
              width: 25,
              height: 25,
              health: 30,
              maxHealth: 30,
              shootCooldown: 0,
              patrolDirection: Math.random() > 0.5 ? 1 : -1,
            });
          }
          game.rooms.push(room);
        }
      }
      game.enemies = game.rooms[4].enemies;
    };

    initializeGame();

    const keyDownHandler = (e: KeyboardEvent) => {
      game.keys[e.key.toLowerCase()] = true;
    };

    const keyUpHandler = (e: KeyboardEvent) => {
      game.keys[e.key.toLowerCase()] = false;
    };

    const mouseMoveHandler = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      game.mouseX = e.clientX - rect.left;
      game.mouseY = e.clientY - rect.top;
    };

    const clickHandler = () => {
      if (game.player.ammo <= 0 || game.gameOver) return;

      const dx = game.mouseX - game.player.x;
      const dy = game.mouseY - game.player.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0) {
        game.projectiles.push({
          x: game.player.x + game.player.width / 2,
          y: game.player.y + game.player.height / 2,
          vx: (dx / dist) * 8,
          vy: (dy / dist) * 8,
          owner: 'player',
          damage: 10 * game.player.damageMult,
        });
        game.player.ammo--;
        playShotSound(game.audioContext!);
      }
    };

    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);
    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('click', clickHandler);

    const gameLoop = () => {
      if (game.gameOver) return;

      game.gameTime++;

      const speed = 5;
      if (game.keys['w'] || game.keys['arrowup']) game.player.y -= speed;
      if (game.keys['s'] || game.keys['arrowdown']) game.player.y += speed;
      if (game.keys['a'] || game.keys['arrowleft']) game.player.x -= speed;
      if (game.keys['d'] || game.keys['arrowright']) game.player.x += speed;

      game.player.x = Math.max(0, Math.min(game.player.x, canvas.width - game.player.width));
      game.player.y = Math.max(0, Math.min(game.player.y, canvas.height - game.player.height));

      game.enemies.forEach((enemy) => {
        enemy.shootCooldown--;
        enemy.x += enemy.patrolDirection * 1.5;

        if (enemy.x < 50 || enemy.x > canvas.width - 50) {
          enemy.patrolDirection *= -1;
        }

        if (enemy.shootCooldown <= 0 && Math.random() < 0.02) {
          const dx = game.player.x - enemy.x;
          const dy = game.player.y - enemy.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0) {
            game.projectiles.push({
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2,
              vx: (dx / dist) * 5,
              vy: (dy / dist) * 5,
              owner: 'enemy',
              damage: 8,
            });
            enemy.shootCooldown = 40;
            playShotSound(game.audioContext!);
          }
        }
      });

      game.projectiles = game.projectiles.filter((proj) => {
        proj.x += proj.vx;
        proj.y += proj.vy;

        let hit = false;

        if (proj.owner === 'player') {
          game.enemies.forEach((enemy, idx) => {
            if (
              proj.x > enemy.x &&
              proj.x < enemy.x + enemy.width &&
              proj.y > enemy.y &&
              proj.y < enemy.y + enemy.height
            ) {
              enemy.health -= proj.damage;
              if (enemy.health <= 0) {
                game.enemies.splice(idx, 1);
                game.player.kills++;

                if (Math.random() < 0.5) {
                  const powerUpType = (
                    ['health', 'ammo', 'damage', 'shield'] as const
                  )[Math.floor(Math.random() * 4)];
                  game.powerUps.push({
                    x: enemy.x,
                    y: enemy.y,
                    type: powerUpType,
                    width: 20,
                    height: 20,
                  });
                }
              }
              hit = true;
            }
          });
        } else {
          if (
            proj.x > game.player.x &&
            proj.x < game.player.x + game.player.width &&
            proj.y > game.player.y &&
            proj.y < game.player.y + game.player.height
          ) {
            if (game.player.shield > 0) {
              game.player.shield -= proj.damage;
            } else {
              game.player.health -= proj.damage;
            }
            hit = true;
          }
        }

        return !hit && proj.x > -10 && proj.x < canvas.width + 10 && proj.y > -10 && proj.y < canvas.height + 10;
      });

      game.powerUps = game.powerUps.filter((powerUp) => {
        if (
          game.player.x < powerUp.x + powerUp.width &&
          game.player.x + game.player.width > powerUp.x &&
          game.player.y < powerUp.y + powerUp.height &&
          game.player.y + game.player.height > powerUp.y
        ) {
          if (powerUp.type === 'health') {
            game.player.health = Math.min(game.player.maxHealth, game.player.health + 25);
          } else if (powerUp.type === 'ammo') {
            game.player.ammo += 20;
          } else if (powerUp.type === 'damage') {
            game.player.damageMult += 0.1;
          } else if (powerUp.type === 'shield') {
            game.player.shield += 50;
          }
          return false;
        }
        return true;
      });

      if (game.enemies.length === 0 && game.gameTime % 200 === 0 && game.gameTime > 0) {
        const room = game.rooms[Math.floor(Math.random() * game.rooms.length)];
        for (let i = 0; i < 4; i++) {
          room.enemies.push({
            x: Math.random() * (canvas.width - 50) + 25,
            y: Math.random() * (canvas.height - 50) + 25,
            width: 25,
            height: 25,
            health: 30 + game.player.kills,
            maxHealth: 30 + game.player.kills,
            shootCooldown: 0,
            patrolDirection: Math.random() > 0.5 ? 1 : -1,
          });
        }
        game.enemies = room.enemies;
      }

      if (game.player.health <= 0) {
        game.gameOver = true;
        setGameState('gameOver');
        setWinner(`GAME OVER - Kills: ${game.player.kills}`);
      }

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#444477';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 267, 0);
        ctx.lineTo(i * 267, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * 200);
        ctx.lineTo(canvas.width, i * 200);
        ctx.stroke();
      }

      ctx.fillStyle = '#00ff00';
      ctx.fillRect(game.player.x, game.player.y, game.player.width, game.player.height);

      ctx.fillStyle = '#ff1493';
      game.enemies.forEach((enemy) => {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        ctx.fillStyle = '#ff0000';
        const healthBarWidth = (enemy.health / enemy.maxHealth) * enemy.width;
        ctx.fillRect(enemy.x, enemy.y - 8, healthBarWidth, 4);
        ctx.fillStyle = '#ff1493';
      });

      ctx.fillStyle = '#ffff00';
      game.projectiles.forEach((proj) => {
        ctx.fillRect(proj.x - 2, proj.y - 2, 4, 4);
      });

      game.powerUps.forEach((powerUp) => {
        const colors: Record<string, string> = {
          health: '#ff6666',
          ammo: '#66ff66',
          damage: '#ffaa00',
          shield: '#0099ff',
        };
        ctx.fillStyle = colors[powerUp.type];
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
      });

      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText(`Health: ${Math.max(0, Math.floor(game.player.health))}/${game.player.maxHealth}`, 10, 25);
      ctx.fillText(`Ammo: ${game.player.ammo}`, 10, 50);
      ctx.fillText(`Kills: ${game.player.kills}`, 10, 75);
      ctx.fillText(`Shield: ${Math.floor(game.player.shield)}`, 10, 100);
      ctx.fillText(`Time: ${Math.floor(game.gameTime / 60)}s`, 10, 125);

      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(game.mouseX, game.mouseY, 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(game.mouseX - 8, game.mouseY);
      ctx.lineTo(game.mouseX + 8, game.mouseY);
      ctx.moveTo(game.mouseX, game.mouseY - 8);
      ctx.lineTo(game.mouseX, game.mouseY + 8);
      ctx.stroke();
    };

    const renderLoop = setInterval(gameLoop, 1000 / 60);

    return () => {
      window.removeEventListener('keydown', keyDownHandler);
      window.removeEventListener('keyup', keyUpHandler);
      canvas.removeEventListener('mousemove', mouseMoveHandler);
      canvas.removeEventListener('click', clickHandler);
      clearInterval(renderLoop);
    };
  }, []);

  const addChatMessage = () => {
    if (!inputValue.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        id: messageIdRef.current++,
        text: inputValue,
        timestamp: Date.now(),
      },
    ]);
    setInputValue('');
  };

  const playShotSound = (audioContext: AudioContext) => {
    try {
      const now = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      // Audio context may not be available
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px', height: '100vh' }}>
      <div style={{ flex: 1 }}>
        <h1>Dungeon Crawler Battle</h1>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{ border: '2px solid #00ff00', display: 'block', marginBottom: '10px' }}
        />
        <p style={{ fontSize: '12px', color: '#888' }}>
          Use WASD to move, click to shoot. Survive the dungeon!
        </p>
      </div>

      <div style={{ width: '300px', display: 'flex', flexDirection: 'column' }}>
        {gameState === 'gameOver' && (
          <div style={{
            background: '#1a1a2e',
            border: '2px solid #ff1493',
            padding: '20px',
            marginBottom: '20px',
            textAlign: 'center',
            color: '#ffff00',
            fontSize: '18px',
          }}>
            <h2>KING OF THE DUNGEON</h2>
            <p>{winner}</p>
          </div>
        )}

        <div style={{
          background: '#1a1a2e',
          border: '1px solid #00ff00',
          padding: '10px',
          borderRadius: '5px',
          overflowY: 'auto',
          height: '400px',
          marginBottom: '10px',
        }}>
          {chatMessages.map((msg) => (
            <div key={msg.id} style={{ fontSize: '12px', color: '#00ff00', marginBottom: '5px' }}>
              [{new Date(msg.timestamp).toLocaleTimeString()}] {msg.text}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '5px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addChatMessage()}
            placeholder="Chat message..."
            style={{
              flex: 1,
              padding: '8px',
              background: '#333',
              color: '#00ff00',
              border: '1px solid #00ff00',
              borderRadius: '3px',
            }}
          />
          <button
            onClick={addChatMessage}
            style={{
              padding: '8px 15px',
              background: '#00ff00',
              color: '#1a1a2e',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
