const { execSync } = require('child_process')
const { readdirSync, statSync } = require('fs')
const path = require('path')

function run(cmd) {
  try { execSync(cmd, { stdio: 'pipe' }) } catch {}
}

function findByExt(dir, ext) {
  const results = []
  try {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry)
      try {
        const s = statSync(full)
        if (s.isDirectory()) {
          if (full.endsWith(ext)) results.push(full)
          else results.push(...findByExt(full, ext))
        }
      } catch {}
    }
  } catch {}
  return results
}

function findFiles(dir, ext) {
  const results = []
  try {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry)
      try {
        const s = statSync(full)
        if (s.isDirectory()) results.push(...findFiles(full, ext))
        else if (full.endsWith(ext)) results.push(full)
      } catch {}
    }
  } catch {}
  return results
}

exports.default = async function afterPack(context) {
  const appOutDir = context.appOutDir
  const appBundle = readdirSync(appOutDir).find(f => f.endsWith('.app'))
  if (!appBundle) return

  const appPath = path.join(appOutDir, appBundle)

  // 1. Strip quarantine and resource forks from everything
  run(`xattr -cr "${appPath}"`)

  // 2. Remove all existing signatures
  run(`find "${appPath}" -name "*.dylib" -exec codesign --remove-signature {} \\;`)
  run(`find "${appPath}" -name "*.app" -exec codesign --remove-signature {} \\; 2>/dev/null || true`)
  run(`codesign --remove-signature "${appPath}" 2>/dev/null || true`)

  // 3. Sign all dylibs individually (inside-out — must happen before frameworks)
  const dylibs = findFiles(appPath, '.dylib')
  for (const dylib of dylibs) {
    run(`codesign --sign - --force "${dylib}"`)
  }
  console.log(`  • signed ${dylibs.length} dylibs`)

  // 4. Sign nested .app helper bundles (deepest first)
  const helperApps = findByExt(appPath, '.app').sort((a, b) => b.length - a.length)
  for (const helper of helperApps) {
    run(`codesign --sign - --force --deep "${helper}"`)
  }
  console.log(`  • signed ${helperApps.length} helper bundles`)

  // 5. Sign the main .app bundle last
  run(`codesign --sign - --force --deep "${appPath}"`)
  console.log(`  • signed main bundle: ${appBundle}`)
}
