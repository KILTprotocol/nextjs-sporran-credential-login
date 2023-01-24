module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        destination: '/api/wellKnownDidConfig',
        source: '/public/.well-known/did-configuration.json',
        permanent: true,
      },
      {
        destination: '/api/wellKnownDidConfig',
        source: '/.well-known/did-configuration.json',
        permanent: true,
      },
    ]
  },
}
