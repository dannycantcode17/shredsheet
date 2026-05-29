import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Two build modes:
//  - normal `npm run build`  -> standard dist/ for Cloudflare Pages (hashed assets, serverless functions)
//  - `npm run build:single`  -> one self-contained dist-single/index.html you can double-click to preview
const single = process.env.SINGLE === '1'

export default defineConfig({
  base: single ? './' : '/',
  plugins: [react(), ...(single ? [viteSingleFile()] : [])],
})
