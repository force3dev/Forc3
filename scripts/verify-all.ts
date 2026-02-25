import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.VERIFY_URL || 'http://localhost:3000'
const results: { name: string; status: 'pass' | 'fail' | 'warn'; message: string }[] = []

function pass(name: string, message = 'OK') {
  results.push({ name, status: 'pass', message })
  console.log(`  PASS ${name}: ${message}`)
}

function fail(name: string, message: string) {
  results.push({ name, status: 'fail', message })
  console.log(`  FAIL ${name}: ${message}`)
}

function warn(name: string, message: string) {
  results.push({ name, status: 'warn', message })
  console.log(`  WARN ${name}: ${message}`)
}

// ── FILE CHECKS ──────────────────────────────────────────────────────────────
function checkFiles() {
  console.log('\n--- Checking required files...')
  const required = [
    'src/lib/prisma.ts',
    'src/lib/auth.ts',
    'src/app/api/auth/login/route.ts',
    'src/app/api/auth/signup/route.ts',
    'src/app/api/nutrition/search/route.ts',
    'src/app/api/calendar/route.ts',
    'src/app/api/health/route.ts',
    'src/app/dashboard/page.tsx',
    'src/app/calendar/page.tsx',
    'src/app/nutrition/page.tsx',
    'src/app/workout/page.tsx',
    'src/app/coach/page.tsx',
    'src/app/profile/page.tsx',
    'src/app/settings/page.tsx',
    'public/manifest.json',
    'public/icon-192.png',
    'public/icon-512.png',
  ]
  for (const file of required) {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      pass(`File: ${file}`)
    } else {
      fail(`File: ${file}`, 'MISSING')
    }
  }
}

// ── ENV CHECKS ───────────────────────────────────────────────────────────────
function checkEnvVars() {
  console.log('\n--- Checking environment variables...')
  const required = ['DATABASE_URL', 'DIRECT_URL', 'JWT_SECRET']
  const optional = ['CLAUDE_API_KEY', 'STRIPE_SECRET_KEY', 'RESEND_API_KEY', 'USDA_API_KEY', 'NUTRITIONIX_APP_ID']

  for (const key of required) {
    if (process.env[key]) pass(`ENV: ${key}`)
    else fail(`ENV: ${key}`, 'MISSING')
  }
  for (const key of optional) {
    if (process.env[key]) pass(`ENV: ${key} (optional)`)
    else warn(`ENV: ${key}`, 'Not set — some features disabled')
  }
}

// ── TYPESCRIPT CHECK ─────────────────────────────────────────────────────────
function checkTypeScript() {
  console.log('\n--- Checking TypeScript...')
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' })
    pass('TypeScript', 'Zero type errors')
  } catch (e: unknown) {
    const err = e as { stdout?: Buffer; stderr?: Buffer }
    const output = err.stdout?.toString() || err.stderr?.toString() || ''
    const errorCount = (output.match(/error TS/g) || []).length
    fail('TypeScript', `${errorCount} type errors found`)
    console.log(output.slice(0, 2000))
  }
}

// ── PRISMA SCHEMA CHECK ─────────────────────────────────────────────────────
function checkPrismaSchema() {
  console.log('\n--- Checking Prisma schema...')
  try {
    const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma')
    if (!fs.existsSync(schemaPath)) { fail('Prisma schema', 'prisma/schema.prisma not found'); return }
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    const requiredModels = ['User', 'WorkoutPlan', 'CardioActivity', 'WorkoutLog', 'Exercise']
    for (const model of requiredModels) {
      if (schema.includes(`model ${model}`)) pass(`Schema: model ${model}`)
      else fail(`Schema: model ${model}`, 'Missing from schema')
    }
    if (schema.includes('directUrl')) pass('Schema: directUrl configured')
    else fail('Schema: directUrl', 'Missing')
    execSync('npx prisma validate', { stdio: 'pipe' })
    pass('Prisma schema validation')
  } catch (e: unknown) {
    const err = e as { message?: string }
    fail('Prisma schema', err.message?.slice(0, 200) || 'Unknown error')
  }
}

