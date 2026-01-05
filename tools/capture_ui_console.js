const fs = require('fs');
const puppeteer = require('puppeteer');

(async ()=>{
  const out = { console: [], network: [] };
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    out.console.push({type: msg.type(), text: msg.text()});
  });

  page.on('pageerror', err => {
    out.console.push({type: 'pageerror', text: err && err.message});
  });

  page.on('requestfailed', req => {
    out.network.push({url: req.url(), status: 'failed', failure: req.failure()});
  });

  page.on('response', async res => {
    try{
      const ct = res.headers()['content-type'] || '';
      out.network.push({url: res.url(), status: res.status(), type: ct});
    }catch(e){/* ignore */}
  });

  const target = process.env.TARGET_URL || 'http://localhost:4320';
  await page.goto(target, { waitUntil: 'networkidle2', timeout: 15000 }).catch(e=>{
    out.console.push({type:'goto-error', text: e.message});
  });

  // wait a bit for any async scripts (use a portable sleep)
  const sleep = (ms) => new Promise(res => setTimeout(res, ms));
  await sleep(1000);

  // dump DOM size and a bit of body
  const bodyHtml = await page.evaluate(()=>({inner: document.body ? document.body.innerText.slice(0,800) : ''})).catch(()=>({}));
  out.dom = bodyHtml;

  await browser.close();
  fs.writeFileSync('tools/capture_ui_console.json', JSON.stringify(out, null, 2));
  console.log('Wrote tools/capture_ui_console.json');
  process.exit(0);
})();