const { spawn } = require('child_process');
const http = require('http');

async function inspectSignin() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--disable-gpu',
    '--no-sandbox',
    'https://civicverse.github.io/Civicverse/#/signin'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const getJson = (p) => new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:9227${p}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  try {
    const targets = await getJson('/json/list');
    const pageTarget = targets.find(t => t.url && t.url.includes('Civicverse'));
    console.log('Target:', pageTarget?.url);

    if (pageTarget) {
      const ws = new (globalThis.WebSocket)(pageTarget.webSocketDebuggerUrl);
      
      await new Promise(res => {
        ws.onopen = () => {
          ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
          ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));
          res();
        };
      });

      const logs = [];
      const errors = [];
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
          logs.push({ type: msg.params.type, args: msg.params.args.map(a => a.value || a.description) });
        }
        if (msg.method === 'Runtime.exceptionThrown') {
          errors.push(msg.params.exceptionDetails);
        }
      };

      await new Promise(r => setTimeout(r, 4000));

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
      const rootHtml = await evalExpr('document.getElementById("root")?.innerHTML');
      const text = await evalExpr('document.body.innerText');

      console.log('--- SIGNIN INSPECT ---');
      console.log('Current URL:', url);
      console.log('Logs:', JSON.stringify(logs, null, 2));
      console.log('Errors:', JSON.stringify(errors, null, 2));
      console.log('Root HTML length:', rootHtml ? rootHtml.length : 0);
      console.log('Root HTML preview:', rootHtml ? rootHtml.slice(0, 500) : 'null');
      console.log('Body Text:', text);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    edge.kill();
    process.exit(0);
  }
}

inspectSignin().catch(e => { console.error(e); process.exit(1); });
