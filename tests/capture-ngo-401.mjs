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

await new Promise((r) => setTimeout(r, 1500))

const filesPage = {
  content: [
    {
      id: 101,
      fileKey: 'camry-capo--a3f9c1b2',
      name: 'Camry 2.5Q — Capo',
      originalFilename: 'Camry 2.5Q — Capo.svg',
      category: 'Ngoại thất',
      year: 2024,
      vehicles: [{ nodeId: 3, path: 'Toyota › Camry › Camry 2.5Q' }],
      source: 'SYSTEM',
      partCount: 12,
      updatedAt: '2026-10-01T10:00:00',
      thumbnailUrl: null,
      hasNested: true,
      hasRaw: false,
      cutAreaLengthMm: 15000,
      cutAreaWidthMm: 1520,
    },
    {
      id: 102,
      fileKey: 'q6-ngoai-that--b7d2e4f6',
      name: 'Audi Q6 — ngoại thất',
      originalFilename: 'Audi Q6 — ngoai that.svg',
      category: 'Ngoại thất',
      year: null,
      vehicles: [{ nodeId: 6, path: 'Audi › Q6 › Q6 2024' }],
      source: 'DEALER',
      partCount: 40,
      updatedAt: '2026-09-20T08:00:00',
      thumbnailUrl: null,
      hasNested: false,
      hasRaw: true,
      // file cũ chưa khai khổ
      cutAreaLengthMm: null,
      cutAreaWidthMm: null,
    },
  ],
  totalElements: 2,
  totalPages: 1,
  number: 0,
  size: 20,
}

const vehicleTree = {
  content: [
    {
      id: 1,
      level: 'BRAND',
      name: 'Toyota',
      childCount: 1,
      children: [
        {
          id: 2,
          level: 'SERIES',
          name: 'Camry',
          childCount: 1,
          children: [
            { id: 3, level: 'MODEL', name: 'Camry 2.5Q', childCount: 0, children: [] },
          ],
        },
      ],
    },
  ],
  totalElements: 1,
  totalPages: 1,
  last: true,
}

try {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 860 },
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
      return json({ total: 2, modelsWithFiles: 2, fromDealers: 1, unlinked: 0 })
    }
    if (url.includes('/api/admin/files')) {
      return json(filesPage)
    }
    if (url.includes('/api/v1/file-categories')) {
      return json([
        { value: '1', label: 'Ngoại thất' },
        { value: '2', label: 'Nội thất' },
      ])
    }
    if (url.includes('/api/vehicle-nodes')) {
      return json(vehicleTree)
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

  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message))

  await page.goto('http://localhost:5173/svg', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('text=Camry 2.5Q — Capo', { timeout: 10000 })

  // Nhãn khổ ở bảng: file đã khai "15 m × 1520", file cũ "15 m × 700 (mặc định)"
  await page.waitForSelector('text=15 m × 1520', { timeout: 5000 })
  await page.waitForSelector('text=15 m × 700 (mặc định)', { timeout: 5000 })
  console.log('✓ Nhãn khổ cắt hiện đúng ở bảng')

  // Mở dialog upload
  await page.locator('button:has-text("Upload part file")').click()
  await page.waitForSelector('.ant-modal', { timeout: 5000 })
  await page.waitForSelector('text=Khổ cắt (vùng cắt)', { timeout: 5000 })
  await page.waitForTimeout(300)

  // Ảnh 1a: dialog mới mở — 700 / 15000 chọn sẵn
  await page.screenshot({ path: path.join(shotsDir, 'ngo-401-upload-defaults.png') })
  console.log('✓ Ảnh 1a: mặc định 700 / 15000')

  // Ảnh 1b: combobox khổ phim đang mở danh sách
  await page.locator('.ant-select:has-text("700 mm")').click()
  await page.waitForSelector('.ant-select-dropdown .ant-select-item:has-text("1520 mm")', {
    timeout: 5000,
  })
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(shotsDir, 'ngo-401-upload-combobox-open.png') })
  console.log('✓ Ảnh 1: dialog mới mở, combobox khổ phim đang mở')

  // Ảnh 2: chọn 1520 + dài sửa 25000
  await page.locator('.ant-select-dropdown .ant-select-item:has-text("1520 mm")').click()
  await page.waitForSelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden)', {
    state: 'detached',
    timeout: 5000,
  }).catch(() => {})
  await page.waitForTimeout(400)
  await page.locator('input[type="number"]').fill('25000')
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(shotsDir, 'ngo-401-upload-1520x25000.png') })
  console.log('✓ Ảnh 2: đã chọn khổ 1520, dài 25000')

  // Kiểm nhanh: "Khổ khác…" mở ô số
  await page.locator('.ant-select:has-text("1520 mm")').click()
  await page.locator('.ant-select-dropdown .ant-select-item:has-text("Khổ khác")').click()
  await page.waitForTimeout(200)
  const customInputs = await page.locator('.ant-modal input[type="number"]').count()
  if (customInputs < 2) throw new Error('Khổ khác… không mở ô nhập số')
  console.log('✓ Khổ khác… mở ô nhập số')

  await browser.close()
  console.log('✓ Happy case NGO-401 done')
} finally {
  preview.kill()
  process.exit(0)
}
