const express = require('express');
const app = express();
const port = process.env.PORT || 16110;

app.get('/', (req, res) => {
  res.json({ status: 'kaspa-stub', message: 'Kaspa node stub responding', time: new Date().toISOString() });
});

app.get('/rpc', (req, res) => {
  res.json({ rpc: true, message: 'RPC endpoint stub', uptime: process.uptime() });
});

app.listen(port, () => {
  console.log(`kaspa-stub listening on port ${port}`);
});
