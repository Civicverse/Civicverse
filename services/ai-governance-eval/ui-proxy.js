const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const UI_DIR = path.join(__dirname, '..', '..', 'ai-governance-protocol', 'deliverables', 'ui');

// Serve static UI
app.use('/', express.static(UI_DIR));

// Proxy API calls to the evaluator service running on 4310
const EVAL_TARGET = process.env.EVAL_URL || 'http://localhost:4310';
app.use(['/override','/escalate','/verify-attestation'], createProxyMiddleware({ target: EVAL_TARGET, changeOrigin: true }));

const PORT = process.env.UI_PROXY_PORT || 4320;
app.listen(PORT, () => console.log('UI proxy listening on', PORT, 'serving', UI_DIR, 'proxy->', EVAL_TARGET));
