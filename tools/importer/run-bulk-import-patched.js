#!/usr/bin/env node

/**
 * Bulk Import Runner
 *
 * Usage:
 *   node tools/importer/run-bulk-import.js \
 *     --import-script path/to/import.js \
 *     --urls path/to/urls.txt
 *
 * Executes an import script against each URL, converts the transformed DOM to markdown,
 * and saves the files to a content directory. Designed to reuse the helix importer bundle in-browser.
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { wrapBareImgInPicture } from './wrap-bare-img-in-picture.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the compileReportsToExcel function
const importReportPath = join(__dirname, './import-report.js');
const { compileReportsToExcel } = await import(importReportPath);

const REQUIRED_ARGS = ['--import-script', '--urls'];
const VIEWPORT_WIDTH = 1920;
const VIEWPORT_HEIGHT = 1080;
const PAGE_TIMEOUT = 45000;
const POPUP_DISMISS_DELAY = 500;
const ESCAPE_KEY_DELAY = 300;
const MIN_DELAY_BETWEEN_REQUESTS = 1000; // 1 second
const MAX_DELAY_BETWEEN_REQUESTS = 3000; // 3 seconds

/**
 * Random delay to avoid bot detection
 */
async function randomDelay() {
  const delay = Math.floor(Math.random() * (MAX_DELAY_BETWEEN_REQUESTS - MIN_DELAY_BETWEEN_REQUESTS + 1)) + MIN_DELAY_BETWEEN_REQUESTS;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Simulate human-like scrolling behavior
 */
async function randomScroll(page) {
  try {
    const scrolls = Math.floor(Math.random() * 3) + 1; // 1-3 scrolls
    for (let i = 0; i < scrolls; i++) {
      const scrollAmount = Math.floor(Math.random() * 500) + 200; // 200-700px
      await page.evaluate((amount) => {
        window.scrollBy(0, amount);
      }, scrollAmount);
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200)); // 200-700ms between scrolls
    }
  } catch (error) {
    // Ignore scroll errors
  }
}

function printUsageAndExit(message) {
  if (message) {
    console.error(`Error: ${message}`);
  }
  console.error('');
  console.error('Usage:');
  console.error('  node tools/importer/run-bulk-import.js \\');
  console.error('    --import-script path/to/import.js \\');
  console.error('    --urls path/to/urls.txt');
  console.error('');
  console.error('Output directory: content');
  console.error('');
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const value = args[i + 1];
      if (!value || value.startsWith('--')) {
        printUsageAndExit(`Missing value for ${arg}`);
      }
      parsed[arg] = value;
      i++;
    } else {
      printUsageAndExit(`Unexpected argument: ${arg}`);
    }
  }

  for (const required of REQUIRED_ARGS) {
    if (!parsed[required]) {
      printUsageAndExit(`Missing required argument ${required}`);
    }
  }

  return {
    importScript: resolve(parsed['--import-script']),
    urlsFile: resolve(parsed['--urls']),
    outputDir: resolve(process.cwd(), 'content'),
  };
}

function loadUrls(urlFile) {
  if (!existsSync(urlFile)) {
    printUsageAndExit(`URLs file not found at ${urlFile}`);
  }

  const raw = readFileSync(urlFile, 'utf-8');
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
}

async function dismissPopups(page) {
  try {
    const dismissSelectors = [
      'button[id*="accept" i]',
      'button[id*="cookie" i]',
      'button[class*="accept" i]',
      'button[class*="cookie" i]',
      'button[class*="consent" i]',
      'a[class*="accept" i]',
      'a[id*="accept" i]',
      '[aria-label*="accept" i]',
      '[aria-label*="agree" i]',
      '[data-testid*="accept" i]',
      '[data-testid*="cookie" i]',
      '#onetrust-accept-btn-handler',
      '.onetrust-close-btn-handler',
      '#cookie-consent-accept',
      '.cookie-consent-accept',
      '.accept-cookies',
      'button[aria-label*="close" i]',
      'button[class*="close" i]:not([class*="closed"])',
      '[data-dismiss="modal"]',
      '.modal-close',
      '.overlay-close',
      '.popup-close',
    ];

    for (const selector of dismissSelectors) {
      const elements = await page.$$(selector);
      for (const element of elements) {
        const isVisible = await element.isVisible().catch(() => false);
        if (!isVisible) continue;
        const text = await element.evaluate(el => el.textContent?.toLowerCase() || '');
        if (
          text.includes('accept') ||
          text.includes('agree') ||
          text.includes('consent') ||
          text.includes('allow') ||
          text.includes('ok') ||
          text.includes('close') ||
          text.includes('continue')
        ) {
          await element.click().catch(() => { });
          await page.waitForTimeout(POPUP_DISMISS_DELAY);
          break;
        }
      }
    }

    await page.keyboard.press('Escape').catch(() => { });
    await page.waitForTimeout(ESCAPE_KEY_DELAY);
  } catch {
    // ignore popup errors
  }
}

