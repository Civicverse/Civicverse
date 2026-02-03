import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Users } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
export function FPSGamePage() {
    const navigate = useNavigate();
    const gameContainerRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const sceneRef = useRef(null);
    const worldRef = useRef(null);
    const playerBodyRef = useRef(null);
    const playerMeshRef = useRef(null);
    const enemiesRef = useRef([]);
    const carsRef = useRef([]);
    const bulletsRef = useRef([]);
    const keysPressed = useRef({});
    const audioContextRef = useRef(null);
    const { user, wallet, payoutGambling, updateWallet } = useGameStore();
    const [gameState, setGameState] = useState({
        health: 100,
        ammo: 120,
        kills: 0,
        bettedAmount: Math.min(100, wallet?.balance || 100),
        gameActive: false,
        winner: null,
        prizePool: 0,
    });
    const [chatMessages, setChatMessages] = useState([
        {
            id: '1',
            author: 'StreetLegend',
            text: '🚗 Just scored 750 CIVIC in the downtown circuit!',
            timestamp: '2m ago',
            avatar: '🏙️',
        },
        {
            id: '2',
            author: 'NeonHunter',
            text: '⚡ That synthwave track is 🔥 perfect ambiance',
            timestamp: '5m ago',
            avatar: '🎵',
        },
        {
            id: '3',
            author: 'CityRogue',
            text: '🌃 Anyone else loving the new city vibe? Way better',
            timestamp: '8m ago',
            avatar: '🌆',
        },
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [showBetModal, setShowBetModal] = useState(true);
    const [selectedBet, setSelectedBet] = useState(100);
    const [showGameOver, setShowGameOver] = useState(false);
    const [gameOverData, setGameOverData] = useState(null);
    // Play synthwave music
    useEffect(() => {
        if (!gameState.gameActive)
            return;
        const playBackgroundMusic = () => {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const audioCtx = new AudioContext();
                audioContextRef.current = audioCtx;
                const now = audioCtx.currentTime;
                const baseFreq = 55;
                const bassOsc = audioCtx.createOscillator();
                bassOsc.type = 'sine';
                bassOsc.frequency.setValueAtTime(baseFreq, now);
                const bassGain = audioCtx.createGain();
                bassGain.gain.setValueAtTime(0.3, now);
                bassOsc.connect(bassGain);
                bassGain.connect(audioCtx.destination);
                const dryGain = audioCtx.createGain();
                const delayNode = audioCtx.createDelay();
                delayNode.delayTime.value = 0.5;
                const delayGain = audioCtx.createGain();
                delayGain.gain.setValueAtTime(0.4, now);
                dryGain.connect(delayNode);
                delayNode.connect(delayGain);
                delayGain.connect(audioCtx.destination);
                const synthOsc = audioCtx.createOscillator();
                synthOsc.type = 'square';
                const synthGain = audioCtx.createGain();
                synthGain.gain.setValueAtTime(0.15, now);
                synthOsc.connect(synthGain);
                synthGain.connect(dryGain);
                const beatFrequencies = [220, 220, 330, 220, 330, 330, 220, 220];
                let beatIndex = 0;
                const beatInterval = setInterval(() => {
                    if (audioCtx.state === 'running') {
                        synthOsc.frequency.setValueAtTime(beatFrequencies[beatIndex % beatFrequencies.length], audioCtx.currentTime);
                        beatIndex++;
                    }
                }, 300);
                bassOsc.start(now);
                synthOsc.start(now);
                return () => {
                    clearInterval(beatInterval);
                    try {
                        bassOsc.stop();
                        synthOsc.stop();
                    }
                    catch (e) { }
                };
            }
            catch (e) {
                console.log('Audio context failed:', e);
            }
        };
        playBackgroundMusic();
    }, [gameState.gameActive]);
    useEffect(() => {
        if (!gameContainerRef.current || !gameState.gameActive)
            return;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0e27);
        scene.fog = new THREE.Fog(0x0a0e27, 200, 1000);
        sceneRef.current = scene;
        const camera = new THREE.PerspectiveCamera(75, gameContainerRef.current.clientWidth / gameContainerRef.current.clientHeight, 0.1, 1000);
        camera.position.set(0, 4, 8);
        cameraRef.current = camera;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(gameContainerRef.current.clientWidth, gameContainerRef.current.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        gameContainerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;
        const world = new CANNON.World();
        world.defaultContactMaterial.friction = 0.4;
        world.gravity.set(0, -9.82, 0);
        worldRef.current = world;
        const ambientLight = new THREE.AmbientLight(0x00d4ff, 0.3);
        scene.add(ambientLight);
        const pinkLight = new THREE.PointLight(0xff006e, 2, 100);
        pinkLight.position.set(-50, 30, 0);
        scene.add(pinkLight);
        const cyanLight = new THREE.PointLight(0x00d4ff, 2, 100);
        cyanLight.position.set(50, 30, 0);
        scene.add(cyanLight);
        const streetLights = [
            { pos: [30, 15, -30], color: 0xffff00 },
            { pos: [-30, 15, -30], color: 0x00ffff },
            { pos: [30, 15, 30], color: 0xff00ff },
            { pos: [-30, 15, 30], color: 0xffff00 },
        ];
        streetLights.forEach(light => {
            const streetLight = new THREE.PointLight(light.color, 1.5, 80);
            streetLight.position.set(light.pos[0], light.pos[1], light.pos[2]);
            scene.add(streetLight);
        });
        // Create grid texture for ground
        const createGridTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, 256, 256);
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 1;
            for (let i = 0; i < 256; i += 32) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, 256);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(256, i);
                ctx.stroke();
            }
            return new THREE.CanvasTexture(canvas);
        };
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            metalness: 0.2,
            roughness: 0.8,
            map: createGridTexture(),
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        world.addBody(groundBody);
        // Create player mesh (cell-shaded character)
        const createPlayerMesh = () => {
            const group = new THREE.Group();
            const bodyGeom = new THREE.BoxGeometry(0.6, 1.5, 0.4);
            const bodyMat = new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                metalness: 0.6,
                roughness: 0.3,
                emissive: 0x00aaaa,
                emissiveIntensity: 0.2,
            });
            const body = new THREE.Mesh(bodyGeom, bodyMat);
            body.castShadow = true;
            group.add(body);
            const headGeom = new THREE.BoxGeometry(0.5, 0.6, 0.5);
            const headMat = new THREE.MeshStandardMaterial({
                color: 0xffaa00,
                metalness: 0.5,
                roughness: 0.4,
            });
            const head = new THREE.Mesh(headGeom, headMat);
            head.position.y = 1.1;
            head.castShadow = true;
            group.add(head);
            const armGeom = new THREE.BoxGeometry(0.25, 1.2, 0.25);
            const armMat = new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                metalness: 0.4,
                roughness: 0.5,
            });
            const leftArm = new THREE.Mesh(armGeom, armMat);
            leftArm.position.set(-0.5, 0.5, 0);
            leftArm.castShadow = true;
            group.add(leftArm);
            const rightArm = leftArm.clone();
            rightArm.position.x = 0.5;
            group.add(rightArm);
            return group;
        };
        const playerMesh = createPlayerMesh();
        playerMesh.position.set(0, 2, 0);
        scene.add(playerMesh);
        playerMeshRef.current = playerMesh;
        const playerShape = new CANNON.Sphere(0.5);
        const playerBody = new CANNON.Body({
            mass: 1,
            shape: playerShape,
            linearDamping: 0.3,
            angularDamping: 0.3,
        });
        playerBody.position.set(0, 2, 0);
        world.addBody(playerBody);
        playerBodyRef.current = playerBody;
        // Buildings
        const buildingMaterial = new THREE.MeshStandardMaterial({
            color: 0x0f1a3a,
            metalness: 0.2,
            roughness: 0.8,
            emissive: 0x001f4d,
            emissiveIntensity: 0.3,
        });
        const createBuilding = (x, z, width, height, depth) => {
            const geom = new THREE.BoxGeometry(width, height, depth);
            const mesh = new THREE.Mesh(geom, buildingMaterial);
            mesh.position.set(x, height / 2, z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            const windowGeom = new THREE.BoxGeometry(0.8, 0.8, 0.1);
            const windowMaterials = [
                new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.8 }),
                new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.8 }),
                new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 0.8 }),
            ];
            for (let y = 1; y < height - 1; y += 1.5) {
                for (let x = -width / 2 + 1; x < width / 2; x += 1.5) {
                    const window = new THREE.Mesh(windowGeom, windowMaterials[Math.floor(Math.random() * 3)]);
                    window.position.set(x, y, depth / 2 + 0.05);
                    mesh.add(window);
                }
            }
            const buildingShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
            const buildingBody = new CANNON.Body({ mass: 0 });
            buildingBody.addShape(buildingShape);
            buildingBody.position.set(x, height / 2, z);
            world.addBody(buildingBody);
        };
        createBuilding(-60, -60, 30, 25, 25);
        createBuilding(60, -60, 35, 30, 25);
        createBuilding(-60, 60, 25, 20, 30);
        createBuilding(60, 60, 30, 28, 25);
        createBuilding(0, -80, 20, 15, 15);
        createBuilding(-40, -40, 15, 18, 15);
        createBuilding(40, 40, 18, 22, 18);
        // Create cars (moving obstacles)
        const createCar = () => {
            const carGroup = new THREE.Group();
            const bodyGeom = new THREE.BoxGeometry(2, 1, 4);
            const carMaterial = new THREE.MeshStandardMaterial({
                color: Math.random() > 0.5 ? 0xff006e : 0x00d4ff,
                metalness: 0.8,
                roughness: 0.2,
            });
            const carBody = new THREE.Mesh(bodyGeom, carMaterial);
            carBody.castShadow = true;
            carGroup.add(carBody);
            const windowGeom = new THREE.BoxGeometry(1.8, 0.8, 1.2);
            const windowMat = new THREE.MeshStandardMaterial({
                color: 0x003366,
                metalness: 0.9,
                roughness: 0.1,
            });
            const window1 = new THREE.Mesh(windowGeom, windowMat);
            window1.position.z = -0.5;
            carGroup.add(window1);
            const window2 = window1.clone();
            window2.position.z = 0.5;
            carGroup.add(window2);
            const wheelGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
            const wheelMat = new THREE.MeshStandardMaterial({
                color: 0x222222,
                metalness: 0.4,
                roughness: 0.8,
            });
            const wheelPositions = [
                [-0.8, -0.5, -1],
                [0.8, -0.5, -1],
                [-0.8, -0.5, 1],
                [0.8, -0.5, 1],
            ];
            wheelPositions.forEach(pos => {
                const wheel = new THREE.Mesh(wheelGeom, wheelMat);
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(pos[0], pos[1], pos[2]);
                carGroup.add(wheel);
            });
            carGroup.position.set(Math.random() * 100 - 50, 1, Math.random() * 100 - 50);
            const carShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
            const carPhysicsBody = new CANNON.Body({
                mass: 5,
                shape: carShape,
                linearDamping: 0.1,
            });
            carPhysicsBody.position.copy(carGroup.position);
            carPhysicsBody.velocity.set(Math.random() * 10 - 5, 0, Math.random() * 10 - 5);
            world.addBody(carPhysicsBody);
            scene.add(carGroup);
            return {
                mesh: carGroup,
                body: carPhysicsBody,
                life: 30,
            };
        };
        for (let i = 0; i < 3; i++) {
            carsRef.current.push(createCar());
        }
        // Hostile bots removed per user request: no enemy spawning in sandbox mode.
        let mouseX = 0;
        let mouseY = 0;
        let cameraDistance = 6;
        const onMouseMove = (e) => {
            mouseX += e.movementX * 0.003;
            mouseY += e.movementY * 0.003;
            mouseY = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, mouseY));
        };
        const onKeyDown = (e) => {
            const key = e.key.toLowerCase();
            keysPressed.current[key] = true;
            if (e.key === ' ') {
                e.preventDefault();
                playerBody.velocity.y = 12;
            }
            if (key === 'c') {
                e.preventDefault();
                const direction = new THREE.Vector3();
                camera.getWorldDirection(direction);
                direction.x += (Math.random() - 0.5) * 0.05;
                direction.y += (Math.random() - 0.5) * 0.05;
                direction.z += (Math.random() - 0.5) * 0.05;
                direction.normalize();
                const bulletGeometry = new THREE.SphereGeometry(0.08, 6, 6);
                const bulletMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffff00,
                    emissive: 0xffff00,
                    emissiveIntensity: 0.8,
                });
                const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
                bulletMesh.position.copy(playerMesh.position);
                scene.add(bulletMesh);
                const bulletBody = new CANNON.Body({
                    mass: 0.05,
                    shape: new CANNON.Sphere(0.08),
                });
                bulletBody.position.copy(playerBody.position);
                bulletBody.velocity.set(direction.x * 60, direction.y * 60, direction.z * 60);
                world.addBody(bulletBody);
                bulletsRef.current.push({
                    mesh: bulletMesh,
                    body: bulletBody,
                    life: 4,
                });
                setGameState((prev) => ({
                    ...prev,
                    ammo: Math.max(0, prev.ammo - 1),
                }));
                if (gameState.ammo <= 1) {
                    endGame();
                }
            }
        };
        const onKeyUp = (e) => {
            keysPressed.current[e.key.toLowerCase()] = false;
        };
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        renderer.domElement.addEventListener('click', () => {
            renderer.domElement.requestPointerLock =
                renderer.domElement.requestPointerLock || renderer.domElement.mozRequestPointerLock;
            renderer.domElement.requestPointerLock?.();
        });
        let animationId;
        const endGame = async () => {
            const winnings = gameState.kills * gameState.bettedAmount;
            // apply microtax and payout via store
            try {
                if (payoutGambling && wallet?.address) {
                    await payoutGambling(wallet.address, winnings);
                }
            }
            catch (err) {
                console.error('payout error', err);
            }
            setShowGameOver(true);
            setGameOverData({
                kills: gameState.kills,
                betAmount: gameState.bettedAmount,
                winnings,
            });
            cancelAnimationFrame(animationId);
        };
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            world.step(1 / 60);
            const speed = 25;
            const forward = new THREE.Vector3();
            const right = new THREE.Vector3();
            forward.set(Math.sin(mouseX), 0, Math.cos(mouseX));
            right.set(Math.cos(mouseX), 0, -Math.sin(mouseX));
            const vel = new CANNON.Vec3(0, playerBody.velocity.y, 0);
            if (keysPressed.current['w']) {
                vel.x += forward.x * speed;
                vel.z += forward.z * speed;
            }
            if (keysPressed.current['s']) {
                vel.x -= forward.x * speed;
                vel.z -= forward.z * speed;
            }
            if (keysPressed.current['d']) {
                vel.x += right.x * speed;
                vel.z += right.z * speed;
            }
            if (keysPressed.current['a']) {
                vel.x -= right.x * speed;
                vel.z -= right.z * speed;
            }
            if (keysPressed.current['q']) {
                vel.x -= right.x * speed * 0.7;
                vel.z -= right.z * speed * 0.7;
            }
            if (keysPressed.current['e']) {
                vel.x += right.x * speed * 0.7;
                vel.z += right.z * speed * 0.7;
            }
            playerBody.velocity.x = vel.x;
            playerBody.velocity.z = vel.z;
            playerMesh.position.copy(playerBody.position);
            const cameraOffset = new THREE.Vector3();
            cameraOffset.x = Math.sin(mouseX) * cameraDistance * Math.cos(mouseY);
            cameraOffset.y = 4 + Math.sin(mouseY) * cameraDistance;
            cameraOffset.z = Math.cos(mouseX) * cameraDistance * Math.cos(mouseY);
            camera.position.lerp(new THREE.Vector3(playerBody.position.x + cameraOffset.x, playerBody.position.y + cameraOffset.y, playerBody.position.z + cameraOffset.z), 0.1);
            camera.lookAt(playerBody.position.x, playerBody.position.y + 1, playerBody.position.z);
            carsRef.current.forEach((car) => {
                car.mesh.position.copy(car.body.position);
                car.mesh.quaternion.copy(car.body.quaternion);
                if (Math.abs(car.body.position.x) > 100 || Math.abs(car.body.position.z) > 100) {
                    car.body.velocity.x *= -1;
                    car.body.velocity.z *= -1;
                }
            });
            // Hostile AI disabled — no enemy movement or shooting.
            const now = Date.now();
            bulletsRef.current = bulletsRef.current.filter((bullet) => {
                bullet.life -= 1 / 60;
                bullet.mesh.position.copy(bullet.body.position);
                if (bullet.life <= 0) {
                    scene.remove(bullet.mesh);
                    world.removeBody(bullet.body);
                    return false;
                }
                // No enemy collisions in sandbox mode; bullets only persist until lifetime ends.
                return true;
            });
            if (gameState.health <= 0) {
                endGame();
            }
            renderer.render(scene, camera);
        };
        animate();
        return () => {
            renderer.domElement.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            cancelAnimationFrame(animationId);
            if (gameContainerRef.current && renderer.domElement.parentNode === gameContainerRef.current) {
                gameContainerRef.current.removeChild(renderer.domElement);
            }
        };
    }, [gameState.gameActive, gameState.health, gameState.ammo]);
    const handleSendMessage = () => {
        if (!newMessage.trim())
            return;
        setChatMessages([
            {
                id: String(Date.now()),
                author: user?.username || 'Player',
                text: newMessage,
                timestamp: 'now',
                avatar: '🏙️',
            },
            ...chatMessages,
        ]);
        setNewMessage('');
    };
    const startGame = () => {
        setShowBetModal(false);
        setGameState((prev) => ({
            ...prev,
            gameActive: true,
            bettedAmount: selectedBet,
        }));
        // Deduct bet from local wallet immediately
        if (wallet && updateWallet) {
            updateWallet({ balance: Math.max(0, wallet.balance - selectedBet) });
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-black flex flex-col overflow-hidden", children: [_jsxs("div", { className: "bg-gradient-to-r from-black via-gray-900 to-black border-b-4 border-cyan-500 p-4 flex justify-between items-center", children: [_jsxs(motion.button, { whileHover: { scale: 1.05 }, onClick: () => navigate('/foyer'), className: "flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-black text-lg", children: [_jsx(ArrowLeft, { className: "w-5 h-5" }), "EXIT ARENA"] }), _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl font-black text-cyan-400 tracking-wider", children: "NEON CITY COMBAT" }), _jsx("p", { className: "text-xs text-gray-400 font-mono", children: "STREET WARFARE \u2022 P2P BETTING \u2022 SYNTHWAVE" })] }), _jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "text-cyan-400 font-black", children: ["BALANCE: ", wallet?.balance?.toFixed(1), " CIVIC"] }), _jsx("div", { className: "text-xs text-gray-400", children: "WALLET STATUS: ACTIVE" })] })] }), _jsxs("div", { className: "flex-1 flex gap-4 p-4 overflow-hidden", children: [_jsxs("div", { className: "flex-1 min-w-0 flex flex-col", children: [_jsxs("div", { ref: gameContainerRef, className: "relative flex-1 bg-black border-4 border-cyan-500 rounded-lg overflow-hidden", children: [gameState.gameActive && (_jsxs("div", { className: "absolute inset-0 pointer-events-none", children: [_jsx("div", { className: "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20", children: _jsxs("div", { className: "w-8 h-8 border-2 border-cyan-400", children: [_jsx("div", { className: "absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0.5 h-2 bg-cyan-400" }), _jsx("div", { className: "absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-0.5 h-2 bg-cyan-400" }), _jsx("div", { className: "absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-0.5 bg-cyan-400" }), _jsx("div", { className: "absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1 w-2 h-0.5 bg-cyan-400" })] }) }), _jsxs("div", { className: "absolute top-4 left-4 right-4 flex justify-between text-cyan-400 font-mono text-sm", children: [_jsxs("div", { className: "border-2 border-cyan-400 px-3 py-2 bg-black/50", children: [_jsx("div", { className: "text-xs text-gray-400", children: "HEALTH" }), _jsxs("div", { className: "text-lg font-black", children: [gameState.health, "%"] }), _jsx("div", { className: "w-32 h-2 bg-gray-800 border border-cyan-400 mt-1", children: _jsx("div", { className: "h-full bg-cyan-400 transition-all", style: { width: `${gameState.health}%` } }) })] }), _jsxs("div", { className: "border-2 border-cyan-400 px-3 py-2 bg-black/50 text-center", children: [_jsx("div", { className: "text-xs text-gray-400", children: "KILLS" }), _jsx("div", { className: "text-2xl font-black", children: gameState.kills })] }), _jsxs("div", { className: "border-2 border-cyan-400 px-3 py-2 bg-black/50", children: [_jsx("div", { className: "text-xs text-gray-400", children: "AMMO" }), _jsx("div", { className: "text-lg font-black", children: gameState.ammo })] })] }), _jsxs("div", { className: "absolute bottom-4 left-4 right-4 border-2 border-cyan-400 px-4 py-3 bg-black/50 text-cyan-400 font-mono text-xs", children: [_jsxs("div", { className: "flex justify-between", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-400", children: "BET:" }), " ", gameState.bettedAmount, " CIVIC"] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-400", children: "POT:" }), " ", gameState.bettedAmount * 2, " CIVIC"] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-400", children: "POTENTIAL WIN:" }), " +", gameState.kills * gameState.bettedAmount, " CIVIC"] })] }), _jsx("div", { className: "mt-2 text-gray-400 text-xs", children: "W/A/S/D MOVE | Q/E STRAFE | SPACE JUMP | C SHOOT | MOUSE AIM" })] })] })), !gameState.gameActive && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-4xl font-black text-cyan-400 mb-4", children: "ENTER THE STREETS" }), _jsx("div", { className: "text-gray-400 mb-8", children: "Place your bet and dominate the neon city..." })] }) }))] }), _jsxs("div", { className: "mt-4 bg-gradient-to-r from-black via-gray-900 to-black border-4 border-cyan-500 p-3 flex justify-around text-cyan-400 font-mono text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-400", children: "KILLS:" }), " ", gameState.kills] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-400", children: "HEALTH:" }), " ", gameState.health, "%"] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-400", children: "AMMO:" }), " ", gameState.ammo] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-400", children: "BET:" }), " ", gameState.bettedAmount, " CIVIC"] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-400", children: "POTENTIAL WIN:" }), " +", gameState.kills * gameState.bettedAmount, " CIVIC"] })] })] }), _jsxs("div", { className: "w-80 flex flex-col bg-gradient-to-b from-gray-900 via-black to-gray-900 border-4 border-cyan-500 rounded-lg overflow-hidden", children: [_jsxs("div", { className: "bg-black border-b-4 border-cyan-500 p-3", children: [_jsxs("h2", { className: "text-cyan-400 font-black text-sm flex items-center gap-2", children: [_jsx(Users, { className: "w-4 h-4" }), " STREET NETWORK"] }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: "LIVE CITY CHAT" })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-3 space-y-3 min-h-0", children: chatMessages.map((msg) => (_jsxs(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, className: "border-l-2 border-cyan-400 pl-2 py-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "text-xl", children: msg.avatar }), _jsx("span", { className: "text-cyan-400 font-mono text-xs font-bold", children: msg.author }), _jsx("span", { className: "text-gray-600 text-xs ml-auto", children: msg.timestamp })] }), _jsx("p", { className: "text-gray-300 text-xs leading-relaxed", children: msg.text })] }, msg.id))) }), _jsx("div", { className: "bg-black border-t-4 border-cyan-500 p-3", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: newMessage, onChange: (e) => setNewMessage(e.target.value), onKeyPress: (e) => e.key === 'Enter' && handleSendMessage(), placeholder: "Message...", className: "flex-1 bg-gray-900 border-2 border-cyan-500 text-cyan-400 text-xs px-2 py-1 rounded focus:outline-none focus:border-cyan-300 placeholder-gray-600" }), _jsx(motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, onClick: handleSendMessage, className: "bg-cyan-500 hover:bg-cyan-400 text-black p-2 rounded transition font-bold", children: _jsx(Send, { className: "w-4 h-4" }) })] }) }), _jsxs("div", { className: "bg-black border-t-4 border-cyan-500 p-3 text-xs", children: [_jsx("h3", { className: "text-cyan-400 font-black mb-2", children: "STREET LEGENDS" }), _jsx("div", { className: "space-y-1", children: [
                                            { name: 'StreetLegend', kills: 52, bet: 300 },
                                            { name: 'NeonHunter', kills: 39, bet: 200 },
                                            { name: 'CityRogue', kills: 31, bet: 150 },
                                            { name: 'SynthWaveKid', kills: 24, bet: 100 },
                                        ].map((player) => (_jsxs("div", { className: "flex justify-between text-gray-400 border-b border-gray-800 pb-1", children: [_jsx("span", { className: "text-cyan-400 font-mono", children: player.name }), _jsxs("span", { children: [player.kills, " kills \u2022 ", player.bet, "\u20B5"] })] }, player.name))) })] })] })] }), _jsx(AnimatePresence, { children: showBetModal && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50", children: _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, className: "bg-gradient-to-b from-gray-900 to-black border-4 border-cyan-500 p-8 rounded-lg max-w-md w-full", children: [_jsx("h2", { className: "text-2xl font-black text-cyan-400 mb-4", children: "PLACE YOUR BET" }), _jsxs("div", { className: "mb-6 p-4 border-2 border-cyan-500 bg-black/50 rounded", children: [_jsx("div", { className: "text-gray-400 text-sm mb-2", children: "AVAILABLE BALANCE" }), _jsxs("div", { className: "text-2xl font-black text-cyan-400", children: [wallet?.balance?.toFixed(1), " CIVIC"] })] }), _jsx("div", { className: "space-y-3 mb-6", children: [50, 100, 250, 500].map((amount) => (_jsxs(motion.button, { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, onClick: () => setSelectedBet(amount), className: `w-full p-3 border-2 rounded transition font-bold ${selectedBet === amount
                                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400'
                                        : 'border-gray-600 bg-gray-900 text-gray-400 hover:border-cyan-500'}`, children: ["BET ", amount, " CIVIC"] }, amount))) }), _jsxs("div", { className: "grid grid-cols-2 gap-2 mb-6 text-xs text-gray-400 font-mono", children: [_jsxs("div", { className: "border border-gray-600 p-2 rounded", children: [_jsx("div", { children: "POTENTIAL WIN" }), _jsx("div", { className: "text-cyan-400 font-bold", children: selectedBet })] }), _jsxs("div", { className: "border border-gray-600 p-2 rounded", children: [_jsx("div", { children: "IF YOU GET 10 KILLS" }), _jsxs("div", { className: "text-cyan-400 font-bold", children: ["+", selectedBet * 10] })] })] }), _jsx(motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, onClick: startGame, className: "w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black py-4 rounded-lg transition text-lg", children: "ENTER THE STREETS" }), _jsx("div", { className: "mt-4 text-xs text-gray-500 text-center", children: "WINNER TAKES ALL \u2022 NO RESPAWNS \u2022 DOMINATE THE CITY" })] }) })) }), _jsx(AnimatePresence, { children: showGameOver && gameOverData && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50", children: _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, className: "bg-gradient-to-b from-gray-900 to-black border-4 border-cyan-500 p-8 rounded-lg max-w-md w-full text-center", children: [_jsx("div", { className: "text-3xl mb-4", children: gameOverData.kills > 0 ? '🏆' : '💀' }), _jsx("h2", { className: "text-2xl font-black text-cyan-400 mb-6", children: gameOverData.kills > 0 ? 'STREET VICTORY' : 'DEFEATED' }), _jsxs("div", { className: "space-y-4 mb-8", children: [_jsxs("div", { className: "border-2 border-cyan-500 p-3 bg-black/50 rounded", children: [_jsx("div", { className: "text-gray-400 text-sm", children: "KILLS" }), _jsx("div", { className: "text-3xl font-black text-cyan-400", children: gameOverData.kills })] }), _jsxs("div", { className: "border-2 border-cyan-500 p-3 bg-black/50 rounded", children: [_jsx("div", { className: "text-gray-400 text-sm", children: "BET AMOUNT" }), _jsxs("div", { className: "text-2xl font-black text-cyan-400", children: [gameOverData.betAmount, " CIVIC"] })] }), _jsxs("div", { className: "border-4 border-yellow-500 p-4 bg-yellow-500/10 rounded", children: [_jsx("div", { className: "text-gray-400 text-sm", children: "TOTAL WINNINGS" }), _jsxs("div", { className: "text-4xl font-black text-yellow-400", children: ["+", gameOverData.winnings, " CIVIC"] })] })] }), _jsx(motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, onClick: () => {
                                    setShowBetModal(true);
                                    setShowGameOver(false);
                                    setGameState({
                                        health: 100,
                                        ammo: 120,
                                        kills: 0,
                                        bettedAmount: selectedBet,
                                        gameActive: false,
                                        winner: null,
                                        prizePool: 0,
                                    });
                                }, className: "w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black py-3 rounded-lg transition mb-2", children: "PLAY AGAIN" }), _jsx(motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, onClick: () => navigate('/foyer'), className: "w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg transition", children: "Exit to Foyer" })] }) })) })] }));
}
