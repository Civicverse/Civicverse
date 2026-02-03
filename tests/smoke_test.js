const fetch = global.fetch || require('node-fetch')

async function run(){
  try{
    console.log('market:', await (await fetch('http://localhost:8081/api/market')).json())
    console.log('miner status:', await (await fetch('http://localhost:8081/api/miner/status')).json())
    console.log('treasury:', await (await fetch('http://localhost:8081/api/treasury')).json())
    console.log('quests:', await (await fetch('http://localhost:8081/api/quests')).json())
    console.log('creating citizen...')
    const c = await (await fetch('http://localhost:8081/api/citizen',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'smoke-test'})})).json()
    console.log('citizen:',c)
    console.log('purchase item 1...')
    const p = await (await fetch('http://localhost:8081/api/purchase',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({itemId:1})})).json()
    console.log('purchase resp:', p)
    console.log('crediting ubi...')
    await (await fetch('http://localhost:8081/api/treasury/credit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({amount:1.0})}))
    console.log('ubi:', await (await fetch('http://localhost:8081/api/ubi')).json())
    console.log('distribute ubi...')
    const d = await (await fetch('http://localhost:8081/api/ubi/distribute',{method:'POST'})).json()
    console.log('ubi distribute resp:', d)
    console.log('done smoke test')
  }catch(e){ console.error('smoke failed', e) }
}

run()