// ── HTML ENTITY CHECK ────────────────────────────────────────────────────────
function checkSpelling() {
  console.log('\n--- Checking for HTML entity issues...')
  const badPatterns = [
    { pattern: /&apos;/g, description: 'Raw &apos; entities' },
    { pattern: /&amp;(?![\w#])/g, description: 'Raw &amp; entities' },
    { pattern: /&quot;/g, description: 'Raw &quot; entities' },
  ]
  const dirs = ['src/app', 'src/components']
  const issues: string[] = []

  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) scanDir(fullPath)
      else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf-8')
        for (const { pattern, description } of badPatterns) {
          const matches = content.match(pattern)
          if (matches && matches.length > 0) {
            issues.push(`${fullPath}: ${matches.length}x ${description}`)
          }
        }
      }
    }
  }
  for (const dir of dirs) scanDir(dir)
  if (issues.length === 0) pass('HTML entities', 'No issues found')
  else for (const issue of issues) fail('HTML entity', issue)
}

// ── PACKAGE CHECK ────────────────────────────────────────────────────────────
function checkPackageScripts() {
  console.log('\n--- Checking package.json...')
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
  const requiredDeps = ['@anthropic-ai/sdk', 'bcryptjs', 'framer-motion', '@prisma/client', 'next']
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
  for (const dep of requiredDeps) {
    if (allDeps[dep]) pass(`Package: ${dep}`, allDeps[dep])
    else fail(`Package: ${dep}`, 'Not installed')
  }
}

// ── API ROUTE CHECKS (live) ──────────────────────────────────────────────────
async function checkApiRoutes() {
  console.log('\n--- Checking API routes...')
  const routes = [
    { method: 'GET', path: '/api/health', expectedStatus: [200, 207] },
    { method: 'GET', path: '/api/nutrition/search?q=chicken', expectedStatus: [200] },
    { method: 'GET', path: '/api/calendar', expectedStatus: [200, 401] },
  ]
  for (const route of routes) {
    try {
      const res = await fetch(`${BASE_URL}${route.path}`, {
        method: route.method,
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      })
      if (route.expectedStatus.includes(res.status)) pass(`${route.method} ${route.path}`, `Status ${res.status}`)
      else fail(`${route.method} ${route.path}`, `Got ${res.status}, expected ${route.expectedStatus.join(' or ')}`)
    } catch (e: unknown) {
      const err = e as { message?: string }
      fail(`${route.method} ${route.path}`, `Request failed: ${err.message}`)
    }
  }
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('FORC3 COMPLETE VERIFICATION')
  console.log('================================')
  console.log(`Time: ${new Date().toLocaleString()}`)
  console.log(`Target: ${BASE_URL}\n`)

  checkFiles()
  checkEnvVars()
  checkPrismaSchema()
  checkSpelling()
  checkPackageScripts()
  checkTypeScript()

  try {
    await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(3000) })
    console.log('\n--- Server is running — checking live endpoints...')
    await checkApiRoutes()
  } catch {
    warn('Live endpoint checks', 'Server not running — start with npm run dev')
  }

  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const warned = results.filter(r => r.status === 'warn').length

  console.log('\n================================')
  console.log('VERIFICATION SUMMARY')
  console.log('================================')
  console.log(`  Passed: ${passed}`)
  console.log(`  Failed: ${failed}`)
  console.log(`  Warnings: ${warned}`)

  if (failed > 0) {
    console.log('\nFAILED CHECKS:')
    results.filter(r => r.status === 'fail').forEach(r => console.log(`  - ${r.name}: ${r.message}`))
  }

  console.log(`\n${failed === 0 ? 'ALL CRITICAL CHECKS PASSED' : 'CRITICAL ISSUES FOUND'}`)

  fs.writeFileSync(
    'verification-results.json',
    JSON.stringify({ timestamp: new Date().toISOString(), passed, failed, warned, results }, null, 2)
  )
  console.log('\nResults saved to verification-results.json')
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(console.error)
