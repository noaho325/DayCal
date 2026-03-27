#!/usr/bin/env node
// Generates public/icon-192.png and public/icon-512.png
// Uses only Node.js built-ins (zlib + fs) — no extra packages needed.

const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

function makeCRCTable() {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c
  }
  return t
}
const CRC_TABLE = makeCRCTable()
function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xFF]
  return (c ^ 0xFFFFFFFF) >>> 0
}
function u32(n) { const b = Buffer.alloc(4); b.writeUInt32BE(n, 0); return b }
function chunk(type, data) {
  const t = Buffer.from(type), c = Buffer.concat([t, data])
  return Buffer.concat([u32(data.length), t, data, u32(crc32(c))])
}

function makePNG(size, bg, fg) {
  // bg/fg = [r,g,b]. Draws a rounded-rect background + a simple calendar icon.
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = chunk('IHDR', Buffer.concat([u32(size), u32(size), Buffer.from([8, 2, 0, 0, 0])]))

  // Build raw pixel data
  const pixels = []
  const pad = Math.round(size * 0.15)
  const radius = Math.round(size * 0.22)

  for (let y = 0; y < size; y++) {
    pixels.push(0) // filter byte
    for (let x = 0; x < size; x++) {
      // Rounded rect check
      const dx = Math.max(pad - x, 0, x - (size - pad - 1))
      const dy = Math.max(pad - y, 0, y - (size - pad - 1))
      const inBg = (dx * dx + dy * dy) <= radius * radius && x >= pad && x < size - pad && y >= pad && y < size - pad

      if (inBg) {
        // Draw a simple grid pattern for the calendar icon
        const inner = Math.round(size * 0.2)
        const lx = x - inner, ly = y - inner
        const iconSize = size - inner * 2
        const cellSize = Math.round(iconSize / 5)
        const lineW = Math.max(1, Math.round(size * 0.025))

        // Header bar
        const headerH = Math.round(iconSize * 0.25)
        if (lx >= 0 && lx < iconSize && ly >= 0 && ly < headerH) {
          pixels.push(fg[0], fg[1], fg[2])
        } else if (lx >= 0 && lx < iconSize && ly >= 0 && ly < iconSize) {
          // Grid lines
          const col = lx % cellSize < lineW
          const row = (ly - headerH) % cellSize < lineW && ly > headerH
          if (col || row) {
            pixels.push(fg[0], fg[1], fg[2])
          } else {
            pixels.push(bg[0], bg[1], bg[2])
          }
        } else {
          pixels.push(bg[0], bg[1], bg[2])
        }
      } else {
        pixels.push(255, 255, 255) // white outside
      }
    }
  }

  const raw = Buffer.from(pixels)
  const compressed = zlib.deflateSync(raw)
  const idat = chunk('IDAT', compressed)
  const iend = chunk('IEND', Buffer.alloc(0))
  return Buffer.concat([sig, ihdr, idat, iend])
}

const outDir = path.join(__dirname, '..', 'public')
const blue = [59, 130, 246]
const white = [255, 255, 255]

fs.writeFileSync(path.join(outDir, 'icon-192.png'), makePNG(192, blue, white))
fs.writeFileSync(path.join(outDir, 'icon-512.png'), makePNG(512, blue, white))
console.log('✓ Icons generated: public/icon-192.png, public/icon-512.png')
