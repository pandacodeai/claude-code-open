const { chromium } = require('playwright-core');
const path = require('path');

const DEMO_URL = 'http://localhost:3000/';
const OUT_DIR = path.join(__dirname);

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 2,
  });
  
  const page = await context.newPage();
  
  console.log('1. Navigating to Web UI...');
  await page.goto(DEMO_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  
  // Screenshot 1: Main interface
  console.log('2. Screenshot 1: Main interface...');
  await page.screenshot({ path: path.join(OUT_DIR, '01-main.png'), fullPage: false });
  
  // Screenshot 2: Open search panel (Ctrl+Shift+F or button)
  console.log('3. Screenshot 2: Opening search panel...');
  try {
    // Try keyboard shortcut first
    await page.keyboard.press('Control+Shift+F');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT_DIR, '02-search-panel.png'), fullPage: false });
  } catch(e) {
    console.log('  Search panel open failed:', e.message.split('\n')[0]);
  }
  
  // Screenshot 3: Type search query
  console.log('4. Screenshot 3: Search query...');
  try {
    const searchInput = page.locator('input[placeholder*="搜索"], input[type="text"]').first();
    await searchInput.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await page.keyboard.type('ConversationLoop', { delay: 60 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, '03-search-query.png'), fullPage: false });
  } catch(e) {
    console.log('  Search query failed:', e.message.split('\n')[0]);
  }
  
  // Screenshot 4: Search results
  console.log('5. Screenshot 4: Search results...');
  await page.waitForTimeout(2000); // Wait for search to complete
  await page.screenshot({ path: path.join(OUT_DIR, '04-search-results.png'), fullPage: false });
  
  // Screenshot 5: Click on a result to navigate
  console.log('6. Screenshot 5: Navigate to result...');
  try {
    const firstResult = page.locator('[class*="search-result"], [class*="SearchResult"], li, div').filter({ hasText: 'loop.ts' }).first();
    await firstResult.click({ timeout: 5000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT_DIR, '05-result-navigation.png'), fullPage: false });
  } catch(e) {
    console.log('  Result navigation skipped:', e.message.split('\n')[0]);
  }
  
  console.log('Done! Screenshots saved to', OUT_DIR);
  await browser.close();
})();
