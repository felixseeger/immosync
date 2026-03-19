#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportDir = path.join(__dirname, 'property-audit-report-v2');

// Translation keys for Properties link by language
const translationKeys = {
  de: 'Immobilien',
  en: 'Properties', 
  fr: 'Propriétés',
  ja: 'プロパティ',
  zh: '物业'
};

const createReportDir = () => {
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
};

const extractText = (text) => {
  // Remove extra whitespace
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
};

const detectPatterns = (text) => {
  const patterns = {
    i18nKeys: [...text.matchAll(/t\.\w+\.\w+/g)].map(m => m[0]),
    suspiciousEnglish: [...text.matchAll(/\b(Properties|Add|Edit|Delete|View|Schedule|Save|Cancel)\b/g)].map(m => m[0])
  };
  return patterns;
};

const runAudit = async () => {
  createReportDir();
  
  console.log('🔍 Property Section Audit - Enhanced Version');
  console.log('='.repeat(60));
  
  const results = {
    timestamp: new Date().toISOString(),
    languages: ['de', 'en', 'fr', 'ja', 'zh'],
    results: {}
  };
  
  for (const lang of results.languages) {
    console.log(`\n🌐 [${lang.toUpperCase()}] Starting comprehensive test...`);
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
      // Navigate to app
      console.log('  ⏸ Navigating to localhost:3000...');
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
      
      // Enter password if needed
      const passwordInput = await page.$('input[type="password"]');
      if (passwordInput) {
        console.log('  ✓ Password gate detected, entering password...');
        await page.fill('input[type="password"]', 'sitesync123');
        
          // Use keyboard Enter to submit form
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);
          
          // Verify we reached Auth screen
          try {
            await page.waitForSelector('input[type="email"]', { timeout: 5000 });
            console.log('  ✓ Reached Auth screen - password gate bypassed');
          } catch (e) {
            console.log('  ⚠️  Did not reach Auth screen after password - may still be on gate');
          }
      }
      
      // Set language in localStorage
      await page.evaluate(([language]) => {
        localStorage.setItem('language', language);
      }, [lang]);
      
      // Add small delay before reload
      await page.waitForTimeout(500);
      
      // Reload to apply language
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      // Screenshot dashboard
      const dashboardFile = path.join(reportDir, `${lang}-01-dashboard.png`);
      await page.screenshot({ path: dashboardFile, fullPage: false });
      console.log(`  ✓ Dashboard screenshot: ${path.basename(dashboardFile)}`);
      
      // Try to find Properties link with multiple strategies
      console.log('  ⏳ Looking for Properties navigation...');
      
      // Strategy 1: Look for building icon in sidebar
      let propertiesButton = null;
      
      // Try finding by role and aria-label
      let buttons = await page.locator('nav a, nav button, nav [role="button"]').all();
      console.log(`     Found ${buttons.length} navigation items`);
      
      // Strategy 2: Click the second nav item (Dashboard=0, Properties=1)
      const navItems = await page.locator('nav [role="button"], nav a').all();
      console.log(`     Found ${navItems.length} nav items by role-button/link`);
      
      if (navItems.length > 1) {
        console.log('  ✓ Found navigation items, clicking Properties (index 1)...');
        await navItems[1].click();
        await page.waitForTimeout(1500);
        
        // Screenshot properties list
        const propsListFile = path.join(reportDir, `${lang}-02-properties-list.png`);
        await page.screenshot({ path: propsListFile, fullPage: false });
        console.log(`  ✓ Properties list screenshot: ${path.basename(propsListFile)}`);
        
        // Try to find and click first property card
        const propertyCards = await page.locator('[data-testid="property-card"], .property-card, [class*="property"][class*="card"], button:has(img)').all();
        console.log(`     Found ${propertyCards.length} property cards`);
        
        if (propertyCards.length > 0) {
          console.log('  ✓ Found property cards, clicking first one...');
          
          // Just click the first clickable item
          const clickables = await page.locator('button, a, [role="button"]').filter({ has: page.locator('img, [class*="image"]') }).all();
          if (clickables.length > 0) {
            await clickables[0].click();
            await page.waitForTimeout(1500);
            
            // Screenshot detail modal
            const detailFile = path.join(reportDir, `${lang}-03-property-detail.png`);
            await page.screenshot({ path: detailFile, fullPage: false });
            console.log(`  ✓ Property detail screenshot: ${path.basename(detailFile)}`);
            
            // Extract visible text from detail
            const detailText = await page.evaluate(() => {
              return document.body.innerText;
            });
            
            if (detailText) {
              const lines = extractText(detailText);
              const patterns = detectPatterns(detailText);
              
              results.results[lang] = {
                navigated: true,
                detailTextLines: lines.slice(0, 50),
                suspiciousPatterns: patterns
              };
              
              console.log(`  ✓ Extracted ${lines.length} text lines from detail modal`);
              console.log(`  ⚠️  Suspicious patterns found: ${JSON.stringify(patterns)}`);
            }
          }
        }
      } else {
        console.log('  ❌ Could not find Properties navigation - only found', navItems.length, 'items');
        
        // Print all text content to understand page structure
        const pageText = await page.evaluate(() => document.body.innerText);
        console.log('\n📄 Page text content (first 500 chars):');
        console.log(pageText.substring(0, 500));
        
        results.results[lang] = {
          navigated: false,
          error: 'Could not find Properties navigation'
        };
      }
      
      // Capture console logs
      const consoleLogs = [];
      page.on('console', msg => {
        consoleLogs.push({
          type: msg.type(),
          text: msg.text()
        });
      });
      
      results.results[lang].consoleLogs = consoleLogs;
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      results.results[lang] = {
        navigated: false,
        error: error.message
      };
    } finally {
      await browser.close();
    }
  }
  
  // Save report
  const reportFile = path.join(reportDir, 'audit-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  console.log(`\n✅ Report saved to ${reportFile}`);
  
  // Also save human-readable summary
  const summary = `
Property Section Audit Report
==============================
Generated: ${new Date().toISOString()}

Summary:
--------
${results.languages.map(lang => {
  const langResult = results.results[lang];
  return `✓ ${lang.toUpperCase()}: ${langResult.navigated ? 'Properties section accessed' : 'Navigation failed'}`;
}).join('\n')}

Screenshots Generated:
${fs.readdirSync(reportDir).filter(f => f.endsWith('.png')).map(f => `  - ${f}`).join('\n')}

See audit-report.json for detailed results.
  `.trim();

  fs.writeFileSync(path.join(reportDir, 'SUMMARY.txt'), summary);
  console.log('\n' + summary);
};

runAudit().catch(console.error);
