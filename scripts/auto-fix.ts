import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

console.log('FORC3 AUTO-FIX SCRIPT')
console.log('========================\n')

let fixCount = 0

function fix(name: string, action: () => void) {
  try {
    action()
    console.log(`  Fixed: ${name}`)
    fixCount++
  } catch (e: unknown) {
    const err = e as { message?: string }
    console.log(`  Could not fix: ${name} — ${err.message}`)
  }
}

// Fix 1: HTML entities in source files
fix('HTML entities in JSX', () => {
  function fixDir(dir: string) {
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory() && !entry.name.includes('node_modules')) fixDir(fullPath)
      else if (entry.name.match(/\.(tsx|ts)$/)) {
        let content = fs.readFileSync(fullPath, 'utf-8')
        const original = content
        content = content.replace(/&apos;/g, "'")
        content = content.replace(/&amp;(?![\w#])/g, '&')
        content = content.replace(/&quot;/g, '"')
        if (content !== original) fs.writeFileSync(fullPath, content)
      }
    }
  }
  fixDir('./src')
})

// Fix 2: Create missing public files
fix('Create icon-192.png placeholder', () => {
  const iconPath = 'public/icon-192.png'
  if (fs.existsSync(iconPath)) return
  const buf = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
    '2e000000' + '0c4944415478016360f8cfc00000000200019e221bc90000000049454e44ae426082',
    'hex'
  )
  fs.writeFileSync(iconPath, buf)
})

fix('Create icon-512.png placeholder', () => {
  const iconPath = 'public/icon-512.png'
  if (fs.existsSync(iconPath)) return
  if (fs.existsSync('public/icon-192.png')) {
    fs.copyFileSync('public/icon-192.png', iconPath)
  }
})

// Fix 3: Create manifest.json if missing
fix('Create public/manifest.json', () => {
  const manifestPath = 'public/manifest.json'
  if (fs.existsSync(manifestPath)) return
  const manifest = {
    name: 'FORC3 — AI Athlete Coach',
    short_name: 'FORC3',
    description: 'PhD-Level coaching at app prices',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ]
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
})

// Fix 4: Regenerate Prisma client
fix('Regenerate Prisma client', () => {
  execSync('npx prisma generate', { stdio: 'pipe' })
})

console.log(`\nAuto-fix complete. Fixed ${fixCount} issues.`)
console.log('Run npm run verify to check remaining issues.\n')
