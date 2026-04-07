import React, { useEffect, useMemo, useState } from 'react'
import { GamingRigAvatar } from './GamingRigAvatar'

const STORAGE_KEY = 'civicverse.mining.dashboard'

export type MiningPreset = 'low' | 'medium' | 'high'
export type RigTheme = 'midnight' | 'cyber' | 'gold' | 'white'

export type MiningConfig = {
  workerName: string
  poolUrl: string
  walletAddress: string
  preset: MiningPreset
  threads: number
  pCores: number
  eCores: number
  advancedConfig: string
  theme: RigTheme
}

const defaultConfig: MiningConfig = {
  workerName: 'rig-01',
  poolUrl: 'xmr.pool.minexmr.com:4444',
  walletAddress: '438XTJJvpD96uBFFM3jv1fevMx33YW5cjHtPZQ4bXABjfh9RV2eRNa8LiRyVJbDQgEHWpmZSCH836DcvzrQJa52CGBHVSEp',
  preset: 'medium',
  threads: navigator.hardwareConcurrency || 4,
  pCores: 0,
  eCores: 0,
  advancedConfig: '',
  theme: 'midnight'
}

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
    walletAddress: walletAddress || defaultConfig.walletAddress,
  }))
  
  const [isMining, setIsMining] = useState(false)
  const [hashRate, setHashRate] = useState(0)
  const [uptime, setUptime] = useState(0)
  const [systemInfo, setSystemInfo] = useState<any>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [backendAvailable, setBackendAvailable] = useState(true)
  const [backendError, setBackendError] = useState<string | null>(null)

  // Polling for status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/miner/status')
      const data = await res.json()

      setBackendAvailable(true)
      setBackendError(data?.error || null)

      // If backend has a running config, sync basic fields if we aren't editing
      if (data?.config && data.running && !showAdvanced) {
         // Optionally sync back some fields, but be careful not to overwrite user input while typing
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
    interval = window.setInterval(fetchStatus, 1000)
    return () => {
      if (interval) window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [config])

  const applyPreset = (preset: MiningPreset) => {
    const hw = navigator.hardwareConcurrency || 4
    let threads = hw;
    if (preset === 'low') threads = Math.max(1, Math.floor(hw * 0.25));
    if (preset === 'medium') threads = Math.max(1, Math.floor(hw * 0.50));
    
    setConfig((prev) => ({
      ...prev,
      preset,
      threads,
      pCores: threads, // Simplified mapping
      eCores: 0,
      advancedConfig: '' // Clear advanced if using preset
    }))
  }

  const toggleMining = async () => {
    if (!backendAvailable) return;
    
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
    }
  }

  const hw = navigator.hardwareConcurrency || 4
  const cpuTemp = systemInfo?.cpuTemp || 0
  const cpuLoad = systemInfo?.currentLoad || 0
  const gpus = systemInfo?.gpus || []
  
  // Real RAM usage calculation: (Total - Free) / Total
  const totalMem = systemInfo?.totalMem || 0
  const freeMem = systemInfo?.freeMem || 0
  const usedMemBytes = totalMem - freeMem
  const ramGB = (usedMemBytes / (1024 * 1024 * 1024)).toFixed(1)
  const ramPct = totalMem > 0 ? ((usedMemBytes / totalMem) * 100).toFixed(1) : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left: Telemetry Panel */}
      <div className="bg-dark-900/90 border border-neon-cyan/20 rounded-lg p-5 space-y-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-neon-cyan/20 pb-2">
          <div>
            <h3 className="text-neon-pink font-bold text-xl">📡 Telemetry</h3>
            <p className="text-gray-400 text-[10px] uppercase">{systemInfo?.brand || 'Detecting...'}</p>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-bold ${isMining ? 'bg-neon-green text-black animate-pulse' : 'bg-gray-700 text-gray-300'}`}>
            {isMining ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-dark-800/60 p-3 rounded border border-neon-pink/10">
            <p className="text-gray-400 text-[10px] uppercase">Hash Rate</p>
            <p className="text-neon-pink font-bold text-2xl">{formatNumber(hashRate)} <span className="text-sm">H/s</span></p>
          </div>
          <div className="bg-dark-800/60 p-3 rounded border border-neon-pink/10">
            <p className="text-gray-400 text-[10px] uppercase">CPU Temp</p>
            <p className={`font-bold text-2xl ${cpuTemp > 80 ? 'text-neon-red animate-pulse' : 'text-neon-blue'}`}>
              {cpuTemp > 0 ? `${cpuTemp.toFixed(1)}°C` : '--'}
            </p>
          </div>
          <div className="bg-dark-800/60 p-3 rounded border border-neon-pink/10">
            <p className="text-gray-400 text-[10px] uppercase">CPU Load</p>
            <p className="text-neon-purple font-bold text-2xl">{cpuLoad.toFixed(1)}%</p>
          </div>
          <div className="bg-dark-800/60 p-3 rounded border border-neon-pink/10">
            <p className="text-gray-400 text-[10px] uppercase">RAM Usage</p>
            <div className="flex items-baseline gap-1">
                <p className="text-neon-green font-bold text-2xl">{ramGB}</p>
                <span className="text-gray-500 text-[10px]">GB ({ramPct}%)</span>
            </div>
          </div>
          
          {gpus.map((gpu: any, i: number) => (
            <div key={i} className="col-span-2 bg-dark-800/60 p-3 rounded border border-neon-cyan/10">
              <div className="flex justify-between items-start mb-1">
                <p className="text-gray-400 text-[10px] uppercase truncate max-w-[150px]">{gpu.model}</p>
                <p className="text-neon-blue font-bold text-sm">{gpu.temp > 0 ? `${gpu.temp}°C` : ''}</p>
              </div>
              <div className="flex justify-between items-center">
                <div className="w-2/3 bg-dark-900 h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-cyan" style={{ width: `${gpu.load}%` }} />
                </div>
                <p className="text-neon-cyan font-bold text-sm">{gpu.load.toFixed(0)}%</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs text-gray-400">
                <span>Disk Usage (/)</span>
                <span>{systemInfo?.disk?.usedPct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-dark-800 h-1.5 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-neon-cyan" 
                    style={{ width: `${systemInfo?.disk?.usedPct || 0}%` }}
                />
            </div>
            {systemInfo?.l3MB > 0 && (
                <p className="text-[10px] text-gray-500 font-mono">
                    L3 Cache: {systemInfo.l3MB.toFixed(1)}MB | Physical Cores: {systemInfo.physicalCores}
                </p>
            )}
        </div>
        
        <div className="bg-dark-800/40 p-3 rounded text-xs font-mono text-gray-400 h-32 overflow-y-auto border border-gray-800">
            <p className="text-neon-green">$ systemctl status miner</p>
            {backendError && <p className="text-neon-red">{backendError}</p>}
            {!backendAvailable && <p className="text-neon-red">Daemon unreachable...</p>}
            {isMining && <p className="text-gray-300">Mining active. Uptime: {uptime}s</p>}
            <p className="text-gray-500">Listening for telemetry...</p>
        </div>
      </div>

      {/* Center: The Rig */}
      <div className="lg:col-span-1 rounded-xl border border-neon-pink/20 overflow-hidden relative min-h-[400px] bg-gradient-to-b from-transparent to-dark-900/50">
        <GamingRigAvatar 
            isMining={isMining}
            load={cpuLoad}
            temperature={cpuTemp}
            workerName={config.workerName}
            hashRate={hashRate}
            theme={config.theme}
        />
        
        {/* Overlay Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
            {cpuTemp > 80 && (
                <div className="bg-neon-red text-black text-xs font-bold px-2 py-1 rounded animate-bounce">
                    🔥 OVERHEAT
                </div>
            )}
        </div>

        {/* Theme Selector Overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2">
            {(['midnight', 'cyber', 'gold', 'white'] as RigTheme[]).map(t => (
                <button
                    key={t}
                    onClick={() => setConfig({...config, theme: t})}
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        config.theme === t 
                        ? 'bg-neon-pink text-black border-neon-pink' 
                        : 'bg-black/50 text-gray-300 border-gray-600 hover:border-white'
                    }`}
                >
                    {t.toUpperCase()}
                </button>
            ))}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="bg-dark-900/90 border border-neon-cyan/20 rounded-lg p-5 space-y-5 shadow-lg backdrop-blur-sm">
        <div>
          <h3 className="text-neon-cyan font-bold text-xl">🛠️ Rig Control</h3>
          <p className="text-gray-400 text-xs">Configure worker and mining strategy.</p>
        </div>

        <div className="space-y-4">
            <div>
                <label className="text-gray-400 text-xs mb-1 block">Worker Name</label>
                <input
                    value={config.workerName}
                    onChange={(e) => setConfig({...config, workerName: e.target.value})}
                    className="w-full bg-dark-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-neon-cyan outline-none transition"
                    placeholder="Rig-01"
                />
            </div>
            
            <div>
                <label className="text-gray-400 text-xs mb-1 block">Pool URL</label>
                <input
                    value={config.poolUrl}
                    onChange={(e) => setConfig({...config, poolUrl: e.target.value})}
                    className="w-full bg-dark-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-neon-cyan outline-none transition"
                />
            </div>

            <div className="bg-dark-800/50 p-3 rounded border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-xs">Intensity Preset</span>
                    <span className="text-neon-cyan text-xs font-bold uppercase">{config.preset}</span>
                </div>
                <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as MiningPreset[]).map(p => (
                        <button
                            key={p}
                            onClick={() => applyPreset(p)}
                            className={`flex-1 py-1.5 rounded text-xs font-bold uppercase transition-all ${
                                config.preset === p 
                                ? 'bg-neon-cyan text-black shadow-lg shadow-neon-cyan/20' 
                                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Threads</span>
                    <span className="text-neon-cyan">{config.threads} / {hw}</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max={hw}
                    value={config.threads}
                    onChange={(e) => {
                        const val = Number(e.target.value);
                        setConfig({...config, threads: val, preset: 'medium' as any}); // Setting to medium or null to indicate manual override
                    }}
                    className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                />
            </div>

            <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-neon-purple hover:text-white underline decoration-dashed underline-offset-4"
            >
                {showAdvanced ? 'Hide Advanced Config' : 'Show Advanced JSON Config'}
            </button>

            {showAdvanced && (
                <textarea
                    value={config.advancedConfig}
                    onChange={(e) => setConfig({...config, advancedConfig: e.target.value})}
                    placeholder='Paste raw xmrig "cpu" or "randomx" config JSON here...'
                    className="w-full h-32 bg-dark-950 font-mono text-xs text-neon-green p-2 border border-neon-purple/30 rounded"
                />
            )}

            <button
                onClick={toggleMining}
                disabled={!backendAvailable}
                className={`w-full py-4 rounded-lg font-bold text-lg shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                    isMining
                    ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-red-900/50'
                    : 'bg-gradient-to-r from-neon-green to-emerald-600 text-black shadow-neon-green/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isMining ? '🛑 STOP MINING' : '⚡ START MINER'}
            </button>
        </div>
      </div>
    </div>
  )
}
