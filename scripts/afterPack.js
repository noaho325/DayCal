// Strip extended attributes before electron-builder's signing runs.
// All actual signing is handled in scripts/sign.js.
const { execSync } = require('child_process')
const { readdirSync } = require('fs')
const path = require('path')

exports.default = async function afterPack(context) {
  const appBundle = readdirSync(context.appOutDir).find(f => f.endsWith('.app'))
  if (!appBundle) return
  const appPath = path.join(context.appOutDir, appBundle)
  try { execSync(`xattr -cr "${appPath}"`, { stdio: 'pipe' }) } catch {}
  console.log(`  • stripped xattrs from ${appBundle}`)
}
