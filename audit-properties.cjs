const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LANGUAGES = ['de', 'en', 'fr', 'ja', 'zh'];
const OUTPUT_DIR = './property-audit-report';

async function testLanguageProperties(browser, language) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  try {
    console.log(`\n🌐 [${language.toUpperCase()}] Starting test...`);
    
    // Go to app
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // Enter password gate
    const pwInput = await page.$('input[type="password"]');
    if (pwInput) {
      console.log(`  ✓ Found password gate, entering password...`);
      await page.fill('input[type="password"]', 'sitesync123');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
    }

    // Set language in localStorage
    await page.evaluate((lang) => {
      localStorage.setItem('language', lang);
    }, language);
    
    // Reload to apply language
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    console.log(`  ✓ Language set to ${language}`);

    // Take dashboard screenshot
    const dashPath = path.join(OUTPUT_DIR, `${language}-01-dashboard.png`);
    await page.screenshot({ path: dashPath });
    console.log(`  ✓ Dashboard screenshot: ${dashPath}`);

    // Try different selectors to find Properties link
    const selectors = [
      'a[href*="properties"]',
      'a[href*="property"]',
      'button:has-text("Properties")',
      '[role="button"]:has-text("Properties")',  
      'nav a:text-is("Properties")',
      'a:text-is("Properties")',
      'span:text-is("Properties")',
      '[data-testid="properties-link"]',
      '.sidebar a:has-text("Properties")',
      'nav [class*="property"]',
    ];

    let navigated = false;
    for (const selector of selectors) {
      try {
        const el = await page.$(selector);
        if (el && await el.isVisible()) {
          console.log(`  ✓ Found Properties with selector: ${selector}`);
          await el.click();
          await page.waitForTimeout(2000);
          navigated = true;
          break;
        }
      } catch (err) {
        // Try next selector
      }
    }

    if (navigated) {
      // Take properties list screenshot
      const propListPath = path.join(OUTPUT_DIR, `${language}-02-properties-list.png`);
      await page.screenshot({ path: propListPath });
      console.log(`  ✓ Properties list screenshot: ${propListPath}`);

      // Try to find and click first property
      const propertySelectors = [
        '[data-testid="property-card"]',
        '.property-card',
        '[class*="property-card"]',
        '[class*="prop-card"]',
        'a[class*="property"]',
        'div[role="button"][class*="property"]',
        '.grid > div:first-child > a',
        'article',
        '[class*="Card"]',
      ];

      let propertyClicked = false;
      for (const selector of propertySelectors) {
        try {
          const el = await page.$(selector);
          if (el && await el.isVisible()) {
            console.log(`  ✓ Found property card with selector: ${selector}`);
            await el.click();
            await page.waitForTimeout(2000);
            propertyClicked = true;
            break;
          }
        } catch (err) {
          // Try next selector
        }
      }

      if (propertyClicked) {
        // Take property detail screenshot
        const detailPath = path.join(OUTPUT_DIR, `${language}-03-property-detail.png`);
        await page.screenshot({ path: detailPath });
        console.log(`  ✓ Property detail screenshot: ${detailPath}`);

        // Extract visible text from detail modal
        const visibleText = await page.$$eval('*', elements => {
          return elements
            .filter(el => {
              const text = el.textContent?.trim();
              return text && text.length > 0 && text.length < 200 && el.offsetHeight > 0;
            })
            .map(el => ({
              text: el.textContent?.trim().substring(0, 100),
              tag: el.tagName,
            }))
            .slice(0, 50);  // First 50 visible text elements
        });

        console.log(`  📄 Visible text elements on detail modal:`);
        visibleText.forEach((item, idx) => {
          console.log(`     [${idx}] ${item.text.substring(0, 60)}...`);
        });
      } else {
        console.log(`  ⚠️  Could not find property card to click`);
      }
    } else {
      console.log(`  ⚠️  Could not navigate to Properties section`);
    }

    console.log(`  ✓ Console logs (${consoleLogs.length} messages):`);
    consoleLogs
      .filter(log => log.type === 'warning' || log.type === 'error')
      .slice(0, 5)
      .forEach(log => {
        console.log(`     [${log.type.toUpperCase()}] ${log.text}`);
      });

    return {
      language,
      consoleLogs,
      success: true,
    };

  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return {
      language,
      error: error.message,
      consoleLogs,
    };
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🔍 Comprehensive Property Section Audit - All 5 Languages\n');
  console.log('='.repeat(60));

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const allResults = {};

  // Test each language
  for (const lang of LANGUAGES) {
    const results = await testLanguageProperties(browser, lang);
    allResults[lang] = results;
  }

  await browser.close();

  // Save full report
  const reportPath = path.join(OUTPUT_DIR, 'property-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(allResults, null, 2));
  console.log(`\n✓ Full report saved to ${reportPath}`);

  console.log('\n' + '='.repeat(60));
  console.log(`\nAll screenshots and report saved to: ${OUTPUT_DIR}/`);
  console.log('\nScreenshot Files:');
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png')).sort();
  files.forEach(f => console.log(`  - ${f}`));
}

main().catch(console.error);
