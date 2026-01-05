const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
  const url = process.env.URL || 'http://localhost:5000';
  console.log('Opening', url);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--disable-background-timer-throttling','--disable-backgrounding-occluded-windows']
  });
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

  // Preflight: ensure the server responds quickly before launching heavy puppeteer navigation
  try {
    const http = require('http')
    await new Promise((resolve, reject) => {
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          res.resume()
          resolve()
        } else {
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      })
      req.on('error', reject)
      req.setTimeout(10000, () => { req.destroy(new Error('preflight timeout')) })
    })
  } catch (e) {
    console.error('Preflight HTTP check failed:', e && e.message)
  }

  try {
    page.setDefaultNavigationTimeout(0);
    console.log('Puppeteer user agent:', await browser.userAgent());
    console.log('Navigating to page (no navigation timeout)');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });

    // Wait for the Enter overlay (or HUD/social overlay) so we know the app rendered UI
    try {
      await page.waitForSelector('.enter-overlay, .fhud-root, .social-overlay', { timeout: 60000 })
      console.log('Overlay selector present');
    } catch (e) {
      console.warn('Overlay selector not found within timeout, continuing');
    }
  } catch (e) {
    console.error('Navigation failed (continuing):', e && e.message);
  }

    // additional wait to let dynamic scripts (three.js, models, websockets) settle
  await new Promise((resolve) => setTimeout(resolve, 8000));

  // Diagnostic evaluation: ensure overlay exists and r3f/canvas are not visible until user enters
  try {
    const diag = await page.evaluate(() => {
      const bodyHas = document.body.classList.contains('overlay-visible')
      const canvases = Array.from(document.querySelectorAll('canvas'))
      const canvasStates = canvases.map(c => {
        const style = window.getComputedStyle(c)
        const rect = c.getBoundingClientRect()
        return { display: style.display, visibility: style.visibility, width: rect.width, height: rect.height }
      })
      const threeWrapper = !!document.querySelector('.three-wrapper')
      const threeWrapperVisible = (() => {
        const el = document.querySelector('.three-wrapper')
        if (!el) return null
        const s = window.getComputedStyle(el)
        return { display: s.display, visibility: s.visibility }
      })()
      return { bodyHas, canvasCount: canvases.length, canvasStates, threeWrapper, threeWrapperVisible }
    })
    console.log('DIAG>', JSON.stringify(diag, null, 2))
  } catch (e) {
    console.warn('Diagnostic check failed:', e && e.message)
  }

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
