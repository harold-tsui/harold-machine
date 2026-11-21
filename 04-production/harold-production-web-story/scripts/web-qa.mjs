// web-qa.mjs — 网页故事双端验收脚本
//
// 用法：
//   npm i playwright        # 项目里装一次即可
//   node web-qa.mjs --root <项目根> [--port 4173] [--expect qa.expect.json] [--out EVIDENCE]
//
// 检查项（每个视口）：
//   - 控制台错误 / 页面异常（必须为 0）
//   - 横向溢出（必须为 false）
//   - 图片加载失败（必须为 0）
//   - 图片未设置 alt 属性（必须为 0；装饰图写 alt="" 也算已设置）
//   - 顺带记录 LCP / CLS 与 head（lang / title / og 缺失项），供交付时核对，不单独判失败
//   - 独立可点元素触控高度 <44px（必须为 0；44px 是内部标准，严于 WCAG 2.5.8 的 24×24 AA；正文句内链接按 2.5.8 Inline 例外豁免）
//   - 图标按钮（无文字）宽或高 <44px（必须为 0）
//   - 正文对比度 <4.5:1（大字号 <3:1；渐变/图片背景跳过）
// 全局检查：
//   - 锚点完整性：每个 a[href^="#"] 必须有对应 id
//   - 探针：--expect 指定的 { "选择器": 预期数量 | {"min": n, "max": m} }
// 截图自动存入 <out>（默认 <root>/EVIDENCE）。

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

function parseArgs(argv) {
  const args = { root: process.cwd(), port: 4173, expect: null, out: null };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--root') args.root = path.resolve(argv[++i]);
    else if (key === '--port') args.port = Number(argv[++i]);
    else if (key === '--expect') args.expect = path.resolve(argv[++i]);
    else if (key === '--out') args.out = path.resolve(argv[++i]);
    else {
      console.error(`Unknown arg: ${key}`);
      process.exit(2);
    }
  }
  if (!args.out) args.out = path.join(args.root, 'EVIDENCE');
  return args;
}

function loadPlaywright(root) {
  const candidates = [path.join(root, 'node_modules')];
  try {
    candidates.push(execSync('npm root -g', { encoding: 'utf8' }).trim());
  } catch (err) {
    void err;
  }
  for (const base of candidates) {
    try {
      const req = createRequire(path.join(base, 'package.json'));
      return req('playwright');
    } catch (err) {
      void err;
    }
  }
  console.error('playwright not found. Run `npm i playwright` in your project first (or install it globally).');
  process.exit(2);
}

