const { chromium } = require('playwright-core');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 630 });
  
  const htmlPath = path.join(__dirname, 'discord-promo.html');
  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(500);
  
  const outputPath = path.join(__dirname, 'discord-promo.png');
  await page.screenshot({ path: outputPath, type: 'png' });
  
  console.log('Discord promo image saved to:', outputPath);
  await browser.close();
})();
