const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // 1. Landing password gate
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'ss_01_landing_gate.png' });
  console.log('1. Landing gate captured');

  // Enter password to get past gate
  const pwInput = await page.$('input[type="password"]');
  if (pwInput) {
    await pwInput.fill('sitesync123');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'ss_02_auth.png' });
    console.log('2. Auth page captured');

    // Try to find email/password login fields
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.fill('test@test.com');
      const passInput = await page.$('input[type="password"]');
      if (passInput) await passInput.fill('test123');
      await page.screenshot({ path: 'ss_02b_auth_filled.png' });
      console.log('2b. Auth page filled');
    }
  }

  await browser.close();
})().catch(e => console.error('Error:', e.message));
