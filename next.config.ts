import createMDX from '@next/mdx'
import type { NextConfig } from 'next'

/**
 * GitHub Pages serves project sites from /<repo>, so the preview deploy needs a
 * basePath. Once marcalam.com points at Pages the path is root again, so this is
 * driven by an env var the deploy workflow sets rather than hardcoded.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  pageExtensions: ['ts', 'tsx', 'mdx'],
  images: {
    // Static export has no image server. `scripts/optimize-images.mjs` pre-builds
    // the derivatives at build time and this loader points next/image at them, so
    // we keep srcset, lazy loading and blur placeholders without a runtime.
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
    // Must stay in sync with IMAGE_WIDTHS in scripts/optimize-images.mjs — the
    // loader assumes a file exists for every width Next can ask for.
    imageSizes: [256, 384],
    deviceSizes: [640, 828, 1200, 1920, 2560],
  },
  typedRoutes: true,
}

const withMDX = createMDX({
  options: {
    // Turbopack passes plugin config to Rust, so plugins are named by string —
    // an imported function isn't serializable across that boundary.
    remarkPlugins: [['remark-gfm', {}]],
  },
})

export default withMDX(nextConfig)
