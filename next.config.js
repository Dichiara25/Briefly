/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
          {
            source: '/oauth2',
            destination: '/',
            permanent: true,
          },
        ]
      },
}

module.exports = nextConfig
