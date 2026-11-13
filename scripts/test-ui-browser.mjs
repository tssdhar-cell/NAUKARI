// Production-browser regressions with synthetic data; never contacts a real database.
// npm install --prefix node_modules/.audit-tools --no-save --package-lock=false playwright @electric-sql/pglite
// npm run build && node scripts/test-ui-browser.mjs
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { SignJWT } from 'jose';
import { chromium } from '../node_modules/.audit-tools/node_modules/playwright/index.mjs';

const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const date = '2026-11-01T00:00:00Z';
const boards = Array.from({ length: 14 }, (_, i) => ({ id: uuid(i + 1), name: `Board ${i + 1}`, home_url: null, sort_order: i, created_at: date }));
const searches = Array.from({ length: 21 }, (_, i) => ({ id: uuid(i + 100), board_id: boards[0].id, name: `Search ${i + 1}`, url: `https://example.test/jobs/${i + 1}`, last_opened_at: null, sort_order: i, created_at: date, updated_at: date }));
let resumes = [1, 2].map((n) => ({ id: uuid(n + 200), name: `Resume ${n}`, storage_path: `fixture-${n}.pdf`, size_bytes: 100, is_primary: n === 1, created_at: date }));
const templates = [{ id: uuid(301), name: 'Recruiter introduction', body: Array.from({ length: 15 }, (_, i) => `Message line ${i + 1}`).join('\n'), created_at: date, updated_at: date }];
let collectionReads = 0;
let openedWrites = 0;
let failTracking = false;
const mock = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const table = url.pathname.split('/').at(-1);
  const records = { boards, searches, resumes, templates }[table];
  if (records) {
    const id = url.searchParams.get('id')?.replace(/^eq\./, '');
    let result = id ? records.filter((row) => row.id === id) : records;
    if (req.method === 'PATCH') {
      if (failTracking) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ message: 'Synthetic tracking failure' })); return; }
      let body = ''; for await (const chunk of req) body += chunk;
      for (const row of result) Object.assign(row, JSON.parse(body));
      openedWrites++;
    } else if (req.method === 'DELETE') {
      if (table === 'resumes') resumes = resumes.filter((row) => row.id !== id);
    } else if (!id) collectionReads++;
    if (req.headers.accept?.includes('application/vnd.pgrst.object+json')) result = result[0] ?? null;
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(result)); return;
  }
  if (url.pathname.startsWith('/storage/v1/')) {
    res.writeHead(200, { 'Content-Type': req.method === 'GET' ? 'application/pdf' : 'application/json' });
    res.end(req.method === 'GET' ? '%PDF-1.4\n%%EOF' : '[]'); return;
  }
  res.writeHead(404); res.end();
});
mock.listen(0, '127.0.0.1'); await once(mock, 'listening');
const mockUrl = `http://127.0.0.1:${mock.address().port}`;
const portProbe = createServer(); portProbe.listen(0, '127.0.0.1'); await once(portProbe, 'listening');
const appPort = portProbe.address().port; await new Promise((resolve) => portProbe.close(resolve));
const base = `http://127.0.0.1:${appPort}`;
const secret = 'browser-test-only-secret-with-at-least-32-characters';
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(appPort)], {
  env: { ...process.env, SUPABASE_URL: mockUrl, SUPABASE_SECRET_KEY: 'synthetic-test-key', ADMIN_USERNAME: 'browser-test', ADMIN_PASSWORD: 'browser-test-password', SESSION_SECRET: secret, APP_TIMEZONE: 'Asia/Kolkata' },
  stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
});
let serverOutput = ''; child.stdout.on('data', (chunk) => { serverOutput += chunk; }); child.stderr.on('data', (chunk) => { serverOutput += chunk; });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) throw new Error(serverOutput);
    try { ready = (await fetch(`${base}/login`)).ok; } catch {}
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert(ready, 'Test app did not start');
  const unauthorized = await fetch(`${base}/api/resumes/${resumes[0].id}`, { redirect: 'manual' });
  assert.equal(unauthorized.status, 307, 'Unauthenticated PDF requests must redirect to login');
  assert.equal(new URL(unauthorized.headers.get('location'), base).pathname, '/login');
  browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL || 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  // Keep all browser traffic local, including logos and links opened in new tabs.
  await context.route('**/*', (route) => route.request().url().startsWith(base) ? route.continue() : route.abort());
  const token = await new SignJWT({ sub: 'browser-test' }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h').sign(new TextEncoder().encode(secret));
  await context.addCookies([{ name: 'naukari_session', value: token, url: base, httpOnly: true, sameSite: 'Lax' }]);
  const page = await context.newPage();
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base);
  await page.getByLabel('Find a board or saved search').waitFor();
  assert.equal(await page.getByRole('heading', { level: 2 }).count(), 12);
  await page.getByRole('button', { name: /Show more boards/ }).click();
  assert.equal(await page.getByRole('heading', { level: 2 }).count(), 14);
  await page.getByLabel('Find a board or saved search').fill('Search 21');
  await page.getByRole('link', { name: /^Search 21/ }).waitFor();
  assert.equal(await page.getByRole('link', { name: /^Search 1\b/ }).count(), 0);
  await page.getByLabel('Find a board or saved search').fill('');
  const readsBefore = collectionReads;
  await page.getByRole('link', { name: /^Search 1\b/ }).click();
  await page.waitForFunction(() => [...document.querySelectorAll('a')].some((a) => a.textContent.includes('Search 1') && a.textContent.includes('opened just now')));
  await page.waitForTimeout(500);
  assert.equal(openedWrites, 1); assert.equal(collectionReads, readsBefore, 'Tracking must not refetch lists');
  failTracking = true;
  await page.getByRole('link', { name: /^Search 2\b/ }).click();
  await page.getByText('Search opened, but its opened status could not be saved.').waitFor();
  assert.match(await page.getByRole('link', { name: /^Search 2\b/ }).innerText(), /not opened yet/);
  console.log('PASS: bounded boards, filtering, optimistic tracking, rollback, no collection refetch');

  await page.setViewportSize({ width: 390, height: 500 });
  await page.getByRole('button', { name: 'Tab', exact: true }).first().click();
  const dialog = page.getByRole('dialog'); await dialog.waitFor();
  await page.getByLabel('Link', { exact: true }).fill('https://www.linkedin.com/jobs/search/?keywords=Engineer');
  const bounds = await dialog.boundingBox(); assert(bounds.y >= 0 && bounds.y + bounds.height <= 501, 'Mobile dialog exceeds viewport');
  assert.equal(await dialog.evaluate((node) => getComputedStyle(node).overflowY), 'auto');
  await page.getByRole('button', { name: 'Add tab', exact: true }).scrollIntoViewIfNeeded();
  assert(await page.getByRole('button', { name: 'Add tab', exact: true }).isVisible());
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  console.log('PASS: lazy editor mounts and mobile form scrolls within viewport');

  await page.goto(`${base}/templates`);
  await page.getByLabel('Find a message template').fill('missing');
  assert.equal(await page.getByRole('heading', { name: 'Recruiter introduction' }).count(), 0);
  await page.getByLabel('Find a message template').fill('recruiter');
  await page.getByRole('button', { name: 'Read full message' }).click();
  await page.getByRole('button', { name: 'Show less' }).waitFor();
  console.log('PASS: templates filter and expand without opening an editor');

  let pdfRequests = 0;
  page.on('request', (req) => { if (new URL(req.url()).pathname.startsWith('/api/resumes/')) pdfRequests++; });
  await page.goto(`${base}/resume`);
  await page.getByRole('button', { name: 'Select Resume 1 for preview' }).waitFor();
  assert.equal(await page.locator('iframe').count(), 0); assert.equal(pdfRequests, 0);
  await page.getByRole('button', { name: 'Select Resume 1 for preview' }).click();
  assert.equal(await page.locator('iframe').count(), 0); assert.equal(pdfRequests, 0);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator('iframe').waitFor();
  assert.match(await page.locator('iframe').getAttribute('title'), /Resume 1/);
  await page.getByRole('button', { name: 'Delete version' }).first().click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('iframe')?.title === 'Preview of Resume 2');
  await page.setViewportSize({ width: 390, height: 500 });
  await page.waitForFunction(() => document.querySelectorAll('iframe').length === 0);
  assert.deepEqual(errors, [], 'Browser encountered runtime errors');
  console.log('PASS: mobile does not load PDF, explicit desktop preview, deletion fallback, resize unmount');
  const mobile = await browser.newContext({ viewport: { width: 390, height: 600 }, isMobile: true, hasTouch: true });
  await mobile.route('**/*', (route) => route.request().url().startsWith(base) ? route.continue() : route.abort());
  await mobile.addCookies([{ name: 'naukari_session', value: token, url: base, httpOnly: true, sameSite: 'Lax' }]);
  const touchPage = await mobile.newPage();
  await touchPage.goto(`${base}/resume`);
  const rename = touchPage.getByRole('button', { name: 'Rename', exact: true });
  await rename.waitFor();
  const touchBounds = await rename.boundingBox();
  assert(touchBounds.height >= 44 && touchBounds.width >= 44, 'Touch action must be at least 44px');
  assert.equal(await touchPage.locator('iframe').count(), 0);
  await mobile.close();
  console.log('PASS: authenticated PDF access and 44px touch actions');
} catch (error) {
  console.error(serverOutput); throw error;
} finally {
  await browser?.close(); child.kill(); mock.closeAllConnections(); await new Promise((resolve) => mock.close(resolve));
}
