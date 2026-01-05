const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
  const url = process.env.URL || 'http://localhost:5000';
  console.log('Opening', url);
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  const consoleMsgs = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMsgs.push(text);
    if (msg.type() === 'error' || /error/i.test(text)) errors.push(text);
    console.log('PAGE_LOG>', text);
  });

  page.on('pageerror', err => {
    console.log('PAGE_ERROR>', err.toString());
    errors.push(err.toString());
  });

  try {
    page.setDefaultNavigationTimeout(60000);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  } catch (e) {
    console.error('Navigation failed:', e && e.message);
  }

  // wait a bit for dynamic scripts to run (safe fallback)
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const html = await page.content();
  fs.writeFileSync('tools/capture.html', html);
  await page.screenshot({ path: 'tools/capture.png', fullPage: true });

  console.log('Captured tools/capture.png and tools/capture.html');
  if (errors.length) {
    console.error('Detected console/page errors:');
    for (const e of errors) console.error('-', e);
    await browser.close();
    process.exit(2);
  }

  console.log('No console errors detected.');
  await browser.close();
}

run().catch(err => { console.error(err); process.exit(1); });
