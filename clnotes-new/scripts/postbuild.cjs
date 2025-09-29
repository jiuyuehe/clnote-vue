const fs = require('fs')
const path = require('path')

const dist = path.resolve(__dirname, '..', 'dist')
const from = path.join(dist, 'index.html')
const to = path.join(dist, 'clnotes.html')

if (!fs.existsSync(dist)) {
  console.warn(`dist directory not found (${dist}), skipping rename.`)
  process.exit(0)
}

if (fs.existsSync(from)) {
  try {
    fs.renameSync(from, to)
    console.log('Renamed index.html -> clnotes.html')
  } catch (err) {
    console.error('Failed to rename index.html:', err)
    process.exit(1)
  }
} else {
  console.warn('No index.html found in dist, skipping rename.')
}