function makeServer(root, port) {
  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    let pathname = decodeURIComponent(url.pathname); // 中文路径兼容
    if (pathname === '/') pathname = '/index.html';
    const filePath = path.join(root, pathname);
    if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = ext === '.html' ? 'text/html; charset=utf-8'
      : ext === '.js' ? 'text/javascript; charset=utf-8'
      : ext === '.mjs' ? 'text/javascript; charset=utf-8'
      : ext === '.css' ? 'text/css; charset=utf-8'
      : ext === '.svg' ? 'image/svg+xml'
      : ext === '.webp' ? 'image/webp'
      : ext === '.png' ? 'image/png'
      : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
      : ext === '.json' ? 'application/json; charset=utf-8'
      : ext === '.woff2' ? 'font/woff2'
      : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    fs.createReadStream(filePath).pipe(res);
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const { chromium } = loadPlaywright(args.root);

  let expect = {};
  if (args.expect && fs.existsSync(args.expect)) {
    expect = JSON.parse(fs.readFileSync(args.expect, 'utf8'));
  }

  fs.mkdirSync(args.out, { recursive: true });

  const server = makeServer(args.root, args.port);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(args.port, resolve);
  });

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  const viewports = [
    { name: 'desktop-1440', width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    { name: 'tablet-768', width: 768, height: 1024, deviceScaleFactor: 1, isMobile: false, hasTouch: true },
    { name: 'mobile-430', width: 430, height: 932, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    { name: 'mobile-390', width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    { name: 'mobile-375', width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    { name: 'mobile-320', width: 320, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  ];

  const results = [];
  let anchorReport = null;
  let headReport = null;

  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('requestfailed', (req) => {
      const u = req.url();
      if (u.startsWith(`http://127.0.0.1:${args.port}`)) errors.push(`requestfailed: ${u}`);
    });

    await page.addInitScript(() => {
      window.__cls = 0;
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) window.__cls += entry.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
      } catch (err) {
        void err;
      }
    });
    await page.goto(`http://127.0.0.1:${args.port}/`, { waitUntil: 'load' });
    // 就绪标记：页面若设了 data-ready 就等它；否则按静态页继续
    const readyMarker = await page.evaluate(() => document.documentElement.hasAttribute('data-ready'));
    if (readyMarker) {
      await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 20000 });
    } else {
      await page.waitForTimeout(600);
    }

    await page.evaluate(async () => {
      const step = Math.max(320, window.innerHeight * 0.8);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 24));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(300);
    await page.evaluate(async () => {
      await Promise.all(Array.from(document.images).map(async (img) => {
        try {
          await Promise.race([img.decode(), new Promise((resolve) => setTimeout(resolve, 8000))]);
        } catch (err) {
          void err;
        }
      }));
    });
    await page.waitForTimeout(120);

    const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    const badImages = await page.locator('img').evaluateAll((images) =>
      images.filter((img) => !img.complete || img.naturalWidth <= 0).map((img) => img.getAttribute('src')));
    const missingAlt = await page.locator('img').evaluateAll((images) =>
      images.filter((img) => !img.hasAttribute('alt')).map((img) => img.getAttribute('src') || '(no src)'));
    const lcp = await page.evaluate(() => {
      const entries = performance.getEntriesByType('largest-contentful-paint');
      return entries.length ? Math.round(entries[entries.length - 1].startTime) : null;
    });
    const cls = await page.evaluate(() => Math.round((window.__cls || 0) * 1000) / 1000);
    const tap = await page.locator('button, a, [role="button"], summary').evaluateAll((items) => {
      const inSentence = (el) => {
        if (el.tagName !== 'A') return false;
        const host = el.closest('p, li, td, th, dd, blockquote, figcaption');
        if (!host) return false;
        const hostText = (host.textContent || '').trim();
        const ownText = (el.textContent || '').trim();
        return hostText.length > ownText.length + 2;
      };
      const tooSmall = [];
      let inlineExempt = 0;
      for (const item of items) {
        const style = getComputedStyle(item);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const rect = item.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        if (inSentence(item)) {
          inlineExempt += 1;
          continue;
        }
        const text = (item.textContent || '').trim();
        const icon = text.length === 0;
        if (rect.height < 44 || (icon && rect.width < 44)) {
          tooSmall.push(`${text.slice(0, 24) || '[icon]'} (${Math.round(rect.width)}x${Math.round(rect.height)})`);
        }
      }
      return { tooSmall, inlineExempt };
    });

    const contrast = await page.evaluate(() => {
      const parse = (c) => {
        const m = String(c).match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(',').map((v) => parseFloat(v.trim()));
        if (p.length < 3) return null;
        return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
      };
      const lum = ({ r, g, b }) => {
        const f = (v) => {
          const x = v / 255;
          return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const blend = (fg, bg) => ({
        r: fg.r * fg.a + bg.r * (1 - fg.a),
        g: fg.g * fg.a + bg.g * (1 - fg.a),
        b: fg.b * fg.a + bg.b * (1 - fg.a),
        a: 1,
      });
      const ratio = (a, b) => {
        const l1 = lum(a);
        const l2 = lum(b);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      };
      const bgOf = (el) => {
        let node = el;
        let acc = null;
        while (node) {
          const s = getComputedStyle(node);
          if (s.backgroundImage && s.backgroundImage !== 'none') return null;
          const c = parse(s.backgroundColor);
          if (c && c.a > 0.001) {
            acc = acc ? blend(acc, c) : c;
            if (acc.a >= 0.999) return acc;
          }
          node = node.parentElement;
        }
        const white = { r: 255, g: 255, b: 255, a: 1 };
        return acc ? blend(acc, white) : white;
      };
      const failures = [];
      let checked = 0;
      let skipped = 0;
      const nodes = document.querySelectorAll(
        'h1,h2,h3,h4,h5,h6,p,li,a,button,td,th,dd,figcaption,blockquote,small,span',
      );
      for (const el of nodes) {
        if (el.getAttribute('aria-hidden') === 'true') continue;
        const ownText = Array.from(el.childNodes)
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent.trim())
          .join('');
        if (!ownText) continue;
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 1) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        const bg = bgOf(el);
        if (!bg) {
          skipped += 1;
          continue;
        }
        const fg = parse(s.color);
        if (!fg) continue;
        const size = parseFloat(s.fontSize);
        const weight = Number(s.fontWeight) || 400;
        const large = size >= 24 || (size >= 18.66 && weight >= 700);
        const need = large ? 3 : 4.5;
        const value = ratio(blend(fg, bg), bg);
        checked += 1;
        if (value + 0.01 < need) {
          failures.push(`${ownText.slice(0, 24)} ${value.toFixed(2)}:1 < ${need}:1`);
        }
      }
      return { failures, checked, skipped };
    });

    if (anchorReport === null) {
      anchorReport = await page.evaluate(() => {
        const ids = new Set(Array.from(document.querySelectorAll('[id]')).map((el) => el.id));
        const broken = Array.from(document.querySelectorAll('a[href^="#"]'))
          .map((a) => a.getAttribute('href').slice(1))
          .filter((id) => id && !ids.has(id));
        return { broken };
      });
      headReport = await page.evaluate(() => ({
        lang: document.documentElement.lang || '',
        title: document.title || '',
        ogMissing: ['og:title', 'og:description', 'og:image']
          .filter((key) => !document.querySelector(`meta[property="${key}"]`)),
      }));
    }

    const probes = {};
    for (const selector of Object.keys(expect)) {
      probes[selector] = await page.locator(selector).count();
    }

    await page.screenshot({ path: path.join(args.out, `${viewport.name}.png`), fullPage: true });

    results.push({
      viewport: viewport.name,
      readyMarker,
      hScroll,
      errors,
      badImages,
      missingAlt,
      lcp,
      cls,
      tooSmall: tap.tooSmall,
      inlineExempt: tap.inlineExempt,
      contrast,
      probes,
    });
    await page.close();
  }

  await browser.close();
  server.close();

  const probeFailures = [];
  for (const [selector, rule] of Object.entries(expect)) {
    for (const r of results) {
      const count = r.probes[selector];
      const ok = typeof rule === 'number'
        ? count === rule
        : (rule.min == null || count >= rule.min) && (rule.max == null || count <= rule.max);
      if (!ok) probeFailures.push({ viewport: r.viewport, selector, expected: rule, got: count });
    }
  }

  const failures = [];
  for (const r of results) {
    if (r.hScroll) failures.push(`${r.viewport}: horizontal scroll overflow`);
    if (r.errors.length) failures.push(`${r.viewport}: console errors -> ${r.errors.join(' | ')}`);
    if (r.badImages.length) failures.push(`${r.viewport}: broken images -> ${r.badImages.join(', ')}`);
    if (r.missingAlt.length) failures.push(`${r.viewport}: images missing alt -> ${r.missingAlt.join(', ')}`);
    if (r.tooSmall.length) failures.push(`${r.viewport}: tap targets <44px -> ${r.tooSmall.join(', ')}`);
    if (r.contrast.failures.length) failures.push(`${r.viewport}: contrast <4.5:1 -> ${r.contrast.failures.slice(0, 8).join(' | ')}`);
  }
  if (anchorReport && anchorReport.broken.length) {
    failures.push(`broken anchors -> ${anchorReport.broken.join(', ')}`);
  }
  for (const f of probeFailures) {
    failures.push(`${f.viewport}: probe ${f.selector} expected ${JSON.stringify(f.expected)} got ${f.got}`);
  }

  console.log(JSON.stringify({ results, anchors: anchorReport, head: headReport }, null, 2));

  if (failures.length) {
    console.error(`\nWEB-QA FAILED:\n- ${failures.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`\nWEB-QA PASSED: ${results.length} viewports, screenshots -> ${args.out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
