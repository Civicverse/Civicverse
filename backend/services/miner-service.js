const { spawn, execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'miner')
const CONFIG_PATH = path.join(DATA_DIR, 'xmrig.json')

try {
  fs.mkdirSync(DATA_DIR, { recursive: true })
} catch (e) {
  // ignore
}

let minerProcess = null
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
}

const parseXmrigLine = (line) => {
  // Example line: "speed 123.45 H/s" or "hashrate 1.23 kH/s"
  const hashMatch = line.match(/(speed|hashrate)\s+([0-9]+\.?[0-9]*)\s*([kMG]?H\/s)/i)
  if (hashMatch) {
    const value = Number(hashMatch[2])
    const unit = hashMatch[3].toUpperCase()
    const multiplier = unit.startsWith('K') ? 1e3 : unit.startsWith('M') ? 1e6 : unit.startsWith('G') ? 1e9 : 1
    return { hashRate: value * multiplier }
  }

  const accepted = line.match(/accepted\s+([0-9]+)/i)
  const rejected = line.match(/rejected\s+([0-9]+)/i)
  return {
    accepted: accepted ? Number(accepted[1]) : null,
    rejected: rejected ? Number(rejected[1]) : null,
  }
}

const saveConfig = (config) => {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
    status.config = config
  } catch (e) {
    status.error = `failed to save config: ${e.message}`
  }
}

const loadConfig = () => {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return null
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

const getCpuTemp = () => {
  try {
    const basePath = '/sys/class/thermal'
    const files = fs.readdirSync(basePath).filter((f) => f.startsWith('thermal_zone'))
    for (const file of files) {
      const tempPath = path.join(basePath, file, 'temp')
      if (!fs.existsSync(tempPath)) continue
      const raw = fs.readFileSync(tempPath, 'utf8').trim()
      const value = Number(raw)
      if (!Number.isNaN(value)) {
        return value / 1000
      }
    }
  } catch (e) {
    // ignore
  }
  return null
}

const getDiskUsage = (targetPath = '/') => {
  try {
    const out = execSync(`df -k "${targetPath.replace(/"/g, '')}"`).toString('utf8')
    const lines = out.trim().split('\n')
    if (lines.length >= 2) {
      const parts = lines[1].split(/\s+/)
      const total = Number(parts[1]) * 1024
      const used = Number(parts[2]) * 1024
      const free = Number(parts[3]) * 1024
      const usedPct = parts[4]
      return { total, used, free, usedPct }
    }
  } catch (e) {
    // ignore
  }
  return null
}

const getSystemInfo = () => {
  const cpus = os.cpus() || []
  const load = os.loadavg()
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  const memPercent = totalMem ? Math.round((usedMem / totalMem) * 100) : 0
  const cpuPercent = cpus.length ? Math.round((load[0] / cpus.length) * 100) : 0
  const disk = getDiskUsage('/')
  const cpuTemp = getCpuTemp()

  return {
    cores: cpus.length,
    loadAvg: load,
    cpuPercent,
    cpuTemp,
    totalMem,
    freeMem,
    usedMem,
    memPercent,
    disk,
  }
}

const start = (config) => {
  if (minerProcess) {
    throw new Error('Miner is already running')
  }

  const coreConfig = {
    pool: 'xmr.pool.minexmr.com:4444',
    wallet: config.wallet || config.walletAddress || '',
    workerName: 'rig-01',
    threads: 0,
    ...config,
  }

  saveConfig(coreConfig)

  const cmd = 'xmrig'
  const args = ['--config', CONFIG_PATH, '--donate-level', '0', '--no-color']

  try {
    minerProcess = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (err) {
    status = { ...status, running: false, error: `failed to spawn xmrig: ${err.message}` }
    return status
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
    config: coreConfig,
  }

  minerProcess.on('error', (err) => {
    status.running = false
    status.error = `xmrig error: ${err.message}`
    minerProcess = null
  })

  minerProcess.stdout.on('data', (chunk) => {
    const text = chunk.toString('utf8')
    status.lastOutput = text

    const parsed = parseXmrigLine(text)
    if (parsed.hashRate) status.hashRate = parsed.hashRate
    if (parsed.accepted != null) status.accepted = parsed.accepted
    if (parsed.rejected != null) status.rejected = parsed.rejected
  })

  minerProcess.stderr.on('data', (chunk) => {
    const text = chunk.toString('utf8')
    status.lastOutput = text
  })

  minerProcess.on('exit', (code, signal) => {
    status.running = false
    status.error = code !== 0 ? `exited with code ${code} (${signal || 'no signal'})` : null
    minerProcess = null
  })

  // Update uptime periodically
  const uptimeInterval = setInterval(() => {
    if (!status.startTime) return
    status.uptime = Math.floor((Date.now() - status.startTime) / 1000)
    if (!status.running) clearInterval(uptimeInterval)
  }, 1000)

  return status
}

const stop = () => {
  if (!minerProcess) {
    return { running: false }
  }

  minerProcess.kill('SIGINT')
  minerProcess = null
  status.running = false
  return status
}

const getStatus = () => {
  return {
    ...status,
    config: status.config || loadConfig(),
    system: getSystemInfo(),
  }
}

module.exports = { start, stop, getStatus, saveConfig, loadConfig }
