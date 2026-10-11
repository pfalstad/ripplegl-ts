import { defineConfig, type Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Assets directory name, relative to build.outDir. The compiled JS/CSS bundle
// and the examples/ and setuplist.txt resources all land here together
// (mirroring GWT's per-module output directory, e.g. war/ripple/) so that
// ModuleBase.ts's runtime lookup of its own script URL finds them as
// siblings. This directory can be renamed at deploy time (e.g. to a
// per-version name like ripple5/, see ../dist.sh) without touching any code,
// since nothing in the app hardcodes this name.
const assetsDir = 'ripple'

// After the normal build, copies examples/ and setuplist.txt from public/
// into dist/<assetsDir>/, instead of Vite's default publicDir copy to dist
// root, so they sit alongside the JS/CSS bundle. public/ripple/ (scripts and
// the icon referenced with hardcoded "ripple/..." paths in Ripple.html) goes
// to the same place.
function copyPublicAssets(): Plugin {
  const tsRoot = path.dirname(fileURLToPath(import.meta.url))
  const publicDir = path.join(tsRoot, 'public')
  return {
    name: 'copy-public-assets',
    apply: 'build',
    closeBundle() {
      const dist = path.join(tsRoot, 'dist')
      const nested = path.join(dist, assetsDir)
      fs.cpSync(path.join(publicDir, 'examples'), path.join(nested, 'examples'), { recursive: true })
      fs.cpSync(path.join(publicDir, 'setuplist.txt'), path.join(nested, 'setuplist.txt'))
      fs.cpSync(path.join(publicDir, 'ripple'), nested, { recursive: true })
    }
  }
}

export default defineConfig({
  base: './',
  plugins: [copyPublicAssets()],
  server: {
    port: 5175,
    open: '/Ripple.html',
    host: true
  },
  build: {
    assetsDir,
    copyPublicDir: false,
    rollupOptions: {
      input: {
        ripple: 'Ripple.html',
      }
    }
  }
})
