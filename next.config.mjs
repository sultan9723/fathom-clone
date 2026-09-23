/** @type {import('next').NextConfig} */
const nextConfig = {
  // JsonMeetingRepository reads /data/meetings at runtime via fs, which the
  // build tracer cannot follow. Without this the seed files are missing from
  // the serverless bundle on Vercel and every page 500s in production.
  outputFileTracingIncludes: {
    '/meetings': ['./data/meetings/**'],
    '/meetings/[id]': ['./data/meetings/**'],
    '/api/ask': ['./data/meetings/**'],
  },
}
export default nextConfig
