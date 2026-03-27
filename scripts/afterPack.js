const { execSync } = require('child_process')
const { readdirSync, statSync } = require('fs')
const path = require('path')

function run(cmd) {
  try { execSync(cmd, { stdio: 'pipe' }) } catch {}
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

function findDirs(dir, ext) {
  const results = []
  try {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry)
      try {
        const s = statSync(full)
        if (s.isDirectory()) {
          if (full.endsWith(ext)) results.push(full)
          else results.push(...findDirs(full, ext))
        }
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

  // 1. Strip ALL quarantine and resource fork attributes
  run(`xattr -cr "${appPath}"`)

  // 2. Find and sign all dylibs first (innermost)
  const dylibs = findFiles(appPath, '.dylib')
  for (const dylib of dylibs) {
    run(`codesign --remove-signature "${dylib}"`)
    run(`codesign --sign - --force --timestamp=none "${dylib}"`)
  }
  console.log(`  • signed ${dylibs.length} dylibs`)

  // 3. Find and sign all .so files
  const soFiles = findFiles(appPath, '.so')
  for (const so of soFiles) {
    run(`codesign --remove-signature "${so}"`)
    run(`codesign --sign - --force --timestamp=none "${so}"`)
  }

  // 4. Sign helper .app bundles (deepest first)
  const helperApps = findDirs(appPath, '.app')
    .filter(a => a !== appPath)
    .sort((a, b) => b.length - a.length)
  for (const helper of helperApps) {
    run(`codesign --sign - --force --deep --timestamp=none "${helper}"`)
  }
  console.log(`  • signed ${helperApps.length} helper bundles`)

  // 5. Sign frameworks
  const frameworks = findDirs(appPath, '.framework')
    .sort((a, b) => b.length - a.length)
  for (const fw of frameworks) {
    run(`codesign --sign - --force --deep --timestamp=none "${fw}"`)
  }
  console.log(`  • signed ${frameworks.length} frameworks`)

  // 6. Sign the main .app bundle last
  run(`codesign --sign - --force --deep --timestamp=none "${appPath}"`)
  console.log(`  • signed main bundle: ${appBundle}`)

  // 7. Verify
  try {
    execSync(`codesign -v "${appPath}"`, { stdio: 'pipe' })
    console.log(`  • signature verified OK`)
  } catch (e) {
    console.log(`  • WARNING: signature verification failed`)
  }
}
