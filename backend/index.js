const express = require('express')
const app = express()
const port = process.env.PORT || 3001
const os = require('os')
const { exec } = require('child_process')

// Simple CORS for demo frontend running on a different port
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.get('/', (req, res) => {
  res.json({ status: 'Civicverse backend stub', time: new Date().toISOString() })
})

// API endpoints used by the frontend status page
app.get('/api/backend', (req, res) => {
  res.json({ status: 'Civicverse backend stub', time: new Date().toISOString() })
})

app.get('/api/kaspa', async (req, res) => {
  try {
    const resp = await fetch(process.env.KASPA_URL || 'http://kaspa-node:16110/');
    const json = await resp.json();
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: 'kaspa unreachable', message: err.message })
  }
})

app.get('/api/monero', async (req, res) => {
  try {
    const resp = await fetch(process.env.MONERO_URL || 'http://monerod:18081/');
    const json = await resp.json();
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: 'monero unreachable', message: err.message })
  }
})

// System stats endpoint (CPU, RAM, optional GPU via nvidia-smi)
app.get('/api/stats', async (req, res) => {
  try {
    const cpus = os.cpus()
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const stats = {
      cpu: {
        model: cpus[0].model,
        cores: cpus.length,
        loadavg: os.loadavg(),
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usedPercent: Math.round((usedMem / totalMem) * 10000) / 100,
      },
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch(),
      gpu: {
        available: false,
        devices: [],
      }
    }

    // Try to query nvidia-smi for GPU info if available
    exec('nvidia-smi --query-gpu=name,utilization.gpu,memory.total,memory.used --format=csv,noheader,nounits', { timeout: 2000 }, (err, stdout) => {
      if (!err && stdout) {
        try {
          const lines = stdout.trim().split('\n')
          lines.forEach(line => {
            const parts = line.split(',').map(p => p.trim())
            // name, utilization, mem_total, mem_used
            if (parts.length >= 4) {
              stats.gpu.available = true
              stats.gpu.devices.push({ name: parts[0], utilization: Number(parts[1]), memoryTotal: Number(parts[2]), memoryUsed: Number(parts[3]) })
            }
          })
        } catch (parseErr) {
          // ignore parse
        }
      }
      res.json(stats)
    })
  } catch (err) {
    res.status(500).json({ error: 'failed to collect stats', message: err.message })
  }
})

app.listen(port, () => {
  console.log(`Civicverse backend stub listening on port ${port}`)
})
