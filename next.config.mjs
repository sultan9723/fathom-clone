/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/meetings': ['./data/meetings/**'],
    '/meetings/[id]': ['./data/meetings/**'],
    '/api/ask': ['./data/meetings/**'],
    '/search': ['./data/meetings/**'],
  },
}
export default nextConfig