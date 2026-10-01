const { spawn } = require('child_process');
const http = require('http');

async function inspectSignup() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9229',
    '--disable-gpu',
    '--no-sandbox',
    'https://civicverse.github.io/Civicverse/#/signup'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const getJson = (p) => new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:9229${p}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  try {
    const targets = await getJson('/json/list');
    const pageTarget = targets.find(t => t.url && t.url.includes('Civicverse'));

    if (pageTarget) {
      const ws = new (globalThis.WebSocket)(pageTarget.webSocketDebuggerUrl);
      await new Promise(res => {
        ws.onopen = () => {
          ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
          res();
        };
      });

      await new Promise(r => setTimeout(r, 2500));

      const evalExpr = (expression) => new Promise(resolve => {
        const id = Math.floor(Math.random() * 10000);
        const handler = (event) => {
          const m = JSON.parse(event.data);
          if (m.id === id) {
            ws.removeEventListener('message', handler);
            resolve(m.result?.result?.value);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression } }));
      });

      const url = await evalExpr('window.location.href');
      const text = await evalExpr('document.body.innerText');
      console.log('Signup URL:', url);
      console.log('Signup Page Text:', text);
    }
  } finally {
    edge.kill();
  }
}

inspectSignup().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
