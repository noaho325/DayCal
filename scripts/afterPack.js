const { execSync } = require('child_process')
const { readdirSync, statSync } = require('fs')
const path = require('path')

function findExecutables(dir) {
  const results = []
  try {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry)
      try {
        const s = statSync(full)
        if (s.isDirectory()) results.push(...findExecutables(full))
        else if (s.mode & 0o111) results.push(full)
      } catch {}
    }
  } catch {}
  return results
}

exports.default = async function afterPack(context) {
  const appOutDir = context.appOutDir

  // Strip all xattrs (resource forks cause codesign to fail)
  try { execSync(`xattr -cr "${appOutDir}"`, { stdio: 'pipe' }) } catch {}

  // Remove any existing signatures
  const execs = findExecutables(appOutDir)
  for (const exe of execs) {
    try { execSync(`codesign --remove-signature "${exe}"`, { stdio: 'pipe' }) } catch {}
  }

  // Apply simple ad-hoc signature to every binary individually (no --timestamp, no --options runtime)
  for (const exe of execs) {
    try { execSync(`codesign --sign - --force "${exe}"`, { stdio: 'pipe' }) } catch {}
  }

  // Finally sign the whole .app bundle deep
  const appBundle = readdirSync(appOutDir).find(f => f.endsWith('.app'))
  if (appBundle) {
    try {
      execSync(`codesign --sign - --force --deep "${path.join(appOutDir, appBundle)}"`, { stdio: 'pipe' })
    } catch {}
  }

  console.log(`  • ad-hoc signed ${execs.length} binaries (no timestamp, no notarization)`)
}
