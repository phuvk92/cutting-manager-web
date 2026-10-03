import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

const shotsDir = process.env.PCUT_SHOTS_DIR ||
  (process.env.PAPERCLIP_RUN_SCRATCH_DIR ? path.join(process.env.PAPERCLIP_RUN_SCRATCH_DIR, 'shots') : path.resolve('./shots'))
fs.mkdirSync(shotsDir, { recursive: true })

const preview = spawn('npx', ['vite', 'preview', '--port', '5173', '--host'], { stdio: 'pipe' })
preview.stdout.on('data', d => process.stdout.write(`[vite] ${d}`))
preview.stderr.on('data', d => process.stderr.write(`[vite] ${d}`))
await new Promise(r => setTimeout(r, 1500))

let revoked = false
const now = Date.now()
const iso = ms => new Date(now - ms).toISOString()
const devices = () => [
  {
    deviceRegId: 101,
    userId: 10,
    username: 'tho_hoang',
    fullName: 'Trần Minh Hoàng',
    dealerId: 1,
    dealerName: 'PPF Hà Nội Center',
    deviceName: 'PC xưởng',
    platform: 'Windows 11',
    lastIp: '113.161.44.2',
    firstSeenAt: iso(45 * 86400000),
    lastSeenAt: revoked ? iso(20 * 60000) : iso(5 * 60000),
    status: revoked ? 'REVOKED' : 'ACTIVE',
    revokedAt: revoked ? iso(60000) : null,
    revokedBy: revoked ? 'admin' : null,
  },
  {
    deviceRegId: 102,
    userId: 11,
    username: 'tho_dung',
    fullName: 'Phạm Anh Dũng',
    dealerId: 2,
    dealerName: 'Decal Ô Tô Sài Gòn',
    deviceName: 'Laptop cá nhân',
    platform: 'Windows 10',
    lastIp: '14.191.88.7',
    firstSeenAt: iso(10 * 86400000),
    lastSeenAt: iso(3 * 3600000),
    status: 'ACTIVE',
    revokedAt: null,
    revokedBy: null,
  },
]

const json = body => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })

try {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  })
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()

  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname === '/api/auth/me') {
      return route.fulfill(json({ id: 1, username: 'admin', email: 'admin@pcut.vn', role: 'ADMIN' }))
    }
    if (url.pathname === '/api/devices/stats') {
      return route.fulfill(json({ activeNow: revoked ? 1 : 2, registered: revoked ? 1 : 2, usersAtLimit: 2, staleDevices: 0 }))
    }
    if (url.pathname === '/api/devices') {
      const content = devices().filter(d => url.searchParams.get('status') !== 'ACTIVE' || d.status === 'ACTIVE')
      return route.fulfill(json({ content, page: 0, size: 20, totalElements: content.length, totalPages: 1, first: true, last: true }))
    }
    if (url.pathname === '/api/dealers/all') {
      return route.fulfill(json([
        { id: 1, code: 'DL-HN-01', name: 'PPF Hà Nội Center', plan: 'PRO', status: 'ACTIVE', usersCount: 8 },
        { id: 2, code: 'DL-SG-02', name: 'Decal Ô Tô Sài Gòn', plan: 'PRO', status: 'ACTIVE', usersCount: 5 },
      ]))
    }
    if (url.pathname === '/api/users/10/devices/101' && route.request().method() === 'DELETE') {
      revoked = true
      return route.fulfill(json({ id: 101, status: 'REVOKED' }))
    }
    if (url.pathname === '/api/users/10') {
      return route.fulfill(json({
        id: 10,
        username: 'tho_hoang',
        email: 'hoang@pcut.vn',
        fullName: 'Trần Minh Hoàng',
        role: 'USER',
        dealerId: 1,
        dealerName: 'PPF Hà Nội Center',
        enabled: true,
        effectiveMaxDevices: 1,
        createdAt: iso(60 * 86400000),
        updatedAt: iso(86400000),
      }))
    }
    return route.fulfill(json([]))
  })

  await page.addInitScript(() => {
    localStorage.setItem('cutting_access_token', 'mock-access-token')
    localStorage.setItem('cutting_refresh_token', 'mock-refresh-token')
    localStorage.setItem('cutting_user', JSON.stringify({ id: 1, username: 'admin', email: 'admin@pcut.vn', role: 'ADMIN' }))
  })

  await page.goto('http://localhost:5173/sessions', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('text=Trần Minh Hoàng', { timeout: 10000 })
  await page.waitForSelector('text=PC xưởng', { timeout: 10000 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(shotsDir, 'ngo-423-sessions-data.png'), fullPage: true })

  await page.getByRole('button', { name: 'Gỡ máy' }).first().click()
  await page.locator('.ant-popconfirm').waitFor({ state: 'visible', timeout: 5000 })
  await page.waitForSelector('text=Phần mềm cắt trên máy này sẽ bị đăng xuất', { timeout: 5000 })
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(shotsDir, 'ngo-423-revoke-confirm.png'), fullPage: false })

  await page.locator('.ant-popconfirm button:has-text("Gỡ máy")').click()
  await page.waitForSelector('text=Đã gỡ bởi admin', { timeout: 10000 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(shotsDir, 'ngo-423-after-revoke.png'), fullPage: true })

  await browser.close()
} finally {
  preview.kill()
}
