import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js'

/** @type {import('next').NextConfig} */
// The app reads everything from the FastAPI backend at request time, so no
// data files need tracing into the serverless bundle.
const nextConfig = {}
// Dev workers must not read artifacts that `next build` cleans and rewrites.
// Next 15 does not provide the newer isolatedDevBuild option.
export default function config(phase) {
  return {
    ...nextConfig,
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  }
}
