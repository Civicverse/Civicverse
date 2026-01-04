const express = require('express')
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.json())

// Basic AI Copilot stub: returns suggestions and can act under approval

app.post('/suggest-layout', (req,res)=>{
  const { area = 'mall' } = req.body
  // Demo suggestion payload
  const suggestion = {
    area,
    suggestions: [
      { id:'increase-signage', text: 'Add two holographic waypoints near central atrium.' },
      { id:'feature-arcade', text: 'Introduce mini-arcade on level 2 to increase dwell time.' }
    ]
  }
  res.json(suggestion)
})

app.post('/spawn-enemies', (req,res)=>{
  const { arenaId, difficulty='normal' } = req.body
  // In production, this would instruct the game server; here we return a planned spawn list
  const spawnPlan = { arenaId, difficulty, enemies: [ { type:'drone', count:5 }, { type:'raider', count:2 } ] }
  res.json(spawnPlan)
})

app.post('/approve-action', (req,res)=>{
  const { actionId, approver } = req.body
  // record approval in logs (demo)
  console.log('Approved action', actionId, 'by', approver)
  res.json({ status:'approved', actionId, approver })
})

const port = process.env.PORT || 4200
app.listen(port, ()=>console.log('AI Copilot stub listening on', port))
