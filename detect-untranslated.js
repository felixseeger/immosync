const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LANGUAGES = ['de', 'en', 'fr', 'ja', 'zh'];
const OUTPUT_DIR = './untranslated-report';

// Patterns that indicate untranslated text
const UNTRANSLATED_PATTERNS = [
  /\bt\./,  // t.something pattern from i18n
  /propertyDetail\./,
  /property\./,
  /undefined/i,
  /\[object Object\]/,
  /{{.*?}}/,  // Angular-style templates
  /{{\s*\w+/,  // React template leaks
];

// Common English words that might indicate untranslated sections
const ENGLISH_KEYWORDS = [
  'undefined', 'null', 'NaN', 'Click', 'Submit', 'Cancel', 'Save',
  'Edit', 'Delete', 'Add', 'Close', 'Back', 'Next', 'Previous',
];

async function extractPageText(page) {
  const allText = await page.evaluate(() => {
    const elements = document.querySelectorAll('body *');
    const texts = [];
    elements.forEach(el => {
      if (el.children.length === 0) {  // Only leaf nodes
        const text = el.textContent?.trim();
        if (text && text.length < 200 && text.length > 0) {
          texts.push({
            text,
            element: el.tagName,
            visible: el.offsetHeight > 0,
          });
        }
      }
    });
    return texts;
  });
  return allText;
}

function detectUntranslated(textArray) {
  const untranslated = [];
  const suspiciousPatterns = [];

  textArray.forEach(item => {
    const { text } = item;
    
    // Check for pattern matches
    UNTRANSLATED_PATTERNS.forEach(pattern => {
      if (pattern.test(text)) {
        suspiciousPatterns.push({
          text,
          pattern: pattern.toString(),
          ...item,
        });
      }
    });

    // Check for hardcoded English with no translation context
    if (text.length < 50) {
      const isEnglishKeyword = ENGLISH_KEYWORDS.some(keyword => text.toLowerCase() === keyword.toLowerCase());
      if (isEnglishKeyword && item.visible) {
        untranslated.push({
          text,
          reason: 'Possible hardcoded English keyword',
          ...item,
        });
      }
    }
  });

  return { untranslated, suspiciousPatterns };
}

async function testLanguage(browser, language) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  try {
    // Go to app
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // Enter password gate
    const pwInput = await page.$('input[type="password"]');
    if (pwInput) {
      await page.fill('input[type="password"]', 'sitesync123');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
    }

    // Set language
    await page.evaluate((lang) => {
      localStorage.setItem('language', lang);
    }, language);
    
    // Reload to apply language
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Take screenshot
    const ssPath = path.join(OUTPUT_DIR, `screenshot-${language}.png`);
    await page.screenshot({ path: ssPath });
    console.log(`✓ Screenshot captured for ${language} at ${ssPath}`);

    // Extract text from different sections
    const results = {
      language,
      sections: {},
    };

    // 1. Check Dashboard
    const dashboardText = await extractPageText(page);
    const dashboardAnalysis = detectUntranslated(dashboardText);
    results.sections.dashboard = dashboardAnalysis;

    // 2. Try to navigate to Properties section
    try {
      const propertiesLink = await page.$('a:has-text("Properties"), button:has-text("Properties"), [role="button"]:has-text("Properties")');
      if (propertiesLink) {
        await propertiesLink.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(OUTPUT_DIR, `screenshot-${language}-properties.png`) });
        
        const propertiesText = await extractPageText(page);
        const propertiesAnalysis = detectUntranslated(propertiesText);
        results.sections.properties = propertiesAnalysis;
      }
    } catch (err) {
      console.log(`  - Could not navigate to Properties for ${language}`);
    }

    // 3. Try to open a property detail
    try {
      const propertyCard = await page.$('[data-testid="property-card"], .property-card, [class*="property"]');
      if (propertyCard) {
        await propertyCard.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(OUTPUT_DIR, `screenshot-${language}-detail.png`) });
        
        const detailText = await extractPageText(page);
        const detailAnalysis = detectUntranslated(detailText);
        results.sections.propertyDetail = detailAnalysis;
      }
    } catch (err) {
      console.log(`  - Could not open property detail for ${language}`);
    }

    return results;

  } catch (error) {
    console.error(`Error testing ${language}:`, error.message);
    return { language, error: error.message };
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🔍 Starting untranslated text detection...\n');

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const allResults = {};

  // Test each language
  for (const lang of LANGUAGES) {
    console.log(`\n📋 Testing language: ${lang.toUpperCase()}`);
    const results = await testLanguage(browser, lang);
    allResults[lang] = results;
  }

  await browser.close();

  // Generate report
  console.log('\n\n📊 GENERATING REPORT...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    languages: LANGUAGES,
    results: allResults,
  };

  // Save full report
  const reportPath = path.join(OUTPUT_DIR, 'untranslated-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`✓ Full report saved to ${reportPath}`);

  // Print summary
  console.log('\n📋 SUMMARY:');
  console.log('='.repeat(60));

  for (const lang of LANGUAGES) {
    const langResults = allResults[lang];
    if (langResults.error) {
      console.log(`\n${lang.toUpperCase()}: ERROR - ${langResults.error}`);
      continue;
    }

    const allUntranslated = [];
    const allSuspicious = [];

    for (const [section, analysis] of Object.entries(langResults.sections)) {
      if (analysis.untranslated?.length > 0) {
        allUntranslated.push(...analysis.untranslated.map(u => ({ ...u, section })));
      }
      if (analysis.suspiciousPatterns?.length > 0) {
        allSuspicious.push(...analysis.suspiciousPatterns.map(s => ({ ...s, section })));
      }
    }

    if (allUntranslated.length === 0 && allSuspicious.length === 0) {
      console.log(`\n✅ ${lang.toUpperCase()}: No untranslated text detected!`);
    } else {
      console.log(`\n⚠️  ${lang.toUpperCase()}:`);
      
      if (allUntranslated.length > 0) {
        console.log(`  Untranslated (${allUntranslated.length}):`);
        allUntranslated.slice(0, 5).forEach(item => {
          console.log(`    - [${item.section}] ${item.text.substring(0, 50)}`);
        });
        if (allUntranslated.length > 5) {
          console.log(`    ... and ${allUntranslated.length - 5} more`);
        }
      }

      if (allSuspicious.length > 0) {
        console.log(`  Suspicious patterns (${allSuspicious.length}):`);
        allSuspicious.slice(0, 5).forEach(item => {
          console.log(`    - [${item.section}] ${item.text.substring(0, 50)}`);
        });
        if (allSuspicious.length > 5) {
          console.log(`    ... and ${allSuspicious.length - 5} more`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\nScreenshots and detailed report saved to: ${OUTPUT_DIR}/`);
}

main().catch(console.error);
