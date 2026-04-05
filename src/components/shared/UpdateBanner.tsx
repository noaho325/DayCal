'use client'

import { useEffect, useState } from 'react'

function isElectron() {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron')
}

function isNewer(latest: string, current: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number)
  const [la, lb, lc] = parse(latest)
  const [ca, cb, cc] = parse(current)
  if (la !== ca) return la > ca
  if (lb !== cb) return lb > cb
  return lc > cc
}

export function UpdateBanner() {
  const [latestVersion, setLatestVersion] = useState<string | null>(null)

  useEffect(() => {
    if (!isElectron()) return
    const current = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0'

    fetch('https://api.github.com/repos/noaho325/daycal/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then(r => r.json())
      .then(data => {
        const tag: string = data.tag_name ?? ''
        if (tag && isNewer(tag, current)) setLatestVersion(tag)
      })
      .catch(() => {})
  }, [])

  if (!latestVersion) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 bg-blue-600 px-4 py-2 text-sm text-white">
      <span>DayCal {latestVersion} is available.</span>
      <a
        href="https://github.com/noaho325/daycal/releases/latest"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 font-semibold hover:text-blue-100"
      >
        Download now
      </a>
      <button
        onClick={() => setLatestVersion(null)}
        className="ml-2 opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
