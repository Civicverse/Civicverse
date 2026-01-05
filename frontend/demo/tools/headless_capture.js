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
    browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']})
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
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 })
    await page.waitForTimeout(1200)
    const out = path.resolve(__dirname, 'capture.png')
    await page.screenshot({path: out, fullPage: false})
    console.log('Screenshot saved to', out)
    await browser.close()
    process.exit(0)
  }catch(e){
    console.error('Error during page capture:', e && e.message)
    try{ if (browser) await browser.close() }catch(_){}
    process.exit(4)
  }
}

main()
