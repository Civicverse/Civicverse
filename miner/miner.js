const http = require('http')
let running = true
let cpuLimit = 1

function busyLoop(ms){
  const end = Date.now()+ms
  while(Date.now()<end){}
}

setInterval(()=>{
  if(running){
    // short busy work to simulate cpu usage
    busyLoop(10 * cpuLimit)
    console.log(`miner: heartbeat cpu=${cpuLimit}`)
  }
},2000)

// simple control endpoint
http.createServer((req,res)=>{
  if(req.method==='POST' && req.url==='/set'){let body='';req.on('data',c=>body+=c);req.on('end',()=>{try{const s=JSON.parse(body);cpuLimit=s.cpus||cpuLimit;res.end('ok')}catch(e){res.end('err')}});return}
  if(req.url==='/status'){res.end(JSON.stringify({running,cpuLimit})) ;return}
  res.end('miner')
}).listen(9090, ()=>console.log('miner control listening 9090'))
