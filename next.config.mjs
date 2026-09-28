import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js'

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/meetings': ['./data/meetings/**'],
    '/meetings/[id]': ['./data/meetings/**'],
    '/api/ask': ['./data/meetings/**'],
    '/search': ['./data/meetings/**'],
  },
}
// Dev workers must not read artifacts that `next build` cleans and rewrites.
// Next 15 does not provide the newer isolatedDevBuild option.
export default function config(phase) {
  return {
    ...nextConfig,
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  }
}
