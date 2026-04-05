// Called by electron-builder as the final signing step for the main .app bundle.
// We re-sign everything from scratch in inside-out order so macOS accepts all dylibs.
const { execSync } = require('child_process')
const { readdirSync, statSync } = require('fs')
const path = require('path')

function findByExt(dir, ext) {
  const results = []
  try {
    for (const e of readdirSync(dir)) {
      const full = path.join(dir, e)
      try {
        if (statSync(full).isDirectory()) results.push(...findByExt(full, ext))
        else if (e.endsWith(ext)) results.push(full)
      } catch {}
    }
  } catch {}
  return results
}

exports.default = async function sign(configuration) {
  const appPath = configuration.path
  if (!appPath) return

  // 1. Strip quarantine / resource-fork attributes
  try { execSync(`xattr -cr "${appPath}"`, { stdio: 'pipe' }) } catch {}

  // 2. Sign every .dylib individually first (libffmpeg must be signed before its framework)
  const dylibs = findByExt(appPath, '.dylib')
  for (const f of dylibs) {
    try { execSync(`codesign --sign - --force --timestamp=none "${f}"`, { stdio: 'pipe' }) } catch {}
  }

  // 3. Sign .so files
  for (const f of findByExt(appPath, '.so')) {
    try { execSync(`codesign --sign - --force --timestamp=none "${f}"`, { stdio: 'pipe' }) } catch {}
  }

  // 4. Sign the whole bundle with --deep (covers helpers + frameworks + main executable)
  execSync(`codesign --sign - --force --deep --timestamp=none "${appPath}"`, { stdio: 'pipe' })
  console.log(`  • ad-hoc signed: ${path.basename(appPath)}`)
}
