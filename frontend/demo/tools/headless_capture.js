const fs = require('fs')
const path = require('path')

async function main(){
  const url = process.env.PREVIEW_URL || 'http://localhost:5000'
  console.log('Headless capture starting for', url)
  let puppeteer
  try{
    puppeteer = require('puppeteer')
  }catch(e){
    console.error('puppeteer is not installed. Run `npm install --save-dev puppeteer` in frontend/demo')
    process.exit(2)
  }

  let browser
  try{
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--disable-background-timer-throttling','--disable-backgrounding-occluded-windows']
    })
  }catch(err){
    console.error('Failed to launch browser. Missing system libs or sandboxing issues.')
    console.error('Typical missing libraries on Debian/Ubuntu: libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libxcb1 libxcomposite1 libxdamage1 libxrandr2 libxss1 libasound2 libx11-xcb1 libgtk-3-0 libxkbcommon0')
    console.error('Full error:\n', err && err.message)
    process.exit(3)
  }

  try{
    const page = await browser.newPage()
    page.on('console', msg => console.log('PAGE_LOG>', msg.text()))
    page.on('pageerror', err => console.error('PAGE_ERROR>', err.message))
    await page.setViewport({width:1280, height:800})
    page.on('console', msg => console.log('PAGE_LOG>', msg.text()))
    page.on('pageerror', err => console.error('PAGE_ERROR>', err && err.message))
    page.setDefaultNavigationTimeout(0)
    console.log('Navigating to', url)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 })
    try {
      await page.waitForSelector('.enter-overlay, .fhud-root, .social-overlay', { timeout: 60000 })
      console.log('Overlay selector present')
    } catch (e) {
      console.warn('Overlay selector not found in time, continuing')
    }

    // let the app settle
    await page.waitForTimeout(2000)

    // Diagnostic checks: ensure body.overlay-visible is present and canvas is hidden
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

    const out = path.resolve(__dirname, 'capture.png')
    await page.screenshot({path: out, fullPage: true})
    const htmlOut = path.resolve(__dirname, 'capture.html')
    const html = await page.content()
    fs.writeFileSync(htmlOut, html)
    console.log('Screenshot saved to', out, 'and HTML saved to', htmlOut)
    await browser.close()
    process.exit(0)
  }catch(e){
    console.error('Error during page capture:', e && e.message)
    try{ if (browser) await browser.close() }catch(_){}
    process.exit(4)
  }
}

main()
