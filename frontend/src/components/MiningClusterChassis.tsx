import React, { useState, useEffect } from 'react'

interface GPUCard {
  id: number
  hashrate: number
  temp: number
  power: number
}

export const MiningClusterChassis: React.FC = () => {
  const [gpus, setGpus] = useState<GPUCard[]>([
    { id: 1, hashrate: 145.2, temp: 65, power: 315 },
    { id: 2, hashrate: 142.8, temp: 64, power: 310 },
    { id: 3, hashrate: 148.5, temp: 68, power: 325 },
    { id: 4, hashrate: 144.1, temp: 66, power: 318 },
    { id: 5, hashrate: 146.9, temp: 67, power: 320 },
    { id: 6, hashrate: 143.7, temp: 63, power: 312 },
  ])

  const [activeGlow, setActiveGlow] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveGlow(prev => (prev + 1) % gpus.length)
      // Simulate hashrate fluctuation
      setGpus(prevGpus =>
        prevGpus.map(gpu => ({
          ...gpu,
          hashrate: gpu.hashrate + (Math.random() - 0.5) * 2,
          temp: Math.max(60, Math.min(75, gpu.temp + (Math.random() - 0.5) * 1.5)),
          power: gpu.power + (Math.random() - 0.5) * 5,
        }))
      )
    }, 1200)

    return () => clearInterval(interval)
  }, [gpus.length])

  const totalHashrate = gpus.reduce((sum, gpu) => sum + gpu.hashrate, 0).toFixed(1)
  const avgTemp = (gpus.reduce((sum, gpu) => sum + gpu.temp, 0) / gpus.length).toFixed(1)
  const totalPower = gpus.reduce((sum, gpu) => sum + gpu.power, 0).toFixed(0)

  return (
    <div className="relative w-full">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 8px rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulse-power {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes rgbCycle {
          0% { color: #00ff00; text-shadow: 0 0 10px #00ff00; }
          33% { color: #00ffff; text-shadow: 0 0 10px #00ffff; }
          66% { color: #ff00ff; text-shadow: 0 0 10px #ff00ff; }
          100% { color: #00ff00; text-shadow: 0 0 10px #00ff00; }
        }
        .mining-chassis {
          perspective: 1200px;
        }
        .gpu-card {
          transition: all 0.6s ease;
        }
        .gpu-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.5);
        }
      `}</style>

      {/* Chassis Frame */}
      <div className="mining-chassis">
        <div className="relative bg-gradient-to-b from-dark-900/80 via-dark-800/60 to-dark-900/80 border-2 border-neon-cyan/30 rounded-xl p-6 shadow-2xl overflow-hidden">
          {/* Background Grid Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-purple/5 pointer-events-none" />
          
          {/* Decorative Corner Lights */}
          <div className="absolute top-3 left-3 w-3 h-3 bg-neon-green rounded-full animate-pulse" />
          <div className="absolute top-3 right-3 w-3 h-3 bg-neon-pink rounded-full animate-pulse" />
          <div className="absolute bottom-3 left-3 w-3 h-3 bg-neon-purple rounded-full animate-pulse" />
          <div className="absolute bottom-3 right-3 w-3 h-3 bg-neon-orange rounded-full animate-pulse" />

          <div className="relative z-10">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between border-b border-neon-cyan/20 pb-4">
              <div>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink">
                  ⚡ GPU Mining Cluster
                </h3>
                <p className="text-gray-400 text-sm mt-1">6-Unit ARGB Open Frame Chassis</p>
              </div>
              <div className="text-right">
                <div className="text-neon-green text-lg font-bold animate-pulse">● ONLINE</div>
              </div>
            </div>

            {/* Stats RibBon */}
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div className="bg-dark-900/50 border border-neon-cyan/30 rounded-lg p-3">
                <p className="text-gray-400 text-xs uppercase">Combined Hashrate</p>
                <p className="text-neon-cyan font-bold text-lg">{totalHashrate} MH/s</p>
              </div>
              <div className="bg-dark-900/50 border border-neon-purple/30 rounded-lg p-3">
                <p className="text-gray-400 text-xs uppercase">Avg Temperature</p>
                <p className="text-neon-purple font-bold text-lg">{avgTemp}°C</p>
              </div>
              <div className="bg-dark-900/50 border border-neon-orange/30 rounded-lg p-3">
                <p className="text-gray-400 text-xs uppercase">Total Power</p>
                <p className="text-neon-orange font-bold text-lg">{totalPower}W</p>
              </div>
            </div>

            {/* GPU Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gpus.map((gpu, idx) => (
                <div
                  key={gpu.id}
                  className="gpu-card group relative"
                  style={{
                    animation: activeGlow === idx ? 'glow 1.2s ease-in-out infinite' : 'none',
                  }}
                >
                  {/* Card Border */}
                  <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/40 to-neon-purple/20 rounded-lg blur-sm group-hover:blur opacity-50 group-hover:opacity-70 transition-all" />
                  
                  {/* Card Content */}
                  <div className="relative bg-gradient-to-br from-dark-900/95 via-dark-800/90 to-dark-900/95 border border-neon-cyan/40 rounded-lg p-4 backdrop-blur-sm">
                    {/* GPU Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-neon-cyan/20">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                        <span className="text-neon-cyan font-bold text-sm">GPU #{gpu.id}</span>
                      </div>
                      {/* Fan animation */}
                      <div
                        className="w-4 h-4 border-2 border-neon-purple rounded-full"
                        style={{ animation: 'spin-reverse 1.5s linear infinite' }}
                      />
                    </div>

                    {/* GPU Specs */}
                    <div className="space-y-2 text-xs font-mono">
                      {/* Hashrate */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Hashrate:</span>
                        <span className="text-neon-green font-bold">{gpu.hashrate.toFixed(1)} MH/s</span>
                      </div>

                      {/* Temperature Bar */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-400">Temperature:</span>
                          <span className={gpu.temp > 70 ? 'text-neon-pink' : 'text-neon-cyan'}>
                            {gpu.temp.toFixed(0)}°C
                          </span>
                        </div>
                        <div className="w-full h-1 bg-dark-900/80 rounded-full overflow-hidden border border-neon-cyan/20">
                          <div
                            className={`h-full transition-all duration-300 ${
                              gpu.temp > 70 ? 'bg-neon-pink' : 'bg-gradient-to-r from-neon-cyan to-neon-purple'
                            }`}
                            style={{ width: `${(gpu.temp / 85) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Power */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Power:</span>
                        <span className="text-neon-orange font-bold">{gpu.power.toFixed(0)}W</span>
                      </div>
                    </div>

                    {/* RGB Accent Line */}
                    <div className="mt-3 h-1 bg-gradient-to-r from-neon-cyan via-neon-purple via-neon-pink to-neon-orange rounded-full opacity-60" />

                    {/* Status Indicator */}
                    <div className="mt-2 text-center text-xs text-gray-500">
                      {gpu.hashrate > 140 ? '✓ Optimal' : '⚠ Monitoring'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Power Distribution Bar */}
            <div className="mt-6 pt-6 border-t border-neon-cyan/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-neon-orange font-bold text-sm">⚡ Power Distribution</span>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-neon-orange to-neon-pink opacity-50" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center justify-between bg-dark-900/40 border border-neon-orange/20 rounded px-2 py-1">
                  <span className="text-gray-400">PSU Rail 1:</span>
                  <span className="text-neon-orange font-bold" style={{ animation: 'pulse-power 2s ease-in-out infinite' }}>
                    {(totalPower / 3).toFixed(0)}W
                  </span>
                </div>
                <div className="flex items-center justify-between bg-dark-900/40 border border-neon-orange/20 rounded px-2 py-1">
                  <span className="text-gray-400">PSU Rail 2:</span>
                  <span className="text-neon-orange font-bold" style={{ animation: 'pulse-power 2.2s ease-in-out infinite' }}>
                    {(totalPower / 3).toFixed(0)}W
                  </span>
                </div>
                <div className="flex items-center justify-between bg-dark-900/40 border border-neon-orange/20 rounded px-2 py-1">
                  <span className="text-gray-400">PSU Rail 3:</span>
                  <span className="text-neon-orange font-bold" style={{ animation: 'pulse-power 2.4s ease-in-out infinite' }}>
                    {(totalPower / 3).toFixed(0)}W
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Info */}
            <div className="mt-6 pt-4 border-t border-neon-cyan/20 text-center text-xs text-gray-500">
              <p>All systems nominal • Cooling active • Network synchronized</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
