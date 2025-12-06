const express = require('express');
const app = express();
const portRpc = 18081;
const portWallet = 18083;

app.get('/', (req, res) => {
  res.json({ status: 'monero-stub', message: 'Monero RPC stub', time: new Date().toISOString() });
});

app.get('/wallet', (req, res) => {
  res.json({ wallet: true, message: 'Wallet RPC stub', uptime: process.uptime() });
});

app.listen(portRpc, () => console.log(`monerod-stub RPC listening on ${portRpc}`));
app.listen(portWallet, () => console.log(`monerod-stub Wallet RPC listening on ${portWallet}`));