async function injectScript(page, scriptContent) {
  await page.evaluate(script => {
    const scriptEl = document.createElement('script');
    scriptEl.textContent = script;
    document.head.appendChild(scriptEl);
  }, scriptContent);
}

function ensureDir(pathname) {
  mkdirSync(pathname, { recursive: true });
}

export function sanitizeDocumentPath(docPath, fallbackUrl) {
  // If docPath missing or invalid, build from URL path
  if (!docPath || typeof docPath !== 'string') {
    const { pathname } = new URL(fallbackUrl);
    docPath = pathname || '/';
  }

  let normalized = docPath.replace(/\\/g, '/');
  if (normalized.startsWith('/')) normalized = normalized.slice(1);
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  if (normalized === '') normalized = 'index';

  return normalized;
}

async function processUrl({
  context,
  url,
  helixImporterScript,
  importScriptContent,
  outputDir,
  index,
  total,
}) {
  const label = `[${index}/${total}]`;
  console.log(`${label} Starting ${url}`);

  const page = await context.newPage();

  // Capture browser console logs to see transform function output
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.error(`[Browser Console] ${text}`);
    } else if (type === 'warning') {
      console.warn(`[Browser Console] ${text}`);
    } else {
      console.log(`[Browser Console] ${text}`);
    }
  });

  // Stealth: Remove webdriver flag and add realistic properties
  await page.addInitScript(() => {
    // Remove navigator.webdriver
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });

    // Add chrome object
    window.chrome = { runtime: {} };

    // Spoof plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // Spoof languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  });

  try {

    // Route interception for Cloudflare-blocked sites
    const staticHtmlDir = process.env.STATIC_HTML_DIR;
    if (staticHtmlDir) {
      const staticFs = await import("fs");
      const staticPath = await import("path");
      await page.route("**/*", async (route) => {
        const reqUrl = route.request().url();
        if (reqUrl.match(/edmundoptics\.com\/?(\?.*)?$/)) {
          const htmlFile = staticPath.default.join(staticHtmlDir, "index.html");
          if (staticFs.default.existsSync(htmlFile)) {
            const body = staticFs.default.readFileSync(htmlFile, "utf8");
            await route.fulfill({ status: 200, contentType: "text/html", body });
            return;
          }
        }
        await route.continue();
      });
    }

    // Navigate to url
    try {
      await page.goto(url);
    } catch (error) {
      // Fall back to domcontentloaded if networkidle times out
      console.log('⚠️  Falling back to domcontentloaded...');
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT });
      await page.waitForTimeout(3000); // Give page extra time to settle
    }

    await dismissPopups(page);

    // Random scrolling to appear more human-like
    await randomScroll(page);

    // Inject Helix importer bundle
    await page.evaluate(script => {
      const originalDefine = window.define;
      if (typeof window.define !== 'undefined') {
        delete window.define;
      }
      const scriptEl = document.createElement('script');
      scriptEl.textContent = script;
      document.head.appendChild(scriptEl);
      if (originalDefine) {
        window.define = originalDefine;
      }
    }, helixImporterScript);

    // Inject the provided import script
    await injectScript(page, importScriptContent);

    // Wait for CustomImportScript to be available (with timeout)
    try {
      await page.waitForFunction(
        () => typeof window.CustomImportScript !== 'undefined' && window.CustomImportScript?.default,
        { timeout: 10000 }
      );
    } catch (error) {
      throw new Error(`CustomImportScript.default not found after 10s. The bundled script may not have loaded correctly. Check browser console for errors.`);
    }

    const result = await page.evaluate(async pageUrl => {
      if (!window.WebImporter || typeof window.WebImporter.html2md !== 'function') {
        throw new Error('WebImporter not available. helix-importer script failed to load.');
      }

      // Bundled scripts expose CustomImportScript.default with a transform function
      const customImportConfig = window.CustomImportScript?.default;
      if (!customImportConfig) {
        throw new Error('CustomImportScript not available - bundle may not have loaded correctly');
      }

      try {
        // Run the transform function
        const result = await window.WebImporter.html2md(pageUrl, document, customImportConfig, {
          toDocx: false,
          toMd: true,
          originalURL: pageUrl
        });

        // Convert markdown to HTML for DA compliance
        result.html = window.WebImporter.md2da(result.md);
        return result;
      } catch (error) {
        throw new Error(`Failed to import page: ${error.message}`);
      }
    }, url);

    // Validate result structure - we only care about HTML output now
    if (!result.path || typeof result.path !== 'string') {
      throw new Error(`Transform did not return valid path. Got: ${typeof result.path}`);
    }

    if (!result.html || typeof result.html !== 'string') {
      throw new Error(`HTML generation failed. Transform must produce HTML content. Got: ${typeof result.html}`);
    }

    const relativeDocPath = sanitizeDocumentPath(result.path, url);
    const plainHtmlPath = join(outputDir, `${relativeDocPath}.plain.html`);
    ensureDir(dirname(plainHtmlPath));

    // md2da can emit bare <img>; many block contracts expect <picture><img>…
    const plainHtml = wrapBareImgInPicture(result.html);
    writeFileSync(plainHtmlPath, plainHtml, 'utf-8');

    // Write report file with status tracking
    const reportsDir = 'tools/importer/reports';
    const reportPath = join(reportsDir, `${relativeDocPath}.report.json`);
    ensureDir(dirname(reportPath));

    const reportData = {
      status: 'success',
      url,
      path: relativeDocPath,
      timestamp: new Date().toISOString(),
      ...(result.report || {}),
    };

    writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');

    console.log(`${label} ✅ Saved content to ${relativeDocPath}`);
    return { success: true, path: relativeDocPath };
  } catch (error) {
    console.error(`${label} ❌ Failed for ${url}: ${error.message}`);

    // Write failure report
    try {
      const { pathname } = new URL(url);
      let fallbackPath = pathname || '/';
      if (fallbackPath.endsWith('/')) fallbackPath = fallbackPath === '/' ? '/index' : fallbackPath.slice(0, -1);
      if (fallbackPath.startsWith('/')) fallbackPath = fallbackPath.slice(1);
      if (fallbackPath === '') fallbackPath = 'index';

      const reportsDir = 'tools/importer/reports';
      const reportPath = join(reportsDir, `${fallbackPath}.report.json`);
      ensureDir(dirname(reportPath));

      const reportData = {
        status: 'failed',
        url,
        path: fallbackPath,
        timestamp: new Date().toISOString(),
        error: error.message,
        errorStack: error.stack,
      };

      writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
    } catch (reportError) {
      console.error(`${label} Failed to write error report: ${reportError.message}`);
    }

    return { success: false, error };
  } finally {
    await page.close().catch(() => { });
  }
}

