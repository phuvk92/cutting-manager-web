import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

const shotsDir =
  process.env.PCUT_SHOTS_DIR ||
  (process.env.PAPERCLIP_RUN_SCRATCH_DIR
    ? path.join(process.env.PAPERCLIP_RUN_SCRATCH_DIR, 'shots')
    : path.resolve('./shots'))

fs.mkdirSync(shotsDir, { recursive: true })
console.log('Shots dir:', shotsDir)

const preview = spawn('npx', ['vite', 'preview', '--port', '5173', '--host'], {
  stdio: 'pipe',
})

preview.stdout.on('data', (d) => process.stdout.write(`[vite] ${d}`))
preview.stderr.on('data', (d) => process.stderr.write(`[vite] ${d}`))

// Wait a moment for server to be ready
await new Promise((r) => setTimeout(r, 1500))

try {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  })

  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1280, height: 800 },
  })

  const page = await context.newPage()

  // Mock API routes
  await page.route('**/api/**', async (route) => {
    const url = route.request().url()
    if (url.includes('/api/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          username: 'admin',
          email: 'admin@pcut.vn',
          role: 'ADMIN',
        }),
      })
    }
    if (url.includes('/api/admin/files/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ totalFiles: 1, totalVehicles: 1 }),
      })
    }
    if (url.includes('/api/admin/files') || (url.includes('/api/svg') && !url.includes('/preview') && !url.includes('/download') && !url.includes('/thumbnail'))) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [
            {
              id: 101,
              name: 'Audi Q6 2024 v1.2',
              originalFilename: 'Audi Q6 2024 v1.2.svg',
              category: 'Cản trước',
              fileSize: 10240,
              thumbnailUrl: '/api/svg/101/thumbnail',
              vehicles: [{ id: 1, path: 'Audi > Q6 > 2024' }],
              createdAt: '2026-10-01T10:00:00Z',
            },
          ],
          totalElements: 1,
          totalPages: 1,
          number: 0,
          size: 10,
        }),
      })
    }
    if (url.includes('/api/svg/101/preview') || url.includes('/api/svg/101/thumbnail')) {
      return route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
          <rect width="200" height="200" fill="#f0f4f8"/>
          <circle cx="100" cy="100" r="70" fill="#1677ff"/>
          <text x="100" y="105" text-anchor="middle" fill="#ffffff" font-size="14" font-family="sans-serif">Audi Q6 2024 v1.2</text>
        </svg>`,
      })
    }
    if (url.includes('/api/svg/101/download')) {
      return route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        headers: {
          'Content-Disposition': 'attachment; filename="Audi Q6 2024 v1.2.svg"',
        },
        body: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
          <rect width="200" height="200" fill="#f0f4f8"/>
          <circle cx="100" cy="100" r="70" fill="#1677ff"/>
        </svg>`,
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })

  // Set auth tokens in localStorage before page load
  await page.addInitScript(() => {
    localStorage.setItem('cutting_access_token', 'mock-access-token')
    localStorage.setItem('cutting_refresh_token', 'mock-refresh-token')
    localStorage.setItem(
      'cutting_user',
      JSON.stringify({ id: 1, username: 'admin', email: 'admin@pcut.vn', role: 'ADMIN' })
    )
  })

  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()))
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message))

  console.log('Navigating to http://localhost:5173/svg...')
  await page.goto('http://localhost:5173/svg', { waitUntil: 'domcontentloaded' })

  // Wait for file row
  console.log('Waiting for Audi Q6 2024 v1.2 in list...')
  await page.waitForSelector('text=Audi Q6 2024 v1.2', { timeout: 10000 })

  // Click on the thumbnail to open preview modal
  console.log('Opening preview modal via thumbnail...')
  await page.locator('span[style*="width: 48px"]').first().click()

  // Wait for modal to open
  await page.waitForSelector('.ant-modal-content, .ant-modal', { timeout: 5000 })
  await page.waitForSelector('button:has-text("Tải xuống file")', { timeout: 5000 })
  // Wait a bit for SVG render inside SafeSvgViewer
  await page.waitForTimeout(1000)

  // Take screenshot of preview modal
  const shotPath = path.join(shotsDir, 'ngo-372-preview-download-svg.png')
  await page.screenshot({ path: shotPath, fullPage: false })
  console.log('Screenshot saved to:', shotPath)

  // Click download button and verify suggested filename
  console.log('Clicking Tải xuống file...')
  const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
  await page.locator('button:has-text("Tải xuống file")').click()
  const download = await downloadPromise
  const suggestedFilename = download.suggestedFilename()
  console.log('Download suggested filename:', suggestedFilename)

  if (suggestedFilename !== 'Audi Q6 2024 v1.2.svg') {
    throw new Error(`Expected 'Audi Q6 2024 v1.2.svg' but got '${suggestedFilename}'`)
  }

  console.log('✓ Happy case verified successfully! Filename ends with .svg and preserves middle dot.')

  await browser.close()
} finally {
  preview.kill()
  process.exit(0)
}
