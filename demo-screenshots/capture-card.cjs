const { chromium } = require('playwright-core');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 675 });
  
  const htmlPath = path.join(__dirname, 'promo-card.html');
  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(500);
  
  const outputPath = path.join(__dirname, 'promo-card.png');
  await page.screenshot({ path: outputPath, type: 'png' });
  
  console.log('Screenshot saved to:', outputPath);
  await browser.close();
})();
