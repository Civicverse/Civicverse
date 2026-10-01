const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function capture(url, outFile) {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9228',
    '--disable-gpu',
    '--window-size=1600,1000',
    '--no-sandbox',
    url
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const getJson = (p) => new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:9228${p}`, (res) => {
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
          ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
          res();
        };
      });

      // Wait 3 seconds for 3D/components to render
      await new Promise(r => setTimeout(r, 3000));

      const screenshotData = await new Promise(resolve => {
        const handler = (e) => {
          const m = JSON.parse(e.data);
          if (m.id === 10) {
            ws.removeEventListener('message', handler);
            resolve(m.result?.data);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: 10, method: 'Page.captureScreenshot', params: { format: 'png' } }));
      });

      if (screenshotData) {
        fs.writeFileSync(outFile, Buffer.from(screenshotData, 'base64'));
        console.log('Saved screenshot to:', outFile);
      }
    }
  } finally {
    edge.kill();
  }
}

async function run() {
  await capture('https://civicverse.github.io/Civicverse/#/signin', 'C:\\Users\\frybo\\Civicverse\\live_signin.png');
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
