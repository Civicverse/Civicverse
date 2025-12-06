// Minimal Craig watcher stub for demo. Replace with real implementation.
console.log('Craig watcher (demo stub) starting...')

// Simple periodic log to show the service is alive
setInterval(() => {
  console.log(new Date().toISOString(), 'Craig watcher heartbeat')
}, 15000)

process.on('SIGINT', () => { console.log('Shutting down'); process.exit(0) })
