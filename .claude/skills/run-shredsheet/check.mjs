// Parse-check changed source files with @babel/parser (jsx plugin).
// This sandbox can't run `vite build`, so this is how we validate that changed
// .js/.jsx files are syntactically sound before pushing (Cloudflare does the
// real build on the PR preview).
//
// Needs @babel/parser. Install once into a scratch dir:
//   mkdir -p /tmp/val && (cd /tmp/val && npm i @babel/parser)
//
// Usage:  node check.mjs <file.jsx> [file2.js ...]
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
function loadParser() {
  for (const c of ['@babel/parser', '/tmp/val/node_modules/@babel/parser/lib/index.js']) {
    try { return require(c) } catch { /* try next */ }
  }
  console.error('Could not load @babel/parser.\nInstall it:  mkdir -p /tmp/val && (cd /tmp/val && npm i @babel/parser)')
  process.exit(2)
}

const { parse } = loadParser()
const files = process.argv.slice(2)
if (!files.length) { console.error('usage: node check.mjs <file...>'); process.exit(2) }

let ok = true
for (const f of files) {
  try {
    parse(readFileSync(f, 'utf8'), { sourceType: 'module', plugins: ['jsx'] })
    console.log('PARSE OK   ', f)
  } catch (e) {
    ok = false
    console.error('PARSE FAIL ', f, '\n   ', e.message)
  }
}
process.exit(ok ? 0 : 1)
