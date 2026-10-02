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

// Hai file svg giả để nạp vào hai vùng thả
const nestedSvg = path.join(shotsDir, 'audi-q6-da-xep.svg')
const rawSvg = path.join(shotsDir, 'audi-q6-chua-xep.svg')
fs.writeFileSync(nestedSvg, '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>')
fs.writeFileSync(rawSvg, '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>')

const preview = spawn('npx', ['vite', 'preview', '--port', '5173', '--host'], {
  stdio: 'pipe',
})

preview.stdout.on('data', (d) => process.stdout.write(`[vite] ${d}`))
preview.stderr.on('data', (d) => process.stderr.write(`[vite] ${d}`))

await new Promise((r) => setTimeout(r, 1500))

try {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  })

  const page = await context.newPage()

  await page.route('**/api/**', async (route) => {
    const url = route.request().url()
    const json = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    if (url.includes('/api/auth/me')) {
      return json({ id: 1, username: 'admin', email: 'admin@pcut.vn', role: 'ADMIN' })
    }
    if (url.includes('/api/admin/files/stats')) {
      return json({ total: 1, modelsWithFiles: 1, fromDealers: 0, unlinked: 0 })
    }
    if (url.includes('/api/vehicle-nodes')) {
      return json({
        content: [
          {
            id: 1,
            level: 'BRAND',
            name: 'Audi',
            childCount: 1,
            children: [
              {
                id: 2,
                level: 'SERIES',
                name: 'Q6',
                childCount: 1,
                children: [
                  { id: 3, level: 'MODEL', name: 'Q6 e-tron', childCount: 0, children: [] },
                ],
              },
            ],
          },
        ],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 200,
        last: true,
      })
    }
    if (url.includes('/api/v1/file-categories')) {
      return json([
        { value: '1', label: 'Ngoại thất' },
        { value: '2', label: 'Nội thất' },
      ])
    }
    if (url.includes('/api/admin/files')) {
      return json({
        content: [
          {
            id: 101,
            fileKey: 'audi-q6-2024--a3f9c1b2',
            name: 'Audi Q6 2024 — ngoại thất',
            originalFilename: 'Audi Q6 2024.svg',
            category: 'Ngoại thất',
            year: 2024,
            vehicles: [{ nodeId: 3, path: 'Audi › Q6 › Q6 e-tron' }],
            source: 'SYSTEM',
            partCount: 170,
            updatedAt: '2026-10-01T10:00:00Z',
            thumbnailUrl: null,
            hasNested: true,
            hasRaw: true,
          },
        ],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
        last: true,
      })
    }
    return json([])
  })

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

  console.log('Waiting for file row with layout badges...')
  await page.waitForSelector('text=Audi Q6 2024 — ngoại thất', { timeout: 10000 })
  await page.waitForSelector('text=Đã xếp', { timeout: 5000 })

  console.log('Opening Upload part file modal...')
  await page.locator('button:has-text("Upload part file")').click()
  await page.waitForSelector('.ant-modal', { timeout: 5000 })
  await page.waitForSelector('text=File đã xếp', { timeout: 5000 })
  await page.waitForSelector('text=File chưa xếp', { timeout: 5000 })

  const svgInputs = page.locator('.ant-modal input[type="file"][accept=".svg"]')
  await svgInputs.nth(0).setInputFiles(nestedSvg)
  await svgInputs.nth(1).setInputFiles(rawSvg)
  await page.waitForSelector('text=audi-q6-da-xep.svg', { timeout: 5000 })
  await page.waitForSelector('text=audi-q6-chua-xep.svg', { timeout: 5000 })

  // Điền đủ form: danh mục + mẫu xe (3 cấp)
  await page.locator('.ant-modal select').first().selectOption('1')

  const selects = page.locator('.ant-modal .ant-select')
  await selects.nth(0).click()
  await page.locator('.ant-select-item-option:has-text("Audi")').first().click()
  await selects.nth(1).click()
  await page.locator('.ant-select-item-option:has-text("Q6")').first().click()
  await selects.nth(2).click()
  await page.locator('.ant-select-item-option:has-text("Q6 e-tron")').first().click()

  await page.waitForSelector('text=Đủ thông tin', { timeout: 5000 })
  await page.waitForTimeout(400)

  const shotPath = path.join(shotsDir, 'ngo-379-upload-two-files.png')
  await page.screenshot({ path: shotPath, fullPage: false })
  console.log('Screenshot saved to:', shotPath)

  console.log('✓ Happy case: dialog có đủ hai file (đã xếp + chưa xếp), nút Lưu sẵn sàng.')

  await browser.close()
} finally {
  preview.kill()
  process.exit(0)
}
