import React, { useEffect, useMemo, useRef, useState } from 'react'
import { GamingRigAvatar } from './GamingRigAvatar'

const STORAGE_KEY = 'civicverse.mining.dashboard'

export type MiningPreset = 'low' | 'medium' | 'high'

export type MiningConfig = {
  workerName: string
  poolUrl: string
  walletAddress: string
  preset: MiningPreset
  threads: number
  pCores: number
  eCores: number
  advancedConfig: string
}

const defaultConfig: MiningConfig = {
  workerName: 'rig-01',
  poolUrl: 'xmr.pool.minexmr.com:4444',
  walletAddress: '438XTJJvpD96uBFFM3jv1fevMx33YW5cjHtPZQ4bXABjfh9RV2eRNa8LiRyVJbDQgEHWpmZSCH836DcvzrQJa52CGBHVSEp',
  preset: 'medium',
  threads: navigator.hardwareConcurrency || 4,
  pCores: 0,
  eCores: 0,
  advancedConfig: JSON.stringify(
    {
      algorithm: 'cn/r',
      donate: 0,
      cpu: {
        maxThreadsHint: navigator.hardwareConcurrency || 4,
      },
    },
    null,
    2
  ),
}

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val))

const formatNumber = (value: number, digits = 1) => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(digits)}G`
  if (value >= 1e6) return `${(value / 1e6).toFixed(digits)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(digits)}k`
  return value.toFixed(digits)
}

export function MiningRigDashboard({ walletAddress }: { walletAddress: string }) {
  const saved = useMemo(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as MiningConfig
    } catch {
      return null
    }
  }, [])

  const [config, setConfig] = useState<MiningConfig>(() => ({
    ...defaultConfig,
    ...(saved || {}),
    walletAddress,
  }))
  const [isMining, setIsMining] = useState(false)
  const [hashRate, setHashRate] = useState(0)
  const [uptime, setUptime] = useState(0)
  const [systemInfo, setSystemInfo] = useState<any>(null)
  const [rawConfig, setRawConfig] = useState<string>('')
  const [rawConfigError, setRawConfigError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showRawConfig, setShowRawConfig] = useState(false)

  const [backendAvailable, setBackendAvailable] = useState(true)
  const [backendError, setBackendError] = useState<string | null>(null)

  useEffect(() => {
    // Persist config to localStorage when it changes
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [config])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/miner/status')
      const data = await res.json()

      setBackendAvailable(true)
      setBackendError(data?.error || null)

      if (data?.config) {
        setConfig((prev) => ({ ...prev, ...data.config }))
        setRawConfig(JSON.stringify(data.config, null, 2))
      }

      setIsMining(Boolean(data?.running))
      setHashRate(data?.hashRate || 0)
      setUptime(data?.uptime || 0)
      setSystemInfo(data?.system || null)
    } catch {
      setBackendAvailable(false)
      setBackendError('Backend miner API not reachable')
    }
  }

  useEffect(() => {
    let interval: number | null = null

    fetchStatus()
    interval = window.setInterval(fetchStatus, 2000)

    return () => {
      if (interval) {
        window.clearInterval(interval)
      }
    }
  }, [])

  useEffect(() => {
    // Keep the wallet address in sync
    setConfig((prev) => ({ ...prev, walletAddress }))
  }, [walletAddress])

  const applyPreset = (preset: MiningPreset) => {
    const hw = navigator.hardwareConcurrency || 4
    const threads = preset === 'low' ? Math.max(1, Math.floor(hw * 0.25)) : preset === 'high' ? hw : Math.max(1, Math.floor(hw * 0.6))
    setConfig((prev) => ({
      ...prev,
      preset,
      threads,
      pCores: threads,
      eCores: Math.max(0, hw - threads),
    }))
  }

  const onThreadsChange = (threads: number) => {
    const hw = navigator.hardwareConcurrency || 4
    const clamped = clamp(threads, 1, hw)
    setConfig((prev) => ({ ...prev, threads: clamped, pCores: clamped, eCores: Math.max(0, hw - clamped), preset: 'custom' as MiningPreset }))
  }

  const onWorkerNameChange = (name: string) => {
    setConfig((prev) => ({ ...prev, workerName: name }))
  }

  const toggleMining = async () => {
    if (backendAvailable) {
      try {
        if (isMining) {
          await fetch('/api/miner/stop', { method: 'POST' })
        } else {
          await fetch('/api/miner/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
          })
        }

        await fetchStatus()
      } catch (err) {
        setBackendError('Failed to control miner API')
        setBackendAvailable(false)
        setIsMining((prev) => !prev)
      }
    } else {
      setIsMining((prev) => !prev)
    }
  }

  const copyAddress = async () => {
    await navigator.clipboard.writeText(config.walletAddress)
    window.alert('Wallet address copied to clipboard')
  }

  const updateAdvancedConfig = (value: string) => {
    setConfig((prev) => ({ ...prev, advancedConfig: value }))
  }

  const saveRawConfig = async () => {
    try {
      const parsed = JSON.parse(rawConfig)
      const res = await fetch('/api/miner/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })
      const data = await res.json()
      if (data?.error) throw new Error(data.error)
      setRawConfigError(null)
      await fetchStatus()
    } catch (err: any) {
      setRawConfigError(err?.message || 'Invalid JSON')
    }
  }

  const hw = navigator.hardwareConcurrency || 4
  const deviceMemory = systemInfo ? Math.round((systemInfo.totalMem ?? 0) / (1024 ** 3)) : (navigator as any).deviceMemory || 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: Telemetry */}
      <div className="bg-dark-900/90 border border-neon-cyan/20 rounded-lg p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-neon-pink font-bold text-lg">📡 Telemetry</h3>
            <p className="text-gray-400 text-xs">Live system metrics (simulated in browser).</p>
          </div>
          <span className="text-xs text-gray-500">{isMining ? 'Mining' : 'Idle'}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-dark-900/60 border border-neon-pink/30 rounded-lg p-3">
            <p className="text-gray-400 text-xs">Hash Rate</p>
            <p className="text-neon-pink font-bold text-lg">{formatNumber(hashRate)} H/s</p>
          </div>

          <div className="bg-dark-900/60 border border-neon-pink/30 rounded-lg p-3">
            <p className="text-gray-400 text-xs">CPU Load</p>
            <p className="text-neon-pink font-bold text-lg">{systemInfo ? `${systemInfo.cpuPercent ?? 0}%` : 'N/A'}</p>
          </div>

          <div className="bg-dark-900/60 border border-neon-pink/30 rounded-lg p-3">
            <p className="text-gray-400 text-xs">CPU Temp</p>
            <p className="text-neon-pink font-bold text-lg">{systemInfo?.cpuTemp != null ? `${systemInfo.cpuTemp.toFixed(0)}°C` : 'N/A'}</p>
          </div>

          <div className="bg-dark-900/60 border border-neon-pink/30 rounded-lg p-3">
            <p className="text-gray-400 text-xs">RAM Usage</p>
            <p className="text-neon-pink font-bold text-lg">
              {systemInfo ? `${((systemInfo.usedMem || 0) / (1024 ** 3)).toFixed(1)} / ${((systemInfo.totalMem || 0) / (1024 ** 3)).toFixed(1)} GB` : 'N/A'}
            </p>
          </div>

          <div className="bg-dark-900/60 border border-neon-pink/30 rounded-lg p-3">
            <p className="text-gray-400 text-xs">Disk Usage</p>
            <p className="text-neon-pink font-bold text-lg">{systemInfo?.disk?.usedPct ?? 'N/A'}</p>
          </div>

          <div className="bg-dark-900/60 border border-neon-pink/30 rounded-lg p-3">
            <p className="text-gray-400 text-xs">Uptime</p>
            <p className="text-neon-pink font-bold text-lg">{Math.floor(uptime / 60)}m {Math.floor(uptime % 60)}s</p>
          </div>
        </div>

        <div className="bg-dark-900/60 border border-neon-cyan/20 rounded-lg p-3">
          <p className="text-gray-400 text-xs mb-1">Hardware</p>
          <div className="flex justify-between items-center text-sm">
            <span>Logical Cores</span>
            <span className="font-bold text-neon-cyan">{hw}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Device RAM</span>
            <span className="font-bold text-neon-cyan">{deviceMemory ? `${deviceMemory} GB` : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Center: 3D model */}
      <div className="lg:col-span-1 rounded-lg border border-neon-pink/10 overflow-hidden">
        <div className="h-96">
          <GamingRigAvatar />
        </div>
      </div>

      {/* Right: Mining Controls */}
      <div className="bg-dark-900/90 border border-neon-cyan/20 rounded-lg p-4 space-y-4">
        <div>
          <h3 className="text-neon-cyan font-bold text-lg">🛠️ Mining Controls</h3>
          <p className="text-gray-400 text-xs">Configure the miner and start/stop hashing.</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex flex-col">
            <label className="text-gray-400 text-xs mb-1">Worker Name</label>
            <input
              value={config.workerName}
              onChange={(e) => onWorkerNameChange(e.target.value)}
              className="bg-dark-900/70 border border-neon-cyan/20 rounded px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-400 text-xs mb-1">Pool URL</label>
            <input
              value={config.poolUrl}
              onChange={(e) => setConfig((prev) => ({ ...prev, poolUrl: e.target.value }))}
              className="bg-dark-900/70 border border-neon-cyan/20 rounded px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-400 text-xs mb-1">Wallet Address</label>
            <input
              value={config.walletAddress}
              onChange={(e) => setConfig((prev) => ({ ...prev, walletAddress: e.target.value }))}
              className="bg-dark-900/70 border border-neon-cyan/20 rounded px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMining}
              className={`flex-1 py-2 rounded font-bold text-sm transition ${
                isMining
                  ? 'bg-neon-red text-black hover:bg-neon-red/80'
                  : 'bg-neon-green text-black hover:bg-neon-green/80'
              }`}
            >
              {isMining ? '🛑 Stop Miner' : '▶️ Start Miner'}
            </button>
            <button
              onClick={copyAddress}
              className="py-2 px-3 rounded bg-dark-900/70 border border-neon-cyan/20 text-sm text-white hover:bg-dark-900"
            >
              📋 Copy Wallet
            </button>
          </div>

          <div className="bg-dark-900/60 border border-neon-cyan/20 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs">Preset</span>
              <span className="text-neon-cyan text-xs">{config.preset}</span>
            </div>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as MiningPreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => applyPreset(p)}
                  className={`flex-1 py-1 rounded text-xs font-bold transition ${
                    config.preset === p
                      ? 'bg-neon-cyan text-black'
                      : 'bg-dark-900/60 text-gray-200 hover:bg-dark-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-dark-900/60 border border-neon-cyan/20 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs">Threads</span>
              <span className="font-bold text-neon-cyan text-xs">{config.threads}</span>
            </div>
            <input
              type="range"
              min={1}
              max={hw}
              value={config.threads}
              onChange={(e) => onThreadsChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">Use slider to control P/E core split.</div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>P cores</span>
            <span>{config.pCores}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>E cores</span>
            <span>{config.eCores}</span>
          </div>

          <button
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="w-full py-2 rounded border border-neon-cyan/30 text-xs text-neon-cyan hover:bg-dark-900/70"
          >
            {showAdvanced ? 'Hide' : 'Edit'} Advanced xmrig Config
          </button>

          {showAdvanced && (
            <textarea
              value={config.advancedConfig}
              onChange={(e) => updateAdvancedConfig(e.target.value)}
              className="w-full h-40 bg-dark-900/60 border border-neon-cyan/20 rounded p-2 text-xs font-mono text-white"
            />
          )}

          <button
            onClick={() => setShowRawConfig((prev) => !prev)}
            className="w-full mt-2 py-2 rounded border border-neon-cyan/30 text-xs text-neon-cyan hover:bg-dark-900/70"
          >
            {showRawConfig ? 'Hide' : 'Edit'} Raw xmrig Config File
          </button>

          {showRawConfig && (
            <div className="space-y-2">
              <textarea
                value={rawConfig}
                onChange={(e) => setRawConfig(e.target.value)}
                className="w-full h-56 bg-dark-900/60 border border-neon-cyan/20 rounded p-2 text-xs font-mono text-white"
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={saveRawConfig}
                  className="flex-1 py-2 rounded bg-neon-cyan text-black font-bold text-xs hover:bg-neon-cyan/80"
                >
                  Save config file
                </button>
                <button
                  onClick={fetchStatus}
                  className="flex-1 py-2 rounded border border-neon-cyan/30 text-xs text-neon-cyan hover:bg-dark-900/70"
                >
                  Refresh config
                </button>
              </div>
              {rawConfigError && <p className="text-neon-red text-xs">{rawConfigError}</p>}
            </div>
          )}
        </div>

        <div className="bg-dark-900/60 border border-neon-cyan/20 rounded-lg p-3 text-xs text-gray-400">
          <p>
            <span className="font-bold text-neon-cyan">Note:</span> This dashboard controls a native xmrig miner running on the host. Ensure <code>xmrig</code> is installed and accessible in the PATH.
          </p>
          <p className="mt-1">
            Backend miner API status: <span className={backendAvailable ? 'text-neon-green font-bold' : 'text-neon-red font-bold'}>{backendAvailable ? 'available' : 'unreachable'}</span>
          </p>
          {backendError && (
            <p className="mt-1 text-neon-red text-xs">{backendError}</p>
          )}
        </div>
      </div>
    </div>
  )
}
