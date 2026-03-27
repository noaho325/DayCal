// Custom signing: ad-hoc sign each file electron-builder asks us to sign
const { execSync } = require('child_process')

exports.default = async function sign(params) {
  const filePath = params.path || params
  if (!filePath) return
  try {
    // Strip any quarantine/xattrs first
    execSync(`xattr -cr "${filePath}"`, { stdio: 'pipe' })
  } catch {}
  try {
    execSync(`codesign --sign - --force --timestamp=none "${filePath}"`, { stdio: 'pipe' })
  } catch {}
}