async function main() {
  const { importScript, urlsFile, outputDir } = parseArgs();

  if (!existsSync(importScript)) {
    printUsageAndExit(`Import script not found at ${importScript}`);
  }

  const urls = loadUrls(urlsFile);

  if (urls.length === 0) {
    printUsageAndExit('URL list is empty after filtering comments/blank lines.');
  }

  ensureDir(outputDir);

  const helixImporterPath = join(__dirname, 'static', 'inject', 'helix-importer.js');
  if (!existsSync(helixImporterPath)) {
    printUsageAndExit(`helix-importer.js not found at ${helixImporterPath}`);
  }

  const helixImporterScript = readFileSync(helixImporterPath, 'utf-8');
  const importScriptContent = readFileSync(importScript, 'utf-8');

  console.log('[Bulk Import] Starting run with:');
  console.log(`  Import script: ${importScript}`);
  console.log(`  URLs file:     ${urlsFile}`);
  console.log(`  Output dir:    ${outputDir}`);
  console.log(`  URL count:     ${urls.length}`);
  console.log('');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled', // Hide automation
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
  });

  // Create browser context with stealth settings
  const context = await browser.newContext({
    viewport: {
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
    },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    // Playwright has built-in stealth features
    ignoreHTTPSErrors: true,
  });

  let successCount = 0;

  try {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      // Add random delay between requests (except for the first one)
      if (i > 0) {
        await randomDelay();
      }

      const result = await processUrl({
        context,
        url,
        helixImporterScript,
        importScriptContent,
        outputDir,
        index: i + 1,
        total: urls.length,
      });
      if (result.success) {
        successCount++;
      }
    }
  } finally {
    await context.close().catch(() => { });
    await browser.close().catch(() => { });
  }

  console.log(
    `[Bulk Import] Completed. Success: ${successCount}/${urls.length}, Failures: ${urls.length - successCount}`
  );

  // Compile all report files into Excel
  await compileReportsToExcel(importScript);
}

// Only run main() if this file is executed directly, not when imported
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(err => {
    console.error('[Bulk Import] Unexpected error:', err);
    process.exit(1);
  });
}
